export function confirmationInput(values:{get:(key:string)=>unknown}){
 const token=values.get('token_hash'),type=values.get('type');
 if(typeof token!=='string'||!/^[a-f0-9]{32,256}$/i.test(token)||(type!=='email'&&type!=='recovery'))return null;
 return{token,type};
}
export function confirmationError(code:string|undefined){return code==='otp_expired'?'link-expired':code==='over_request_rate_limit'?'verification-rate-limit':'verification-unavailable';}
