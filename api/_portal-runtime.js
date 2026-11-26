import { Pool } from 'pg';

const PRIVATE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow'
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...PRIVATE_HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });
}

function requiredConfig() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const dbUrl = process.env.SUPABASE_DB_URL || '';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !anon || !service || !dbUrl) {
    throw new Error('Faltan SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY o SUPABASE_DB_URL.');
  }
  return { url, anon, service, dbUrl };
}

function poolFor(dbUrl) {
  if (!globalThis.__scpPortalPool) {
    globalThis.__scpPortalPool = new Pool({
      connectionString: dbUrl,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000,
      ssl: { rejectUnauthorized: false }
    });
  }
  return globalThis.__scpPortalPool;
}

function compileSql(source) {
  let sql = String(source).replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP::text');
  const ignoreConflict = /^\s*INSERT\s+OR\s+IGNORE\s+INTO\s/i.test(sql);
  sql = sql.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\s/i, 'INSERT INTO ');
  let out = '', index = 0, quote = '';
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (quote) {
      out += char;
      if (char === quote && sql[i + 1] === quote) out += sql[++i];
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"') { quote = char; out += char; continue; }
    if (char === '?') out += '$' + (++index);
    else out += char;
  }
  if (ignoreConflict && !/\bON\s+CONFLICT\b/i.test(out)) {
    const returning = out.match(/\s+RETURNING\b/i);
    if (returning) out = out.slice(0, returning.index) + ' ON CONFLICT DO NOTHING' + out.slice(returning.index);
    else out += ' ON CONFLICT DO NOTHING';
  }
  return out;
}

function postgresDb(dbUrl) {
  const pool = poolFor(dbUrl);
  const prepare = (sql) => {
    const statement = { sql: compileSql(sql), values: [] };
    const bound = {
      bind(...values) { statement.values = values; return bound; },
      async first() { const result = await pool.query(statement.sql, statement.values); return result.rows[0] || null; },
      async all() { const result = await pool.query(statement.sql, statement.values); return { results: result.rows, success: true, meta: { changes: result.rowCount || 0 } }; },
      async run() { const result = await pool.query(statement.sql, statement.values); return { success: true, meta: { changes: result.rowCount || 0 } }; }
    };
    return bound;
  };
  return {
    prepare,
    async batch(statements) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const results = [];
        for (const statement of statements) {
          const result = await client.query(statement.sql, statement.values);
          results.push({ results: result.rows, success: true, meta: { changes: result.rowCount || 0 } });
        }
        await client.query('COMMIT');
        return results;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }
  };
}

function objectPath(key) {
  return String(key).split('/').map(part => encodeURIComponent(part)).join('/');
}

function storageUrl(base, bucket, key) {
  return base + '/storage/v1/object/' + encodeURIComponent(bucket) + '/' + objectPath(key);
}

function storageHeaders(service, contentType) {
  const headers = {
    apikey: service,
    ...(contentType ? { 'Content-Type': contentType } : {})
  };
  // New sb_secret_* API keys are not JWTs and must not be sent as Bearer tokens.
  if (!service.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + service;
  return headers;
}

function privateBucket(url, service, db) {
  const bucket = process.env.SUPABASE_PORTAL_BUCKET || 'scp-portal-private';
  async function responseObject(response) {
    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      body: bytes,
      async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); },
      async text() { return bytes.toString('utf8'); },
      async json() { return JSON.parse(bytes.toString('utf8')); }
    };
  }
  async function get(key) {
    const response = await fetch(storageUrl(url, bucket, key), { headers: storageHeaders(service), cache: 'no-store' });
    if (response.ok) return responseObject(response);
    if (response.status !== 404) throw new Error('No se pudo leer el almacenamiento privado de Supabase.');
    const alias = await db.prepare('SELECT bucket_name,source_path FROM portal_storage_aliases WHERE object_key=?').bind(key).first();
    if (!alias) return null;
    const source = await fetch(storageUrl(url, alias.bucket_name, alias.source_path), { headers: storageHeaders(service), cache: 'no-store' });
    return source.ok ? responseObject(source) : null;
  }
  return {
    async get(key) { return get(key); },
    async put(key, value, options = {}) {
      const contentType = options.httpMetadata?.contentType || (typeof value === 'string' ? 'application/json; charset=utf-8' : 'application/octet-stream');
      const body = typeof value === 'string' ? value : Buffer.from(value);
      const response = await fetch(storageUrl(url, bucket, key), {
        method: 'POST',
        headers: { ...storageHeaders(service, contentType), 'x-upsert': options.onlyIf?.etagDoesNotMatch === '*' ? 'false' : 'true' },
        body
      });
      if (!response.ok) throw new Error('No se pudo guardar el archivo en el almacenamiento privado de Supabase.');
      return { key };
    },
    async delete(key) {
      const response = await fetch(url + '/storage/v1/object/' + encodeURIComponent(bucket), {
        method: 'DELETE',
        headers: storageHeaders(service, 'application/json'),
        body: JSON.stringify({ prefixes: [String(key)] })
      });
      if (!response.ok && response.status !== 404) throw new Error('No se pudo eliminar el archivo privado.');
    },
    async list({ prefix = '', limit = 1000 } = {}) {
      const pageSize = Math.min(Math.max(Number(limit) || 1000, 1), 1000);
      const response = await fetch(url + '/storage/v1/object/list/' + encodeURIComponent(bucket), {
        method: 'POST',
        headers: storageHeaders(service, 'application/json'),
        body: JSON.stringify({ prefix, limit: pageSize, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('No se pudo consultar el almacenamiento privado de Supabase.');
      const rows = await response.json();
      const objects = (Array.isArray(rows) ? rows : []).map(row => {
        const name = String(row.name || '');
        return { key: name.startsWith(prefix) ? name : prefix + name, size: row.metadata?.size || null };
      });
      return { objects, truncated: objects.length >= pageSize };
    }
  };
}

async function incomingBytes(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body) || req.body instanceof Uint8Array) return Buffer.from(req.body);
    if (typeof req.body === 'string') return Buffer.from(req.body);
    return Buffer.from(JSON.stringify(req.body));
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function webRequest(req, headers, bytes) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const url = new URL(req.url || '/', proto + '://' + host);
  const method = String(req.method || 'GET').toUpperCase();
  const requestHeaders = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (value !== undefined && value !== null) requestHeaders.set(name, Array.isArray(value) ? value.join(', ') : String(value));
  }
  requestHeaders.delete('content-length');
  requestHeaders.delete('transfer-encoding');
  requestHeaders.set('X-Robots-Tag', 'noindex, nofollow');
  return new Request(url, { method, headers: requestHeaders, ...(method === 'GET' || method === 'HEAD' ? {} : { body: bytes }) });
}

