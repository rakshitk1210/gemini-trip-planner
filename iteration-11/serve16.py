"""Start Vite dev server for iteration-16."""
import os, subprocess, sys

# Move to iteration-16 and run Vite
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'iteration-16')
root = os.path.normpath(root)
os.chdir(root)
result = subprocess.run([os.path.join(root, 'node_modules', '.bin', 'vite'), '--port', '3016', '--host', '0.0.0.0'])
sys.exit(result.returncode)
