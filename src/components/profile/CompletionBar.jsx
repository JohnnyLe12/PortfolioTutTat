import { Progress } from "../ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Profile completion fields (9 total):
 * fullName, roleTitle, bio, avatarUrl, major, skills, designTools, interests, socialLinks
 */
const COMPLETION_FIELDS = [
  { key: "fullName", label: "Full Name" },
  { key: "roleTitle", label: "Role Title" },
  { key: "bio", label: "Bio" },
  { key: "avatarUrl", label: "Avatar" },
  { key: "major", label: "Major" },
  { key: "skills", label: "Skills" },
  { key: "designTools", label: "Design Tools" },
  { key: "interests", label: "Interests" },
  { key: "socialLinks", label: "Social Links" },
];

/**
 * Determine if a field counts as "filled".
 */
function isFieldFilled(profile, key) {
  if (!profile) return false;
  const value = profile[key];

  if (key === "skills" || key === "designTools" || key === "interests") {
    return Array.isArray(value) && value.length > 0;
  }

  if (key === "socialLinks") {
    if (!value || typeof value !== "object") return false;
    return Object.values(value).some((v) => v && v.trim() !== "");
  }

  return !!value && String(value).trim() !== "";
}

/**
 * Calculate completion percentage from profile data.
 */
export function calculateCompletion(profile) {
  if (!profile) return { percentage: 0, filledCount: 0, totalCount: COMPLETION_FIELDS.length, missingFields: COMPLETION_FIELDS };
  const filled = COMPLETION_FIELDS.filter((f) => isFieldFilled(profile, f.key));
  const missing = COMPLETION_FIELDS.filter((f) => !isFieldFilled(profile, f.key));
  const percentage = Math.round((filled.length / COMPLETION_FIELDS.length) * 100);
  return { percentage, filledCount: filled.length, totalCount: COMPLETION_FIELDS.length, missingFields: missing };
}

/**
 * CompletionBar: shows profile completion progress and suggests next step.
 *
 * Props:
 * - profile: the profile object from API
 * - className: optional wrapper className
 */
export default function CompletionBar({ profile, className = "" }) {
  const { percentage, missingFields } = calculateCompletion(profile);

  // Suggest the first missing field as next step
  const nextStep = missingFields.length > 0 ? missingFields[0] : null;

  const isComplete = percentage === 100;

  return (
    <div className={`bg-white border rounded-2xl p-6 shadow-sm ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {isComplete ? "Profile Complete!" : "Complete Your Profile"}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {isComplete
              ? "Great job! Your profile is fully set up."
              : nextStep
                ? `Next step: Add your ${nextStep.label}`
                : `${percentage}% complete`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <span className={`text-2xl font-bold ${isComplete ? "text-green-600" : "text-indigo-600"}`}>
            {percentage}%
          </span>
        </div>
      </div>

      <Progress value={percentage} className="h-3" />

      {!isComplete && missingFields.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {missingFields.slice(0, 3).map((field) => (
            <span
              key={field.key}
              className="inline-block text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
            >
              + {field.label}
            </span>
          ))}
          {missingFields.length > 3 && (
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
              +{missingFields.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
