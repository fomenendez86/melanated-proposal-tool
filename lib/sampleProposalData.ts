import {
  paginateDayItinerary,
  paginateExcursionList,
  paginateOverview,
  paginateTermsConditions,
  renumberSections,
} from "@/lib/paginate";
import type {
  DayEntry,
  ExcursionItem,
  ItineraryDay,
  ProposalData,
  ProposalSection,
  TermsSection,
} from "@/lib/types";

const overviewDays: ItineraryDay[] = [
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
      {
        time: "1:00 PM - 1:59 PM",
        description: "Serval Wildlife Hotel Departure for Coffee Tour",
      },
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
      {
        time: "12:00 PM - 04:00 PM",
        description: "Arusha National Park - Walking Safari",
      },
      { time: "05:00 PM", description: "Hotel/Lodge Arrival" },
    ],
  },
  {
    dayNumber: 4,
    date: "Insert Date",
    activities: [
      { time: "07:00 AM", description: "Hotel Check-Out & Departure" },
      { time: "07:00 AM", description: "Drive to Mkomazi National Park" },
      {
        time: "11:00 AM - 05:00 PM",
        description: "Full-Day Game Drive at Mkomazi National Park",
      },
      { time: "05:30 PM - 06:00 PM", description: "Hotel Check-in" },
    ],
  },
  {
    dayNumber: 5,
    date: "Insert Date",
    activities: [
      { time: "08:00 AM", description: "Hotel/Lodge Check-out" },
      { time: "08:00 AM - 02:00 PM", description: "Drive to Karatu" },
      { time: "02:30 PM - 04:00 PM", description: "Local Maasai Village" },
      { time: "05:00 PM - 05:30 PM", description: "Hotel Check-in" },
    ],
  },
  {
    dayNumber: 6,
    date: "Insert Date",
    activities: [
      { time: "09:00 AM", description: "Hotel Departure time" },
      {
        time: "10:00 AM - 04:00 PM",
        description: "Hadzabe Tribe; Datoga Tribe; Ngorongoro Crater",
      },
      { time: "05:00 PM", description: "Hotel/Lodge Arrival" },
    ],
  },
  {
    dayNumber: 7,
    date: "Insert Date",
    activities: [
      { time: "09:00 AM", description: "Hotel Check-Out & Departure time" },
      {
        time: "10:30 AM - 04:00 PM",
        description: "Hadzabe Tribe; Datoga Tribe; Ngorongoro Crater",
      },
      { time: "04:00 PM - 05:00 PM", description: "Drive to Serengeti National Park" },
      { time: "05:30 PM - 06:00 PM", description: "Lodge Check-in" },
    ],
  },
  {
    dayNumber: 8,
    date: "Insert Date",
    activities: [
      { time: "5:00 AM", description: "Hotel Departure time(Hot Air Balloon Only)" },
      { time: "9:00 AM", description: "Hotel Departure time(Non-participants)" },
      { time: "10:30 AM - 4:30 PM", description: "Game Drive" },
      { time: "5:30 PM - 6:00 PM", description: "Hotel Arrival" },
    ],
  },
  {
    dayNumber: 9,
    date: "Insert Date",
    activities: [
      { time: "08:00 AM", description: "Hotel Check-out" },
      {
        time: "08:00 AM - 03:00 PM",
        description: "Return to Arusha (Long Drive Day)",
      },
      { time: "04:00 PM - 04:30 PM", description: "Hotel Check-in" },
    ],
  },
  {
    dayNumber: 10,
    date: "Insert Date",
    activities: [
      { time: "", description: "Hotel Check-out" },
      { time: "", description: "Transport to Kilimanjaro International Airport(JRO)" },
    ],
  },
];

