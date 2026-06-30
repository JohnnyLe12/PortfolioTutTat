import { useState, useEffect } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import SocialLinksInput from "./SocialLinksInput";
import AvatarUploader from "./AvatarUploader";
import { apiGet, apiPut } from "../../lib/api";
import { useLanguage } from "../../contexts/LanguageContext";

const MAJOR_OPTIONS = [
  { value: "Graphic_Design", label: "Graphic Design" },
  { value: "UI_UX", label: "UI/UX" },
  { value: "Multimedia", label: "Multimedia" },
  { value: "Motion_Design", label: "Motion Design" },
];

const TOOL_OPTIONS = [
  "Figma",
  "Adobe XD",
  "Sketch",
  "Photoshop",
  "Illustrator",
  "After Effects",
  "InDesign",
  "Blender",
  "Cinema 4D",
  "Premiere Pro",
];

const INTEREST_OPTIONS = [
  "Graphic Design",
  "UI/UX",
  "Motion Design",
  "Illustration",
  "Branding",
  "3D Design",
  "Typography",
  "Photography",
  "Web Design",
  "Product Design",
];

/**
 * ProfileEditForm: full edit form for mentee profile.
 *
 * Props:
 * - onSaveSuccess: callback when profile is saved successfully
 * - className: optional wrapper className
 */
export default function ProfileEditForm({ onSaveSuccess, className = "" }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [avatarUrl, setAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    major: "",
    skills: "",
    designTools: [],
    interests: [],
    socialLinks: { behance: "", linkedin: "", instagram: "", github: "" },
  });

  // Fetch current profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await apiGet("/profiles/me");
        const profile = response.data || response;

        setFormData({
          fullName: profile.fullName || "",
          bio: profile.bio || "",
          major: profile.major || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
          designTools: Array.isArray(profile.designTools) ? profile.designTools : [],
          interests: Array.isArray(profile.interests) ? profile.interests : [],
          socialLinks: {
            behance: profile.socialLinks?.behance || "",
            linkedin: profile.socialLinks?.linkedin || "",
            instagram: profile.socialLinks?.instagram || "",
            github: profile.socialLinks?.github || "",
          },
        });
        setAvatarUrl(profile.avatarUrl || null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function toggleArrayItem(field, item) {
    setFormData((prev) => {
      const current = prev[field];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [field]: updated };
    });
  }

  function validateSocialLinks(links) {
    const linkErrors = {};
    Object.entries(links).forEach(([key, url]) => {
      if (url && url.trim() !== "" && !url.startsWith("https://")) {
        linkErrors[key] = "URL must start with https://";
      }
    });
    return linkErrors;
  }

  function validate() {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    // Validate social links
    const linkErrors = validateSocialLinks(formData.socialLinks);
    if (Object.keys(linkErrors).length > 0) {
      newErrors.socialLinks = linkErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMessage("");

    if (!validate()) return;

    setSaving(true);
    try {
      // Build payload for API
      const payload = {
        fullName: formData.fullName.trim(),
        bio: formData.bio.trim() || undefined,
        major: formData.major || undefined,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        designTools: formData.designTools,
        interests: formData.interests,
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks).filter(([, v]) => v && v.trim() !== "")
        ),
      };

      await apiPut("/profiles/me", payload);
      setSuccessMessage("Profile updated successfully!");
      if (onSaveSuccess) onSaveSuccess();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      if (err.status === 400) {
        setErrors({ form: err.message || "Validation failed. Please check your inputs." });
      } else {
        setErrors({ form: "An error occurred. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`bg-white border rounded-2xl p-8 flex items-center justify-center ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-500">Loading profile...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-white border rounded-2xl p-6 shadow-sm ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t("profile.edit.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("profile.edit.subtitle")}</p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {/* Form-level error */}
      {errors.form && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.form}
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex justify-center pb-4 border-b">
          <AvatarUploader
            currentAvatarUrl={avatarUrl}
            onUploadSuccess={(newUrl) => setAvatarUrl(newUrl)}
          />
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-1.5">
            {t("profile.edit.fullName")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Doe"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            aria-invalid={!!errors.fullName}
            className={errors.fullName ? "border-red-500" : ""}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 mt-1" role="alert">{errors.fullName}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-1.5">
            {t("profile.edit.bio")}
          </Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself and your design journey..."
            value={formData.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            maxLength={2000}
            rows={4}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {formData.bio.length}/2000
          </p>
        </div>

        {/* Major (single select) */}
        <div>
          <Label htmlFor="major" className="text-sm font-medium text-gray-700 mb-1.5">
            {t("profile.edit.major")}
          </Label>
          <select
            id="major"
            value={formData.major}
            onChange={(e) => handleChange("major", e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select your major</option>
            {MAJOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Skills (comma-separated input) */}
        <div>
          <Label htmlFor="skills" className="text-sm font-medium text-gray-700 mb-1.5">
            {t("profile.edit.skills")}
          </Label>
          <Input
            id="skills"
            type="text"
            placeholder="UI Design, User Research, Prototyping..."
            value={formData.skills}
            onChange={(e) => handleChange("skills", e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
        </div>

        {/* Design Tools (multi-select toggle buttons) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5">
            {t("profile.edit.designTools")}
          </Label>
          <p className="text-xs text-gray-500 mb-3">Select the tools you're proficient with</p>
          <div className="flex flex-wrap gap-2">
            {TOOL_OPTIONS.map((tool) => {
              const selected = formData.designTools.includes(tool);
              return (
                <button
                  type="button"
                  key={tool}
                  onClick={() => toggleArrayItem("designTools", tool)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1
                    ${selected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 text-gray-700 hover:border-indigo-400"
                    }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {tool}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests (multi-select toggle buttons) */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5">
            {t("profile.edit.interests")}
          </Label>
          <p className="text-xs text-gray-500 mb-3">What type of design work excites you?</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = formData.interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleArrayItem("interests", interest)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-1
                    ${selected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 text-gray-700 hover:border-indigo-400"
                    }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Social Links */}
        <SocialLinksInput
          value={formData.socialLinks}
          onChange={(links) => handleChange("socialLinks", links)}
          errors={errors.socialLinks || {}}
        />
      </div>

      {/* Submit button */}
      <div className="mt-8 flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-[140px]">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t("profile.edit.save")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
