const CACHE_NAME = 'milharadar-v2';

self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data={title:'MilhaRadar',body:'Encontramos uma atualização nos seus alertas.',url:'/'};
  try { if(event.data) data={...data,...event.data.json()}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,icon:'/icon-192.png',badge:'/icon-192.png',data:{url:data.url||'/'}
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target=event.notification.data?.url||'/';
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const client=list.find(c=>new URL(c.url).origin===self.location.origin);
    return client?client.focus():self.clients.openWindow(target);
  }));
});

self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
