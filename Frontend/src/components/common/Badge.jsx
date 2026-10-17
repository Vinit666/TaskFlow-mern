import React from 'react';
import { Clock, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Shield } from 'lucide-react';

export const Badge = ({ type = 'status', value }) => {
  if (!value) return null;

  if (type === 'status') {
    switch (value) {
      case 'pending':
        return (
          <span className="badge badge-pending">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="badge badge-in-progress">
            <Loader2 size={12} className="spin-slow" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-completed">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      default:
        return <span className="badge badge-pending">{value}</span>;
    }
  }

  if (type === 'priority') {
    switch (value) {
      case 'low':
        return (
          <span className="badge badge-low">
            <Shield size={12} />
            Low
          </span>
        );
      case 'medium':
        return (
          <span className="badge badge-medium">
            <AlertTriangle size={12} />
            Medium
          </span>
        );
      case 'high':
        return (
          <span className="badge badge-high">
            <AlertCircle size={12} />
            High
          </span>
        );
      default:
        return <span className="badge badge-medium">{value}</span>;
    }
  }

  return <span className="badge">{value}</span>;
};

export default Badge;
