import React from 'react';
import { useState } from 'react';
import './styles.css';
import LiveRadar from './components/LiveRadar';
import LiveVisitors from './components/LiveVisitors';
import AnalyticsCards from './components/AnalyticsCards';
import TopPages from './components/TopPages';
import IndiaMapLive from './components/IndiaMapLive';
import VisitorsTable from './components/VisitorsTable';


export default function App(){
const [tab, setTab] = useState('live');
return (
<div className="container">
<div className="nav">
<button onClick={()=>setTab('live')}>Live</button>
<button onClick={()=>setTab('analytics')}>Analytics</button>
</div>


{tab==='live' && (
  <>
     <div style={{marginTop:16}}>
      <LiveRadar />
     
    </div>
      <div style={{marginTop:16}}>
      
      <LiveVisitors />
    </div>
    <div style={{marginTop:16}}>
      <IndiaMapLive />
    </div>
  </>
)}

{tab==='analytics' && (
<>
<AnalyticsCards />
<div style={{marginTop:16}}>
<TopPages />
<div style={{marginTop:16}}>
  <VisitorsTable />
</div>
</div>
</>
)}
</div>
);
}