import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emailAuthConfig,emailOwnerId,safeAuthNext} from '../lib/email-auth-config.ts';
test('email auth stays disabled until explicitly enabled with a publishable project key',()=>{
 const config={EMAIL_AUTH_ENABLED:'true',SUPABASE_URL:'https://project-test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_public_0123456789'};
 assert.deepEqual(emailAuthConfig(config),{url:config.SUPABASE_URL,key:config.SUPABASE_PUBLISHABLE_KEY});
 assert.equal(emailAuthConfig({...config,EMAIL_AUTH_ENABLED:'false'}),null);
 for(const key of ['sb_secret_1234567890','service_role','', 'eyJhbGciOiJIUzI1NiJ9.secret'])assert.equal(emailAuthConfig({...config,SUPABASE_PUBLISHABLE_KEY:key}),null);
 for(const url of ['http://project-test.supabase.co','https://project-test.supabase.co.evil.invalid','https://secret@project-test.supabase.co','https://project-test.supabase.co/path'])assert.equal(emailAuthConfig({...config,SUPABASE_URL:url}),null);
});
test('auth redirects remain on approved pages and preserve the Mac authorization request',()=>{
 assert.equal(safeAuthNext('/connect-mac?request=public-digest'),'/connect-mac?request=public-digest');
 assert.equal(safeAuthNext('/auth/reset'),'/auth/reset');
 for(const target of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','/auth/logout','/api/workspace',null])assert.equal(safeAuthNext(target),'/');
});
test('email accounts retain stable IDs independently of email text, names or legacy accounts',()=>{
 const id='12345678-1234-1234-1234-123456789abc';
 assert.equal(emailOwnerId(id),'email:'+id);
 assert.equal(emailOwnerId(id.toUpperCase()),emailOwnerId(id));
 assert.throws(()=>emailOwnerId('victoria@example.invalid'));
 assert.throws(()=>emailOwnerId(id+'\n'));
});
