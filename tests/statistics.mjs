import {adminUnlock} from '../worker/admin-access.mjs';
import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';
import {statisticsApi,recordStatsView,visitorConsent,statsDay} from '../worker/statistics.mjs';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0001_site_pageviews.sql','utf8'));sql.exec(fs.readFileSync('drizzle/0003_admin_access.sql','utf8'));
const DB={prepare(query){let params=[];const obj={bind(...p){params=p;return obj},async run(){return sql.prepare(query).run(...params)},async all(){return {results:sql.prepare(query).all(...params)}},async first(){return sql.prepare(query).get(...params)||null}};return obj},async batch(stmts){return Promise.all(stmts.map(s=>s.all()))}};
const env={DB,STATISTICS_OWNER_EMAIL:'owner@example.test',ADMIN_CODE_HASH:[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('11112222')))].map(b=>b.toString(16).padStart(2,'0')).join(''),ADMIN_SESSION_SECRET:'test-only-session-secret-at-least-thirty-two-characters'};
const owner={'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'},req=(path,headers={})=>new Request('https://lex.test'+path,{headers:{'User-Agent':'Mozilla/5.0',...headers}});
assert.equal((await statisticsApi(req('/api/statistics'),env)).status,401);assert.equal((await statisticsApi(req('/api/statistics',{'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@test.test'}),env)).status,403);assert.equal((await statisticsApi(req('/api/statistics',owner),env)).status,423);
const unlock=await adminUnlock(new Request('https://lex.test/api/portal/admin/unlock',{method:'POST',headers:owner,body:JSON.stringify({code:'11112222'})}),env);owner.Cookie=unlock.headers.get('Set-Cookie').split(';')[0];
await recordStatsView(req('/index.html'),env,'/index.html');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM site_pageviews').get().n,0);
const consent=(accept=true,h={})=>visitorConsent(new Request('https://lex.test/api/statistics/consent',{method:'POST',headers:{Origin:'https://lex.test','Content-Type':'application/json','User-Agent':'Mozilla/5.0',...h},body:JSON.stringify({consent:accept})}),env);
const accepted=await consent(),cookie=accepted.headers.get('Set-Cookie').split(';')[0];assert(cookie.startsWith('lp_visitor='));
for(const path of ['/index.html','/tienda.html','/agenda.html'])await recordStatsView(req(path,{Cookie:cookie}),env,path);
let d=await(await statisticsApi(req('/api/statistics',owner),env)).json();assert.equal(d.today,1);assert.equal(d.week,1);assert.equal(d.month,1);assert.equal(d.year,1);assert.equal(d.metric,'unique_visitors');
await consent(true,{Cookie:cookie});assert.equal((await(await statisticsApi(req('/api/statistics',owner),env)).json()).today,1);
await consent();assert.equal((await(await statisticsApi(req('/api/statistics',owner),env)).json()).today,2);
await recordStatsView(req('/index.html',{...owner,Cookie:cookie}),env,'/index.html');await recordStatsView(req('/index.html',{Cookie:cookie+'; lp_exclude_visits=1'}),env,'/index.html');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM site_pageviews').get().n,2);
await consent(true,owner);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM site_pageviews').get().n,2);
assert((await consent(false)).headers.get('Set-Cookie').includes('Max-Age=0'));
// Old pageview rows do not masquerade as visitors.
sql.prepare('INSERT INTO site_pageviews VALUES (?,?,?)').run(statsDay(),'/index.html',999);assert.equal((await(await statisticsApi(req('/api/statistics',owner),env)).json()).today,2);
// Periods count each visitor once even when they appear on multiple dates.
sql.prepare('INSERT INTO site_pageviews VALUES (?,?,?)').run('2026-03-02','visitor:test-a',1);sql.prepare('INSERT INTO site_pageviews VALUES (?,?,?)').run('2026-03-03','visitor:test-a',1);sql.prepare('INSERT INTO site_pageviews VALUES (?,?,?)').run('2026-02-15','visitor:test-b',1);
d=await(await statisticsApi(req('/api/statistics',owner),env,Date.parse('2026-03-03T12:00:00Z'))).json();assert.equal(d.today,1);assert.equal(d.week,1);assert.equal(d.month,1);assert.equal(d.year,2);
console.log('OK: consentimiento, visitantes únicos por periodo, navegación sin duplicados, exclusión de propietaria y pruebas anteriores, acceso privado.');
