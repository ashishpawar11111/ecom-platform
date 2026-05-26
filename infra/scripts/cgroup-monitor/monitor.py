#!/usr/bin/env python3
"""
Week 1 mini project: cgroup-aware process monitor.
Emits structured JSON logs — schema used by Splunk (W25) and OTel (W27).
"""
import json, time, logging, sys, os
from datetime import datetime, timezone
from cgroup_reader import get_processes_with_cgroups

THRESHOLD_MB   = int(os.getenv("MONITOR_THRESHOLD_MB", 400))
INTERVAL_SEC   = int(os.getenv("MONITOR_INTERVAL_SEC",  5))
LOG_FILE       = os.getenv("MONITOR_LOG_FILE", "/var/log/cgroup-monitor.log")

# ── Structured JSON formatter ──────────────────────────────
class JSONFormatter(logging.Formatter):
    def format(self, record):
        # Base log structure — matches OTel log schema (Week 27)
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level":     record.levelname,
            "service":   "cgroup-monitor",
            "message":   record.getMessage(),
        }
        if hasattr(record, "extra"):
            log.update(record.extra)
        return json.dumps(log)

def setup_logger():
    logger = logging.getLogger("cgroup-monitor")
    logger.setLevel(logging.DEBUG)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(JSONFormatter())
    logger.addHandler(sh)
    try:
        fh = logging.FileHandler(LOG_FILE)
        fh.setFormatter(JSONFormatter())
        logger.addHandler(fh)
    except PermissionError:
        logger.warning("Cannot write to %s — stdout only", LOG_FILE)
    return logger

def emit(logger, proc):
    """Emit one structured log event per process."""
    level   = logging.WARNING if proc["rss_mb"] > THRESHOLD_MB else logging.INFO
    record  = logging.LogRecord(
        name="cgroup-monitor", level=level,
        pathname="", lineno=0,
        msg=f"process_rss_{'alert' if level == logging.WARNING else 'ok'}",
        args=(), exc_info=None
    )
    record.extra = {
        "pid":        proc["pid"],
        "name":       proc["name"],
        "rss_mb":     proc["rss_mb"],
        "vms_mb":     proc["vms_mb"],
        "cgroup_path":proc["cgroup_path"],
        "namespace":  proc["namespace"],
        "alert":      level == logging.WARNING,
    }
    logger.handle(record)

def main():
    logger = setup_logger()
    logger.info(f"Starting — threshold={THRESHOLD_MB}MB interval={INTERVAL_SEC}s")
    while True:
        for proc in get_processes_with_cgroups():
            emit(logger, proc)
        time.sleep(INTERVAL_SEC)

if __name__ == "__main__":
    main()