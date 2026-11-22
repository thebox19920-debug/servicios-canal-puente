(function(){
  'use strict';
  const carousel=document.getElementById('scp-home-carousel');
  if(!carousel)return;
  const slides=Array.from(carousel.querySelectorAll('[data-scp-slide]'));
  const dots=Array.from(carousel.querySelectorAll('[data-scp-dot]'));
  const previous=carousel.querySelector('.lp-scp-carousel-prev');
  const next=carousel.querySelector('.lp-scp-carousel-next');
  const playback=carousel.querySelector('.lp-scp-carousel-toggle');
  const playbackIcon=playback?.querySelector('.lp-scp-carousel-toggle-icon');
  const playbackLabel=playback?.querySelector('.lp-scp-carousel-toggle-label');
  if(slides.length!==4||dots.length!==4||!previous||!next||!playback||!playbackIcon||!playbackLabel)return;
  let active=0;
  let timer=null;
  let touchTimer=null;
  let userPaused=false;
  const pauses=new Set();
  const duration=()=>Number(slides[active].dataset.scpDuration)||6000;
  const schedule=()=>{
    window.clearTimeout(timer);
    if(userPaused||pauses.size||document.hidden)return;
    timer=window.setTimeout(()=>show(active+1),duration());
  };
  const pause=reason=>{pauses.add(reason);window.clearTimeout(timer);};
  const resume=reason=>{pauses.delete(reason);schedule();};
  function show(index){
    active=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>{
      const selected=i===active;
      slide.classList.toggle('is-active',selected);
      slide.setAttribute('aria-hidden',String(!selected));
      if(selected)slide.removeAttribute('inert');else slide.setAttribute('inert','');
    });
    dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===active)));
    schedule();
  }
  const updatePlayback=()=>{
    playback.setAttribute('aria-pressed',String(userPaused));
    playback.setAttribute('aria-label',userPaused?'Reanudar el carrusel':'Pausar el carrusel');
    playbackIcon.textContent=userPaused?'▶':'Ⅱ';
    playbackLabel.textContent=userPaused?'Reproducir':'Pausar';
  };
  playback.addEventListener('click',()=>{
    userPaused=!userPaused;
    updatePlayback();
    if(userPaused)window.clearTimeout(timer);else schedule();
  });
  updatePlayback();
  previous.addEventListener('click',()=>show(active-1));
  next.addEventListener('click',()=>show(active+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  carousel.addEventListener('mouseenter',()=>pause('hover'));
  carousel.addEventListener('mouseleave',()=>resume('hover'));
  carousel.addEventListener('focusin',()=>pause('focus'));
  carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget))resume('focus');});
  carousel.addEventListener('touchstart',()=>{pause('touch');window.clearTimeout(touchTimer);},{passive:true});
  carousel.addEventListener('touchend',()=>{window.clearTimeout(touchTimer);touchTimer=window.setTimeout(()=>resume('touch'),6000);},{passive:true});
  carousel.addEventListener('touchcancel',()=>{window.clearTimeout(touchTimer);touchTimer=window.setTimeout(()=>resume('touch'),6000);},{passive:true});
  carousel.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();show(active-1);}
    if(event.key==='ArrowRight'){event.preventDefault();show(active+1);}
  });
  document.addEventListener('visibilitychange',()=>document.hidden?pause('hidden'):resume('hidden'));
  schedule();
})();