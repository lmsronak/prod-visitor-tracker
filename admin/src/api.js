const BASE = import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:8080';
const API_KEY = import.meta.env.VITE_API_KEY || '';


export async function getMetrics(params={}){
const url = new URL(BASE + '/api/admin/metrics');
Object.entries(params).forEach(([k,v])=> url.searchParams.set(k,v));
const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
return res.json();
}


export async function getTopPages(params={}){
const url = new URL(BASE + '/api/admin/top-pages');
Object.entries(params).forEach(([k,v])=> url.searchParams.set(k,v));
const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
return res.json();
}


export async function getLive(){
const res = await fetch(BASE + '/api/admin/live', { headers: { 'x-api-key': API_KEY } });
return res.json();
}


export function openSocket(){
const { io } =  import('socket.io-client');
}