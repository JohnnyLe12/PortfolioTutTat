import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Globe, Mail, Phone, MapPin, Users } from "lucide-react";

import { apiGet } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

export default function CompanyProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiGet(`/company/profile/${userId}`)
      .then((res) => setProfile(res.data || res))
      .catch((err) => setError(err.message || "Failed to load company profile"))
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
          <p className="text-red-600 mb-4">{error || "Company profile not found"}</p>
          <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  const initials = profile.companyName
    ? profile.companyName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "CO";

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
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.companyName}</h1>
            </div>
          </div>

          {/* Summary */}
          {profile.summary && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">About</h3>
              <p className="text-gray-700 whitespace-pre-line">{profile.summary}</p>
            </div>
          )}

          {/* Products & Services */}
          {profile.productsServices && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Products & Services</h3>
              <p className="text-gray-700 whitespace-pre-line">{profile.productsServices}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {profile.websiteUrl && (
              <div className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Website</h3>
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    {profile.websiteUrl}
                  </a>
                </div>
              </div>
            )}

            {profile.hrContactEmail && (
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">HR Contact Email</h3>
                  <a
                    href={`mailto:${profile.hrContactEmail}`}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    {profile.hrContactEmail}
                  </a>
                </div>
              </div>
            )}

            {profile.hrContactPhone && (
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">HR Contact Phone</h3>
                  <p className="text-gray-700 text-sm">{profile.hrContactPhone}</p>
                </div>
              </div>
            )}

            {profile.employeeCount && (
              <div className="flex items-start gap-2">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Employee Count</h3>
                  <p className="text-gray-700 text-sm">{profile.employeeCount}</p>
                </div>
              </div>
            )}

            {profile.officeAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Office Address</h3>
                  <p className="text-gray-700 text-sm">{profile.officeAddress}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
