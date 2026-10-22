// Reveal internal pages from the clicked link. In-page controls keep their own interaction.
(() => {
 const root=document.documentElement,key='portfolio-page-entry',parameter='__entry';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const native=location.protocol!=='file:'&&'onpageswap'in window&&'onpagereveal'in window;
 root.dataset.navigationMode=native?'native':'fallback';
 let pending=null;
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}};
 const clear=()=>{try{sessionStorage.removeItem(key);}catch{}};
 function configure(entry){
  const width=root.clientWidth,height=innerHeight;
  const left=Math.max(0,Math.min(width,entry.left)),top=Math.max(0,Math.min(height,entry.top));
  root.style.setProperty('--entry-top',top+'px');root.style.setProperty('--entry-left',left+'px');
  root.style.setProperty('--entry-right',Math.max(0,width-left-entry.width)+'px');
  root.style.setProperty('--entry-bottom',Math.max(0,height-top-entry.height)+'px');
  root.style.setProperty('--entry-x',(left+entry.width/2)+'px');root.style.setProperty('--entry-y',(top+entry.height/2)+'px');
 }
 const arrival=new URL(location.href),encoded=arrival.searchParams.get(parameter);
 if(encoded){
  const values=encoded.split(',').map(Number);
  if(values.length===4&&values.every(Number.isFinite)&&!reduced.matches){
   configure({left:values[0],top:values[1],width:values[2],height:values[3]});root.dataset.pageFallback='opening';
   document.addEventListener('animationend',event=>{if(event.target===document.body)root.dataset.pageFallback='complete';});
  }
  arrival.searchParams.delete(parameter);
  try{history.replaceState(history.state,'',arrival.pathname+arrival.search+arrival.hash);}catch{}
 }
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);
  const internal=url.origin===location.origin&&url.pathname.endsWith('.html');
  const samePage=url.pathname===location.pathname&&url.search===location.search;
  if(!internal||samePage||reduced.matches){pending=null;clear();return;}
  const b=link.getBoundingClientRect();
  pending={left:b.left,top:b.top,width:b.width,height:b.height,path:url.pathname,at:Date.now()};
  try{sessionStorage.setItem(key,JSON.stringify(pending));}catch{}
  if(!native){event.preventDefault();url.searchParams.set(parameter,[b.left,b.top,b.width,b.height].map(v=>v.toFixed(2)).join(','));location.assign(url.href);}
 },true);
 addEventListener('pageswap',event=>{
  if(!event.viewTransition)return;
  const next=event.activation?.entry?.url;
  if(reduced.matches||!pending||!next||new URL(next).pathname!==pending.path)event.viewTransition.skipTransition();
 });
 addEventListener('pagereveal',event=>{
  const entry=read();clear();
  if(!event.viewTransition)return;
  if(reduced.matches||!entry||Date.now()-entry.at>6000||entry.path!==location.pathname){event.viewTransition.skipTransition();return;}
  configure(entry);root.dataset.pageEntry='preparing';
  event.viewTransition.ready.then(()=>{root.dataset.pageEntry='running';},()=>{root.dataset.pageEntry='skipped';});
  event.viewTransition.finished.then(()=>{root.dataset.pageEntry='complete';});
 });
 addEventListener('pageshow',()=>{pending=null;});
})();
