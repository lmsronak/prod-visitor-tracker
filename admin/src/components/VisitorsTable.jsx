import React, { useEffect, useState } from 'react';

export default function VisitorsTable(){
  const BASE = import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:8080';
  const API_KEY = import.meta.env.VITE_API_KEY || '';
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');

  async function fetchRows(){
    const url = new URL(BASE + '/api/admin/visitors');
    if (q) url.searchParams.set('q', q);
    const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
    setRows(await res.json());
  }

  useEffect(()=>{ fetchRows(); },[]);

  return (
    <div className="card">
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search unique visitor (by visitor_key)"
          style={{flex:1, padding:'8px 10px', borderRadius:10, border:'1px solid var(--border)', background:'var(--panel)', color:'var(--text)'}}
        />
        <button onClick={fetchRows} className="badge">Search</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Visitor ID</th><th>Visitor Key</th><th>Country</th><th>City</th>
            <th>Sessions</th><th>Pageviews</th><th>First Seen</th><th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r)=>(
            <tr key={r.visitorId}>
              <td>#{r.visitorId}</td>
              <td style={{maxWidth:260, overflow:'hidden', textOverflow:'ellipsis'}}>{r.visitor_key}</td>
              <td>{r.country||'-'}</td>
              <td>{r.city||'-'}</td>
              <td>{r.sessions}</td>
              <td>{r.pageviews}</td>
              <td>{new Date(r.first_seen).toLocaleString()}</td>
              <td>{new Date(r.last_seen).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
