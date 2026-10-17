import React from 'react';
import { Layers, Clock, Loader2, CheckCircle2 } from 'lucide-react';

export const TaskStats = ({ stats, activeFilter, onSelectFilter }) => {
  const statItems = [
    {
      key: 'all',
      label: 'Total Tasks',
      value: stats?.total || 0,
      icon: Layers,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)'
    },
    {
      key: 'pending',
      label: 'Pending',
      value: stats?.pending || 0,
      icon: Clock,
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.15)'
    },
    {
      key: 'in-progress',
      label: 'In Progress',
      value: stats?.['in-progress'] || 0,
      icon: Loader2,
      color: '#38bdf8',
      bg: 'rgba(6, 182, 212, 0.15)'
    },
    {
      key: 'completed',
      label: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.15)'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}
    >
      {statItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.key;

        return (
          <div
            key={item.key}
            onClick={() => onSelectFilter && onSelectFilter(item.key)}
            className="stat-card"
            style={{
              cursor: onSelectFilter ? 'pointer' : 'default',
              borderColor: isActive ? item.color : undefined,
              boxShadow: isActive ? `0 0 15px ${item.bg}` : undefined
            }}
            role="button"
            tabIndex={0}
            id={`stat-card-${item.key}`}
          >
            <div>
              <span className="stat-label">{item.label}</span>
              <div className="stat-val">
                {item.value}
              </div>
            </div>
            <div
              className="stat-icon"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: item.color
              }}
            >
              <Icon size={22} color={item.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskStats;
