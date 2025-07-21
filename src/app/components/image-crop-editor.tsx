"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, RotateCw, RotateCcw, ZoomIn, ZoomOut, CropIcon, Check, X, RefreshCw } from "lucide-react"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropEditorProps {
  onSave: (croppedImageUrl: string) => void
  onCancel: () => void
  initialImage?: string
}

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
    setCrop(centerAspectCrop(width, height, 1))
  }

  const handleSave = useCallback(async () => {
    const image = imgRef.current
    const previewCanvas = previewCanvasRef.current
    if (!image || !previewCanvas || !completedCrop) {
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const offscreen = new OffscreenCanvas(completedCrop.width * scaleX, completedCrop.height * scaleY)
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
  }, [completedCrop, onSave])

  const handleReset = () => {
    setScale(1)
    setRotate(0)
    setCrop(undefined)
  }

  const canvasPreview = useCallback(
    (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("No 2d context")
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const pixelRatio = window.devicePixelRatio

      canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

      ctx.scale(pixelRatio, pixelRatio)
      ctx.imageSmoothingQuality = "high"

      const cropX = crop.x * scaleX
      const cropY = crop.y * scaleY

      const rotateRads = rotate * (Math.PI / 180)
      const centerX = image.naturalWidth / 2
      const centerY = image.naturalHeight / 2

      ctx.save()

      ctx.translate(-cropX, -cropY)
      ctx.translate(centerX, centerY)
      ctx.rotate(rotateRads)
      ctx.scale(scale, scale)
      ctx.translate(-centerX, -centerY)

      ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, image.naturalWidth, image.naturalHeight)

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center justify-between">
            <span className="flex items-center">
              <CropIcon className="w-5 h-5 mr-2 text-[#db4b0d]" />
              Crop & Edit Image
            </span>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Crop Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 min-h-[400px] overflow-hidden">
                {imgSrc ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    minWidth={50}
                    minHeight={50}
                    className="max-w-full max-h-full"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc || "/placeholder.svg"}
                      style={{
                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                      }}
                      onLoad={onImageLoad}
                      className="max-w-full max-h-full object-contain"
                    />
                  </ReactCrop>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Upload an image to start cropping</p>
                    <Button onClick={() => fileInputRef.current?.click()}>Choose Image</Button>
                  </div>
                )}
              </div>

              {/* Preview */}
              {completedCrop && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
                  <canvas
                    ref={previewCanvasRef}
                    className="border border-gray-300 rounded max-w-full h-32 object-contain bg-white"
                  />
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-80 space-y-6">
              {/* Transform Controls */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Transform Controls</Label>

                {/* Scale */}
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Zoom: {scale.toFixed(1)}x</Label>
                  <Slider
                    value={[scale]}
                    onValueChange={(value) => setScale(value[0])}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Rotation: {rotate}°</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRotate((r) => r - 90)}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      -90°
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRotate((r) => r + 90)}>
                      <RotateCw className="w-4 h-4 mr-1" />
                      +90°
                    </Button>
                  </div>
                </div>
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
                <Button
                  onClick={handleSave}
                  disabled={!completedCrop}
                  className="flex-1 bg-[#db4b0d] hover:bg-[#c4420c]"
                >
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
