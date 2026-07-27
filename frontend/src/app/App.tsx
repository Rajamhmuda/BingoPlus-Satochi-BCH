import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth.js';
import { AppRouter } from './router.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  useFirebaseAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
};
