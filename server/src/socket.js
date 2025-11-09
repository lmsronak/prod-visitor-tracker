import { Server } from 'socket.io';
import { pool } from './db.js';


export function initSocket(httpServer){
const io = new Server(httpServer, { cors: { origin: '*' } });


io.on('connection', (socket) => {
socket.on('join', async ({ apiKey }) => {
// verify apiKey → website id
const [rows] = await pool.query('SELECT id FROM websites WHERE api_key=?', [apiKey]);
if(!rows.length){ socket.emit('error', 'invalid_api_key'); return; }
const websiteId = rows[0].id;
socket.join(websiteId);
socket.emit('joined', { websiteId });
});
});


return io;
}