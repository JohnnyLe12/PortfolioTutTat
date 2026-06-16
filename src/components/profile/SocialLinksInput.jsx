import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const SOCIAL_PLATFORMS = [
  { key: "behance", label: "Behance", placeholder: "https://behance.net/username" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
];

/**
 * SocialLinksInput: per-field URL inputs with inline https:// validation.
 *
 * Props:
 * - value: { behance, linkedin, instagram, github }
 * - onChange: (updatedLinks) => void
 * - errors: { behance, linkedin, instagram, github } (external errors)
 */
export default function SocialLinksInput({ value = {}, onChange, errors: externalErrors = {} }) {
  const [touched, setTouched] = useState({});

  function validateUrl(url) {
    if (!url || url.trim() === "") return "";
    if (!url.startsWith("https://")) {
      return "URL must start with https://";
    }
    return "";
  }

  function handleChange(key, inputValue) {
    const updated = { ...value, [key]: inputValue };
    onChange(updated);
  }

  function handleBlur(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function getError(key) {
    // Show validation error only after field is touched
    if (touched[key]) {
      const inlineError = validateUrl(value[key]);
      if (inlineError) return inlineError;
    }
    // Show external errors (from form submission)
    if (externalErrors[key]) return externalErrors[key];
    return "";
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold text-gray-900">Social Links</Label>
      <p className="text-sm text-gray-500 -mt-2">Add your social profiles (must start with https://)</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => {
          const error = getError(key);
          return (
            <div key={key}>
              <Label htmlFor={`social-${key}`} className="text-sm text-gray-700 mb-1.5">
                {label}
              </Label>
              <Input
                id={`social-${key}`}
                type="url"
                placeholder={placeholder}
                value={value[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
                aria-invalid={!!error}
                className={error ? "border-red-500 focus-visible:ring-red-200" : ""}
              />
              {error && (
                <p className="text-xs text-red-600 mt-1" role="alert">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { SOCIAL_PLATFORMS };
