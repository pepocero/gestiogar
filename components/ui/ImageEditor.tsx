'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import { Button } from './Button'
import { X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImageBlob: Blob) => void
  imageFile: File
  aspectRatio?: number
  title?: string
  circular?: boolean
}

export function ImageEditor({
  isOpen,
  onClose,
  onSave,
  imageFile,
  aspectRatio = 1,
  title = 'Editar Imagen',
  circular = false
}: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [imageSrc, setImageSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cargar la imagen cuando se abre el editor
  React.useEffect(() => {
    if (isOpen && imageFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string)
      }
      reader.readAsDataURL(imageFile)
    }
  }, [isOpen, imageFile])

  // Crear crop inicial centrado
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    )
    setCrop(crop)
  }, [aspectRatio])

  // Función para obtener la imagen recortada
  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = canvasRef.current
    if (!canvas) {
      throw new Error('Canvas no disponible')
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Contexto 2D no disponible')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const pixelRatio = window.devicePixelRatio

    canvas.width = crop.width * pixelRatio * scaleX
    canvas.height = crop.height * pixelRatio * scaleY

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = 'high'

    // Aplicar rotación
    if (rotate !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    }

    // Dibujar imagen recortada
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width / pixelRatio,
      canvas.height / pixelRatio
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        }
      }, 'image/jpeg', 0.95)
    })
  }

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) {
      return
    }

    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop)
      onSave(croppedImageBlob)
      onClose()
    } catch (error) {
      console.error('Error al procesar la imagen:', error)
    }
  }

  const handleRotate = () => {
    setRotate(prev => (prev + 90) % 360)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  if (!isOpen || !imageSrc) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center space-x-4 p-4 border-b border-gray-200 bg-gray-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRotate}
            className="flex items-center"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rotar
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            className="flex items-center"
          >
            <ZoomOut className="h-4 w-4 mr-2" />
            Alejar
          </Button>
          
          <span className="text-sm text-gray-600">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            className="flex items-center"
          >
            <ZoomIn className="h-4 w-4 mr-2" />
            Acercar
          </Button>
        </div>

        {/* Editor de imagen */}
        <div className="p-4 overflow-auto max-h-[60vh]">
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={circular}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxWidth: '100%',
                  maxHeight: '400px'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Canvas oculto para procesamiento */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!completedCrop}
            className="btn-primary flex items-center"
          >
            <Check className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
