export interface DayActivity {
  time: string;
  description: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  activities: DayActivity[];
}

export interface OverviewData {
  days: ItineraryDay[];
}

export interface ExcursionItem {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

export interface ExcursionListData {
  items: ExcursionItem[];
}

export interface HotelData {
  name: string;
  roomCategory: string;
  mealPlan: string;
  description: string;
  images: {
    topRight: string;
    bottomLeft: string;
  };
}
