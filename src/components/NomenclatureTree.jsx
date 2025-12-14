import React, { useMemo } from 'react';

const getParentLabel = (label) => {
  const index = label.lastIndexOf('_');
  if (index === -1) return null;
  return label.slice(0, index);
};

function buildTree(items) {
  const nodes = new Map();

  const upsertNode = (label) => {
    const existing = nodes.get(label);
    if (existing) return existing;
    const source = items.find((entry) => entry.label === label);
    const node = {
      id: source?.id ?? `virtual-${label}`,
      label,
      description: source?.description ?? '',
      interpretation: source?.interpretation ?? '',
      children: [],
    };
    nodes.set(label, node);
    return node;
  };

  items.forEach((item) => {
    upsertNode(item.label);
  });

  nodes.forEach((node) => {
    const parentLabel = getParentLabel(node.label);
    if (!parentLabel) return;
    const parentNode = upsertNode(parentLabel);
    parentNode.children = parentNode.children || [];
    const alreadyLinked = parentNode.children.some((child) => child.label === node.label);
    if (!alreadyLinked) {
      parentNode.children.push(node);
    }
    node.parentLabel = parentLabel;
  });

  nodes.forEach((node) => {
    if (node.children?.length) {
      node.children.sort((a, b) => a.label.localeCompare(b.label));
    }
  });

  const roots = Array.from(nodes.values())
    .filter((node) => !node.parentLabel)
    .sort((a, b) => a.label.localeCompare(b.label));
  return roots;
}

function TreeNode({ node }) {
  return (
    <div className="tree-node">
      <div className="tree-card">
        <div className="tree-label">{node.label}</div>
        <div className="tree-text muted">{node.description || '—'}</div>
        <div className="tree-text">{node.interpretation || '—'}</div>
      </div>
      {node.children?.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <div className="tree-branch" key={child.id}>
              <span className="tree-connector" aria-hidden>
                <span />
              </span>
              <TreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NomenclatureTree({ items, t }) {
  const roots = useMemo(() => buildTree(items ?? []), [items]);

  return (
    <div className="tree-wrapper">
      <div className="tree-header">
        <div>
          <p className="muted">{t('treeSubtitle')}</p>
          <h2>{t('treeTitle')}</h2>
        </div>
      </div>
      <div className="tree-content card">
        {roots.length === 0 ? (
          <div className="muted">{t('treeEmpty')}</div>
        ) : (
          <div className="tree-roots">
            {roots.map((node) => (
              <TreeNode node={node} key={node.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
