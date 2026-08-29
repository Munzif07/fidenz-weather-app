export interface City {
  cityCode: number;
  name: string;
  country: string;
}

export interface OpenWeatherResponse {
  weather: { id: number; main: string; description: string; icon: string }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg: number };
  clouds: { all: number };
  name: string;
  id: number;
  cod: number;
}

export interface CityWeatherResult {
  cityCode: number;
  name: string;
  country: string;
  temperature: number; // Celsius
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  cloudiness: number;
  comfortScore: number;
  rank: number;
  cacheStatus: "HIT" | "MISS";
}
