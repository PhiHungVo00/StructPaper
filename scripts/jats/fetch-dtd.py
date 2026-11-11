import re, sys, os, urllib.request
base = 'https://jats.nlm.nih.gov/archiving/1.2/'
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
seen, queue = set(), ['JATS-archivearticle1-mathml3.dtd']
while queue:
    name = queue.pop()
    if name in seen:
        continue
    seen.add(name)
    try:
        data = urllib.request.urlopen(base + name, timeout=60).read()
    except Exception as e:
        print('FAIL', name, e)
        continue
    open(os.path.join(out, name), 'wb').write(data)
    text = data.decode('utf8', 'replace')
    for m in re.findall(r'["\']([A-Za-z0-9_\-\.]+\.(?:ent|dtd|mod))["\']', text):
        if m not in seen:
            queue.append(m)
print(len(seen), 'files', sorted(seen)[:40])
