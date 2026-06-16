import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ThumbsUp,
  ArrowRight,
  Pencil,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { apiGet, apiPut } from "../lib/api";

export default function BuddyDashboardPage() {
  const [stats, setStats] = useState({
    completedReviews: 0,
    pendingReviews: 0,
    activeMessages: 0,
    helpfulRating: 0.0,
  });
  const [recentItems, setRecentItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const response = await apiGet("/buddy/profile/me");
      setProfile(response.data || response);
    } catch (err) {
      console.error("Failed to fetch buddy profile:", err);
    }
  }

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet("/buddy/dashboard/stats");
      const data = response.data || response;
      setStats({
        completedReviews: data.completedReviews ?? 0,
        pendingReviews: data.pendingReviews ?? 0,
        activeMessages: data.activeMessages ?? 0,
        helpfulRating: data.helpfulRating ?? 0.0,
      });
      setRecentItems(data.recentItems || []);
    } catch (err) {
      console.error("Failed to fetch buddy dashboard stats:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadgeVariant(status) {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "in_review":
        return "outline";
      default:
        return "secondary";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "in_review":
        return "In Review";
      default:
        return status;
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
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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
      {/* Header with Profile Info */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.fullName ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BD"
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{profile?.fullName || "Buddy Dashboard"}</h1>
              {profile?.roleTitle && <p className="text-gray-600">{profile.roleTitle}</p>}
              {!profile?.roleTitle && <p className="text-gray-600">Track your review activity and stay on top of feedback requests</p>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditData({ fullName: profile?.fullName || "", roleTitle: profile?.roleTitle || "", bio: profile?.bio || "", skills: (profile?.skills || []).join(", ") }); setShowEditForm(true); }}>
            <Pencil className="w-4 h-4 mr-1" /> Edit Profile
          </Button>
        </div>
        {profile?.bio && <p className="text-gray-600 text-sm mb-2">{profile.bio}</p>}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, i) => <Badge key={i} variant="secondary">{skill}</Badge>)}
          </div>
        )}
      </div>

      {/* Edit Profile Form */}
      {showEditForm && (
        <Card className="mb-8 border-2 border-indigo-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-lg">Edit Profile</h3>
            <div>
              <Label>Full Name</Label>
              <Input value={editData.fullName} onChange={(e) => setEditData({...editData, fullName: e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label>Role Title</Label>
              <Input value={editData.roleTitle} onChange={(e) => setEditData({...editData, roleTitle: e.target.value})} placeholder="e.g. Senior UI/UX Designer" className="mt-1" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} placeholder="Tell us about yourself..." className="mt-1" />
            </div>
            <div>
              <Label>Skills (comma separated)</Label>
              <Input value={editData.skills} onChange={(e) => setEditData({...editData, skills: e.target.value})} placeholder="UI/UX, Figma, Illustration" className="mt-1" />
            </div>
            <div className="flex gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={saving} onClick={async () => {
                setSaving(true);
                try {
                  await apiPut("/buddy/profile/me", {
                    fullName: editData.fullName.trim(),
                    roleTitle: editData.roleTitle.trim(),
                    bio: editData.bio.trim(),
                    skills: editData.skills.split(",").map(s => s.trim()).filter(Boolean),
                  });
                  await fetchProfile();
                  setShowEditForm(false);
                } catch (err) {
                  setError(err.message || "Failed to save profile");
                } finally {
                  setSaving(false);
                }
              }}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Completed Reviews</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.completedReviews}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.pendingReviews}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Messages</p>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.activeMessages}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Helpful Rating</p>
              <ThumbsUp className="h-4 w-4 text-purple-500" />
            </div>
            <h2 className="text-3xl font-bold">{Math.round(stats.helpfulRating)}</h2>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link to="/browse-portfolios">
          <Card className="border-2 hover:border-purple-300 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Browse Portfolios</h3>
                  <p className="text-sm text-gray-600">
                    Find portfolios to review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/feedback-workspace">
          <Card className="border-2 hover:border-blue-300 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Feedback Workspace</h3>
                  <p className="text-sm text-gray-600">
                    Manage your active reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Feedback Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Feedback Requests</CardTitle>
              <CardDescription>
                Your latest assigned reviews
              </CardDescription>
            </div>
            <Link
              to="/feedback-workspace"
              className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No feedback requests yet</p>
              <p className="text-sm mt-1">
                Browse portfolios to start reviewing
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.projectName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.assignedDate)}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
