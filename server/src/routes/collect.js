import { Router } from 'express';
import { pool } from '../db.js';
import { parseUA } from '../util/ua.js';
import { fp } from '../util/fingerprint.js';
import { isExpired } from '../util/session.js';
import geoip from 'geoip-lite';


const router = Router();


// Helper: fetch or create visitor & session
async function upsertVisitorAndSession(websiteId, req, payload){
const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '').trim();
const ua = req.headers['user-agent'] || '';
const acceptLang = req.headers['accept-language'] || '';
const visitorKey = payload.visitorKey || fp({ ip, ua, acceptLang });
const device = parseUA(ua);


 // Geo lookup
  let country = null, city = null, lat = null, lon = null;
  try {
    const g = geoip.lookup(ip);
    if (g) {
      country = g.country || null;
      city    = g.city || null;
      if (g.ll) { lat = g.ll[0]; lon = g.ll[1]; }
    }
  } catch (_) {}


const now = new Date();
await pool.query(
`INSERT INTO visitors (website_id, visitor_key, first_seen, last_seen, ip, user_agent, device)
VALUES (?, ?, ?, ?, INET6_ATON(?), ?, JSON_OBJECT('browser', ?, 'os', ?, 'device', ?))
ON DUPLICATE KEY UPDATE last_seen=VALUES(last_seen), user_agent=VALUES(user_agent), device=VALUES(device)`,
[websiteId, visitorKey, now, now, ip, ua, device.browser, device.os, device.device]
);


const [[v]] = await pool.query('SELECT id FROM visitors WHERE website_id=? AND visitor_key=?', [websiteId, visitorKey]);


// session: if existing and active → reuse; else new
let sessionId = null;
const [sRows] = await pool.query(
'SELECT id, last_activity FROM sessions WHERE website_id=? AND visitor_id=? ORDER BY id DESC LIMIT 1',
[websiteId, v.id]
);
if (sRows.length && !isExpired(sRows[0].last_activity)) {
sessionId = sRows[0].id;
await pool.query('UPDATE sessions SET last_activity=? WHERE id=?', [now, sessionId]);
} else {
const [res] = await pool.query(
'INSERT INTO sessions (website_id, visitor_id, started_at, last_activity, landing_page, referrer) VALUES (?, ?, ?, ?, ?, ?)',
[websiteId, v.id, now, now, payload.url || '', payload.referrer || '']
);
sessionId = res.insertId;
}


return { visitorId: v.id, sessionId };
}


router.post('/collect', async (req, res) => {
try{
const { websiteId, type, url, title, referrer, meta, visitorKey } = req.body || {};
if(!websiteId || !type) return res.status(400).json({error:'websiteId and type are required'});


const { sessionId, visitorId } = await upsertVisitorAndSession(websiteId, req, { url, referrer, visitorKey });
const now = new Date();
//req.io.to(websiteId).emit('presence', { visitorId, last_activity: now.toISOString() });

req.io.to(websiteId).emit('presence', {
  visitorId,
  last_activity: now.toISOString()
});

req.io.to(websiteId).emit('event', {
  visitorId,
  type,
  url,
  title,
  referrer,
  ts: now.toISOString()
});

if(type === 'pageview'){
await pool.query(
'INSERT INTO pageviews (website_id, session_id, url, title, referrer, ts) VALUES (?, ?, ?, ?, ?, ?)',
[websiteId, sessionId, url || '', title || null, referrer || null, now]
);
}


await pool.query(
'INSERT INTO events (website_id, session_id, type, url, meta, ts) VALUES (?, ?, ?, ?, ?, ?)',
[websiteId, sessionId, type, url || '', meta? JSON.stringify(meta): null, now]
);


// Live broadcast via Socket.IO (room = websiteId)
req.io.to(websiteId).emit('event', { type, url, title, referrer, ts: now.toISOString() });


res.json({ ok: true });
}catch(e){
console.error(e);
res.status(500).json({error:'server_error'});
}
});


export default router;