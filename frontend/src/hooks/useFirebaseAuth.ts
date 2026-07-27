import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { useAuthStore } from '../stores/auth.store.js';
import { apiFetch } from '../lib/api-client.js';

export function useFirebaseAuth() {
  const { setFirebaseUser, setAuthData, resetAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      setFirebaseUser(user);

      if (user) {
        try {
          // Trigger self-healing account bootstrap
          const authData = await apiFetch('/auth/bootstrap', { method: 'POST' });
          setAuthData(authData);
        } catch (error) {
          console.error('Failed to bootstrap account on auth change:', error);
          setInitialized(true);
        }
      } else {
        resetAuth();
      }
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setAuthData, resetAuth, setInitialized]);
}
