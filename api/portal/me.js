const headers = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow'
};

function json(res, status, data) {
  res.statusCode = status;
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Método no permitido.' });
  }

  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) || !anonKey) {
    return json(res, 503, { error: 'El acceso SCP aún no está configurado.' });
  }

  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || token.length > 8192) {
    return json(res, 401, { authenticated: false, admin: false, error: 'Inicia sesión para continuar.' });
  }

  try {
    const authResponse = await fetch(base + '/auth/v1/user', {
      headers: { apikey: anonKey, Authorization: 'Bearer ' + token },
      cache: 'no-store'
    });
    if (!authResponse.ok) {
      return json(res, 401, { authenticated: false, admin: false, error: 'La sesión no es válida. Inicia sesión de nuevo.' });
    }

    const user = await authResponse.json();
    if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) {
      return json(res, 401, { authenticated: false, admin: false, error: 'No se pudo verificar la cuenta.' });
    }

    const profileUrl = new URL(base + '/rest/v1/profiles');
    profileUrl.searchParams.set('select', 'role,approval_status');
    profileUrl.searchParams.set('id', 'eq.' + user.id);
    profileUrl.searchParams.set('limit', '1');
    const profileResponse = await fetch(profileUrl, {
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer ' + token,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!profileResponse.ok) {
      return json(res, 503, { error: 'No se pudo consultar el perfil SCP.' });
    }

    const profiles = await profileResponse.json();
    const profile = Array.isArray(profiles) ? profiles[0] : null;
    const admin = profile?.role === 'ADMIN' && profile?.approval_status === 'APPROVED';
    return json(res, 200, {
      authenticated: true,
      admin,
      user: { id: user.id, email: user.email || null }
    });
  } catch {
    return json(res, 503, { error: 'No se pudo comprobar el acceso SCP. Inténtalo de nuevo.' });
  }
}
