"use client";

import React, { useState, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Copy, Check } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(color);
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState("hex");

  // Popular color presets (modern palette)
  const colorPresets = [
    // Neutrals
    "#000000", "#1a1a1a", "#333333", "#4d4d4d", "#666666",
    "#808080", "#999999", "#b3b3b3", "#cccccc", "#e6e6e6", "#ffffff",
    // Blues
    "#0066cc", "#0080ff", "#0099ff", "#1a9fff", "#3db8ff",
    "#66cfff", "#99e0ff",
    // Reds & Pinks
    "#cc0000", "#ff0000", "#ff1a1a", "#ff4d4d", "#ff6666",
    "#ff9999", "#ffcccc",
    // Greens
    "#008000", "#00b300", "#00e600", "#33ff33", "#66ff66",
    "#99ff99",
    // Yellow & Orange
    "#ffcc00", "#ffdd33", "#ffee66", "#ffaa00", "#ff8800",
    "#ff6600", "#ff4400",
    // Purple
    "#6600cc", "#7722dd", "#8833ee", "#9944ff", "#aa66ff",
    "#bb88ff",
    // Brand colors
    "#38b2ac", "#4299e1", "#805ad5", "#ed8936", "#e53e3e",
  ];

  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.toUpperCase();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (value.length <= 7) {
        setHexInput(value);
        // Validate and apply if it's a valid hex
        if (/^#[0-9A-F]{6}$/.test(value)) {
          onChange(value);
        }
      }
    },
    [onChange]
  );

  const handleColorPresetClick = useCallback(
    (presetColor: string) => {
      onChange(presetColor);
      setHexInput(presetColor);
    },
    [onChange]
  );

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hexInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }, [hexInput]);

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0").toUpperCase()).join("");
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(hexInput);

  return (
    <div className="w-full space-y-4">
      {label && <label className="text-sm font-medium block">{label}</label>}
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hex">HEX</TabsTrigger>
          <TabsTrigger value="rgb">RGB</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>

        {/* HEX Input Tab */}
        <TabsContent value="hex" className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                placeholder="#000000"
                maxLength={7}
                className="font-mono text-sm uppercase"
              />
              <p className="text-xs text-gray-500">Enter hex color (e.g., #FF5733)</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="mb-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: hexInput }}
            />
            <span className="text-sm font-mono text-gray-600">{hexInput}</span>
          </div>
        </TabsContent>

        {/* RGB Input Tab */}
        <TabsContent value="rgb" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Red: {rgb.r}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => {
                  const newRgb = { ...rgb, r: parseInt(e.target.value) };
                  const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                  onChange(newHex);
                  setHexInput(newHex);
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Green: {rgb.g}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => {
                  const newRgb = { ...rgb, g: parseInt(e.target.value) };
                  const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                  onChange(newHex);
                  setHexInput(newHex);
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Blue: {rgb.b}</label>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => {
                  const newRgb = { ...rgb, b: parseInt(e.target.value) };
                  const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                  onChange(newHex);
                  setHexInput(newHex);
                }}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: hexInput }}
            />
            <span className="text-sm font-mono text-gray-600">
              rgb({rgb.r}, {rgb.g}, {rgb.b})
            </span>
          </div>
        </TabsContent>

        {/* Color Presets Tab */}
        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            {colorPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleColorPresetClick(preset)}
                className="w-full aspect-square rounded-lg border-2 border-gray-300 hover:border-gray-500 transition-all hover:scale-110 shadow-sm"
                style={{
                  backgroundColor: preset,
                  borderColor: hexInput === preset ? "#000" : "#d1d5db",
                  outlineWidth: hexInput === preset ? "3px" : "0px",
                }}
                title={preset}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
