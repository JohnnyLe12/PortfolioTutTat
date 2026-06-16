import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Inbox,
  User,
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
import { apiGet, apiPatch } from "../lib/api";

/**
 * Valid status transitions (one-way flow):
 * submitted → under_review
 * under_review → accepted | rejected
 * accepted → (terminal)
 * rejected → (terminal)
 */
const VALID_TRANSITIONS = {
  submitted: ["under_review"],
  under_review: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_BADGE_VARIANT = {
  submitted: "secondary",
  under_review: "outline",
  accepted: "default",
  rejected: "destructive",
};

function getValidNextStates(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
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

export default function ApplicantsTrackerPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicantsByJob, setApplicantsByJob] = useState({});
  const [loadingApplicants, setLoadingApplicants] = useState({});
  const [statusError, setStatusError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet("/company/jobs", { limit: 50 });
      const jobList = response.data || response.items || [];
      setJobs(jobList);
    } catch (err) {
      console.error("Failed to fetch company jobs:", err);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplicants(jobId) {
    if (applicantsByJob[jobId]) return; // Already fetched

    try {
      setLoadingApplicants((prev) => ({ ...prev, [jobId]: true }));
      const response = await apiGet(`/company/jobs/${jobId}/applicants`);
      const data = response.data || response;
      setApplicantsByJob((prev) => ({
        ...prev,
        [jobId]: data.applicants || [],
      }));
    } catch (err) {
      console.error(`Failed to fetch applicants for job ${jobId}:`, err);
      setApplicantsByJob((prev) => ({
        ...prev,
        [jobId]: [],
      }));
    } finally {
      setLoadingApplicants((prev) => ({ ...prev, [jobId]: false }));
    }
  }

  function toggleJobExpand(jobId) {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      fetchApplicants(jobId);
    }
    setStatusError(null);
  }

  async function handleStatusUpdate(applicationId, newStatus, jobId) {
    setStatusError(null);
    setUpdatingStatus(applicationId);

    try {
      await apiPatch(`/company/applications/${applicationId}/status`, {
        status: newStatus,
      });

      // Update local state
      setApplicantsByJob((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((app) =>
          app.applicationId === applicationId
            ? { ...app, status: newStatus }
            : app
        ),
      }));
    } catch (err) {
      const message =
        err.message || "Failed to update status. Please try again.";
      setStatusError({ applicationId, message });
    } finally {
      setUpdatingStatus(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-200 rounded w-96" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Applicants Tracker</h1>
        <p className="text-gray-600">
          Track and manage applicants for your job postings
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchJobs}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs posted yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a job posting to start receiving applicants.
            </p>
            <Link to="/job-creation">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                Post a New Job
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs
            .filter((job) => job.isActive)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((job) => {
              const isExpanded = expandedJobId === job.id;
              const applicants = applicantsByJob[job.id] || [];
              const isLoadingApplicants = loadingApplicants[job.id];
              const applicantCount =
                job._count?.applications ?? job.applicantCount ?? 0;

              return (
                <Card key={job.id}>
                  {/* Job Header - clickable to expand */}
                  <button
                    onClick={() => toggleJobExpand(job.id)}
                    className="w-full text-left"
                    aria-expanded={isExpanded}
                    aria-label={`${job.title} - ${applicantCount} applicants`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {job.title}
                            </CardTitle>
                            <CardDescription>
                              Posted {formatDate(job.createdAt)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {applicantCount} applicant{applicantCount !== 1 ? "s" : ""}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Expanded Applicants List */}
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        {isLoadingApplicants ? (
                          <div className="animate-pulse space-y-3">
                            {[...Array(2)].map((_, i) => (
                              <div
                                key={i}
                                className="h-16 bg-gray-100 rounded-lg"
                              />
                            ))}
                          </div>
                        ) : applicants.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No applicants yet</p>
                            <p className="text-sm mt-1">
                              Applicants will appear here once mentees apply to
                              this job.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {applicants.map((applicant) => (
                              <ApplicantRow
                                key={applicant.applicationId}
                                applicant={applicant}
                                jobId={job.id}
                                onStatusUpdate={handleStatusUpdate}
                                statusError={statusError}
                                updatingStatus={updatingStatus}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

function ApplicantRow({
  applicant,
  jobId,
  onStatusUpdate,
  statusError,
  updatingStatus,
}) {
  const validNextStates = getValidNextStates(applicant.status);
  const isUpdating = updatingStatus === applicant.applicationId;
  const errorForThis =
    statusError?.applicationId === applicant.applicationId
      ? statusError.message
      : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${applicant.menteeUserId}`}
            className="font-medium text-gray-900 hover:text-purple-600 truncate block"
            title="View mentee profile"
          >
            {applicant.menteeName}
          </Link>
          <p className="text-sm text-gray-500">
            Applied {formatDate(applicant.applyDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Portfolio Links */}
        {applicant.portfolios && applicant.portfolios.length > 0 && (
          <div className="flex items-center gap-1">
            {applicant.portfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                to={`/portfolio/${portfolio.id}`}
                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 hover:underline"
                title={`View portfolio: ${portfolio.title}`}
              >
                <ExternalLink className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{portfolio.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Current Status Badge */}
        <Badge variant={STATUS_BADGE_VARIANT[applicant.status] || "secondary"}>
          {STATUS_LABELS[applicant.status] || applicant.status}
        </Badge>

        {/* Status Update Dropdown */}
        {validNextStates.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onStatusUpdate(applicant.applicationId, e.target.value, jobId);
              }
            }}
            disabled={isUpdating}
            className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Update status for ${applicant.menteeName}`}
          >
            <option value="">Move to...</option>
            {validNextStates.map((state) => (
              <option key={state} value={state}>
                {STATUS_LABELS[state]}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error Message for Invalid Transition */}
      {errorForThis && (
        <div className="w-full mt-2 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorForThis}</span>
        </div>
      )}
    </div>
  );
}