export async function portalContext(req, { allowNoSession = false } = {}) {
  let user = null, profile = null, token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!token && !allowNoSession) return { response: json(401, { authenticated: false, error: 'Inicia sesión para continuar.' }) };
  let config;
  try { config = requiredConfig(); }
  catch (error) { return { response: json(503, { error: error.message }) }; }

  if (token) {
    if (token.length > 8192) return { response: json(401, { authenticated: false, error: 'La sesión no es válida.' }) };
    try {
      const auth = await fetch(config.url + '/auth/v1/user', {
        headers: { apikey: config.anon, Authorization: 'Bearer ' + token },
        cache: 'no-store'
      });
      if (!auth.ok) return { response: json(401, { authenticated: false, error: 'La sesión no es válida. Inicia sesión de nuevo.' }) };
      user = await auth.json();
      if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) return { response: json(401, { authenticated: false, error: 'No se pudo verificar la cuenta.' }) };
      const query = new URL(config.url + '/rest/v1/profiles');
      query.searchParams.set('select', 'role,approval_status');
      query.searchParams.set('id', 'eq.' + user.id);
      query.searchParams.set('limit', '1');
      const profileResponse = await fetch(query, { headers: { apikey: config.anon, Authorization: 'Bearer ' + token, Accept: 'application/json' }, cache: 'no-store' });
      if (!profileResponse.ok) return { response: json(503, { error: 'No se pudo consultar el perfil SCP.' }) };
      profile = (await profileResponse.json())[0] || null;
    } catch {
      return { response: json(503, { error: 'No se pudo validar la sesión de Supabase.' }) };
    }
  } else if (!allowNoSession) {
    return { response: json(401, { authenticated: false, error: 'Inicia sesión para continuar.' }) };
  }

  const email = String(user?.email || '').toLowerCase();
  const configuredOwner = String(process.env.STATISTICS_OWNER_EMAIL || '').toLowerCase();
  const admin = !!user?.id && profile?.role === 'ADMIN' && profile?.approval_status === 'APPROVED' && !!configuredOwner && email === configuredOwner;
  const db = postgresDb(config.dbUrl);
  const env = {
    ...process.env,
    DB: db,
    BUCKET: privateBucket(config.url, config.service, db),
    STATISTICS_OWNER_EMAIL: admin ? configuredOwner : ''
  };
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers || {})) {
    if (value !== undefined && value !== null) headers.set(name, Array.isArray(value) ? value.join(', ') : String(value));
  }
  headers.delete('oai-authenticated-user-id');
  headers.delete('oai-authenticated-user-email');
  if (user) {
    headers.set('oai-authenticated-user-id', user.id);
    headers.set('oai-authenticated-user-email', email);
  }
  const bytes = await incomingBytes(req);
  const request = webRequest(req, headers, bytes);
  for (const [name, value] of headers.entries()) {
    if (name === 'oai-authenticated-user-id' || name === 'oai-authenticated-user-email') request.headers.set(name, value);
  }
  return { request, env, user, profile, admin, token, config };
}

export async function sendWebResponse(response, res) {
  res.statusCode = response.status;
  for (const [name, value] of response.headers.entries()) {
    if (name.toLowerCase() !== 'set-cookie') res.setHeader(name, value);
  }
  const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : response.headers.get('set-cookie');
  if (cookies) res.setHeader('Set-Cookie', cookies);
  const bytes = Buffer.from(await response.arrayBuffer());
  res.end(bytes);
}

export async function syncAdminProfile(context, email, patch) {
  const address = String(email || '').trim().toLowerCase();
  if (!context.admin || !address) throw new Error('Operación administrativa no autorizada.');
  const url = new URL(context.config.url + '/rest/v1/profiles');
  url.searchParams.set('email', 'eq.' + address);
  const headers = {
    apikey: context.config.service,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  };
  // New sb_secret_* API keys belong in apikey, not Authorization: Bearer.
  if (!context.config.service.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + context.config.service;
  const result = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch),
    cache: 'no-store'
  });
  if (!result.ok) throw new Error('No se pudo sincronizar el cambio con el perfil de Supabase.');
}

export function configResponse(res, error) {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) res.setHeader(name, value);
  res.end(JSON.stringify({ error: error?.message || 'Backend privado no disponible.' }));
}
