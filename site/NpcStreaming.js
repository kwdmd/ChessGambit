(function(){
window.capstoneNpcFetch=async function(entry,send){
 const compressed=typeof DecompressionStream==='function',file=compressed?entry.file:entry.rawFile,expected=compressed?entry.sha256:entry.rawSha256,total=compressed?entry.bytes:entry.rawBytes,url=new URL('NPC/'+file,location.href).href;
 let cache;try{cache=await caches.open('chessgambit-npc-v1');}catch{}
 try{
  let response=cache?await cache.match(url):null,bytes;
  if(response){bytes=await response.arrayBuffer();if(crypto.subtle){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==expected){await cache.delete(url);bytes=null;}}}
  if(!bytes){const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),120000);try{
   response=await fetch(url,{signal:abort.signal});if(!response.ok)throw Error('HTTP '+response.status);
   const reader=response.body.getReader(),parts=[];let length=0,last=0;
   while(true){const chunk=await reader.read();if(chunk.done)break;parts.push(chunk.value);length+=chunk.value.length;if(performance.now()-last>180){send('DownloadProgress',String(Math.min(.99,length/total)));last=performance.now();}}
   const data=new Uint8Array(length);let offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}bytes=data.buffer;
   if(crypto.subtle){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==expected)throw Error('NPC file integrity mismatch');}
   if(cache){try{await cache.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}}
  }finally{clearTimeout(timeout);}}
  send('DownloadProgress','1');
  const payload=compressed?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():bytes;
  const blob=URL.createObjectURL(new Blob([payload],{type:'application/octet-stream'}));send('DownloadReady',JSON.stringify({url:blob}));
 }catch(error){send('DownloadReady',JSON.stringify({error:String(error)}));}
};
})();
