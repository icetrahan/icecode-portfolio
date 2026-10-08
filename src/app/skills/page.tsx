export default function SkillsPage() {
  // Skill categories with proficiency levels
  const skillCategories = [
    {
      title: "Languages",
      skills: [
        { name: "Python", level: "Advanced", years: "10+", details: "Backend systems, bots, APIs, automation" },
        { name: "Dart", level: "Advanced", details: "Flutter apps, cross-platform development" },
        { name: "JavaScript / TypeScript", level: "Advanced", details: "Next.js, Node.js, frontend apps, tooling" },
        { name: "SQL", level: "Advanced", details: "MySQL, MariaDB, PostgreSQL - schemas, optimization" },
        { name: "C#", level: "Intermediate", details: "Unity game dev, editor scripting" },
        { name: "Java", level: "Intermediate", details: "Android tooling, OOP foundations" },
        { name: "Kotlin", level: "Intermediate", details: "Mobile development alongside Flutter" },
        { name: "HTML5 / CSS3", level: "Advanced", details: "Responsive UI, semantic HTML, animations" },
        { name: "Bash / Shell", level: "Intermediate", details: "Linux automation, deployment scripting" }
      ]
    },
    {
      title: "Frameworks & Packages",
      skills: [
        { name: "Flask", level: "Advanced", details: "REST APIs, dashboards, integrations" },
        { name: "Next.js", level: "Advanced", details: "Server-side rendering, authentication, API routes" },
        { name: "Vue.js", level: "Intermediate", details: "Frontend components, state management" },
        { name: "React", level: "Intermediate", details: "Three Fiber, 3D skin viewer, UI rendering" },
        { name: "Discord.py & discord.js", level: "Advanced", details: "Multi-server bots, modular cog design" },
        { name: "Node.js / Express.js", level: "Intermediate", details: "API services, event systems" },
        { name: "Unity", level: "Intermediate", details: "Gameplay mechanics, animation controllers" },
        { name: "Unreal Engine", level: "Intermediate", details: "Game systems, multiplayer mechanics" },
        { name: "Flutter", level: "Advanced", details: "Cross-platform mobile/web apps, Firebase" }
      ]
    },
    {
      title: "Platforms & DevOps",
      skills: [
        { name: "Linux", level: "Advanced", details: "Ubuntu, CentOS, Debian - server hosting, optimization" },
        { name: "Docker", level: "Advanced", details: "Custom eggs, game server containers, pipelines" },
        { name: "Pterodactyl Panel", level: "Advanced", details: "Egg creation, multi-server management" },
        { name: "GitHub / GitLab", level: "Advanced", details: "CI/CD, version control, collaboration" },
        { name: "NGINX / Apache", level: "Intermediate", details: "Reverse proxies, hosting, SSL" },
        { name: "cPanel / WHM", level: "Intermediate", details: "Shared hosting, account management" },
        { name: "Firebase", level: "Advanced", details: "Auth, Firestore, Functions, hosting" },
        { name: "Cloud Platforms", level: "Intermediate", details: "Heroku, Vercel, Netlify" },
        { name: "Discord Platform", level: "Advanced", details: "Bots, webhooks, slash commands" }
      ]
    },
    {
      title: "Databases & Tools",
      skills: [
        { name: "MySQL / MariaDB", level: "Advanced", details: "Schema design, complex queries, stored procedures" },
        { name: "PostgreSQL", level: "Intermediate", details: "JSON queries, indexing, optimization" },
        { name: "MongoDB", level: "Intermediate", details: "Document storage, scaling" },
        { name: "Redis", level: "Intermediate", details: "Caching, pub/sub, queues" },
        { name: "REST APIs", level: "Advanced", details: "Designing, consuming, authentication" },
        { name: "Postman", level: "Advanced", details: "API testing, automated workflows" },
        { name: "Project Management", level: "Intermediate", details: "Trello, Jira, Scrum, agile workflows" },
        { name: "Data Analysis", level: "Advanced", details: "Excel, Google Sheets, automation scripts" }
      ]
    },
    {
      title: "Creative Tools",
      skills: [
        { name: "Blender", level: "Intermediate", details: "3D modeling, animation rigging, skin previews" },
        { name: "GIMP", level: "Advanced", details: "Graphic/UI design, skin editing, textures" },
        { name: "Adobe Suite", level: "Intermediate", details: "Photoshop, Illustrator - branding, UI/UX" },
        { name: "UI/UX Design", level: "Intermediate", details: "Wireframes, layouts, user flows" },
        { name: "Audio Production", level: "Intermediate", details: "FL Studio, sound effects, mixing" }
      ]
    }
  ];

  // Core competencies section
  const superpowers = [
    "Full-stack web and application development",
    "Game server infrastructure and management",
    "Bot development and automation systems",
    "Cross-platform mobile app development",
    "3D graphics and animation pipelines",
    "Database design and optimization",
    "UI/UX design and implementation",
    "DevOps and deployment automation"
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold">Skills & Expertise</h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          A comprehensive overview of my technical skills, tools, and platforms I'm proficient with.
        </p>
      </div>

      {/* Main Skills Grid */}
      <div className="grid grid-cols-1 gap-8 mb-16">
        {skillCategories.map((category) => (
          <div 
            key={category.title} 
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-ice-blue transition-all duration-300"
          >
            <h2 className="text-2xl font-bold mb-6 text-ice-blue">{category.title}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {category.skills.map((skill) => (
                <div key={skill.name} className="bg-gray-700/50 p-4 rounded-lg hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
                        <span className="text-ice-blue font-bold">{skill.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{skill.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          skill.level === 'Advanced' 
                            ? 'bg-ice-blue/20 text-ice-blue' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {skill.level}
                          {skill.years ? ` · ${skill.years} years` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{skill.details}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Core Competencies Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-ice-blue">Core Competencies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {superpowers.map((power) => (
            <div 
              key={power} 
              className="bg-gray-800 bg-opacity-50 p-4 rounded-lg flex items-center gap-3 hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-3 h-3 rounded-full bg-ice-blue"></div>
              <span className="text-sm">{power}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Overview */}
      <div className="mt-20">
        <h3 className="text-2xl font-bold mb-8 text-center text-ice-blue">Experience Overview</h3>
        <div className="max-w-4xl mx-auto bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Advanced Skills</span>
                <span className="text-xs text-gray-400">8-10+ years</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-ice-blue" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Intermediate Skills</span>
                <span className="text-xs text-gray-400">4-7 years</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-ice-blue/70" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}