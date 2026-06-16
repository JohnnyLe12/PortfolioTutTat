import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Check, Plus, X } from "lucide-react";
import { apiPost, apiPut, apiGet } from "../lib/api";

const MAJORS = [
  { value: "Graphic_Design", label: "Graphic Design" },
  { value: "UI_UX", label: "UI/UX" },
  { value: "Multimedia", label: "Multimedia" },
  { value: "Motion_Design", label: "Motion Design" },
];

const DESIGN_TOOLS = [
  "Figma",
  "Adobe XD",
  "Sketch",
  "Photoshop",
  "Illustrator",
  "After Effects",
  "InVision",
  "Blender",
];

const INTERESTS = [
  "Graphic Design",
  "UI/UX",
  "Motion Design",
  "Illustration",
  "Branding",
  "3D Design",
  "Typography",
  "Web Design",
];

/**
 * Calculates completion percentage for the buddy profile form.
 * Fields (9 total): fullName, roleTitle, bio, avatarUrl, major, skills, designTools, interests, socialLinks
 */
function calculateCompletionPct({ fullName, roleTitle, bio, avatarUrl, major, skills, designTools, interests, socialLinks }) {
  const fields = [
    (fullName?.trim().length ?? 0) > 0,
    (roleTitle?.trim().length ?? 0) > 0,
    (bio?.trim().length ?? 0) > 0,
    (avatarUrl?.trim().length ?? 0) > 0,
    major != null && major !== "",
    (skills?.length ?? 0) > 0,
    (designTools?.length ?? 0) > 0,
    (interests?.length ?? 0) > 0,
    hasSocialLink(socialLinks),
  ];

  const filledCount = fields.filter(Boolean).length;
  return Math.floor((filledCount / 9) * 100);
}

function hasSocialLink(socialLinks) {
  if (!socialLinks || typeof socialLinks !== "object") return false;
  return Object.values(socialLinks).some(
    (url) => typeof url === "string" && url.trim().length > 0 && url.startsWith("https://")
  );
}

