import React, { useMemo } from 'react';

function deriveParentLabel(label) {
  const segments = label.split('_');
  if (segments.length <= 1) return null;
  return segments.slice(0, -1).join('_');
}

function buildTree(items) {
  const nodeByLabel = new Map();

  const ensureNode = (label, source) => {
    if (!nodeByLabel.has(label)) {
      nodeByLabel.set(label, {
        id: source?.id ?? `virtual-${label}`,
        label,
        description: source?.description ?? '',
        interpretation: source?.interpretation ?? '',
        children: [],
        virtual: !source,
      });
    } else if (source) {
      // Enrich placeholder node with real data when available.
      const existing = nodeByLabel.get(label);
      nodeByLabel.set(label, {
        ...existing,
        ...source,
        children: existing.children,
        virtual: false,
      });
    }
    return nodeByLabel.get(label);
  };

  items.forEach((item) => {
    ensureNode(item.label, item);
  });

  const linkToParents = (label) => {
    const parentLabel = deriveParentLabel(label);
    if (!parentLabel) return;

    const childNode = ensureNode(label);
    const parentNode = ensureNode(parentLabel);

    const alreadyLinked = parentNode.children.some((entry) => entry.label === childNode.label);
    if (!alreadyLinked) {
      parentNode.children.push(childNode);
    }

    linkToParents(parentLabel);
  };

  items.forEach((item) => {
    linkToParents(item.label);
  });

  const allNodes = Array.from(nodeByLabel.values());
  const roots = allNodes.filter((node) => {
    const parentLabel = deriveParentLabel(node.label);
    return !parentLabel || !nodeByLabel.has(parentLabel);
  });

  const sortBranch = (node) => {
    node.children.sort((a, b) => a.label.localeCompare(b.label));
    node.children.forEach(sortBranch);
  };

  roots.forEach(sortBranch);

  return roots.sort((a, b) => a.label.localeCompare(b.label));
}

function TreeNode({ node }) {
  return (
    <li className="tree-node">
      <div className="tree-box">
        <div className="tree-label">{node.label}</div>
        <div className="tree-field muted" title={node.description || '—'}>
          {node.description || '—'}
        </div>
        <div className="tree-field" title={node.interpretation || '—'}>
          {node.interpretation || '—'}
        </div>
      </div>
      {node.children.length > 0 && (
        <ul className="tree-children">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function NomenclatureTree({ items, t }) {
  const roots = useMemo(() => buildTree(items), [items]);

  return (
    <div className="nomenclature-tree-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('treeEyebrow')}</p>
          <h2 className="title">{t('treeTitle')}</h2>
          <p className="muted">{t('treeSubtitle')}</p>
        </div>
      </div>

      <div className="card">
        {roots.length === 0 ? (
          <div className="muted">{t('treeEmpty')}</div>
        ) : (
          <div className="nomenclature-tree">
            <ul className="tree-root">
              {roots.map((node) => (
                <TreeNode key={node.id} node={node} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
