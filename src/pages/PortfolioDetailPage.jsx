import { useState } from "react";
import { Link } from "react-router-dom";
import { getDefaultConfig } from "tailwind-merge";

import {
  Heart,
  Eye,
  Share2,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";

export default function PortfolioDetailPage() {
  const [liked, setLiked] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Mobile App Redesign",
        text: "Check out this portfolio project!",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Mobile App Redesign
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            A complete redesign of the shopping experience for a leading
            e-commerce platform, focusing on improved navigation and checkout
            flow for mobile users.
          </p>

          {/* Top Meta */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            {/* Author */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-indigo-200">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-lg">
                  JD
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="font-semibold text-lg text-gray-900">
                  Jane Doe
                </div>

                <div className="text-gray-600">
                  UI/UX Designer
                </div>
              </div>
            </div>

            {/* Stats + Actions */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-2 text-gray-600">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">234</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="h-5 w-5" />
                <span className="font-semibold">1.2k</span>
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
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge className="px-3 py-1 text-sm">
              UI/UX Design
            </Badge>

            <Badge className="px-3 py-1 text-sm">
              Mobile
            </Badge>

            <Badge className="px-3 py-1 text-sm">
              E-commerce
            </Badge>

            <Badge className="px-3 py-1 text-sm">
              Figma
            </Badge>
          </div>

          {/* CTA */}
          <Link to="/feedback">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-6 font-semibold shadow-lg">
              <MessageSquare className="h-4 w-4 mr-2" />
              Request Feedback
            </Button>
          </Link>
        </div>

        {/* Project Images */}
        <div className="space-y-8 mb-16">
          {/* Hero */}
          <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 flex items-center justify-center shadow-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>

              <p className="text-gray-700 font-semibold text-lg">
                Hero Image
              </p>
            </div>
          </div>

          {/* Grid Images */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-5xl mb-3">📱</div>

                <p className="text-gray-700 font-medium">
                  Mobile View
                </p>
              </div>
            </div>

            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-5xl mb-3">🛒</div>

                <p className="text-gray-700 font-medium">
                  Checkout Flow
                </p>
              </div>
            </div>
          </div>

          {/* Process */}
          <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-green-200 to-teal-200 flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>

              <p className="text-gray-700 font-semibold text-lg">
                Design Process
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                About this project
              </h2>

              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  This project was a comprehensive redesign of a mobile
                  e-commerce application serving over 2 million users.
                  The goal was to improve the user experience, reduce
                  cart abandonment, and increase conversion rates.
                </p>

                <p>
                  Through extensive user research and testing, we
                  identified key pain points in the existing design
                  and developed solutions that resulted in a 35%
                  increase in completed purchases.
                </p>
              </div>
            </section>

            {/* Challenge */}
            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                The Challenge
              </h2>

              <p className="text-gray-700 text-lg leading-relaxed">
                The original app had a cluttered interface with poor
                navigation hierarchy. Users struggled to find products
                and complete purchases, leading to high abandonment
                rates.
              </p>
            </section>

            {/* Solution */}
            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                The Solution
              </h2>

              <p className="text-gray-700 text-lg leading-relaxed">
                We streamlined the navigation, implemented a more
                intuitive category structure, and redesigned the
                checkout flow to be a single-page experience with
                clear progress indicators.
              </p>
            </section>

            {/* Results */}
            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">
                Results
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                      +35%
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                      Conversion Rate
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                      -42%
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                      Cart Abandonment
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                      4.8★
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                      User Rating
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Project Info */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4 text-lg text-gray-900">
                    Project Info
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Role
                      </div>

                      <div className="font-semibold text-gray-900">
                        Lead UI/UX Designer
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Duration
                      </div>

                      <div className="font-semibold text-gray-900">
                        3 months
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Year
                      </div>

                      <div className="font-semibold text-gray-900">
                        2026
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Tools Used
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">
                          Figma
                        </Badge>

                        <Badge variant="secondary">
                          Photoshop
                        </Badge>

                        <Badge variant="secondary">
                          Illustrator
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Project */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live Project
                </Button>
              </a>

              {/* Like */}
              <Button
                variant={liked ? "default" : "outline"}
                className="w-full h-11 border-2"
                onClick={() => setLiked(!liked)}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${
                    liked ? "fill-current" : ""
                  }`}
                />

                {liked ? "Liked" : "Like Project"}
              </Button>

              {/* Feedback */}
              <Link to="/feedback">
                <Button
                  variant="outline"
                  className="w-full h-11 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get Feedback
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}