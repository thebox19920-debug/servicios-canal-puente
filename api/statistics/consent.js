import { visitorConsent } from '../../worker/statistics.mjs';
import { portalContext, sendWebResponse, configResponse } from '../_portal-runtime.js';

export default async function handler(req, res) {
  try {
    const context = await portalContext(req, { allowNoSession: true });
    if (context.response) return sendWebResponse(context.response, res);
    return sendWebResponse(await visitorConsent(context.request, context.env), res);
  } catch (error) {
    return configResponse(res, error);
  }
}
