import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { apiGet } from "../lib/api";
import JobFilters from "../components/job/JobFilters";
import JobCard from "../components/job/JobCard";
import { useLanguage } from "../contexts/LanguageContext";

export default function JobListingPage() {
  const { t } = useLanguage();
  const [activeType, setActiveType] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (activeType && activeType !== "all") {
        params.type = activeType;
      }
      if (keyword.trim()) {
        params.keyword = keyword.trim();
      }
      if (location.trim()) {
        params.location = location.trim();
      }

      const result = await apiGet("/jobs", params);
      setJobs(result.data?.jobs || []);
      setTotal(result.data?.total || 0);
    } catch (err) {
      console.error("[JobListingPage] Failed to fetch jobs:", err);
      setError("Failed to load jobs. Please try again.");
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeType, keyword, location]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleTypeChange = useCallback((type) => {
    setActiveType(type);
  }, []);

  const handleKeywordChange = useCallback((value) => {
    setKeyword(value);
  }, []);

  const handleLocationChange = useCallback((value) => {
    setLocation(value);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {t("jobs.browse.title")}
        </h1>
        <p className="text-gray-600 text-lg">
          {t("jobs.browse.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <JobFilters
        activeType={activeType}
        keyword={keyword}
        location={location}
        onTypeChange={handleTypeChange}
        onKeywordChange={handleKeywordChange}
        onLocationChange={handleLocationChange}
      />

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {t("jobs.browse.showing")}{" "}
          <span className="font-semibold text-gray-900">
            {total} {total === 1 ? t("jobs.browse.job") : t("jobs.browse.jobs")}
          </span>{" "}
          {t("jobs.browse.matchingCriteria")}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">{t("jobs.browse.loading")}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchJobs}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {t("jobs.browse.noJobs")}
          </p>
        </div>
      )}

      {/* Job List */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
