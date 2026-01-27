import React from 'react';

/**
 * SkeletonLoader - Animated loading placeholder component
 * Provides visual feedback during content loading
 */

export function Skeleton({ width, height, borderRadius = '8px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="14px"
          width={index === lines - 1 ? '60%' : '100%'}
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card skeleton-card ${className}`}>
      <Skeleton height="12px" width="60px" borderRadius="6px" />
      <Skeleton height="20px" width="80%" borderRadius="6px" />
      <SkeletonText lines={2} />
      <div className="skeleton-tags">
        <Skeleton height="24px" width="50px" borderRadius="12px" />
        <Skeleton height="24px" width="70px" borderRadius="12px" />
        <Skeleton height="24px" width="40px" borderRadius="12px" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="kpi-row skeleton-stats">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card kpi skeleton-kpi">
          <Skeleton height="14px" width="60px" borderRadius="4px" />
          <Skeleton height="32px" width="50px" borderRadius="6px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        <Skeleton height="40px" borderRadius="8px" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-table-row">
          <Skeleton height="50px" borderRadius="0" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', count = 6, rows = 5 }) {
  switch (type) {
    case 'grid':
      return <SkeletonGrid count={count} />;
    case 'stats':
      return <SkeletonStats />;
    case 'table':
      return <SkeletonTable rows={rows} />;
    case 'card':
    default:
      return <SkeletonCard />;
  }
}
