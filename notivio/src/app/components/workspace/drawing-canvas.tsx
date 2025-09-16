"use client"

import type React from "react"

import { useRef, useState, useCallback } from "react"
import { Button } from "../ui/button"
import { Slider } from "../ui/slider"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { Pencil, Eraser, Square, Circle, Minus, RotateCcw, Download } from "lucide-react"

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void
}

export function DrawingCanvas({ onSave }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<"pen" | "eraser" | "line" | "rectangle" | "circle">("pen")
  const [brushSize, setBrushSize] = useState([3])
  const [color, setColor] = useState("#8a7559")
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDrawing(true)
      setStartPos({ x, y })

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = brushSize[0]
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color

      if (tool === "pen" || tool === "eraser") {
        ctx.beginPath()
        ctx.moveTo(x, y)
      }
    },
    [tool, brushSize, color],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (tool === "pen" || tool === "eraser") {
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    },
    [isDrawing, tool],
  )

  const stopDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      if (tool === "line") {
        ctx.beginPath()
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (tool === "rectangle") {
        ctx.beginPath()
        ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y)
        ctx.stroke()
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        ctx.beginPath()
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }

      setIsDrawing(false)
    },
    [isDrawing, tool, startPos],
  )

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
  }

  const colors = ["#8a7559", "#a68b5b", "#000000", "#e53e3e", "#38a169", "#3182ce", "#805ad5", "#d69e2e"]

  return (
    <div className="space-y-4">
      {/* Drawing Tools */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant={tool === "pen" ? "default" : "outline"} size="sm" onClick={() => setTool("pen")}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant={tool === "eraser" ? "default" : "outline"} size="sm" onClick={() => setTool("eraser")}>
              <Eraser className="h-4 w-4" />
            </Button>
            <Button variant={tool === "line" ? "default" : "outline"} size="sm" onClick={() => setTool("line")}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "rectangle" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("rectangle")}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button variant={tool === "circle" ? "default" : "outline"} size="sm" onClick={() => setTool("circle")}>
              <Circle className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <Label>Size:</Label>
            <div className="w-24">
              <Slider value={brushSize} onValueChange={setBrushSize} max={20} min={1} step={1} />
            </div>
            <span className="text-sm w-8">{brushSize[0]}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <Label>Color:</Label>
            <div className="flex space-x-1">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded border-2 ${color === c ? "border-gray-800" : "border-gray-300"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button onClick={saveDrawing}>
            <Download className="h-4 w-4 mr-2" />
            Insert Drawing
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="border border-gray-200 rounded cursor-crosshair"
          style={{ backgroundColor: "#ffffff" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  )
}
