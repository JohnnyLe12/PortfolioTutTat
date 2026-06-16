import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check } from "lucide-react";
import { apiPut } from "../lib/api";

export default function CreateProfilePage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const interests = [
    "Graphic Design",
    "UI/UX",
    "Motion Design",
    "Illustration",
    "Branding",
    "3D Design",
  ];

  const tools = [
    "Figma",
    "Adobe XD",
    "Sketch",
    "Photoshop",
    "Illustrator",
    "After Effects",
  ];

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(
        selectedInterests.filter((item) => item !== interest)
      );
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const toggleTool = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((item) => item !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }

    if (!roleTitle.trim()) {
      newErrors.roleTitle = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        designTools: selectedTools,
        interests: selectedInterests,
        bio: bio.trim() || undefined,
      };

      await apiPut("/profiles/me", payload);
      navigate("/dashboard");
    } catch (err) {
      setApiError(
        err.message || "Failed to save profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-2xl">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Complete Your Profile
          </h1>

          <p className="text-lg text-gray-600">
            Tell us about yourself to get started
          </p>
        </div>

        {/* PROGRESS */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step 2 of 2
            </span>

            <span className="text-sm font-medium text-indigo-600">
              66% Complete
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: "66%" }}
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
              Help us personalize your experience
            </p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NAME + ROLE */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: "" }));
                    }
                  }}
                  className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.fullName
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />

                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Role
                </label>

                <input
                  type="text"
                  placeholder="UI/UX Designer"
                  value={roleTitle}
                  onChange={(e) => {
                    setRoleTitle(e.target.value);
                    if (errors.roleTitle) {
                      setErrors((prev) => ({ ...prev, roleTitle: "" }));
                    }
                  }}
                  className={`w-full h-11 border rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.roleTitle
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />

                {errors.roleTitle && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.roleTitle}
                  </p>
                )}
              </div>
            </div>

            {/* SKILLS */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Skills
              </label>

              <input
                type="text"
                placeholder="UI Design, User Research, Prototyping..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <p className="text-sm text-gray-500 mt-2">
                Separate skills with commas
              </p>
            </div>

            {/* TOOLS */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Design Tools
              </label>

              <p className="text-sm text-gray-500 mb-4">
                Select the tools you're proficient with
              </p>

              <div className="flex flex-wrap gap-3">
                {tools.map((tool) => (
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
                    {selectedTools.includes(tool) && (
                      <Check className="w-3 h-3" />
                    )}

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
                What type of design work excites you?
              </p>

              <div className="flex flex-wrap gap-3">
                {interests.map((interest) => (
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
                    {selectedInterests.includes(interest) && (
                      <Check className="w-3 h-3" />
                    )}

                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* BIO */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Bio (Optional)
              </label>

              <textarea
                placeholder="Tell us about yourself and your design journey..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full min-h-[120px] border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="flex-1 h-12 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Complete Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
