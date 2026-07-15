import { GeoPoint, Weather } from "@anglog/shared";

function wmoToCondition(code: number): string {
  if (code === 0) return "快晴";
  if (code <= 3) return "晴れ〜曇り";
  if (code === 45 || code === 48) return "霧";
  if (code >= 51 && code <= 57) return "霧雨";
  if (code >= 61 && code <= 67) return "雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "にわか雨";
  if (code >= 95) return "雷雨";
  return "不明";
}

type OpenMeteoResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    surface_pressure: number[];
  };
};

export async function fetchWeather(
  location: GeoPoint,
  caughtAt: string,
): Promise<Weather | undefined> {
  const date = caughtAt.slice(0, 10);
  const targetHour = caughtAt.slice(0, 13) + ":00";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}` +
    `&start_date=${date}&end_date=${date}` +
    `&hourly=temperature_2m,weather_code,wind_speed_10m,surface_pressure&timezone=UTC`;

  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;

    const data = (await res.json()) as OpenMeteoResponse;
    const i = data.hourly.time.indexOf(targetHour);
    if (i === -1) return undefined;
    return {
      condition: wmoToCondition(data.hourly.weather_code[i]),
      temperature: data.hourly.temperature_2m[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      pressure: data.hourly.surface_pressure[i],
    };
  } catch {
    return undefined;
  }
}
