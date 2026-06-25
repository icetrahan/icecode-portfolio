import Image from "next/image";
import Link from "next/link";

const flagships = [
  {
    name: "Primal Heaven",
    label: "Gaming Community",
    description:
      "A dinosaur-survival community that grew into thousands of real people who show up every day and pay to be there.",
  },
  {
    name: "Isla Prima",
    label: "UE5 Survival Game",
    description:
      "My own survival game in Unreal Engine 5, where dinosaurs are animals with weight and presence, not skins with health bars.",
  },
  {
    name: "Taskiry",
    label: "Planning Tool",
    description:
      "A planning tool I'm building because every other one treats your thinking like an afterthought, and I was tired of losing the “why” behind the work.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold">About Me</h1>
          <div className="w-24 h-1 bg-ice-blue mx-auto mt-4"></div>
        </div>

        {/* Intro — headshot + the hook */}
        <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
          <div className="w-full md:w-1/3">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800 border-2 border-ice-blue">
              <Image
                src="/HeadShot.jpg"
                alt="Ice's Profile Picture"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <h2 className="text-3xl font-bold mb-4">
              I go by <span className="text-ice-blue">Ice.</span>
            </h2>
            <p className="text-gray-300 mb-4">
              And the first thing you should know &mdash; I&apos;m more than a coder.
            </p>
            <p className="text-gray-300">
              Don&apos;t get me wrong, I push code every day and I&apos;m good at it. But anybody with an
              AI and a free afternoon can write code now. The code isn&apos;t the hard part anymore
              &mdash; knowing <span className="text-ice-blue font-semibold">what</span> to build, and{" "}
              <span className="text-ice-blue font-semibold">why</span>, is. That&apos;s the part you
              actually want me for.
            </p>
          </div>
        </div>

        {/* Origin */}
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 mb-16">
          <p className="text-gray-300">
            I came up the hard way. Long shifts, sun on my neck, building someone else&apos;s dream
            until I got tired of waiting and started building my own. No degree, no bootcamp, nobody
            handing me anything &mdash; just a stubborn refusal to leave things half-done and a head
            that won&apos;t stop dreaming up what could exist.
          </p>
        </div>

        {/* Flagships */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2 text-center">So I built it. All of it.</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Three things. Three different worlds. All mine. All built because I saw a version that
            didn&apos;t exist yet and couldn&apos;t let it go.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {flagships.map((p) => (
              <div
                key={p.name}
                className="bg-gray-800 rounded-xl border border-gray-700 border-t-2 border-t-ice-blue p-6 hover:border-ice-blue hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-xs uppercase tracking-wide text-ice-blue/80">{p.label}</span>
                <h3 className="text-xl font-bold mt-1 mb-3">{p.name}</h3>
                <p className="text-gray-400 text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Close */}
        <div className="border-l-4 border-ice-blue pl-6 mb-16">
          <p className="text-gray-300 mb-4">
            That&apos;s what you&apos;re really hiring. A builder who dreams, then ships. I crawl
            inside your product, figure out what your users actually feel, and build the thing you
            meant to build &mdash; then show you where it goes next.
          </p>
          <p className="text-gray-100 font-semibold">
            I&apos;ll treat your dream like it&apos;s one of mine.
          </p>
        </div>

        {/* Tagline + CTA */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-8">
            Dev by trade. Dreamer by nature. Built from nothing.
          </h2>
          <Link
            href="/contact"
            className="px-8 py-3 bg-ice-blue text-gray-900 rounded-lg font-bold hover:bg-ice-blue/80 transition-all duration-300"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
