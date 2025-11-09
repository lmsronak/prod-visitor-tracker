import { pool } from '../db.js';


export async function requireApiKey(req, res, next){
const apiKey = req.header('x-api-key');
if(!apiKey) return res.status(401).json({error:'Missing API key'});
const [rows] = await pool.query('SELECT id FROM websites WHERE api_key=?', [apiKey]);
if(!rows.length) return res.status(403).json({error:'Invalid API key'});
req.websiteId = rows[0].id;
next();
}