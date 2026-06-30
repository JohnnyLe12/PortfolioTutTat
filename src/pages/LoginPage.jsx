import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Mail,
  Lock,
  CheckCircle,
} from "lucide-react";
import { apiPost, setTokens, ApiError } from "../lib/api.js";
import { useLanguage } from "../contexts/LanguageContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = await apiPost("/auth/login", { email, password });
      const data = result.data || result;
      setTokens(data.accessToken, data.refreshToken);

      // Save user info (including role) to localStorage for sidebar/routing
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Navigate based on user role
      const role = data.user?.role;
      if (role === 'buddy') {
        navigate("/buddy-dashboard");
      } else if (role === 'company') {
        navigate("/company-dashboard");
      } else if (role === 'admin') {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrors({ general: t("auth.error.invalidCredentials") });
        } else if (err.status === 400) {
          setErrors({ general: err.message || t("auth.error.validationFailed") });
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

  const handleReset = (e) => {
    e.preventDefault();
    setResetSent(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setResetSent(false);
    setResetEmail("");
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md">
          {/* LOGO */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  T
                </span>
              </div>

              <span className="text-3xl font-bold text-gray-900">
                Tút Tát
              </span>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mt-6">
              {t("auth.login.title")}
            </h1>

            <p className="text-gray-600 text-lg mt-3">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t("auth.login.heading")}
              </h2>

              <p className="text-gray-500 mt-1">
                {t("auth.login.subheading")}
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              {/* GENERAL ERROR */}
              {errors.general && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {errors.general}
                </div>
              )}

              {/* GOOGLE */}
              <button
                type="button"
                className="w-full h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all font-medium"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 
                    1.37-1.04 2.53-2.21 
                    3.31v2.77h3.57c2.08-1.92 
                    3.28-4.74 3.28-8.09z"
                  />
                </svg>

                {t("auth.login.google")}
              </button>

              {/* DIVIDER */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>

                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">
                    {t("auth.login.divider")}
                  </span>
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  {t("auth.login.emailLabel")}
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                  <input
                    type="text"
                    placeholder={t("auth.login.emailPlaceholder")}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-12 border rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                    aria-label={t("auth.login.emailPlaceholder")}
                  />
                </div>

                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-gray-700">
                    {t("auth.login.passwordLabel")}
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    {t("auth.login.forgotPassword")}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                  <input
                    type="password"
                    placeholder={t("auth.login.passwordPlaceholder")}
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

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t("auth.login.loading") : t("auth.login.submit")}
              </button>

              {/* SIGN UP */}
              <div className="pt-4 border-t text-center text-gray-600">
                {t("auth.login.noAccount")}{" "}
                <Link
                  to="/signup"
                  className="text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  {t("auth.login.signupLink")}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            {!resetSent ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("auth.login.resetTitle")}
                </h2>

                <p className="text-gray-600 mb-6">
                  {t("auth.login.resetDesc")}
                </p>

                <form
                  onSubmit={handleReset}
                  className="space-y-4"
                >
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      {t("auth.login.resetEmailLabel")}
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) =>
                          setResetEmail(e.target.value)
                        }
                        placeholder="you@example.com"
                        className="w-full h-12 border border-gray-300 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                  >
                    {t("auth.login.sendResetLink")}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full h-12 border border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    {t("auth.login.cancel")}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t("auth.login.checkEmail")}
                </h2>

                <p className="text-gray-600 mb-6">
                  {t("auth.login.resetSentTo")}
                  <br />
                  <strong>{resetEmail}</strong>
                </p>

                <button
                  onClick={closeModal}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  {t("auth.login.gotIt")}
                </button>

                <button
                  onClick={() => setResetSent(false)}
                  className="mt-4 text-sm text-indigo-600 font-semibold"
                >
                  {t("auth.login.resend")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
