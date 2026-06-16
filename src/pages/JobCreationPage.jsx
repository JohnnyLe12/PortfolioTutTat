import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, X, Briefcase } from "lucide-react";
import { apiPost } from "../lib/api";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "temporary", label: "Temporary" },
  { value: "volunteer", label: "Volunteer" },
];

const SENIORITY_LEVELS = [
  { value: "internship", label: "Internship" },
  { value: "entry", label: "Entry" },
  { value: "assistant", label: "Assistant" },
  { value: "mid_senior", label: "Mid-Senior" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
];

export default function JobCreationPage() {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [openSlots, setOpenSlots] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState("");
  const [minExperienceYears, setMinExperienceYears] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [requiresManagement, setRequiresManagement] = useState(false);
  const [minManagedEmployees, setMinManagedEmployees] = useState("");

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // ─── Skills Handlers ──────────────────────────────────────────────────────

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) {
      setErrors((prev) => ({ ...prev, requiredSkills: "Each skill must be at most 100 characters" }));
      return;
    }
    if (requiredSkills.length >= 20) {
      setErrors((prev) => ({ ...prev, requiredSkills: "Maximum 20 skills allowed" }));
      return;
    }
    if (requiredSkills.includes(trimmed)) {
      setSkillInput("");
      return;
    }
    setRequiredSkills([...requiredSkills, trimmed]);
    setSkillInput("");
    if (errors.requiredSkills) {
      setErrors((prev) => ({ ...prev, requiredSkills: "" }));
    }
  };

  const removeSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = () => {
    const newErrors = {};

    // Title — required, max 255
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 255) {
      newErrors.title = "Title must be at most 255 characters";
    }

    // Description — required, max 5000
    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length > 5000) {
      newErrors.description = "Description must be at most 5000 characters";
    }

    // Open Slots — required, integer 1-1000
    if (!openSlots) {
      newErrors.openSlots = "Number of Open Slots is required";
    } else {
      const slotsNum = Number(openSlots);
      if (!Number.isInteger(slotsNum) || slotsNum < 1 || slotsNum > 1000) {
        newErrors.openSlots = "Open Slots must be a positive integer between 1 and 1000";
      }
    }

    // Salary Range
    const salaryMinNum = salaryMin !== "" ? Number(salaryMin) : null;
    const salaryMaxNum = salaryMax !== "" ? Number(salaryMax) : null;

    if (salaryMin !== "") {
      if (isNaN(salaryMinNum) || salaryMinNum < 0 || salaryMinNum > 999999999) {
        newErrors.salaryMin = "Salary Min must be between 0 and 999,999,999";
      }
    }
    if (salaryMax !== "") {
      if (isNaN(salaryMaxNum) || salaryMaxNum < 0 || salaryMaxNum > 999999999) {
        newErrors.salaryMax = "Salary Max must be between 0 and 999,999,999";
      }
    }
    if (
      salaryMinNum != null &&
      salaryMaxNum != null &&
      !isNaN(salaryMinNum) &&
      !isNaN(salaryMaxNum) &&
      salaryMinNum > salaryMaxNum
    ) {
      newErrors.salaryMin = "Salary Min cannot exceed Salary Max";
    }

    // Location — max 500
    if (location.length > 500) {
      newErrors.location = "Location must be at most 500 characters";
    }

    // Min Experience — integer 0-50
    if (minExperienceYears !== "") {
      const expNum = Number(minExperienceYears);
      if (!Number.isInteger(expNum) || expNum < 0 || expNum > 50) {
        newErrors.minExperienceYears = "Min Experience must be an integer between 0 and 50";
      }
    }

    // Management — minManagedEmployees integer 1-10000 when toggle is on
    if (requiresManagement) {
      if (!minManagedEmployees) {
        newErrors.minManagedEmployees = "Minimum Managed Employees is required when management is enabled";
      } else {
        const managedNum = Number(minManagedEmployees);
        if (!Number.isInteger(managedNum) || managedNum < 1 || managedNum > 10000) {
          newErrors.minManagedEmployees = "Must be an integer between 1 and 10,000";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        openSlots: Number(openSlots),
        requiresManagement,
        requiredSkills,
      };

      if (location.trim()) payload.location = location.trim();
      if (employmentType) payload.employmentType = employmentType;
      if (seniorityLevel) payload.seniorityLevel = seniorityLevel;
      if (minExperienceYears !== "") payload.minExperienceYears = Number(minExperienceYears);
      if (salaryMin !== "") payload.salaryMin = Number(salaryMin);
      if (salaryMax !== "") payload.salaryMax = Number(salaryMax);
      if (requiresManagement && minManagedEmployees) {
        payload.minManagedEmployees = Number(minManagedEmployees);
      }

      await apiPost("/company/jobs", payload);
      navigate("/company-dashboard");
    } catch (err) {
      setApiError(err.message || "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-3xl">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Create New Job</h1>
          </div>
          <p className="text-lg text-gray-600">
            Post a new job opening to attract talented designers
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Title ─────────────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. UI Designer Intern"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                }}
                maxLength={255}
                className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* ─── Description ────────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the role, responsibilities, and expectations..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                }}
                maxLength={5000}
                className={`w-full min-h-[150px] border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">{description.length}/5000</p>
              </div>
            </div>

            {/* ─── Salary Range ───────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Salary Range
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    placeholder="Min (e.g. 5000000)"
                    value={salaryMin}
                    onChange={(e) => {
                      setSalaryMin(e.target.value);
                      if (errors.salaryMin) setErrors((prev) => ({ ...prev, salaryMin: "" }));
                    }}
                    min={0}
                    max={999999999}
                    className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.salaryMin ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.salaryMin && (
                    <p className="mt-1 text-sm text-red-600">{errors.salaryMin}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max (e.g. 15000000)"
                    value={salaryMax}
                    onChange={(e) => {
                      setSalaryMax(e.target.value);
                      if (errors.salaryMax) setErrors((prev) => ({ ...prev, salaryMax: "" }));
                    }}
                    min={0}
                    max={999999999}
                    className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.salaryMax ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.salaryMax && (
                    <p className="mt-1 text-sm text-red-600">{errors.salaryMax}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You can leave one field empty for an open range
              </p>
            </div>

            {/* ─── Open Slots ─────────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Number of Open Slots <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={openSlots}
                onChange={(e) => {
                  setOpenSlots(e.target.value);
                  if (errors.openSlots) setErrors((prev) => ({ ...prev, openSlots: "" }));
                }}
                min={1}
                max={1000}
                step={1}
                className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.openSlots ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {errors.openSlots && (
                <p className="mt-1 text-sm text-red-600">{errors.openSlots}</p>
              )}
            </div>

            {/* ─── Location ───────────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Location / Office Address
              </label>
              <input
                type="text"
                placeholder="e.g. Ho Chi Minh City, Vietnam"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: "" }));
                }}
                maxLength={500}
                className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.location ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* ─── Employment Type & Seniority Level ──────────────────── */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Employment Type</option>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Seniority Level
                </label>
                <select
                  value={seniorityLevel}
                  onChange={(e) => setSeniorityLevel(e.target.value)}
                  className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Seniority Level</option>
                  {SENIORITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── Min Experience ─────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Minimum Years of Experience
              </label>
              <input
                type="number"
                placeholder="e.g. 2"
                value={minExperienceYears}
                onChange={(e) => {
                  setMinExperienceYears(e.target.value);
                  if (errors.minExperienceYears) setErrors((prev) => ({ ...prev, minExperienceYears: "" }));
                }}
                min={0}
                max={50}
                step={1}
                className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.minExperienceYears ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {errors.minExperienceYears && (
                <p className="mt-1 text-sm text-red-600">{errors.minExperienceYears}</p>
              )}
            </div>

            {/* ─── Required Skills ────────────────────────────────────── */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Required Skills
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
              {errors.requiredSkills && (
                <p className="mt-1 text-sm text-red-600">{errors.requiredSkills}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {requiredSkills.length}/20 skills added
              </p>

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-500 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Management Requirements Toggle ─────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={requiresManagement}
                  onClick={() => {
                    setRequiresManagement(!requiresManagement);
                    if (!requiresManagement === false) {
                      setMinManagedEmployees("");
                      if (errors.minManagedEmployees) {
                        setErrors((prev) => ({ ...prev, minManagedEmployees: "" }));
                      }
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    requiresManagement ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      requiresManagement ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <label className="font-medium text-gray-700">
                  Management Requirements
                </label>
              </div>

              {/* Conditional field */}
              {requiresManagement && (
                <div className="ml-14">
                  <label className="block mb-2 font-medium text-gray-700">
                    Minimum Managed Employees <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={minManagedEmployees}
                    onChange={(e) => {
                      setMinManagedEmployees(e.target.value);
                      if (errors.minManagedEmployees) setErrors((prev) => ({ ...prev, minManagedEmployees: "" }));
                    }}
                    min={1}
                    max={10000}
                    step={1}
                    className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.minManagedEmployees ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.minManagedEmployees && (
                    <p className="mt-1 text-sm text-red-600">{errors.minManagedEmployees}</p>
                  )}
                </div>
              )}
            </div>

            {/* ─── Submit Button ───────────────────────────────────────── */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Job..." : "Create Job Posting"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
