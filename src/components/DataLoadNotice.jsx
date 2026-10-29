import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

export default function DataLoadNotice({ label = 'This information', onRetry, loading = false }) {
  return (
    <div className={`data-load-notice${loading ? ' is-loading' : ''}`} role="status" aria-live="polite" aria-busy={loading}>
      <span className="data-load-notice-icon">{loading ? <RefreshCw size={17} className="data-load-spinning" aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}</span>
      <div className="data-load-notice-copy">
        <strong>{loading ? `Refreshing ${label.toLowerCase()}…` : `${label} couldn’t load right now`}</strong>
        <span>{loading ? 'Checking the connection and loading the latest data.' : 'There’s a temporary connection issue. Please try again.'}</span>
      </div>
      {onRetry && <button type="button" onClick={onRetry} disabled={loading}><RefreshCw size={14} className={loading ? 'data-load-spinning' : ''} />{loading ? 'Retrying…' : 'Retry'}</button>}
    </div>
  );
}
