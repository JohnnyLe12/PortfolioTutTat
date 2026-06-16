import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { apiGet } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

export default function BuddyProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiGet(`/buddy/profile/${userId}`)
      .then((res) => setProfile(res.data || res))
      .catch((err) => setError(err.message || "Failed to load buddy profile"))
      .finally(() => setLoading(false));
  }, [userId]);

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
    : "BD";

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
          {/* Header */}
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

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">About</h3>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}

          {/* Skills, Tools, Interests */}
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
            {profile.socialLinks && Object.keys(profile.socialLinks).some(k => profile.socialLinks[k]) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Social Links</h3>
                <div className="flex flex-col gap-1">
                  {Object.entries(profile.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                      {k}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