const dayEntries: DayEntry[] = [
  {
    dayNumber: 1,
    highlightLine: "🌍 Welcome to Tanzania! 🌍",
    paragraphs: [
      "You are the heart of what we do, and it's an absolute honor to have you with us. On behalf of the entire Melanated Safaris family, we'd like to warmly welcome you to the beautiful country of Tanzania. Our dedicated staff will be eagerly awaiting your arrival to greet you with a heartfelt African welcome to the Motherland. From there, you'll be transported in comfort to your accommodations where your journey of unforgettable experiences begins.",
    ],
    imageUrls: ["https://picsum.photos/id/1025/500/450"],
  },
  {
    dayNumber: 2,
    subtitle: "Serval Wildlife & Coffee Tour",
    paragraphs: [
      "Experience the wild like never before as you get up close with exotic animals at the renowned Serval Wildlife sanctuary. Then, breathe in the rich aromas of freshly roasted beans as you stroll through a lush coffee estate nestled in the highlands.",
      "From majestic wildlife encounters to the art of coffee cultivation, this tour blends nature, culture, and flavor into one unforgettable adventure. It's an inspiring escape into Tanzania's wild soul and aromatic heritage.",
    ],
    imageUrls: [
      "https://picsum.photos/id/1074/500/280",
      "https://picsum.photos/id/1069/500/280",
    ],
  },
  {
    dayNumber: 3,
    subtitle: "Walking Safari: Arusha National Park",
    paragraphs: [
      "Spend the day experiencing Arusha National Park from a whole new perspective — on foot. Led by an expert ranger, your walking safari begins in the shadow of Mount Meru, where you'll quietly explore the park's lush forests and open clearings.",
      "Keep your eyes peeled for giraffes gracefully browsing nearby, herds of buffalo, warthogs trotting through the grass, and the elusive colobus monkeys swinging through the canopy above.",
    ],
    imageUrls: ["https://picsum.photos/id/1080/500/280"],
  },
  {
    dayNumber: 4,
    subtitle: "Mkomazi National Park",
    paragraphs: [
      "Mkomazi National Park is located in Northern Tanzania. The park is 1,253 square miles, around the same size as the state of Rhode Island! While visiting Mkomazi National Park, you will be able to see two endangered species, the rhino and the African wild dog.",
      "Other animals you may see include giraffe, oryx, gerenuk, hartebeest, lesser kudu, eland, impala and Grant's gazelle share the reserve with elephant, buffalo, and numerous predators.",
    ],
    imageUrls: [
      "https://picsum.photos/id/1076/500/280",
      "https://picsum.photos/id/1084/500/280",
    ],
  },
  {
    dayNumber: 5,
    subtitle: "Drive to Karatu via Local Maasai Village",
    paragraphs: [
      "You'll bid farewell to Mkomazi National Park and head to Karatu with a cultural stop a Local Maasai Village.",
      "Explore the dynamic mosaic of Maasai culture by stepping into a local village in Tanzania. Engage with the welcoming Maasai community, participating in lively dances that resonate with the spirit of their age-old traditions. Immerse yourself in the richness of their heritage.",
    ],
    imageUrls: ["https://picsum.photos/id/1062/500/280"],
  },
  {
    dayNumber: 6,
    subtitle: "Hadzabe Tribe; Datoga Tribe; Ngorongoro Crater",
    paragraphs: [
      "After breakfast, set out to meet the Hadza, one of the world's oldest tribes dating back to the late Stone Age. Experience their traditional hunter-gatherer lifestyle and time-honored skills. Then visit the Datoga tribe, known for their expert blacksmithing and rich cultural heritage.",
      "End the day at the Ngorongoro Crater, a massive volcanic caldera and one of Africa's most spectacular natural wonders.",
    ],
    imageUrls: [
      "https://picsum.photos/id/1036/500/280",
      "https://picsum.photos/id/1059/500/280",
    ],
  },
  {
    dayNumber: 7,
    subtitle: "Olduvai Gorge; Shifting Sands; Arrival Serengeti National Park",
    paragraphs: [
      'Begin your journey with a visit to Olduvai Gorge, one of the most important archaeological sites in the world and often called the "Cradle of Mankind." Learn about early human history and groundbreaking discoveries that have shaped our understanding of evolution.',
      "Continue to the mysterious Shifting Sands—black volcanic dunes that move across the plains with the wind. Then, enter the iconic Serengeti National Park, where endless wildlife and sweeping savannahs welcome you to the heart of the safari experience.",
    ],
    imageUrls: ["https://picsum.photos/id/1053/500/280"],
  },
  {
    dayNumber: 8,
    subtitle: "Full Day Game Drive: Serengeti National Park",
    highlightLine:
      "- Optional (NOT INCLUDED): Sunrise Hot Air Balloon Experience ($599 per person)",
    paragraphs: [
      "Spend an unforgettable day exploring the legendary Serengeti National Park on a full-day game drive. From the first light of dawn to the golden hues of sunset, journey across endless plains alive with wildlife. Guided by an expert, you'll follow nature's rhythm through diverse habitats, taking in every thrilling sight and sound. It's a day of pure safari magic in one of Africa's most iconic destinations.",
    ],
    imageUrls: [
      "https://picsum.photos/id/1077/500/280",
      "https://picsum.photos/id/1049/500/280",
    ],
  },
  {
    dayNumber: 9,
    subtitle: "Drive to Arusha (Long Drive Day)",
    paragraphs: [
      "After checking out of Serengeti National Park, embark on a scenic drive back to Arusha. Though it's a long day on the road, the journey offers stunning landscapes and a chance to reflect on your incredible safari adventure.",
      "Relax and enjoy the changing scenery as you make your way to the city, marking the close of your unforgettable Tanzanian journey.",
    ],
    imageUrls: ["https://picsum.photos/id/1044/500/280"],
  },
  {
    dayNumber: 10,
    subtitle: "Return Home",
    paragraphs: [
      "We hope you've thoroughly enjoyed your experience with us and that this week has exceeded your expectations. Our goal was to shed new light on the beauty of Africa, and we hope you'll return home eager to share just how magical this place truly is. We're committed to ending the negative stigma surrounding Africa and changing perceptions, and we hope we've done that for you.",
      "You'll have the opportunity for last-minute souvenir shopping. For guests with late departures (after 5:00 PM), you'll get to visit the iconic Rock Restaurant before heading to the airport.",
      "TBD: Check-Out time varies depending on hotel. Our team will advise you of your pick-up time and options, based on your departure flight.",
    ],
    imageUrls: ["https://picsum.photos/id/1071/500/280"],
  },
];

