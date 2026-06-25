import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroCharacter from "@/components/HeroCharacter";
import GitHubStats from "@/components/GitHubStats";
import DiscordCopy from "@/components/DiscordCopy";
import { getGitHubStats } from "@/lib/githubStats";

const languages = [
  { name: "Python", icon: "PythonLogo.png" },
  { name: "C++", icon: "CppLogo.svg" },
  { name: "C", icon: "CLogo.svg" },
  { name: "C#", icon: "CsLogo.png" },
  { name: "TypeScript", icon: "TSLogo.png" },
  { name: "JavaScript", icon: "JsLogo.png" },
  { name: "Dart", icon: "DartLogo.png" },
  { name: "Java", icon: "JavaLogo.svg" },
  { name: "Kotlin", icon: "KotlinLogo.svg" },
  { name: "SQL", icon: "SQLLogo.png" },
  { name: "HTML5", icon: "HTML5Logo.svg" },
  { name: "CSS3", icon: "CSS3Logo.svg" },
  { name: "Bash", icon: "BashLogo.png" },
  { name: "Markdown", icon: "MarkdownLogo.png" },
];

const frameworks = [
  { name: "Next.js", icon: "NextJSLogo.png" },
  { name: "React", icon: "ReactLogo.png" },
  { name: "Vue.js", icon: "VueJSLogo.png" },
  { name: "Three.js", icon: "ThreeJSLogo.svg" },
  { name: "Node.js", icon: "NodeJSLogo.png" },
  { name: "Express.js", icon: "ExpressLogo.png" },
  { name: "tRPC", icon: "tRPCLogo.svg" },
  { name: "Prisma", icon: "PrismaLogo.svg" },
  { name: "TailwindCSS", icon: "TailwindCSSLogo.png" },
  { name: "Django", icon: "DjangoLogo.png" },
  { name: "Flask", icon: "FlaskLogo.png" },
  { name: "FastAPI", icon: "FastAPILogo.png" },
  { name: "Flutter", icon: "FlutterLogo.png" },
  { name: "Discord.py", icon: "DiscordLogo.png" },
  { name: "Pandas", icon: "PandasLogo.png" },
  { name: "NumPy", icon: "NumPyLogo.png" },
  { name: "Unity", icon: "UnityLogo.png" },
  { name: "Unreal Engine", icon: "UnrealLogo.svg" },
];

const devops = [
  { name: "Docker", icon: "DockerLogo.png" },
  { name: "Linux/PT", icon: "LinuxPTLogo.png" },
  { name: "Pterodactyl", icon: "PterodactylLogo.png" },
  { name: "NGINX", icon: "NGINXLogo.png" },
  { name: "Apache", icon: "ApacheLogo.png" },
  { name: "Cloudflare", icon: "CloudflareLogo.svg" },
  { name: "Vercel", icon: "VercelLogo.svg" },
  { name: "Netlify", icon: "NetlifyLogo.svg" },
  { name: "Heroku", icon: "HerokuLogo.svg" },
  { name: "GitHub", icon: "GitHubLogo.png" },
  { name: "GitLab", icon: "GitLabLogo.png" },
  { name: "Firebase CLI", icon: "FirebaseCLILogo.png" },
  { name: "Postman", icon: "PostmanLogo.png" },
  { name: "cPanel", icon: "cPanelLogo.png" },
  { name: "VS Code", icon: "VSCodeLogo.png" },
];

const creativeTools = [
  { name: "GIMP", icon: "GimpLogo.png" },
  { name: "Photoshop", icon: "PhotoshopLogo.svg" },
  { name: "Illustrator", icon: "IllustratorLogo.svg" },
  { name: "Figma", icon: "FigmaLogo.svg" },
  { name: "Blender", icon: "BlenderLogo.png" },
  { name: "Spriter", icon: "SpriterLogo.png" },
  { name: "UI/UX", icon: "UiUxLogo.png" },
  { name: "Graphics", icon: "GraphicDesignLogo.png" },
];

const musicProduction = [
  { name: "FL Studio", icon: "FLLogo.png" },
  { name: "Melodyne", icon: "MelodyneLogo.png" },
  { name: "Sound Design", icon: null },
  { name: "Composition", icon: null },
];

const organization = [
  { name: "Trello", icon: "TrelloLogo.png" },
  { name: "Jira", icon: "JiraLogo.png" },
  { name: "Notion", icon: "NotionLogo.svg" },
  { name: "Figma", icon: "FigmaLogo.svg" },
];

const featuredProjects = [
  {
    title: "Taskiry",
    description:
      "A planning tool that keeps the \"why\" behind your work — real-time boards, sprints, whiteboards, and AI task import.",
    image: "/projects/Taskiry.png",
    tags: ["Next.js", "TypeScript", "tRPC", "Cloudflare D1"],
    link: "https://taskiry.com",
  },
  {
    title: "Isla Prima",
    description:
      "My own Unreal Engine 5 survival game where dinosaurs are animals with weight and presence, not skins with health bars.",
    image: "/projects/IslaPrima.png",
    tags: ["Unreal Engine 5", "C++", "Game Design"],
    link: "https://islaprima.com",
  },
  {
    title: "Primal Heaven",
    description:
      "A dinosaur-survival community grown to thousands of paying daily members — full web platform, economy, and Discord tooling.",
    image: "/projects/PrimalHeaven.png",
    tags: ["Next.js", "tRPC", "PostgreSQL", "Discord"],
    link: "https://primalheaven.com",
  },
];

