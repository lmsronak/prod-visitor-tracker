import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { pool } from './db.js';
import collectRoute from './routes/collect.js';
import adminRoute from './routes/admin.js';
import { initSocket } from './socket.js';
import path from 'path';
import fs from 'fs';


dotenv.config();


const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: '200kb' }));


const server = http.createServer(app);
const io = initSocket(server);


// attach io to req for broadcasts
app.use((req,res,next)=>{ req.io = io; next(); });


// serve collector SDK
app.get('/tracker.js', (req,res)=>{
const p = path.join(process.cwd(), '..', 'collector', 'tracker.js');
res.setHeader('Content-Type', 'application/javascript');
res.send(fs.readFileSync(p, 'utf8'));
});


// routes
app.use('/api', collectRoute);
app.use('/api/admin', adminRoute);


const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
console.log('Server listening on', PORT);
// seed example website
const [rows] = await pool.query('SELECT COUNT(*) AS c FROM websites');
if(rows[0].c===0){
const { v4: uuidv4 } = await import('uuid');
const id = uuidv4();
const apiKey = uuidv4();
await pool.query('INSERT INTO websites (id, name, host, api_key) VALUES (?,?,?,?)', [id,'Demo Site','localhost',apiKey]);
console.log('Seeded website. ID:', id, 'API Key:', apiKey);
}
});