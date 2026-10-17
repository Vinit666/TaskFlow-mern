import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

export const Pagination = ({
  pagination,
  onPageChange,
  onLimitChange
}) => {
  const { page = 1, totalPages = 1, total = 0, limit = 6, hasNextPage, hasPrevPage } = pagination;

  if (total === 0) return null;

  // Build page numbers array
  const pageNumbers = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="pagination-container">
      {/* Information & Page Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{startRecord}</strong> -{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{endRecord}</strong> of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> tasks
        </span>

        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label htmlFor="per-page-select" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Per page:
            </label>
            <select
              id="per-page-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="form-control"
              style={{
                height: '32px',
                padding: '0 0.5rem',
                fontSize: '0.8125rem',
                width: '65px',
                cursor: 'pointer'
              }}
            >
              <option value="6">6</option>
              <option value="9">9</option>
              <option value="12">12</option>
              <option value="24">24</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.375rem 0.5rem' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="btn btn-secondary btn-sm"
              aria-label="Go to page 1"
            >
              1
            </button>
            {startPage > 2 && <span style={{ padding: '0 0.25rem', color: 'var(--text-muted)' }}>...</span>}
          </>
        )}

        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`btn btn-sm ${num === page ? 'btn-primary' : 'btn-secondary'}`}
            style={{ minWidth: '32px' }}
            aria-label={`Page ${num}`}
            aria-current={num === page ? 'page' : undefined}
          >
            {num}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={{ padding: '0 0.25rem', color: 'var(--text-muted)' }}>...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="btn btn-secondary btn-sm"
              aria-label={`Go to page ${totalPages}`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.375rem 0.5rem' }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
