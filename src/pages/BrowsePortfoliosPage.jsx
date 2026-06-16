import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderOpen,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiGet, apiPost, apiDelete } from "../lib/api";

export default function BrowsePortfoliosPage() {
  // Data state
  const [portfolios, setPortfolios] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Filter state
  const [tagsFilter, setTagsFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [bookmarkingIds, setBookmarkingIds] = useState(new Set());

  // Fetch portfolios
  const fetchPortfolios = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page };
        if (tagsFilter.trim()) {
          params.tags = tagsFilter.trim();
        }
        if (majorFilter.trim()) {
          params.major = majorFilter.trim();
        }

        const response = await apiGet("/buddy/portfolios/browse", params);
        const data = response.data || [];
        const pag = response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };

        setPortfolios(data);
        setPagination(pag);
      } catch (err) {
        console.error("Failed to fetch portfolios:", err);
        setError("Failed to load portfolios. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [tagsFilter, majorFilter]
  );

  useEffect(() => {
    fetchPortfolios(1);
  }, [fetchPortfolios]);

  // Handle bookmark toggle
  async function handleBookmark(projectId) {
    const isCurrentlyBookmarked = bookmarkedIds.has(projectId);

    // Optimistic update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });

    setBookmarkingIds((prev) => new Set(prev).add(projectId));

    try {
      if (isCurrentlyBookmarked) {
        await apiDelete(`/buddy/portfolios/bookmark/${projectId}`);
      } else {
        await apiPost("/buddy/portfolios/bookmark", { projectId });
      }
    } catch (err) {
      // Revert optimistic update on error
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyBookmarked) {
          next.add(projectId);
        } else {
          next.delete(projectId);
        }
        return next;
      });

      // 409 means already bookmarked — mark it as bookmarked
      if (err.status === 409) {
        setBookmarkedIds((prev) => new Set(prev).add(projectId));
      }
    } finally {
      setBookmarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }

  // Apply filters
  function handleApplyFilters(e) {
    e.preventDefault();
    fetchPortfolios(1);
  }

  // Clear filters
  function handleClearFilters() {
    setTagsFilter("");
    setMajorFilter("");
  }

  // Pagination
  function goToPage(page) {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPortfolios(page);
    }
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Browse Portfolios</h1>
        <p className="text-gray-600">
          Discover portfolios from mentees waiting for your expert feedback
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplyFilters} className="space-y-4">
                {/* Tags Filter */}
                <div>
                  <label
                    htmlFor="tags-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tags
                  </label>
                  <Input
                    id="tags-filter"
                    placeholder="e.g. UI, Figma, Branding"
                    value={tagsFilter}
                    onChange={(e) => setTagsFilter(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated. Portfolios must match all tags.
                  </p>
                </div>

                {/* Major Filter */}
                <div>
                  <label
                    htmlFor="major-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Major
                  </label>
                  <Input
                    id="major-filter"
                    placeholder="e.g. graphic_design"
                    value={majorFilter}
                    onChange={(e) => setMajorFilter(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Filter by mentee&apos;s major.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </aside>

        {/* Portfolio Grid */}
        <main className="lg:col-span-3">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">
                Loading portfolios...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => fetchPortfolios(pagination.page)}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && portfolios.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No portfolios found
                </h3>
                <p className="text-gray-500 mb-4">
                  There are no portfolios matching your current filters.
                  Try adjusting or clearing your filters.
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Cards */}
          {!loading && !error && portfolios.length > 0 && (
            <>
              {/* Result count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} portfolios
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {portfolios.map((portfolio) => (
                  <Card
                    key={portfolio.id}
                    className="hover:border-purple-300 transition-all"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <Link
                          to={`/portfolio/${portfolio.id}`}
                          className="flex-1 min-w-0"
                        >
                          <h3 className="font-semibold text-gray-900 truncate hover:text-purple-600 transition-colors">
                            {portfolio.title}
                          </h3>
                        </Link>

                        {/* Bookmark Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 shrink-0"
                          disabled={bookmarkingIds.has(portfolio.id)}
                          onClick={() => handleBookmark(portfolio.id)}
                          aria-label={
                            bookmarkedIds.has(portfolio.id)
                              ? "Remove bookmark"
                              : "Bookmark portfolio"
                          }
                        >
                          {bookmarkedIds.has(portfolio.id) ? (
                            <BookmarkCheck className="h-5 w-5 text-purple-600" />
                          ) : (
                            <Bookmark className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                          )}
                        </Button>
                      </div>

                      {/* Description */}
                      {portfolio.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {portfolio.description}
                        </p>
                      )}

                      {/* Tags */}
                      {portfolio.tags && portfolio.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {portfolio.tags.slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                          {portfolio.tags.length > 5 && (
                            <Badge variant="outline">
                              +{portfolio.tags.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Footer: Mentee name + Date */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <span>{portfolio.menteeName}</span>
                        <span>{formatDate(portfolio.date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => goToPage(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-gray-600 mx-4">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => goToPage(pagination.page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
