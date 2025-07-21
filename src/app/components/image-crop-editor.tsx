"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  CropIcon,
  RefreshCw,
  ArrowLeft,
  Copy,
  Lock,
  Unlock,
} from "lucide-react"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropEditorProps {
  onSave: (croppedImageUrl: string) => void
  onCancel: () => void
  initialImage?: string
}

const aspectRatios = [
  { label: "Free", value: 0 },
  { label: "Square 1:1", value: 1 },
  { label: "Portrait 3:4", value: 3 / 4 },
  { label: "Portrait 9:16", value: 9 / 16 },
  { label: "Landscape 4:3", value: 4 / 3 },
  { label: "Landscape 16:9", value: 16 / 9 },
]

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropEditor({ onSave, onCancel, initialImage }: ImageCropEditorProps): ReactElement {
  const [imgSrc, setImgSrc] = useState(initialImage || "")
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape")
  const [width, setWidth] = useState("1200")
  const [height, setHeight] = useState("1200")
  const [lockAspectRatio, setLockAspectRatio] = useState(true)

  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener("load", () => setImgSrc(reader.result?.toString() || ""))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspectRatio || 1))
  }

  const handleAspectRatioChange = (value: string) => {
    const ratio = Number.parseFloat(value)
    setAspectRatio(ratio)

    if (ratio > 0 && imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, ratio))
    }
  }

  const handleOrientationChange = (newOrientation: "portrait" | "landscape") => {
    setOrientation(newOrientation)
    if (aspectRatio > 0) {
      const newRatio = newOrientation === "portrait" ? 1 / aspectRatio : aspectRatio
      setAspectRatio(newRatio)

      if (imgRef.current) {
        const { width, height } = imgRef.current
        setCrop(centerAspectCrop(width, height, newRatio))
      }
    }
  }

  const handleWidthChange = (value: string) => {
    setWidth(value)
    if (lockAspectRatio && aspectRatio > 0) {
      const newHeight = Math.round(Number.parseInt(value) / aspectRatio)
      setHeight(newHeight.toString())
    }
  }

  const handleHeightChange = (value: string) => {
    setHeight(value)
    if (lockAspectRatio && aspectRatio > 0) {
      const newWidth = Math.round(Number.parseInt(value) * aspectRatio)
      setWidth(newWidth.toString())
    }
  }

  const handleSave = useCallback(async () => {
    const image = imgRef.current
    const previewCanvas = previewCanvasRef.current
    if (!image || !previewCanvas || !completedCrop) {
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const offscreen = new OffscreenCanvas(
      Number.parseInt(width) || completedCrop.width * scaleX,
      Number.parseInt(height) || completedCrop.height * scaleY,
    )
    const ctx = offscreen.getContext("2d")
    if (!ctx) {
      return
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height,
    )

    const blob = await offscreen.convertToBlob({
      type: "image/jpeg",
      quality: 0.9,
    })

    const reader = new FileReader()
    reader.onload = () => {
      onSave(reader.result as string)
    }
    reader.readAsDataURL(blob)
  }, [completedCrop, onSave, width, height])

  const handleReset = () => {
    setScale(1)
    setRotate(0)
    setCrop(undefined)
    setAspectRatio(1)
    setOrientation("landscape")
    setWidth("1200")
    setHeight("1200")
    setLockAspectRatio(true)
  }

  const canvasPreview = useCallback(
    (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("No 2d context")
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const pixelRatio = window.devicePixelRatio || 1

      // Set canvas size to match the crop area
      canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

      ctx.scale(pixelRatio, pixelRatio)
      ctx.imageSmoothingQuality = "high"

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate the source coordinates (what to crop from the original image)
      const sourceX = crop.x * scaleX
      const sourceY = crop.y * scaleY
      const sourceWidth = crop.width * scaleX
      const sourceHeight = crop.height * scaleY

      // Calculate destination size
      const destWidth = (crop.width * scaleX) / pixelRatio
      const destHeight = (crop.height * scaleY) / pixelRatio

      ctx.save()

      // Apply transformations for the preview
      if (rotate !== 0 || scale !== 1) {
        // Move to center of destination canvas
        ctx.translate(destWidth / 2, destHeight / 2)

        // Apply rotation
        if (rotate !== 0) {
          ctx.rotate((rotate * Math.PI) / 180)
        }

        // Apply scale
        if (scale !== 1) {
          ctx.scale(scale, scale)
        }

        // Move back
        ctx.translate(-destWidth / 2, -destHeight / 2)
      }

      // Draw the cropped portion
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight, // Source rectangle
        0,
        0,
        destWidth,
        destHeight, // Destination rectangle
      )

      ctx.restore()
    },
    [scale, rotate],
  )

  React.useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop)
    }
  }, [completedCrop, canvasPreview])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full h-[95vh] sm:h-[90vh] max-w-4xl overflow-hidden bg-white flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 pb-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={onCancel} className="mr-1 sm:mr-2 p-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center">
                <CropIcon className="w-4 h-4 mr-1 sm:mr-2 text-[#db4b0d]" />
                <span className="text-sm sm:text-base">Crop</span>
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col lg:hidden h-full">
            {/* Mobile Crop Area */}
            <div className="flex-1 p-3 flex flex-col min-h-0">
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden min-h-[250px] max-h-[400px]">
                {imgSrc ? (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio || undefined}
                      minWidth={30}
                      minHeight={30}
                      className="max-w-full max-h-full"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc || "/placeholder.svg"}
                        style={{
                          transform: `scale(${scale}) rotate(${rotate}deg)`,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          width: "auto",
                          height: "auto",
                          display: "block",
                        }}
                        onLoad={onImageLoad}
                        className="object-contain"
                      />
                    </ReactCrop>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-xs mb-2">Upload an image</p>
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#db4b0d] hover:bg-[#c4420c] text-xs px-3 py-1"
                    >
                      Choose Image
                    </Button>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />

              {/* Mobile Preview - Fixed */}
              {completedCrop && (
                <div className="mt-2 flex-shrink-0">
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">Preview</Label>
                  <div className="flex items-center justify-center">
                    <canvas
                      ref={previewCanvasRef}
                      className="border border-gray-300 rounded max-w-full max-h-16 object-contain bg-white shadow-sm"
                      style={{ maxWidth: "120px", maxHeight: "64px" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Controls - Compact */}
            <div className="bg-gray-50 border-t border-gray-200 max-h-[45vh] overflow-y-auto">
              <div className="p-3 space-y-3">
                {/* Compact Controls Row 1 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Aspect Ratio</Label>
                    <Select value={aspectRatio.toString()} onValueChange={handleAspectRatioChange}>
                      <SelectTrigger className="h-8 text-xs bg-white border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aspectRatios.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value.toString()}>
                            {ratio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Orientation</Label>
                    <div className="flex gap-0.5 p-0.5 bg-gray-200 rounded">
                      <Button
                        variant={orientation === "portrait" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleOrientationChange("portrait")}
                        className={`flex-1 h-7 text-xs ${
                          orientation === "portrait"
                            ? "bg-[#db4b0d] hover:bg-[#c4420c] text-white"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Portrait
                      </Button>
                      <Button
                        variant={orientation === "landscape" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleOrientationChange("landscape")}
                        className={`flex-1 h-7 text-xs ${
                          orientation === "landscape"
                            ? "bg-[#db4b0d] hover:bg-[#c4420c] text-white"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Landscape
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Compact Controls Row 2 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Width</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="h-8 pr-6 text-xs bg-white border-gray-300"
                      />
                      <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        px
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Height</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="h-8 pr-6 text-xs bg-white border-gray-300"
                      />
                      <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        px
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lock Aspect Ratio */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lockAspectMobile"
                    checked={lockAspectRatio}
                    onCheckedChange={(checked) => setLockAspectRatio(checked === true)}
                    className="border-[#db4b0d] data-[state=checked]:bg-[#db4b0d] h-4 w-4"
                  />
                  <Label htmlFor="lockAspectMobile" className="text-xs font-medium text-gray-700 flex items-center">
                    {lockAspectRatio ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                    Lock Aspect Ratio
                  </Label>
                </div>

                {/* Transform Controls - Compact */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Transform</Label>

                  {/* Zoom */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-600">Zoom: {scale.toFixed(1)}x</Label>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomOut className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[scale]}
                      onValueChange={(value) => setScale(value[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-600">Rotation: {rotate}°</Label>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRotate((r) => r - 90)}
                          className="h-6 px-2 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          -90°
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRotate((r) => r + 90)}
                          className="h-6 px-2 text-xs"
                        >
                          <RotateCw className="w-3 h-3 mr-1" />
                          +90°
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                {imgSrc && (
                  <Button variant="outline" onClick={handleReset} className="w-full h-8 text-xs bg-white">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                )}
              </div>

              {/* Mobile Action Buttons */}
              <div className="p-3 border-t border-gray-300 bg-white">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel} className="flex-1 h-9 text-sm bg-white">
                    Cancel
                  </Button>
                  {imgSrc && completedCrop && (
                    <Button
                      onClick={handleSave}
                      className="flex-1 h-9 text-sm bg-[#db4b0d] hover:bg-[#c4420c] text-white"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden lg:flex h-full">
            {/* Desktop Crop Area */}
            <div className="flex-1 p-4 flex flex-col min-h-0">
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden min-h-[300px]">
                {imgSrc ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio || undefined}
                      minWidth={50}
                      minHeight={50}
                      className="max-w-full max-h-full"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imgSrc || "/placeholder.svg"}
                        style={{
                          transform: `scale(${scale}) rotate(${rotate}deg)`,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          width: "auto",
                          height: "auto",
                          display: "block",
                        }}
                        onLoad={onImageLoad}
                        className="object-contain"
                      />
                    </ReactCrop>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm mb-3">Upload an image to start cropping</p>
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#db4b0d] hover:bg-[#c4420c]"
                    >
                      Choose Image
                    </Button>
                  </div>
                )}
              </div>

              {/* Desktop Preview - Fixed */}
              {completedCrop && (
                <div className="mt-4 flex-shrink-0">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                  <div className="flex items-center justify-start">
                    <canvas
                      ref={previewCanvasRef}
                      className="border border-gray-300 rounded max-w-full object-contain bg-white shadow-sm"
                      style={{ maxWidth: "200px", maxHeight: "80px" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Controls Panel */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
              {/* Scrollable Controls */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Aspect Ratio */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Aspect Ratio</Label>
                  <Select value={aspectRatio.toString()} onValueChange={handleAspectRatioChange}>
                    <SelectTrigger className="w-full bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value.toString()}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Orientation */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Orientation</Label>
                  <div className="flex gap-1 p-1 bg-gray-200 rounded-lg">
                    <Button
                      variant={orientation === "portrait" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleOrientationChange("portrait")}
                      className={`flex-1 ${
                        orientation === "portrait"
                          ? "bg-[#db4b0d] hover:bg-[#c4420c] text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Portrait
                    </Button>
                    <Button
                      variant={orientation === "landscape" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleOrientationChange("landscape")}
                      className={`flex-1 ${
                        orientation === "landscape"
                          ? "bg-[#db4b0d] hover:bg-[#c4420c] text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Landscape
                    </Button>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Width</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="pr-8 bg-white border-gray-300"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        px
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Height</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="pr-8 bg-white border-gray-300"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        px
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lock Aspect Ratio */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lockAspectDesktop"
                    checked={lockAspectRatio}
                    onCheckedChange={(checked) => setLockAspectRatio(checked === true)}
                    className="border-[#db4b0d] data-[state=checked]:bg-[#db4b0d]"
                  />
                  <Label htmlFor="lockAspectDesktop" className="text-sm font-medium text-gray-700 flex items-center">
                    {lockAspectRatio ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                    Lock Aspect Ratio
                  </Label>
                </div>

                {/* Transform Controls */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Transform</Label>

                  {/* Scale */}
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Zoom: {scale.toFixed(1)}x</Label>
                    <Slider
                      value={[scale]}
                      onValueChange={(value) => setScale(value[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full mb-2"
                    />
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Rotation: {rotate}°</Label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setRotate((r) => r - 90)}>
                        <RotateCcw className="w-3 h-3 mr-1" />
                        -90°
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRotate((r) => r + 90)}>
                        <RotateCw className="w-3 h-3 mr-1" />
                        +90°
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                {imgSrc && (
                  <Button variant="outline" onClick={handleReset} className="w-full bg-white">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                )}
              </div>

              {/* Desktop Action Buttons */}
              <div className="flex-shrink-0 p-4 border-t border-gray-300 bg-white">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel} className="flex-1 bg-white">
                    Cancel
                  </Button>
                  {imgSrc && completedCrop && (
                    <Button onClick={handleSave} className="flex-1 bg-[#db4b0d] hover:bg-[#c4420c] text-white">
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
