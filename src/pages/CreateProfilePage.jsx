import { Link } from "react-router-dom";
import { useState } from "react";
import { Check } from "lucide-react";

export default function CreateProfilePage() {
  const navigate = useNavigate();

  const [selectedInterests, setSelectedInterests] =
    useState([]);

  const [selectedTools, setSelectedTools] =
    useState([]);

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
        selectedInterests.filter(
          (item) => item !== interest
        )
      );
    } else {
      setSelectedInterests([
        ...selectedInterests,
        interest,
      ]);
    }
  };

  const toggleTool = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(
        selectedTools.filter(
          (item) => item !== tool
        )
      );
    } else {
      setSelectedTools([
        ...selectedTools,
        tool,
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
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

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* NAME + ROLE */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Jane Doe"
                  required
                  className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Role
                </label>

                <input
                  type="text"
                  placeholder="UI/UX Designer"
                  required
                  className="w-full h-11 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                    onClick={() =>
                      toggleInterest(interest)
                    }
                    className={`px-4 py-2 rounded-full border transition-all flex items-center gap-1 text-sm font-medium
                    ${
                      selectedInterests.includes(
                        interest
                      )
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {selectedInterests.includes(
                      interest
                    ) && (
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
                className="w-full min-h-[120px] border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() =>
                  navigate("/signup")
                }
                className="flex-1 h-12 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Back
              </button>

              <button
                type="submit"
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                Complete Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
