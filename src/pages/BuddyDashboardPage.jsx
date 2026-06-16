import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ThumbsUp,
  ArrowRight,
  Pencil,
  Upload,
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
import { apiGet, apiPut, apiPost } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function BuddyDashboardPage() {
  const { t } = useLanguage();
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

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
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.fullName ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BD"
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{profile?.fullName || "Buddy"}</h1>
                  {profile?.roleTitle && <p className="text-gray-600 text-lg">{profile.roleTitle}</p>}
                  {profile?.major && <Badge variant="secondary" className="mt-1">{profile.major.replace("_", " ")}</Badge>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setEditData({
                  fullName: profile?.fullName || "",
                  roleTitle: profile?.roleTitle || "",
                  bio: profile?.bio || "",
                  skills: (profile?.skills || []).join(", "),
                  designTools: (profile?.designTools || []).join(", "),
                  interests: (profile?.interests || []).join(", "),
                  major: profile?.major || "",
                  socialLinks: profile?.socialLinks || {},
                });
                setShowEditForm(true);
              }}>
                <Pencil className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
            </div>

            {profile?.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}

            <div className="grid md:grid-cols-2 gap-4">
              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
              {profile?.designTools && profile.designTools.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Design Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.designTools.map((t, i) => <Badge key={i} className="bg-blue-50 text-blue-700">{t}</Badge>)}
                  </div>
                </div>
              )}
              {profile?.interests && profile.interests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((int, i) => <Badge key={i} className="bg-purple-50 text-purple-700">{int}</Badge>)}
                  </div>
                </div>
              )}
              {profile?.socialLinks && Object.keys(profile.socialLinks).some(k => profile.socialLinks[k]) && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Social Links</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                      <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{k}</a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Form */}
      {showEditForm && (
        <Card className="mb-8 border-2 border-indigo-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-lg">Edit Profile</h3>

            {/* Avatar Upload */}
            <div>
              <Label>Avatar</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold overflow-hidden border-2 border-gray-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.fullName ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BD"
                  )}
                </div>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          setError("File too large (max 5MB)");
                          return;
                        }
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> {avatarFile ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {avatarFile && <p className="text-xs text-gray-500 mt-1">{avatarFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={editData.fullName} onChange={(e) => setEditData({...editData, fullName: e.target.value})} className="mt-1" />
              </div>
              <div>
                <Label>Role Title</Label>
                <Input value={editData.roleTitle} onChange={(e) => setEditData({...editData, roleTitle: e.target.value})} placeholder="Senior UI/UX Designer" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} placeholder="Tell mentees about your background and experience..." className="mt-1 min-h-[100px]" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Skills (comma separated)</Label>
                <Input value={editData.skills} onChange={(e) => setEditData({...editData, skills: e.target.value})} placeholder="UI/UX, Figma, Illustration" className="mt-1" />
              </div>
              <div>
                <Label>Design Tools (comma separated)</Label>
                <Input value={editData.designTools} onChange={(e) => setEditData({...editData, designTools: e.target.value})} placeholder="Figma, Adobe XD, Sketch" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Interests (comma separated)</Label>
              <Input value={editData.interests} onChange={(e) => setEditData({...editData, interests: e.target.value})} placeholder="Graphic Design, UI/UX, Motion Design" className="mt-1" />
            </div>

            {/* Social Links */}
            <div>
              <Label className="text-base font-semibold">Social Links</Label>
              <p className="text-sm text-gray-500 mb-3">Add your social media profiles (must start with https://)</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600">LinkedIn</Label>
                  <Input value={editData.socialLinks?.linkedin || ""} onChange={(e) => setEditData({...editData, socialLinks: {...(editData.socialLinks || {}), linkedin: e.target.value}})} placeholder="https://linkedin.com/in/..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Instagram</Label>
                  <Input value={editData.socialLinks?.instagram || ""} onChange={(e) => setEditData({...editData, socialLinks: {...(editData.socialLinks || {}), instagram: e.target.value}})} placeholder="https://instagram.com/..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">GitHub</Label>
                  <Input value={editData.socialLinks?.github || ""} onChange={(e) => setEditData({...editData, socialLinks: {...(editData.socialLinks || {}), github: e.target.value}})} placeholder="https://github.com/..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Behance</Label>
                  <Input value={editData.socialLinks?.behance || ""} onChange={(e) => setEditData({...editData, socialLinks: {...(editData.socialLinks || {}), behance: e.target.value}})} placeholder="https://behance.net/..." className="mt-1" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={saving} onClick={async () => {
                setSaving(true);
                try {
                  // Build clean social links
                  const cleanSocialLinks = {};
                  if (editData.socialLinks) {
                    for (const [key, value] of Object.entries(editData.socialLinks)) {
                      const trimmed = (value || "").trim();
                      if (trimmed) cleanSocialLinks[key] = trimmed;
                    }
                  }

                  await apiPut("/buddy/profile/me", {
                    fullName: editData.fullName.trim(),
                    roleTitle: editData.roleTitle.trim(),
                    bio: editData.bio.trim(),
                    skills: editData.skills.split(",").map(s => s.trim()).filter(Boolean),
                    designTools: editData.designTools.split(",").map(s => s.trim()).filter(Boolean),
                    interests: editData.interests.split(",").map(s => s.trim()).filter(Boolean),
                    socialLinks: cleanSocialLinks,
                  });

                  // Upload avatar if a file was selected
                  if (avatarFile) {
                    const formData = new FormData();
                    formData.append("file", avatarFile);
                    await apiPost("/buddy/profile/me/avatar", formData);
                  }

                  await fetchProfile();
                  setShowEditForm(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                } catch (err) {
                  setError(err.message || "Failed to save profile");
                } finally {
                  setSaving(false);
                }
              }}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => { setShowEditForm(false); setAvatarFile(null); setAvatarPreview(null); }}>Cancel</Button>
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
              <p className="text-sm text-gray-600">{t("dashboard.completedReviews")}</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.completedReviews}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{t("dashboard.pendingReviews")}</p>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.pendingReviews}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{t("dashboard.activeMessages")}</p>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold">{stats.activeMessages}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{t("dashboard.helpfulRating")}</p>
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
                  <h3 className="font-semibold">{t("dashboard.browsePortfolios")}</h3>
                  <p className="text-sm text-gray-600">
                    {t("dashboard.findPortfolios")}
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
                  <h3 className="font-semibold">{t("dashboard.feedbackWorkspace")}</h3>
                  <p className="text-sm text-gray-600">
                    {t("dashboard.manageReviews")}
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
              <CardTitle>{t("dashboard.recentRequests")}</CardTitle>
              <CardDescription>
                {t("dashboard.latestReviews")}
              </CardDescription>
            </div>
            <Link
              to="/feedback-workspace"
              className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
            >
              {t("dashboard.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">{t("dashboard.noRequests")}</p>
              <p className="text-sm mt-1">
                {t("dashboard.browseToStart")}
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
