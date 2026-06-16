import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const JOB_TYPE_FILTERS = [
  { label: "All Types", value: "all" },
  { label: "Internship", value: "internship" },
  { label: "Fresher", value: "fresher" },
  { label: "Freelance", value: "freelance" },
  { label: "Part-time", value: "part_time" },
];

/**
 * JobFilters component with type filter tabs, keyword search (debounced 500ms),
 * and location search.
 *
 * @param {object} props
 * @param {string} props.activeType - Current active type filter value
 * @param {string} props.keyword - Current keyword search value
 * @param {string} props.location - Current location search value
 * @param {(type: string) => void} props.onTypeChange - Callback when type filter changes
 * @param {(keyword: string) => void} props.onKeywordChange - Callback when keyword changes (debounced)
 * @param {(location: string) => void} props.onLocationChange - Callback when location changes
 */
export default function JobFilters({
  activeType = "all",
  keyword = "",
  location = "",
  onTypeChange,
  onKeywordChange,
  onLocationChange,
}) {
  const [keywordInput, setKeywordInput] = useState(keyword);
  const [locationInput, setLocationInput] = useState(location);
  const debounceTimerRef = useRef(null);

  // Debounce keyword search (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onKeywordChange(keywordInput);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [keywordInput, onKeywordChange]);

  // Location change fires on blur or Enter key for simplicity
  const handleLocationKeyDown = (e) => {
    if (e.key === "Enter") {
      onLocationChange(locationInput);
    }
  };

  const handleLocationBlur = () => {
    onLocationChange(locationInput);
  };

  return (
    <Card className="border-2 mb-8 shadow-lg">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search job titles, companies..."
              className="pl-12 h-12 text-base border-2"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Location"
              className="pl-12 h-12 text-base border-2"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              onBlur={handleLocationBlur}
            />
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-3">
          {JOB_TYPE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={activeType === filter.value ? "default" : "outline"}
              size="sm"
              className={`h-10 px-4 border-2 transition-all ${
                activeType === filter.value
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "hover:border-indigo-300"
              }`}
              onClick={() => onTypeChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
