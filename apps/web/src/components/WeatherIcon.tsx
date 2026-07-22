import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun } from "lucide-react";

export default function WeatherIcon({
  condition, className = "h-3.5 w-3.5",
}: {condition: string; className?: string}) {
  if (condition.includes("雷")) return <CloudLightning className={className} />;
  if (condition.includes("雪")) return <CloudSnow className={className} />;
  if (condition.includes("雨")) return <CloudRain className={className} />;
  if (condition.includes("霧") || condition.includes("曇")) return <Cloud className={className} />;
  return <Sun className={className} />;
}