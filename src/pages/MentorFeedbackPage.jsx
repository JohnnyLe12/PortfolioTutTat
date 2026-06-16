import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";

import StarRating from "../components/feedback/StarRating";
import HelpfulButton from "../components/feedback/HelpfulButton";
import FeedbackCommentThread from "../components/feedback/FeedbackCommentThread";
import FeedbackStatusTag from "../components/feedback/FeedbackStatusTag";
import ChatPanel from "../components/feedback/ChatPanel";
import { apiGet } from "../lib/api";

export default function MentorFeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [feedbackRequest, setFeedbackRequest] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch feedback request detail
      const requestRes = await apiGet(`/feedback-requests/${id}`);
      const requestData = requestRes.data;
      setFeedbackRequest(requestData);

      // Only fetch feedbacks and summary if status is completed
      if (requestData.status === "completed") {
        const [feedbacksRes, summaryRes] = await Promise.all([
          apiGet(`/feedback-requests/${id}/feedbacks`),
          apiGet(`/projects/${requestData.projectId || requestData.project?.id}/feedback-summary`),
        ]);
        setFeedbacks(feedbacksRes.data || []);
        setSummary(summaryRes.data || null);
      }
    } catch (err) {
      console.error("Failed to load feedback data:", err);
      setError(err.message || "Failed to load feedback data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMoreReviews = () => {
    const projectId = feedbackRequest?.projectId || feedbackRequest?.project?.id;
    if (projectId) {
      navigate(`/portfolio/${projectId}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // In Review state — show ChatPanel for real-time communication with buddy
  if (feedbackRequest && feedbackRequest.status === "in_review") {
    const currentUserId = (() => {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored).id : null;
      } catch {
        return null;
      }
    })();

    const buddyUserId = feedbackRequest.buddy?.userId || null;
    const buddyName = feedbackRequest.buddy?.fullName || "Buddy";
    const portfolioContextId = feedbackRequest.project?.id || null;

    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            to="/feedback-requests"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback Requests
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio Feedback</h1>
          <p className="text-gray-600 text-lg">
            Your portfolio is currently being reviewed
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-2 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {feedbackRequest.project?.title || "Untitled Project"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Reviewer: {buddyUserId ? (
                    <Link to={`/buddy-profile/${buddyUserId}`} className="text-indigo-600 hover:underline font-medium">
                      {buddyName}
                    </Link>
                  ) : buddyName}
                </p>
              </div>
              <FeedbackStatusTag status={feedbackRequest.status} />
            </div>
          </CardContent>
        </Card>

        {/* Chat Panel — 1-on-1 messaging with the buddy */}
        {portfolioContextId && currentUserId && buddyUserId ? (
          <div className="h-[500px]">
            <ChatPanel
              portfolioContextId={portfolioContextId}
              receiverId={buddyUserId}
              receiverName={buddyName}
              currentUserId={currentUserId}
            />
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                Chat is not available. Missing conversation context.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Not in_review and not completed state — show status only
  if (feedbackRequest && feedbackRequest.status !== "completed") {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            to="/feedback-requests"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback Requests
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio Feedback</h1>
        </div>

        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Feedback Not Yet Available
            </h2>
            <p className="text-gray-600 mb-4">
              This feedback request is currently{" "}
              <FeedbackStatusTag status={feedbackRequest.status} />.
              Feedback content will be available once the review is completed.
            </p>
            <p className="text-sm text-gray-500">
              Project: {feedbackRequest.project?.title || "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get buddy info from first feedback or the feedback request
  const buddy = feedbacks[0]?.buddy || feedbackRequest?.buddy;
  const buddyInitials = buddy?.fullName
    ? buddy.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "B";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/feedback-requests"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feedback Requests
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio Feedback</h1>
        <p className="text-gray-600 text-lg">
          Expert reviews and suggestions for your work
        </p>
      </div>

      {/* Overall Rating Summary */}
      <Card className="border-2 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {summary?.avgRating?.toFixed(1) || "—"}
              </div>
              <div className="flex justify-center mb-2">
                <StarRating
                  rating={Math.round(summary?.avgRating || 0)}
                  size={20}
                />
              </div>
              <div className="text-sm text-gray-600 font-medium">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {feedbacks.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Mentor Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {summary?.helpfulCount || 0}
              </div>
              <div className="text-sm text-gray-600 font-medium">Helpful Votes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Feedback Comments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Mentor Comments</h2>
            <Badge className="px-3 py-1">{feedbacks.length} reviews</Badge>
          </div>

          {feedbacks.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-6 text-center text-gray-500">
                No feedback has been submitted yet.
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback) => {
              const feedbackBuddy = feedback.buddy;
              const initials = feedbackBuddy?.fullName
                ? feedbackBuddy.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "B";

              return (
                <Card
                  key={feedback.id}
                  className="border-2 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    {/* Buddy Info */}
                    <div className="flex gap-4 mb-4">
                      <Avatar className="h-14 w-14 border-2 border-indigo-200">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="font-bold text-gray-900">
                              {feedbackBuddy?.fullName || "Buddy"}
                            </div>
                            <div className="text-sm text-gray-600">
                              {feedbackBuddy?.roleTitle || "Reviewer"}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {feedback.createdAt
                              ? new Date(feedback.createdAt).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )
                              : ""}
                          </div>
                        </div>
                        {/* Star Rating */}
                        <div className="mt-2">
                          <StarRating rating={feedback.rating} size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {feedback.comment}
                    </p>

                    {/* Suggestions */}
                    {feedback.suggestions && feedback.suggestions.length > 0 && (
                      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm font-medium text-indigo-800 mb-2">
                          Suggestions:
                        </p>
                        <ul className="space-y-1">
                          {feedback.suggestions.map((suggestion, i) => (
                            <li
                              key={i}
                              className="text-sm text-indigo-700 flex items-start gap-2"
                            >
                              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Helpful Button */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <HelpfulButton
                        feedbackId={feedback.id}
                        helpfulCount={feedback.helpfulCount || 0}
                        hasVoted={feedback.hasVoted || false}
                      />
                    </div>

                    {/* Comment Thread */}
                    <div className="mt-4 pt-4 border-t">
                      <FeedbackCommentThread feedbackId={feedback.id} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Request More Feedback */}
          <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/50">
            <CardContent className="p-8 text-center">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Want More Feedback?
              </h3>
              <p className="text-gray-600 mb-4">
                Request additional reviews from other mentors in the community
              </p>
              <Button
                onClick={handleRequestMoreReviews}
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
              >
                Request More Reviews
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Suggestions aggregated from all feedbacks */}
          {feedbacks.some((f) => f.suggestions?.length > 0) && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Key Suggestions</CardTitle>
                <CardDescription>
                  Common recommendations from mentors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedbacks
                    .flatMap((f) => f.suggestions || [])
                    .slice(0, 8)
                    .map((suggestion, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
