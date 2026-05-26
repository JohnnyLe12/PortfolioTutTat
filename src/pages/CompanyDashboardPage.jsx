import { Link } from "react-router-dom"; 
import {
  Users,
  Eye,
  Briefcase,
  Search,
  Filter,
} from "lucide-react";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";

import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

export default function CompanyDashboardPage() {
  const candidates = [
    {
      id: 1,
      name: "Jane Doe",
      avatar: "JD",
      title: "UI/UX Designer",
      location: "San Francisco, CA",
      skills: ["UI Design", "Figma", "Prototyping"],
      projects: 12,
      views: 2340,
      matchScore: 95,
    },
    {
      id: 2,
      name: "Alex Johnson",
      avatar: "AJ",
      title: "Motion Designer",
      location: "Remote",
      skills: ["After Effects", "Animation", "3D"],
      projects: 8,
      views: 1890,
      matchScore: 88,
    },
    {
      id: 3,
      name: "Maria Garcia",
      avatar: "MG",
      title: "Graphic Designer",
      location: "New York, NY",
      skills: ["Branding", "Illustrator", "Typography"],
      projects: 15,
      views: 3120,
      matchScore: 92,
    },
  ];

  const jobPostings = [
    {
      id: 1,
      title: "UI Designer Intern",
      applicants: 24,
      views: 456,
      status: "Active",
    },
    {
      id: 2,
      title: "Junior UX Designer",
      applicants: 18,
      views: 389,
      status: "Active",
    },
    {
      id: 3,
      title: "Graphic Design Intern",
      applicants: 31,
      views: 502,
      status: "Closed",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Company Dashboard
        </h1>

        <p className="text-gray-600">
          Discover talented designers and manage your job postings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Active Jobs
              </p>

              <Briefcase className="h-4 w-4 text-gray-400" />
            </div>

            <h2 className="text-3xl font-bold">3</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Total Applicants
              </p>

              <Users className="h-4 w-4 text-gray-400" />
            </div>

            <h2 className="text-3xl font-bold">73</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Profile Views
              </p>

              <Eye className="h-4 w-4 text-gray-400" />
            </div>

            <h2 className="text-3xl font-bold">1,347</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Candidates Saved
              </p>

              <Users className="h-4 w-4 text-gray-400" />
            </div>

            <h2 className="text-3xl font-bold">12</h2>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card className="border-2 hover:border-purple-300 transition-all cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Post a New Job
                </h3>

                <p className="text-sm text-gray-600">
                  Find your next team member
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-purple-300 transition-all cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Search Candidates
                </h3>

                <p className="text-sm text-gray-600">
                  Browse designer portfolios
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-8">

        {/* Candidates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Recommended Candidates
                </CardTitle>

                <CardDescription>
                  Top matches for your open positions
                </CardDescription>
              </div>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="hover:border-purple-300 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {candidate.avatar}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">
                            {candidate.name}
                          </h3>

                          <p className="text-sm text-gray-600">
                            {candidate.title}
                          </p>

                          <p className="text-xs text-gray-500">
                            {candidate.location}
                          </p>
                        </div>

                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                          {candidate.matchScore}% Match
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-4 text-xs text-gray-500 mb-3">
                        <span>
                          {candidate.projects} projects
                        </span>

                        <span>
                          {candidate.views} views
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>

                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>
              Search Candidates
            </CardTitle>

            <CardDescription>
              Find designers by skills and expertise
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

              <Input
                placeholder="Search by skills..."
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["UI/UX", "Branding", "Motion", "Illustration"].map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-100"
                >
                  {skill}
                </Badge>
              ))}
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
              Search Candidates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}