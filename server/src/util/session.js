export const SESSION_IDLE_MIN = 30; // minutes
export function isExpired(lastActivity){
return Date.now() - new Date(lastActivity).getTime() > SESSION_IDLE_MIN*60*1000;
}