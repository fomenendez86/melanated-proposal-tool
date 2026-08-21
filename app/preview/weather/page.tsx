import WeatherBlock from "@/components/blocks/WeatherBlock";
import type { WeatherData } from "@/lib/types";

const testData: WeatherData = {
  pageNumber: 34,
  tables: [
    {
      title: "The Mainland Weather",
      seasons: [
        { name: "Summer", months: "Dec, Jan, Feb", tempF: "73.4°F - 84.2°F", tempC: "23°C - 29°C" },
        { name: "Fall", icon: "🌧️", months: "March, Apr, May", tempF: "68.0°F - 77.0°F", tempC: "20°C - 25°C" },
        { name: "Winter", months: "June, July, August", tempF: "62.6°F - 75.2°F", tempC: "17°C - 24°C" },
        { name: "Spring", months: "Sep, Oct, Nov", tempF: "69.8°F - 80.6°F", tempC: "21°C - 27°C" },
      ],
      note: "**Mainland Tanzania has a diverse climate due to its varying elevations. Coastal areas, like Dar es Salaam, are warm and humid year-round, while higher elevation regions, such as the Serengeti and Kilimanjaro, can be cooler, especially in the mornings and evenings. It's always wise to bring a jacket, as mornings tend to be chilly, but by noon, the temperatures warm up, and you'll find yourself shedding those extra layers. Whether you're on safari in the lowlands or exploring the mountains, the climate shifts can catch you by surprise, so it's best to be prepared!",
    },
    {
      title: "Zanzibar Weather",
      seasons: [
        { name: "Summer", months: "Dec, Jan, Feb", tempF: "79°F - 90°F", tempC: "26°C - 32°C" },
        { name: "Fall", icon: "🌧️", months: "March, Apr, May", tempF: "75°F - 86°F", tempC: "24°C - 30°C" },
        { name: "Winter", months: "June, July, August", tempF: "72°F - 82°F", tempC: "22°C - 28°C" },
        { name: "Spring", months: "Sep, Oct, Nov", tempF: "73°F - 86°F", tempC: "23°C - 30°C" },
      ],
      note: "**Zanzibar has a tropical climate, with warm temperatures throughout the year, making it an ideal destination no matter the season!",
    },
  ],
};

export default function WeatherPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <WeatherBlock data={testData} />
    </div>
  );
}
