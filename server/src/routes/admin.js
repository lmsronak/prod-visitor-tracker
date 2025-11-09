import { Router } from 'express';
import { pool } from '../db.js';
import { requireApiKey } from '../middleware/requireApiKey.js';


const router = Router();


router.use(requireApiKey);


// KPIs for a date range
router.get('/metrics', async (req, res) => {
const websiteId = req.websiteId;
const { from, to } = req.query;
const range = [from || '1970-01-01', to || '2999-12-31'];


const [[{ total_visits }]] = await pool.query(
`SELECT COUNT(*) AS total_visits
FROM pageviews WHERE website_id=? AND ts BETWEEN ? AND ?`, [websiteId, ...range]
);


const [[{ unique_visitors }]] = await pool.query(
`SELECT COUNT(DISTINCT visitor_id) AS unique_visitors
FROM sessions WHERE website_id=? AND started_at BETWEEN ? AND ?`, [websiteId, ...range]
);


const duplicate_visits = Math.max(total_visits - unique_visitors, 0);


const [[{ new_pages }]] = await pool.query(
`SELECT COUNT(DISTINCT url) AS new_pages
FROM pageviews WHERE website_id=? AND ts BETWEEN ? AND ?`, [websiteId, ...range]
);


res.json({ total_visits, unique_visitors, duplicate_visits, new_pages });
});


router.get('/top-pages', async (req, res) => {
const websiteId = req.websiteId;
const { limit=10, from, to } = req.query;
const range = [from || '1970-01-01', to || '2999-12-31'];


const [rows] = await pool.query(
`SELECT url, COUNT(*) AS views
FROM pageviews
WHERE website_id=? AND ts BETWEEN ? AND ?
GROUP BY url
ORDER BY views DESC
LIMIT ?`, [websiteId, ...range, Number(limit)]
);
res.json(rows);
});


router.get('/live', async (req, res) => {
  const websiteId = req.websiteId;
  const [rows] = await pool.query(
    `SELECT v.id AS visitorId,
            JSON_EXTRACT(v.device, '$.browser') AS browser,
            JSON_EXTRACT(v.device, '$.os') AS os,
            JSON_EXTRACT(v.device, '$.device') AS device,
            v.country, v.city, v.lat, v.lon,
            s.last_activity, s.landing_page
     FROM visitors v
     JOIN sessions s ON s.visitor_id=v.id
     WHERE v.website_id=? AND s.last_activity > (NOW() - INTERVAL 5 MINUTE)
     ORDER BY s.last_activity DESC LIMIT 200`,
    [websiteId]
  );
  res.json(rows);
});

// Visitors history with search/pagination
router.get('/visitors', async (req, res) => {
  const websiteId = req.websiteId;
  const { q='', page=1, limit=50 } = req.query;
  const offset = (Number(page)-1) * Number(limit);
  const params = [websiteId];
  let where = 'WHERE v.website_id=?';
  if (q) { where += ' AND v.visitor_key LIKE ?'; params.push(`%${q}%`); }

  const [rows] = await pool.query(
    `SELECT v.id AS visitorId, v.visitor_key, v.country, v.city, v.lat, v.lon,
            v.first_seen, v.last_seen,
            (SELECT COUNT(*) FROM sessions s WHERE s.visitor_id=v.id) AS sessions,
            (SELECT COUNT(*) FROM pageviews p JOIN sessions s2 ON p.session_id=s2.id WHERE s2.visitor_id=v.id) AS pageviews
     FROM visitors v
     ${where}
     ORDER BY v.last_seen DESC
     LIMIT ? OFFSET ?`, [...params, Number(limit), offset]
  );
  res.json(rows);
});


export default router;