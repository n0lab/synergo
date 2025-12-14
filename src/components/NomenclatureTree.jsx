import React, { useMemo } from 'react';
import RelationGraph from './RelationGraph.jsx';

const computeParentLabel = (label) => {
  const parts = label.split('_');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('_');
};

const ensureNode = (map, label, description = '', interpretation = '') => {
  if (!map.has(label)) {
    map.set(label, { id: label, label, description, interpretation });
  } else {
    const existing = map.get(label);
    map.set(label, {
      ...existing,
      description: existing.description || description,
      interpretation: existing.interpretation || interpretation,
    });
  }
};

const buildGraphData = (items) => {
  const nodeMap = new Map();
  const links = [];

  items.forEach((item) => {
    ensureNode(nodeMap, item.label, item.description, item.interpretation);
    let childLabel = item.label;
    let parent = computeParentLabel(childLabel);

    while (parent) {
      ensureNode(nodeMap, parent);
      links.push({ from: parent, to: childLabel });
      childLabel = parent;
      parent = computeParentLabel(parent);
    }
  });

  // Remove duplicate links
  const uniqueLinks = Array.from(
    new Map(links.map((link) => [`${link.from}-${link.to}`, link])).values()
  );

  return { nodes: Array.from(nodeMap.values()), links: uniqueLinks };
};

export default function NomenclatureTree({ items, t }) {
  const safeItems = items ?? [];
  const graphData = useMemo(() => buildGraphData(safeItems), [safeItems]);

  return (
    <div className="card nomenclature-tree">
      <div className="tree-header">
        <div>
          <p className="eyebrow">{t('treeBreadcrumb')}</p>
          <h2>{t('treeTitle')}</h2>
          <p className="muted">{t('treeSubtitle')}</p>
        </div>
      </div>
      <div className="tree-graph-wrapper">
        <RelationGraph
          data={graphData}
          nodeWidth={260}
          nodeHeight={140}
          renderNode={(node) => (
            <div className="tree-node">
              <div className="tree-node-title">{node.label}</div>
              <div className="tree-node-text">{node.description || t('treeNoDescription')}</div>
              <div className="tree-node-interpretation">{node.interpretation || t('treeNoInterpretation')}</div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
