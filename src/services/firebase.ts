import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore,
  type Firestore
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

// Lấy cấu hình từ biến môi trường
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Kiểm tra xem Firebase đã được cấu hình đầy đủ chưa
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'AIzaSy...' &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Kích hoạt bộ đệm ngoại tuyến IndexedDB (Offline Persistence) cho PWA
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // Fallback nếu đã khởi tạo trước đó
      db = getFirestore(app);
    }

    auth = getAuth(app);
  } catch (error) {
    console.warn('Lỗi khởi tạo Firebase SDK, chuyển sang chế độ Mock:', error);
  }
}

/**
 * Lấy đối tượng Firebase Messaging khi môi trường trình duyệt hỗ trợ
 */
export async function getFirebaseMessaging() {
  if (!app) return null;
  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) {
      console.warn('Trình duyệt hiện tại không hỗ trợ Web Push Messaging');
      return null;
    }
    return getMessaging(app);
  } catch (err) {
    console.warn('Không thể khởi tạo Firebase Messaging:', err);
    return null;
  }
}

export { app, db, auth, googleProvider, firebaseConfig };

