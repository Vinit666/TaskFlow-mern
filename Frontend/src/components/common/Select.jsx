import React from 'react';

export const Select = ({
  label,
  id,
  options = [],
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <select
        id={id}
        className="form-control"
        style={{
          cursor: 'pointer',
          borderColor: error ? 'var(--danger)' : undefined
        }}
        required={required}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#111827', color: '#f8fafc' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default Select;
