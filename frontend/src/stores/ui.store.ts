import { create } from 'zustand';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface UIState {
  depositModalOpen: boolean;
  withdrawModalOpen: boolean;
  toasts: ToastNotification[];
  openDepositModal: () => void;
  closeDepositModal: () => void;
  openWithdrawModal: () => void;
  closeWithdrawModal: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  depositModalOpen: false,
  withdrawModalOpen: false,
  toasts: [],

  openDepositModal: () => set({ depositModalOpen: true }),
  closeDepositModal: () => set({ depositModalOpen: false }),

  openWithdrawModal: () => set({ withdrawModalOpen: true }),
  closeWithdrawModal: () => set({ withdrawModalOpen: false }),

  addToast: (type, message) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
