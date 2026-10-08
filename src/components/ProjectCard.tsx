import Image from "next/image";
import Link from "next/link";
import { isExternal, type Project } from "@/data/projects";

/** The whole card is the link: click anywhere to open the project itself. */
export default function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  const external = isExternal(project.href);
  const body = (
    <>
      <div className="project-image">
        <Image src={project.image} alt={`${project.name} screenshot`} fill sizes="(max-width: 900px) 100vw, 33vw" priority={priority} />
      </div>
      <div className="project-body">
        <p className="card-eyebrow">{project.eyebrow}</p>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <span className="project-link">{project.linkLabel} <span aria-hidden="true">{external ? "↗" : "→"}</span></span>
      </div>
    </>
  );
  return external ? (
    <a className="project-card" href={project.href} target="_blank" rel="noopener noreferrer">{body}</a>
  ) : (
    <Link className="project-card" href={project.href}>{body}</Link>
  );
}
