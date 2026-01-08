import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 1. 앨범 도구 가져오기

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // 앨범 주소 자동 설정
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
};

// Firebase 시작!
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); // 👈 2. 앨범(Storage) 내보내기 (이게 없어서 에러가 났던 거예요!)