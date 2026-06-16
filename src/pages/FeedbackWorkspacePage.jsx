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
  Star,
  Eye,
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
  const [activeReview, setActiveReview] = useState(null);
  const [viewingCompleted, setViewingCompleted] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUserId(JSON.parse(stored).id);
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
      setActiveReview({ ...item, reviewStatus: "In Progress" });
      fetchWorkspace(pagination.page);
    } catch (err) {
      setError(err.message || "Failed to start review");
    } finally {
      setActionLoading(null);
    }
  }

  function handleBackToList() {
    setActiveReview(null);
    setViewingCompleted(null);
    fetchWorkspace(pagination.page);
  }

  // ─── Active Review View ─────────────────────────────────────────────
  if (activeReview) {
    return <ReviewView item={activeReview} currentUserId={currentUserId} onBack={handleBackToList} />;
  }

  // ─── Viewing Completed Review ───────────────────────────────────────
  if (viewingCompleted) {
    return <CompletedReviewView item={viewingCompleted} currentUserId={currentUserId} onBack={handleBackToList} />;
  }

  // ─── Workspace List View ────────────────────────────────────────────
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
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

                      {item.reviewStatus === "Not Started" && item.feedbackRequestId && (
                        <Button size="sm" onClick={() => handleStartReview(item)} disabled={actionLoading === item.feedbackRequestId} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          {actionLoading === item.feedbackRequestId ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                          Start Review
                        </Button>
                      )}

                      {item.reviewStatus === "In Progress" && (
                        <Button size="sm" onClick={() => setActiveReview(item)} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <MessageSquare className="w-4 h-4 mr-1" /> Continue Review
                        </Button>
                      )}

                      {item.reviewStatus === "Completed" && (
                        <Button size="sm" variant="outline" onClick={() => setViewingCompleted(item)}>
                          <Eye className="w-4 h-4 mr-1" /> View Review
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

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Review View ──────────────────────────────────────────────────────────────
function ReviewView({ item, currentUserId, onBack }) {
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);

  useEffect(() => {
    if (item.projectId) {
      setProjectLoading(true);
      apiGet(`/projects/${item.projectId}`)
        .then((res) => setProject(res.data || res))
        .catch(() => {})
        .finally(() => setProjectLoading(false));
    }
  }, [item.projectId]);

  async function handleSubmitFeedback() {
    if (rating === 0) { setFeedbackError("Please select a rating (1-5 stars)"); return; }
    if (rating <= 2 && !feedbackComment.trim()) { setFeedbackError("Please provide feedback for low ratings"); return; }

    setSubmitting(true);
    setFeedbackError("");
    try {
      await apiPost(`/buddy/workspace/${item.feedbackRequestId}/complete`, {
        rating,
        comment: feedbackComment.trim() || (rating >= 4 ? "Great work!" : ""),
        passed: rating >= 3,
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
      <div className="container mx-auto px-6 py-8 max-w-4xl text-center py-16">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback Submitted!</h2>
        <p className="text-gray-600 mb-6">Your review for &quot;{item.projectName}&quot; has been submitted.</p>
        <Button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <button onClick={onBack} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Workspace
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Review: {item.projectName}</h1>
      <p className="text-gray-600 mb-6">by {item.menteeName}</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Portfolio Preview */}
        <div className="lg:col-span-1">
          <Card className="border-2 sticky top-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Portfolio Preview</h3>
              {projectLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : project ? (
                <div className="space-y-3">
                  {project.media && project.media.length > 0 && (
                    <img src={project.media[0].url} alt={project.title} className="w-full rounded-lg object-cover aspect-video" />
                  )}
                  <p className="text-sm text-gray-700">{project.description || "No description"}</p>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
                    </div>
                  )}
                  {project.media && project.media.length > 1 && (
                    <div className="grid grid-cols-2 gap-2">
                      {project.media.slice(1, 5).map((m) => (
                        <img key={m.id} src={m.url} alt="" className="w-full rounded object-cover aspect-square" />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Could not load portfolio</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle: Chat */}
        <div className="lg:col-span-1">
          <Card className="border-2">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Chat with Mentee
              </h3>
              {currentUserId && item.menteeUserId ? (
                <ChatPanel portfolioContextId={item.projectId} currentUserId={currentUserId} receiverId={item.menteeUserId} />
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">Chat unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Feedback Form */}
        <div className="lg:col-span-1">
          <Card className="border-2 sticky top-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Submit Your Feedback</h3>

              {/* Star Rating */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Rating</p>
                <StarRatingInput value={rating} onChange={setRating} />
                {rating > 0 && <p className="text-xs text-gray-500 mt-1">{rating}/5 stars</p>}
              </div>

              {/* Comment */}
              <div className="mb-4">
                <Textarea
                  placeholder={rating <= 2 ? "What needs improvement? (required for 1-2 stars)" : "Add comments (optional)..."}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {feedbackError && <p className="text-sm text-red-600 mb-3">{feedbackError}</p>}

              <Button onClick={handleSubmitFeedback} disabled={rating === 0 || submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Completed Review View (view past chat + feedback) ────────────────────────
function CompletedReviewView({ item, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (item.projectId) {
      apiGet(`/messages/${item.projectId}`)
        .then((res) => setMessages(res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [item.projectId]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <button onClick={onBack} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Workspace
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Review: {item.projectName}</h1>
      <p className="text-gray-600 mb-2">by {item.menteeName}</p>
      <Badge className="bg-green-100 text-green-700 mb-6">Completed</Badge>

      <Card className="border-2">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Conversation History</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No messages in this review</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 p-2">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-indigo-200" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
