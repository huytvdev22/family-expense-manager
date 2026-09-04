import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  type Firestore 
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Cấu hình Firebase từ biến môi trường (nếu có)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Kiểm tra xem đã có cấu hình Firebase hợp lệ chưa
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Kích hoạt Offline-first Persistence qua IndexedDB Multi-Tab Manager
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });

    auth = getAuth(app);
    console.log('✅ Firebase đã được khởi tạo thành công với Offline Persistence.');
  } catch (err) {
    console.warn('⚠️ Không thể khởi tạo Firebase SDK, chuyển sang chế độ LocalStorage Demo:', err);
  }
} else {
  console.info('ℹ️ Đang chạy ở chế độ Local Demo (Chưa phát hiện VITE_FIREBASE_API_KEY trong .env).');
}

export { app, db, auth };
