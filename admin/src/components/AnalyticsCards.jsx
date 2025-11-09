import React from 'react';
import { useEffect, useState } from 'react';
import { getMetrics } from '../api';


export default function AnalyticsCards(){
const [kpi, setKpi] = useState({ total_visits: 0, unique_visitors: 0, duplicate_visits: 0, new_pages: 0 });
useEffect(()=>{ (async()=> setKpi(await getMetrics({})))(); },[]);
return (
<div className="kpi">
<div className="card"><h2>{kpi.total_visits}</h2><p>Total Visits</p></div>
<div className="card"><h2>{kpi.unique_visitors}</h2><p>Unique Visitors</p></div>
<div className="card"><h2>{kpi.duplicate_visits}</h2><p>Duplicate Visits</p></div>
<div className="card"><h2>{kpi.new_pages}</h2><p>New Pages</p></div>
</div>
);
}