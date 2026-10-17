import React from 'react';
import { Mail, CheckCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '2rem 0',
        color: 'var(--text-muted)',
        fontSize: '0.8125rem'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <span>&copy; {new Date().getFullYear()} <strong>TaskFlow</strong>. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle size={14} color="var(--success)" /> Enterprise Task Management
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
