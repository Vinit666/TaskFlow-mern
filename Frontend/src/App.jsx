import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import Spinner from './components/common/Loader';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [isNavCreateModalOpen, setIsNavCreateModalOpen] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        <Spinner size={36} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Loading Workspace...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar onOpenCreateModal={() => setIsNavCreateModalOpen(true)} />

      <main style={{ flex: 1 }}>
        {!isAuthenticated ? (
          authView === 'login' ? (
            <LoginPage onNavigateRegister={() => setAuthView('register')} />
          ) : (
            <RegisterPage onNavigateLogin={() => setAuthView('login')} />
          )
        ) : (
          <DashboardPage
            isCreateModalOpen={isNavCreateModalOpen}
            onCloseCreateModal={() => setIsNavCreateModalOpen(false)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
