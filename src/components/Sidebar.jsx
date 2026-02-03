import React from 'react';
import {
  Sparkles,
  Tags,
  ClipboardList,
  HelpCircle,
  BarChart3,
  Settings,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';

const iconMap = {
  oracle: Sparkles,
  nomenclatures: Tags,
  reviewer: ClipboardList,
  quizz: HelpCircle,
  statistics: BarChart3,
  settings: Settings,
};

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
  counts = {},
}) {
  return (
    <aside
      className={`sidebar glass ${collapsed ? 'collapsed' : ''}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="sidebar-header">
        <button
          className="ghost icon-btn"
          onClick={onPinToggle}
          aria-label={t('sidebarLock')}
        >
          {pinned ? <Lock size={18} /> : <Unlock size={18} />}
        </button>
        {!collapsed && (
          <div className="sidebar-brand">
            <span className="brand-icon">
              <Sparkles size={24} className="brand-sparkle" />
            </span>
            <h1>Synergo</h1>
          </div>
        )}
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => {
          const IconComponent = iconMap[section.key] || Sparkles;
          const count = counts[section.key];
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(section.key)}
              title={collapsed ? section.label : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                <IconComponent size={20} />
              </span>
              {!collapsed && (
                <>
                  <span className="nav-label">{section.label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="nav-count">{count}</span>
                  )}
                  <ChevronRight size={16} className="nav-arrow" />
                </>
              )}
              {isActive && <span className="nav-active-indicator" />}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="version-info">
            <span className="version-badge">v1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}
