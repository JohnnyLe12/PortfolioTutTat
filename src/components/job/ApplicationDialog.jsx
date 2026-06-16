import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, AlertCircle, FolderOpen, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { apiGet, apiPost, ApiError } from "../../lib/api";

/**
 * ApplicationDialog handles the job application flow:
 * 1. Shows portfolio selector (Public projects only)
 * 2. Confirms application submission
 * 3. Displays success modal or error messages
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {(open: boolean) => void} props.onOpenChange - Control open state
 * @param {string} props.jobId - The job ID to apply to
 * @param {string} props.jobTitle - The job title (for display)
 */
export default function ApplicationDialog({ open, onOpenChange, jobId, jobTitle }) {
  const [projects, setProjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch public projects when dialog opens
  useEffect(() => {
    if (!open) return;

    // Reset state when opening
    setSelectedIds([]);
    setError(null);
    setShowSuccess(false);

    const fetchProjects = async () => {
      setLoading(true);
      try {
        const result = await apiGet("/applications/portfolios");
        setProjects(result.data || []);
      } catch (err) {
        console.error("[ApplicationDialog] Failed to fetch projects:", err);
        setError("Failed to load your projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [open]);

  const toggleProject = (projectId) => {
    setSelectedIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one project for your portfolio.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPost("/applications", {
        jobId,
        portfolioIds: selectedIds,
      });
      setShowSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("You have already applied for this position.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError(err.message || "Invalid application. Please check your selection.");
      } else {
        setError("Failed to submit application. Please try again.");
      }
      console.error("[ApplicationDialog] Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset success state after closing
    if (showSuccess) {
      setTimeout(() => setShowSuccess(false), 300);
    }
  };

  // Success Modal
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center">
              Application Submitted!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your application for <span className="font-medium">{jobTitle}</span> has been sent successfully.
              You&apos;ll receive a notification when the company reviews your portfolio.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link to="/jobs">
              <Button variant="outline" className="w-full">
                Browse More Jobs
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No Public Projects Guidance
  if (!loading && projects.length === 0 && !error) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <DialogTitle className="text-center">
              No Public Projects
            </DialogTitle>
            <DialogDescription className="text-center">
              You need at least one Public project in your portfolio to apply for jobs.
              Publish a project first, then come back to apply.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/portfolio">
              <Button className="w-full">Go to Portfolio</Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Portfolio Selection Dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for this Position</DialogTitle>
          <DialogDescription>
            Select projects from your portfolio to include with your application.
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading your projects...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Project Selection */}
        {!loading && projects.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto py-2">
            {projects.map((project) => {
              const isSelected = selectedIds.includes(project.id);
              return (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                  onClick={() => toggleProject(project.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {project.title}
                        </p>
                        {project.isApproved ? (
                          <Badge className="border-transparent bg-green-100 text-green-700 shrink-0">
                            <ShieldCheck className="h-3 w-3" />
                            Buddy Approved
                          </Badge>
                        ) : (
                          <Badge className="border-transparent bg-gray-100 text-gray-600 shrink-0">
                            Unreviewed
                          </Badge>
                        )}
                      </div>
                      {project.tags?.length > 0 && (
                        <p className="text-sm text-gray-500 truncate">
                          {project.tags.join(", ")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {!loading && projects.length > 0 && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={submitting || selectedIds.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                `Confirm Application (${selectedIds.length})`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