const arushaExcursions: ExcursionItem[] = [
  {
    title: "Walking Safari at Arusha National Park",
    description:
      "A walking safari at Arusha National Park offers a unique, up-close adventure through diverse landscapes, allowing you to experience the park's wildlife, stunning views of Mount Meru, and rich ecosystems from the ground level.",
    price: "$200",
    imageUrl: "https://picsum.photos/seed/arusha-safari/600/400",
  },
  {
    title: "Coffee Tour w/Chagga Tribe",
    description:
      "Explore the Chagga coffee farms in the foothills of Mount Kilimanjaro, where you'll learn about the region's rich coffee-making traditions from local guides of the Chagga tribe.",
    price: "$80",
    imageUrl: "https://picsum.photos/seed/chagga-coffee/600/400",
  },
  {
    title: "Chemka Springs",
    description:
      "Chemka Springs is a tranquil natural oasis with crystal-clear turquoise waters, nestled in the foothills of Kilimanjaro, offering a perfect escape surrounded by lush greenery and volcanic rocks.",
    price: "$80",
    imageUrl: "https://picsum.photos/seed/chemka-springs/600/400",
  },
  {
    title: "Serval Wildlife",
    description:
      "Serval Wildlife is a unique experience where you can get up close to nature, feeding and interacting with animals like zebras, giraffes, and wildebeests in their natural habitat.",
    price: "$150",
    imageUrl: "https://picsum.photos/seed/serval-wildlife/600/400",
  },
  {
    title: "Day Safari to Mkomazi National Park",
    description:
      "Explore Mkomazi, a hidden gem home to endangered black rhinos and African wild dogs, where you'll experience thrilling wildlife encounters in a peaceful and conservation-focused setting.",
    price: "$200",
    imageUrl: "https://picsum.photos/seed/mkomazi-day/600/400",
  },
  {
    title: "Day Safari to Tarangire National Park",
    description:
      "Tarangire National Park, renowned for its large elephant herds and iconic baobab trees, offering an authentic safari experience in a picturesque setting.",
    price: "$200",
    imageUrl: "https://picsum.photos/seed/tarangire-day/600/400",
  },
  {
    title: "Day Safari to Lake Manyara National Park",
    description:
      "Explore the diverse ecosystems of Lake Manyara, known for its tree-climbing lions, vibrant birdlife, and breathtaking views of the Great Rift Valley, making it a must-visit for nature lovers.",
    price: "$200",
    imageUrl: "https://picsum.photos/seed/manyara-day/600/400",
  },
  {
    title: "Night Game Drive",
    description:
      "Experience the thrill of a night game drive in Tarangire or Lake Manyara, where you'll spot nocturnal wildlife like leopards, hyenas, and owls under the stars in the heart of Tanzania's wilderness.",
    price: "$300",
    imageUrl: "https://picsum.photos/seed/night-drive/600/400",
  },
  {
    title: "Day Safari to Ngorongoro Crater",
    description:
      "Explore the Ngorongoro Crater on a day safari, where you'll witness a unique ecosystem teeming with wildlife, from herds of elephants to prides of lions, all set within the world's largest intact volcanic caldera.",
    price: "$300",
    imageUrl: "https://picsum.photos/seed/ngorongoro-day/600/400",
  },
  {
    title: "Mosquito River Cultural Tour",
    description:
      "The Mosquito River Cultural Tour offers a rich experience where you'll explore local traditions, take a fascinating banana farm tour, enjoy authentic local dishes, discover the artistry of wood carving, and visit a thriving rice plantation to learn about the area's agricultural heritage.",
    price: "$80",
    imageUrl: "https://picsum.photos/seed/mosquito-river/600/400",
  },
  {
    title: "Local Maasai Village",
    description:
      "This tour provides an immersive experience into the vibrant culture of the Maasai people, where you'll visit traditional homes, learn about their customs and way of life.",
    price: "$80",
    imageUrl: "https://picsum.photos/seed/maasai-village/600/400",
  },
  {
    title: "Zipline Adventure",
    description:
      "Located at the base of the Great Rift Valley, this zipline adventure offers stunning views of lakes, wetlands, and the Maasai steppe. Just off the main safari route, the eco-course features four zips and six platforms around majestic baobab trees, with a scenic transfer through Maasai land and a fun adventure for all.",
    price: "$80",
    imageUrl: "https://picsum.photos/seed/zipline/600/400",
  },
  {
    title: "Tanzanite Gem Tour",
    description:
      "Discover the beauty and allure of Tanzania's iconic gemstone on our Tanzanite Gem Tour, where you'll explore the history, mining process, and stunning varieties of this rare and precious gem, with the chance to purchase authentic Tanzanite pieces.",
    price: "$100",
    imageUrl: "https://picsum.photos/seed/tanzanite/600/400",
  },
  {
    title: "Kilimanjaro Golf Day",
    description:
      "Enjoy a round of golf at the stunning Kilimanjaro Golf Estate, where breathtaking views of Mount Kilimanjaro and lush greenery create the perfect setting for a relaxing and memorable game.",
    price: "$180",
    imageUrl: "https://picsum.photos/seed/kili-golf/600/400",
  },
  {
    title: "Kilimanjaro Day Hike",
    description:
      "Experience the beauty of Mount Kilimanjaro on a day hike, where you'll trek through diverse landscapes, from lush rainforests to alpine meadows, all while taking in stunning views of Africa's tallest peak.",
    price: "$150",
    imageUrl: "https://picsum.photos/seed/kili-hike/600/400",
  },
  {
    title: "Scenic Helicopter Tour",
    description:
      "Take a private or shared scenic helicopter tour over the majestic Mount Meru or the Northern Circuit, offering panoramic views of Lake Natron and the stunning Oi Lidonyo Lengua. Duration: 3.5 hours. Lunch Included.",
    price: "$13,000 (per helicopter; max. 6 pax)",
    imageUrl: "https://picsum.photos/seed/helicopter/600/400",
  },
];

