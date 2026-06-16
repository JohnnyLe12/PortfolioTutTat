import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  UserPlus,
  ArrowRight,
  Plus,
  ClipboardList,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { apiGet } from "../lib/api";

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    newApplicantsThisWeek: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet("/company/dashboard/stats");
      const data = response.data || response;
      setStats({
        activeJobs: data.activeJobs ?? 0,
        totalApplications: data.totalApplications ?? 0,
        newApplicantsThisWeek: data.newApplicantsThisWeek ?? 0,
      });
      setRecentJobs(data.recentJobs || []);
    } catch (err) {
      console.error("Failed to fetch company dashboard stats:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Company Dashboard</h1>
        <p className="text-gray-600">
          Track your recruitment activity and manage job postings
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardStats}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Jobs</p>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.activeJobs}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Applications</p>
              <Users className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.totalApplications}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">New Applicants This Week</p>
              <UserPlus className="h-4 w-4 text-purple-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.newApplicantsThisWeek}</h2>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link to="/job-creation">
          <Card className="border-2 hover:border-purple-300 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Post a New Job</h3>
                  <p className="text-sm text-gray-600">
                    Create a new job posting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/applicants-tracker">
          <Card className="border-2 hover:border-blue-300 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Applicants Tracker</h3>
                  <p className="text-sm text-gray-600">
                    Manage your applicants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>
                Your latest job postings
              </CardDescription>
            </div>
            <Link
              to="/applicants-tracker"
              className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No jobs posted yet</p>
              <p className="text-sm mt-1">
                Create your first job posting to start recruiting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {job.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{job.applicationCount} {job.applicationCount === 1 ? "applicant" : "applicants"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
