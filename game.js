'use strict';
const canvas = document.querySelector('#court'), ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['score','time','message','angle','power','angleValue','powerValue','two','three','shoot','restart','record'].map(id=>[id,document.getElementById(id)]));
const hoop = {x:820,y:220,halfWidth:28,netHeight:40}, gravity=420, ballRadius=12;
let state, lastTime=performance.now();
function reset(){state={score:0,shots:0,hits:0,mode:2,ball:null,deadline:null,remaining:60,ended:false,netTime:0,netOffset:0};setMode(2);ui.angle.value=52;ui.power.value=55;updateControls();ui.message.textContent='调整角度和力道，准备出手';updateUI();}
function origin(){return {x:state.mode===2?490:240,y:330};}
function velocity(){const a=Number(ui.angle.value)*Math.PI/180,v=Number(ui.power.value)*8;return {x:Math.cos(a)*v,y:-Math.sin(a)*v};}
function setMode(mode){if(state.ball||state.ended)return;state.mode=mode;ui.angle.value=52;ui.power.value=mode===2?55:68;updateControls();for(const [id,n] of [['two',2],['three',3]]){ui[id].classList.toggle('active',mode===n);ui[id].setAttribute('aria-pressed',String(mode===n));}}
function updateControls(){ui.angleValue.textContent=ui.angle.value+'°';ui.powerValue.textContent=ui.power.value+'%';}
function updateUI(){ui.score.textContent=state.score;ui.time.textContent=state.remaining;ui.record.textContent=`命中 ${state.hits} / 出手 ${state.shots}`;ui.shoot.disabled=!!state.ball||state.ended;ui.two.disabled=ui.three.disabled=!!state.ball||state.ended;}
function shoot(){if(state.ball||state.ended)return;const now=performance.now();if(state.deadline&&now>=state.deadline){finish();return;}if(!state.deadline)state.deadline=now+60000;const p=origin(),v=velocity();state.ball={...p,vx:v.x,vy:v.y,points:state.mode,scored:false};state.shots++;ui.message.textContent='';updateUI();}
function finish(){state.ended=true;state.remaining=0;ui.message.textContent=`时间到！最终得分 ${state.score} 分`;updateUI();}
function tick(dt,now){
 if(state.deadline&&!state.ended){state.remaining=Math.max(0,Math.ceil((state.deadline-now)/1000));if(!state.remaining)finish();}
 state.netTime=Math.max(0,state.netTime-dt);
 const elapsed=1.8-state.netTime;
 state.netOffset=state.netTime>0?Math.sin(elapsed*13)*16*(state.netTime/1.8):0;
 if(state.ball){
  const b=state.ball,oldX=b.x,oldY=b.y;
  b.x+=b.vx*dt;b.y+=b.vy*dt+gravity*dt*dt/2;b.vy+=gravity*dt;
  // Test the swept path at rim height: only a descending ball fully inside the opening enters.
  if(!b.scored&&!b.inNet&&oldY<hoop.y&&b.y>=hoop.y&&b.vy>0){
   const crossing=oldX+(b.x-oldX)*(hoop.y-oldY)/(b.y-oldY);
   if(Math.abs(crossing-hoop.x)<=hoop.halfWidth-ballRadius-2){
    b.inNet=true;b.x=crossing;b.vx*=0.12;b.vy=Math.min(b.vy,150);
    state.netTime=1.8;
   }
  }
  if(b.inNet){
   // The net guides the ball downward instead of letting it fly sideways through the rim.
   if(b.y<hoop.y+hoop.netHeight+ballRadius){
    const clearance=Math.max(3,(hoop.halfWidth-ballRadius)*(1-(b.y-hoop.y)/(hoop.netHeight+ballRadius)));
    b.x=Math.max(hoop.x-clearance,Math.min(hoop.x+clearance,b.x));
   }
   if(!b.scored&&b.y>=hoop.y+ballRadius){
    b.scored=true;
    if(!state.ended){state.score+=b.points;state.hits++;ui.message.textContent=`好球！+${b.points} 分`;}
   }
  }else{
   // Solid rim ends and backboard stop near misses from visually passing through them.
   for(const rimX of [hoop.x-hoop.halfWidth,hoop.x+hoop.halfWidth]){
    const dx=b.x-rimX,dy=b.y-hoop.y,d=Math.hypot(dx,dy),radius=ballRadius+2;
    if(d<radius&&d>0){const nx=dx/d,ny=dy/d,approach=b.vx*nx+b.vy*ny;
     b.x=rimX+nx*radius;b.y=hoop.y+ny*radius;
     if(approach<0){b.vx-=1.65*approach*nx;b.vy-=1.65*approach*ny;}
    }
   }
   if(oldX+ballRadius<=850&&b.x+ballRadius>=850&&b.y>130-ballRadius&&b.y<255+ballRadius){b.x=850-ballRadius;b.vx=-Math.abs(b.vx)*0.65;}
  }
  if(b.y>470||b.x>1050||b.x<0){if(!b.scored&&!state.ended)ui.message.textContent='差一点！调整角度或力道再试一次';state.ball=null;}
 }
 updateUI();
}
function drawNet(){
 const left=hoop.x-hoop.halfWidth,right=hoop.x+hoop.halfWidth;
 for(let i=0;i<=6;i++){
  const top=left+(right-left)*i/6,bottom=hoop.x-15+30*i/6+state.netOffset;
  line(top,hoop.y+2,bottom,hoop.y+hoop.netHeight,'#e7edf2',1.5);
  line(top,hoop.y+2,hoop.x+15-30*i/6+state.netOffset,hoop.y+hoop.netHeight,'#e7edf2',1);
 }
 line(hoop.x-15+state.netOffset,hoop.y+hoop.netHeight,hoop.x+15+state.netOffset,hoop.y+hoop.netHeight,'#e7edf2');
}
function drawRim(front){
 ctx.strokeStyle='#ff7443';ctx.lineWidth=4;ctx.beginPath();
 ctx.ellipse(hoop.x,hoop.y,hoop.halfWidth,5,0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();
}
function line(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function basketball(x,y){circle(x,y,12,'#ff9a38');ctx.strokeStyle='#803d20';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.stroke();line(x-12,y,x+12,y,'#803d20',1.5);line(x,y-12,x,y+12,'#803d20',1.5);}
function draw(){ctx.clearRect(0,0,1000,520);const g=ctx.createLinearGradient(0,0,0,450);g.addColorStop(0,'#192b3c');g.addColorStop(1,'#354b5d');ctx.fillStyle=g;ctx.fillRect(0,0,1000,520);for(let i=0;i<4;i++){line(0,90+i*55,1000,90+i*55,'#3c5061',12);for(let j=0;j<35;j++)circle(j*31+(i%2)*12,82+i*55,4,'#728494');}ctx.fillStyle='#bd8554';ctx.fillRect(0,420,1000,100);for(let x=0;x<1000;x+=85)line(x,420,x+40,520,'#a77348');line(0,450,1000,450,'#f8ddae',3);ctx.strokeStyle='#f8ddae';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(800,450,185,52,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(800,450,570,180,0,Math.PI,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffebc8';ctx.font='bold 15px system-ui';ctx.fillText('3 POINT',185,490);ctx.fillText('2 POINT',470,490);
line(905,150,905,440,'#94a8b9',12);ctx.fillStyle='#dfedf4';ctx.fillRect(850,130,14,125);ctx.strokeStyle='#ff7443';ctx.strokeRect(850,185,14,48);line(848,220,850,220,'#ff7443',4);drawRim(false);
const p=origin();circle(p.x-14,310,16,'#d7a27d');line(p.x-15,328,p.x-15,385,'#51bfca',24);line(p.x-18,383,p.x-32,425,'#192b3c',13);line(p.x-10,383,p.x+8,425,'#192b3c',13);line(p.x-25,343,p.x,330,'#d7a27d',9);line(p.x-7,342,p.x+8,320,'#d7a27d',9);ctx.fillStyle='white';ctx.font='bold 17px system-ui';ctx.fillText('23',p.x-25,365);
if(!state.ball&&!state.ended){const v=velocity();ctx.setLineDash([4,9]);ctx.strokeStyle='#ffe0a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);for(let t=.025;t<3;t+=.025){const x=p.x+v.x*t,y=p.y+v.y*t+gravity*t*t/2;if(y>440||x>970)break;ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);basketball(p.x,p.y);}if(state.ball)basketball(state.ball.x,state.ball.y);drawNet();drawRim(true);}
ui.angle.addEventListener('input',updateControls);ui.power.addEventListener('input',updateControls);ui.two.onclick=()=>setMode(2);ui.three.onclick=()=>setMode(3);ui.shoot.onclick=shoot;ui.restart.onclick=reset;
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();if(!e.repeat)shoot();}if(e.code==='KeyR')reset();});
reset();function frame(now){let dt=Math.min((now-lastTime)/1000,.1);lastTime=now;while(dt>0){const step=Math.min(dt,1/120);tick(step,now);dt-=step;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
