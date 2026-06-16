/**
 * StatusBadge — displays a colored chip for project status.
 *
 * Props:
 * - status: 'draft' | 'public' | 'pending_feedback'
 */

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700",
  },
  public: {
    label: "Public",
    className: "bg-green-100 text-green-700",
  },
  pending_feedback: {
    label: "Pending Feedback",
    className: "bg-yellow-100 text-yellow-700",
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
}
