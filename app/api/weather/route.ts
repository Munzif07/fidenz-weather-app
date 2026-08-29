import { NextResponse } from "next/server";
import cities from "@/data/cities.json";
import { weatherCache } from "@/lib/cache";
import { calculateComfortIndex } from "@/lib/comfortIndex";
import { auth0 } from "@/lib/auth0";
import type { City, CityWeatherResult, OpenWeatherResponse } from "@/lib/types";

const OWM_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

async function fetchCityWeather(
  city: City
): Promise<{ data: OpenWeatherResponse; cacheStatus: "HIT" | "MISS" }> {
  const cacheKey = `weather:${city.cityCode}`;

  const cached = weatherCache.get<OpenWeatherResponse>(cacheKey);
  if (cached) {
    return { data: cached, cacheStatus: "HIT" };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set in environment variables");
  }

  const url = `${OWM_BASE_URL}?id=${city.cityCode}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `OpenWeatherMap request failed for city ${city.name} (${city.cityCode}): ${res.status}`
    );
  }

  const data: OpenWeatherResponse = await res.json();
  weatherCache.set(cacheKey, data);

  return { data, cacheStatus: "MISS" };
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cityList = cities as City[];

    const results = await Promise.all(
      cityList.map(async (city) => {
        const { data, cacheStatus } = await fetchCityWeather(city);

        const comfort = calculateComfortIndex({
          tempCelsius: data.main.temp,
          humidityPercent: data.main.humidity,
          windSpeedMs: data.wind.speed,
          cloudinessPercent: data.clouds.all,
        });

        return {
          cityCode: city.cityCode,
          name: city.name,
          country: city.country,
          temperature: Math.round(data.main.temp * 10) / 10,
          description: data.weather[0]?.description ?? "N/A",
          icon: data.weather[0]?.icon ?? "01d",
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          cloudiness: data.clouds.all,
          comfortScore: comfort.score,
          cacheStatus,
        };
      })
    );

    // Rank from most comfortable (highest score) to least comfortable.
    const ranked: CityWeatherResult[] = results
      .sort((a, b) => b.comfortScore - a.comfortScore)
      .map((city, index) => ({ ...city, rank: index + 1 }));

    return NextResponse.json({ cities: ranked, count: ranked.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
