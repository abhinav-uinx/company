'use client';
import React from 'react';

export default function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="skeleton-row">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} style={{ padding: '16px' }}>
              <div className="skeleton-cell" style={{ 
                width: cIdx === 0 ? '70%' : cIdx === cols - 1 ? '40%' : '100%', 
                animationDelay: `${(rIdx * 0.1)}s` 
              }}></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
