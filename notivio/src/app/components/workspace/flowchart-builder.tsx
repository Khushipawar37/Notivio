"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Plus, Minus, Square, Circle, Diamond } from "lucide-react"

interface FlowchartBuilderProps {
  onInsert: (flowchartHTML: string) => void
}

interface FlowchartNode {
  id: string
  text: string
  type: "rectangle" | "diamond" | "circle"
  x: number
  y: number
}

interface FlowchartConnection {
  from: string
  to: string
  label?: string
}

export function FlowchartBuilder({ onInsert }: FlowchartBuilderProps) {
  const [nodes, setNodes] = useState<FlowchartNode[]>([
    { id: "1", text: "Start", type: "circle", x: 200, y: 50 },
    { id: "2", text: "Process", type: "rectangle", x: 200, y: 150 },
    { id: "3", text: "Decision?", type: "diamond", x: 200, y: 250 },
    { id: "4", text: "End", type: "circle", x: 200, y: 350 },
  ])

  const [connections, setConnections] = useState<FlowchartConnection[]>([
    { from: "1", to: "2" },
    { from: "2", to: "3" },
    { from: "3", to: "4", label: "Yes" },
  ])

  const addNode = () => {
    const newNode: FlowchartNode = {
      id: Date.now().toString(),
      text: "New Node",
      type: "rectangle",
      x: 200,
      y: 100 + nodes.length * 100,
    }
    setNodes([...nodes, newNode])
  }

  const updateNode = (id: string, updates: Partial<FlowchartNode>) => {
    setNodes(nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)))
  }

  const removeNode = (id: string) => {
    setNodes(nodes.filter((node) => node.id !== id))
    setConnections(connections.filter((conn) => conn.from !== id && conn.to !== id))
  }

  const generateFlowchartSVG = () => {
    return `
      <svg width="500" height="500" viewBox="0 0 500 500" style="border: 1px solid #d9c6b8;">
        ${connections
          .map((conn) => {
            const fromNode = nodes.find((n) => n.id === conn.from)
            const toNode = nodes.find((n) => n.id === conn.to)
            if (!fromNode || !toNode) return ""

            return `
            <line x1="${fromNode.x}" y1="${fromNode.y + 25}" x2="${toNode.x}" y2="${toNode.y - 25}" 
                  stroke="#8a7559" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            ${
              conn.label
                ? `<text x="${(fromNode.x + toNode.x) / 2}" y="${(fromNode.y + toNode.y) / 2}" 
                           textAnchor="middle" fontSize="12" fill="#666">${conn.label}</text>`
                : ""
            }
          `
          })
          .join("")}
        
        ${nodes
          .map((node) => {
            const shape =
              node.type === "rectangle"
                ? `<rect x="${node.x - 50}" y="${node.y - 25}" width="100" height="50" fill="#f5f0e8" stroke="#8a7559" strokeWidth="2" rx="5"/>`
                : node.type === "circle"
                  ? `<circle cx="${node.x}" cy="${node.y}" r="30" fill="#f5f0e8" stroke="#8a7559" strokeWidth="2"/>`
                  : `<polygon points="${node.x},${node.y - 25} ${node.x + 40},${node.y} ${node.x},${node.y + 25} ${node.x - 40},${node.y}" 
                     fill="#f5f0e8" stroke="#8a7559" strokeWidth="2"/>`

            return `
            ${shape}
            <text x="${node.x}" y="${node.y + 5}" textAnchor="middle" fontSize="12" fill="#333">${node.text}</text>
          `
          })
          .join("")}
        
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8a7559"/>
          </marker>
        </defs>
      </svg>
    `
  }

  const generateFlowchartHTML = () => {
    const flowchartHTML = `
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #d9c6b8; border-radius: 8px; background: #f5f0e8;">
        <h3 style="text-align: center; color: #8a7559; margin-bottom: 15px; font-weight: bold;">Flowchart</h3>
        <div style="display: flex; justify-content: center;">
          ${generateFlowchartSVG()}
        </div>
      </div>
    `

    onInsert(flowchartHTML)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Flowchart Nodes
              <Button size="sm" onClick={addNode}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {nodes.map((node) => (
              <div key={node.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Node {node.id}</Label>
                  {nodes.length > 1 && (
                    <Button size="sm" variant="outline" onClick={() => removeNode(node.id)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Input
                  value={node.text}
                  onChange={(e) => updateNode(node.id, { text: e.target.value })}
                  placeholder="Node text"
                />

                <Select value={node.type} onValueChange={(value) => updateNode(node.id, { type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">
                      <div className="flex items-center space-x-2">
                        <Square className="h-4 w-4" />
                        <span>Rectangle</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="diamond">
                      <div className="flex items-center space-x-2">
                        <Diamond className="h-4 w-4" />
                        <span>Diamond</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="circle">
                      <div className="flex items-center space-x-2">
                        <Circle className="h-4 w-4" />
                        <span>Circle</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>X Position</Label>
                    <Input
                      type="number"
                      value={node.x}
                      onChange={(e) => updateNode(node.id, { x: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Y Position</Label>
                    <Input
                      type="number"
                      value={node.y}
                      onChange={(e) => updateNode(node.id, { y: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div dangerouslySetInnerHTML={{ __html: generateFlowchartSVG() }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={generateFlowchartHTML}>Insert Flowchart</Button>
      </div>
    </div>
  )
}
