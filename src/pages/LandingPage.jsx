import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  MessageCircle,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-white">
      {/* HERO */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              Dành cho sinh viên thiết kế & junior designer
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Launch Your
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Creative Career
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Build stunning portfolios, get expert feedback,
            and land your dream internship or first design
            job — all in one place.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-14 rounded-xl text-lg font-medium flex items-center justify-center shadow-lg transition-all">
                Build Portfolio
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>

            <Link to="/jobs">
              <button className="border-2 border-gray-300 hover:bg-gray-100 px-8 h-14 rounded-xl text-lg font-medium transition-all">
                Find Jobs
              </button>
            </Link>
          </div>

          {/* Hero Mockup */}
          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-10 border border-gray-200 shadow-2xl">
              <div className="aspect-video rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-gray-500 font-medium">
                    Modern Portfolio Dashboard
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-300 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-400 opacity-20 blur-3xl rounded-full"></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>

          <p className="text-xl text-gray-600">
            From portfolio to paycheck
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD 1 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Portfolio Builder
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              Create stunning portfolios with intuitive tools
              and showcase your best work professionally.
            </p>

            <Link
              to="/portfolio"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              Build Portfolio
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {/* CARD 2 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Mentor Feedback
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              Receive actionable advice from experienced
              mentors on your portfolio and career.
            </p>

            <Link
              to="/feedback"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              Get Feedback
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {/* CARD 3 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              Creative Jobs
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              Discover internships and fresher opportunities
              from creative companies.
            </p>

            <Link
              to="/jobs"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              Explore Jobs
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>

            <p className="text-xl text-gray-600">
              Start your creative career in 3 simple steps
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                title: "Create Your Profile",
                desc: "Add your skills, tools, and creative interests.",
              },
              {
                title: "Build Your Portfolio",
                desc: "Upload projects and get mentor feedback.",
              },
              {
                title: "Land Your Dream Job",
                desc: "Apply to internships and fresher positions.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 text-lg leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Launch Your Career?
          </h2>

          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join thousands of designers building their future
            with Tút Tát.
          </p>

          <Link to="/signup">
            <button className="bg-white text-indigo-700 px-8 h-14 rounded-xl text-lg font-semibold inline-flex items-center shadow-lg hover:shadow-xl transition-all">
              Get Started Free
              <Zap className="ml-2 w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

