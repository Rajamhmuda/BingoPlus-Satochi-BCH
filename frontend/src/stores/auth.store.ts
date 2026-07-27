import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'player' | 'admin';
  createdAt: number;
}

export interface UserBalance {
  availableSats: number;
  lockedSats: number;
  lifetimeDepositedSats: number;
  lifetimeWithdrawnSats: number;
  lifetimeWageredSats: number;
  lifetimeWonSats: number;
}

export interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  walletAddress: string | null;
  balance: UserBalance | null;
  initialized: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setAuthData: (data: any) => void;
  updateBalance: (balance: Partial<UserBalance>) => void;
  setInitialized: (initialized: boolean) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  walletAddress: null,
  balance: null,
  initialized: false,

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),

  setAuthData: (data: any) => {
    if (!data) return;
    const address = data.wallet?.address || data.walletAddress || data.address || null;
    set({
      profile: data.profile || null,
      walletAddress: address,
      balance: data.balance || null,
      initialized: true,
    });
  },

  updateBalance: (newBalance) =>
    set((state) => ({
      balance: state.balance ? { ...state.balance, ...newBalance } : (newBalance as UserBalance),
    })),

  setInitialized: (initialized) => set({ initialized }),

  resetAuth: () =>
    set({
      firebaseUser: null,
      profile: null,
      walletAddress: null,
      balance: null,
      initialized: true,
    }),
}));
