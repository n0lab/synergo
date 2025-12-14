import React, { useMemo } from 'react';

const buildGraph = (items) => {
  const nodes = new Map();
  const links = [];

  const ensureNode = (label) => {
    if (!nodes.has(label)) {
      nodes.set(label, {
        id: label,
        label,
        description: '',
        interpretation: '',
      });
    }
    return nodes.get(label);
  };

  (items ?? []).forEach((item) => {
    const parts = item.label?.split('_').filter(Boolean) ?? [];
    if (parts.length === 0) return;

    parts.forEach((_, idx) => {
      const currentLabel = parts.slice(0, idx + 1).join('_');
      const node = ensureNode(currentLabel);

      if (idx === parts.length - 1) {
        node.description = item.description || node.description;
        node.interpretation = item.interpretation || node.interpretation;
      }

      if (idx > 0) {
        const parentLabel = parts.slice(0, idx).join('_');
        ensureNode(parentLabel);
        links.push({ from: parentLabel, to: currentLabel });
      }
    });
  });

  const childSet = new Set(links.map((edge) => edge.to));
  const roots = Array.from(nodes.values())
    .filter((node) => !childSet.has(node.id))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { nodes: Array.from(nodes.values()), links, roots };
};

const layoutGraph = (nodes, links) => {
  const children = new Map();
  const parents = new Map();

  links.forEach((edge) => {
    if (!children.has(edge.from)) children.set(edge.from, []);
    children.get(edge.from).push(edge.to);
    parents.set(edge.to, edge.from);
  });

  const roots = nodes.filter((node) => !parents.has(node.id));
  const sortedRoots = roots.sort((a, b) => a.label.localeCompare(b.label));

  const spacingX = 240;
  const spacingY = 170;
  let cursor = 0;
  const positions = new Map();

  const place = (id, depth) => {
    const sortedChildren = (children.get(id) || []).slice().sort((a, b) => a.localeCompare(b));

    let xSlot;
    if (sortedChildren.length === 0) {
      xSlot = cursor;
      cursor += 1;
    } else {
      const childSlots = sortedChildren.map((child) => place(child, depth + 1));
      xSlot = (Math.min(...childSlots) + Math.max(...childSlots)) / 2;
    }

    positions.set(id, { x: xSlot * spacingX, y: depth * spacingY });
    return xSlot;
  };

  sortedRoots.forEach((root) => {
    place(root.id, 0);
    cursor += 1; // space between disjoint roots
  });

  return positions;
};

const GraphNode = ({ node, position }) => {
  const width = 220;
  const height = 120;
  const x = position.x - width / 2;
  const y = position.y - height / 2;

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div className="graph-node">
        <div className="graph-node-header">
          <span className="badge">{node.label}</span>
        </div>
        {(node.description || node.interpretation) && (
          <div className="graph-node-body">
            {node.description && <p className="muted">{node.description}</p>}
            {node.interpretation && <p className="interpretation">{node.interpretation}</p>}
          </div>
        )}
      </div>
    </foreignObject>
  );
};

export default function NomenclatureTree({ items, t }) {
  const { nodes, links } = useMemo(() => buildGraph(items), [items]);
  const positions = useMemo(() => layoutGraph(nodes, links), [nodes, links]);

  const hasGraph = nodes.length > 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  positions.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  const padding = 150;
  const viewBoxWidth = Math.max(maxX - minX + padding * 2, 320);
  const viewBoxHeight = Math.max(maxY - minY + padding * 2, 240);
  const viewBox = `${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}`;

  return (
    <div className="tree-page">
      <div className="header-row">
        <div>
          <h2>{t('treeTitle')}</h2>
          <p className="muted">{t('treeSubtitle')}</p>
        </div>
        <div className="tree-counters">
          <span className="badge">{t('treeNomenclatureTotal', { label: items.length })}</span>
          <span className="badge ghost">{t('treeNodeTotal', { label: nodes.length })}</span>
        </div>
      </div>

      <div className="card tree-graph-card">
        {!hasGraph ? (
          <div className="muted">{t('treeEmpty')}</div>
        ) : (
          <svg className="relation-graph" viewBox={viewBox} role="img" aria-label={t('treeTitle')}>
            {links.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;

              return (
                <g key={`${edge.from}-${edge.to}`} className="graph-link">
                  <path d={`M ${from.x} ${from.y + 40} C ${from.x} ${(from.y + to.y) / 2} ${to.x} ${(from.y + to.y) / 2} ${to.x} ${to.y - 40}`} />
                  <circle cx={to.x} cy={to.y - 40} r={4} />
                </g>
              );
            })}

            {nodes.map((node) => {
              const position = positions.get(node.id);
              if (!position) return null;
              return <GraphNode key={node.id} node={node} position={position} />;
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
