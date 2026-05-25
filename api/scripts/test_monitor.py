import pytest, json, os, tempfile, sys
sys.path.insert(0, os.path.dirname(__file__))
from cgroup_monitor import (
    read_proc_status, get_rss_mb, get_cgroup,
    infer_service, get_cgroup_memory_limit_mb
)

# ── Fixtures ─────────────────────────────────────────────────
STATUS_FIXTURE = """\
Name:\tnode
VmRSS:\t230000 kB
VmPeak:\t512000 kB
Threads:\t8
"""

CGROUP_V2_FIXTURE = "0::/user.slice/user-1000.slice/session-3.scope\n"
CGROUP_DOCKER     = "0::/docker/3f9a21b4c082e1d9abc\n"
CGROUP_K8S        = "0::/kubepods/besteffort/pod12abc/cri-containerd-abc123def\n"

# ── Tests ─────────────────────────────────────────────────────
def test_get_rss_mb_correct():
    status = read_proc_status_from_str(STATUS_FIXTURE)
    assert get_rss_mb(status) == pytest.approx(224.6, abs=0.1)

def test_get_rss_mb_missing_field():
    assert get_rss_mb({}) == 0.0

def test_cgroup_v2_path_parsed(tmp_path):
    f = tmp_path / "cgroup"
    f.write_text(CGROUP_V2_FIXTURE)
    result = get_cgroup_from_file(str(f))
    assert result == "/user.slice/user-1000.slice/session-3.scope"

def test_infer_service_docker():
    status = {"Name": "node"}
    svc = infer_service(status, CGROUP_DOCKER.strip())
    assert svc.startswith("docker:")

def test_infer_service_k8s():
    status = {"Name": "node"}
    svc = infer_service(status, CGROUP_K8S.strip())
    assert svc.startswith("k8s:")

def test_infer_service_bare_metal():
    status = {"Name": "nginx"}
    svc = infer_service(status, "/system.slice/nginx.service")
    assert svc == "nginx"

def test_memory_limit_unlimited(tmp_path):
    mem = tmp_path / "memory.max"
    mem.write_text("max\n")
    assert get_limit_from_file(str(mem)) == "unlimited"

def test_memory_limit_bytes(tmp_path):
    mem = tmp_path / "memory.max"
    mem.write_text("536870912\n")   # 512 MB in bytes
    assert get_limit_from_file(str(mem)) == pytest.approx(512.0, abs=0.1)