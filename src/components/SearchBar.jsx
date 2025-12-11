import React from 'react';

export default function SearchBar({ value, onChange, t }) {
  return (
    <div className="search-bar">
      <div className="input-with-clear">
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="clear-button"
          aria-label={t('clearSearch')}
          onClick={() => onChange('')}
          disabled={!value}
        >
          ×
        </button>
      </div>
      <div className="search-spacer" aria-hidden="true" />
    </div>
  );
}
