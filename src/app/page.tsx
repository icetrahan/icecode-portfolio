import Image from "next/image";
import Link from "next/link";
import { CategoryIcon, ActivityStrip } from "@/components/PortfolioDetails";
import HeroLandscape from "@/components/HeroLandscape";
import HeroPortrait from "@/components/HeroPortrait";
import { getGitHubStats } from "@/lib/githubStats";

const projects = [
  { title: "Primal Heaven / Primal Hosted", eyebrow: "Community platform", description: "A dinosaur-survival community grown into a full web platform, economy, and Discord operating system.", image: "/projects/primal-cover-v2.png", tags: ["Web platform", "Discord bots", "PostgreSQL"], href: "https://primalheaven.com" },
  { title: "Isla Prima", eyebrow: "Game world", description: "An Unreal Engine 5 survival game where dinosaurs have weight, presence, and a reason to exist.", image: "/projects/isla-cover-v2.png", tags: ["Unreal Engine 5", "C++", "Game design"], href: "https://islaprima.com" },
  { title: "Taskiry", eyebrow: "Product thinking", description: "A planning tool that keeps the why behind the work through boards, sprints, whiteboards, and AI import.", image: "/projects/Taskiry.png", tags: ["Next.js", "TypeScript", "tRPC"], href: "https://taskiry.com" },
];

export default async function Home() {
  const stats = await getGitHubStats();
  return <div className="portfolio-shell">
    <section className="hero-wrap"><div className="hero-copy"><p className="eyebrow hero-role">&lt;Developer/&gt;</p><h1>Dev by trade.<br /><span>Dreamer by nature.</span></h1><p className="hero-motto">Built from nothing.</p><p className="hero-sub">I build systems behind communities, games, and products that bring people together.</p><div className="hero-actions"><Link className="button button-primary" href="#work">See the work <span>→</span></Link><Link className="button button-ghost" href="mailto:trahantech@gmail.com">Start a conversation <span>→</span></Link></div><div id="skills" className="discipline-row"><span><CategoryIcon kind={0} />Games</span><span><CategoryIcon kind={1} />Communities</span><span><CategoryIcon kind={2} />Products</span><span><CategoryIcon kind={3} />Infrastructure</span></div></div><div className="hero-art"><HeroLandscape /><Image src="/planet.png" alt="" width={112} height={112} className="layer-planet" priority /><HeroPortrait /><Image src="/crystal.png" alt="" width={86} height={150} className="layer-crystal" priority /><div className="art-label art-label-right">GAMES<br />COMMUNITIES<br />PRODUCTS<br />INFRASTRUCTURE</div><div className="art-label art-label-bottom">SELF-TAUGHT / ALWAYS BUILDING</div><div className="hero-signature">ice<span>.code</span><small>real projects. real impact.</small></div></div></section>
    <section id="work" className="work-section"><div className="section-heading"><div><h2>Featured Projects</h2></div><span className="section-note">REAL PROJECTS. REAL IMPACT.</span></div><div className="project-grid">{projects.map((project) => <article className="project-card" key={project.title}><div className="project-image"><Image src={project.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" /></div><div className="project-body"><p className="card-eyebrow">{project.eyebrow}</p><h3>{project.title}</h3><p>{project.description}</p><div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><a href={project.href} target="_blank" rel="noreferrer"><span aria-hidden="true">→</span><span className="sr-only">Explore {project.title}</span></a></div></article>)}</div></section>
    <ActivityStrip stats={stats} /><section id="about" className="closing-line"><p className="eyebrow">Developer · builder · operator</p><h2>Built from curiosity. Made for people.</h2><p className="about-copy">From community platforms and Discord tooling to game worlds and productivity software, I turn ideas into systems people can use.</p><p id="contact">Good ideas deserve a system that can carry them.</p><Link className="button button-primary" href="mailto:trahantech@gmail.com">Let&apos;s build something <span>→</span></Link></section>
  </div>;
}