export default function CreateBuddyProfilePage() {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [major, setMajor] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [socialLinks, setSocialLinks] = useState({
    behance: "",
    linkedin: "",
    instagram: "",
    github: "",
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check if profile already exists — if fully completed redirect to dashboard
  useEffect(() => {
    let cancelled = false;
    async function checkExistingProfile() {
      try {
        const response = await apiGet("/buddy/profile/me");
        const profile = response.data || response;
        // Only redirect if profile is substantially filled (completion > 20%)
        // Otherwise stay on create page to let user fill in details
        if (!cancelled && profile && profile.completionPct > 20) {
          navigate("/buddy-dashboard", { replace: true });
        }
      } catch {
        // 404 or error means no profile exists — stay on create page
      } finally {
        if (!cancelled) {
          setIsCheckingProfile(false);
        }
      }
    }
    checkExistingProfile();
    return () => { cancelled = true; };
  }, [navigate]);

  // Calculate completion percentage
  const completionPct = useMemo(
    () =>
      calculateCompletionPct({
        fullName,
        roleTitle,
        bio,
        avatarUrl,
        major,
        skills,
        designTools: selectedTools,
        interests: selectedInterests,
        socialLinks,
      }),
    [fullName, roleTitle, bio, avatarUrl, major, skills, selectedTools, selectedInterests, socialLinks]
  );

  // Handlers
  const toggleTool = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      if (selectedTools.length >= 20) return;
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length >= 20) return;
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) {
      setErrors((prev) => ({ ...prev, skills: "Each skill must be at most 100 characters" }));
      return;
    }
    if (skills.length >= 20) {
      setErrors((prev) => ({ ...prev, skills: "Maximum 20 skills allowed" }));
      return;
    }
    if (skills.includes(trimmed)) {
      setSkillInput("");
      return;
    }
    setSkills([...skills, trimmed]);
    setSkillInput("");
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: "" }));
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSocialLinkChange = (key, value) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
    if (errors[`socialLinks.${key}`]) {
      setErrors((prev) => ({ ...prev, [`socialLinks.${key}`]: "" }));
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    } else if (fullName.length > 255) {
      newErrors.fullName = "Full Name must be at most 255 characters";
    }

    if (!roleTitle.trim()) {
      newErrors.roleTitle = "Role Title is required";
    } else if (roleTitle.length > 255) {
      newErrors.roleTitle = "Role Title must be at most 255 characters";
    }

    if (bio.length > 2000) {
      newErrors.bio = "Bio must be at most 2000 characters";
    }

    if (avatarUrl.length > 500) {
      newErrors.avatarUrl = "Avatar URL must be at most 500 characters";
    }

    // Validate social links
    const socialLinkKeys = ["behance", "linkedin", "instagram", "github"];
    for (const key of socialLinkKeys) {
      const url = socialLinks[key]?.trim();
      if (url && !url.startsWith("https://")) {
        newErrors[`socialLinks.${key}`] = "URL must start with https://";
      } else if (url && url.length > 500) {
        newErrors[`socialLinks.${key}`] = "URL must be at most 500 characters";
      }
    }

    // Validate skills
    if (skills.length > 20) {
      newErrors.skills = "Maximum 20 skills allowed";
    }
    for (const skill of skills) {
      if (skill.length > 100) {
        newErrors.skills = "Each skill must be at most 100 characters";
        break;
      }
    }

    if (selectedTools.length > 20) {
      newErrors.designTools = "Maximum 20 design tools allowed";
    }

    if (selectedInterests.length > 20) {
      newErrors.interests = "Maximum 20 interests allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Build social links — only include non-empty values
      const cleanSocialLinks = {};
      for (const [key, value] of Object.entries(socialLinks)) {
        const trimmed = value.trim();
        if (trimmed) {
          cleanSocialLinks[key] = trimmed;
        }
      }

      const payload = {
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        major: major || undefined,
        skills,
        designTools: selectedTools,
        interests: selectedInterests,
        socialLinks: cleanSocialLinks,
      };

      await apiPut("/buddy/profile/me", payload);
      navigate("/buddy-dashboard");
    } catch (err) {
      setApiError(err.message || "Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-2xl">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create Your Buddy Profile
          </h1>
          <p className="text-lg text-gray-600">
            Set up your reviewer profile to start helping mentees
          </p>
        </div>

        {/* COMPLETION PERCENTAGE */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Profile Completion
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {completionPct}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            ></div>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Profile Information
            </h2>
            <p className="text-gray-500 mt-1">
              Help mentees understand your expertise
            </p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FULL NAME + ROLE TITLE */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  maxLength={255}
                  className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.fullName ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Senior UI/UX Designer"
                  value={roleTitle}
                  onChange={(e) => {
                    setRoleTitle(e.target.value);
                    if (errors.roleTitle) setErrors((prev) => ({ ...prev, roleTitle: "" }));
                  }}
                  maxLength={255}
                  className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.roleTitle ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errors.roleTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.roleTitle}</p>
                )}
              </div>
            </div>

            {/* BIO */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Bio
              </label>
              <textarea
                placeholder="Tell mentees about your background, experience, and what you can help with..."
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) setErrors((prev) => ({ ...prev, bio: "" }));
                }}
                maxLength={2000}
                className={`w-full min-h-[120px] border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.bio ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              <p className="text-sm text-gray-500 mt-1">{bio.length}/2000</p>
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
              )}
            </div>

            {/* AVATAR URL */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Avatar URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  if (errors.avatarUrl) setErrors((prev) => ({ ...prev, avatarUrl: "" }));
                }}
                maxLength={500}
                className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.avatarUrl ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {errors.avatarUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.avatarUrl}</p>
              )}
            </div>

            {/* MAJOR */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Major
              </label>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a major</option>
                {MAJORS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* SKILLS */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Skills
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  maxLength={100}
                  className="flex-1 h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="h-11 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">{skills.length}/20 skills</p>
              {errors.skills && (
                <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
              )}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-500 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* DESIGN TOOLS */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Design Tools
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Select the tools you're proficient with ({selectedTools.length}/20)
              </p>
              {errors.designTools && (
                <p className="mb-2 text-sm text-red-600">{errors.designTools}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {DESIGN_TOOLS.map((tool) => (
                  <button
                    type="button"
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`px-4 py-2 rounded-full border transition-all flex items-center gap-1 text-sm font-medium
                    ${
                      selectedTools.includes(tool)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {selectedTools.includes(tool) && <Check className="w-3 h-3" />}
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            {/* INTERESTS */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Interests
              </label>
              <p className="text-sm text-gray-500 mb-4">
                What type of design work excites you? ({selectedInterests.length}/20)
              </p>
              {errors.interests && (
                <p className="mb-2 text-sm text-red-600">{errors.interests}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border transition-all flex items-center gap-1 text-sm font-medium
                    ${
                      selectedInterests.includes(interest)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {selectedInterests.includes(interest) && <Check className="w-3 h-3" />}
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* SOCIAL LINKS */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Social Links
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Add your social media profiles (must start with https://)
              </p>
              <div className="space-y-3">
                {[
                  { key: "behance", label: "Behance", placeholder: "https://www.behance.net/yourprofile" },
                  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/yourprofile" },
                  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/yourprofile" },
                  { key: "github", label: "GitHub", placeholder: "https://github.com/yourprofile" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block mb-1 text-sm text-gray-600">{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={socialLinks[key]}
                      onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                      maxLength={500}
                      className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors[`socialLinks.${key}`] ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors[`socialLinks.${key}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`socialLinks.${key}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 h-12 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Profile..." : "Create Buddy Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
