#!/usr/bin/env python3
"""Prepare a reviewed, Git-tracked source snapshot for connector-based GitHub mirroring.
No network calls or credentials. Run only after the Sites helper commits the release.
"""
import argparse, base64, json, re, subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--commit',default='HEAD');parser.add_argument('--output',required=True);args=parser.parse_args()
def git(*parts):return subprocess.check_output(['git',*parts])
root=Path(git('rev-parse','--show-toplevel').decode().strip());commit=git('rev-parse',args.commit+'^{commit}').decode().strip();tree=git('rev-parse',commit+'^{tree}').decode().strip()
if not (root/'.openai/hosting.json').is_file():raise SystemExit('Run inside the isolated web checkout.')
files=[]
for item in git('ls-tree','-r','-z',commit).split(b'\0'):
 if not item:continue
 meta,path=item.split(b'\t',1);mode,kind,sha=meta.decode().split();path=path.decode()
 if mode not in ['100644','100755'] or kind!='blob':raise SystemExit('Only regular tracked files are publishable: '+path)
 if re.search(r'(^|/)(?:\.env(?:\.|$)|\.dev\.vars|\.private-audits|\.tools|\.wrangler|node_modules|AGENTS\.md)|\.(?:xlsx?|xlsm|pem|p12|pfx|key)$|(?:payment-planning|dashboard-seed|workspace\.json)',path,re.I):raise SystemExit('Private or runtime path rejected: '+path)
 data=git('cat-file','blob',sha)
 if re.search(rb'-----BEGIN [A-Z ]*PRIVATE KEY-----|github_pat_[A-Za-z0-9]{10}|gh[pousr]_[A-Za-z0-9]{20}',data):raise SystemExit('Possible credential rejected: '+path)
 try:
  content=data.decode('utf8');binary='\0' in content
 except UnicodeDecodeError:binary=True;content=''
 files.append({'path':path,'mode':mode,'sha':sha,'binary':binary,'content':base64.b64encode(data).decode() if binary else content})
output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
payload=json.dumps({'commit':commit,'tree':tree,'files':files},ensure_ascii=True,separators=(',',':'));chunks=[payload[i:i+45000] for i in range(0,len(payload),45000)]
for i,chunk in enumerate(chunks):(output/f'chunk-{i:04}.txt').write_text(chunk)
report={'commit':commit,'tree':tree,'files':len(files),'binaryFiles':sum(f['binary'] for f in files),'chunks':len(chunks)};(output/'manifest.json').write_text(json.dumps(report));print(json.dumps(report))
