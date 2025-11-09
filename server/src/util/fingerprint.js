import crypto from 'crypto';
export function fp({ ip, ua, acceptLang='' }){
const hash = crypto
.createHash('sha256')
.update(`${ip}|${ua}|${acceptLang}`)
.digest('hex');
return hash.slice(0, 48);
}