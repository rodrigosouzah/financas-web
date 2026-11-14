/** One speaking turn, never a greeting and a reminder together. No ledger writes. */
export function mascotSpeech<T>(visit:number,context:string|undefined,message:string,reminders:readonly T[]):{kind:'message';text:string}|{kind:'reminder';reminder:T}{
 const turn=Math.max(0,Math.floor(visit));
 if(turn%2===1&&reminders.length)return{kind:'reminder',reminder:reminders[Math.floor(turn/2)%reminders.length]};
 return{kind:'message',text:turn===0&&context?context:message};
}