const termsSections: TermsSection[] = [
  {
    heading: "Reservation and Payment Policy",
    paragraphs: [
      "a. A non-refundable deposit of $500 per person is required to secure a booking.\nb. Full payment is due no later than 60 days prior to the safari departure date.\nc. For bookings made less than 60 days prior to the safari departure date, full payment is required to secure the booking.\nd. Payment can be made by bank transfer or credit card.",
    ],
  },
  {
    heading: "Amendment Policy",
    paragraphs: [
      "Guests may make amendments, such as name changes, or add additional guests, on a previously booked package and accept the following:",
      "a. You are subject to a new rate based on the current hotel/lodge rates at the time of the modification.\nb. You may be subject to modification fees from our supplier partners to alter originally confirmed bookings.",
    ],
  },
  {
    heading: "Cancellation Policy",
    paragraphs: [
      "a. Due to recent changes in many of our suppliers policies, ALL payments are NON-REFUNDABLE, nor are trips exchangeable for an alternate date. Upon payment, our reservation team promptly secures your accommodations. Once transactions are processed, we regretfully cannot retrieve funds, necessitating this adjustment in our policy.",
      "We strongly recommend purchasing travel insurance for added protection AND to cover any unexpected cancellations.",
    ],
  },
  {
    heading: "Safari Itinerary",
    paragraphs: [
      "a. The safari itinerary is subject to change at any time due to weather conditions, park regulations, or unforeseen circumstances beyond our control.\nb. Melanated Safaris will make every effort to inform clients of any changes to the itinerary as soon as possible.\nc. We reserve the right to substitute lodges, hotels, or camps with others of a similar standard should the need arise.",
    ],
  },
  {
    heading: "Passports & Visas",
    paragraphs: [
      "a. Guests are responsible for ensuring that they have the proper travel documents. Passports are required to be valid for at least 6 months after the date of travel.",
      "b.  US passport holders are required to purchase a MULTIPLE ENTRY VISA. The cost of this visa is $100 USD(CASH ONLY) and $50 for all other nations(Ordinary Visa). Some countries are exempt and do not need a visa.",
      "Visit https://immigration.go.tz for more information.",
      "c. Effective October 1, 2024, The Revolutionary Government of Zanzibar, has mandated that ALL tourists inbound to the island of Zanzibar purchase travel insurance. This insurance can only be purchased from the Zanzibar Insurance Corporation(ZIC). Even if you have a separate travel insurance policy, you must obtain a travel insurance policy from ZIC. Failure to obtain a policy, will result in denied entry at customs and immigration.",
      "Visit https://visitzanzibar.go.tz for more information.",
    ],
  },
  {
    heading: "Health and Safety",
    paragraphs: [
      "a. Guests must inform us of any pre-existing medical conditions or dietary requirements at the time of booking.\nb. Guests are responsible for their own health and safety while on safari.\nc. We strongly recommend that guests consult with a healthcare professional prior to travel and take any necessary vaccinations or medications.\nd. Guests are required to follow all safety instructions given by our guides while on safari.",
    ],
  },
  {
    heading: "Liability",
    paragraphs: [
      "a. We accept no responsibility for any loss, damage, injury, or death resulting from any act or omission on the part of any third party, including but not limited to airlines, lodges, hotels, local vendor, or other safari operators.\nb. We accept no responsibility for any loss, damage, injury, or death resulting from any act or omission on the part of the client.\nc. We recommend that clients take out comprehensive travel insurance to cover any loss, damage, injury, or death.",
    ],
  },
  {
    heading: "Force Majeure",
    paragraphs: [
      "a. Force Majeure means unusual and unforeseeable circumstances beyond Melanated Safaris control or the control of our suppliers, the consequence of which neither Melanated Safaris, nor its suppliers, could avoid even with all due care, including, but not limited to, war or threat of war; riot; civil strife; terrorist activity (actual or threatened); industrial dispute; technical problems with transport, machinery or equipment; outages or power failures; natural or nuclear disaster; fire, flood, drought or adverse weather conditions; pandemics, epidemics or outbreaks of illness.",
      "In the event of a cancellation or material alteration to the package, as a result of the circumstances as described in this clause, Melanated Safaris shall have no liability whatsoever for any travel related costs incurred by the guest, including but not limited to air, insurance, visas and other travel arrangements of any kind.",
    ],
  },
  {
    heading: "Governing Law and Jurisdiction",
    paragraphs: [
      "a. These terms and conditions shall governed by and construed in accordance with the laws of the United Republic of Tanzania, and any disputes arising under or in connection with these terms and conditions shall be subject to the exclusive jurisdiction of the courts of the United Republic of Tanzania.",
      "By making a booking with us, clients acknowledge that they have read, understood, and agreed to these terms and conditions.",
    ],
  },
];

