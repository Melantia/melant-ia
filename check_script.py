import re
import pathlib
import tempfile
import subprocess
import sys

path = pathlib.Path('index.html')
text = path.read_text(encoding='utf-8')
match = re.search(r'<script>(.*)</script>', text, re.S)
if not match:
    sys.exit('No script')
js = match.group(1)
with tempfile.NamedTemporaryFile('w', delete=False, suffix='.js', encoding='utf-8') as f:
    f.write(js)
    f_name = f.name
proc = subprocess.run(['node', '--check', f_name], capture_output=True, text=True)
print(proc.returncode)
print(proc.stdout)
print(proc.stderr)
