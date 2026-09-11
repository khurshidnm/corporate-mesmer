"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5MB")
      return
    }

    setIsUploading(true)

    try {
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onChange(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Ошибка при загрузке изображения")
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("/placeholder.svg?height=100&width=100&query=professional person")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-32 h-32 mx-auto">
        <div className="relative w-full h-full">
          <Image
            src={value || "/placeholder.svg?height=128&width=128&query=professional person"}
            alt="Profile"
            width={128}
            height={128}
            className="w-full h-full object-cover rounded-full border-2 border-gray-200"
          />
          {value && !value.includes("placeholder.svg") && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={handleRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full max-w-xs"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Загрузка..." : "Выбрать фото"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <p className="text-xs text-gray-500 text-center">Поддерживаются JPG, PNG, GIF до 5MB</p>
    </div>
  )
}
