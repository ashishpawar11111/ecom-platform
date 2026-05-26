"""
Reads /proc/[pid]/status  — RSS, VMS
Reads /proc/[pid]/cgroup  — cgroup path (v1 and v2)
Reads /proc/[pid]/ns/     — namespace inode (mnt, pid, net)

These are the EXACT kernel interfaces containers use.
Understanding this is what makes K8s pods non-magic.
"""
import os, re
from pathlib import Path

def _read_status(pid: int) -> dict:
    """Parse /proc/[pid]/status into a dict of key→value."""
    status = {}
    try:
        with open(f"/proc/{pid}/status") as f:
            for line in f:
                k, _, v = line.partition(":")
                status[k.strip()] = v.strip()
    except (FileNotFoundError, ProcessLookupError):
        return {}
    return status

def _parse_kb(val: str) -> float:
    """'1234 kB' → MB as float."""
    m = re.match(r"(\d+)", val)
    return round(int(m.group(1)) / 1024, 1) if m else 0.0

def _read_cgroup_path(pid: int) -> str:
    """
    /proc/[pid]/cgroup format:
      cgroups v1: "10:cpuset:/docker/abc123"
      cgroups v2: "0::/system.slice/docker-abc.scope"
    We return the path component of the first line.
    """
    try:
        with open(f"/proc/{pid}/cgroup") as f:
            first = f.readline().strip()
        parts = first.split(":", 2)
        return parts[2] if len(parts) == 3 else "unknown"
    except (FileNotFoundError, ProcessLookupError):
        return "unknown"

def _read_namespace(pid: int) -> str:
    """
    /proc/[pid]/ns/mnt is a symlink: mnt:[4026531840]
    The inode number uniquely identifies the namespace.
    Processes in the same container share the same inode.
    """
    ns_path = Path(f"/proc/{pid}/ns/mnt")
    try:
        link = ns_path.resolve()
        m = re.search(r"\[(\d+)\]", str(link))
        return m.group(1) if m else "unknown"
    except (OSError, FileNotFoundError):
        return "host"

def get_processes_with_cgroups():
    """
    Yield one dict per running process.
    Skips kernel threads (no Name in status) and
    processes that vanish mid-scan (race condition is normal).
    """
    for entry in os.scandir("/proc"):
        if not entry.name.isdigit():
            continue
        pid    = int(entry.name)
        status = _read_status(pid)
        if not status or "Name" not in status:
            continue
        yield {
            "pid":        pid,
            "name":       status.get("Name", "unknown"),
            "rss_mb":     _parse_kb(status.get("VmRSS", "0 kB")),
            "vms_mb":     _parse_kb(status.get("VmSize", "0 kB")),
            "cgroup_path":_read_cgroup_path(pid),
            "namespace":  _read_namespace(pid),
        }