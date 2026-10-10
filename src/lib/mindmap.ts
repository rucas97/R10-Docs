import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export type MindMapNode = {
  id: string;
  label: string;
  parentId?: string;
};

export type MindMapTree = {
  label: string;
  children?: MindMapTree[];
};

// Convert tree → flat node list
export function treeToNodes(tree: MindMapTree): MindMapNode[] {
  const out: MindMapNode[] = [];
  let counter = 0;
  const walk = (node: MindMapTree, parentId?: string) => {
    const id = `n${counter++}`;
    out.push({ id, label: node.label, parentId });
    (node.children ?? []).forEach((c) => walk(c, id));
  };
  walk(tree);
  return out;
}

// Auto-layout with dagre (top-to-bottom for RTL feel)
export function layoutNodes(
  nodes: MindMapNode[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 });

  const NODE_W = 180;
  const NODE_H = 60;

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_W, height: NODE_H });
  });

  nodes.forEach((n) => {
    if (n.parentId) g.setEdge(n.parentId, n.id);
  });

  dagre.layout(g);

  const flowNodes: Node[] = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: 'mindmapNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { label: n.label },
      draggable: true,
    };
  });

  const flowEdges: Edge[] = nodes
    .filter((n) => n.parentId)
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#a78bfa', strokeWidth: 1.5 },
    }));

  return { nodes: flowNodes, edges: flowEdges };
}

// Extract JSON from LLM output even when wrapped in ```json fences
export function extractJson(raw: string): any | null {
  if (!raw) return null;
  let s = raw.trim();
  // Strip code fences
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  // Find first { ... last }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first < 0 || last <= first) return null;
  s = s.slice(first, last + 1);
  try { return JSON.parse(s); } catch { return null; }
}

// Validate + normalize the mindmap shape
export function normalizeMindMap(raw: any): MindMapTree | null {
  if (!raw || typeof raw !== 'object') return null;
  const label = typeof raw.label === 'string' ? raw.label.slice(0, 120) : '';
  if (!label) return null;
  const children = Array.isArray(raw.children)
    ? raw.children.map(normalizeMindMap).filter(Boolean) as MindMapTree[]
    : [];
  return { label, children };
}

// Count nodes for sanity checks
export function countNodes(t: MindMapTree): number {
  return 1 + (t.children ?? []).reduce((acc, c) => acc + countNodes(c), 0);
}
