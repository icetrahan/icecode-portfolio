"use client";
import { useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import { ContactButton } from "@/components/ContactModal";
import { projects, type Project } from "@/data/projects";

const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))] as const;

export default function ProjectsPage() {
  const [selected, setSelected] = useState<(typeof categories)[number]>("All");
  const shown: Project[] = selected === "All" ? projects : projects.filter((p) => p.category === selected);

  return (
    <div className="portfolio-shell projects-page">
      <div className="page-head">
        <p className="eyebrow">Projects</p>
        <h1>Things I&apos;ve built and run.</h1>
        <p className="page-sub">
          Products with real users, a game in development, open-source infrastructure and the tools I made along the
          way. Click any card to open the project.
        </p>
      </div>

      <div className="filter-row" role="tablist" aria-label="Filter projects">
        {categories.map((c) => (
          <button key={c} type="button" role="tab" aria-selected={selected === c} className={selected === c ? "is-active" : ""} onClick={() => setSelected(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="project-grid">
        {shown.map((p, i) => <ProjectCard key={p.name} project={p} priority={i < 3} />)}
      </div>

      <section className="closing-line">
        <h2>Got something that needs building?</h2>
        <div className="closing-actions">
          <ContactButton className="button button-primary">Let&apos;s build something <span>→</span></ContactButton>
        </div>
      </section>
    </div>
  );
}
