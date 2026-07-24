import Link from "next/link";

const popularSearches = [
  "welding arm",
  "robot controller",
  "gripper",
  "servo motor",
  "safety sensor",
];

export function HomeHero() {
  return (
    <section className="search-home-panel" aria-labelledby="search-home-title">
      <p className="search-home-eyebrow">Industrial robotics catalog</p>
      <h1 id="search-home-title">Find the right RoboMotion products faster</h1>
      <p className="search-home-summary">
        Search live Commerce products by application, part type, controller fit, or buyer need.
      </p>

      <nav aria-label="Popular product searches" className="popular-searches">
        {popularSearches.map((popularQuery) => (
          <Link href={`/catalog?q=${encodeURIComponent(popularQuery)}`} key={popularQuery}>
            {popularQuery}
          </Link>
        ))}
      </nav>
    </section>
  );
}
