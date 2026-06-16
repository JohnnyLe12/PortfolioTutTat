import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";

import { apiGet } from "../lib/api";
import FeedbackRequestCard from "../components/feedback/FeedbackRequestCard";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_review", label: "In Review" },
  { key: "completed", label: "Completed" },
];

export default function FeedbackRequestsPage() {
  const navigate = useNavigate();
  const [feedbackRequests, setFeedbackRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedbackRequests();
  }, [activeFilter]);

  async function fetchFeedbackRequests() {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeFilter !== "all") {
        params.status = activeFilter;
      }
      const result = await apiGet("/feedback-requests", params);
      setFeedbackRequests(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback requests");
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick(id) {
    navigate(`/feedback/${id}`);
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Feedback Requests
          </h1>
          <p className="text-sm text-gray-600">
            Track your portfolio review requests and feedback status
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeFilter === tab.key
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
            onClick={fetchFeedbackRequests}
            className="text-indigo-600 hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      ) : feedbackRequests.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No feedback requests found
          </h3>
          <p className="text-gray-500">
            {activeFilter === "all"
              ? "You haven't sent any feedback requests yet. Go to a project and request feedback from a buddy!"
              : `No ${activeFilter.replace("_", " ")} feedback requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbackRequests.map((request) => (
            <FeedbackRequestCard
              key={request.id}
              projectName={request.project?.title || request.projectName || "Untitled Project"}
              buddyName={request.buddy?.fullName || request.buddyName || null}
              status={request.status}
              date={request.createdAt || request.date}
              onClick={() => handleCardClick(request.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
