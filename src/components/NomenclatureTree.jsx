import React, { useMemo } from 'react';

const buildTree = (items) => {
  const nodesByLabel = new Map();
  const childLabels = new Set();

  const getOrCreate = (label) => {
    if (!nodesByLabel.has(label)) {
      nodesByLabel.set(label, {
        label,
        description: '',
        interpretation: '',
        children: [],
      });
    }
    return nodesByLabel.get(label);
  };

  (items ?? []).forEach((item) => {
    const segments = item.label?.split('_').filter(Boolean) ?? [];
    if (segments.length === 0) return;

    segments.forEach((_, index) => {
      const currentLabel = segments.slice(0, index + 1).join('_');
      const node = getOrCreate(currentLabel);

      if (index === segments.length - 1) {
        node.description = item.description || node.description;
        node.interpretation = item.interpretation || node.interpretation;
      }

      if (index > 0) {
        const parentLabel = segments.slice(0, index).join('_');
        const parent = getOrCreate(parentLabel);
        childLabels.add(currentLabel);

        if (!parent.children.some((child) => child.label === currentLabel)) {
          parent.children.push(node);
        }
      }
    });
  });

  const roots = Array.from(nodesByLabel.values()).filter((node) => !childLabels.has(node.label));

  const sortByLabel = (a, b) => a.label.localeCompare(b.label);
  const sortDeep = (list) =>
    list
      .slice()
      .sort(sortByLabel)
      .map((node) => ({ ...node, children: sortDeep(node.children) }));

  return { roots: sortDeep(roots), totalNodes: nodesByLabel.size };
};

function TreeNode({ node, depth }) {
  return (
    <div className={`tree-node ${depth > 0 ? 'has-parent' : ''}`}>
      <div className="tree-box">
        <div className="tree-label-row">
          <span className="badge">{node.label}</span>
          {node.children.length > 0 && (
            <span className="tree-children-count">{node.children.length}</span>
          )}
        </div>
        {(node.description || node.interpretation) && (
          <div className="tree-texts">
            {node.description && <p className="muted tree-description">{node.description}</p>}
            {node.interpretation && (
              <p className="tree-interpretation">{node.interpretation}</p>
            )}
          </div>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.label} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NomenclatureTree({ items, t }) {
  const { roots, totalNodes } = useMemo(() => buildTree(items), [items]);

  return (
    <div className="tree-page">
      <div className="header-row">
        <div>
          <h2>{t('treeTitle')}</h2>
          <p className="muted">{t('treeSubtitle')}</p>
        </div>
        <div className="tree-counters">
          <span className="badge">{t('treeNomenclatureTotal', { label: items.length })}</span>
          <span className="badge ghost">{t('treeNodeTotal', { label: totalNodes })}</span>
        </div>
      </div>

      <div className="tree-diagram card">
        {roots.length === 0 ? (
          <div className="muted">{t('treeEmpty')}</div>
        ) : (
          roots.map((root) => <TreeNode key={root.label} node={root} depth={0} />)
        )}
      </div>
    </div>
  );
}
