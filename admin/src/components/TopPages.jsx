import React from 'react';
import { useEffect, useState } from 'react';
import { getTopPages } from '../api';


export default function TopPages(){
const [rows, setRows] = useState([]);
useEffect(()=>{ (async()=> setRows(await getTopPages({limit:10})))(); },[]);
return (
<div className="card">
<h3 style={{marginTop:0}}>Top Pages</h3>
<table className="table">
<thead><tr><th>URL</th><th>Views</th></tr></thead>
<tbody>
{rows.map((r,i)=> (
<tr key={i}><td style={{maxWidth:600, overflow:'hidden', textOverflow:'ellipsis'}}>{r.url}</td><td>{r.views}</td></tr>
))}
</tbody>
</table>
</div>
);
}