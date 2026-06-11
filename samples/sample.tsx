import { useEffect, useMemo, useState } from "react";

type Console = "xbox" | "xbox-360" | "xbox-one" | "xbox-series-x";

interface ConsoleCardProps {
  readonly name: string;
  readonly generation: Console;
  readonly year: number;
  readonly highlighted?: boolean;
  onSelect?(generation: Console): void;
}

const COLORS: Record<Console, string> = {
  "xbox":          "#107c10",
  "xbox-360":      "#9bf00b",
  "xbox-one":      "#52b043",
  "xbox-series-x": "#7fc83a",
};

export function ConsoleCard({ name, generation, year, highlighted = false, onSelect }: ConsoleCardProps) {
  const [count, setCount] = useState(0);
  const accent = useMemo(() => COLORS[generation], [generation]);

  useEffect(() => {
    document.title = `${name} • ${count} clicks`;
    return () => { document.title = "Xbox Console Gallery"; };
  }, [name, count]);

  return (
    <article
      className={`console-card ${highlighted ? "is-active" : ""}`}
      style={{ borderColor: accent }}
      onClick={() => { setCount(c => c + 1); onSelect?.(generation); }}
    >
      <h2>{name}</h2>
      <p>Released <time dateTime={`${year}-01-01`}>{year}</time></p>
      {count > 0 && <span className="badge">Selected ×{count}</span>}
    </article>
  );
}

export default function Gallery() {
  return (
    <section className="gallery">
      <ConsoleCard name="Xbox 360"     generation="xbox-360"      year={2005} />
      <ConsoleCard name="Xbox One"     generation="xbox-one"      year={2013} highlighted />
      <ConsoleCard name="Xbox Series X" generation="xbox-series-x" year={2020} />
    </section>
  );
}
