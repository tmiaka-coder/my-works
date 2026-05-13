import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)

const provider = new GoogleAuthProvider()

/** Googleログイン */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  return result.user
}

/** ログアウト */
export async function logout() {
  await signOut(auth)
}

/** 認証状態を監視してユーザーを返す */
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

/** 許可リストチェック */
export async function isAllowedUser(uid) {
  const snap = await getDoc(doc(db, 'allowedUsers', uid))
  return snap.exists()
}