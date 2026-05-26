import { Link } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  Eye,
  Heart,
  Briefcase,
  Upload,
  ArrowRight,
} from "lucide-react";

export default function DashBoardPage() {
  const recentProjects = [
    {
      id: 1,
      title: "Mobile App Redesign",
      category: "UI/UX",
      likes: 45,
      views: 234,
      image: "🎨",
    },
    {
      id: 2,
      title: "Brand Identity System",
      category: "Branding",
      likes: 67,
      views: 456,
      image: "🎭",
    },
    {
      id: 3,
      title: "Motion Graphics Reel",
      category: "Motion",
      likes: 89,
      views: 678,
      image: "🎬",
    },
  ];

  const recommendedJobs = [
    {
      id: 1,
      title: "UI Designer Intern",
      company: "Spotify",
      type: "Internship",
      location: "Remote",
      logo: "S",
    },
    {
      id: 2,
      title: "Junior UX Designer",
      company: "Airbnb",
      type: "Full-time",
      location: "San Francisco",
      logo: "A",
    },
    {
      id: 3,
      title: "Graphic Design Intern",
      company: "Nike",
      type: "Internship",
      location: "Portland",
      logo: "N",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              JD
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, Jane 👋
              </h1>

              <p className="text-gray-600 mt-1">
                Here's what's happening with your
                creative journey
              </p>
            </div>
          </div>

          {/* PROFILE PROGRESS */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Complete Your Profile
                </h3>

                <p className="text-sm text-gray-500">
                  75% complete — Add more projects
                </p>
              </div>

              <span className="text-2xl font-bold text-indigo-600">
                75%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-indigo-600 h-full w-[75%] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* ACTION CARD */}
          <Link to="/portfolio">
            <div className="bg-white border rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                  <Plus className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Add Project
                  </h3>

                  <p className="text-sm text-gray-500">
                    Upload new work
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/jobs">
            <div className="bg-white border rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                  <Briefcase className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Browse Jobs
                  </h3>

                  <p className="text-sm text-gray-500">
                    Find opportunities
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/feedback">
            <div className="bg-white border rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 transition-all">
                  <Upload className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Get Feedback
                  </h3>

                  <p className="text-sm text-gray-500">
                    From mentors
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Profile Views",
              value: "1,234",
              icon: Eye,
            },
            {
              title: "Portfolio Likes",
              value: "456",
              icon: Heart,
            },
            {
              title: "Applications",
              value: "8",
              icon: Briefcase,
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white border rounded-2xl p-6"
            >
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {stat.title}
                </span>

                <stat.icon className="w-5 h-5 text-gray-400" />
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </h3>

              <div className="flex items-center gap-1 text-green-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                +12%
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* PROJECTS */}
          <div className="bg-white border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  Your Projects
                </h2>

                <p className="text-gray-500 text-sm">
                  Recent uploads
                </p>
              </div>

              <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all border"
                >
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl">
                    {project.image}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {project.title}
                    </h3>

                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-gray-100 text-sm">
                      {project.category}
                    </span>

                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {project.likes}
                      </span>

                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {project.views}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* JOBS */}
          <div className="bg-white border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">
                  Recommended Jobs
                </h2>

                <p className="text-gray-500 text-sm">
                  Matches based on your skills
                </p>
              </div>

              <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
                Browse All
              </button>
            </div>

            <div className="space-y-4">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-xl p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {job.logo}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {job.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {job.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                      {job.type}
                    </span>

                    <span className="px-3 py-1 rounded-full border text-sm">
                      {job.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white border rounded-2xl p-6 mt-8">
          <h2 className="text-xl font-bold mb-2">
            Recent Activity
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            Your latest updates
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Heart,
                text: "Sarah liked your project",
                color: "bg-indigo-100 text-indigo-600",
              },
              {
                icon: Briefcase,
                text: "You applied for UI Designer Intern",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: Upload,
                text: "You uploaded a new project",
                color: "bg-purple-100 text-purple-600",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border-b pb-4 last:border-none"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}
                >
                  <activity.icon className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-gray-900">
                    {activity.text}
                  </p>

                  <p className="text-sm text-gray-500">
                    2 hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
