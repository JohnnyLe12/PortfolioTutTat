import ProjectCard from "./ProjectCard";

/**
 * ProjectGrid — renders a responsive grid of ProjectCards.
 *
 * Props:
 * - projects: Array of project objects (id, title, thumbnailUrl, status, viewCount, likeCount, tags)
 * - onProjectClick?: (id: string) => void
 */
export default function ProjectGrid({ projects = [], onProjectClick }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No projects yet</p>
        <p className="text-sm mt-1">Start building your portfolio!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          title={project.title}
          thumbnailUrl={project.thumbnailUrl}
          status={project.status}
          viewCount={project.viewCount}
          likeCount={project.likeCount}
          tags={project.tags}
          onClick={onProjectClick ? () => onProjectClick(project.id) : undefined}
        />
      ))}
    </div>
  );
}
