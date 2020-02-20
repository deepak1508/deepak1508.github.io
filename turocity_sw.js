/* global navigator */
function getChromeVersion() {
  const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : false;
}

/*
if (self.location.hostname !== 'localhost') {
  if (getChromeVersion() === false || getChromeVersion() > 59) {
    importScripts('sw-workbox.js');
  }
}
*/

importScripts('https://www.gstatic.com/firebasejs/5.8.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.8.4/firebase-messaging.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCRA2qVN9DDWwM4uQDvSj101hkAg-nbuoI',
  authDomain: 'turismocity-1069.firebaseapp.com',
  databaseURL: 'https://turismocity-1069.firebaseio.com',
  projectId: 'turismocity-1069',
  storageBucket: 'turismocity-1069.appspot.com',
  messagingSenderId: '439665506444'
});

const messaging = firebase.messaging();

const prevNotifications = {};
let currentNotification = {};

messaging.setBackgroundMessageHandler((payload) => {
  const { data } = payload;
  if (prevNotifications[data.tag]) {
    return;
  }
  prevNotifications[data.tag] = true;

  data.vibrate = [200, 100, 200, 100, 200, 100, 200];
  data.time_to_live = 60 * 60 * 12;
  data.requireInteraction = true;

  return self.registration.showNotification(data.title, data);
});

self.addEventListener('notificationclick', (event) => {
  const urlToRedirect = currentNotification.click_action || event.notification.data;
  event.notification.close();
  event.waitUntil(self.clients.openWindow(urlToRedirect));

  try {
    let url = '/desktop-notification/click/';
    url += currentNotification.tag ? `${currentNotification.tag}/` : '';
    url += `?${urlToRedirect.split('?')[1]}` || '';
    trackEvt({
      title: currentNotification.title,
      url,
    });
  } catch (e) { /* empty */ }
});

self.addEventListener('foreignfetch', (event) => {
  // The new Request will have credentials omitted by default.
  const noCredentialsRequest = new Request(event.request.url);
  event.respondWith(
    // Replace with your own request logic as appropriate.
    fetch(noCredentialsRequest)
      .catch(() => caches.match(noCredentialsRequest))
      .then(response => ({ response })),
  );
});

function trackEvt({ title, url }) {
  return self.registration.pushManager.getSubscription()
    .then((subscription) => {
      if (subscription === null) {
        throw new Error('No subscription currently available.');
      }
      // Create hit data
      const payloadData = {
        // Version Number
        v: 1,
        dl: `https://${self.location.hostname}${url}`,
        dt: title,
        // Client ID
        cid: subscription.endpoint,
        // Tracking ID
        tid: 'UA-42815003-9',
        // Hit Type
        t: 'pageview',
      };

      // Format hit data into URI
      const payloadString = Object.keys(payloadData)
        .filter((analyticsKey) => {
          return payloadData[analyticsKey];
        })
        .map((analyticsKey) => {
          return `${analyticsKey}=${encodeURIComponent(payloadData[analyticsKey])}`;
        })
        .join('&');

      // Post to Google Analytics endpoint
      return fetch('https://www.google-analytics.com/collect', {
        method: 'post',
        body: payloadString,
      });
    })
    .then((response) => {
      if (!response.ok) {
        return response.text()
          .then((responseText) => {
            throw new Error(
              `Bad response from Google Analytics:\n${response.status}`,
            );
          });
      }
    })
    .catch((err) => {
      console.warn('Unable to send the analytics event', err);
    });

  if (event.data) {
    console.log('This push event has data: ', event.data.text());
  } else {
    console.log('This push event has no data.');
  }
}

self.addEventListener('push', (event) => {
  const data = event.data.json().data;
  currentNotification = data;
  /*
  dejo de trackear impresiones
  const targeturl = data.click_action;
  let url = '/desktop-notification/impresion/';
  url += data.tag ? `${data.tag}/` : '';
  url += targeturl.split('?')[1] || '';
  trackEvt({
    title: data.title,
    url,
  });
  */
});
