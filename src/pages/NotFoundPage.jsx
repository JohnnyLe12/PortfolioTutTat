import { Link } from "react-router-dom";
import { Home, Briefcase } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          404
        </div>

        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Page Not Found
        </h1>

        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist.
          It might have been moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 font-semibold shadow-lg">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>

          <Link to="/jobs">
            <Button
              variant="outline"
              className="h-12 px-6 border-2"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}