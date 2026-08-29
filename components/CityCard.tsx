import { ComfortGauge } from "./ComfortGauge";
import type { CityWeatherResult } from "@/lib/types";

export function CityCard({ city }: { city: CityWeatherResult }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-comfort-high/60">
      <span className="font-data w-8 shrink-0 text-center text-sm text-mist">
        {String(city.rank).padStart(2, "0")}
      </span>

      <ComfortGauge score={city.comfortScore} size={64} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display truncate text-base font-semibold text-halo">
            {city.name}
          </h3>
          <span className="font-data shrink-0 text-lg font-medium text-halo">
            {city.temperature}°C
          </span>
        </div>
        <p className="truncate text-sm capitalize text-mist">
          {city.description}
        </p>
        <div className="font-data mt-1 flex gap-3 text-xs text-mist">
          <span>💧 {city.humidity}%</span>
          <span>🌬 {city.windSpeed} m/s</span>
          <span>☁ {city.cloudiness}%</span>
        </div>
      </div>
    </div>
  );
}
