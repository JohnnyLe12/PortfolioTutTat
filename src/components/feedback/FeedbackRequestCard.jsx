import { Card, CardContent } from "../ui/card";
import FeedbackStatusTag from "./FeedbackStatusTag";

/**
 * FeedbackRequestCard — displays a feedback request summary.
 *
 * Props:
 * - projectName: string — name of the project
 * - buddyName: string | null — name of the assigned buddy
 * - status: 'pending' | 'in_review' | 'completed'
 * - date: string — ISO date string of when the request was created
 * - onClick: () => void — optional click handler
 */
export default function FeedbackRequestCard({
  projectName,
  buddyName,
  status,
  date,
  onClick,
}) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <Card
      className={`border hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {projectName}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Buddy: {buddyName || "Not assigned yet"}
            </p>
            <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
          </div>

          <div className="shrink-0">
            <FeedbackStatusTag status={status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
