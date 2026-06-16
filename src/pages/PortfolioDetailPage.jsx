import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  Eye,
  Share2,
  MessageSquare,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Globe,
  AlertTriangle,
  Send,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

import StatusBadge from "../components/project/StatusBadge";
import MediaUploader from "../components/project/MediaUploader";
import useAuth from "../hooks/useAuth";
import { apiGet, apiPut, apiDelete, apiPatch, apiPost } from "../lib/api";

export default function PortfolioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Project data state
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Media upload state (edit mode)
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [mediaError, setMediaError] = useState("");
  const [deletingMediaId, setDeletingMediaId] = useState(null);

  // Status change state
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Like state
  const [liked, setLiked] = useState(false);

  // Feedback request dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // ─── Fetch Project Data ─────────────────────────────────────────────────────

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await apiGet(`/projects/${id}`);
      const data = result.data || result;
      setProject(data);
    } catch (err) {
      setError(err.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // ─── Ownership Check ────────────────────────────────────────────────────────

  const isOwner = project && user && project.menteeId === user.profileId;

  // ─── Edit Mode ──────────────────────────────────────────────────────────────

  function enterEditMode() {
    setEditTitle(project.title || "");
    setEditDescription(project.description || "");
    setEditTags((project.tags || []).join(", "));
    setEditErrors({});
    setNewMediaFiles([]);
    setMediaError("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditErrors({});
    setNewMediaFiles([]);
    setMediaError("");
  }

  function validateEdit() {
    const errors = {};
    if (!editTitle.trim()) {
      errors.title = "Project Title is required.";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveEdit() {
    if (!validateEdit()) return;

    setIsSaving(true);
    try {
      // Update project metadata
      const payload = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        tags: editTags.trim() || undefined,
      };

      await apiPut(`/projects/${id}`, payload);

      // Upload new media files if any
      if (newMediaFiles.length > 0) {
        for (const fileObj of newMediaFiles) {
          const formData = new FormData();
          formData.append("file", fileObj.file);
          try {
            await apiPost(`/projects/${id}/media`, formData);
          } catch {
            console.error(`Failed to upload ${fileObj.name}`);
          }
        }
      }

      // Refresh project data
      await fetchProject();
      setIsEditing(false);
    } catch (err) {
      setEditErrors((prev) => ({
        ...prev,
        submit: err.message || "Failed to save changes.",
      }));
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Media Delete (Edit Mode) ───────────────────────────────────────────────

  async function handleDeleteMedia(mediaId) {
    setDeletingMediaId(mediaId);
    try {
      await apiDelete(`/projects/${id}/media/${mediaId}`);
      // Update local state to remove the media
      setProject((prev) => ({
        ...prev,
        media: prev.media.filter((m) => m.id !== mediaId),
      }));
    } catch (err) {
      setMediaError(err.message || "Failed to delete media.");
    } finally {
      setDeletingMediaId(null);
    }
  }

  // ─── Status Change ──────────────────────────────────────────────────────────

  async function handleStatusChange(newStatus) {
    setIsChangingStatus(true);
    try {
      await apiPatch(`/projects/${id}/status`, { status: newStatus });
      await fetchProject();
    } catch (err) {
      setError(err.message || "Failed to change status.");
    } finally {
      setIsChangingStatus(false);
    }
  }

  // ─── Delete Project ─────────────────────────────────────────────────────────

  async function handleDeleteClick() {
    // Check for in-review feedback requests
    try {
      const result = await apiGet(`/feedback-requests`, {
        projectId: id,
        status: "in_review",
      });
      const requests = result.data || result;
      if (Array.isArray(requests) && requests.length > 0) {
        setDeleteWarning(
          `This project has ${requests.length} feedback request(s) currently In Review. Deleting will remove all associated feedback requests.`
        );
      } else {
        setDeleteWarning("");
      }
    } catch {
      // If we can't check, still allow delete but show generic warning
      setDeleteWarning("");
    }
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await apiDelete(`/projects/${id}`);
      navigate("/portfolio");
    } catch (err) {
      setError(err.message || "Failed to delete project.");
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Request Feedback ─────────────────────────────────────────────────────

  function openFeedbackDialog() {
    setFeedbackNote("");
    setFeedbackError("");
    setFeedbackSuccess(false);
    setShowFeedbackDialog(true);
  }

  async function handleSubmitFeedbackRequest() {
    setFeedbackSubmitting(true);
    setFeedbackError("");

    try {
      await apiPost("/feedback-requests", {
        projectId: id,
        note: feedbackNote.trim() || undefined,
      });

      setFeedbackSuccess(true);
      // Refresh project to reflect status change to pending_feedback
      await fetchProject();
    } catch (err) {
      if (err.status === 409) {
        setFeedbackError(
          "An active feedback request already exists for this project. Please wait until the current request is completed."
        );
      } else {
        setFeedbackError(err.message || "Failed to submit feedback request.");
      }
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // ─── Share ──────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: project?.title || "Portfolio Project",
        text: "Check out this portfolio project!",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // ─── Loading/Error States ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Project not found.</p>
      </div>
    );
  }

  // ─── Author Info ────────────────────────────────────────────────────────────

  const authorName = project.mentee?.fullName || "Unknown Author";
  const authorRole = project.mentee?.roleTitle || "";
  const authorInitials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-12">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          {/* Status Badge + Owner Actions */}
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status={project.status} />

            {isOwner && !isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterEditMode}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          {isEditing ? (
            <div className="mb-6">
              <Label htmlFor="edit-title" className="text-base">
                Project Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                className={`h-11 text-base mt-2 ${
                  editErrors.title ? "border-red-500" : ""
                }`}
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  if (editErrors.title)
                    setEditErrors((prev) => ({ ...prev, title: undefined }));
                }}
              />
              {editErrors.title && (
                <p className="text-sm text-red-600 mt-1">{editErrors.title}</p>
              )}
            </div>
          ) : (
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              {project.title}
            </h1>
          )}

          {/* Description */}
          {isEditing ? (
            <div className="mb-6">
              <Label htmlFor="edit-description" className="text-base">
                Description
              </Label>
              <Textarea
                id="edit-description"
                className="mt-2 min-h-[120px]"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          ) : (
            project.description && (
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                {project.description}
              </p>
            )
          )}

          {/* Top Meta */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            {/* Author */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-indigo-200">
                {project.mentee?.avatarUrl ? (
                  <img
                    src={project.mentee.avatarUrl}
                    alt={authorName}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-lg">
                    {authorInitials}
                  </AvatarFallback>
                )}
              </Avatar>

              <div>
                <div className="font-semibold text-lg text-gray-900">
                  {authorName}
                </div>
                {authorRole && (
                  <div className="text-gray-600">{authorRole}</div>
                )}
              </div>
            </div>

            {/* Stats + Actions */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2 text-gray-600">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">{project.likeCount || 0}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="h-5 w-5" />
                <span className="font-semibold">{project.viewCount || 0}</span>
              </div>

              <Button
                variant="outline"
                className="border-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Tags */}
          {isEditing ? (
            <div className="mb-6">
              <Label htmlFor="edit-tags" className="text-base">
                Tags
              </Label>
              <Input
                id="edit-tags"
                className="h-11 text-base mt-2"
                placeholder="UI/UX, Mobile, E-commerce"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Separate tags with commas
              </p>
            </div>
          ) : (
            project.tags &&
            project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.map((tag, i) => (
                  <Badge key={i} className="px-3 py-1 text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )
          )}

          {/* Edit Submit Error */}
          {isEditing && editErrors.submit && (
            <p className="text-sm text-red-600 mb-4">{editErrors.submit}</p>
          )}

          {/* Edit Mode Buttons */}
          {isEditing && (
            <div className="flex gap-3 mb-8">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Status Change Buttons (Owner, not editing) */}
          {isOwner && !isEditing && (
            <div className="flex flex-wrap gap-3 mb-8">
              {project.status === "draft" && (
                <Button
                  className="bg-green-600 hover:bg-green-700 font-semibold"
                  onClick={() => handleStatusChange("public")}
                  disabled={isChangingStatus}
                >
                  {isChangingStatus ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Publish
                </Button>
              )}

              {project.status === "public" && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("draft")}
                  disabled={isChangingStatus}
                >
                  {isChangingStatus && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Move to Draft
                </Button>
              )}

              {(project.status === "draft" || project.status === "public") && (
                <Button
                  variant="outline"
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  onClick={openFeedbackDialog}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request Feedback
                </Button>
              )}

              {project.status === "pending_feedback" && (
                <>
                  <Button
                    className="bg-green-600 hover:bg-green-700 font-semibold"
                    onClick={() => handleStatusChange("public")}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    Publish
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("draft")}
                    disabled={isChangingStatus}
                  >
                    Move to Draft
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Non-owner: Request Feedback button */}
          {!isOwner && !isEditing && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 font-semibold shadow-lg mb-8"
              onClick={openFeedbackDialog}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Request Feedback
            </Button>
          )}
        </div>

        {/* Media Gallery */}
        <div className="space-y-8 mb-16">
          {/* Edit mode: existing media with delete + new upload */}
          {isEditing ? (
            <div className="space-y-6">
              {/* Existing Media */}
              {project.media && project.media.length > 0 && (
                <div>
                  <Label className="text-base mb-3 block">
                    Current Media ({project.media.length})
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {project.media.map((media) => (
                      <div key={media.id} className="relative group">
                        <img
                          src={media.url}
                          alt={media.fileName || "Project media"}
                          className="aspect-square w-full object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(media.id)}
                          disabled={deletingMediaId === media.id}
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          aria-label={`Remove ${media.fileName || "media"}`}
                        >
                          {deletingMediaId === media.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new media */}
              <div>
                <Label className="text-base mb-3 block">Add New Media</Label>
                <MediaUploader
                  files={newMediaFiles}
                  onFilesChange={setNewMediaFiles}
                  onError={(msg) => setMediaError(msg)}
                />
                {mediaError && (
                  <p className="text-sm text-red-600 mt-2">{mediaError}</p>
                )}
              </div>
            </div>
          ) : (
            /* View mode: display media gallery */
            project.media &&
            project.media.length > 0 && (
              <>
                {/* Hero image (first media) */}
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={project.media[0].url}
                    alt={project.media[0].fileName || "Project hero"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remaining images in grid */}
                {project.media.length > 1 && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {project.media.slice(1).map((media) => (
                      <div
                        key={media.id}
                        className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg"
                      >
                        <img
                          src={media.url}
                          alt={media.fileName || "Project media"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          )}

          {/* No media placeholder (view mode) */}
          {!isEditing &&
            (!project.media || project.media.length === 0) && (
              <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-gray-700 font-semibold text-lg">
                    No media uploaded yet
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* Sidebar */}
        {!isEditing && (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {/* About section when description is long */}
              {project.description && project.description.length > 200 && (
                <section>
                  <h2 className="text-3xl font-bold mb-4 text-gray-900">
                    About this project
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </section>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Project Info Card */}
                <Card className="border-2">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4 text-lg text-gray-900">
                      Project Info
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Status</div>
                        <StatusBadge status={project.status} />
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Views</div>
                        <div className="font-semibold text-gray-900">
                          {project.viewCount || 0}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Likes</div>
                        <div className="font-semibold text-gray-900">
                          {project.likeCount || 0}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Created</div>
                        <div className="font-semibold text-gray-900">
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>

                      {project.tags && project.tags.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Tags</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Like Button */}
                <Button
                  variant={liked ? "default" : "outline"}
                  className="w-full h-11 border-2"
                  onClick={() => setLiked(!liked)}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${liked ? "fill-current" : ""}`}
                  />
                  {liked ? "Liked" : "Like Project"}
                </Button>

                {/* Request Feedback */}
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  onClick={openFeedbackDialog}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get Feedback
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{project.title}&quot;? This
              action cannot be undone. All media and feedback requests associated
              with this project will also be removed.
            </DialogDescription>
          </DialogHeader>

          {deleteWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{deleteWarning}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Feedback Dialog */}
      <Dialog
        open={showFeedbackDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowFeedbackDialog(false);
            setFeedbackSuccess(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Request Feedback
            </DialogTitle>
            <DialogDescription>
              Send this project to a Buddy for professional review. You can add
              an optional note to guide the reviewer.
            </DialogDescription>
          </DialogHeader>

          {feedbackSuccess ? (
            <div className="py-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <p className="font-medium">Feedback request submitted!</p>
                <p className="text-sm mt-1">
                  Your project has been sent for review. You&apos;ll be notified
                  when a Buddy starts reviewing.
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Project info */}
              <div className="py-2">
                <Label className="text-sm text-gray-600">Project</Label>
                <p className="font-medium text-gray-900 mt-1">
                  {project.title}
                </p>
              </div>

              {/* Note input */}
              <div className="py-2">
                <Label htmlFor="feedback-note" className="text-sm">
                  Note for Buddy (optional)
                </Label>
                <Textarea
                  id="feedback-note"
                  className="mt-2 min-h-[100px]"
                  placeholder="Any specific areas you'd like feedback on? E.g., color palette, typography, layout..."
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  disabled={feedbackSubmitting}
                />
              </div>

              {/* Error message */}
              {feedbackError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {feedbackError}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackDialog(false)}
                  disabled={feedbackSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSubmitFeedbackRequest}
                  disabled={feedbackSubmitting}
                >
                  {feedbackSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
