import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function LiveRadar(){
  const canvasRef = useRef(null);
  const activeRef = useRef(new Map());   // id -> { ts, label }
  const posRef    = useRef(new Map());   // id -> { angle, dist }

  useEffect(()=>{
    const c = canvasRef.current;
    const ctx = c.getContext('2d');

    // HiDPI-safe resize (draw in CSS pixels)
    function resize(){
      const ratio = window.devicePixelRatio || 1;
      const r = c.getBoundingClientRect();
      c.width  = Math.max(1, r.width  * ratio);
      c.height = Math.max(1, r.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // so we can draw in CSS pixels
    }
    resize();
    window.addEventListener('resize', resize);

    function getPos(id){
      const pos = posRef.current;
      if(!pos.has(id)){
        pos.set(id, { angle: Math.random()*Math.PI*2, dist: 0.15 + Math.random()*0.8 });
      }
      return pos.get(id);
    }

    // prune inactive every second (20s TTL)
    const prune = setInterval(()=>{
      const now = Date.now();
      const m = activeRef.current;
      for(const [id, v] of m.entries()){
        if(now - v.ts > 20000) m.delete(id);
      }
    }, 1000);

    // draw loop
    let sweep = 0;
    let raf;
    const draw = () => {
      const w = c.clientWidth, h = c.clientHeight;
      const cx = w/2, cy = h/2, r = Math.min(w,h)/2 * 0.9;

      ctx.clearRect(0,0,w,h);

      // grid
      ctx.save();
      ctx.translate(cx,cy);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for(let i=0.25;i<=1;i+=0.25){ ctx.beginPath(); ctx.arc(0,0,r*i,0,Math.PI*2); ctx.stroke(); }
      for(let i=0;i<12;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r*Math.cos(i*Math.PI/6), r*Math.sin(i*Math.PI/6)); ctx.stroke(); }

      // sweep beam
      const beam = Math.PI/36;
      const grad = ctx.createRadialGradient(0,0,0,0,0,r);
      grad.addColorStop(0,'rgba(34,211,238,0.30)');
      grad.addColorStop(1,'rgba(34,211,238,0.02)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.arc(0,0,r,sweep-beam,sweep+beam);
      ctx.closePath(); ctx.fill();

      // BIG dots for active visitors
      const now = Date.now();
      for(const [id, v] of activeRef.current.entries()){
        const p = getPos(id);
        const br = r * p.dist;
        const x = br * Math.cos(p.angle);
        const y = br * Math.sin(p.angle);

        // dot
        ctx.beginPath();
        ctx.fillStyle = 'rgba(34,211,238,0.95)';
        ctx.arc(x, y, 8, 0, Math.PI*2);   // big dot
        ctx.fill();

        // label
        ctx.font = '10px ui-sans-serif, system-ui, Segoe UI';
        ctx.fillStyle = 'rgba(232,234,240,0.9)';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.label ?? `#${String(id).slice(-4)}`, x + 12, y);
      }

      ctx.restore();
      sweep += 0.03; if(sweep > Math.PI*2) sweep = 0;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // socket wiring: treat BOTH presence and event as activity
    const socket = io(import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:8080');
    socket.emit('join', { apiKey: import.meta.env.VITE_API_KEY });

    function markActive(rawId){
      if (!rawId) return;
      const id = String(rawId);
      const m = activeRef.current;
      const cur = m.get(id);
      m.set(id, { ts: Date.now(), label: cur?.label ?? `#${id.slice(-4)}` });
    }

    socket.on('presence', (p)=> { markActive(p?.visitorId); });
    socket.on('event',    (e)=> { markActive(e?.visitorId); });

    return ()=>{
      cancelAnimationFrame(raf);
      clearInterval(prune);
      socket.close();
      window.removeEventListener('resize', resize);
    };
  },[]);

  return (
    <div className="card">
      <div className="radarWrap">
        <canvas ref={canvasRef} />
      </div>
      <p className="badge" style={{marginTop:12}}>
        Live radar — active users glow; dots fade ~20s after last hit
      </p>
    </div>
  );
}
