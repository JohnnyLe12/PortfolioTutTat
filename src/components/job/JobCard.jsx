import { Link } from "react-router-dom";
import { MapPin, Briefcase, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const JOB_TYPE_LABELS = {
  internship: "Internship",
  fresher: "Fresher",
  freelance: "Freelance",
  part_time: "Part-time",
  full_time: "Full-time",
};

/**
 * Format salary range for display.
 * @param {number|null} min
 * @param {number|null} max
 * @param {string} currency
 * @returns {string}
 */
function formatSalary(min, max, currency = "USD") {
  if (!min && !max) return "Negotiable";
  const fmt = (v) => {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    return v.toString();
  };
  if (min && max) return `$${fmt(min)}-${fmt(max)}`;
  if (min) return `From $${fmt(min)}`;
  return `Up to $${fmt(max)}`;
}

/**
 * Format relative time for job posting date.
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/**
 * JobCard component displays a single job listing.
 *
 * @param {object} props
 * @param {object} props.job - Job data from API
 * @param {string} props.job.id
 * @param {string} props.job.title
 * @param {string|null} props.job.location
 * @param {string} props.job.jobType
 * @param {number|null} props.job.salaryMin
 * @param {number|null} props.job.salaryMax
 * @param {string} props.job.salaryCurrency
 * @param {boolean} props.job.isRemote
 * @param {string[]} props.job.requiredSkills
 * @param {string} props.job.createdAt
 * @param {object} props.job.company
 * @param {string} props.job.company.name
 * @param {string|null} props.job.company.logoUrl
 */
export default function JobCard({ job }) {
  const companyInitial = job.company?.name?.charAt(0)?.toUpperCase() || "?";
  const locationDisplay = job.isRemote
    ? "Remote"
    : job.location || "Not specified";

  return (
    <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-xl group">
      <CardContent className="p-6">
        <div className="flex gap-6">
          <Avatar className="h-16 w-16 border-2 border-gray-200">
            {job.company?.logoUrl ? (
              <AvatarImage
                src={job.company.logoUrl}
                alt={`${job.company.name} logo`}
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
              {companyInitial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div>
                <Link to={`/jobs/${job.id}`}>
                  <h3 className="font-bold text-xl text-gray-900 hover:text-indigo-600 transition-colors">
                    {job.title}
                  </h3>
                </Link>
                <div className="text-base text-gray-600 font-medium mt-1">
                  {job.company?.name}
                </div>
              </div>

              <Link to={`/jobs/${job.id}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Apply Now
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {locationDisplay}
              </div>

              <Badge
                variant="secondary"
                className="font-medium"
              >
                <Briefcase className="h-3 w-3 mr-1" />
                {JOB_TYPE_LABELS[job.jobType] || job.jobType}
              </Badge>

              <div className="font-semibold text-gray-900">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </div>

              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                {formatTimeAgo(job.createdAt)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Slot status badge */}
              {job.openSlots !== null && job.openSlots !== undefined && (
                <>
                  {job.isFull ? (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      Full
                    </Badge>
                  ) : job.remainingSlots === 1 ? (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      1 slot remaining
                    </Badge>
                  ) : job.remainingSlots !== null && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {job.remainingSlots} slots remaining
                    </Badge>
                  )}
                </>
              )}

              {job.requiredSkills?.length > 0 &&
                job.requiredSkills.map((skill, i) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
