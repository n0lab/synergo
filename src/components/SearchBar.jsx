import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <div className="input-with-clear">
        <input
          type="search"
          placeholder="Rechercher par nomenclature..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="clear-button"
          aria-label="Réinitialiser la recherche"
          onClick={() => onChange('')}
          disabled={!value}
        >
          ×
        </button>
      </div>
      <span className="hint">Recherche dynamique sur les tags</span>
    </div>
  );
}
