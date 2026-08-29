import { describe, it, expect } from "vitest";
import { calculateComfortIndex } from "./comfortIndex";

describe("calculateComfortIndex", () => {
  it("returns 100 when every parameter is in its ideal range", () => {
    const result = calculateComfortIndex({
      tempCelsius: 22,
      humidityPercent: 50,
      windSpeedMs: 1,
      cloudinessPercent: 35,
    });
    expect(result.score).toBe(100);
  });

  it("returns a score within 0-100 for extreme hot/humid/windy input", () => {
    const result = calculateComfortIndex({
      tempCelsius: 45,
      humidityPercent: 95,
      windSpeedMs: 20,
      cloudinessPercent: 100,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns a score within 0-100 for extreme cold input", () => {
    const result = calculateComfortIndex({
      tempCelsius: -20,
      humidityPercent: 10,
      windSpeedMs: 15,
      cloudinessPercent: 0,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("scores a mild, slightly-off-ideal day fairly high but not 100", () => {
    const result = calculateComfortIndex({
      tempCelsius: 28,
      humidityPercent: 65,
      windSpeedMs: 4,
      cloudinessPercent: 60,
    });
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThan(60);
  });

  it("weighs temperature more heavily than cloudiness", () => {
    // Only temperature is off-ideal
    const hotOnly = calculateComfortIndex({
      tempCelsius: 35,
      humidityPercent: 50,
      windSpeedMs: 1,
      cloudinessPercent: 35,
    });
    // Only cloudiness is off-ideal by an equivalent "distance"
    const cloudyOnly = calculateComfortIndex({
      tempCelsius: 22,
      humidityPercent: 50,
      windSpeedMs: 1,
      cloudinessPercent: 100,
    });
    // Temperature deviation should drag the total score down further
    // than an equivalent cloudiness deviation, since temp has a higher weight.
    expect(hotOnly.score).toBeLessThan(cloudyOnly.score);
  });

  it("never returns a score below 0 even with wildly out-of-range input", () => {
    const result = calculateComfortIndex({
      tempCelsius: 60,
      humidityPercent: 100,
      windSpeedMs: 100,
      cloudinessPercent: 100,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("produces a breakdown with all four sub-scores", () => {
    const result = calculateComfortIndex({
      tempCelsius: 22,
      humidityPercent: 50,
      windSpeedMs: 1,
      cloudinessPercent: 35,
    });
    expect(result).toHaveProperty("tempScore");
    expect(result).toHaveProperty("humidityScore");
    expect(result).toHaveProperty("windScore");
    expect(result).toHaveProperty("cloudinessScore");
  });
});
