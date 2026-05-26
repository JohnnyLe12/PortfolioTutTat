import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

export default function SignUpPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                T
              </span>
            </div>

            <span className="text-3xl font-bold text-gray-900">
              Tút Tát
            </span>
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Sign Up
            </h2>

            <p className="text-gray-500 mt-1">
              Get started for free
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* GOOGLE BUTTON */}
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
                  className="w-full h-12 border border-gray-300 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a strong password"
                required
                className="w-full h-12 border border-gray-300 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg transition-all"
            >
              Create Account
            </button>

            {/* TERMS */}
            <p className="text-sm text-center text-gray-600">
              By signing up, you agree to our{" "}
              <a
                href="#"
                className="text-indigo-600 font-medium"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-indigo-600 font-medium"
              >
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
        </div>
      </div>
    </div>
  );
}
