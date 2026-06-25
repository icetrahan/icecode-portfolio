"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type Project = {
  name: string;
  description: string;
  image: string;
  category: string;
  tags?: string[];
  github?: string;
  liveUrl?: string;
  demoPath?: string;
  featured?: boolean;
};

const projectCategories = [
  "Products", "Web", "Python", "JavaScript", "Server Tools", "REST API", "Flutter", "Discord Bots"
];

const projects: Project[] = [
  {
    name: "Taskiry",
    description:
      "A planning tool built because every other one treats your thinking like an afterthought. Real-time task boards, sprints, whiteboards, documents, and AI task import — keeping the \"why\" behind the work.",
    image: "/projects/Taskiry.png",
    category: "Products",
    tags: ["Next.js", "TypeScript", "tRPC", "Cloudflare D1"],
    liveUrl: "https://taskiry.com",
    featured: true,
  },
  {
    name: "Isla Prima",
    description:
      "My own survival game in Unreal Engine 5 — a living prehistoric island where dinosaurs are animals with weight and presence, not skins with health bars. Grow from hatchling to apex.",
    image: "/projects/IslaPrima.png",
    category: "Products",
    tags: ["Unreal Engine 5", "C++", "Game Design"],
    liveUrl: "https://islaprima.com",
    featured: true,
  },
  {
    name: "Primal Heaven",
    description:
      "A dinosaur-survival community grown into thousands of real people who show up every day and pay to be there. Full web platform with economy, casino, events, and deep Discord tooling.",
    image: "/projects/PrimalHeaven.png",
    category: "Products",
    tags: ["Next.js", "tRPC", "PostgreSQL", "Discord"],
    liveUrl: "https://primalheaven.com",
    featured: true,
  },
  {
    name: "Primal Heaven Skin Creator",
    description: "Interactive skin creation tool for Primal Heaven's website, featuring real-time 3D preview and customization options",
    image: "/projects/PrimalHeavenProject.png",
    category: "Web",
    demoPath: "/projects/skinCreator",
    featured: true
  },
  {
    name: "Discord.py Toolkit",
    description: "A production-ready collection of Discord.py modules including a comprehensive ticket system and custom voice channel manager",
    image: "/projects/DiscordToolkit.png", 
    category: "Discord Bots",
    tags: ["Python", "Discord.py", "JSON", "Slash Commands"],
    github: "https://github.com/Icecode0/DiscordPy-Toolkit",
    featured: true
  },
  {
    name: "Flask Food Distribution API",
    description: "A RESTful API built with Flask and MySQL for managing customers, items, order guides, and orders. Originally designed for a distribution company.",
    image: "/projects/DistributionAPI.png",
    category: "Server Tools",
    tags: ["Python", "REST API", "MySQL", "Flask"],
    github: "https://github.com/Icecode0/flask-distribution-api",
    featured: true
  },
  {
    name: "Flutter Discord Ticket Dashboard",
    description: "Admin dashboard built with Flutter that syncs with a Flask API and Discord bot for real-time ticket management. View, filter, assign, and close tickets across servers with a clean, responsive UI.",
    image: "/projects/TicketFlutter.png",
    category: "Admin Dashboard",
    tags: ["Flutter", "Dart", "Flask", "Discord", "REST API", "MySQL", "Web"],
    github: "https://github.com/Icecode0/discord-ticket-management-flutter",
    featured: true
  },
  {
    name: "Ice's Portfolio",
    description: "My personal portfolio website showcasing my projects, skills, and experience as a full stack developer",
    image: "/projects/Portfolio.png",
    category: "Web",
    tags: ["Next.js", "Tailwind CSS", "React", "Web"],
    github: "https://github.com/Icecode0/Portfolio-Website",
  },
  {
    name: "DT Goldsmiths Website",
    description: "A static business website built as a project for DT Goldsmiths. The site provides company info and a contact form for customer inquiries. Although the project was left unfinished, it demonstrates layout, design, and frontend development skills.",
    image: "/projects/DTGoldsmiths.png",
    category: "Web",
    tags: ["HTML", "CSS", "JavaScript", "Static Site"],
    github: "https://github.com/Icecode0/dtgoldsmith-flutter-web",
    featured: false
  }


];

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filterProjects = (category: string) => {
    if (category === "All") return projects;
    
    return projects.filter(project => {
      // Handle special filtering logic
      if (category === "JavaScript") {
        return Array.isArray(project.tags) && project.tags.some(tag => 
          tag.toLowerCase().includes("javascript") || 
          tag.toLowerCase().includes(".js") ||
          tag.toLowerCase() === "js"
        );
      }
      if (category === "Python") {
        return Array.isArray(project.tags) && project.tags.some(tag => tag.toLowerCase().includes("python"));
      }
      if (category === "Flutter") {
        return Array.isArray(project.tags) && project.tags.some(tag => tag.toLowerCase().includes("flutter"));
      }
      if (category === "REST API") {
        return Array.isArray(project.tags) && project.tags.some(tag => tag.toLowerCase().includes("rest api"));
      }
      
      // Default category matching
      return project.category === category;
    });
  };

  const filteredProjects = filterProjects(selectedCategory);
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          A collection of my public work across various technologies and platforms.
          From web applications to game development and server tools.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button 
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-2 rounded-full font-medium transition-all ${
            selectedCategory === "All" 
              ? "bg-ice-blue text-gray-900" 
              : "bg-gray-800 text-gray-200 hover:bg-gray-700"
          }`}
        >
          All
        </button>
        {projectCategories.map((category) => (
          <button 
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === category 
                ? "bg-ice-blue text-gray-900" 
                : "bg-gray-800 text-gray-200 hover:bg-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, index) => (
          <div 
            key={index}
            className="bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-ice-blue/20 transition-all duration-300"
          >
            <div className="h-48 bg-gray-700 relative">
              <div className="absolute inset-0">
                {project.image ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={project.image}
                      alt={project.name}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 3}
                    />
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center opacity-0 fallback">
                      <span className="text-gray-400">Project Image</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Project Image</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{project.name}</h3>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">{project.category}</span>
              </div>
              <p className="text-gray-400 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {Array.isArray(project.tags) && project.tags.map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-gray-700 rounded-md text-xs">{tech}</span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                {project.github ? (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ice-blue hover:underline"
                  >
                    GitHub
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex gap-3">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-ice-blue text-gray-900 rounded-md font-medium hover:bg-ice-blue/90 transition-colors"
                    >
                      Visit Site
                    </a>
                  )}
                  {project.demoPath && (
                    <Link
                      href={project.demoPath}
                      className="px-4 py-2 bg-ice-blue text-gray-900 rounded-md hover:bg-ice-blue/90 transition-colors"
                    >
                      Try Demo
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}