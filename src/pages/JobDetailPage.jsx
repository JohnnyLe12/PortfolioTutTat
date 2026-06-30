import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Share2,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { useLanguage } from "../contexts/LanguageContext";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";

import { apiGet } from "../lib/api";
import BookmarkButton from "../components/job/BookmarkButton";
import ApplicationDialog from "../components/job/ApplicationDialog";

const JOB_TYPE_LABELS = {
  internship: "Internship",
  fresher: "Fresher",
  freelance: "Freelance",
  part_time: "Part-time",
  full_time: "Full-time",
};

/**
 * Format salary range for display.
 */
function formatSalary(min, max, currency = "USD") {
  if (!min && !max) return "Negotiable";
  const fmt = (v) => {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    return v.toString();
  };
  const symbol = currency === "USD" ? "$" : currency;
  if (min && max) return `${symbol}${fmt(min)} - ${symbol}${fmt(max)}`;
  if (min) return `From ${symbol}${fmt(min)}`;
  return `Up to ${symbol}${fmt(max)}`;
}

/**
 * Format relative time for job posting date.
 */
function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted 1 day ago";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Posted 1 week ago" : `Posted ${weeks} weeks ago`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Posted 1 month ago" : `Posted ${months} months ago`;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet(`/jobs/${id}`);
        setJob(result.data || result);
      } catch (err) {
        console.error("[JobDetailPage] Failed to fetch job:", err);
        setError("Failed to load job details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

  // Loading State
  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-gray-600 text-lg">Loading job details...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !job) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg">{error || "Job not found."}</p>
          <Link to="/jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("job.backToJobs")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const companyInitial = job.company?.name?.charAt(0)?.toUpperCase() || "?";
  const locationDisplay = job.isRemote ? t("job.remote") : job.location || t("job.notSpecified");
  const salaryDisplay = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

  return (
    <>
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Back Link */}
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("job.backToJobs")}
          </Link>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Header */}
              <div>
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="h-20 w-20 border-2 border-indigo-200">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                      {companyInitial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2 text-gray-900">
                      {job.title}
                    </h1>

                    <div className="text-2xl text-gray-600 mb-4 font-medium">
                      <Link
                        to={`/company-profile/${job.company?.userId || job.company?.id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {job.company?.name || "Company"}
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-4 text-base text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {locationDisplay}
                      </div>

                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        {salaryDisplay}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {formatTimeAgo(job.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowApplyDialog(true)}
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {t("job.applyPosition")}
                  </Button>

                  <BookmarkButton
                    jobId={job.id}
                    initialBookmarked={job.isBookmarked || false}
                  />

                  <Button variant="outline">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* About the Role */}
              {job.description && (
                <section>
                  <h2 className="text-3xl font-bold mb-4">{t("job.aboutRole")}</h2>
                  <div className="space-y-4 text-gray-700 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </section>
              )}

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-4">{t("job.responsibilities")}</h2>
                  <ul className="space-y-3 text-gray-700">
                    {job.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <section>
                  <h2 className="text-3xl font-bold mb-4">{t("job.requirements")}</h2>
                  <ul className="space-y-3 text-gray-700">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Required Skills */}
              {job.requiredSkills?.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill, idx) => (
                        <Badge key={idx}>{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Details */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold">{t("job.details")}</h3>

                  {/* Slot status */}
                  {job.openSlots !== null && job.openSlots !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">{t("job.openSlots")}</p>
                      {job.isFull ? (
                        <p className="font-medium text-red-600">{t("job.full")}</p>
                      ) : job.remainingSlots === 1 ? (
                        <p className="font-medium text-yellow-600">1 {t("job.slotRemaining")}</p>
                      ) : job.remainingSlots !== null ? (
                        <p className="font-medium text-green-600">{job.remainingSlots} {t("job.slotsRemaining")}</p>
                      ) : (
                        <p className="font-medium">{job.openSlots} slots</p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500">{t("job.experience")}</p>
                    <p className="font-medium capitalize">
                      {job.experienceLevel || "Entry Level"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{t("job.workMode")}</p>
                    <p className="font-medium">
                      {job.isRemote ? t("job.remote") : t("job.onsite")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{t("job.jobType")}</p>
                    <p className="font-medium">
                      {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{t("job.salary")}</p>
                    <p className="font-medium">{salaryDisplay}</p>
                  </div>

                  {job.location && (
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{job.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={() => setShowApplyDialog(true)}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
              >
                {t("job.applyNow")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Application Dialog */}
      <ApplicationDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        jobId={job.id}
        jobTitle={job.title}
      />
    </>
  );
}
