import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Rechercher par nomenclature..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="hint">Recherche dynamique sur les tags</span>
    </div>
  );
}
