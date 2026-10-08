import Image from "next/image";
import Link from "next/link";

// Real products, real screenshots — each window opens the thing it shows.
const windows = [
  { cls: "win-back", url: "taskiry.com", href: "https://taskiry.com", img: "/projects/shots/taskiry.webp", label: "Taskiry · public beta" },
  { cls: "win-mid", url: "icecode.dev/projects/skinCreator", href: "/projects/skinCreator", img: "/projects/shots/skincreator.webp", label: "3D skin creator · try it" },
  { cls: "win-front", url: "primalhosted.com", href: "https://primalhosted.com", img: "/projects/shots/primalhosted.webp", label: "Primal Hosted · live" },
];

export default function HeroShowcase() {
  return (
    <>
    <div className="showcase" aria-label="Things I've built">
      {windows.map((w, i) => {
        const inner = (
          <>
            <span className="win-bar" aria-hidden="true"><i /><i /><i /><em>{w.url}</em></span>
            <span className="win-shot">
              <Image src={w.img} alt={`${w.label} screenshot`} fill sizes="(max-width: 900px) 90vw, 40vw" priority={i === 2} />
            </span>
            <span className="win-label"><b />{w.label}</span>
          </>
        );
        return w.href.startsWith("/") ? (
          <Link key={w.cls} href={w.href} className={`win ${w.cls}`}>{inner}</Link>
        ) : (
          <a key={w.cls} href={w.href} className={`win ${w.cls}`} target="_blank" rel="noopener noreferrer">{inner}</a>
        );
      })}
    </div>
    <div className="showcase-stats" aria-label="Primal Hosted today">
      <div><b>35</b><span>communities</span></div>
      <div><b>42</b><span>servers served</span></div>
      <div><b>63K</b><span>players managed</span></div>
    </div>
    </>
  );
}
