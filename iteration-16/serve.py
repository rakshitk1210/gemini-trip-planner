"""Run Vite dev server for iteration-16 by cd-ing to this directory first."""
import os, subprocess, sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
result = subprocess.run(['node_modules/.bin/vite', '--host', '0.0.0.0'], check=False)
sys.exit(result.returncode)
