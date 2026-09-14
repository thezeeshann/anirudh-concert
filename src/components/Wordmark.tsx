export function Wordmark() {
  return (
    <h1
      // Tamil sets wider than Latin, so the ceiling is lower than it would be
      // for an English wordmark of the same weight.
      className="rise pointer-events-none select-none px-6 text-center font-tamil font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-[0_6px_40px_rgba(0,0,0,0.7)]"
      style={{ fontSize: "clamp(2.25rem, 9vw, 6.5rem)" }}
      lang="ta"
    >
      அனிருத் கச்சேரி
    </h1>
  );
}
