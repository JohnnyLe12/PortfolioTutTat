import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Briefcase,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { apiGet } from "../lib/api";
import JobCard from "../components/job/JobCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Internship", value: "internship" },
  { label: "Contract", value: "contract" },
  { label: "Freelance", value: "freelance" },
  { label: "Temporary", value: "temporary" },
  { label: "Volunteer", value: "volunteer" },
];

const SENIORITY_LEVELS = [
  { label: "Internship", value: "internship" },
  { label: "Entry", value: "entry" },
  { label: "Assistant", value: "assistant" },
  { label: "Mid-Senior", value: "mid_senior" },
  { label: "Director", value: "director" },
  { label: "Executive", value: "executive" },
];

const SALARY_MIN = 0;
const SALARY_MAX = 100000000; // 100M VND
const SALARY_STEP = 1000000; // 1M VND

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatSalaryVND(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedJobSearchPage() {
  // Search state
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");

  // Category quick tags
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [location, setLocation] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [seniorityLevels, setSeniorityLevels] = useState([]);
  const [salaryRange, setSalaryRange] = useState([SALARY_MIN, SALARY_MAX]);
  const [isRemote, setIsRemote] = useState(false);

  // Results
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce ref
  const debounceTimerRef = useRef(null);
  const locationDebounceRef = useRef(null);

  // ─── Fetch categories on mount ─────────────────────────────────────────────

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await apiGet("/jobs/categories");
        setCategories(result.data?.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // ─── Debounce keyword search (500ms, min 2 chars) ──────────────────────────

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (keywordInput.trim().length >= 2) {
        setKeyword(keywordInput.trim());
      } else if (keywordInput.trim().length === 0) {
        setKeyword("");
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keywordInput]);

  // ─── Debounce location input (500ms) ───────────────────────────────────────

  useEffect(() => {
    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    locationDebounceRef.current = setTimeout(() => {
      setLocation(locationInput.trim());
    }, 500);

    return () => {
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
    };
  }, [locationInput]);

  // ─── Fetch jobs when filters change ────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (keyword) {
        params.keyword = keyword;
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (location) {
        params.location = location;
      }
      if (employmentTypes.length === 1) {
        params.employmentType = employmentTypes[0];
      }
      if (seniorityLevels.length === 1) {
        params.seniorityLevel = seniorityLevels[0];
      }
      if (salaryRange[0] > SALARY_MIN) {
        params.salaryMin = salaryRange[0].toString();
      }
      if (salaryRange[1] < SALARY_MAX) {
        params.salaryMax = salaryRange[1].toString();
      }
      if (isRemote) {
        params.isRemote = "true";
      }

      const result = await apiGet("/jobs", params);
      let fetchedJobs = result.data?.jobs || [];

      // Client-side filtering for multi-select (API supports single value)
      if (employmentTypes.length > 1) {
        fetchedJobs = fetchedJobs.filter(
          (job) => job.employmentType && employmentTypes.includes(job.employmentType)
        );
      }
      if (seniorityLevels.length > 1) {
        fetchedJobs = fetchedJobs.filter(
          (job) => job.seniorityLevel && seniorityLevels.includes(job.seniorityLevel)
        );
      }

      setJobs(fetchedJobs);
      setTotal(
        employmentTypes.length > 1 || seniorityLevels.length > 1
          ? fetchedJobs.length
          : result.data?.total || 0
      );
    } catch (err) {
      console.error("[AdvancedJobSearch] Failed to fetch jobs:", err);
      setError("Failed to load jobs. Please try again.");
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCategory, location, employmentTypes, seniorityLevels, salaryRange, isRemote]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ─── Category tag toggle ───────────────────────────────────────────────────

  function handleCategoryClick(category) {
    setSelectedCategory((prev) => (prev === category ? "" : category));
  }

  // ─── Employment type multi-select toggle ───────────────────────────────────

  function toggleEmploymentType(value) {
    setEmploymentTypes((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  // ─── Seniority level multi-select toggle ───────────────────────────────────

  function toggleSeniorityLevel(value) {
    setSeniorityLevels((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  // ─── Clear all filters ─────────────────────────────────────────────────────

  function handleClearAll() {
    setKeywordInput("");
    setKeyword("");
    setSelectedCategory("");
    setLocationInput("");
    setLocation("");
    setEmploymentTypes([]);
    setSeniorityLevels([]);
    setSalaryRange([SALARY_MIN, SALARY_MAX]);
    setIsRemote(false);
  }

  // Check if any filter is active
  const hasActiveFilters =
    keyword ||
    selectedCategory ||
    location ||
    employmentTypes.length > 0 ||
    seniorityLevels.length > 0 ||
    salaryRange[0] > SALARY_MIN ||
    salaryRange[1] < SALARY_MAX ||
    isRemote;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Advanced Job Search
        </h1>
        <p className="text-gray-600 text-lg">
          Find opportunities that match your skills, interests, and preferences
        </p>
      </div>

      {/* ═══ Tier 1: Search Bar ═══ */}
      <Card className="border-2 mb-6 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by job titles, skills, company keywords..."
              className="pl-12 h-12 text-base border-2"
              value={keywordInput}
              maxLength={100}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search jobs by keyword"
            />
            {keywordInput && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setKeywordInput("");
                  setKeyword("");
                }}
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {keywordInput.trim().length > 0 && keywordInput.trim().length < 2 && (
            <p className="text-xs text-gray-500 mt-2">
              Type at least 2 characters to search
            </p>
          )}
        </CardContent>
      </Card>

      {/* ═══ Tier 2: Category Quick Tags ═══ */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className={`h-9 px-4 border-2 transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "hover:border-indigo-300"
                }`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Tier 3: Advanced Filters Panel ═══ */}
      <Card className="border-2 mb-6">
        <CardContent className="p-0">
          {/* Toggle Header */}
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setShowAdvanced((prev) => !prev)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters-panel"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <SlidersHorizontal className="h-4 w-4" />
              Advanced Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {/* Expandable Panel */}
          {showAdvanced && (
            <div
              id="advanced-filters-panel"
              className="border-t px-6 py-5 space-y-6"
            >
              {/* Location */}
              <div>
                <Label htmlFor="location-filter" className="text-sm font-medium text-gray-700 mb-2 block">
                  Location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="location-filter"
                    placeholder="City, district, or address..."
                    className="pl-10"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Employment Type - Multi-select */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Employment Type
                </Label>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={
                        employmentTypes.includes(type.value) ? "default" : "outline"
                      }
                      size="sm"
                      className={`h-8 text-sm transition-all ${
                        employmentTypes.includes(type.value)
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "hover:border-indigo-300"
                      }`}
                      onClick={() => toggleEmploymentType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Seniority Level - Multi-select */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seniority Level
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SENIORITY_LEVELS.map((level) => (
                    <Button
                      key={level.value}
                      variant={
                        seniorityLevels.includes(level.value) ? "default" : "outline"
                      }
                      size="sm"
                      className={`h-8 text-sm transition-all ${
                        seniorityLevels.includes(level.value)
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "hover:border-indigo-300"
                      }`}
                      onClick={() => toggleSeniorityLevel(level.value)}
                    >
                      {level.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Salary Range (VND)
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Min</label>
                      <input
                        type="range"
                        min={SALARY_MIN}
                        max={SALARY_MAX}
                        step={SALARY_STEP}
                        value={salaryRange[0]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSalaryRange((prev) => [
                            Math.min(val, prev[1]),
                            prev[1],
                          ]);
                        }}
                        className="w-full accent-indigo-600"
                        aria-label="Minimum salary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Max</label>
                      <input
                        type="range"
                        min={SALARY_MIN}
                        max={SALARY_MAX}
                        step={SALARY_STEP}
                        value={salaryRange[1]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSalaryRange((prev) => [
                            prev[0],
                            Math.max(val, prev[0]),
                          ]);
                        }}
                        className="w-full accent-indigo-600"
                        aria-label="Maximum salary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatSalaryVND(salaryRange[0])} VND</span>
                    <span>{formatSalaryVND(salaryRange[1])} VND</span>
                  </div>
                </div>
              </div>

              {/* Remote Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remote-filter"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="remote-filter" className="text-sm text-gray-700 cursor-pointer">
                  Remote only
                </Label>
              </div>

              {/* Clear All Filters Button */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={handleClearAll}
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Results Section ═══ */}

      {/* Result Count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {total} {total === 1 ? "job" : "jobs"}
          </span>{" "}
          matching your criteria
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-600"
            onClick={handleClearAll}
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">Searching jobs...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={fetchJobs}
            variant="outline"
            className="text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500 mb-4">
              No jobs match your current filters. Try adjusting your search
              criteria or clearing some filters.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearAll}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
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
