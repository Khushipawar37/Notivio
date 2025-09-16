import * as React from "react"

export interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, className = "" }, ref) => {
    return (
      <input
        type="range"
        ref={ref as any}
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className={`w-full h-2 cursor-pointer rounded-lg bg-gray-200 accent-blue-500 ${className}`}
      />
    )
  }
)

Slider.displayName = "Slider"
