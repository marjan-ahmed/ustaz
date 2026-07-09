export const getCroppedImg = async (
  imageSrc: string,
  croppedAreaPixels: any,
  rotation = 0
): Promise<Blob | null> => {
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const safeArea = Math.max(image.width, image.height) * 2
  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)
  ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2)

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

  ctx.putImageData(
    data,
    Math.round(0 - (safeArea / 2 - croppedAreaPixels.x)),
    Math.round(0 - (safeArea / 2 - croppedAreaPixels.y))
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg')
  })
}
