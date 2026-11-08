import {test} from 'node:test';
import assert from 'node:assert/strict';
import {confirmationInput,confirmationError,confirmationOrigin,trustedConfirmationOrigin} from '../lib/email-confirmation.ts';
test('confirmation accepts only supported one-time tokens and flows',()=>{
 const token='a'.repeat(40);
 for(const token of ['a'.repeat(40),'pkce_'+'b'.repeat(56)])for(const type of ['email','recovery'])assert.deepEqual(confirmationInput(new URLSearchParams({token_hash:token,type})),{token,type});
 for(const fields of [{token_hash:'<script>',type:'email'},{token_hash:'pkce_" onclick="bad',type:'email'},{token_hash:token,type:'invite'},{type:'email'},{token_hash:token}])assert.equal(confirmationInput(new URLSearchParams(Object.entries(fields).filter(([,v])=>v!==undefined) as string[][])),null);
});
test('only real OTP expiration is reported as expired; network and rate errors remain distinct',()=>{
 assert.equal(confirmationError('otp_expired'),'link-expired');
 assert.equal(confirmationError('over_request_rate_limit'),'verification-rate-limit');
 for(const code of [undefined,'unexpected_failure','request_timeout'])assert.equal(confirmationError(code),'verification-unavailable');
});

test('confirmation trusts only the public origin behind proxies and local development origin',()=>{
 const publicOrigin='https://financas-rodrigo-web.jammypark15.chatgpt.site';
 const workerURL='https://internal-worker.invalid/auth/confirm';
 assert.equal(confirmationOrigin(workerURL),publicOrigin);
 assert.equal(trustedConfirmationOrigin(publicOrigin,workerURL),true);
 for(const origin of [null,'null','https://evil.invalid',publicOrigin+'.evil.invalid','http://financas-rodrigo-web.jammypark15.chatgpt.site','https://internal-worker.invalid'])assert.equal(trustedConfirmationOrigin(origin,workerURL),false);
 assert.equal(trustedConfirmationOrigin('http://127.0.0.1:8788','http://127.0.0.1:8788/auth/confirm'),true);
});
