from __future__ import annotations

import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
NODE = Path(
    "/Users/aliceevr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
)
NODE_MODULES = Path(
    "/Users/aliceevr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
)

env = os.environ.copy()
env["NODE_PATH"] = str(NODE_MODULES)

result = subprocess.run(
    [str(NODE), str(ROOT / "responsive_smoke.mjs")],
    cwd=ROOT,
    env=env,
)
raise SystemExit(result.returncode)
