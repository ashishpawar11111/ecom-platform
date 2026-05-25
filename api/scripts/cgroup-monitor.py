#!/usr/bin/env python3
"""
Week 1 Mini Project: cgroup-aware process monitor.
Reads /proc/[pid]/status + /sys/fs/cgroup for every process.
Emits structured JSON to syslog when RSS exceeds threshold.
JSON schema agreed here is reused in Phase 5 OTel log pipeline.
"""
import os, json, syslog, time, re
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────
RSS_THRESHOLD_MB   = int(os.environ.get("RSS_THRESHOLD_MB", "200"))
POLL_INTERVAL_SECS = int(os.environ.get("POLL_INTERVAL", "10"))
SYSLOG_IDENT       = "cgroup_monitor"

# ── Helpers ───────────────────────────────────────────────────
def read_proc_status(pid: int) -> dict | None:
    """Parse /proc/[pid]/status into a dict."""
    try:
        with open(f"/proc/{pid}/status") as f:
            lines = f.readlines()
    except (FileNotFoundError, PermissionError):
        return None  # process exited or no permission

    data = {}
    for line in lines:
        if ":" in line:
            k, _, v = line.partition(":")
            data[k.strip()] = v.strip()
    return data


def get_rss_mb(status: dict) -> float:
    """Extract VmRSS in MB. Returns 0.0 if not present."""
    raw = status.get("VmRSS", "0 kB")
    kb  = int(raw.split()[0])
    return round(kb / 1024, 2)


def get_cgroup(pid: int) -> str:
    """
    Read /proc/[pid]/cgroup and return the cgroup path.
    cgroup v2: single line '0::/'
    cgroup v1: multiple lines, grab the memory controller.
    """
    try:
        with open(f"/proc/{pid}/cgroup") as f:
            lines = f.readlines()
    except (FileNotFoundError, PermissionError):
        return "unknown"

    for line in lines:
        parts = line.strip().split(":", 2)
        if len(parts) == 3:
            hierarchy, controllers, path = parts
            # cgroup v2: hierarchy=0, controllers=empty
            if hierarchy == "0" and not controllers:
                return path if path != "/" else "root"
            # cgroup v1: find memory controller
            if "memory" in controllers:
                return path
    return "unknown"


def get_cgroup_memory_limit_mb(cgroup_path: str) -> float | str:
    """
    Read the memory.max file from the cgroup — this is what
    K8s sets when you define resources.limits.memory on a container.
    Returns the limit in MB, or 'unlimited'.
    """
    mem_max = f"/sys/fs/cgroup{cgroup_path}/memory.max"
    try:
        with open(mem_max) as f:
            val = f.read().strip()
        if val == "max":
            return "unlimited"
        return round(int(val) / 1024 / 1024, 2)
    except (FileNotFoundError, ValueError):
        return "unknown"


def infer_service(status: dict, cgroup: str) -> str:
    """
    Try to infer a human-readable service name.
    For containers: cgroup path contains the container ID or service name.
    For bare-metal: use the process Name field.
    """
    # K8s/Docker cgroup path pattern:
    # /kubepods/pod.../container-id or /docker/container-id
    k8s_match  = re.search(r'/kubepods/[^/]+/pod[^/]+/([a-f0-9]{12})', cgroup)
    dock_match = re.search(r'/docker/([a-f0-9]{12})', cgroup)
    if k8s_match:
        return f"k8s:{k8s_match.group(1)}"
    if dock_match:
        return f"docker:{dock_match.group(1)}"
    return status.get("Name", "unknown")


# ── Main event emitter ────────────────────────────────────────
def emit_event(pid: int, service: str, rss_mb: float,
               cgroup: str, limit_mb, threshold_mb: int):
    """
    Emit a structured JSON event to syslog.
    SCHEMA (agreed here — reused in Phase 5 Splunk SPL queries):
      pid, service, rss_mb, cgroup, limit_mb, threshold_mb,
      pct_of_limit, severity, timestamp
    """
    pct = None
    if isinstance(limit_mb, float) and limit_mb > 0:
        pct = round(rss_mb / limit_mb * 100, 1)

    severity = "critical" if (pct and pct > 90) else "warning"

    event = {
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "event_type":   "memory_threshold_exceeded",
        "severity":     severity,
        "pid":          pid,
        "service":      service,
        "rss_mb":       rss_mb,
        "limit_mb":     limit_mb,
        "pct_of_limit": pct,
        "threshold_mb": threshold_mb,
        "cgroup":       cgroup,
        "host":         os.uname().nodename,
    }
    syslog.openlog(SYSLOG_IDENT, syslog.LOG_PID, syslog.LOG_DAEMON)
    syslog.syslog(syslog.LOG_WARNING, json.dumps(event))
    syslog.closelog()
    # Also print to stdout for local dev / Docker logs
    print(json.dumps(event, indent=2))


def scan_all_processes(threshold_mb: int):
    """Walk /proc, find all numeric PIDs, check each."""
    for entry in os.scandir("/proc"):
        if not entry.name.isdigit():
            continue
        pid = int(entry.name)
        status = read_proc_status(pid)
        if not status:
            continue
        rss_mb = get_rss_mb(status)
        if rss_mb < threshold_mb:
            continue
        cgroup   = get_cgroup(pid)
        limit_mb = get_cgroup_memory_limit_mb(cgroup)
        service  = infer_service(status, cgroup)
        emit_event(pid, service, rss_mb, cgroup, limit_mb, threshold_mb)


# ── Entry point ───────────────────────────────────────────────
if __name__ == "__main__":
    print(f"[cgroup-monitor] polling every {POLL_INTERVAL_SECS}s, threshold={RSS_THRESHOLD_MB}MB")
    while True:
        scan_all_processes(RSS_THRESHOLD_MB)
        time.sleep(POLL_INTERVAL_SECS)