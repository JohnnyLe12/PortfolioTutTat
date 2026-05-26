import { useState } from "react";
import { Link } from "react-router-dom";

import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Bookmark,
  Share2,
  Check,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export default function JobDetailPage() {
  const [showSuccessModal, setShowSuccessModal] =
    useState(false);

  const handleApply = () => {
    setShowSuccessModal(true);
  };

  return (
    <>
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">

              {/* Header */}
              <div>
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="h-20 w-20 border-2 border-indigo-200">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                      S
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2 text-gray-900">
                      UI Designer Intern
                    </h1>

                    <div className="text-2xl text-gray-600 mb-4 font-medium">
                      Spotify
                    </div>

                    <div className="flex flex-wrap gap-4 text-base text-gray-600">

                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Remote
                      </div>

                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Internship
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        $2k-3k/month
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Posted 2 days ago
                      </div>

                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApply}
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Apply for this Position
                  </Button>

                  <Button variant="outline">
                    <Bookmark className="h-5 w-5" />
                  </Button>

                  <Button variant="outline">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* About */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  About the Role
                </h2>

                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    We're looking for a talented UI Designer
                    Intern to join our design team at Spotify.
                  </p>

                  <p>
                    This is a 6-month internship with the
                    possibility of conversion to full-time.
                  </p>
                </div>
              </section>

              {/* Responsibilities */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  Responsibilities
                </h2>

                <ul className="space-y-3 text-gray-700">
                  {[
                    "Design user interfaces",
                    "Create high-fidelity mockups",
                    "Collaborate with engineers",
                    "Participate in design reviews",
                    "Maintain design systems",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex gap-3"
                    >
                      <span className="text-indigo-600 font-bold">
                        •
                      </span>

                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Requirements */}
              <section>
                <h2 className="text-3xl font-bold mb-4">
                  Requirements
                </h2>

                <ul className="space-y-3 text-gray-700">
                  {[
                    "Strong portfolio",
                    "Proficiency in Figma",
                    "Understanding of design principles",
                    "Communication skills",
                  ].map((req) => (
                    <li
                      key={req}
                      className="flex gap-3"
                    >
                      <Check className="h-5 w-5 text-green-600 mt-1" />

                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Skills */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">
                    Required Skills
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "UI Design",
                      "Figma",
                      "Typography",
                    ].map((skill) => (
                      <Badge key={skill}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold">
                    Job Details
                  </h3>

                  <div>
                    <p className="text-sm text-gray-500">
                      Experience
                    </p>

                    <p className="font-medium">
                      Entry Level
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Work Mode
                    </p>

                    <p className="font-medium">
                      Remote
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Salary
                    </p>

                    <p className="font-medium">
                      $2,000 - $3,000
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleApply}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
              >
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
      >
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
              Your application has been sent successfully.
            </DialogDescription>

          </DialogHeader>

          <div className="flex flex-col gap-3 pt-4">

            <Link to="/dashboard">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>

            <Link to="/jobs">
              <Button
                variant="outline"
                className="w-full"
              >
                Browse More Jobs
              </Button>
            </Link>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}