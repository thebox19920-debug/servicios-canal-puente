import { portalApi } from '../../worker/portal.mjs';
import { portalContext, sendWebResponse, syncAdminProfile, configResponse } from '../_portal-runtime.js';

export default async function handler(req, res) {
  let context;
  try {
    context = await portalContext(req);
    if (context.response) return sendWebResponse(context.response, res);
    const pathname = new URL(req.url || '/', 'https://' + (req.headers.host || 'localhost')).pathname;
    const path = pathname.slice('/api/portal/'.length);
    if (path.startsWith('admin/') && !context.admin) {
      return sendWebResponse(new Response(JSON.stringify({ error: 'Solo la administradora puede realizar esta acción.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
      }), res);
    }
    const input = req.method === 'POST' && req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : null;
    const response = await portalApi(context.request, context.env);
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
