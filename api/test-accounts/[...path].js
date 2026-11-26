import { testAccountsApi } from '../../worker/test-accounts.mjs';
import { portalContext, sendWebResponse, configResponse } from '../_portal-runtime.js';

export default async function handler(req, res) {
  try {
    const context = await portalContext(req, { allowNoSession: true });
    if (context.response) return sendWebResponse(context.response, res);
    const pathname = new URL(req.url || '/', 'https://' + (req.headers.host || 'localhost')).pathname;
    if (!['/api/test-accounts/login', '/api/test-accounts/logout', '/api/test-accounts/me', '/api/test-accounts/contract'].includes(pathname)) {
      return sendWebResponse(new Response(JSON.stringify({ error: 'Ruta no encontrada.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
      }), res);
    }
    return sendWebResponse(await testAccountsApi(context.request, context.env), res);
  } catch (error) {
    return configResponse(res, error);
  }
}
