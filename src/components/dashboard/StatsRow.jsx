import { Eye, Heart, Briefcase, TrendingUp } from "lucide-react";

/**
 * StatsRow: displays three stat counters — profile views, portfolio likes, applications.
 *
 * Props:
 * - stats: { totalViews: number, totalLikes: number, totalApplications: number }
 * - className: optional wrapper className
 */
export default function StatsRow({ stats, className = "" }) {
  const items = [
    {
      title: "Profile Views",
      value: stats?.totalViews ?? 0,
      icon: Eye,
    },
    {
      title: "Portfolio Likes",
      value: stats?.totalLikes ?? 0,
      icon: Heart,
    },
    {
      title: "Applications",
      value: stats?.totalApplications ?? 0,
      icon: Briefcase,
    },
  ];

  return (
    <div className={`grid md:grid-cols-3 gap-6 ${className}`}>
      {items.map((stat, index) => (
        <div
          key={index}
          className="bg-white border rounded-2xl p-6"
        >
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">
              {stat.title}
            </span>
            <stat.icon className="w-5 h-5 text-gray-400" />
          </div>

          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            {stat.value.toLocaleString()}
          </h3>

          <div className="flex items-center gap-1 text-green-600 text-sm">
            <TrendingUp className="w-4 h-4" />
            +12%
          </div>
        </div>
      ))}
    </div>
  );
}
