const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('http://127.0.0.1:8000');
 const value=async(id)=>page.locator('#'+id).textContent();
 const aim=async(mode,angle,power)=>{await page.locator(mode===2?'#two':'#three').click();await page.locator('#angle').fill(String(angle));await page.locator('#power').fill(String(power));await page.locator('#shoot').click();await page.clock.runFor(3500);};
 assert.equal(await value('time'),'60');
 // Speeds calculated from the projectile equation for a descending hoop crossing.
 await aim(2,52,55);assert.equal(await value('score'),'2');assert.equal(await value('record'),'命中 1 / 出手 1');
 await aim(3,52,68);assert.equal(await value('score'),'5');assert.equal(await value('record'),'命中 2 / 出手 2');
 await aim(2,25,25);assert.equal(await value('score'),'5');assert.equal(await value('record'),'命中 2 / 出手 3');
 await page.clock.runFor(61000);assert.equal(await value('time'),'0');assert.equal(await page.locator('#shoot').isDisabled(),true);assert.match(await value('message'),/最终得分 5/);
 await page.locator('#restart').click();assert.equal(await value('score'),'0');assert.equal(await value('time'),'60');assert.equal(await value('record'),'命中 0 / 出手 0');assert.equal(await page.locator('#shoot').isDisabled(),false);
 await page.locator('h1').click();await page.keyboard.press('Space');assert.equal(await value('record'),'命中 0 / 出手 1');await page.keyboard.press('r');assert.equal(await value('record'),'命中 0 / 出手 0');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'/tmp/basket-ball-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: two-point and three-point scoring, miss, timer expiry, restart, keyboard controls, mobile layout, no browser errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
