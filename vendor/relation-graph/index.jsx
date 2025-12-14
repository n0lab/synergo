import React, { useMemo } from 'react';

const defaultRenderNode = (node) => {
  return (
    <div className="rg-node">
      <div className="rg-node-label">{node.label}</div>
      {node.description ? <div className="rg-node-meta">{node.description}</div> : null}
      {node.interpretation ? <div className="rg-node-meta muted">{node.interpretation}</div> : null}
    </div>
  );
};

export default function RelationGraph({ data, nodeWidth = 260, nodeHeight = 140, renderNode = defaultRenderNode }) {
  const layout = useMemo(() => {
    const nodes = data?.nodes ?? [];
    const links = data?.links ?? [];
    const incoming = new Map();
    const adjacency = new Map();

    nodes.forEach((node) => {
      incoming.set(node.id, 0);
      adjacency.set(node.id, []);
    });

    links.forEach(({ from, to }) => {
      incoming.set(to, (incoming.get(to) ?? 0) + 1);
      adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
      if (!incoming.has(from)) incoming.set(from, 0);
      if (!adjacency.has(to)) adjacency.set(to, []);
    });

    const roots = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
    const depth = new Map();
    const visited = new Set();
    const queue = [...roots];

    queue.forEach((node) => depth.set(node.id, 0));

    while (queue.length) {
      const current = queue.shift();
      const currentDepth = depth.get(current.id) ?? 0;
      (adjacency.get(current.id) ?? []).forEach((childId) => {
        if (!depth.has(childId) || (depth.get(childId) ?? 0) < currentDepth + 1) {
          depth.set(childId, currentDepth + 1);
        }
        if (!visited.has(childId)) {
          const childNode = nodes.find((node) => node.id === childId);
          if (childNode) queue.push(childNode);
        }
      });
      visited.add(current.id);
    }

    nodes.forEach((node) => {
      if (!depth.has(node.id)) depth.set(node.id, 0);
    });

    const layers = new Map();
    nodes.forEach((node) => {
      const layerIndex = depth.get(node.id) ?? 0;
      const layerNodes = layers.get(layerIndex) ?? [];
      layerNodes.push(node);
      layers.set(layerIndex, layerNodes);
    });

    const positionedNodes = [];
    const layerSpacing = 80;
    const nodeSpacing = 24;

    Array.from(layers.keys())
      .sort((a, b) => a - b)
      .forEach((layerIndex) => {
        const layerNodes = layers.get(layerIndex) ?? [];
        layerNodes.forEach((node, index) => {
          const x = layerIndex * (nodeWidth + layerSpacing);
          const y = index * (nodeHeight + nodeSpacing);
          positionedNodes.push({ ...node, x, y });
        });
      });

    return { nodes: positionedNodes, links };
  }, [data, nodeHeight, nodeWidth]);

  const width = Math.max(...layout.nodes.map((node) => node.x + nodeWidth), nodeWidth);
  const height = Math.max(...layout.nodes.map((node) => node.y + nodeHeight), nodeHeight);

  return (
    <div className="rg-container" style={{ minHeight: height, minWidth: width }}>
      <svg className="rg-svg" width={width + 20} height={height + 20}>
        {layout.links.map((link) => {
          const from = layout.nodes.find((node) => node.id === link.from);
          const to = layout.nodes.find((node) => node.id === link.to);
          if (!from || !to) return null;
          const startX = from.x + nodeWidth;
          const startY = from.y + nodeHeight / 2;
          const endX = to.x;
          const endY = to.y + nodeHeight / 2;
          const midX = (startX + endX) / 2;
          return (
            <path
              key={`${link.from}-${link.to}`}
              d={`M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`}
              className="rg-link"
              fill="none"
            />
          );
        })}
      </svg>
      {layout.nodes.map((node) => (
        <div
          key={node.id}
          className="rg-node-wrapper"
          style={{ width: nodeWidth, height: nodeHeight, transform: `translate(${node.x}px, ${node.y}px)` }}
        >
          {renderNode(node)}
        </div>
      ))}
    </div>
  );
}
