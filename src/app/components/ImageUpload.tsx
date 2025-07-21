'use client'

import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

export default function ImageUpload() {
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return
    const blob = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation)
    if (!blob) return

    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
    const previewUrl = URL.createObjectURL(blob)
    setCroppedUrl(previewUrl)
    setCroppedFile(file)

    setImageToCrop(null) // hide cropper after save
  }

  return (
    <div className="p-4 space-y-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {imageToCrop && (
        <div className="relative w-full h-96 bg-black">
          <Cropper
            image={imageToCrop}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
          />
          <div className="absolute bottom-2 left-2 flex flex-col gap-2">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleCropSave}
            >
              Crop & Save
            </button>
          </div>
        </div>
      )}

      {croppedUrl && (
        <div>
          <h4 className="font-semibold">Preview:</h4>
          <img src={croppedUrl} alt="Cropped" className="w-32 h-32 rounded-full object-cover" />
        </div>
      )}
    </div>
  )
}
