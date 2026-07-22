import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { UploadCloud, Check, Loader2, Image, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  label: string;
  isBengali: boolean;
  currentImageUrl?: string;
}

export default function ImageUploader({ onUploadSuccess, label, isBengali, currentImageUrl }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "avqjx12l";
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || "kvj9h46r";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    // Basic validation
    if (!file.type.startsWith("image/")) {
      setError(isBengali ? "অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন।" : "Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError(isBengali ? "ছবিটির সাইজ ৫ মেগাবাইট (5MB) এর নিচে হতে হবে।" : "Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    // Create instant local blob preview for fluid experience
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
      }

      const secureUrl = data.secure_url;
      setPreviewUrl(secureUrl);
      onUploadSuccess(secureUrl);
    } catch (err: any) {
      console.error("Cloudinary upload error:", err);
      setError(isBengali ? "আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" : "Upload failed. Please try again.");
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-zinc-400 font-sans font-semibold text-xs tracking-wide uppercase">
        {label}
      </label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerSelect}
        className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all min-h-[110px] ${
          isDragging 
            ? "border-violet-500 bg-violet-950/20" 
            : previewUrl 
              ? "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700" 
              : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2 text-violet-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-medium font-mono">
              {isBengali ? "আপলোড হচ্ছে..." : "Uploading to cloud..."}
            </span>
          </div>
        ) : previewUrl ? (
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-12 h-12 object-cover rounded-lg border border-zinc-800 shadow-md bg-zinc-950"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-[11px] text-zinc-400 block font-mono">
                  {isBengali ? "ছবি প্রস্তুত" : "Image Connected"}
                </span>
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> {isBengali ? "আপলোড সম্পন্ন" : "Cloud Hosted"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerSelect();
              }}
              className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-white px-2.5 py-1.5 rounded-md border border-zinc-700/50 font-sans font-bold"
            >
              {isBengali ? "পরিবর্তন" : "Change"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-1 text-zinc-500">
            <UploadCloud className="w-7 h-7 text-zinc-600 mb-1" />
            <p className="text-xs font-semibold text-zinc-300">
              {isBengali ? "এখানে ড্র্যাগ করুন অথবা ক্লিক করুন" : "Drag and drop or click to select"}
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">
              PNG, JPG, WEBP (MAX 5MB)
            </p>
          </div>
        )}

        {error && (
          <div className="absolute bottom-2 left-2 right-2 p-1.5 bg-red-950/80 border border-red-800 rounded-lg flex items-center gap-1.5 text-[10px] text-red-300">
            <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
            <span className="font-sans truncate">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
