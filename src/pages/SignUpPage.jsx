import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Users, Briefcase, Building2, ShieldCheck, ArrowLeft } from "lucide-react";
import { apiPost, setTokens, ApiError } from "../lib/api.js";

const ROLES = [
  {
    value: "mentee",
    label: "Mentee",
    description: "Build your portfolio and get feedback",
    icon: Users,
  },
  {
    value: "buddy",
    label: "Buddy",
    description: "Review portfolios and mentor others",
    icon: Briefcase,
  },
  {
    value: "company",
    label: "Company",
    description: "Post jobs and find talent",
    icon: Building2,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage the platform",
    icon: ShieldCheck,
  },
];

export default function SignUpPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState("role"); // "role" | "credentials"
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRoleNext = () => {
    if (!selectedRole) {
      setErrors({ role: "Please select a role to continue" });
      return;
    }
    setErrors({});
    setStep("credentials");
  };

  const handleBackToRole = () => {
    setErrors({});
    setStep("role");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Double-check role is selected (defensive)
    if (!selectedRole) {
      setErrors({ role: "Please select a role to continue" });
      setStep("role");
      return;
    }

    setLoading(true);

    try {
      const payload = { email, password, role: selectedRole };
      if (selectedRole === "admin" && inviteCode) {
        payload.inviteCode = inviteCode;
      }

      const result = await apiPost("/auth/register", payload);
      const data = result.data || result;
      setTokens(data.accessToken, data.refreshToken);

      // Save user info (including role) to localStorage for sidebar/routing
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Use the redirect path from the API response
      const redirectPath = data.redirectPath || "/create-profile";
      navigate(redirectPath);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors({ email: "Email already registered" });
        } else if (err.status === 403) {
          setErrors({ general: err.message || "Invalid admin invite code" });
        } else if (err.status === 400) {
          setErrors({ general: err.message || "Validation failed" });
        } else {
          setErrors({ general: err.message || "Something went wrong" });
        }
      } else {
        setErrors({ general: "Network error. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">Tút Tát</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mt-6">
            Create your account
          </h1>

          <p className="text-gray-600 text-lg mt-3">
            Start building your creative career today
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
          {step === "role" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Choose your role
                </h2>
                <p className="text-gray-500 mt-1">
                  Select how you want to use the platform
                </p>
              </div>

              {/* ROLE ERROR */}
              {errors.role && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                  {errors.role}
                </div>
              )}

              {/* ROLE OPTIONS */}
              <div className="space-y-3 mb-6">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.value);
                        setErrors({});
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`Select role: ${role.label}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            isSelected ? "text-indigo-900" : "text-gray-900"
                          }`}
                        >
                          {role.label}
                        </p>
                        <p
                          className={`text-sm ${
                            isSelected ? "text-indigo-700" : "text-gray-500"
                          }`}
                        >
                          {role.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CONTINUE BUTTON */}
              <button
                type="button"
                onClick={handleRoleNext}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                Continue
              </button>

              {/* LOGIN LINK */}
              <div className="pt-4 mt-4 border-t text-center text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  Log in
                </Link>
              </div>
            </>
          )}

          {step === "credentials" && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleBackToRole}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to role selection
                </button>

                <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
                <p className="text-gray-500 mt-1">
                  Signing up as{" "}
                  <span className="font-semibold text-indigo-600 capitalize">
                    {selectedRole}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* GENERAL ERROR */}
                {errors.general && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
                    {errors.general}
                  </div>
                )}

                {/* GOOGLE BUTTON */}
                <button
                  type="button"
                  className="w-full h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all font-medium"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 
                      1.37-1.04 2.53-2.21 
                      3.31v2.77h3.57c2.08-1.92 
                      3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 
                      7.28-2.66l-3.57-2.77c-.98.66-2.23 
                      1.06-3.71 
                      1.06-2.86 
                      0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 
                      20.53 7.7 23 12 23z"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* DIVIDER */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full h-12 border rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.email ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Create a strong password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full h-12 border rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.password ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* ADMIN INVITE CODE */}
                {selectedRole === "admin" && (
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Admin Invite Code
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Enter invite code"
                        required
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="w-full h-12 border border-gray-300 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>

                {/* TERMS */}
                <p className="text-sm text-center text-gray-600">
                  By signing up, you agree to our{" "}
                  <a href="#" className="text-indigo-600 font-medium">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-indigo-600 font-medium">
                    Privacy Policy
                  </a>
                </p>

                {/* LOGIN */}
                <div className="pt-4 border-t text-center text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-indigo-600 font-semibold hover:text-indigo-700"
                  >
                    Log in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
