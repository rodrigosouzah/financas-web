import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEVICE_LIFETIME,deviceDigest,parseDeviceToken,validApproval} from '../lib/native-device.ts';
test('Mac credentials require two full random 256-bit components',()=>{
 const id='a'.repeat(64),secret='b'.repeat(64);
 assert.deepEqual(parseDeviceToken(id+'.'+secret),{id,secret});
 for(const bad of ['',id,id+'.short','../'+id+'.'+secret,id+'.'+secret+'\n',null])assert.equal(parseDeviceToken(bad),null);
});
test('approval is bounded to ten minutes and contains no raw device secret',async()=>{
 const now=Date.now(),secret='c'.repeat(64),hash=await deviceDigest(secret);
 assert.equal(hash.length,64);assert.notEqual(hash,secret);
 assert.equal(hash,await deviceDigest(secret));
 const approval={id:'a'.repeat(64),tokenHash:hash,createdAt:now};
 assert.equal(validApproval(approval),true);
 assert.equal(validApproval({...approval,createdAt:now-601_000}),false);
 assert.equal(validApproval({...approval,createdAt:now+120_000}),false);
 assert.equal(validApproval({...approval,tokenHash:'short'}),false);
 assert.equal(DEVICE_LIFETIME,90*24*3600*1000);
});
