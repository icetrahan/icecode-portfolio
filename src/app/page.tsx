import Link from "next/link";
import { CategoryIcon, ActivityStrip } from "@/components/PortfolioDetails";
import HeroShowcase from "@/components/HeroShowcase";
import ProjectCard from "@/components/ProjectCard";
import { ContactButton } from "@/components/ContactModal";
import { featuredProjects } from "@/data/projects";
import { socials } from "@/data/socials";
import { getGitHubStats } from "@/lib/githubStats";

export default async function Home() {
  const stats = await getGitHubStats();
  return <div className="portfolio-shell">
    <section className="hero-wrap">
      <div className="hero-copy">
        <p className="eyebrow hero-role">&lt;Developer/&gt;</p>
        <h1>Dev by trade.<br /><span>Dreamer by nature.</span></h1>
        <p className="hero-motto">Built from nothing.</p>
        <p className="hero-sub">I build the systems behind communities, games and products, then keep them running. Right now that&apos;s <a href="https://primalhosted.com" target="_blank" rel="noopener noreferrer">Primal Hosted</a>, a game-server hosting platform serving 35 communities.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="#work">See the work <span>→</span></Link>
          <ContactButton className="button button-ghost">Let&apos;s build something <span>→</span></ContactButton>
        </div>
        <div className="hero-socials">
          <a href={socials.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href={socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          <Link href="/about">About me →</Link>
        </div>
        <div id="skills" className="discipline-row"><span><CategoryIcon kind={0} />Games</span><span><CategoryIcon kind={1} />Communities</span><span><CategoryIcon kind={2} />Products</span><span><CategoryIcon kind={3} />Infrastructure</span></div>
      </div>
      <div className="hero-art"><HeroShowcase /></div>
    </section>
    <section id="work" className="work-section">
      <div className="section-heading"><div><h2>Featured Projects</h2></div><Link className="section-note" href="/projects">ALL PROJECTS →</Link></div>
      <div className="project-grid">{featuredProjects.map((project, i) => <ProjectCard key={project.name} project={project} priority={i < 3} />)}</div>
    </section>
    <ActivityStrip stats={stats} />
    <section id="about" className="closing-line">
      <p className="eyebrow">Developer · builder · operator</p>
      <h2>Built from curiosity. Made for people.</h2>
      <p className="about-copy">From game-server hosting and Discord tooling to game worlds and productivity software, I turn ideas into systems people use, and I stay on call for them.</p>
      <p id="contact">Good ideas deserve a system that can carry them.</p>
      <div className="closing-actions">
        <ContactButton className="button button-primary">Let&apos;s build something <span>→</span></ContactButton>
        <a className="button button-ghost" href={socials.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn <span>↗</span></a>
      </div>
    </section>
  </div>;
}
