(function(){
  'use strict';
  const carousel=document.getElementById('scp-home-carousel');
  if(!carousel)return;
  const slides=Array.from(carousel.querySelectorAll('[data-scp-slide]'));
  const dots=Array.from(carousel.querySelectorAll('[data-scp-dot]'));
  const previous=carousel.querySelector('.lp-scp-carousel-prev');
  const next=carousel.querySelector('.lp-scp-carousel-next');
  if(slides.length!==4||dots.length!==4||!previous||!next)return;
  let active=0;
  let timer=null;
  let touchTimer=null;
  const pauses=new Set();
  const duration=()=>Number(slides[active].dataset.scpDuration)||6000;
  const schedule=()=>{
    window.clearTimeout(timer);
    if(pauses.size||document.hidden)return;
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