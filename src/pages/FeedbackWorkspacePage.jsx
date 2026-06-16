import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  ClipboardList,
  Play,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { apiGet, apiPatch, apiPost } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import ChatPanel from "../components/ChatPanel";

const STATUS_CONFIG = {
  "Not Started": {
    variant: "secondary",
    className: "bg-gray-100 text-gray-700",
  },
  "In Progress": {
    variant: "default",
    className: "bg-blue-100 text-blue-700",
  },
  Completed: {
    variant: "default",
    className: "bg-green-100 text-green-700",
  },
};

const ITEMS_PER_PAGE = 20;

export default function FeedbackWorkspacePage() {
  const [workspaceItems, setWorkspaceItems] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const userData = JSON.parse(stored);
        setCurrentUserId(userData.id);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const fetchWorkspace = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet("/buddy/workspace", {
        page,
        limit: ITEMS_PER_PAGE,
      });
      setWorkspaceItems(result.data || []);
      setPagination(
        result.pagination || {
          total: 0,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(err.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace(1);
  }, [fetchWorkspace]);

  async function handleStartReview(feedbackRequestId) {
    if (!feedbackRequestId) return;
    setActionLoading(feedbackRequestId);
    try {
      await apiPatch(`/buddy/workspace/${feedbackRequestId}/start`, {});
      // Refresh the workspace to reflect updated status
      await fetchWorkspace(pagination.page);
    } catch (err) {
      setError(err.message || "Failed to start review");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCompleteReview(feedbackRequestId) {
    if (!feedbackRequestId) return;
    setActionLoading(feedbackRequestId);
    try {
      await apiPatch(`/buddy/workspace/${feedbackRequestId}/complete`, {});
      // Refresh the workspace to reflect updated status
      await fetchWorkspace(pagination.page);
    } catch (err) {
      setError(err.message || "Failed to complete review");
    } finally {
      setActionLoading(null);
    }
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchWorkspace(newPage);
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Feedback Workspace
          </h1>
          <p className="text-sm text-gray-600">
            Manage your bookmarked portfolios and provide reviews
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading workspace...</span>
        </div>
      ) : workspaceItems.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No bookmarked portfolios yet
          </h3>
          <p className="text-gray-500">
            Browse portfolios and bookmark them to start reviewing.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {workspaceItems.map((item) => (
              <WorkspaceItem
                key={item.bookmarkId}
                item={item}
                currentUserId={currentUserId}
                actionLoading={actionLoading}
                onStartReview={handleStartReview}
                onCompleteReview={handleCompleteReview}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WorkspaceItem({
  item,
  currentUserId,
  actionLoading,
  onStartReview,
  onCompleteReview,
}) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(null); // 'pass' or 'fail'
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const statusConfig = STATUS_CONFIG[item.reviewStatus] || STATUS_CONFIG["Not Started"];
  const isActionLoading = actionLoading === item.feedbackRequestId;
  const isInReview = item.reviewStatus === "In Progress";

  async function handleSubmitFeedback() {
    if (!feedbackRating) return;
    if (feedbackRating === 'fail' && !feedbackComment.trim()) {
      setFeedbackError("Please provide a reason for not passing the portfolio.");
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackError("");
    try {
      // Submit feedback
      await apiPost(`/buddy/workspace/${item.feedbackRequestId}/complete`, {
        rating: feedbackRating === 'pass' ? 5 : 2,
        comment: feedbackComment.trim() || (feedbackRating === 'pass' ? 'Portfolio approved' : ''),
        passed: feedbackRating === 'pass',
      });
      setShowFeedbackForm(false);
      // Trigger parent refresh
      onCompleteReview(item.feedbackRequestId);
    } catch (err) {
      setFeedbackError(err.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Project Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {item.projectName}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              by {item.menteeName}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Bookmarked {new Date(item.bookmarkDate).toLocaleDateString()}
            </p>
          </div>

          {/* Right: Status and Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Badge className={statusConfig.className}>
              {item.reviewStatus}
            </Badge>

            {/* Start Review button - only for Not Started items with a feedbackRequestId */}
            {item.reviewStatus === "Not Started" && item.feedbackRequestId && (
              <Button
                size="sm"
                onClick={() => onStartReview(item.feedbackRequestId)}
                disabled={isActionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                Start Review
              </Button>
            )}

            {/* Give Feedback button - for In Progress items */}
            {isInReview && item.feedbackRequestId && !showFeedbackForm && (
              <Button
                size="sm"
                onClick={() => setShowFeedbackForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Give Feedback
              </Button>
            )}
          </div>
        </div>

        {/* Feedback Form */}
        {showFeedbackForm && (
          <div className="mt-4 border-t pt-4 space-y-4">
            <h4 className="font-medium text-gray-900">Review this portfolio</h4>
            
            {/* Pass/Fail buttons */}
            <div className="flex gap-3">
              <Button
                variant={feedbackRating === 'pass' ? 'default' : 'outline'}
                className={feedbackRating === 'pass' ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}
                onClick={() => { setFeedbackRating('pass'); setFeedbackError(""); }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Pass
              </Button>
              <Button
                variant={feedbackRating === 'fail' ? 'default' : 'outline'}
                className={feedbackRating === 'fail' ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50'}
                onClick={() => { setFeedbackRating('fail'); setFeedbackError(""); }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Needs Improvement
              </Button>
            </div>

            {/* Comment textarea (required for fail) */}
            {feedbackRating && (
              <div>
                <Textarea
                  placeholder={feedbackRating === 'fail' ? "Please explain what needs to be improved (required)..." : "Add optional comments..."}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="min-h-[100px]"
                />
                {feedbackRating === 'fail' && (
                  <p className="text-xs text-gray-500 mt-1">* Required when portfolio does not pass</p>
                )}
              </div>
            )}

            {feedbackError && (
              <p className="text-sm text-red-600">{feedbackError}</p>
            )}

            {/* Submit / Cancel */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmitFeedback}
                disabled={!feedbackRating || submittingFeedback}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {submittingFeedback ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Submit Feedback
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowFeedbackForm(false); setFeedbackRating(null); setFeedbackComment(""); setFeedbackError(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ChatPanel - embedded when review is In Progress */}
        {isInReview && item.feedbackRequestId && currentUserId && !showFeedbackForm && (
          <div className="mt-4 border-t pt-4">
            <ChatPanel
              portfolioContextId={item.projectId}
              currentUserId={currentUserId}
              receiverId={null}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
