"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieLabelRenderProps,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { Plus, Minus, BarChart3, LineChartIcon, PieChartIcon } from "lucide-react"

interface ChartBuilderProps {
    onInsert: (chartHTML: string) => void
}

interface DataPoint {
    name: string
    value: number
    [key: string]: string | number
}


export function ChartBuilder({ onInsert }: ChartBuilderProps) {
    const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar")
    const [data, setData] = useState<DataPoint[]>([
        { name: "Category A", value: 400 },
        { name: "Category B", value: 300 },
        { name: "Category C", value: 200 },
        { name: "Category D", value: 100 },
    ])
    const [chartTitle, setChartTitle] = useState("Sample Chart")

    const addDataPoint = () => {
        setData([...data, { name: `Category ${data.length + 1}`, value: 0 }])
    }

    const removeDataPoint = (index: number) => {
        setData(data.filter((_, i) => i !== index))
    }

    const updateDataPoint = (index: number, field: "name" | "value", value: string | number) => {
        const newData = [...data]
        newData[index] = { ...newData[index], [field]: value }
        setData(newData)
    }

    const generateChartHTML = () => {
        const chartId = `chart-${Date.now()}`
        const dataString = JSON.stringify(data)

        const chartHTML = `
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #d9c6b8; border-radius: 8px; background: #f5f0e8;">
        <h3 style="text-align: center; color: #8a7559; margin-bottom: 15px; font-weight: bold;">${chartTitle}</h3>
        <div style="width: 100%; height: 300px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 4px;">
          ${chartType === "bar" ? generateBarChartSVG() : chartType === "line" ? generateLineChartSVG() : generatePieChartSVG()}
        </div>
      </div>
    `

        onInsert(chartHTML)
    }

    const generateBarChartSVG = () => {
        const maxValue = Math.max(...data.map((d) => d.value))
        const barWidth = 300 / data.length - 10

        return `
      <svg width="400" height="250" viewBox="0 0 400 250">
        ${data
                .map((item, index) => {
                    const height = (item.value / maxValue) * 180
                    const x = 50 + index * (barWidth + 10)
                    const y = 200 - height

                    return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="#8a7559" />
            <text x="${x + barWidth / 2}" y="220" textAnchor="middle" fontSize="12" fill="#666">${item.name}</text>
            <text x="${x + barWidth / 2}" y="${y - 5}" textAnchor="middle" fontSize="10" fill="#333">${item.value}</text>
          `
                })
                .join("")}
        <line x1="40" y1="200" x2="360" y2="200" stroke="#ccc" strokeWidth="1"/>
        <line x1="40" y1="20" x2="40" y2="200" stroke="#ccc" strokeWidth="1"/>
      </svg>
    `
    }

    const generateLineChartSVG = () => {
        const maxValue = Math.max(...data.map((d) => d.value))
        const points = data
            .map((item, index) => {
                const x = 50 + (index * 300) / (data.length - 1)
                const y = 200 - (item.value / maxValue) * 180
                return `${x},${y}`
            })
            .join(" ")

        return `
      <svg width="400" height="250" viewBox="0 0 400 250">
        <polyline points="${points}" fill="none" stroke="#8a7559" strokeWidth="3"/>
        ${data
                .map((item, index) => {
                    const x = 50 + (index * 300) / (data.length - 1)
                    const y = 200 - (item.value / maxValue) * 180

                    return `
            <circle cx="${x}" cy="${y}" r="4" fill="#8a7559"/>
            <text x="${x}" y="220" textAnchor="middle" fontSize="12" fill="#666">${item.name}</text>
            <text x="${x}" y="${y - 10}" textAnchor="middle" fontSize="10" fill="#333">${item.value}</text>
          `
                })
                .join("")}
        <line x1="40" y1="200" x2="360" y2="200" stroke="#ccc" strokeWidth="1"/>
        <line x1="40" y1="20" x2="40" y2="200" stroke="#ccc" strokeWidth="1"/>
      </svg>
    `
    }

    const generatePieChartSVG = () => {
        const total = data.reduce((sum, item) => sum + item.value, 0)
        let currentAngle = 0
        const colors = ["#8a7559", "#a68b5b", "#d9c6b8", "#f5f0e8", "#ec4899"]

        return `
      <svg width="400" height="250" viewBox="0 0 400 250">
        ${data
                .map((item, index) => {
                    const angle = (item.value / total) * 360
                    const startAngle = currentAngle
                    const endAngle = currentAngle + angle
                    currentAngle += angle

                    const startX = 200 + 80 * Math.cos(((startAngle - 90) * Math.PI) / 180)
                    const startY = 125 + 80 * Math.sin(((startAngle - 90) * Math.PI) / 180)
                    const endX = 200 + 80 * Math.cos(((endAngle - 90) * Math.PI) / 180)
                    const endY = 125 + 80 * Math.sin(((endAngle - 90) * Math.PI) / 180)

                    const largeArc = angle > 180 ? 1 : 0

                    return `
            <path d="M 200 125 L ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY} Z" 
                  fill="${colors[index % colors.length]}" stroke="white" strokeWidth="2"/>
            <text x="${200 + 100 * Math.cos(((startAngle + angle / 2 - 90) * Math.PI) / 180)}" 
                  y="${125 + 100 * Math.sin(((startAngle + angle / 2 - 90) * Math.PI) / 180)}" 
                  textAnchor="middle" fontSize="10" fill="#333">${item.name}</text>
          `
                })
                .join("")}
      </svg>
    `
    }

    const COLORS = ["#8a7559", "#a68b5b", "#d9c6b8", "#f5f0e8", "#ec4899"]

    return (
        <div className="space-y-6">
            {/* Chart Type Selection */}
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bar" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Bar Chart</span>
                    </TabsTrigger>
                    <TabsTrigger value="line" className="flex items-center space-x-2">
                        <LineChartIcon className="h-4 w-4" />
                        <span>Line Chart</span>
                    </TabsTrigger>
                    <TabsTrigger value="pie" className="flex items-center space-x-2">
                        <PieChartIcon className="h-4 w-4" />
                        <span>Pie Chart</span>
                    </TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Data Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Chart Data</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="chart-title">Chart Title</Label>
                                <Input
                                    id="chart-title"
                                    value={chartTitle}
                                    onChange={(e) => setChartTitle(e.target.value)}
                                    placeholder="Enter chart title"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Data Points</Label>
                                    <Button size="sm" onClick={addDataPoint}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {data.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Input
                                            value={item.name}
                                            onChange={(e) => updateDataPoint(index, "name", e.target.value)}
                                            placeholder="Category name"
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            value={item.value}
                                            onChange={(e) => updateDataPoint(index, "value", Number.parseInt(e.target.value) || 0)}
                                            placeholder="Value"
                                            className="w-24"
                                        />
                                        {data.length > 1 && (
                                            <Button size="sm" variant="outline" onClick={() => removeDataPoint(index)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chart Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === "bar" ? (
                                        <BarChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#8a7559" />
                                        </BarChart>
                                    ) : chartType === "line" ? (
                                        <LineChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="value" stroke="#8a7559" strokeWidth={3} />
                                        </LineChart>
                                    ) : (
                                        <PieChart>
                                            <Pie
                                                data={data}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, percent }: PieLabelRenderProps) => {
                                                    if (typeof percent === "number") {
                                                        return `${name} ${(percent * 100).toFixed(0)}%`
                                                    }
                                                    return name
                                                }}

                                            >
                                                {data.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    )}
                                </ResponsiveContainer>

                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Tabs>

            <div className="flex justify-end">
                <Button onClick={generateChartHTML}>Insert Chart</Button>
            </div>
        </div>
    )
}
