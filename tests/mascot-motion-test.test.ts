import test from 'node:test';
import assert from 'node:assert/strict';
import {MOTION_TESTS,testMotionFrame} from '../lib/mascot-test.ts';
import {newProfile,validateWorkspace} from '../lib/finance.ts';
import {DEFAULT_MASCOT,validMascot} from '../lib/mascot.ts';
test('2D movement controls is optional, profile-local and backwards compatible; malformed flags rejected',()=>{const p=newProfile('Synthetic');assert.equal(p.mascot?.motionTest,undefined);p.mascot={...DEFAULT_MASCOT,motionTest:true};const state={schemaVersion:1 as const,profiles:[p],activeId:p.id};assert.equal(validateWorkspace(state).profiles[0].mascot?.motionTest,true);assert.equal(validMascot({...DEFAULT_MASCOT,motionTest:'true'}),false);});
test('every action is available without financial prerequisites and manual movements finish at rest inside viewport',()=>{for(const width of [320,390,1440])for(const [action,,duration] of MOTION_TESTS){const body=width<=600?88:112;for(let t=0;t<=duration+1;t+=.1){const f=testMotionFrame(action,t,width,body);assert.ok(f.x>=0&&f.x+body<=width);assert.ok(Number.isFinite(f.walkPhase));}assert.equal(testMotionFrame(action,duration+.1,width,body).action,'idle');}const seen=new Set(Array.from({length:1000},(_,i)=>testMotionFrame('auto',i/10,390,88).action));for(const [action] of MOTION_TESTS)assert.ok(seen.has(action));});
