import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  MessageCircle,
  Zap,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="overflow-hidden bg-white">
      {/* HERO */}
      <section className="container mx-auto px-6 py-20 md:py-32 bg-gradient-to-tr from-purple-200 via-white to-pink-200 relative">
        {/* LANGUAGE SWITCHER */}
        <div className="absolute top-4 right-6 flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 shadow-sm border">
          <button
            onClick={() => setLanguage("vi")}
            className={`text-xs px-2 py-1 rounded ${language === "vi" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            VN
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`text-xs px-2 py-1 rounded ${language === "en" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            EN
          </button>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("landing.badge")}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
            {t("landing.hero.title1")}
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t("landing.hero.title2")}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-14 rounded-xl text-lg font-medium flex items-center justify-center shadow-lg transition-all">
                {t("landing.cta.submitPortfolio")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>

            <Link to="/jobs">
              <button className="border-2 border-gray-300 hover:bg-gray-100 px-8 h-14 rounded-xl text-lg font-medium transition-all">
                {t("landing.cta.findJobs")}
              </button>
            </Link>
          </div>

          {/* Hero Mockup */}
          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-10 border border-gray-200 shadow-2xl">
              <div className="aspect-video rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4"><img src="/Portfolio1.png" alt="Logo TÚT TÁT" className="h-full w-auto object-contain" /></div>
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
            {t("landing.features.title")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* CARD 1 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              {t("landing.features.portfolio.title")}
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              {t("landing.features.portfolio.desc")}
            </p>

            <Link
              to="/portfolio"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              {t("landing.features.portfolio.link")}
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {/* CARD 2 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              {t("landing.features.feedback.title")}
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              {t("landing.features.feedback.desc")}
            </p>

            <Link
              to="/feedback"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              {t("landing.features.feedback.link")}
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {/* CARD 3 */}
          <div className="border border-gray-200 rounded-3xl p-8 hover:shadow-2xl transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-3">
              {t("landing.features.jobs.title")}
            </h3>

            <p className="text-gray-600 leading-relaxed mb-6">
              {t("landing.features.jobs.desc")}
            </p>

            <Link
              to="/jobs"
              className="text-indigo-600 font-semibold inline-flex items-center"
            >
              {t("landing.features.jobs.link")}
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-6 py-20 md:py-32 bg-purple-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("landing.howItWorks.title")}
            </h2>

            <p className="text-xl text-gray-600">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                title: t("landing.howItWorks.step1.title"),
                desc: t("landing.howItWorks.step1.desc"),
              },
              {
                title: t("landing.howItWorks.step2.title"),
                desc: t("landing.howItWorks.step2.desc"),
              },
              {
                title: t("landing.howItWorks.step3.title"),
                desc: t("landing.howItWorks.step3.desc"),
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
      <section className="container mx-auto px-6 py-20 md:py-32 bg-purple-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t("landing.cta.ready")}
          </h2>

          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            {t("landing.cta.join")}
          </p>

          <Link to="/signup">
            <button className="bg-white text-indigo-700 px-8 h-14 rounded-xl text-lg font-semibold inline-flex items-center shadow-lg hover:shadow-xl transition-all">
              {t("landing.cta.startFree")}
              <Zap className="ml-2 w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
