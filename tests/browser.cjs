const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('http://127.0.0.1:8000');
 const value=async(id)=>page.locator('#'+id).textContent();
 const aim=async(mode,angle,power)=>{await page.locator(mode===2?'#two':'#three').click();await page.locator('#angle').fill(String(angle));await page.locator('#power').fill(String(power));await page.locator('#shoot').click();await page.clock.runFor(3500);};
 assert.equal(await value('time'),'60');
 // Inspect a real shot while it travels through the animated net.
 await page.locator('#power').fill('55');await page.locator('#shoot').click();
 let entered=false,swung=false;
 for(let i=0;i<120;i++){
  await page.clock.runFor(20);
  const snapshot=await page.evaluate(()=>({inNet:!!state.ball?.inNet,scored:!!state.ball?.scored,y:state.ball?.y,netOffset:state.netOffset}));
  if(snapshot.inNet){entered=true;if(snapshot.y<232)assert.equal(snapshot.scored,false);}
  if(Math.abs(snapshot.netOffset)>1)swung=true;
 }
 assert.equal(entered,true);assert.equal(swung,true);assert.equal(await value('score'),'2');
 await page.clock.runFor(2000);assert.equal(await value('score'),'2');
 await page.clock.runFor(1500);assert.equal(await page.evaluate(()=>state.netOffset),0);
 // Wrong direction, outside the opening, and a rim-grazing ball must not score.
 for(const shot of [{x:820,y:235,vx:0,vy:-180},{x:760,y:200,vx:0,vy:100},{x:842,y:200,vx:0,vy:100}]){
  await page.evaluate(shot=>{reset();state.ball={...shot,points:3,scored:false};},shot);
  await page.clock.runFor(200);assert.equal(await value('score'),'0');
 }
 // A valid ball through the net counts once even over many animation frames.
 await page.evaluate(()=>{reset();state.ball={x:820,y:200,vx:0,vy:100,points:3,scored:false};});
 await page.clock.runFor(800);assert.equal(await value('score'),'3');
 await page.clock.runFor(1000);assert.equal(await value('score'),'3');
 // No late points after the deadline; restarting also restores the net.
 await page.evaluate(()=>{reset();state.deadline=performance.now()+1;state.ball={x:820,y:200,vx:0,vy:100,points:2,scored:false};});
 await page.clock.runFor(500);assert.equal(await value('score'),'0');
 await page.locator('#restart').click();assert.equal(await page.evaluate(()=>state.netOffset),0);

 // Speeds calculated from the projectile equation for a descending hoop crossing.
 await aim(2,52,55);assert.equal(await value('score'),'2');assert.equal(await value('record'),'命中 1 / 出手 1');
 await aim(3,52,68);assert.equal(await value('score'),'5');assert.equal(await value('record'),'命中 2 / 出手 2');
 await aim(2,25,25);assert.equal(await value('score'),'5');assert.equal(await value('record'),'命中 2 / 出手 3');
 await page.clock.runFor(61000);assert.equal(await value('time'),'0');assert.equal(await page.locator('#shoot').isDisabled(),true);assert.match(await value('message'),/最终得分 5/);
 await page.locator('#restart').click();assert.equal(await value('score'),'0');assert.equal(await value('time'),'60');assert.equal(await value('record'),'命中 0 / 出手 0');assert.equal(await page.locator('#shoot').isDisabled(),false);
 await page.locator('h1').click();await page.keyboard.press('Space');assert.equal(await value('record'),'命中 0 / 出手 1');await page.keyboard.press('r');assert.equal(await value('record'),'命中 0 / 出手 0');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'/tmp/basket-ball-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: downward entry, animated net and settling, rim misses, no duplicate or late scores, two-point and three-point scoring, miss, timer expiry, restart, keyboard controls, mobile layout, no browser errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
