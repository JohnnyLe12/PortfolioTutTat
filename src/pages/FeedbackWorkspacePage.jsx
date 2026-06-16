import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  ClipboardList,
  Play,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

import { apiGet, apiPatch, apiPost } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import ChatPanel from "../components/ChatPanel";

const STATUS_CONFIG = {
  "Not Started": { className: "bg-gray-100 text-gray-700" },
  "In Progress": { className: "bg-blue-100 text-blue-700" },
  Completed: { className: "bg-green-100 text-green-700" },
};

const ITEMS_PER_PAGE = 20;

export default function FeedbackWorkspacePage() {
  const [workspaceItems, setWorkspaceItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeReview, setActiveReview] = useState(null); // item being reviewed

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const userData = JSON.parse(stored);
        setCurrentUserId(userData.id);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchWorkspace = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet("/buddy/workspace", { page, limit: ITEMS_PER_PAGE });
      setWorkspaceItems(result.data || []);
      setPagination(result.pagination || { total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkspace(1); }, [fetchWorkspace]);

  async function handleStartReview(item) {
    if (!item.feedbackRequestId) return;
    setActionLoading(item.feedbackRequestId);
    try {
      await apiPatch(`/buddy/workspace/${item.feedbackRequestId}/start`, {});
      // Open review view immediately
      setActiveReview({ ...item, reviewStatus: "In Progress" });
      // Also refresh list in background
      fetchWorkspace(pagination.page);
    } catch (err) {
      setError(err.message || "Failed to start review");
    } finally {
      setActionLoading(null);
    }
  }

  function handleOpenReview(item) {
    setActiveReview(item);
  }

  function handleBackToList() {
    setActiveReview(null);
    fetchWorkspace(pagination.page);
  }

  // ─── Active Review View ─────────────────────────────────────────────
  if (activeReview) {
    return (
      <ReviewView
        item={activeReview}
        currentUserId={currentUserId}
        onBack={handleBackToList}
      />
    );
  }

  // ─── Workspace List View ────────────────────────────────────────────
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Workspace</h1>
          <p className="text-sm text-gray-600">Manage your bookmarked portfolios and provide reviews</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading workspace...</span>
        </div>
      ) : workspaceItems.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No bookmarked portfolios yet</h3>
          <p className="text-gray-500">Browse portfolios and bookmark them to start reviewing.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {workspaceItems.map((item) => (
              <Card key={item.bookmarkId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.projectName}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">by {item.menteeName}</p>
                      <p className="text-xs text-gray-400 mt-1">Bookmarked {new Date(item.bookmarkDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={(STATUS_CONFIG[item.reviewStatus] || STATUS_CONFIG["Not Started"]).className}>
                        {item.reviewStatus}
                      </Badge>

                      {/* Not Started + has feedback request → Start Review */}
                      {item.reviewStatus === "Not Started" && item.feedbackRequestId && (
                        <Button
                          size="sm"
                          onClick={() => handleStartReview(item)}
                          disabled={actionLoading === item.feedbackRequestId}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {actionLoading === item.feedbackRequestId ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          Start Review
                        </Button>
                      )}

                      {/* In Progress → Open Review */}
                      {item.reviewStatus === "In Progress" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Continue Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button variant="outline" size="sm" onClick={() => fetchWorkspace(pagination.page - 1)} disabled={pagination.page <= 1}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => fetchWorkspace(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Review View (shown when buddy is actively reviewing) ─────────────────────
function ReviewView({ item, currentUserId, onBack }) {
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  async function handleSubmitFeedback() {
    if (!feedbackRating) return;
    if (feedbackRating === "fail" && !feedbackComment.trim()) {
      setFeedbackError("Please provide a reason for not passing the portfolio.");
      return;
    }

    setSubmitting(true);
    setFeedbackError("");
    try {
      await apiPost(`/buddy/workspace/${item.feedbackRequestId}/complete`, {
        rating: feedbackRating === "pass" ? 5 : 2,
        comment: feedbackComment.trim() || (feedbackRating === "pass" ? "Portfolio approved" : ""),
        passed: feedbackRating === "pass",
      });
      setFeedbackSuccess(true);
    } catch (err) {
      setFeedbackError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  if (feedbackSuccess) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center py-16">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your review for &quot;{item.projectName}&quot; has been submitted successfully.
          </p>
          <Button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Workspace
      </button>

      {/* Review Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review: {item.projectName}</h1>
        <p className="text-gray-600 mt-1">by {item.menteeName}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Chat with Mentee */}
        <Card className="border-2">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Chat with Mentee
            </h3>
            {currentUserId && item.menteeUserId ? (
              <ChatPanel
                portfolioContextId={item.projectId}
                currentUserId={currentUserId}
                receiverId={item.menteeUserId}
              />
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">
                Chat unavailable — missing user context.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right: Feedback Form */}
        <Card className="border-2">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Submit Your Feedback</h3>

            {/* Pass / Fail */}
            <div className="flex gap-3 mb-4">
              <Button
                variant={feedbackRating === "pass" ? "default" : "outline"}
                className={feedbackRating === "pass" ? "bg-green-600 hover:bg-green-700 flex-1" : "border-green-600 text-green-600 hover:bg-green-50 flex-1"}
                onClick={() => { setFeedbackRating("pass"); setFeedbackError(""); }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Pass
              </Button>
              <Button
                variant={feedbackRating === "fail" ? "default" : "outline"}
                className={feedbackRating === "fail" ? "bg-red-600 hover:bg-red-700 flex-1" : "border-red-600 text-red-600 hover:bg-red-50 flex-1"}
                onClick={() => { setFeedbackRating("fail"); setFeedbackError(""); }}
              >
                <XCircle className="w-4 h-4 mr-2" /> Needs Improvement
              </Button>
            </div>

            {/* Comment */}
            {feedbackRating && (
              <div className="mb-4">
                <Textarea
                  placeholder={feedbackRating === "fail" ? "Explain what needs improvement (required)..." : "Add optional comments..."}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="min-h-[120px]"
                />
                {feedbackRating === "fail" && (
                  <p className="text-xs text-gray-500 mt-1">* Required when portfolio does not pass</p>
                )}
              </div>
            )}

            {feedbackError && <p className="text-sm text-red-600 mb-3">{feedbackError}</p>}

            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackRating || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