function PlaceholderIcon({ name }: { name: string }) {
  return (
    <div className="w-4 h-4 flex items-center justify-center bg-white rounded-sm text-black text-[8px] font-bold">
      {name.charAt(0)}
    </div>
  );
}

function TechGrid({
  items,
  cols = 2,
}: {
  items: { name: string; icon: string | null }[];
  cols?: 2 | 3;
}) {
  return (
    <ul
      className={`grid ${cols === 3 ? "grid-cols-3" : "grid-cols-2"} gap-x-3 gap-y-2`}
    >
      {items.map((tech) => (
        <li key={tech.name} className="flex items-center gap-1.5 min-w-0">
          {tech.icon ? (
            <Image
              src={`/icons/${tech.icon}`}
              alt={tech.name}
              width={20}
              height={20}
              className="shrink-0"
            />
          ) : (
            <PlaceholderIcon name={tech.name} />
          )}
          <span className="text-foreground text-sm leading-tight">{tech.name}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-ice-blue mb-4 border-b border-gray-700 pb-2">
      {children}
    </h2>
  );
}

export default async function Home() {
  const stats = await getGitHubStats();

  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <section className="py-8 flex flex-col items-center px-4">
        <div className="flex flex-col md:flex-row items-start justify-center w-full gap-8 px-[8%] py-8">
          {/* Left Stack - Developer */}
          <div className="w-full md:w-1/3 space-y-6 pt-4">
            <div className="text-center mb-6">
              <h1 className="text-5xl font-bold text-white font-mono border-b-2 border-ice-blue pb-2 inline-block transform hover:scale-105 transition-transform">
                &lt;Developer/&gt;
              </h1>
            </div>

            <div>
              <SectionHead>Languages</SectionHead>
              <TechGrid items={languages} cols={3} />
            </div>
            <div>
              <SectionHead>Frameworks</SectionHead>
              <TechGrid items={frameworks} cols={3} />
            </div>
            <div>
              <SectionHead>DevOps &amp; Tools</SectionHead>
              <TechGrid items={devops} cols={3} />
            </div>
          </div>

          {/* Center - Character */}
          <HeroCharacter />

          {/* Right Stack - Creative */}
          <div className="w-full md:w-1/3 space-y-6 pt-4">
            <div className="text-center mb-6">
              <h1
                className="text-5xl font-bold text-white border-b-2 border-ice-blue pb-2 inline-block transform hover:scale-105 transition-transform"
                style={{ fontFamily: "var(--font-dancing), cursive" }}
              >
                Creative
              </h1>
            </div>

            <div>
              <SectionHead>Creative Tools</SectionHead>
              <TechGrid items={creativeTools} />
            </div>
            <div>
              <SectionHead>Music Production</SectionHead>
              <TechGrid items={musicProduction} />
            </div>
            <div>
              <SectionHead>Organization</SectionHead>
              <TechGrid items={organization} />
            </div>

          </div>
        </div>

        {/* Live GitHub contribution activity + metrics + language breakdown */}
        <GitHubStats stats={stats} />

        {/* Tagline */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Dev by trade. <span className="text-ice-blue">Dreamer by nature.</span>
          </h2>
          <p className="text-gray-400 mt-2 text-lg">Built from nothing.</p>

          {/* Social Links */}
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="https://github.com/icetrahan"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-black/50 dark:bg-gray-800/70 flex items-center justify-center border border-gray-700 hover:border-ice-blue hover:bg-gray-700/50 transition-all duration-300 shadow-md"
            >
              <span className="sr-only">GitHub</span>
              <Image src="/icons/GitHubLogo.png" alt="GitHub" width={24} height={24} />
            </a>
            <DiscordCopy variant="icon" />
          </div>
        </div>
      </section>

      {/* Projects preview section */}
      <section className="py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">Featured Projects</h2>
          <div className="w-24 h-1 bg-ice-blue mx-auto mt-4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          {featuredProjects.map((project) => (
            <div
              key={project.title}
              className="bg-black/30 dark:bg-gray-800/50 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-ice hover:scale-105 transition-all duration-300 border border-gray-700 hover:border-ice-blue backdrop-blur-sm"
            >
              <div className="h-48 bg-gray-700/50 relative">
                <Image
                  src={project.image}
                  alt={project.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-foreground">{project.title}</h3>
                <p className="text-gray-400 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-700/70 rounded-md text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <Link
                  href={project.link}
                  target={project.link.startsWith("http") ? "_blank" : undefined}
                  rel={project.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-ice-blue hover:underline flex items-center gap-1"
                >
                  <span>Visit site</span>
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/projects"
            className="px-6 py-3 bg-ice-blue text-gray-900 rounded-lg font-bold hover:bg-ice-blue/80 transition-all duration-300 shadow-lg hover:shadow-ice"
          >
            View All Projects
          </Link>
        </div>
      </section>
    </div>
  );
}
