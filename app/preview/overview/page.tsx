import OverviewBlock from "@/components/blocks/OverviewBlock";
import type { OverviewData } from "@/lib/types";

const testData: OverviewData = {
  pageNumber: 4,
  days: [
    {
      dayNumber: 1,
      date: "Insert Date",
      activities: [
        { time: "", description: "Arrival in Tanzania; Transfer to Arusha Hotel" },
        { time: "1:30 PM - 2:00 PM", description: "Hotel Check-in" },
      ],
    },
    {
      dayNumber: 2,
      date: "Insert Date",
      activities: [
        { time: "6:00 AM - 11:59 AM", description: "Free Time" },
        { time: "12:00 PM - 12:59 PM", description: "Drive to Serval Wildlife" },
        { time: "1:00 PM - 1:59 PM", description: "Serval Wildlife Hotel Departure for Coffee Tour" },
        { time: "2:00 PM - 2:59 PM", description: "Drive to Coffee Tour" },
        { time: "3:00 PM - 5:00 PM", description: "Coffee Tour" },
        { time: "7:00 PM - 7:30 PM", description: "Arrive back at hotel" },
      ],
    },
    {
      dayNumber: 3,
      date: "Insert Date",
      activities: [
        { time: "11:00 AM", description: "Hotel Departure time" },
        { time: "12:00 PM - 04:00 PM", description: "Arusha National Park - Walking Safari" },
        { time: "05:00 PM", description: "Hotel/Lodge Arrival" },
      ],
    },
    {
      dayNumber: 4,
      date: "Insert Date",
      activities: [
        { time: "07:00 AM", description: "Hotel Check-Out & Departure" },
        { time: "07:00 AM", description: "Drive to Mkomazi National Park" },
        { time: "11:00 AM - 05:00 PM", description: "Full-Day Game Drive at Mkomazi National Park" },
        { time: "05:30 PM - 06:00 PM", description: "Hotel Check-in" },
      ],
    },
  ],
};

export default function OverviewPreviewPage() {
  return (
    <div className="flex justify-center bg-neutral-200">
      <OverviewBlock data={testData} />
    </div>
  );
}
