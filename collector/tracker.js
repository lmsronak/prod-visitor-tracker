(function(){
const WEBSITE_ID = (document.currentScript && document.currentScript.dataset.websiteId) || null;
if(!WEBSITE_ID) return console.warn('[tracker] Missing data-website-id');


const SERVER = new URL(document.currentScript.src).origin; // https://your-server
const LS_KEY = 'vt_vid';
const SID_KEY = 'vt_sid';


function uuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);
});}


function getId(k){
let id = localStorage.getItem(k);
if(!id){ id = uuid(); localStorage.setItem(k, id); }
return id;
}


const vid = getId(LS_KEY);
let sid = getId(SID_KEY);
let lastPVUrl = '';


async function send(type, extra={}){
try{
await fetch(SERVER + '/api/collect', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
keepalive: true,
body: JSON.stringify({
websiteId: WEBSITE_ID,
type,
url: location.href,
title: document.title,
referrer: document.referrer || null,
visitorKey: vid,
meta: extra
})
});
}catch(e){ /* silent */ }
}


// Initial pageview
function pageview(){
if(lastPVUrl===location.href) return; // avoid duplicates on hash
lastPVUrl = location.href;
send('pageview');
}


pageview();


// History API navigation
['pushState','replaceState'].forEach(fn=>{
const orig = history[fn];
history[fn] = function(){ const r = orig.apply(this, arguments); setTimeout(pageview, 0); return r; };
});
window.addEventListener('popstate', pageview);


// Heartbeat
setInterval(()=> send('heartbeat'), 15000);


// Exit
window.addEventListener('beforeunload', ()=> send('exit'));
})();