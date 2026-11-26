import { portalApi } from '../worker/portal.mjs';
import { portalContext, sendWebResponse, syncAdminProfile, configResponse } from './_portal-runtime.js';

export default async function handler(req, res) {
  try {
    const context = await portalContext(req);
    if (context.response) return sendWebResponse(context.response, res);

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const url = new URL(req.url || '/', proto + '://' + host);
    const path = url.searchParams.get('__scp_path') || '';
    if (!/^admin\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(path)) {
      return sendWebResponse(new Response(JSON.stringify({ error: 'Ruta de administración no disponible.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
      }), res);
    }

    const input = req.method === 'POST' && req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : null;
    const response = await portalApi(context.request, context.env, path);
    if (response.ok && path === 'admin/access' && input) {
      const status = input.action === 'approve' ? 'APPROVED' : input.action === 'deny' ? 'REJECTED' : input.action === 'block' ? 'SUSPENDED' : '';
      if (status) await syncAdminProfile(context, input.email, { approval_status: status });
    }
    if (response.ok && path === 'admin/activate' && input) {
      await syncAdminProfile(context, input.email, { role: 'ESPECIALISTA', approval_status: 'APPROVED', is_verified: true });
    }
    return sendWebResponse(response, res);
  } catch (error) {
    return configResponse(res, error);
  }
}
