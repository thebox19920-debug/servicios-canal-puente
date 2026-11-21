import {checkoutApi} from '../../worker/lanes.mjs';

export default async function handler(req,res){
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'localhost').split(',')[0].trim();
  const protocol=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const url=new URL(req.url,`${protocol}://${host}`);
  const request=new Request(url,{method:req.method||'GET'});
  const response=await checkoutApi(request,process.env);
  res.statusCode=response.status;
  for(const [name,value] of response.headers)res.setHeader(name,value);
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.end(await response.text());
}
