import re
import sys
from pathlib import Path

plan = Path(sys.argv[1]).read_text(encoding="utf-8")
n = sys.argv[2]
out = Path(sys.argv[3])
out.parent.mkdir(parents=True, exist_ok=True)
infence = False
intask = False
buf: list[str] = []
for line in plan.splitlines(keepends=True):
    if line.startswith("```"):
        infence = not infence
    if (not infence) and re.match(r"^#+[ \t]+Task[ \t]+\d+", line):
        intask = bool(re.match(rf"^#+[ \t]+Task[ \t]+{n}([^0-9]|$)", line))
    if intask:
        buf.append(line)
if not buf:
    raise SystemExit(f"task {n} not found")
out.write_text("".join(buf), encoding="utf-8")
print(f"wrote {out}: {len(buf)} lines")
