# cgroup-aware process monitor

This README documents the setup, validation steps, and JSON schema contract for the cgroup-aware process monitor.

## Setup steps

1. Create the project folder inside the repo:
   ```bash
   mkdir -p infra/scripts/cgroup-monitor && cd infra/scripts/cgroup-monitor
   ```

2. Install the only dependency, then freeze it:
   ```bash
   # Update package index
   sudo apt update

   # Install pip for Python 3
   sudo apt install -y python3-pip

   # Verify pip3 installation
   pip3 --version

   # Install psutil
   pip3 install psutil
   If you are using a newer Ubuntu release on EC2 (22.04/24.04), you may hit the externally-managed-environment error. In that case use:

   pip3 install --break-system-packages psutil
   echo "psutil==5.9.6" > requirements.txt
   ```

3. Create both Python files from the provided source tabs:
   - `cgroup_reader.py`
   - `monitor.py`

   The reader has no dependencies beyond the Python standard library.

4. Run the monitor against the local machine:
   ```bash
   sudo python3 monitor.py 2>&1 | head -20
   ```

   Expected result: one JSON line per process every 5 seconds on standard output.

5. Set a low threshold to trigger a warning:
   ```bash
   MONITOR_THRESHOLD_MB=50 python3 monitor.py
   ```

   Expected result: browser or IDE processes should trigger alerts quickly.

6. Run the iptables script only inside a VM or Docker container, never directly on a laptop:
   ```bash
   # 1. Pull the image
   docker pull ubuntu:22.04

   # 2. Run container with the script mounted (replace /path/to with your actual path)
   docker run --rm --privileged -it -v /path/to:/scripts:ro ubuntu:22.04 bash

   # 3. Inside the container, update apt
   apt-get update

   # 4. Install iptables
   apt-get install -y iptables

   # 5. Run your script
   bash /scripts/iptables_setup.sh

   # 6. Exit the container
   exit
   ```

7. Verify that the JSON output matches the agreed contract:
   ```bash
   python3 monitor.py | python3 -c "import sys,json; [json.loads(l) for l in sys.stdin]"
   ```

   If this command exits cleanly, every output line is valid JSON.

8. Document the schema contract in this `README.md` file so later Splunk SPL queries and OTel collector configuration can reference it.

9. Commit the work:
   ```bash
   git add infra/scripts/cgroup-monitor
   git commit -m "feat(w1): cgroup-aware process monitor with JSON schema"
   ```

## JSON schema contract

Each output record is a single JSON object written as one line to stdout.

| Field name | Type | Description |
|---|---|---|
| `timestamp` | string | Event timestamp in a machine-readable format, typically ISO 8601. |
| `pid` | integer | Operating system process ID. |
| `process_name` | string | Process executable or command name. |
| `command` | string | Full command line used to start the process, when available. |
| `username` | string | User account that owns the process. |
| `rss_mb` | number | Resident memory size in megabytes. |
| `vms_mb` | number | Virtual memory size in megabytes. |
| `threshold_mb` | number | Configured warning threshold in megabytes. |
| `status` | string | Monitor status such as `OK` or `WARNING`. |
| `cgroup_path` | string | Detected cgroup path for the process. |
| `container_id` | string or null | Container identifier when the process belongs to a containerized workload. |
| `hostname` | string | Hostname of the machine where the event was generated. |

## Output rules

- Each line must be valid JSON.
- Output is line-delimited JSON (JSONL / NDJSON style).
- One record is emitted per process per polling interval.
- The default polling interval in the example flow is 5 seconds.
- `status` should switch to `WARNING` when memory usage exceeds `MONITOR_THRESHOLD_MB`.

## Validation notes

Use these checks during development:

```bash
sudo python3 monitor.py 2>&1 | head -20
MONITOR_THRESHOLD_MB=50 python3 monitor.py
python3 monitor.py | python3 -c "import sys,json; [json.loads(l) for l in sys.stdin]"
```

## Safety note

Run any iptables-related setup only in an isolated VM or privileged container. Do not run it directly on a developer laptop.