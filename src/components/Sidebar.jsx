import React from 'react';

const sections = [
  { key: 'oracle', label: 'Oracle' },
  { key: 'nomenclatures', label: 'Nomenclatures' },
  { key: 'reviewer', label: 'Reviewer' },
  { key: 'quizz', label: 'Quizz' },
];

export default function Sidebar({ activeSection, onSelect, collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="ghost" onClick={onToggle} aria-label="Basculer la sidebar">
          {collapsed ? '➡️' : '⬅️'}
        </button>
        {!collapsed && <h1>Synergo</h1>}
      </div>
      <nav>
        {sections.map((section) => (
          <button
            key={section.key}
            className={`nav-item ${activeSection === section.key ? 'active' : ''}`}
            onClick={() => onSelect(section.key)}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
