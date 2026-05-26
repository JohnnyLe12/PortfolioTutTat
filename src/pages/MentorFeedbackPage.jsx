import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Send,
  ArrowLeft,
  CheckCircle,
  MessageSquare,
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
import { Textarea } from "../components/ui/textarea";

export default function MentorFeedbackPage() {
  const [newComment, setNewComment] = useState("");

  const feedbackComments = [
    {
      id: 1,
      mentor: "Sarah Williams",
      avatar: "SW",
      role: "Senior Product Designer @ Google",
      rating: 5,
      date: "2 days ago",
      comment:
        "Excellent work on the mobile app redesign! Your use of white space and typography is really strong. I particularly like how you've simplified the checkout flow. One suggestion: consider adding more detail about your user research process in the case study. Showing how you validated design decisions would make this portfolio piece even stronger.",
      helpful: 12,
    },
    {
      id: 2,
      mentor: "Michael Chen",
      avatar: "MC",
      role: "Design Director @ Airbnb",
      rating: 4,
      date: "5 days ago",
      comment:
        "Great attention to detail in your UI work. The color palette and visual hierarchy are well executed. For your next iteration, I'd recommend adding more context about the problem you were solving and the metrics that improved after your redesign. Quantifiable results really help employers understand your impact.",
      helpful: 8,
    },
    {
      id: 3,
      mentor: "Emma Rodriguez",
      avatar: "ER",
      role: "Lead Designer @ Netflix",
      rating: 5,
      date: "1 week ago",
      comment:
        "Impressive portfolio! Your projects show a strong understanding of user-centered design. My advice: make your case studies more scannable with clear sections (Problem, Process, Solution, Results). Also, consider adding a brief intro about yourself on your portfolio homepage to help recruiters get to know you better.",
      helpful: 15,
    },
  ];

  const suggestions = [
    "Add more detail to your case studies",
    "Include user research methodology",
    "Show metrics and measurable results",
    "Improve portfolio navigation",
    "Add a personal introduction section",
  ];

  const handlePostComment = () => {
  if (!newComment.trim()) return;

  console.log(newComment);

  setNewComment("");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/portfolio/1" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio Feedback</h1>
        <p className="text-gray-600 text-lg">Expert reviews and suggestions for your work</p>
      </div>

      {/* Overall Rating Summary */}
      <Card className="border-2 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">4.7</div>
              <div className="flex justify-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <div className="text-sm text-gray-600 font-medium">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">3</div>
              <div className="text-sm text-gray-600 font-medium">Mentor Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">35</div>
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
            <Badge className="px-3 py-1">{feedbackComments.length} reviews</Badge>
          </div>

          {feedbackComments.map((feedback) => (
            <Card key={feedback.id} className="border-2 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <Avatar className="h-14 w-14 border-2 border-indigo-200">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                      {feedback.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="font-bold text-gray-900">{feedback.mentor}</div>
                        <div className="text-sm text-gray-600">{feedback.role}</div>
                      </div>
                      <div className="text-sm text-gray-500">{feedback.date}</div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">{feedback.comment}</p>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button variant="outline" size="sm" className="border-2">
                    👍 Helpful ({feedback.helpful})
                  </Button>
                  <Button variant="ghost" size="sm">
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Request More Feedback */}
          <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/50">
            <CardContent className="p-8 text-center">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Want More Feedback?</h3>
              <p className="text-gray-600 mb-4">
                Request additional reviews from other mentors in the community
              </p>
              <Button className="bg-indigo-600 hover:bg-indigo-700 font-semibold">
                Request More Reviews
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Suggestions */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Key Suggestions</CardTitle>
              <CardDescription>Common recommendations from mentors</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {suggestions.map((suggestion, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Update Project */}
          <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-3">Ready to Update?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Apply the mentor feedback to improve your portfolio and make it stand out
              </p>
              <Link to="/portfolio/builder">
                <Button className="w-full h-10 bg-green-600 hover:bg-green-700 font-semibold">
                  Update Project
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Leave Comment */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Leave a Comment</CardTitle>
              <CardDescription>Share your thoughts or ask questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your comment here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handlePostComment} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 font-semibold">
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}