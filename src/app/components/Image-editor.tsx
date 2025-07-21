"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Move, Crop, Download, Upload, X, Check, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface ImageEditorProps {
  onSave: (editedImageUrl: string) => void
  onCancel: () => void
  initialImage?: string
}

export function ImageEditor({ onSave, onCancel, initialImage }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cropMode, setCropMode] = useState(false)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 })
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)

  // Initialize with existing image if provided
  useEffect(() => {
    if (initialImage) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setImage(img)
        drawCanvas(img)
      }
      img.src = initialImage
    }
  }, [initialImage])

  const drawCanvas = useCallback(
    (img?: HTMLImageElement) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx || (!image && !img)) return

      const currentImage = img || image
      if (!currentImage) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Save context
      ctx.save()

      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`

      // Move to center
      ctx.translate(canvas.width / 2, canvas.height / 2)

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180)

      // Apply zoom and position
      const scaledWidth = currentImage.width * zoom
      const scaledHeight = currentImage.height * zoom

      ctx.drawImage(
        currentImage,
        -scaledWidth / 2 + position.x,
        -scaledHeight / 2 + position.y,
        scaledWidth,
        scaledHeight,
      )

      // Restore context
      ctx.restore()

      // Draw crop overlay if in crop mode
      if (cropMode) {
        ctx.strokeStyle = "#db4b0d"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

        // Draw crop handles
        const handleSize = 8
        const handles = [
          { x: cropArea.x, y: cropArea.y },
          { x: cropArea.x + cropArea.width, y: cropArea.y },
          { x: cropArea.x, y: cropArea.y + cropArea.height },
          { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
        ]

        ctx.fillStyle = "#db4b0d"
        handles.forEach((handle) => {
          ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
        })
      }
    },
    [image, zoom, rotation, position, cropMode, cropArea, brightness, contrast, saturation],
  )

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          setImage(img)
          // Reset all transformations
          setZoom(1)
          setRotation(0)
          setPosition({ x: 0, y: 0 })
          setBrightness(100)
          setContrast(100)
          setSaturation(100)
          drawCanvas(img)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) {
      setIsDragging(true)
      setDragStart({
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && !cropMode) {
      setPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0])
  }

  const handleRotate = (degrees: number) => {
    setRotation((prev) => prev + degrees)
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setCropMode(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    let finalCanvas = canvas

    // If crop mode is active, create a cropped version
    if (cropMode) {
      const cropCanvas = document.createElement("canvas")
      const cropCtx = cropCanvas.getContext("2d")
      if (!cropCtx) return

      cropCanvas.width = cropArea.width
      cropCanvas.height = cropArea.height

      cropCtx.drawImage(
        canvas,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height,
      )

      finalCanvas = cropCanvas
    }

    const editedImageUrl = finalCanvas.toDataURL("image/jpeg", 0.9)
    onSave(editedImageUrl)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "edited-image.jpg"
    link.href = canvas.toDataURL("image/jpeg", 0.9)
    link.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Canvas Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Image Editor</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={!image}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 min-h-[400px]">
                {image ? (
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={400}
                    className="max-w-full max-h-full border border-gray-300 rounded cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload an image to start editing</p>
                    <Button onClick={() => fileInputRef.current?.click()}>Choose Image</Button>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-80 space-y-6">
              {/* Transform Controls */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Transform</h4>

                {/* Zoom */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Zoom: {zoom.toFixed(1)}x</Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={handleZoomChange}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.1))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setZoom((prev) => Math.min(3, prev + 0.1))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Rotation: {rotation}°</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRotate(-90)}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      -90°
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRotate(90)}>
                      <RotateCw className="w-4 h-4 mr-1" />
                      +90°
                    </Button>
                  </div>
                </div>

                {/* Position Reset */}
                <Button variant="outline" size="sm" onClick={() => setPosition({ x: 0, y: 0 })} className="w-full">
                  <Move className="w-4 h-4 mr-2" />
                  Center Image
                </Button>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Filters</h4>

                {/* Brightness */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Brightness: {brightness}%</Label>
                  <Slider
                    value={[brightness]}
                    onValueChange={(value) => setBrightness(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Contrast: {contrast}%</Label>
                  <Slider
                    value={[contrast]}
                    onValueChange={(value) => setContrast(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Saturation: {saturation}%</Label>
                  <Slider
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Crop Mode */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Crop</h4>
                <Button
                  variant={cropMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCropMode(!cropMode)}
                  className="w-full"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  {cropMode ? "Exit Crop Mode" : "Enable Crop Mode"}
                </Button>
              </div>

              {/* Reset All */}
              <Button variant="outline" onClick={handleReset} className="w-full bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All
              </Button>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!image} className="flex-1 bg-[#db4b0d] hover:bg-[#c4420c]">
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
