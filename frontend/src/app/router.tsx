import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RequireAuth, GuestOnly, RequireAdmin } from '../features/auth/guards.js';
import { Navbar } from '../components/layout/Navbar.tsx';
import { DepositModal } from '../components/wallet/DepositModal.tsx';
import { WithdrawModal } from '../components/wallet/WithdrawModal.tsx';
import { ToastContainer } from '../components/feedback/ToastContainer.tsx';

import { LandingPage } from '../pages/LandingPage.tsx';
import { LoginPage } from '../pages/LoginPage.tsx';
import { RegisterPage } from '../pages/RegisterPage.tsx';
import { LobbyPage } from '../pages/LobbyPage.tsx';
import { DicePage } from '../pages/DicePage.tsx';
import { SlotsPage } from '../pages/SlotsPage.tsx';
import { MinesPage } from '../pages/MinesPage.tsx';
import { WalletPage } from '../pages/WalletPage.tsx';
import { FairnessPage } from '../pages/FairnessPage.tsx';
import { AuditPage } from '../pages/AuditPage.tsx';
import { AdminPage } from '../pages/AdminPage.tsx';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <DepositModal />
      <WithdrawModal />
      <ToastContainer />
    </div>
  );
};

const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/', element: <AppLayout><LandingPage /></AppLayout> },
      { path: '/login', element: <AppLayout><LoginPage /></AppLayout> },
      { path: '/register', element: <AppLayout><RegisterPage /></AppLayout> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/lobby', element: <AppLayout><LobbyPage /></AppLayout> },
      { path: '/dice', element: <AppLayout><DicePage /></AppLayout> },
      { path: '/slots', element: <AppLayout><SlotsPage /></AppLayout> },
      { path: '/mines', element: <AppLayout><MinesPage /></AppLayout> },
      { path: '/wallet', element: <AppLayout><WalletPage /></AppLayout> },
      { path: '/fairness', element: <AppLayout><FairnessPage /></AppLayout> },
      { path: '/audit', element: <AppLayout><AuditPage /></AppLayout> },
      {
        element: <RequireAdmin />,
        children: [
          { path: '/admin', element: <AppLayout><AdminPage /></AppLayout> },
        ],
      },
    ],
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
