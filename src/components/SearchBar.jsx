import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, t }) {
  return (
    <div className="search-bar">
      <div className="input-with-clear">
        <Search size={18} className="search-icon" style={{
          position: 'absolute',
          left: '12px',
          color: 'var(--muted)',
          pointerEvents: 'none'
        }} />
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
        <button
          type="button"
          className="clear-button"
          aria-label={t('clearSearch')}
          onClick={() => onChange('')}
          disabled={!value}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
