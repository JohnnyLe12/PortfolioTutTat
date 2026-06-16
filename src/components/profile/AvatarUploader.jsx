import { useState, useRef } from "react";
import { Camera, Upload, Loader2, User } from "lucide-react";
import { Button } from "../ui/button";
import { apiPost } from "../../lib/api";

const ACCEPTED_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * AvatarUploader: allows mentee to upload/change their profile avatar.
 *
 * Props:
 * - currentAvatarUrl: the current avatar URL (or null/undefined for placeholder)
 * - onUploadSuccess: callback with new avatar URL after successful upload
 * - className: optional wrapper className
 */
export default function AvatarUploader({ currentAvatarUrl, onUploadSuccess, className = "" }) {
  const [preview, setPreview] = useState(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function validateFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "File must be PNG, JPG, JPEG, or WEBP";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File must be less than 5MB";
    }
    return null;
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      // Reset file input so user can re-select
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload file
    uploadAvatar(file);
  }

  async function uploadAvatar(file) {
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiPost("/profiles/me/avatar", formData);
      const newAvatarUrl = response.data?.avatarUrl || response.avatarUrl;

      if (newAvatarUrl) {
        setPreview(newAvatarUrl);
      }

      if (onUploadSuccess) {
        onUploadSuccess(newAvatarUrl);
      }
    } catch (err) {
      setError(err.message || "Failed to upload avatar. Please try again.");
      // Revert preview to current avatar on failure
      setPreview(currentAvatarUrl || null);
    } finally {
      setUploading(false);
      // Reset file input so user can re-select
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleButtonClick() {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Avatar Preview */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-gray-400" />
          )}

          {/* Upload overlay on hover */}
          {!uploading && (
            <button
              type="button"
              onClick={handleButtonClick}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              aria-label="Change avatar"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select avatar file"
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={uploading}
        className="gap-1.5"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Photo
          </>
        )}
      </Button>

      {/* Accepted formats hint */}
      <p className="text-xs text-gray-400">PNG, JPG, JPEG, WEBP • Max 5MB</p>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 text-center max-w-[200px]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
