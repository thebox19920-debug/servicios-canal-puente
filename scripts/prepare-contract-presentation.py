import json,base64,html,gzip,xml.etree.ElementTree as E
from pathlib import Path
N={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{'+N['w']+'}'
def val(node,path,default=''):
 e=node.find(path,N);return e.get(W+'val',default) if e is not None else default
def paragraph(p):
 css=['margin:0 0 10px','line-height:1.45']
 align=val(p,'w:pPr/w:jc');css+=['text-align:'+{'both':'justify'}.get(align,align)] if align else []
 bottom=p.find('w:pPr/w:pBdr/w:bottom',N)
 if bottom is not None:css.append('border-bottom:2px solid #'+bottom.get(W+'color','6B1D2F'));css.append('padding-bottom:8px')
 content=''
 for r in p.findall('w:r',N):
  st=[]
  if r.find('w:rPr/w:b',N) is not None:st.append('font-weight:700')
  if r.find('w:rPr/w:i',N) is not None:st.append('font-style:italic')
  color=val(r,'w:rPr/w:color');size=val(r,'w:rPr/w:sz')
  if color and color!='auto':st.append('color:#'+color)
  if size:st.append('font-size:'+str(int(size)/2)+'pt')
  text=''.join(html.escape(t.text or '') for t in r.findall('w:t',N))
  content+='<span style="'+';'.join(st)+'">'+text+'</span>'
 return '<p style="'+';'.join(css)+'">'+(content or '&nbsp;')+'</p>'
def table(t):
 rows=[]
 for row in t.findall('w:tr',N):
  cells=[]
  for c in row.findall('w:tc',N):
   fill=val(c,'w:tcPr/w:shd')
   shade=c.find('w:tcPr/w:shd',N)
   css='border:1px solid #b5aa94;padding:8px;vertical-align:top;'
   if shade is not None and shade.get(W+'fill') not in [None,'auto']:css+='background:#'+shade.get(W+'fill')+';'
   cells.append('<td style="'+css+'">'+''.join(paragraph(p) for p in c.findall('w:p',N))+'</td>')
  rows.append('<tr>'+''.join(cells)+'</tr>')
 return '<table style="border-collapse:collapse;width:100%;table-layout:fixed;margin:14px 0">'+''.join(rows)+'</table>'
templates=json.loads(Path('config/contract-templates.json').read_text())
for k,v in templates.items():
 root=E.fromstring(base64.b64decode(next(e['base64'] for e in v['entries'] if e['name']=='word/document.xml')))
 body=root.find('w:body',N)
 v['html']='<article class="lp-contract-paper">'+''.join(paragraph(e) if e.tag==W+'p' else table(e) if e.tag==W+'tbl' else '' for e in body)+'</article>'
Path('config/contract-templates.json').write_text(json.dumps(templates,ensure_ascii=False))
Path('web/assets/lexpuente-official-contracts.js').write_text('window.lexpuenteOfficialContracts='+json.dumps({k:{'version':v['version'],'text':v['text'],'html':v['html']} for k,v in templates.items()},ensure_ascii=False)+';')
packs=json.dumps({k:{'version':v['version'],'entries':v['entries']} for k,v in templates.items()},ensure_ascii=False).encode()
Path('web/assets/lexpuente-contract-packs.json.gz').write_bytes(gzip.compress(packs,mtime=0))
Path('web/assets/lexpuente-contract-packs.js').write_text("window.lexpuenteContractPacksReady=(async()=>{const r=await fetch('/assets/lexpuente-contract-packs.json.gz');if(!r.ok)throw Error('No se pudieron cargar las plantillas originales.');const data=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();window.lexpuenteContractPacks=data;return data})().catch(()=>null);")
