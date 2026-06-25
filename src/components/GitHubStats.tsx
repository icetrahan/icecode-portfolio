import type { GitHubStats as Stats, GhDay } from "@/lib/githubStats";

// ice-blue intensity ramp for contribution levels 0–4
const LEVEL: Record<number, string> = {
  0: "#1b2330",
  1: "#0b3a4a",
  2: "#157892",
  3: "#2fb3d6",
  4: "#58e1ff",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmt(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function GitHubStats({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const days = stats.contributions ?? [];
  const weeks: GhDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  // Month abbreviation per week column — shown when the month changes.
  // Parsed straight off the YYYY-MM-DD string to avoid timezone drift.
  let lastMonth = -1;
  const monthLabels = weeks.map((week) => {
    const d = week.find((x) => x);
    const m = d ? parseInt(d.date.slice(5, 7), 10) : 0;
    if (m && m !== lastMonth) {
      lastMonth = m;
      return MONTHS[m - 1];
    }
    return "";
  });

  const metrics = [
    { label: "Lines", value: fmt(stats.totalLinesAdded) },
    { label: "Commits", value: fmt(stats.totalCommits) },
    { label: "Repos", value: fmt(stats.totalRepos) },
    { label: "Years", value: String(stats.yearsCoding) },
  ];

  return (
    <section className="w-full pt-2 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-black/30 dark:bg-gray-800/50 rounded-xl border border-gray-700 p-6 backdrop-blur-sm">
          <p className="mb-4 text-sm text-gray-400">
            <span className="text-ice-blue font-semibold">
              {stats.totalContributions?.toLocaleString() ?? "—"}
            </span>{" "}
            contributions in the last year
          </p>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Heatmap + month labels */}
            <div className="lg:flex-1 min-w-0">
              {days.length > 0 ? (
                <>
                  <div className="overflow-x-auto pb-1">
                    <div className="flex gap-[3px] min-w-max">
                      {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[3px]">
                          {week.map((d) => (
                            <div
                              key={d.date}
                              title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}`}
                              className="w-[11px] h-[11px] rounded-[2px]"
                              style={{ backgroundColor: LEVEL[d.level] ?? LEVEL[0] }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    {/* Month labels, aligned under their week columns */}
                    <div className="flex gap-[3px] min-w-max mt-1.5 h-3">
                      {monthLabels.map((m, i) => (
                        <div key={i} className="w-[11px] relative">
                          {m && (
                            <span className="absolute left-0 top-0 text-[10px] leading-none text-gray-500 whitespace-nowrap">
                              {m}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                    <span className="mr-1">Less</span>
                    {[0, 1, 2, 3, 4].map((l) => (
                      <span
                        key={l}
                        className="inline-block w-[11px] h-[11px] rounded-[2px]"
                        style={{ backgroundColor: LEVEL[l] }}
                      />
                    ))}
                    <span className="ml-1">More</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Contribution data unavailable.</p>
              )}
            </div>

            {/* Metrics — right on desktop, below on mobile */}
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-3 lg:w-48 shrink-0 self-start">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-gray-800/60 rounded-lg p-3 text-center"
                >
                  <div className="text-xl lg:text-2xl font-bold text-ice-blue tabular-nums leading-none">
                    {m.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-1">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language breakdown — bottom */}
          {stats.languages.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-700">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-3">
                Lines Written by Language
              </h3>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-700">
                {stats.languages.map((l) => (
                  <div
                    key={l.name}
                    style={{ width: `${l.percentage}%`, backgroundColor: l.color }}
                    title={`${l.name} — ${l.percentage}%`}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {stats.languages.map((l) => (
                  <div key={l.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-gray-200">{l.name}</span>
                    <span className="text-gray-500 text-xs">{l.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
