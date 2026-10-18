(() => {
  "use strict";
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const episode = window.LAST_CALL_EPISODE;
  const subtitle = document.getElementById("subtitle");
  const transcript = document.getElementById("transcript");
  const playButton = document.getElementById("play");
  const voiceButton = document.getElementById("voice");
  const captionsButton = document.getElementById("captions");
  let lineIndex = 0, playing = false, voiceOn = true, captionsOn = true, lastTime = 0, elapsed = 0, raf = 0;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function roundedRect(x,y,w,h,r,fill,stroke) {
    ctx.beginPath(); ctx.roundRect(x,y,r);
    ctx.fillStyle=fill; ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  }
  function text(t,x,y,size,color,weight="700",align="left") {
    ctx.font=weight+" "+size+"px system-ui, sans-serif";ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t,x,y);
  }
  function drawCharacter(x,y,scale,kind,talk,bob) {
    ctx.save();ctx.translate(x,y+Math.sin(elapsed*3+bob)*3);ctx.scale(scale,scale);
    const ghost=kind==="len", skin=ghost?"#9cd8e8":"#e0a57f", coat=ghost?"#334d67":"#292832";
    // shadow and body
    ctx.fillStyle="#08080d88";ctx.beginPath();ctx.ellipse(0,8,64,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=coat;ctx.beginPath();ctx.roundRect(-42,-112,84,112,17);ctx.fill();
    ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,-143,42,48,0,0,Math.PI*2);ctx.fill();
    // hair
    ctx.fillStyle=ghost?"#e9f5f7":"#29202b";ctx.beginPath();ctx.arc(0,-158,43,Math.PI,Math.PI*2);ctx.lineTo(40,-151);ctx.lineTo(26,-177);ctx.lineTo(10,-165);ctx.lineTo(-3,-181);ctx.lineTo(-22,-163);ctx.lineTo(-39,-171);ctx.closePath();ctx.fill();
    // eyes and eyebrows
    ctx.strokeStyle="#29202b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-25,-162);ctx.lineTo(-12,-165);ctx.moveTo(12,-165);ctx.lineTo(25,-161);ctx.stroke();
    ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-18,-151,8,10,0,0,Math.PI*2);ctx.ellipse(18,-151,8,10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#24212a";ctx.beginPath();ctx.arc(-16,-149,3,0,Math.PI*2);ctx.arc(16,-149,3,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#8b4b4d";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,-126);ctx.quadraticCurveTo(0,talk&&playing&&Math.sin(elapsed*18)>0? -116:-121,10,-126);ctx.stroke();
    if(kind==="marnie"){ctx.fillStyle="#d9ff55";ctx.fillRect(-44,-115,88,9);ctx.fillStyle="#d9ff55";ctx.fillRect(24,-103,8,45);}
    else {ctx.fillStyle="#70d9ff";ctx.fillRect(-10,-108,20,7);}
    ctx.restore();
  }
  function draw() {
    const w=canvas.width,h=canvas.height;
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#25283c");g.addColorStop(.6,"#5d394a");g.addColorStop(1,"#171720");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    // moon and distant skyline
    ctx.fillStyle="#d9ff55";ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(790,95,39,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    for(let i=0;i<14;i++){const x=i*76;const bh=75+(i*47%130);ctx.fillStyle=i%2?"#272536":"#30283b";ctx.fillRect(x,280-bh,55,bh+260);for(let yy=300-bh;yy<490;yy+=22)for(let xx=x+10;xx<x+50;xx+=18){ctx.fillStyle=(i+yy+xx)%3?"#e7b76b":"#60566c";ctx.globalAlpha=.5;ctx.fillRect(xx,yy,6,9);ctx.globalAlpha=1;}}
    // office window and walls
    ctx.fillStyle="#11121c";ctx.fillRect(70,68,820,320);ctx.strokeStyle="#555064";ctx.lineWidth=10;ctx.strokeRect(70,68,820,320);ctx.beginPath();ctx.moveTo(480,68);ctx.lineTo(480,388);ctx.moveTo(70,225);ctx.lineTo(890,225);ctx.stroke();
    text("AFTERLIFE SERVICES",105,105,18,"#d9ff55","900");text("WE'RE HERE FOR ETERNITY*",850,132,12,"#f5f1e9","700","right");text("*terms and conditions apply",850,151,10,"#c7b9c8","400","right");
    // desks and monitor
    ctx.fillStyle="#392b37";ctx.fillRect(110,365,740,25);ctx.fillStyle="#171720";ctx.fillRect(150,310,130,60);ctx.fillStyle="#d9ff55";ctx.fillRect(160,320,110,40);text("WAIT: ∞",215,345,16,"#171720","900","center");
    ctx.fillStyle="#25232f";ctx.fillRect(620,312,130,57);ctx.fillStyle="#ff5b83";ctx.fillRect(630,322,110,36);text("TICKET #0",685,345,13,"#171720","900","center");
    drawCharacter(330,490,1.12,"marnie",lineIndex%2===0,0);drawCharacter(620,490,1.03,"len",lineIndex%2===1,2);
    // foreground caption
    text("DEPARTMENT OF ETERNAL CUSTOMER SERVICE",480,520,13,"#d9d4df","800","center");
    if(!reducedMotion){elapsed += .012;}
  }
  function renderTranscript(){
    transcript.innerHTML="";
    episode.lines.forEach((line,i)=>{const el=document.createElement("div");el.className="line"+(i===lineIndex?" active":"");el.innerHTML="<strong>"+escapeHTML(line.speaker)+"</strong>"+escapeHTML(line.text);transcript.appendChild(el);});
    const active=transcript.children[lineIndex];if(active)active.scrollIntoView({block:"nearest",behavior:"auto"});
  }
  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function showLine(speak=true){
    const line=episode.lines[lineIndex];if(!line)return;
    subtitle.textContent=captionsOn?line.speaker+": "+line.text:"";
    renderTranscript();
    if(speak&&voiceOn&&"speechSynthesis" in window){window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(line.speaker==="THE SYSTEM"?"System message. "+line.text:line.text);utterance.rate=.92;utterance.pitch=line.speaker==="THE SYSTEM"?.75:line.speaker==="MARNIE"?.88:1.08;window.speechSynthesis.speak(utterance);}
  }
  function nextLine(){lineIndex=(lineIndex+1)%episode.lines.length;showLine(true);if(lineIndex===0&&playing)stop();}
  function tick(now){if(!playing)return;if(now-lastTime>5200){lastTime=now;nextLine();}draw();raf=requestAnimationFrame(tick);}
  function start(){if(playing)return;playing=true;playButton.textContent="Ⅱ Pause episode";lastTime=performance.now();showLine(true);if(!reducedMotion)raf=requestAnimationFrame(tick);}
  function stop(){playing=false;playButton.textContent="▶ Play episode";cancelAnimationFrame(raf);if("speechSynthesis" in window)window.speechSynthesis.cancel();draw();}
  playButton.addEventListener("click",()=>playing?stop():start());
  document.getElementById("next").addEventListener("click",()=>{showLine(false);nextLine();});
  voiceButton.addEventListener("click",()=>{voiceOn=!voiceOn;voiceButton.textContent=voiceOn?"🔊 Voice on":"🔇 Voice off";voiceButton.setAttribute("aria-pressed",String(voiceOn));if(!voiceOn&&"speechSynthesis" in window)window.speechSynthesis.cancel();else if(voiceOn)showLine(true);});
  captionsButton.addEventListener("click",()=>{captionsOn=!captionsOn;captionsButton.setAttribute("aria-pressed",String(captionsOn));captionsButton.textContent=captionsOn?"CC Captions":"CC Captions off";showLine(false);});
  window.addEventListener("resize",draw);
  draw();showLine(false);
})();