const sections: ProposalSection[] = [
  {
    type: "cover",
    data: {
      title: "Proposal",
      subtitle: "An Unforgettable Tanzanian Experience For",
      clientLine: "Replace with Company Name or Clients",
      imageUrl: "/proposal-assets/cover-zebras-v1.png",
    },
  },
  {
    type: "fromOwners",
    data: {
      paragraphs: [
        "We started Melanated Safaris in January 2022 with a passion for sharing the beauty of Africa, and we've built this company from the ground up with love and dedication. Thank you from the bottom of our hearts for considering us for your journey—we know you have choices, and it's an honor to be part of your adventure.",
        "What sets us apart isn't just our expertise in safaris; it's our deep commitment to creating authentic, next-generation experiences rooted in African culture, breathtaking landscapes, and heartfelt hospitality. Every trip we plan is designed with care, uplifting local communities while ensuring your journey is seamless, personalized, and unforgettable.",
        "With Melanated Safaris, it's more than a safari—it's a connection to Africa that will stay with you forever. We can't wait to welcome you!",
      ],
      founders: [
        { name: "Antoine D. Wilson", title: "Co-Founder | CEO" },
        {
          name: "Okello Jao",
          title: "Co-Founder | Director of Safari Operations",
        },
      ],
      photoUrl: "https://picsum.photos/id/1043/800/450",
      pageNumber: 2,
    },
  },
  {
    type: "details",
    data: {
      rows: [
        { label: "Package Booked:", value: "The Mainland Tour" },
        { label: "Selected Tier:", value: "Classic" },
        { label: "Dates:", value: "Dates to be confirmed" },
        { label: "Passenger Manifest:", value: "Traveler details pending" },
        { label: "Special Occasion:", value: "TBD" },
        {
          label: "Airport Information",
          value: "Arrival(JRO - Mt. Kilimanjaro); Departure(ZNZ - Zanzibar)",
          emphasis: true,
        },
        { label: "Package Total:", value: "Pricing to be confirmed" },
      ],
      pageNumber: 3,
    },
  },
  ...paginateOverview({ days: overviewDays, pageNumber: 0 }, 4),
  {
    type: "triangleDivider",
    data: {
      sectionLabel: "Accommodations",
      titleLines: [
        { text: "Hotel", style: "bold" },
        { text: "Accommodations", style: "bold" },
      ],
      imageUrl: "https://picsum.photos/id/1076/900/600",
      pageNumber: 6,
    },
  },
  {
    type: "triangleDivider",
    data: {
      sectionLabel: "Accommodations",
      titleLines: [
        { text: "Under the Shade", style: "bold" },
        { text: "Safari Lodge", style: "script" },
      ],
      imageUrl: "https://picsum.photos/id/1016/900/600",
      pageNumber: 7,
    },
  },
  {
    type: "hotel",
    data: {
      pageNumber: 8,
      name: "Under the Shade Safari Lodge",
      roomCategory: "Standard",
      mealPlan: "Half Board",
      description:
        "Nestled in the heart of Tanzania's wild beauty, Under the Shade Safari Lodge offers an intimate and immersive bush experience on the edge of a private game reserve. Surrounded by acacia woodlands and expansive savannah, the lodge blends rustic elegance with modern comfort. Guests stay in spacious, eco-friendly tents or thatched cottages, each offering sweeping views of the African plains and the chance to spot wildlife right from their veranda. With locally inspired cuisine, guided game drives, and sundowners by the firepit, it's the perfect retreat for those seeking connection with nature, luxury under canvas, and the untamed spirit of safari life.",
      images: {
        topRight: "https://picsum.photos/id/1015/700/450",
        bottomLeftTop: "https://picsum.photos/id/1018/500/300",
        bottomLeftBottom: "https://picsum.photos/id/1016/500/700",
      },
    },
  },
  {
    type: "triangleDivider",
    data: {
      sectionLabel: "Accommodations",
      titleLines: [
        { text: "Ngorongoro", style: "bold" },
        { text: "Farm House", style: "script" },
      ],
      imageUrl: "https://picsum.photos/id/1039/900/600",
      pageNumber: 9,
    },
  },
  {
    type: "hotel",
    data: {
      pageNumber: 10,
      name: "Ngorongoro Farm House",
      roomCategory: "Standard",
      mealPlan: "Full Board",
      description:
        "Set on 750 acres of private farmland, Ngorongoro Farm House offers a warm and inviting atmosphere just minutes from the Ngorongoro Conservation Area gate. The lodge is comfortable, thoughtfully laid out, and features sweeping views of the surrounding coffee plantation and the distant Oldeani Volcano. Guests enjoy spacious cottage-style rooms, beautiful garden pathways, and freshly prepared meals sourced from the on-site organic gardens. It's an ideal retreat for travelers seeking both relaxation and proximity to the crater, with a touch of local charm and rural elegance.",
      images: {
        topRight: "https://picsum.photos/id/1040/700/450",
        bottomLeftTop: "https://picsum.photos/id/1041/500/300",
        bottomLeftBottom: "https://picsum.photos/id/1042/500/700",
      },
    },
  },
  {
    type: "triangleDivider",
    data: {
      sectionLabel: "Itinerary",
      titleLines: [
        { text: "The", style: "script" },
        { text: "Itinerary", style: "bold" },
      ],
      imageUrl: "https://picsum.photos/id/1050/900/600",
      pageNumber: 13,
    },
  },
  ...paginateDayItinerary(dayEntries, 14),
  {
    type: "sectionDivider",
    data: {
      title: "EXCURSIONS",
      subtitle: "TAKE YOUR ADVENTURE TO THE NEXT LEVEL!",
      imageUrl: "https://picsum.photos/id/1080/520/400",
      pageNumber: 20,
    },
  },
  {
    type: "cityToursDivider",
    data: {
      city: "Arusha",
      intro:
        'Arusha, often referred to as the "Safari Capital of Tanzania," offers a wide range of tours and excursions that allow you to experience the best of both nature and culture. Whether you\'re seeking thrilling wildlife adventures or a deep dive into the region\'s rich heritage, Arusha has something for everyone. You can explore the stunning landscapes of nearby national parks like Serengeti, Ngorongoro Crater, and Tarangire, or visit cultural landmarks such as the Maasai villages and local markets.',
      priceNote:
        "Prices are per adult(Ages 13+); children 5-12 years are 50% off",
      imageUrl: "https://picsum.photos/id/1082/900/700",
      pageNumber: 21,
    },
  },
  ...paginateExcursionList({ items: arushaExcursions, pageNumber: 0 }, 22),
  {
    type: "twoColumnList",
    data: {
      title: "Inclusions",
      pageNumber: 30,
      leftColumn: [
        {
          heading: "Ground Transportation",
          lines: [
            "All transfers to and from",
            "the airport and excursions",
            "listed on the itinerary",
          ],
        },
        {
          heading: "Hotel Accommodations",
          lines: [
            "2D/1N - at Arumeru River Lodge",
            "3D/2N - at Lake Burunge Baobab Lodge",
            "2D/1N - at Ngorongoro Farm House",
            "3D/2N - at Grumeti Hills",
            "3D/2N - at Anantya Serengeti",
            "5D/4N - at Nungwi Beach by Turaco",
          ],
        },
        {
          heading: "All Meals",
          lines: ["All-Inclusive:(Breakfast, Lunch,", "and Dinner)"],
        },
      ],
      rightColumn: [
        {
          heading: "Domestic Flight",
          lines: ["Flight to and from mainland", "for safari"],
        },
        {
          heading: "Tarangire National Park & Serengeti National Park",
          lines: ["All park fees & concessions"],
        },
        {
          heading: "Safari Pack",
          lines: ["A thank you gift from", "Melanated Safaris"],
        },
      ],
    },
  },
  {
    type: "twoColumnList",
    data: {
      title: "Exclusions",
      pageNumber: 31,
      leftColumn: [
        {
          heading: "International Airfare",
          lines: ["Flight to and from Tanzania"],
        },
        {
          heading: "Tourist Visa",
          lines: [
            "US Citizens – $100 USD",
            "Other Nationalities – $50 USD",
            "Please visit https://immigration.go.tz",
            "to verify if a visa is required for",
            "citizens of your country",
          ],
        },
        {
          heading: "Zanzibar Travel Insurance",
          lines: [
            "Mandatory requirement and can",
            "only be purchased from the",
            "Zanzibar Insurance",
            "Corporation(ZIC)",
          ],
        },
      ],
      rightColumn: [
        {
          heading: "Tips and Gratuity",
          lines: ["Optional; suggested $20", "per day"],
        },
        {
          heading: "Travel Insurance",
          lines: [
            "Optional but recommended for",
            "unexpected emergencies.  This",
            "policy does not supercede the",
            "required Zanzibar travel",
            "insurance.",
          ],
        },
      ],
    },
  },
  {
    type: "pricing",
    data: {
      pageNumber: 32,
      intro:
        "At Melanated Safaris, we make it easy for groups to manage payments with a convenient three-installment plan. All payments can be made securely via bank wire. Below, you'll find the payment schedule, with dates for each installment to ensure your trip arrangements stay on track. For your convenience, our banking information is provided at the end of this section.",
      packagePricing: [
        { label: "Invoice Total", value: "$11,842.35" },
        { label: "Commission", value: "$1,153.35." },
        { label: "Amount Due", value: "$10,688.65." },
      ],
      paymentSchedule: [
        {
          label: "First Installment",
          value: "€500 deposit per person due at booking",
        },
        { label: "Second Installment", value: "August 03, 2025" },
        { label: "Final Installment", value: "November 03, 2025" },
      ],
      bankingInfo: [
        { label: "Bank Name", value: "Citibank N.A." },
        { label: "Beneficiary Name", value: "MELANATED SAFARIS LLC" },
        { label: "SWIFT Code(Intl.)", value: "CITIUS33" },
        { label: "Routing Number(USA)", value: "266086554" },
        { label: "Account Number", value: "9154236745" },
        {
          label: "Company Address",
          value: "2212 NW 91st #1239 Miami, FL 33147",
        },
      ],
    },
  },
  {
    type: "importantItems",
    data: {
      pageNumber: 33,
      rows: [
        {
          icon: "🛂",
          swatchColor: "#dbcfad",
          heading: "Passport",
          bullets: [
            "Ensure you have at least 6 months validity",
            "Double-check that the name on your passport matches your travel documents (flights, reservations, etc.).",
            "Keep a photocopy or digital copy of your passport in a separate location in case it's lost or stolen.",
            "Ensure your passport has at least two blank visa pages.",
          ],
        },
        {
          icon: "🪪",
          swatchColor: "#e8ceb0",
          heading: "Visas",
          bullets: [
            "USA Citizens: Multiple Entry Visa Required ($100 USD Cash Only)",
            "All other Nations: Ordinary Visa ($50 USD Cash Only)",
            "Visa free?: Check https://immigration.go.tz",
          ],
        },
        {
          icon: "🐚",
          swatchColor: "#b0b0b0",
          heading: "Zanzibar Travel Insurance",
          bullets: [
            "Effective Oct. 1, 2024 - Required for ALL foreign visitors to the island of Zanzibar",
            "Insurance can ONLY be purchased from the Zanzibar Insurance Corp.",
            "Visit https://visitzanzibar.go.tz",
          ],
          qrCodeUrl: "https://visitzanzibar.go.tz",
        },
      ],
    },
  },
  {
    type: "weather",
    data: {
      pageNumber: 34,
      tables: [
        {
          title: "The Mainland Weather",
          seasons: [
            {
              name: "Summer",
              months: "Dec, Jan, Feb",
              tempF: "73.4°F - 84.2°F",
              tempC: "23°C - 29°C",
            },
            {
              name: "Fall",
              icon: "🌧️",
              months: "March, Apr, May",
              tempF: "68.0°F - 77.0°F",
              tempC: "20°C - 25°C",
            },
            {
              name: "Winter",
              months: "June, July, August",
              tempF: "62.6°F - 75.2°F",
              tempC: "17°C - 24°C",
            },
            {
              name: "Spring",
              months: "Sep, Oct, Nov",
              tempF: "69.8°F - 80.6°F",
              tempC: "21°C - 27°C",
            },
          ],
          note: "**Mainland Tanzania has a diverse climate due to its varying elevations. Coastal areas, like Dar es Salaam, are warm and humid year-round, while higher elevation regions, such as the Serengeti and Kilimanjaro, can be cooler, especially in the mornings and evenings. It's always wise to bring a jacket, as mornings tend to be chilly, but by noon, the temperatures warm up, and you'll find yourself shedding those extra layers. Whether you're on safari in the lowlands or exploring the mountains, the climate shifts can catch you by surprise, so it's best to be prepared!",
        },
        {
          title: "Zanzibar Weather",
          seasons: [
            {
              name: "Summer",
              months: "Dec, Jan, Feb",
              tempF: "79°F - 90°F",
              tempC: "26°C - 32°C",
            },
            {
              name: "Fall",
              icon: "🌧️",
              months: "March, Apr, May",
              tempF: "75°F - 86°F",
              tempC: "24°C - 30°C",
            },
            {
              name: "Winter",
              months: "June, July, August",
              tempF: "72°F - 82°F",
              tempC: "22°C - 28°C",
            },
            {
              name: "Spring",
              months: "Sep, Oct, Nov",
              tempF: "73°F - 86°F",
              tempC: "23°C - 30°C",
            },
          ],
          note: "**Zanzibar has a tropical climate, with warm temperatures throughout the year, making it an ideal destination no matter the season!",
        },
      ],
    },
  },
  ...paginateTermsConditions(
    { sections: termsSections, pageNumber: 0, showTitle: true },
    35
  ),
  {
    type: "thankYou",
    data: {
      message: "thank you",
      imageUrl: "https://picsum.photos/id/1044/600/1100",
      pageNumber: 39,
    },
  },
];

export const sampleProposalData: ProposalData = {
  sections: renumberSections(sections, 2),
};
