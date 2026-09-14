export function Wordmark() {
  return (
    <div className="rise pointer-events-none select-none px-6 text-center">
      <h1
        className="font-display font-black uppercase leading-[0.86] tracking-[-0.04em] text-white drop-shadow-[0_6px_40px_rgba(0,0,0,0.6)]"
        style={{ fontSize: "clamp(3rem, 15vw, 10rem)" }}
      >
        Anirudh
      </h1>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.42em] text-white/55 sm:text-xs">
        Non-stop radio
      </p>
    </div>
  );
}
