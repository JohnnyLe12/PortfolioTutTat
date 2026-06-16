import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { apiPost, apiDelete } from "../../lib/api";

/**
 * BookmarkButton toggles bookmark state for a job.
 * Calls POST /api/jobs/:id/bookmark to bookmark and DELETE to unbookmark.
 *
 * @param {object} props
 * @param {string} props.jobId - The job ID to bookmark/unbookmark
 * @param {boolean} props.initialBookmarked - Whether the job is initially bookmarked
 * @param {(bookmarked: boolean) => void} [props.onToggle] - Optional callback after toggle
 */
export default function BookmarkButton({ jobId, initialBookmarked = false, onToggle }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (bookmarked) {
        await apiDelete(`/jobs/${jobId}/bookmark`);
        setBookmarked(false);
        onToggle?.(false);
      } else {
        await apiPost(`/jobs/${jobId}/bookmark`, {});
        setBookmarked(true);
        onToggle?.(true);
      }
    } catch (err) {
      console.error("[BookmarkButton] Toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={loading}
      className={`transition-all ${
        bookmarked
          ? "border-indigo-600 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
          : "hover:border-indigo-300"
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this job"}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Bookmark
          className={`h-5 w-5 ${bookmarked ? "fill-indigo-600" : ""}`}
        />
      )}
    </Button>
  );
}
