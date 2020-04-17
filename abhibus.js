"use strict";
const APP = 'Abhibus'
const APPDIR = "/"
const hosts =  [ "static.abhibus.com", "www.abhibus.com","fonts.googleapis.com"]
const CACHENAME = 'ABRSv237'
const CDN = "https://static.abhibus.com"+APPDIR
const SwCacheConfig = {
  precache : [
    APPDIR+'css/style.css',
    APPDIR+'css/jquery-ui.css',
    APPDIR+'css/mb/mb.css',
    APPDIR+'js/masterScript.js',
    APPDIR+'js/master.script.js',
    APPDIR+'js/stations_script.js',
    APPDIR+'js/libs/jquery-ui.min.js',
    APPDIR+'js/jquery.validate.js',
    APPDIR+'js/jquery.plugins.js',
    APPDIR+'jscript/validation.js',
    APPDIR+'favicon.ico',
    APPDIR+'manifest.json',
  ], 
  strategy: [
      {
        type: "prefer-cache",
        matches: [
          /(\/css\/){1}(\S)+(\.css){1}/,
          /(\/js\/){1}(\S)+(\.js){1}/,
          /(\/img\/){1}(\S)+(\.png|\.jpg|\.gif){1}/,
          /(\/jscript\/){1}(\S)+(\.js){1}/,
          /(\S)+(\.woff){1}/,
          /(\S)+(\.woff2){1}/
        ]
      },
      {
        type: "excludes",
        matches: [
          /(\S)+(sw\.js){1}/,
          /(\S)+(init\.js){1}/, 
		  /(\S)+(psgrInfo\.js){1}/, 
          /(\S)+(init-sw\.js){1}/
        ]
      },
  ] 
}
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
            if (key !== CACHENAME) {
              console.log('[ServiceWorker] Removing old cache', key);
              return caches.delete(key);
            }
          }));
        })
    );
});
self.addEventListener('active', (event) => {
    event.waitUntil(
        caches.open(CACHENAME).then((cache) => {
            return cache.addAll(SwCacheConfig.precache)
        })
    );
});
let SwCache =  {
  install : (event) => {
    event.waitUntil(
      caches.open(CACHENAME).then((cache) => {
        return cache.addAll(SwCacheConfig.precache)
      })
    )
  },
  activate : (event) => {
    event.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => { 
          if (key !== CACHENAME) {      
                return caches.delete(key)
              }
        }))
      })
    )
    return this.clients.claim()
  },
  fetch : (event) => {
    const url = new URL(event.request.url)
    let isReady = false
    SwCacheConfig.strategy.forEach((strategy) => {
      if(strategy.type == "prefer-cache") {
        strategy.matches.forEach((exp) => {
          if(exp.test(url.pathname)) {
            isReady = true
          } 
        })
      }
      if(strategy.type == "excludes" ) {
        strategy.matches.forEach((exp) => {
          if(exp.test(url.pathname)) {
            isReady = false
          } 
        })
      }
    })
    if(hosts.indexOf(url.hostname) >= 0 
          && isReady === true
      ) {
        event.respondWith(
          caches.open(CACHENAME).then((cache) => {  
            return cache.match(url.pathname, {ignoreVary:true, ignoreSearch: true}).then((response) => { 
              if(response != undefined ) {
                return response
              } else {
                return fetch(event.request).then((resp) => {
                  cache.put(url.pathname, resp.clone())
                  return resp
                })
              }          
            })  
          })
        )
      }
  }
}
// this.addEventListener('install', SwCache.install)
// this.addEventListener('activate', SwCache.activate)
this.addEventListener('fetch', SwCache.fetch)
var cid = "fcfbf016-9958-4cc7-8d7a-360584a14f00"
//importScripts("https://cdn-jp.gsecondscreen.com/static/webpushsw.js?cid=fcfbf016-9958-4cc7-8d7a-360584a14f00")
importScripts('https://s3-eu-west-1.amazonaws.com/static.wizrocket.com/js/sw_webpush.js');// remove CleverTap server worker from your root folder
