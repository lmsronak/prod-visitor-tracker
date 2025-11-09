import React from 'react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getLive } from '../api';


export default function LiveVisitors(){
const [rows, setRows] = useState([]);


useEffect(()=>{ (async()=>{ setRows(await getLive()); })(); },[]);


useEffect(()=>{
const socket = io(import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:8080');
socket.emit('join', { apiKey: import.meta.env.VITE_API_KEY });
socket.on('event', async ()=>{ setRows(await getLive()); });
return ()=> socket.close();
},[]);


return (
<div className="card">
<h3 style={{marginTop:0}}>Live Visitors (last 5 min)</h3>
<table className="table">
<thead>
<tr><th>Visitor</th><th>Country</th><th>City</th><th>Device</th><th>Browser</th><th>OS</th><th>Last Activity</th><th>Landing</th></tr>
</thead>
<tbody>
{rows.map((r,i)=> (
<tr key={i}>
<td>#{r.visitorId}</td><td>{r.country||'-'}</td><td>{r.city||'-'}</td>
<td>{JSON.parse(r.device||'"desktop"').replaceAll('"','')}</td>
<td>{JSON.parse(r.browser||'"?"').replaceAll('"','')}</td>
<td>{JSON.parse(r.os||'"?"').replaceAll('"','')}</td>
<td>{new Date(r.last_activity).toLocaleString()}</td>
<td style={{maxWidth:260, overflow:'hidden', textOverflow:'ellipsis'}}>{r.landing_page}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}