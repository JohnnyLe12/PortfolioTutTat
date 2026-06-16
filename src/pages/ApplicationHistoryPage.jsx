import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";

import { apiGet } from "../lib/api";

const STATUS_CONFIG = {
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700",
  },
  under_review: {
    label: "Under Review",
    className: "bg-yellow-100 text-yellow-700",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApplicationHistoryPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet("/applications");
      setApplications(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  function handleApplicationClick(application) {
    navigate(`/jobs/${application.jobId}`);
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Application History
          </h1>
          <p className="text-sm text-gray-600">
            Track your job applications and their current status
          </p>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && applications.length > 0 && (
        <div className="mb-6 text-sm text-gray-600">
          Total applications: <span className="font-semibold text-gray-900">{applications.length}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="text-indigo-600 hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No applications yet
          </h3>
          <p className="text-gray-500">
            You haven't applied to any jobs yet. Browse available positions and apply with your portfolio!
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <div
              key={application.id}
              onClick={() => handleApplicationClick(application)}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {application.jobName || "Untitled Job"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {application.company || "Unknown Company"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Applied: {formatDate(application.createdAt)}</span>
                    {application.portfolioIds && application.portfolioIds.length > 0 && (
                      <span>
                        {application.portfolioIds.length} portfolio{application.portfolioIds.length > 1 ? "s" : ""} attached
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <StatusBadge status={application.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
