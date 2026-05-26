import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Mail,
  Lock,
  CheckCircle,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
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
              Welcome Back
            </h1>

            <p className="text-gray-600 text-lg mt-3">
              Sign in to continue your creative journey
            </p>
          </div>

          {/* CARD */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Log In
              </h2>

              <p className="text-gray-500 mt-1">
                Enter your credentials below
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
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
                    className="w-full h-12 border border-gray-300 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-gray-700">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                  <input
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="w-full h-12 border border-gray-300 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                Log In
              </button>

              {/* SIGN UP */}
              <div className="pt-4 border-t text-center text-gray-600">
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  Sign up
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
                  Reset your password
                </h2>

                <p className="text-gray-600 mb-6">
                  Enter your email address and
                  we’ll send you a reset link.
                </p>

                <form
                  onSubmit={handleReset}
                  className="space-y-4"
                >
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Email
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
                    Send Reset Link
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full h-12 border border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Check your email
                </h2>

                <p className="text-gray-600 mb-6">
                  We’ve sent a password reset link
                  to:
                  <br />
                  <strong>{resetEmail}</strong>
                </p>

                <button
                  onClick={closeModal}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  Got it
                </button>

                <button
                  onClick={() => setResetSent(false)}
                  className="mt-4 text-sm text-indigo-600 font-semibold"
                >
                  Resend email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
