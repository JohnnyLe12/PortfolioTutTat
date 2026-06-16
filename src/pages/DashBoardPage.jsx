import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Plus,
  Briefcase,
  Upload,
  ArrowRight,
  Pencil,
} from "lucide-react";
import CompletionBar from "../components/profile/CompletionBar";
import ProfileEditForm from "../components/profile/ProfileEditForm";
import ProjectGrid from "../components/project/ProjectGrid";
import StatsRow from "../components/dashboard/StatsRow";
import RecentActivity from "../components/dashboard/RecentActivity";
import RecommendedJobs from "../components/dashboard/RecommendedJobs";
import { apiGet } from "../lib/api";

export default function DashBoardPage() {
  const [profile, setProfile] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ totalViews: 0, totalLikes: 0, totalApplications: 0 });
  const [activities, setActivities] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchProjects();
    fetchStats();
    fetchActivities();
    fetchRecommendedJobs();
  }, []);

  async function fetchProfile() {
    try {
      const response = await apiGet("/profiles/me");
      setProfile(response.data || response);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }

  async function fetchProjects() {
    try {
      const response = await apiGet("/projects");
      const allProjects = response.data || response || [];
      // Sort by createdAt descending and take the 3 most recent
      const sorted = [...allProjects].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setProjects(sorted.slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title,
        thumbnailUrl: p.media && p.media.length > 0 ? p.media[0].url : null,
        status: p.status,
        viewCount: p.viewCount ?? 0,
        likeCount: p.likeCount ?? 0,
        tags: p.tags || [],
      })));
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  }

  async function fetchStats() {
    try {
      const response = await apiGet("/profiles/me/stats");
      const data = response.data || response;
      setStats({
        totalViews: data.totalViews ?? data.viewCount ?? 0,
        totalLikes: data.totalLikes ?? data.likeCount ?? 0,
        totalApplications: data.totalApplications ?? data.applicationCount ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }

  async function fetchActivities() {
    try {
      const response = await apiGet("/notifications");
      const data = response.data || response || [];
      // Take the 10 most recent notifications as activity items
      setActivities(data.slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  }

  async function fetchRecommendedJobs() {
    try {
      setLoadingJobs(true);
      const response = await apiGet("/jobs/recommended");
      const data = response.data || response;
      setRecommendedJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch recommended jobs:", err);
      setRecommendedJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }

  function handleSaveSuccess() {
    fetchProfile(); // Refresh profile to update CompletionBar
    setShowEditForm(false);
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.fullName
                  ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                  : "JD"
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile?.fullName?.split(" ")[0] || "there"} 👋
              </h1>

              <p className="text-gray-600 mt-1">
                Here's what's happening with your
                creative journey
              </p>
            </div>
          </div>

          {/* PROFILE PROGRESS */}
          <CompletionBar profile={profile} />

          {/* Edit Profile Toggle */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <Pencil className="w-4 h-4" />
              {showEditForm ? "Hide Edit Form" : "Edit Profile"}
            </button>
          </div>

          {/* Profile Edit Form */}
          {showEditForm && (
            <ProfileEditForm
              onSaveSuccess={handleSaveSuccess}
              className="mt-4"
            />
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link to="/portfolio-builder">
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

          <Link to="/feedback-requests">
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
                    From buddys
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* STATS ROW */}
        <StatsRow stats={stats} className="mb-8" />

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

              <Link
                to="/portfolio-builder"
                className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 inline-flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <ProjectGrid projects={projects} />
          </div>

          {/* RECOMMENDED JOBS */}
          <RecommendedJobs jobs={recommendedJobs} loading={loadingJobs} />
        </div>

        {/* RECENT ACTIVITY */}
        <RecentActivity activities={activities} className="mt-8" />
      </div>
    </div>
  );
}
