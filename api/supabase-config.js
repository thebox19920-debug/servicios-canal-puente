export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || '';
  const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
  if (!validUrl || !key) {
    res.statusCode = 503;
    res.end('window.SCP_SUPABASE_CONFIG = {};');
    return;
  }

  res.statusCode = 200;
  res.end('window.SCP_SUPABASE_CONFIG = ' + JSON.stringify({
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: key
  }) + ';');
}
