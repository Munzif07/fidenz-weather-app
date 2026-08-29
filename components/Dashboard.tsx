"use client";

import { useEffect, useMemo, useState } from "react";
import { ComfortGauge } from "@/components/ComfortGauge";
import { CityCard } from "@/components/CityCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { CityWeatherResult } from "@/lib/types";

type SortKey = "rank" | "temperature" | "name";

export function Dashboard({ userEmail }: { userEmail?: string | null }) {
  const [cities, setCities] = useState<CityWeatherResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/weather", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load weather data");
      setCities(json.cities);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const visible = useMemo(() => {
    if (!cities) return [];
    const filtered = cities.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    const sorted = [...filtered];
    if (sortKey === "temperature") sorted.sort((a, b) => b.temperature - a.temperature);
    else if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => a.rank - b.rank);
    return sorted;
  }, [cities, query, sortKey]);

  const featured = cities?.[0];
  const rest = visible.filter((c) => c.cityCode !== featured?.cityCode);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
      {/* Header */}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-data text-xs tracking-widest text-comfort-high uppercase">
            Weather Analytics
          </p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-halo sm:text-3xl">
            Comfort Index
          </h1>
          <p className="mt-1 text-sm text-mist">
            {updatedAt ? `Updated ${updatedAt}` : "Reading live conditions…"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="font-data hidden text-xs text-mist sm:inline">
              {userEmail}
            </span>
          )}
          <a
            href="/auth/logout"
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-mist transition hover:border-comfort-low hover:text-comfort-low"
          >
            Logout
          </a>
          <ThemeToggle />
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-comfort-low/40 bg-comfort-low/10 p-4 text-sm text-comfort-low">
          <p className="font-medium">Couldn&apos;t load weather data</p>
          <p className="mt-1 text-mist">{error}</p>
          <button
            onClick={load}
            className="font-data mt-3 rounded-lg border border-border px-3 py-1.5 text-xs text-halo hover:border-comfort-high"
          >
            Retry
          </button>
        </div>
      )}

      {!cities && !error && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-mist">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-comfort-high" />
          <p className="text-sm">Fetching conditions across cities…</p>
        </div>
      )}

      {cities && (
        <>
          {/* Hero — most comfortable city */}
          {featured && (
            <section className="mb-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <p className="font-data text-xs tracking-widest text-comfort-high uppercase">
                Most comfortable right now
              </p>
              <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                <ComfortGauge score={featured.comfortScore} size={112} />
                <div className="min-w-0">
                  <h2 className="font-display text-3xl font-semibold text-halo sm:text-4xl">
                    {featured.name}
                  </h2>
                  <p className="mt-1 text-mist capitalize">
                    {featured.description} · {featured.temperature}°C
                  </p>
                  <div className="font-data mt-3 flex flex-wrap gap-4 text-xs text-mist">
                    <span>💧 Humidity {featured.humidity}%</span>
                    <span>🌬 Wind {featured.windSpeed} m/s</span>
                    <span>☁ Cloud {featured.cloudiness}%</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Controls */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by city name…"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-halo placeholder:text-mist/60 focus:border-comfort-high focus:outline-none sm:w-64"
            />
            <div className="font-data flex items-center gap-2 text-xs text-mist">
              <span>Sort</span>
              {(["rank", "temperature", "name"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`rounded-full border px-3 py-1 uppercase transition ${
                    sortKey === key
                      ? "border-comfort-high text-comfort-high"
                      : "border-border text-mist hover:text-halo"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <section className="flex flex-col gap-3">
            {rest.map((city) => (
              <CityCard key={city.cityCode} city={city} />
            ))}
            {visible.length === 0 && (
              <p className="py-12 text-center text-sm text-mist">
                No cities match &quot;{query}&quot;.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
