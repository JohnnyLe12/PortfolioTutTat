import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { apiGet } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

export default function MenteeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // id could be a profile ID or userId - try profile ID first
    apiGet(`/profiles/${id}`)
      .then((res) => setProfile(res.data || res))
      .catch(() => {
        // If not found by profile ID, it might be a userId - fetch projects to find profile
        return apiGet(`/projects/public/${id}`)
          .then((res) => {
            const data = res.data || res;
            if (data && data.length > 0 && data[0].mentee) {
              setProfile(data[0].mentee);
            }
          })
          .catch((err) => setError(err.message || "Profile not found"));
      })
      .finally(() => setLoading(false));

    // Also fetch their public projects
    apiGet(`/projects/public/${id}`)
      .then((res) => setProjects(res.data || res || []))
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <Card className="border-2">
        <CardContent className="p-8">
          <div className="flex items-center gap-5 mb-6">
            <Avatar className="h-20 w-20 border-2 border-indigo-200">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xl">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
              {profile.roleTitle && <p className="text-lg text-gray-600">{profile.roleTitle}</p>}
              {profile.major && <Badge variant="secondary" className="mt-1">{profile.major.replace("_", " ")}</Badge>}
            </div>
          </div>

          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">About</h3>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            )}
            {profile.designTools && profile.designTools.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Design Tools</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.designTools.map((t, i) => <Badge key={i} className="bg-blue-50 text-blue-700">{t}</Badge>)}
                </div>
              </div>
            )}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((int, i) => <Badge key={i} className="bg-purple-50 text-purple-700">{int}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {/* Public Projects */}
          {projects.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Portfolio ({projects.length} projects)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/portfolio/${p.id}`)}>
                    {p.media && p.media.length > 0 ? (
                      <img src={p.media[0].url} alt={p.title} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{p.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
