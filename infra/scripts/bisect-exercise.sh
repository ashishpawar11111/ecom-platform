#!/usr/bin/env bash
# Week 2: git bisect exercise
# Creates a small repo with a known bug at commit 5 of 10.
# Your job: find it using only git bisect.
set -euo pipefail

BISECT_DIR=/tmp/bisect-exercise
rm -rf "$BISECT_DIR" && mkdir "$BISECT_DIR" && cd "$BISECT_DIR"
git init && git config user.email "test@test.com" && git config user.name "Test"

# Create a simple health check function
cat > health.py << 'PYEOF'
def check_db_health(host, port):
    """Returns True if DB is reachable."""
    import socket
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        return True
    except OSError:
        return False
PYEOF

cat > test_health.py << 'PYEOF'
from health import check_db_health
def test_returns_bool():
    result = check_db_health("localhost", 9999)
    assert isinstance(result, bool), f"Expected bool, got {type(result)}"
PYEOF

# Commits 1-4: all good
for i in 1 2 3 4; do
  echo "# v$i" >> health.py
  git add -A && git commit -m "chore: update health check v$i"
done

# Commit 5: BUG INTRODUCED — function returns None instead of bool
cat > health.py << 'PYEOF'
def check_db_health(host, port):
    """Returns True if DB is reachable."""
    import socket
    try:
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        return True
    except OSError:
        pass  # BUG: missing return False — returns None
PYEOF
git add -A && git commit -m "refactor: simplify exception handler"

# Commits 6-10: bug still present
for i in 6 7 8 9 10; do
  echo "# v$i" >> health.py
  git add -A && git commit -m "chore: update health check v$i"
done

echo ""
echo "=== EXERCISE READY ==="
echo "cd $BISECT_DIR"
echo ""
echo "The test currently FAILS. Find the bad commit using bisect:"
echo "  git bisect start"
echo "  git bisect bad HEAD"
echo "  git bisect good HEAD~9   # commit 1 was good"
echo "  git bisect run python3 -m pytest test_health.py -q"
echo ""
echo "Expected answer: the commit with message 'refactor: simplify exception handler'"
echo "git bisect reset  # when done"
