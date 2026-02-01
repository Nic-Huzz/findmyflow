/**
 * Knowledge Graph
 * A foundational mind map of human experience - how concepts interconnect
 * This underpins the entire FindMyFlow philosophy
 */

export const KNOWLEDGE_GRAPH = {
  // Node categories for clustering/coloring
  categories: {
    core: { color: '#5e17eb', label: 'Core Drives' },           // Purple - deepest layer
    fear: { color: '#8B5CF6', label: 'Fear Responses' },        // Light purple
    motivation: { color: '#E9A23B', label: 'Interior Motivation' }, // Gold
    external: { color: '#EF4444', label: 'External Validation' },   // Red
    healing: { color: '#10B981', label: 'Healing/Integration' },    // Green
    framework: { color: '#3B82F6', label: 'Frameworks' },           // Blue
    practice: { color: '#F97316', label: 'Practice/Action' }        // Orange
  },

  // Nodes - individual concepts
  nodes: [
    // === CORE DRIVES (Root) ===
    {
      id: 'desire-to-be-loved',
      label: 'Desire to Be Loved',
      category: 'core',
      description: 'The fundamental human drive for connection, belonging, and acceptance',
      isRoot: true
    },

    // === FEAR RESPONSES ===
    {
      id: 'fear-not-good-enough',
      label: 'Fear: Not Good Enough',
      category: 'fear',
      description: 'Core wound - the belief that we are fundamentally flawed or unworthy'
    },
    {
      id: 'fear-failure',
      label: 'Fear of Failure',
      category: 'fear',
      description: 'Avoiding action to protect from confirming "not good enough" belief'
    },
    {
      id: 'fear-judgement',
      label: 'Fear of Judgement',
      category: 'fear',
      description: 'External validation seeking - letting others define our worth'
    },

    // === INTERIOR MOTIVATIONS (Antidote to Fear of Failure) ===
    {
      id: 'interior-motivations',
      label: 'Interior Motivations',
      category: 'motivation',
      description: 'The three Ps - internal drivers that transcend fear of failure'
    },
    {
      id: 'purpose',
      label: 'Purpose',
      category: 'motivation',
      description: 'Why you do it - meaning beyond outcome'
    },
    {
      id: 'play',
      label: 'Play',
      category: 'motivation',
      description: 'Intrinsic enjoyment - the process itself is the reward'
    },
    {
      id: 'process',
      label: 'Process',
      category: 'motivation',
      description: 'Growth through iteration - each attempt teaches regardless of result'
    }
  ],

  // Edges - connections between concepts
  edges: [
    // Root chain: desire → fear not good enough → fear failure → fear judgement
    {
      source: 'desire-to-be-loved',
      target: 'fear-not-good-enough',
      label: 'when unmet becomes',
      type: 'causes'
    },
    {
      source: 'fear-not-good-enough',
      target: 'fear-failure',
      label: 'manifests as',
      type: 'causes'
    },
    {
      source: 'fear-failure',
      target: 'fear-judgement',
      label: 'externalized as',
      type: 'causes'
    },

    // Branch: Interior motivations as antidote to fear of failure
    {
      source: 'fear-failure',
      target: 'interior-motivations',
      label: 'transcended by',
      type: 'antidote'
    },
    {
      source: 'interior-motivations',
      target: 'purpose',
      label: 'includes',
      type: 'contains'
    },
    {
      source: 'interior-motivations',
      target: 'play',
      label: 'includes',
      type: 'contains'
    },
    {
      source: 'interior-motivations',
      target: 'process',
      label: 'includes',
      type: 'contains'
    }
  ]
}

/**
 * Helper to get node by ID
 */
export function getNode(id) {
  return KNOWLEDGE_GRAPH.nodes.find(n => n.id === id)
}

/**
 * Get all nodes in a category
 */
export function getNodesByCategory(category) {
  return KNOWLEDGE_GRAPH.nodes.filter(n => n.category === category)
}

/**
 * Get all edges connected to a node
 */
export function getConnectedEdges(nodeId) {
  return KNOWLEDGE_GRAPH.edges.filter(
    e => e.source === nodeId || e.target === nodeId
  )
}

/**
 * Get neighboring nodes (directly connected)
 */
export function getNeighbors(nodeId) {
  const edges = getConnectedEdges(nodeId)
  const neighborIds = new Set()

  edges.forEach(e => {
    if (e.source === nodeId) neighborIds.add(e.target)
    if (e.target === nodeId) neighborIds.add(e.source)
  })

  return Array.from(neighborIds).map(id => getNode(id))
}

/**
 * Convert to format for force-directed graph libraries (D3, react-force-graph, etc.)
 */
export function toForceGraphFormat() {
  return {
    nodes: KNOWLEDGE_GRAPH.nodes.map(n => ({
      id: n.id,
      name: n.label,
      group: n.category,
      val: n.isRoot ? 3 : 1, // Size weight
      color: KNOWLEDGE_GRAPH.categories[n.category]?.color
    })),
    links: KNOWLEDGE_GRAPH.edges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label
    }))
  }
}
