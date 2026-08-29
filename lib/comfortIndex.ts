// Comfort Index Score (0-100)
// -----------------------------------------------------------------------
// Parameters used: Temperature, Humidity, Wind Speed, Cloudiness (4 params,
// assignment requires a minimum of 3).
//
// Design reasoning (also documented in README):
// Each parameter is scored independently on a 0-100 "sub-score" scale
// based on how close it is to an ideal comfortable range, then combined
// using a weighted average. Temperature has the strongest influence on
// how a human perceives comfort, so it gets the highest weight.
//
// Weights: Temperature 40%, Humidity 30%, Wind Speed 20%, Cloudiness 10%
// -----------------------------------------------------------------------

export interface ComfortInput {
  tempCelsius: number;
  humidityPercent: number;
  windSpeedMs: number;
  cloudinessPercent: number;
}

export interface ComfortBreakdown {
  score: number; // final 0-100 comfort score
  tempScore: number;
  humidityScore: number;
  windScore: number;
  cloudinessScore: number;
}

const WEIGHTS = {
  temp: 0.4,
  humidity: 0.3,
  wind: 0.2,
  cloudiness: 0.1,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// Ideal range 20-25°C = 100. Score drops 4 points per °C outside the range.
function scoreTemperature(tempC: number): number {
  const idealMin = 20;
  const idealMax = 25;
  if (tempC >= idealMin && tempC <= idealMax) return 100;
  const distance = tempC < idealMin ? idealMin - tempC : tempC - idealMax;
  return clamp(100 - distance * 4);
}

// Ideal range 40-60% = 100. Score drops 1.5 points per % outside the range.
function scoreHumidity(humidity: number): number {
  const idealMin = 40;
  const idealMax = 60;
  if (humidity >= idealMin && humidity <= idealMax) return 100;
  const distance = humidity < idealMin ? idealMin - humidity : humidity - idealMax;
  return clamp(100 - distance * 1.5);
}

// Ideal <= 3 m/s (light breeze) = 100. Score drops 6 points per m/s above that.
function scoreWind(windMs: number): number {
  const idealMax = 3;
  if (windMs <= idealMax) return 100;
  const distance = windMs - idealMax;
  return clamp(100 - distance * 6);
}

// Ideal 20-50% cloud cover (some cloud cover moderates heat without
// making it gloomy) = 100. Fully clear or fully overcast score lower.
function scoreCloudiness(cloudiness: number): number {
  const idealMin = 20;
  const idealMax = 50;
  if (cloudiness >= idealMin && cloudiness <= idealMax) return 100;
  const distance =
    cloudiness < idealMin ? idealMin - cloudiness : cloudiness - idealMax;
  return clamp(100 - distance * 0.8);
}

export function calculateComfortIndex(input: ComfortInput): ComfortBreakdown {
  const tempScore = scoreTemperature(input.tempCelsius);
  const humidityScore = scoreHumidity(input.humidityPercent);
  const windScore = scoreWind(input.windSpeedMs);
  const cloudinessScore = scoreCloudiness(input.cloudinessPercent);

  const score =
    tempScore * WEIGHTS.temp +
    humidityScore * WEIGHTS.humidity +
    windScore * WEIGHTS.wind +
    cloudinessScore * WEIGHTS.cloudiness;

  return {
    score: Math.round(clamp(score) * 10) / 10,
    tempScore: Math.round(tempScore),
    humidityScore: Math.round(humidityScore),
    windScore: Math.round(windScore),
    cloudinessScore: Math.round(cloudinessScore),
  };
}
