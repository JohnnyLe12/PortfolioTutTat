import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Image, X, Save, Eye } from "lucide-react";

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

export default function PortfolioBuilderPage() {
  const [isDragging, setIsDragging] = useState(false);

  // Store uploaded image objects
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const existingProjects = [
    {
      id: 1,
      title: "Mobile App Redesign",
      tags: ["UI/UX", "Mobile"],
      image: "🎨",
    },
    {
      id: 2,
      title: "Brand Identity System",
      tags: ["Branding", "Logo"],
      image: "🎭",
    },
    {
      id: 3,
      title: "Motion Graphics Reel",
      tags: ["Motion", "Animation"],
      image: "🎬",
    },
  ];

  // Drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Drop upload
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  // Input upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  // Remove image
  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Portfolio Builder
        </h1>

        <p className="text-gray-600 text-lg">
          Create and manage your creative portfolio
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Project Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload New Project
              </CardTitle>

              <CardDescription>
                Showcase your best work to potential employers
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Drag & Drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-indigo-600" />
                  </div>

                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {isDragging
                      ? "Drop files here"
                      : "Drag & drop your images"}
                  </h3>

                  <p className="text-gray-600 mb-4">
                    or click to browse
                  </p>

                  {/* Hidden input */}
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <label htmlFor="file-upload">
                    <Button
                      variant="outline"
                      className="border-2"
                      asChild
                    >
                      <span>
                        <Image className="h-4 w-4 mr-2" />
                        Choose Files
                      </span>
                    </Button>
                  </label>

                  <p className="text-sm text-gray-500 mt-4">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>

              {/* Uploaded Preview */}
              {uploadedFiles.length > 0 && (
                <div>
                  <Label className="text-base mb-3 block">
                    Uploaded Files ({uploadedFiles.length})
                  </Label>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative group"
                      >
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="aspect-square w-full object-cover rounded-lg border"
                        />

                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <p className="text-xs text-gray-500 mt-2 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4 pt-4 border-t">
                {/* Title */}
                <div>
                  <Label
                    htmlFor="title"
                    className="text-base"
                  >
                    Project Title
                  </Label>

                  <Input
                    id="title"
                    placeholder="E-commerce App Redesign"
                    className="h-11 text-base mt-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label
                    htmlFor="description"
                    className="text-base"
                  >
                    Description
                  </Label>

                  <Textarea
                    id="description"
                    placeholder="Describe your project, the challenge, your process, and the results..."
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label
                    htmlFor="tags"
                    className="text-base"
                  >
                    Tags
                  </Label>

                  <Input
                    id="tags"
                    placeholder="UI/UX, Mobile, E-commerce"
                    className="h-11 text-base mt-2"
                  />

                  <p className="text-sm text-gray-500 mt-2">
                    Separate tags with commas
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>

                  <Link
                    to="/portfolio/1"
                    className="flex-1"
                  >
                    <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Project
                    </Button>
                  </Link>
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
              <CardTitle>Your Projects</CardTitle>

              <CardDescription>
                {existingProjects.length} published
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {existingProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/portfolio/${project.id}`}
                >
                  <div className="p-3 border-2 rounded-lg hover:border-indigo-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
                        {project.image}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {project.title}
                        </div>
                      </div>
                    </div>

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
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-2 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                💡 Portfolio Tips
              </h3>

              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">
                    •
                  </span>
                  <span>Use high-quality images</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">
                    •
                  </span>
                  <span>Write detailed case studies</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">
                    •
                  </span>
                  <span>Show your design process</span>
                </li>

                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">
                    •
                  </span>
                  <span>Include project outcomes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}