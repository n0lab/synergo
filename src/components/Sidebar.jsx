import React from 'react';

export default function Sidebar({
  sections,
  activeSection,
  onSelect,
  collapsed,
  pinned,
  onPinToggle,
  onHoverStart,
  onHoverEnd,
  t,
}) {
  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="sidebar-header">
        <button className="ghost" onClick={onPinToggle} aria-label={t('sidebarLock')}>
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
