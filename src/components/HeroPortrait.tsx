type OrbitProps = { front: boolean; secondary?: boolean };

function Orbit({ front, secondary = false }: OrbitProps) {
  const rx = secondary ? 280 : 315;
  const ry = secondary ? 190 : 125;
  const left = 365 - rx;
  const right = 365 + rx;
  const path = `M ${left} 310 A ${rx} ${ry} 0 0 1 ${right} 310 A ${rx} ${ry} 0 0 1 ${left} 310`;
  return (
    <g transform={`rotate(${secondary ? 26 : -14} 365 310)`}>
      <g clipPath={`url(#orbit-${front ? "front" : "rear"})`}>
        <path d={path} fill="none" stroke={secondary ? "#76aaff" : "#65dfff"} strokeWidth={secondary ? .9 : 1.3} opacity={front ? (secondary ? .45 : .8) : .35} />
        {[0, 1].map((index) => (
          <g className="orbit-traveler" key={index}>
            <circle r={secondary ? 9 : 11} fill={secondary ? "#689fff" : "#55dcff"} opacity=".12" />
            <circle r={secondary ? 3 : 4} fill={secondary ? "#a3c5ff" : "#65e5ff"} />
            <circle r="1.3" fill="#ecfcff" />
            <animateMotion path={path} dur={secondary ? "32s" : "24s"} begin={`${index * (secondary ? -16 : -12)}s`} repeatCount="indefinite" calcMode="paced" />
          </g>
        ))}
      </g>
    </g>
  );
}
export default function HeroPortrait() {
  return (
    <svg className="portrait-scene" viewBox="0 0 700 600" role="img" aria-label="Cybernetic portrait with two animated orbits passing behind the head and in front of the shoulders">
      <defs><clipPath id="orbit-rear"><rect x="0" y="0" width="720" height="310" /></clipPath><clipPath id="orbit-front"><rect x="0" y="310" width="720" height="310" /></clipPath>
        {/* Restore the opaque interior lost by the old black-key cutout. */}
        <clipPath id="portrait-interior" clipPathUnits="objectBoundingBox">
          <path d="M .03 .94 L .15 .82 Q .13 .73 .22 .55 Q .17 .35 .28 .19 Q .35 .04 .52 .05 Q .64 .04 .72 .15 Q .86 .30 .90 .55 L .94 .81 L .97 .87 L .92 .91 L 1 1 L 0 1 Z" />
        </clipPath>
        <linearGradient id="portrait-bottom" x2="0" y2="1">
          <stop offset="0.86" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id="portrait-fade"><rect width="700" height="600" fill="url(#portrait-bottom)" /></mask>
      </defs>
      <Orbit front={false} /><Orbit front={false} secondary />
      <g className="orbit-labels" fill="#a4eeff" fontSize="10" letterSpacing="2">
        <text x="46" y="278">IDEAS</text>
        <text x="610" y="220">LEARN</text>
      </g>
      <g mask="url(#portrait-fade)">
        <image href="/hero-cyber-original.png" x="40" y="0" width="600" height="600" clipPath="url(#portrait-interior)" />
        <image href="/hero-cyber-cutout.png" x="40" y="0" width="600" height="600" />
      </g>
      <Orbit front /><Orbit front secondary />
      <g className="orbit-labels" fill="#a4eeff" fontSize="10" letterSpacing="2">
        <text x="57" y="427">BUILD</text>
        <text x="605" y="397">DEPLOY</text>
      </g>
    </svg>
  );
}

