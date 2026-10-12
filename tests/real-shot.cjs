// Real-time browser shots: no clock mocking, no injected balls or score changes.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8000');
  assert.match(await page.locator('footer').textContent(),/2026.10.12.3/);
  for(const [mode,power,points] of [['two','55',2],['three','68',3]]){
   await page.locator('#restart').click();await page.locator('#'+mode).click();
   assert.equal(await page.locator('#power').inputValue(),power);
   await page.locator('#shoot').click();
   await page.waitForFunction(()=>state.ball?.inNet,{},{timeout:5000});
   const entry=await page.evaluate(()=>({x:state.ball.x,y:state.ball.y,vy:state.ball.vy}));
   assert.ok(entry.vy>0);assert.ok(Math.abs(entry.x-820)<16);
   await page.waitForFunction(()=>Math.abs(state.netOffset)>5,{},{timeout:1000});
   await page.screenshot({path:`/tmp/basket-${mode}-net.png`});
   const first=await page.locator('#court').screenshot();
   await page.waitForTimeout(100);
   const second=await page.locator('#court').screenshot();assert.notDeepEqual(first,second);
   await page.waitForFunction(points=>Number(document.querySelector('#score').textContent)===points,points,{timeout:3000});
   await page.screenshot({path:`/tmp/basket-${mode}-scored.png`});
   await page.waitForFunction(()=>!state.ball&&state.netTime===0,{},{timeout:5000});
   assert.equal(await page.locator('#score').textContent(),String(points));
   assert.equal(await page.locator('#record').textContent(),'命中 1 / 出手 1');
   assert.equal(await page.evaluate(()=>state.netOffset),0);
   console.log(`PASS real browser click: ${mode}, 52 degrees / ${power}%, downward hoop entry, visible moving net, score +${points}, no double score`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
