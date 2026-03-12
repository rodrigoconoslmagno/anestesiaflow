import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDBfSt_r4Jc8qykcZn_1nS8pKP5C-iX42k",
  authDomain: "anestesiaflow.firebaseapp.com",
  projectId: "anestesiaflow",
  storageBucket: "anestesiaflow.firebasestorage.app",
  messagingSenderId: "890753121550",
  appId: "1:890753121550:web:f6168c7a0e91bff2612b5f",
  measurementId: "G-NNVCSWMTXS"
};

const app = initializeApp(firebaseConfig);
export const getMessagingSafe = async () => {
  try {
    const supported = await isSupported();
  
    const hasSW = 'serviceWorker' in navigator;
    const hasPush = 'PushManager' in window;
    const hasNotification = 'Notification' in window;
  
    if (hasSW && hasPush && hasNotification) {
      const permission = await Notification.requestPermission();
      console.log("Resultado da permissão direta:", permission);
    } else {
      console.error("O Safari diz que falta alguma API acima.");
    }

    if (supported && typeof window !== 'undefined') {
      return getMessaging(app);
    }
    return null;
  } catch (err) {
    console.error("Firebase Messaging não é suportado neste ambiente (provavelmente falta HTTPS).", err);
    return null;
  }
};