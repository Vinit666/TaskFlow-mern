import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 24, className = '' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Loader2
        size={size}
        className={`spin-slow ${className}`}
        style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }}
      />
    </div>
  );
};

export const TaskCardSkeleton = () => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '80px', height: '22px' }} />
        <div className="skeleton" style={{ width: '60px', height: '22px' }} />
      </div>
      <div className="skeleton" style={{ width: '70%', height: '20px' }} />
      <div className="skeleton" style={{ width: '90%', height: '14px' }} />
      <div className="skeleton" style={{ width: '50%', height: '14px' }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="skeleton" style={{ width: '90px', height: '14px' }} />
        <div className="skeleton" style={{ width: '70px', height: '28px' }} />
      </div>
    </div>
  );
};

export default Spinner;
