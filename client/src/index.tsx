import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import RoutesComponent from './app.tsx';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';
import { AuthProvider } from '@/auth/AuthProvider';

const CLIENT_BASE_PATH = import.meta.env.VITE_CLIENT_BASE_PATH || '/';

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <AuthProvider>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <main className="grid min-h-screen place-items-center bg-background p-6">
              <div className="max-w-md rounded-xl border bg-card p-6 shadow-sm">
                <h1 className="text-lg font-semibold">页面暂时无法显示</h1>
                <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
                <button className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={resetErrorBoundary}>重新加载</button>
              </div>
            </main>
          )}
        >
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
