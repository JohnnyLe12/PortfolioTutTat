import { Link } from "react-router-dom";
import { MapPin, Briefcase, ArrowRight } from "lucide-react";

const JOB_TYPE_LABELS = {
  internship: "Internship",
  fresher: "Fresher",
  freelance: "Freelance",
  part_time: "Part-time",
  full_time: "Full-time",
};

/**
 * RecommendedJobs: displays up to 3 recommended job cards.
 * Shows "No recommended jobs found" if the list is empty.
 *
 * Props:
 * - jobs: array of job objects from GET /api/jobs/recommended
 *   Each has: { id, title, location, jobType, salaryMin, salaryMax, salaryCurrency, isRemote, requiredSkills, createdAt, company: { id, name, logoUrl } }
 * - loading: boolean indicating loading state
 * - className: optional wrapper className
 */
export default function RecommendedJobs({ jobs = [], loading = false, className = "" }) {
  return (
    <div className={`bg-white border rounded-2xl p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Recommended Jobs</h2>
          <p className="text-gray-500 text-sm">
            Matches based on your skills
          </p>
        </div>

        <Link
          to="/jobs"
          className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100 inline-flex items-center gap-1"
        >
          Browse All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-20" />
                <div className="h-6 bg-gray-200 rounded-full w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No recommended jobs found</p>
          <p className="text-gray-400 text-xs mt-1">
            Complete your profile to get personalized recommendations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.slice(0, 3).map((job) => {
            const companyInitial =
              job.company?.name?.charAt(0)?.toUpperCase() || "?";
            const locationDisplay = job.isRemote
              ? "Remote"
              : job.location || "Not specified";

            return (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="block border rounded-xl p-4 hover:shadow-lg transition-all hover:border-indigo-200"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                    {job.company?.logoUrl ? (
                      <img
                        src={job.company.logoUrl}
                        alt={`${job.company.name} logo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      companyInitial
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {job.company?.name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm">
                    <Briefcase className="w-3 h-3" />
                    {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm">
                    <MapPin className="w-3 h-3" />
                    {locationDisplay}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
