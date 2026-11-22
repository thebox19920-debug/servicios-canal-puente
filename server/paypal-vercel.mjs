import {catalog} from '../worker/catalog.mjs';
import {laneForPayment} from '../worker/lanes.mjs';

const SANDBOX_CLIENT_ID='sb';
const CURRENCY='EUR';
const allowedItems=()=>Object.fromEntries(Object.entries(catalog).filter(([id])=>laneForPayment(id)==='LP-01'));

function send(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(body));
}

export function paypalVercelHandler(req,res,route){
  if(route==='config'){
    if(req.method!=='GET')return send(res,405,{error:'Método no permitido'});
    return send(res,200,{
      enabled:true,
      clientId:SANDBOX_CLIENT_ID,
      currency:CURRENCY,
      items:allowedItems(),
      environment:'sandbox'
    });
  }

  // The public Vercel build is an academic Sandbox demo. It never reads
  // production credentials or creates/captures orders on the server.
  return send(res,410,{error:'La API de servidor está desactivada en esta demo Sandbox.'});
}
