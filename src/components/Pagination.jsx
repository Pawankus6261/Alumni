import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [12, 24, 48], label = 'records' }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  if (total <= pageSize && !onPageSizeChange) return null;
  const start = total ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, total);
  return <nav className="pagination-bar" aria-label="Pagination">
    <span className="pagination-summary">Showing <b>{start}–{end}</b> of <b>{total}</b> {label}</span>
    <div className="pagination-controls">
      {onPageSizeChange && <label className="pagination-size-label">Rows <select value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))} aria-label="Rows per page">{pageSizeOptions.map(size => <option value={size} key={size}>{size}</option>)}</select></label>}
      <button type="button" className="pagination-button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} aria-label="Previous page"><ChevronLeft size={16} /> <span>Previous</span></button>
      <span className="pagination-page">Page <b>{currentPage}</b> of <b>{pageCount}</b></span>
      <button type="button" className="pagination-button" onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))} disabled={currentPage >= pageCount} aria-label="Next page"><span>Next</span> <ChevronRight size={16} /></button>
    </div>
  </nav>;
}
