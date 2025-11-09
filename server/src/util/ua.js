import UAParser from 'ua-parser-js';
export function parseUA(uaString=''){
const u = new UAParser(uaString).getResult();
return {
browser: u.browser?.name || 'Unknown',
os: u.os?.name || 'Unknown',
device: u.device?.type || 'desktop',
};
}