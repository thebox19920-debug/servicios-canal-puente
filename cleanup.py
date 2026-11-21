from pathlib import Path
from lxml import html, etree
import re
root=Path(__file__).parent/'dist'
areas=[('Trámites y documentación','tramites'),('Sanidad, pacientes y clínicas','sanidad'),('Vivienda y soluciones inmobiliarias','vivienda'),('Bienestar y acompañamiento','bienestar'),('LEXPUENTE COMUNICA','comunica'),('LEXPUENTE ACADEMIA','academia'),('Protección animal','animales')]
def link(label,path):return f'<a href="/{path}">{label}</a>'
nav='<header class="lp-unified-header"><a class="lp-unified-brand" href="/index.html">LEXPUENTE</a><nav aria-label="Navegación principal">'+link('Inicio','index.html')+'<details><summary>Conoce LEXPUENTE</summary><div>'+''.join(link(t,p+'.html') for t,p in [('Introducción','introduccion'),('Presentación del proyecto','presentacion'),('Quiénes somos','quienes-somos'),('Nuestro valor','nuestro-valor')])+'</div></details><details><summary>Áreas de actividad</summary><div>'+link('Todas las áreas','areas-de-actividad.html')+''.join(link(t,'areas/'+p+'.html') for t,p in areas)+'</div></details>'+''.join(link(t,p+'.html') for t,p in [('Servicios','servicios'),('Tienda','tienda'),('Asociación','asociacion'),('Agenda','agenda'),('Contacto','contacto')])+'</nav></header>'
footer='<footer class="lp-unified-footer"><strong>LEXPUENTE</strong><span>Barcelona</span><a href="/contacto.html">Contacto</a><a href="tel:+34673735059">673 735 059</a><a href="https://wa.me/34673735059">WhatsApp</a></footer>'
css='''.lp-unified-header{position:relative!important;z-index:30;background:#103428!important;border-bottom:1px solid #f2c56d;padding:18px 24px!important;color:#ffdb88!important;display:block!important}.lp-unified-brand{font-family:Georgia,serif;font-size:27px!important;font-weight:bold;letter-spacing:.08em;color:#ffdb88!important;text-decoration:none}.lp-unified-header nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px;margin-top:12px}.lp-unified-header nav>a,.lp-unified-header summary{color:#ffdb88!important;font:600 14px Arial,sans-serif;display:block;padding:9px 6px;cursor:pointer;text-decoration:none}.lp-unified-header details{position:relative}.lp-unified-header details>div{position:absolute;top:100%;left:0;min-width:260px;max-width:85vw;padding:12px;background:#103428;border:1px solid #f2c56d;border-radius:10px;box-shadow:0 8px 20px #0005;z-index:40}.lp-unified-header details>div>a{display:block;padding:8px;color:#ffdb88;text-decoration:none;font:14px Arial,sans-serif}.lp-unified-header a:hover,.lp-unified-header summary:hover{background:#63172a}.lp-unified-header details:not([open])>div{display:none}.lp-unified-footer{background:#103428!important;color:#ffdb88!important;border-top:1px solid #f2c56d;padding:25px!important;display:flex!important;justify-content:center;align-items:center;flex-wrap:wrap;gap:12px 22px;font:14px Arial,sans-serif}.lp-unified-footer a{color:#ffdb88!important}.lp-coming-soon{padding:30px;border:1px solid #f2c56d;border-radius:12px;background:#103428;color:#ffdb88}.lp-coming-soon h2{color:#ffdb88}@media(max-width:600px){.lp-unified-header{padding:15px!important}.lp-unified-header nav{gap:3px 9px}.lp-unified-header details>div{left:-20px}.lp-unified-footer{gap:12px}}'''
repls={'Traducciones en revisión · aún no disponibles':'Otros idiomas · Próximamente','Sitio web de demostración · Español / العربية':'','Verde royal · Granate royal · Dorado':'','Catálogos en desarrollo':'','Catálogo orientativo · tarifas pendientes de aprobación':'Próximamente','Tarifa: pendiente de definir':'Próximamente','Pago online pendiente de activación':'Pago online · Próximamente','El pago online de este servicio todavía no está disponible. No se realizará ningún cargo.':'Pago online: próximamente. Puedes solicitar información y presupuesto por WhatsApp. No se realizará ningún cargo.','Las descripciones son propuestas en desarrollo; precios, disponibilidad y condiciones se confirmarán antes de ofrecer cada servicio.':'Consulta la disponibilidad y el presupuesto antes de contratar.','Proyecto en desarrollo':'Próximamente','Los precios antiguos que aún aparecen en algunos catálogos son simulaciones, no ofertas definitivas.':'Consulta la disponibilidad y el presupuesto de cada servicio.'}
count=0
for f in list(root.rglob('*.html')):
 if f.name=='index.html' and f.parent!=root:continue
 s=f.read_text()
 for a,b in repls.items():s=s.replace(a,b)
 doc=html.document_fromstring(s)
 for n in doc.xpath('//header|//nav|//footer'):
  if n.getparent() is not None:n.getparent().remove(n)
 body=doc.find('body');body.insert(0,html.fragment_fromstring(nav));body.append(html.fragment_fromstring(footer))
 style=etree.Element('style');style.text=css;doc.find('head').append(style)
 # Do not turn unconfirmed example prices into public offers.
 if f.name=='tienda.html':
  for main in doc.xpath('//main'):
   main.clear();main.append(html.fragment_fromstring('<section class="lp-coming-soon"><h1>Tienda LEXPUENTE</h1><h2>Próximamente</h2><p>Estamos preparando nuestra selección de productos. Contacta con LEXPUENTE para más información.</p><a href="/contacto.html">Contactar</a></section>'))
 for section in list(doc.xpath('//section')):
  if re.search('simula|demostrativ|precio ilustrativo|catálogo de ejemplo',section.text_content(),re.I):
   section.clear();section.set('class','lp-coming-soon');section.append(html.fragment_fromstring('<div><h2>Próximamente</h2><p>Consulta con LEXPUENTE las opciones y condiciones disponibles.</p></div>'))
 for el in doc.xpath('//*[not(self::script) and not(self::style)]'):
  if el.text and re.search('simula|sitio web de demostración|catálogo no disponible|aún no disponibles|verde royal',el.text,re.I):el.text='Próximamente'
 # Preserve a useful contact action rather than a demo-only form.
 if f.name=='contacto.html':
  form=doc.xpath('//form')[0];form.attrib.pop('onsubmit',None);form.set('id','lex-contact-form')
  fields=form.xpath('.//input|.//textarea')
  for el,ident in zip(fields,['lex-contact-name','lex-contact-email','lex-contact-message']):el.set('id',ident)
  for p in doc.xpath('//p[contains(@class,"notice")]'):
   p.attrib.clear();p.set('class','notice');p.text='Se abrirá WhatsApp con tu consulta para que la revises y la envíes. Evita incluir información sensible en este primer mensaje.'
  sc=etree.Element('script');sc.text="document.getElementById('lex-contact-form').addEventListener('submit',function(e){e.preventDefault();if(!this.reportValidity())return;const text=['Hola, LEXPUENTE.','Nombre: '+document.getElementById('lex-contact-name').value,'Correo: '+document.getElementById('lex-contact-email').value,'Consulta: '+document.getElementById('lex-contact-message').value].join('\\n');window.location.href='https://wa.me/34673735059?text='+encodeURIComponent(text);});";body.append(sc)
 # Menus/footers have no translation replacement attributes.
 f.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode',method='html'));count+=1
 # Refresh extensionless route copy with its correct base directory.
 if f.name!='index.html':
  dest=f.with_suffix('')/'index.html';doc.find('head').insert(0,etree.Element('base',href='/'+str(f.parent.relative_to(root)).replace('.','').strip('/')+'/'));dest.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode',method='html'))
print('Updated pages:',count)
