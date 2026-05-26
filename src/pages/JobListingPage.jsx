import { Link } from "react-router-dom";
import { useState } from "react";
import { Search, MapPin, Briefcase, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

export default function JobListingPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = ["All Types", "Internship", "Fresher", "Freelance", "Part-time"];

  const jobs = [
    {
      id: 1,
      title: "UI Designer Intern",
      company: "Spotify",
      logo: "S",
      location: "Remote",
      type: "Internship",
      salary: "$2k-3k/mo",
      posted: "2 days ago",
      skills: ["UI Design", "Figma", "Prototyping"],
    },
    {
      id: 2,
      title: "Junior UX Designer",
      company: "Airbnb",
      logo: "A",
      location: "San Francisco, CA",
      type: "Fresher",
      salary: "$70k-90k",
      posted: "1 week ago",
      skills: ["UX Research", "Wireframing", "User Testing"],
    },
    {
      id: 3,
      title: "Graphic Design Intern",
      company: "Nike",
      logo: "N",
      location: "Portland, OR",
      type: "Internship",
      salary: "$2.5k/mo",
      posted: "3 days ago",
      skills: ["Branding", "Illustrator", "Photoshop"],
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Find Your Dream Job
        </h1>

        <p className="text-gray-600 text-lg">
          Discover internships and entry-level positions for creative talents
        </p>
      </div>

      {/* Search */}
      <Card className="border-2 mb-8 shadow-lg">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

              <Input
                placeholder="Search job titles, companies..."
                className="pl-12 h-12 text-base border-2"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

              <Input
                placeholder="Location"
                className="pl-12 h-12 text-base border-2"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => {
              const filterValue = filter.toLowerCase().replace(" ", "-");

              return (
                <Button
                  key={filter}
                  variant={activeFilter === filterValue ? "default" : "outline"}
                  size="sm"
                  className={`h-10 px-4 border-2 transition-all ${
                    activeFilter === filterValue
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "hover:border-indigo-300"
                  }`}
                  onClick={() => setActiveFilter(filterValue)}
                >
                  {filter}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {jobs.length} jobs
          </span>{" "}
          matching your criteria
        </p>
      </div>

      {/* Jobs */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="border-2 hover:border-indigo-300 transition-all hover:shadow-xl group"
          >
            <CardContent className="p-6">
              <div className="flex gap-6">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
                    {job.logo}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div>
                      <Link to={`/jobs/${job.id}`}>
                        <h3 className="font-bold text-xl text-gray-900 hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                      </Link>

                      <div className="text-base text-gray-600 font-medium mt-1">
                        {job.company}
                      </div>
                    </div>

                    <Link to={`/jobs/${job.id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        Apply Now
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {job.type}
                    </div>

                    <div className="font-semibold text-gray-900">
                      {job.salary}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {job.posted}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}