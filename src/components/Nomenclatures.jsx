import React, { useEffect, useMemo, useState } from 'react';
import StatsCard from './StatsCard.jsx';

export default function Nomenclatures({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onNavigate,
  isNomenclatureUsed,
  t,
  language,
}) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftInterpretation, setDraftInterpretation] = useState('');
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedLabels, setExpandedLabels] = useState(() => new Set());
  const [collapseAllRequested, setCollapseAllRequested] = useState(false);

  const totalNomenclatures = items.length;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.label.localeCompare(b.label, language ?? 'fr'));
  }, [items, language]);

  const parentLabel = (label) => {
    const separatorIndex = label.lastIndexOf('_');
    if (separatorIndex === -1) return null;
    return label.slice(0, separatorIndex);
  };

  const matchItem = (item, needle) => {
    const lowered = needle.toLowerCase();
    return (
      item.label.toLowerCase().includes(lowered) ||
      (item.description || '').toLowerCase().includes(lowered) ||
      (item.interpretation || '').toLowerCase().includes(lowered)
    );
  };

  const tree = useMemo(() => {
    const nodeByLabel = new Map();
    sortedItems.forEach((item) => {
      nodeByLabel.set(item.label, { item, children: [] });
    });

    const roots = [];
    sortedItems.forEach((item) => {
      const parent = parentLabel(item.label);
      const node = nodeByLabel.get(item.label);
      const parentNode = parent ? nodeByLabel.get(parent) : null;
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => a.item.label.localeCompare(b.item.label, language ?? 'fr'));
      nodes.forEach((node) => sortNodes(node.children));
    };

    sortNodes(roots);
    return roots;
  }, [sortedItems, language]);

  const { filteredTree, autoExpandedLabels } = useMemo(() => {
    const needle = query.trim();
    if (!needle) {
      return {
        filteredTree: tree.map((node) => ({ ...node, isMatch: false })),
        autoExpandedLabels: new Set(),
      };
    }

    const expansions = new Set();

    const filterNodes = (nodes, ancestors = []) => {
      return nodes
        .map((node) => {
          const isMatch = matchItem(node.item, needle);
          const filteredChildren = filterNodes(node.children, [...ancestors, node.item.label]);
          const keepNode = isMatch || filteredChildren.length > 0;

          if (keepNode) {
            if (isMatch) {
              ancestors.forEach((ancestorLabel) => expansions.add(ancestorLabel));
            }
            if (filteredChildren.length > 0) {
              expansions.add(node.item.label);
            }
          }

          return keepNode ? { ...node, children: filteredChildren, isMatch } : null;
        })
        .filter(Boolean);
    };

    return { filteredTree: filterNodes(tree), autoExpandedLabels: expansions };
  }, [query, tree]);

  useEffect(() => {
    setCollapseAllRequested(false);
  }, [query]);

  const resolvedExpandedLabels = useMemo(() => {
    const combined = new Set(expandedLabels);
    if (query.trim() && !collapseAllRequested) {
      autoExpandedLabels.forEach((label) => combined.add(label));
    }
    return combined;
  }, [autoExpandedLabels, collapseAllRequested, expandedLabels, query]);

  const collectExpandableLabels = (nodes, collected = []) => {
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        collected.push(node.item.label);
        collectExpandableLabels(node.children, collected);
      }
    });
    return collected;
  };

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setInterpretation('');
    setError('');
  };

  const validateLabel = (candidate, excludeId) => {
    const trimmed = candidate.trim();
    if (!trimmed) {
      setError(t('nomenclatureErrorEmpty'));
      return null;
    }
    const exists = items.some(
      (item) => item.id !== excludeId && item.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(t('nomenclatureErrorExists'));
      return null;
    }
    return trimmed;
  };

  const handleAdd = (event) => {
    event.preventDefault();
    const validLabel = validateLabel(label);
    if (!validLabel) return;
    onAdd({ label: validLabel, description: description.trim(), interpretation: interpretation.trim() });
    resetForm();
    setShowAddModal(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraftLabel(item.label);
    setDraftDescription(item.description ?? '');
    setDraftInterpretation(item.interpretation ?? '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftLabel('');
    setDraftDescription('');
    setDraftInterpretation('');
    setError('');
  };

  const saveEdit = () => {
    const validLabel = validateLabel(draftLabel, editingId);
    if (!validLabel) return;
    onUpdate(editingId, {
      label: validLabel,
      description: draftDescription.trim(),
      interpretation: draftInterpretation.trim(),
    });
    cancelEdit();
  };

  const handleEditKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
    }
  };

  const requestDelete = (item) => {
    if (isNomenclatureUsed?.(item.label)) {
      setError(t('nomenclatureDeleteBlocked'));
      return;
    }

    const confirmed = window.confirm(t('nomenclatureConfirmDelete', { label: item.label }));
    if (confirmed) {
      setError('');
      onDelete(item.id);
    }
  };

  const toggleExpansion = (label) => {
    setExpandedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
    setCollapseAllRequested(false);
  };

  const toggleAll = () => {
    const hasExpanded = resolvedExpandedLabels.size > 0;
    if (hasExpanded) {
      setExpandedLabels(new Set());
      setCollapseAllRequested(true);
    } else {
      const labelsToExpand = collectExpandableLabels(filteredTree);
      setExpandedLabels(new Set(labelsToExpand));
      setCollapseAllRequested(false);
    }
  };

  const renderNode = (node, depth = 0) => {
    const isEditing = editingId === node.item.id;
    const isDescriptionMissing = !node.item.description?.trim();
    const isInterpretationMissing = !node.item.interpretation?.trim();
    const labelStatusClass =
      isDescriptionMissing && isInterpretationMissing
        ? 'nomenclature-label-missing-all'
        : isDescriptionMissing || isInterpretationMissing
          ? 'nomenclature-label-partial'
          : '';
    const hasChildren = node.children.length > 0;
    const isExpanded = resolvedExpandedLabels.has(node.item.label);

    return (
      <li key={node.item.id} className="nomenclature-node">
        <div className="nomenclature-node-row" style={{ '--depth': depth }}>
          <div className="nomenclature-node-main">
            {hasChildren ? (
              <button
                type="button"
                className="nomenclature-toggle"
                onClick={() => toggleExpansion(node.item.label)}
                aria-label={
                  isExpanded
                    ? t('nomenclatureCollapse', { label: node.item.label })
                    : t('nomenclatureExpand', { label: node.item.label })
                }
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="nomenclature-toggle placeholder" aria-hidden="true">
                •
              </span>
            )}
            <div className="nomenclature-node-content">
              <div className="nomenclature-node-header">
                {isEditing ? (
                  <input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    aria-label={t('nomenclatureLabel')}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate?.(node.item.label)}
                    aria-label={t('searchNomenclature', { label: node.item.label })}
                    data-status={labelStatusClass}
                    data-missing-description={isDescriptionMissing}
                    data-missing-interpretation={isInterpretationMissing}
                    className={`badge link ${labelStatusClass} ${node.isMatch ? 'is-match' : ''}`.trim()}
                  >
                    {node.item.label}
                  </button>
                )}
                <div className="nomenclature-actions">
                  {isEditing ? (
                    <div className="action-group">
                      <button className="primary" onClick={saveEdit}>{t('save')}</button>
                      <button className="ghost" type="button" onClick={cancelEdit}>
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="action-group">
                      <button className="ghost soft" type="button" onClick={() => startEdit(node.item)}>
                        {t('edit')}
                      </button>
                      <button className="ghost" type="button" onClick={() => requestDelete(node.item)}>
                        {t('delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="nomenclature-node-details">
                <div className="detail">
                  <p className="detail-label">{t('nomenclatureDescription')}</p>
                  {isEditing ? (
                    <input
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      aria-label={t('nomenclatureDescription')}
                    />
                  ) : (
                    <span className="muted nomenclature-description" title={node.item.description || '—'}>
                      {node.item.description || '—'}
                    </span>
                  )}
                </div>
                <div className="detail">
                  <p className="detail-label">{t('nomenclatureInterpretation')}</p>
                  {isEditing ? (
                    <input
                      value={draftInterpretation}
                      onChange={(e) => setDraftInterpretation(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      aria-label={t('nomenclatureInterpretation')}
                    />
                  ) : (
                    <span className="muted nomenclature-description" title={node.item.interpretation || '—'}>
                      {node.item.interpretation || '—'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <ul className="nomenclature-children">{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <div className="nomenclature-page oracle">
      <div className="header-row">
        <div>
          <h2>{t('nomenclaturePageTitle')}</h2>
          <p>{t('nomenclaturePageSubtitle')}</p>
        </div>
        <div className="kpi-row">
          <button className="ghost success" type="button" onClick={openAddModal}>
            {t('nomenclatureAdd')}
          </button>
          <StatsCard
            label={t('nomenclatureTotalLabel')}
            value={totalNomenclatures}
            accent="#2cb67d"
          />
        </div>
      </div>

      <div className="nomenclature-toolbar oracle-toolbar">
        <div className="field-group wide">
          <div className="input-with-clear">
            <input
              id="nomenclature-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('nomenclatureSearchPlaceholder')}
              aria-label={t('nomenclatureSearchLabel')}
            />
            <button
              type="button"
              className="clear-button"
              aria-label={t('nomenclatureClearFilter')}
              onClick={() => setQuery('')}
              disabled={!query}
            >
              ×
            </button>
          </div>
        </div>
        <button className="ghost soft" type="button" onClick={toggleAll} disabled={sortedItems.length === 0}>
          {resolvedExpandedLabels.size > 0
            ? t('nomenclatureCollapseAll')
            : t('nomenclatureExpandAll')}
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}

      {showAddModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={handleAdd}>
            <h3>{t('nomenclatureAddTitle')}</h3>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-label">{t('nomenclatureLabel')}</label>
              <input
                id="modal-nomenclature-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('nomenclatureAddExample')}
                autoFocus
              />
            </div>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-description">{t('nomenclatureDescription')}</label>
              <input
                id="modal-nomenclature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('nomenclatureAddDescriptionPlaceholder')}
              />
            </div>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-interpretation">{t('nomenclatureInterpretation')}</label>
              <input
                id="modal-nomenclature-interpretation"
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                placeholder={t('nomenclatureAddInterpretationPlaceholder')}
              />
            </div>
            <div className="action-group end">
              <button className="ghost" type="button" onClick={closeAddModal}>
                {t('cancel')}
              </button>
              <button className="primary" type="submit">
                {t('add')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="nomenclature-tree-container">
        {filteredTree.length === 0 ? (
          <div className="muted empty-tree" role="status">
            {t('noNomenclatureRows')}
          </div>
        ) : (
          <ul className="nomenclature-tree">{filteredTree.map((node) => renderNode(node))}</ul>
        )}
      </div>
    </div>
  );
}
