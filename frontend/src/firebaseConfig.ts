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

    if (supported && typeof window !== 'undefined') {
      return getMessaging(app);
    }
    return null;
  } catch (err) {
    console.error("Firebase Messaging não é suportado neste ambiente (provavelmente falta HTTPS).", err);
    return null;
  }
};