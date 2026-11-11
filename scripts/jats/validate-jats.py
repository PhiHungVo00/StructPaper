import sys, io
from lxml import etree
dtd_path, xml_path = sys.argv[1], sys.argv[2]
dtd = etree.DTD(dtd_path)
parser = etree.XMLParser(load_dtd=False, no_network=True, resolve_entities=False)
doc = etree.parse(xml_path, parser)
ok = dtd.validate(doc)
print('VALID' if ok else 'INVALID', len(dtd.error_log), 'errors')
for e in list(dtd.error_log)[:25]:
    print(f'  line {e.line}: {e.message[:200]}')
