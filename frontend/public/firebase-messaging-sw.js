importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDBfSt_r4Jc8qykcZn_1nS8pKP5C-iX42k",
  projectId: "anestesiaflow",
  messagingSenderId: "890753121550",
  appId: "1:890753121550:web:f6168c7a0e91bff2612b5f"
});

const messaging = firebase.messaging();

// Captura a notificação quando o app está em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em background: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});