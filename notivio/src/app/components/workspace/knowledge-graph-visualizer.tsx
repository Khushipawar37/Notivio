'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Loader, X, Download } from 'lucide-react';

interface ConceptNode {
  id: string;
  label: string;
  definition?: string;
  importance?: 'high' | 'medium' | 'low';
}

interface ConceptEdge {
  source: string;
  target: string;
  relationType:
    | 'prerequisite'
    | 'related'
    | 'includes'
    | 'contrast'
    | 'causes'
    | 'follows';
}

interface KnowledgeGraph {
  title: string;
  concepts: ConceptNode[];
  relationships: ConceptEdge[];
}

interface KnowledgeGraphVisualizerProps {
  noteId?: string;
  noteContent?: string;
  onClose?: () => void;
}

const relationTypeColors: Record<ConceptEdge['relationType'], string> = {
  prerequisite: '#FF6B6B', // Red
  related: '#4ECDC4', // Teal
  includes: '#45B7D1', // Blue
  contrast: '#FFA07A', // Light salmon
  causes: '#98D8C8', // Mint
  follows: '#F7DC6F', // Yellow
};

const CustomNode = ({ data }: { data: ConceptNode }) => (
  <div
    className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg max-w-xs"
    style={{
      borderColor:
        data.importance === 'high'
          ? '#FF6B6B'
          : data.importance === 'medium'
            ? '#4ECDC4'
            : '#999',
    }}
  >
    <div className="font-bold text-sm text-gray-900">{data.label}</div>
    {data.definition && (
      <div className="text-xs text-gray-600 mt-2 line-clamp-2">
        {data.definition}
      </div>
    )}
  </div>
);

const nodeTypes: NodeTypes = {
  concept: CustomNode,
};

export function KnowledgeGraphVisualizer({
  noteId,
  noteContent,
  onClose,
}: KnowledgeGraphVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleGenerateGraph = async () => {
    if (!noteContent && !noteId) {
      alert('Please provide note content or note ID');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          noteId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: KnowledgeGraph = await response.json();
      setGraph(data);

      // Convert to React Flow format
      const flowNodes: Node[] = data.concepts.map((concept, idx) => {
        const positions = positionNodesInCircle(
          data.concepts.length,
          idx,
          600,
          600
        );

        return {
          id: concept.id,
          data: concept,
          position: positions,
          type: 'concept',
        };
      });

      const flowEdges: Edge[] = data.relationships.map((rel, idx) => ({
        id: `edge-${idx}`,
        source: rel.source,
        target: rel.target,
        label: rel.relationType,
        style: {
          stroke: relationTypeColors[rel.relationType],
          strokeWidth: 2,
        },
        animated: true,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to generate graph:', error);
      alert('Failed to generate knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadGraph = () => {
    if (!graph) return;

    const svgElement = document.querySelector('.react-flow__pane');
    if (!svgElement) return;

    const svg = svgElement as SVGSVGElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-graph-${Date.now()}.svg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Knowledge Graph Generator</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-lg">
                  Create a visual knowledge graph from your notes
                </p>
                <Button
                  onClick={handleGenerateGraph}
                  disabled={loading}
                  className="gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Graph'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex gap-4 p-4">
              {/* Graph */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap
                    nodeStrokeColor={(n) => {
                      const concept = (n.data as ConceptNode);
                      return concept.importance === 'high'
                        ? '#FF6B6B'
                        : '#ccc';
                    }}
                  />
                </ReactFlow>
              </div>

              {/* Legend */}
              <div className="w-64 border border-gray-200 rounded-lg p-4 overflow-y-auto">
                <h3 className="font-bold mb-3">Relationship Types</h3>
                <div className="space-y-2">
                  {Object.entries(relationTypeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-1 rounded"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs capitalize text-gray-700">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold mb-3">Concepts</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {graph?.concepts.map((concept) => (
                      <div
                        key={concept.id}
                        onClick={() => setSelectedNode(concept)}
                        className={`p-2 rounded cursor-pointer text-xs transition-all ${
                          selectedNode?.id === concept.id
                            ? 'bg-blue-100 border border-blue-500'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <p className="font-medium">{concept.label}</p>
                        {concept.definition && (
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {concept.definition}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {nodes.length > 0 && (
          <div className="border-t border-gray-200 p-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setNodes([]);
                setEdges([]);
                setGraph(null);
              }}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadGraph}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download SVG
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper function to position nodes in a circle
function positionNodesInCircle(
  total: number,
  index: number,
  centerX: number,
  centerY: number,
  radius = 300
) {
  const angle = (index / total) * Math.PI * 2;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

export default KnowledgeGraphVisualizer;
