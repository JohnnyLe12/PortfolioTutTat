import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { apiPost, setTokens, ApiError } from "../lib/api.js";
import { useLanguage } from "../contexts/LanguageContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    if (password.length < 8) {
      setErrors({ password: t("auth.error.passwordShort") });
      return;
    }

    setLoading(true);

    try {
      const payload = { email, password, role: "mentee" };

      const result = await apiPost("/auth/register", payload);
      const data = result.data || result;
      setTokens(data.accessToken, data.refreshToken);

      // Save user info to localStorage
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/create-profile");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors({ email: t("auth.error.emailRegistered") });
        } else if (err.status === 400) {
          const msg = err.message || t("auth.error.validationFailed");
          if (
            msg.toLowerCase().includes("password") ||
            msg.toLowerCase().includes("short") ||
            msg.toLowerCase().includes("8")
          ) {
            setErrors({ password: t("auth.error.passwordShort") });
          } else if (msg.toLowerCase().includes("email")) {
            setErrors({ email: msg });
          } else {
            setErrors({ general: msg });
          }
        } else {
          setErrors({ general: err.message || t("auth.error.somethingWrong") });
        }
      } else {
        setErrors({ general: t("auth.error.network") });
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
            {t("auth.signup.title")}
          </h1>

          <p className="text-gray-600 text-lg mt-3">
            {t("auth.signup.subtitle")}
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("auth.signup.heading")}
            </h2>
            <p className="text-gray-500 mt-1">
              {t("auth.signup.subheading")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* GENERAL ERROR */}
            {errors.general && (
              <div
                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                role="alert"
              >
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
              {t("auth.signup.google")}
            </button>

            {/* DIVIDER */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">
                  {t("auth.signup.divider")}
                </span>
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                {t("auth.signup.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder={t("auth.signup.emailPlaceholder")}
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
                {t("auth.signup.passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-12 border rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.password ? "border-red-400" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t("auth.signup.loading") : t("auth.signup.submit")}
            </button>

            {/* TERMS */}
            <p className="text-sm text-center text-gray-600">
              {t("auth.signup.terms")}{" "}
              <a href="#" className="text-indigo-600 font-medium">
                {t("auth.signup.termsLink")}
              </a>{" "}
              {t("auth.signup.and")}{" "}
              <a href="#" className="text-indigo-600 font-medium">
                {t("auth.signup.privacyLink")}
              </a>
            </p>

            {/* LOGIN */}
            <div className="pt-4 border-t text-center text-gray-600">
              {t("auth.signup.hasAccount")}{" "}
              <Link
                to="/login"
                className="text-indigo-600 font-semibold hover:text-indigo-700"
              >
                {t("auth.signup.loginLink")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
