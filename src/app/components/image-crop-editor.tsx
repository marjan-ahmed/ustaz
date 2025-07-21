"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import type { ReactElement } from "react"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  RotateCw,
  RotateCcw,
  ArrowLeft,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
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

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  const handleSave = useCallback(async () => {
    const image = imgRef.current
    const previewCanvas = previewCanvasRef.current
    if (!image || !previewCanvas || !completedCrop) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const offscreen = new OffscreenCanvas(completedCrop.width * scaleX, completedCrop.height * scaleY)
    const ctx = offscreen.getContext("2d")
    if (!ctx) return

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    )

    const blob = await offscreen.convertToBlob({ type: "image/jpeg", quality: 0.9 })

    const reader = new FileReader()
    reader.onload = () => {
      onSave(reader.result as string)
    }
    reader.readAsDataURL(blob)
  }, [completedCrop, onSave])

  const canvasPreview = useCallback(
    (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PixelCrop) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("No 2d context")

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
      ctx.drawImage(image, 0, 0)
      ctx.restore()
    },
    [scale, rotate]
  )

  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop)
    }
  }, [completedCrop, canvasPreview])

  const cropUI = (
    <div className="bg-white bg-opacity-70 z-50 flex flex-col p-4 sm:p-6 overflow-y-auto rounded-lg max-h-[95vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onCancel} className="text-black text-sm font-medium">
          <ArrowLeft />
        </button>
        <h2 className="text-black text-lg font-semibold text-center flex-1">Edit Profile Photo</h2>
        <div className="w-6" />
      </div>

      {/* Crop Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
        {/* Crop Area */}
        <div className="relative w-full max-w-sm h-[300px] bg-white overflow-hidden rounded-lg shadow-lg">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            className="w-full h-full"
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop me"
              onLoad={onImageLoad}
              className="object-contain w-full h-full"
              style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
            />
          </ReactCrop>
        </div>

        {/* Live Preview + Controls */}
        <div className="w-full max-w-[250px] space-y-6">
          <div className="rounded-full border border-gray-300 overflow-hidden w-32 h-32 mx-auto">
            <canvas ref={previewCanvasRef} className="w-full h-full object-cover" />
          </div>

          <div>
            <Label className="text-black mb-1 block text-sm">Zoom</Label>
            <Slider value={[scale]} onValueChange={(v) => setScale(v[0])} min={0.5} max={3} step={0.1} />
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="ghost" onClick={() => setRotate(r => r - 90)}>
              <RotateCcw className="w-5 h-5 text-black" />
            </Button>
            <Button variant="ghost" onClick={() => setRotate(r => r + 90)}>
              <RotateCw className="w-5 h-5 text-black" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="mt-6 flex justify-between sm:justify-end gap-3 sticky bottom-0 p-4 rounded-t-lg">
        <Button onClick={onCancel} className="bg-red-900 text-red-200">Cancel</Button>
        <Button onClick={handleSave} className="text-green-200 bg-green-900">Save</Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile (default) */}
      <div className="block md:hidden fixed inset-0 z-50">
        {cropUI}
      </div>

      {/* Tablet/Desktop */}
      <div className="hidden md:block">
     <Dialog open onOpenChange={onCancel}>
  <DialogContent className="max-w-3xl w-full p-0 bg-transparent border-none">
    <DialogTitle className="text-center text-lg font-semibold mb-2 text-black">
      Edit Profile Photo
    </DialogTitle>
    {cropUI}
  </DialogContent>
</Dialog>
      </div>
    </>
  )
}
