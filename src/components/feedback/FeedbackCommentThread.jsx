import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { apiGet, apiPost } from "../../lib/api";

/**
 * FeedbackCommentThread — Shows a list of comments for a feedback and a form to post new comments.
 *
 * Props:
 * - feedbackId: string — the feedback ID to load/post comments for
 */
export default function FeedbackCommentThread({ feedbackId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/feedbacks/${feedbackId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (feedbackId) {
      fetchComments();
    }
  }, [feedbackId]);

  const handlePostComment = async () => {
    // Validate not empty
    if (!newComment.trim()) {
      setError("Comment cannot be empty. Please enter your comment.");
      return;
    }

    setError("");
    setPosting(true);
    try {
      await apiPost(`/feedbacks/${feedbackId}/comments`, {
        content: newComment.trim(),
      });
      setNewComment("");
      // Refresh comments list
      await fetchComments();
    } catch (err) {
      console.error("Failed to post comment:", err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Comments</h3>

      {/* Comment List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {comment.authorName || "User"}
                </span>
                <span className="text-xs text-gray-500">
                  {comment.createdAt
                    ? new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </div>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Post Comment Form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Write your comment here..."
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
            if (error) setError("");
          }}
          className="min-h-[80px]"
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <Button
          onClick={handlePostComment}
          disabled={posting}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 font-semibold"
        >
          <Send className="h-4 w-4 mr-2" />
          {posting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}
