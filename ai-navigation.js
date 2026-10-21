// Cross-document reveal for AI links only; ordinary links retain normal navigation.
(() => {
  const root=document.documentElement,key='portfolio-ai-entry';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const native=location.protocol!=='file:'&&'onpageswap'in window&&'onpagereveal'in window;
  root.dataset.aiNavigationMode=native?'native':'fallback';
  let pending=null;
  const aiPage=url=>new URL(url,location.href).pathname.endsWith('/ai.html');
  const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
  const clear=()=>{try{sessionStorage.removeItem(key);}catch{}};
  function configure(entry){
    const width=root.clientWidth,height=innerHeight;
    const left=Math.max(0,Math.min(width,entry.left)),top=Math.max(0,Math.min(height,entry.top));
    root.style.setProperty('--ai-entry-top',top+'px');root.style.setProperty('--ai-entry-left',left+'px');
    root.style.setProperty('--ai-entry-right',Math.max(0,width-left-entry.width)+'px');
    root.style.setProperty('--ai-entry-bottom',Math.max(0,height-top-entry.height)+'px');
    root.style.setProperty('--ai-entry-x',(left+entry.width/2)+'px');root.style.setProperty('--ai-entry-y',(top+entry.height/2)+'px');
  }
  const fragment=/^#ai-entry=([\d.,-]+)$/.exec(location.hash);
  if(fragment&&aiPage(location.href)){
    const values=fragment[1].split(',').map(Number);
    if(values.length===4&&values.every(Number.isFinite)&&!reduced.matches){
      configure({left:values[0],top:values[1],width:values[2],height:values[3]});root.dataset.aiFallback='opening';
      document.addEventListener('animationend',event=>{if(event.target===document.body)root.dataset.aiFallback='complete';},{once:true});
    }
    try{history.replaceState(history.state,'',location.pathname+location.search);}catch{}
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||!aiPage(url.href)||aiPage(location.href)||reduced.matches){pending=null;clear();return;}
    const b=link.getBoundingClientRect();
    pending={left:b.left,top:b.top,width:b.width,height:b.height,at:Date.now()};
    try{sessionStorage.setItem(key,JSON.stringify(pending));}catch{}
    if(!native){event.preventDefault();url.hash='ai-entry='+[b.left,b.top,b.width,b.height].map(v=>v.toFixed(2)).join(',');location.assign(url.href);}
  },true);
  addEventListener('pageswap',event=>{
    if(!event.viewTransition)return;
    const next=event.activation?.entry?.url;
    if(reduced.matches||!pending||!next||!aiPage(next))event.viewTransition.skipTransition();
  });
  addEventListener('pagereveal',event=>{
    const entry=read();clear();
    if(!event.viewTransition)return;
    if(reduced.matches||!entry||Date.now()-entry.at>6000||!aiPage(location.href)){event.viewTransition.skipTransition();return;}
    configure(entry);
    root.dataset.aiEntry='preparing';
    event.viewTransition.ready.then(()=>{root.dataset.aiEntry='running';},()=>{root.dataset.aiEntry='skipped';});
    event.viewTransition.finished.then(()=>{root.dataset.aiEntry='complete';});
  });
  addEventListener('pageshow',()=>{pending=null;});
})();
