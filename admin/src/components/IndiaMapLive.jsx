import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { io } from 'socket.io-client';

const INDIA_STATES = 'https://cdn.jsdelivr.net/npm/india-geojson@1/india.geo.json';

export default function IndiaMapLive(){
  const [live, setLive] = useState([]);

  useEffect(()=>{
    const socket = io(import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:8080');
    socket.emit('join', { apiKey: import.meta.env.VITE_API_KEY });
    socket.on('presence', (p)=>{
      // show only if we have coordinates (localhost often has none)
      if (p && p.lat != null && p.lon != null) {
        setLive(prev => {
          const now = Date.now();
          const filtered = prev.filter(i => now - i.ts < 20000 && i.visitorId !== p.visitorId);
          return [{ visitorId: p.visitorId, lat: p.lat, lon: p.lon, city: p.city, ts: now }, ...filtered];
        });
      }
    });
    return ()=> socket.close();
  },[]);

  return (
    <div className="card">
      <h3 style={{marginTop:0}}>Live Visitors — India</h3>
      <div style={{height: 420}}>
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 900 }}>
          <Geographies geography={INDIA_STATES}>
            {({ geographies }) => (
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: '#1f2937', stroke: '#3b4457', outline: 'none' },  // lighter than panel
                    hover:   { fill: '#243244', stroke: '#3b4457', outline: 'none' },
                    pressed: { fill: '#243244', stroke: '#3b4457', outline: 'none' },
                  }}
                />
              ))
            )}
          </Geographies>

          {live.map(v => (
            <Marker key={v.visitorId} coordinates={[v.lon, v.lat]}>
              <circle r={6} />
              {v.city && <text textAnchor="start" y={-10} style={{ fontSize: 10 }}>{v.city}</text>}
            </Marker>
          ))}
        </ComposableMap>
      </div>
      <p className="badge" style={{marginTop:8}}>Pins fade after ~20s of inactivity.</p>
    </div>
  );
}
