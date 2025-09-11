"use client"

import { useState, useRef, ChangeEvent } from 'react'
import { supabase } from 'src/utils/supabase/client'
import { nanoid } from 'nanoid'
import Image from 'next/image'

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL for immediate display
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
      setUploadedUrl('')
      setCopySuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    setIsUploading(true)
    
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${nanoid()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('virtuesphere') // Replace with your bucket name
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('virtuesphere')
        .getPublicUrl(data.path)

      setUploadedUrl(urlData.publicUrl)
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error uploading file:', errorMessage)
      alert(`Upload failed: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!uploadedUrl) return
    
    try {
      await navigator.clipboard.writeText(uploadedUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      alert('Failed to copy URL to clipboard')
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadedUrl('')
    setPreviewUrl('')
    setCopySuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Image Upload to Supabase Storage
          </h1>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {/* Preview Section */}
          {(previewUrl || uploadedUrl) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {uploadedUrl ? 'Uploaded Image' : 'Preview'}
              </h3>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={uploadedUrl || previewUrl}
                  alt="Image preview"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && !uploadedUrl && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg 
                font-medium hover:bg-blue-700 disabled:opacity-50 
                disabled:cursor-not-allowed transition-colors mb-4"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          )}

          {/* URL Display and Copy */}
          {uploadedUrl && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    value={uploadedUrl}
                    readOnly
                    className="flex-1 block w-full rounded-none rounded-l-md 
                      border-gray-300 bg-gray-50 text-sm px-3 py-2"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-3 py-2 border 
                      border-l-0 border-gray-300 rounded-r-md bg-gray-50 
                      text-gray-500 text-sm hover:bg-gray-100 transition-colors"
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={resetUpload}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg 
                  font-medium hover:bg-gray-700 transition-colors"
              >
                Upload Another Image
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Select an image file using the file input</li>
              <li>2. Preview the image before uploading</li>
              <li>3. Click "Upload Image" to store it in Supabase</li>
              <li>4. Copy the public URL to use elsewhere</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
