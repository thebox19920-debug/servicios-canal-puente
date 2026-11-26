import { portalApi } from '../../worker/portal.mjs';
import { portalContext, sendWebResponse, configResponse } from '../_portal-runtime.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.end(JSON.stringify({ error: 'Método no permitido.' }));
  }
  try {
    const context = await portalContext(req);
    if (context.response) return sendWebResponse(context.response, res);
    return sendWebResponse(await portalApi(context.request, context.env), res);
  } catch (error) {
    return configResponse(res, error);
  }
}
