/** The viewBox removes transparent sky, without stretching the mountain pixels. */
export default function HeroLandscape() {
  return (
    <svg className="hero-landscape" viewBox="0 400 1672 541" aria-hidden="true">
      <image href="/mountains.png" width="1672" height="941" />
    </svg>
  );
}
