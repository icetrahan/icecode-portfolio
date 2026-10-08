import type { GitHubStats } from "@/lib/githubStats";

export function CategoryIcon({ kind }: { kind: number }) {
  const paths = [
    "M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3C2 17 4 7 7 7Zm0 3v4m-2-2h4m7-1h.01m2 2h.01",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-2a6 6 0 0 1 12 0v2H2Zm15-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 4 5v1h-5",
    "m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5m-9 5v10M7 5l10 5",
    "m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  ];
  return <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export function ActivityStrip({ stats }: { stats: GitHubStats | null }) {
  const compact = (value: number | null | undefined) => value == null ? "—" : Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return <section className="activity-strip" aria-label="GitHub activity">
    <p className="activity-intro"><i />Building bots, games, and infrastructure — one commit at a time.</p>
    <a className="activity-calendar" href="https://github.com/icetrahan" target="_blank" rel="noreferrer">
      <span><b>{stats?.totalContributions?.toLocaleString() ?? "GitHub"}</b> contributions in the last year <span aria-hidden="true">↗</span></span>
      <div className="contribution-grid" aria-hidden="true">{stats?.contributions.slice(-182).map(day => <i key={day.date} data-level={day.level} title={`${day.date}: ${day.count} contributions`} />)}</div>
    </a>
    <div className="activity-metrics">{[[compact(stats?.totalLinesAdded), "lines"], [compact(stats?.totalCommits), "commits"], [compact(stats?.totalRepos), "repos"], [stats?.yearsCoding ?? "—", "years"]].map(([value,label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
  </section>;
}
