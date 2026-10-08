// One list for the homepage and /projects. Every card opens `href`:
// an external site/repo in a new tab, or an on-site demo.
export type Project = {
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  href: string;
  linkLabel: string;
  category: "Products" | "Games" | "Web" | "Infrastructure" | "Server Tools" | "Discord Bots" | "Flutter";
  tags: string[];
  featured?: boolean;
};

export const projects: Project[] = [
  {
    name: "Primal Hosted",
    eyebrow: "Hosting platform · founder",
    description:
      "Managed The Isle server hosting I founded and run. One checkout gets a community a server, in-game mod commands, a white-label Discord bot, a website and proximity voice. 35 communities, 42 servers served.",
    image: "/projects/shots/primalhosted.webp",
    href: "https://primalhosted.com",
    linkLabel: "primalhosted.com",
    category: "Products",
    tags: ["Cloudflare Workers", "PostgreSQL", "Stripe", "C++ mods", "LiveKit"],
    featured: true,
  },
  {
    name: "Primal Heaven",
    eyebrow: "Community platform",
    description:
      "My own dinosaur-survival community and the platform behind it: points economy, events, leaderboards, a skin shop, tickets and deep Discord tooling.",
    image: "/projects/shots/primalheaven.webp",
    href: "https://primalheaven.com",
    linkLabel: "primalheaven.com",
    category: "Products",
    tags: ["Next.js", "tRPC", "PostgreSQL", "Discord"],
    featured: true,
  },
  {
    name: "Taskiry",
    eyebrow: "Product · public beta",
    description:
      "Tasks, sprints, infinite whiteboards and real-time docs in one app, with a built-in MCP server so AI agents can plan alongside your team.",
    image: "/projects/shots/taskiry.webp",
    href: "https://taskiry.com",
    linkLabel: "taskiry.com",
    category: "Products",
    tags: ["Electron", "Cloudflare Workers", "tRPC", "Durable Objects"],
    featured: true,
  },
  {
    name: "Isla Prima",
    eyebrow: "Game · in development",
    description:
      "My Unreal Engine 5 survival game: grow from hatchling to apex on a living prehistoric island, where dinosaurs are animals with weight, not skins with health bars.",
    image: "/projects/shots/islaprima.webp",
    href: "https://islaprima.com",
    linkLabel: "islaprima.com",
    category: "Games",
    tags: ["Unreal Engine 5", "Blueprint", "Game design"],
    featured: true,
  },
  {
    name: "Dinosaur Skin Creator",
    eyebrow: "3D web demo",
    description:
      "Real-time React Three Fiber skin editor from Primal Heaven: colour zones, patterns and scenes on six dinosaurs. Runs right here in your browser.",
    image: "/projects/shots/skincreator.webp",
    href: "/projects/skinCreator",
    linkLabel: "Try the demo",
    category: "Web",
    tags: ["React Three Fiber", "Three.js", "Next.js"],
    featured: true,
  },
  {
    name: "CleatSheetz",
    eyebrow: "Data product",
    description:
      "Fantasy-football analytics: paste a Sleeper username and get power rankings, playoff odds from thousands of simulations and the trades that fix your roster.",
    image: "/projects/shots/cleatsheetz.webp",
    href: "https://cleatsheetz.com",
    linkLabel: "cleatsheetz.com",
    category: "Products",
    tags: ["Python", "Monte Carlo", "Cloudflare D1", "Hono"],
    featured: true,
  },
  {
    name: "feathers",
    eyebrow: "Open source · Go",
    description:
      "A Windows-native port of Pterodactyl Wings that runs game servers as native processes instead of Docker containers. I'm its top contributor: network stats, service recovery, resource accounting, security fixes.",
    image: "/projects/shots/feathers.webp",
    href: "https://github.com/icetrahan/feathers",
    linkLabel: "View on GitHub",
    category: "Infrastructure",
    tags: ["Go", "Windows", "Pterodactyl"],
  },
  {
    name: "PTEggos",
    eyebrow: "Open source · game servers",
    description:
      "Pterodactyl eggs for The Isle and other games, with CI that builds and publishes their container images to GHCR on every push.",
    image: "/projects/shots/pteggos.webp",
    href: "https://github.com/icetrahan/PTEggos",
    linkLabel: "View on GitHub",
    category: "Infrastructure",
    tags: ["Docker", "GitHub Actions", "Bash", "PowerShell"],
  },
  {
    name: "Discord.py Toolkit",
    eyebrow: "Discord bots",
    description:
      "Production-ready Discord.py modules, including a full ticket system and a custom voice-channel manager.",
    image: "/projects/DiscordToolkit.png",
    href: "https://github.com/Icecode0/DiscordPy-Toolkit",
    linkLabel: "View on GitHub",
    category: "Discord Bots",
    tags: ["Python", "Discord.py", "Slash commands"],
  },
  {
    name: "Flutter Ticket Dashboard",
    eyebrow: "Admin dashboard",
    description:
      "Flutter admin dashboard synced with a Flask API and Discord bot: view, filter, assign and close support tickets across servers in real time.",
    image: "/projects/TicketFlutter.png",
    href: "https://github.com/Icecode0/discord-ticket-management-flutter",
    linkLabel: "View on GitHub",
    category: "Flutter",
    tags: ["Flutter", "Dart", "Flask", "MySQL"],
  },
  {
    name: "Flask Distribution API",
    eyebrow: "REST API",
    description:
      "RESTful API in Flask and MySQL for customers, items, order guides and orders, built for a food-distribution company.",
    image: "/projects/DistributionAPI.png",
    href: "https://github.com/Icecode0/flask-distribution-api",
    linkLabel: "View on GitHub",
    category: "Server Tools",
    tags: ["Python", "Flask", "MySQL", "REST API"],
  },
  {
    name: "DT Goldsmiths",
    eyebrow: "Client website",
    description: "Business website for a jewelry studio: company info, services and a customer contact form.",
    image: "/projects/DTGoldsmiths.png",
    href: "https://github.com/Icecode0/dtgoldsmith-flutter-web",
    linkLabel: "View on GitHub",
    category: "Web",
    tags: ["HTML", "CSS", "JavaScript"],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const isExternal = (href: string) => /^https?:\/\//.test(href);
