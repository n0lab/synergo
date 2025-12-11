import React from 'react';

const sections = [
  { key: 'oracle', label: 'Oracle', icon: '🔮' },
  { key: 'nomenclatures', label: 'Nomenclatures', icon: '🏷️' },
  { key: 'reviewer', label: 'Reviewer', icon: '📝' },
  { key: 'quizz', label: 'Quizz', icon: '❓' },
];

export default function Sidebar({
  activeSection,
  onSelect,
  collapsed,
  pinned,
  onPinToggle,
  onHoverStart,
  onHoverEnd,
}) {
  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="sidebar-header">
        <button className="ghost" onClick={onPinToggle} aria-label="Verrouiller l'ouverture du menu">
          {pinned ? '🔒' : '🔓'}
        </button>
        {!collapsed && <h1>Synergo</h1>}
      </div>
      <nav>
        {sections.map((section) => (
          <button
            key={section.key}
            className={`nav-item ${activeSection === section.key ? 'active' : ''}`}
            onClick={() => onSelect(section.key)}
            title={collapsed ? section.label : undefined}
          >
            <span className="icon" aria-hidden="true">
              {section.icon}
            </span>
            {!collapsed && <span className="label">{section.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
