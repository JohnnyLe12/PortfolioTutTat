import { useState } from "react";
import { Button } from "../ui/button";
import { apiPost } from "../../lib/api";

/**
 * HelpfulButton — A button that shows helpful count and allows voting.
 *
 * Props:
 * - feedbackId: string — the feedback ID to vote on
 * - helpfulCount: number — initial helpful vote count
 * - hasVoted: boolean — whether the current user has already voted
 */
export default function HelpfulButton({ feedbackId, helpfulCount, hasVoted }) {
  const [voted, setVoted] = useState(hasVoted);
  const [count, setCount] = useState(helpfulCount);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (voted || loading) return;
    setLoading(true);
    try {
      await apiPost(`/feedbacks/${feedbackId}/helpful`, {});
      setVoted(true);
      setCount((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to vote helpful:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`border-2 ${voted ? "opacity-60 cursor-not-allowed" : ""}`}
      onClick={handleVote}
      disabled={voted || loading}
    >
      👍 Helpful ({count})
    </Button>
  );
}
