import { test } from "node:test";
import assert from "node:assert/strict";
import { createAdminAuth } from "../src/adminAuth.js";
import { isAdminUser } from "../src/adminAccess.js";
function setup(user) {
  const auth = { currentUser: null };
  const events = [];
  const sdk = {
    async signInWithEmailAndPassword(_auth,email) { events.push(["login",email]); auth.currentUser=user; return { user }; },
    async signOut() { events.push(["logout"]); auth.currentUser=null; },
    async getIdToken(u,force) { events.push(["token",force,u.emailVerified]); },
    async reload() { events.push(["reload"]); },
    async sendEmailVerification(u) { events.push(["send",u.email]); },
  };
  return { auth, sdk, events, actions:createAdminAuth(auth,sdk) };
}
test("unverified photographer remains signed in for verification but cannot access admin", async () => {
  const x=setup({email:"psalmhe@gmail.com",emailVerified:false});
  await assert.rejects(x.actions.login(" psalmhe@gmail.com ","password"),/Verify your email/);
  assert.equal(isAdminUser(x.auth.currentUser),false);
  assert.equal(x.events.some(e=>e[0]==="send"),false);
  await x.actions.sendVerification();
  assert.deepEqual(x.events.at(-1),["send","psalmhe@gmail.com"]);
});
test("another verified account is signed out and cannot send photographer verification", async () => {
  const x=setup({email:"other@example.com",emailVerified:true});
  await assert.rejects(x.actions.login("other@example.com","password"),/not authorized/);
  assert.equal(x.auth.currentUser,null);
  await assert.rejects(x.actions.sendVerification());
  assert.equal(x.events.some(e=>e[0]==="send"),false);
});
test("verification reload forces fresh claims before permitting admin access", async () => {
  const x=setup({email:"psalmhe@gmail.com",emailVerified:false});
  await assert.rejects(x.actions.login("psalmhe@gmail.com","password"));
  await assert.rejects(x.actions.refreshVerification(),/not verified yet/);
  x.sdk.reload=async u=>{x.events.push(["reload"]);u.emailVerified=true;};
  const user=await x.actions.refreshVerification();
  assert.equal(isAdminUser(user),true);
  assert.deepEqual(x.events.at(-1),["token",true,true]);
});
test("a session switch while verifying cannot authorize the old user", async () => {
  const x=setup({email:"psalmhe@gmail.com",emailVerified:false});
  await assert.rejects(x.actions.login("psalmhe@gmail.com","password"));
  x.sdk.reload=async u=>{u.emailVerified=true;x.auth.currentUser=null;};
  await assert.rejects(x.actions.refreshVerification(),/session changed/);
});
test("verified photographer login refreshes claims; invalid credentials propagate", async () => {
  const x=setup({email:"psalmhe@gmail.com",emailVerified:true});
  await x.actions.login(" psalmhe@gmail.com ","password");
  assert.deepEqual(x.events,[["login","psalmhe@gmail.com"],["token",true,true]]);
  x.sdk.signInWithEmailAndPassword=async()=>{throw Object.assign(Error("bad"),{code:"auth/invalid-credential"});};
  await assert.rejects(x.actions.login("psalmhe@gmail.com","wrong"),{code:"auth/invalid-credential"});
});
