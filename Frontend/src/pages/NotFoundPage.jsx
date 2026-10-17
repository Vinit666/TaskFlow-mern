import React from 'react';
import Button from '../components/common/Button';
import { Home } from 'lucide-react';

export const NotFoundPage = ({ onGoHome }) => {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem'
      }}
    >
      <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
        404
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button variant="primary" icon={Home} onClick={onGoHome}>
        Back to Dashboard
      </Button>
    </div>
  );
};

export default NotFoundPage;
