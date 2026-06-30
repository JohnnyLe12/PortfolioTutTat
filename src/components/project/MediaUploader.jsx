import { useState, useCallback, useRef } from "react";
import { Upload, Image, X } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useLanguage } from "../../contexts/LanguageContext";

const DEFAULT_ACCEPTED_TYPES = [
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_MAX_FILES = 10;

/**
 * MediaUploader component with drag-drop zone, preview grid, and per-file delete.
 *
 * Props:
 * - files: array of { file, preview, name } objects (controlled)
 * - onFilesChange: (files) => void — called when files change
 * - maxFiles: number (default 10)
 * - maxSizeMB: number (default 10)
 * - acceptedTypes: string[] (default PNG, JPG, JPEG, WEBP, GIF)
 * - onError: (message: string) => void
 */
export default function MediaUploader({
  files = [],
  onFilesChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  onError,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useLanguage();

  const validateFiles = useCallback(
    (fileList) => {
      const validFiles = [];
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      for (const file of fileList) {
        // Check type
        if (!acceptedTypes.includes(file.type)) {
          onError?.(
            `File "${file.name}" has unsupported format. Accepted: PNG, JPG, JPEG, WEBP, GIF.`
          );
          continue;
        }

        // Check size
        if (file.size > maxSizeBytes) {
          onError?.(
            `File "${file.name}" exceeds the ${maxSizeMB}MB size limit.`
          );
          continue;
        }

        validFiles.push(file);
      }

      // Check total count limit
      const totalCount = files.length + validFiles.length;
      if (totalCount > maxFiles) {
        onError?.(`Maximum ${maxFiles} files allowed. You already have ${files.length}.`);
        return validFiles.slice(0, maxFiles - files.length);
      }

      return validFiles;
    },
    [files.length, maxFiles, maxSizeMB, acceptedTypes, onError]
  );

  const addFiles = useCallback(
    (rawFiles) => {
      const validFiles = validateFiles(rawFiles);
      if (validFiles.length === 0) return;

      const newFileObjects = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));

      onFilesChange?.([...files, ...newFileObjects]);
    },
    [files, validateFiles, onFilesChange]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    // Revoke old preview URL to prevent memory leaks
    if (files[index]?.preview) {
      URL.revokeObjectURL(files[index].preview);
    }
    onFilesChange?.(updated);
  };

  const acceptString = acceptedTypes.join(",");

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? "border-indigo-600 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-indigo-600" />
          </div>

          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {isDragging ? "Drop files here" : t("upload.dragDrop")}
          </h3>

          <p className="text-gray-600 mb-4">{t("upload.orBrowse")}</p>

          <input
            ref={fileInputRef}
            id="media-upload"
            type="file"
            multiple
            accept={acceptString}
            className="hidden"
            onChange={handleFileChange}
          />

          <label htmlFor="media-upload">
            <Button variant="outline" className="border-2" asChild>
              <span>
                <Image className="h-4 w-4 mr-2" />
                {t("upload.chooseFiles")}
              </span>
            </Button>
          </label>

          <p className="text-sm text-gray-500 mt-4">
            {t("upload.fileFormats")}
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div>
          <Label className="text-base mb-3 block">
            Uploaded Files ({files.length})
          </Label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="aspect-square w-full object-cover rounded-lg border"
                />

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>

                <p className="text-xs text-gray-500 mt-2 truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
