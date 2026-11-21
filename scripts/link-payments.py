from pathlib import Path
import re
m={'analisis-documental':'analisis','solicitudes-tramites-administrativos':'tramites','preparacion-expedientes-completos':'expedientes','acompanamiento-presencial-interpretacion':'acompanamiento','redaccion-escritos-comunicaciones':'escritos','citas-previas-asistencia-digital':'citas','coordinacion-profesionales-especializados':'coordinacion'}
for slug,item in m.items():
 for p in [Path('web/servicios')/(slug+'.html'),Path('web/servicios')/slug/'index.html']:
  if not p.exists():continue
  s=p.read_text();s=re.sub(r'<button[^>]*disabled[^>]*>Pago online pendiente de activación</button>',f'<a class="button lp-pay-link" href="/pagar.html?servicio={item}">Continuar al pago seguro →</a>',s)
  for id in ('estado-pago','pago-info'):s=re.sub(r'(<p[^>]*id="'+id+r'"[^>]*>).*?(</p>)',r'\1Revisa la modalidad y el importe antes de pagar. Para otros encargos, solicita presupuesto.\2',s,flags=re.S)
  if item=='analisis':
   s=s.replace('function update(){const extended=',"function update(){const pay=document.querySelector('.lp-pay-link');const extended=").replace('summary.textContent=extended?',"if(pay)pay.hidden=extended;summary.textContent=extended?")
  if item in ('acompanamiento','citas'):
   expression="this.value==='con'?'interpretacion':'acompanamiento'" if item=='acompanamiento' else "this.selectedIndex===1?'digital':'citas'"
   s=s.replace('</body>',"<script>document.getElementById('modalidad').addEventListener('change',function(){document.querySelector('.lp-pay-link').href='/pagar?servicio='+ ("+expression+")})</script></body>")
  p.write_text(s)
p=Path('web/assets/lexpuente-chat.js');s=p.read_text().replace('El pago online todavía está pendiente de activación. No puedo cobrar ni comprobar pagos desde este chat. Contacta con LEXPUENTE para confirmar el importe y las opciones disponibles antes de pagar.','Puedes acceder al pago seguro desde las páginas de Trámites y documentación. Revisa el servicio y el importe antes de continuar. Este chat no comprueba pagos ni confirma reservas. Para otros encargos, solicita presupuesto.');p.write_text(s)
Path('web/conectar-paypal.html').write_text('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Conexión preparada · LEXPUENTE</title><p>Los datos de conexión ya están configurados. No introduzcas claves aquí.</p><a href="/">Volver a LEXPUENTE</a></html>')
