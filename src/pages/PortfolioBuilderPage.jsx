import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Save, Eye, Loader2 } from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

import MediaUploader from "../components/project/MediaUploader";
import { apiPost, apiGet } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function PortfolioBuilderPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // UI state
  const [errors, setErrors] = useState({});
  const [mediaError, setMediaError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Sidebar: existing projects
  const [existingProjects, setExistingProjects] = useState([]);

  useEffect(() => {
    loadExistingProjects();
  }, []);

  async function loadExistingProjects() {
    try {
      const result = await apiGet("/projects");
      const projects = result.data || result;
      setExistingProjects(Array.isArray(projects) ? projects.slice(0, 5) : []);
    } catch {
      // Non-critical — sidebar projects are optional
      setExistingProjects([]);
    }
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate() {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Project Title is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Save Project ─────────────────────────────────────────────────────────

  async function handleSave() {
    setMediaError("");

    if (!validate()) return;

    setIsSaving(true);

    try {
      // 1. Create the project via API
      const projectPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        status: "draft",
      };

      const createResult = await apiPost("/projects", projectPayload);
      const project = createResult.data || createResult;
      const projectId = project.id;

      // 2. Upload media files if any
      if (uploadedFiles.length > 0) {
        for (const fileObj of uploadedFiles) {
          const formData = new FormData();
          formData.append("file", fileObj.file);

          try {
            await apiPost(`/projects/${projectId}/media`, formData);
          } catch {
            // Continue uploading remaining files even if one fails
            console.error(`Failed to upload ${fileObj.name}`);
          }
        }
      }

      // 3. Redirect to PortfolioDetailPage
      navigate(`/portfolio/${projectId}`);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Failed to save project. Please try again.",
      }));
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Preview Modal ────────────────────────────────────────────────────────

  function handlePreview() {
    // No data is saved; just show a preview modal
    setShowPreview(true);
  }

  // Parse tags for display
  const parsedTags = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {t("portfolio.builder.title")}
        </h1>

        <p className="text-gray-600 text-lg">
          {t("portfolio.builder.subtitle")}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Project Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">{t("portfolio.builder.uploadProject")}</CardTitle>

              <CardDescription>
                {t("portfolio.builder.showcaseWork")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Media Uploader Component */}
              <MediaUploader
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onError={(msg) => setMediaError(msg)}
              />

              {/* Media error display */}
              {mediaError && (
                <p className="text-sm text-red-600">{mediaError}</p>
              )}

              {/* Form */}
              <div className="space-y-4 pt-4 border-t">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-base">
                    {t("portfolio.builder.projectTitle")} <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="title"
                    placeholder="E-commerce App Redesign"
                    className={`h-11 text-base mt-2 ${
                      errors.title ? "border-red-500" : ""
                    }`}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) {
                        setErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                  />

                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-base">
                    {t("portfolio.builder.description")}
                  </Label>

                  <Textarea
                    id="description"
                    placeholder="Describe your project, the challenge, your process, and the results..."
                    className="mt-2 min-h-[120px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags" className="text-base">
                    {t("portfolio.builder.tags")}
                  </Label>

                  <Input
                    id="tags"
                    placeholder="UI/UX, Mobile, E-commerce"
                    className="h-11 text-base mt-2"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />

                  <p className="text-sm text-gray-500 mt-2">
                    {t("portfolio.builder.separateTags")}
                  </p>
                </div>

                {/* Submit error */}
                {errors.submit && (
                  <p className="text-sm text-red-600">{errors.submit}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={handlePreview}
                    type="button"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t("portfolio.builder.preview")}
                  </Button>

                  <Button
                    className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold"
                    onClick={handleSave}
                    disabled={isSaving}
                    type="button"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("portfolio.builder.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t("portfolio.builder.saveProject")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Existing Projects */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>{t("dashboard.yourProjects")}</CardTitle>

              <CardDescription>
                {existingProjects.length} {t("portfolio.builder.projectCount")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {existingProjects.length === 0 && (
                <p className="text-sm text-gray-500">
                  {t("portfolio.builder.noProjects")}
                </p>
              )}

              {existingProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/portfolio/${project.id}`}
                >
                  <div className="p-3 border-2 rounded-lg hover:border-indigo-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
                        {project.media?.[0]?.url ? (
                          <img
                            src={project.media[0].url}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          "🎨"
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {project.title}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {project.status}
                        </div>
                      </div>
                    </div>

                    {project.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-2 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                💡 {t("portfolio.builder.tips.title")}
              </h3>

              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{t("portfolio.builder.tips.highQuality")}</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{t("portfolio.builder.tips.caseStudies")}</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{t("portfolio.builder.tips.designProcess")}</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{t("portfolio.builder.tips.outcomes")}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {title.trim() || "Untitled Project"}
            </DialogTitle>
            <DialogDescription>
              Preview — this will not save your project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Media preview */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {uploadedFiles.map((file, index) => (
                  <img
                    key={index}
                    src={file.preview}
                    alt={file.name}
                    className="aspect-video w-full object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}

            {uploadedFiles.length === 0 && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
                No media uploaded
              </div>
            )}

            {/* Description */}
            {description.trim() && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">
                  Description
                </h4>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            )}

            {/* Tags */}
            {parsedTags.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedTags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status info */}
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium">Draft</span> — project
                will be saved as draft
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
