console.log("🔥 seedProfiles.js loaded");
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Profile from "../models/Profile.js";

const MONGODB_URI = process.env.MONGODB_URI;

const seedProfiles = [
  {
    name: "Aarav",
    email: "seed+aarav@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 24,
    bio: "Coffee dates, road trips and conversations that go way too deep ☕",
    description:
      "I like discovering new cafés, spontaneous drives and meeting people who can make me laugh.",
    interests: ["Coffee", "Travel", "Music", "Food", "Photography"],
    datingIntention: "Something serious",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900",
    ],
    prompts: [
      {
        question: "A perfect weekend looks like",
        answer: "A long drive, good food and absolutely no fixed plans.",
      },
    ],
    verified: true,
    latOffset: 0.008,
    lngOffset: 0.006,
    activeHoursAgo: 1,
  },

  {
    name: "Riya",
    email: "seed+riya@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 23,
    bio: "Books, beaches and finding underrated cafés 🌙",
    description:
      "Usually planning my next trip or looking for a new place to eat.",
    interests: ["Books", "Travel", "Coffee", "Movies", "Food"],
    datingIntention: "Long-term relationship",
    photos: [
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900",
      "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900",
    ],
    prompts: [
      {
        question: "My simple pleasure",
        answer: "Finding a cute café and staying there way longer than planned ☕",
      },
    ],
    verified: true,
    latOffset: 0.012,
    lngOffset: 0.004,
    activeHoursAgo: 2,
  },

  {
    name: "Kabir",
    email: "seed+kabir@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 26,
    bio: "Gym, playlists and weekend escapes 🎧",
    description:
      "Product guy by day, amateur photographer by weekend.",
    interests: ["Fitness", "Music", "Photography", "Travel", "Movies"],
    datingIntention: "Something serious",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900",
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=900",
    ],
    prompts: [
      {
        question: "You should message me if",
        answer: "You have a playlist recommendation better than mine.",
      },
    ],
    verified: true,
    latOffset: -0.01,
    lngOffset: 0.012,
    activeHoursAgo: 3,
  },

  {
    name: "Sofia",
    email: "seed+sofia@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 22,
    bio: "Music lover • sunsets • spontaneous plans ✨",
    description:
      "I love live music, sunset walks and people who don't take themselves too seriously.",
    interests: ["Music", "Travel", "Coffee", "Photography", "Fitness"],
    datingIntention: "Something casual",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900",
    ],
    prompts: [
      {
        question: "My most random talent",
        answer: "I can remember lyrics after hearing a song once.",
      },
    ],
    verified: false,
    latOffset: -0.014,
    lngOffset: 0.008,
    activeHoursAgo: 4,
  },

  {
    name: "Dev",
    email: "seed+dev@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 25,
    bio: "Movies, midnight food runs and terrible jokes 🎬",
    description:
      "Looking for someone who enjoys random plans and doesn't mind sharing fries.",
    interests: ["Movies", "Food", "Music", "Coffee", "Travel"],
    datingIntention: "New connections",
    photos: [
      "https://images.unsplash.com/photo-1504593811423-6ae8c1d7e6b8?w=900",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900",
    ],
    prompts: [
      {
        question: "Together we could",
        answer: "Find the best street food in the city.",
      },
    ],
    verified: true,
    latOffset: 0.018,
    lngOffset: -0.009,
    activeHoursAgo: 5,
  },

  {
    name: "Ananya",
    email: "seed+ananya@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 24,
    bio: "Travel plans are always better when they're spontaneous ✈️",
    description:
      "Big fan of beaches, good conversations and discovering hidden places.",
    interests: ["Travel", "Food", "Photography", "Music", "Books"],
    datingIntention: "Something serious",
    photos: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900",
    ],
    prompts: [
      {
        question: "A perfect weekend looks like",
        answer: "Somewhere new with a camera and zero itinerary.",
      },
    ],
    verified: true,
    latOffset: 0.021,
    lngOffset: 0.003,
    activeHoursAgo: 6,
  },

  {
    name: "Arjun",
    email: "seed+arjun@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 27,
    bio: "Fitness, food and finding reasons to travel 🏋️",
    description:
      "I enjoy morning workouts, great food and conversations that don't feel forced.",
    interests: ["Fitness", "Food", "Travel", "Coffee", "Movies"],
    datingIntention: "Long-term relationship",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900",
    ],
    prompts: [
      {
        question: "The way to my heart is",
        answer: "Good food and remembering my coffee order.",
      },
    ],
    verified: true,
    latOffset: -0.022,
    lngOffset: -0.006,
    activeHoursAgo: 8,
  },

  {
    name: "Meera",
    email: "seed+meera@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 25,
    bio: "Sunsets, playlists and conversations after midnight 🌙",
    description:
      "Somewhere between introvert and spontaneous-adventure enthusiast.",
    interests: ["Music", "Movies", "Coffee", "Books", "Travel"],
    datingIntention: "Figuring it out",
    photos: [
      "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=900",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900",
    ],
    prompts: [
      {
        question: "My simple pleasure",
        answer: "Headphones on, city lights outside and a good playlist.",
      },
    ],
    verified: false,
    latOffset: -0.027,
    lngOffset: 0.014,
    activeHoursAgo: 10,
  },

  {
    name: "Vihaan",
    email: "seed+vihaan@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 23,
    bio: "Photographer looking for someone to steal sunsets with 📸",
    description:
      "I collect photographs, playlists and stories from random people.",
    interests: ["Photography", "Travel", "Music", "Coffee", "Books"],
    datingIntention: "New connections",
    photos: [
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=900",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900",
    ],
    prompts: [
      {
        question: "You should message me if",
        answer: "You know a hidden photo spot nobody talks about.",
      },
    ],
    verified: true,
    latOffset: 0.03,
    lngOffset: 0.018,
    activeHoursAgo: 12,
  },

  {
    name: "Ishita",
    email: "seed+ishita@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 23,
    bio: "Foodie with a very serious dessert problem 🍰",
    description:
      "Give me good food, a fun conversation and I'm probably happy.",
    interests: ["Food", "Coffee", "Movies", "Travel", "Fitness"],
    datingIntention: "Something casual",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900",
    ],
    prompts: [
      {
        question: "Together we could",
        answer: "Try every dessert place we can find.",
      },
    ],
    verified: true,
    latOffset: 0.034,
    lngOffset: -0.012,
    activeHoursAgo: 15,
  },

  {
    name: "Rohan",
    email: "seed+rohan@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 28,
    bio: "Engineer who spends too much time planning weekend trips.",
    description:
      "I like hiking, coffee shops and conversations that turn into hours.",
    interests: ["Travel", "Fitness", "Coffee", "Photography", "Food"],
    datingIntention: "Something serious",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900",
    ],
    prompts: [
      {
        question: "A perfect weekend looks like",
        answer: "A short road trip and finding a great local restaurant.",
      },
    ],
    verified: true,
    latOffset: -0.038,
    lngOffset: 0.02,
    activeHoursAgo: 18,
  },

  {
    name: "Tanya",
    email: "seed+tanya@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 26,
    bio: "Movie nights, travel stories and lots of coffee ☕",
    description:
      "I enjoy discovering new movies and talking about them way too much.",
    interests: ["Movies", "Coffee", "Travel", "Music", "Food"],
    datingIntention: "Something serious",
    photos: [
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900",
    ],
    prompts: [
      {
        question: "My most random talent",
        answer: "Guessing movie endings way too early.",
      },
    ],
    verified: true,
    latOffset: 0.042,
    lngOffset: 0.015,
    activeHoursAgo: 20,
  },

  {
    name: "Aditya",
    email: "seed+aditya@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 24,
    bio: "Music on, notifications off 🎧",
    description:
      "Always looking for a new artist, a new café or a new place to explore.",
    interests: ["Music", "Coffee", "Travel", "Movies", "Books"],
    datingIntention: "Something casual",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900",
      "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=900",
    ],
    prompts: [
      {
        question: "You should message me if",
        answer: "You send music recommendations instead of just saying hey.",
      },
    ],
    verified: false,
    latOffset: -0.046,
    lngOffset: -0.02,
    activeHoursAgo: 24,
  },

  {
    name: "Naina",
    email: "seed+naina@vibe.test",
    gender: "Woman",
    interestedIn: "Men",
    age: 22,
    bio: "Books, chai and conversations that accidentally last all night 📚",
    description:
      "Quiet at first, but give me a good topic and we're probably talking for hours.",
    interests: ["Books", "Coffee", "Music", "Movies", "Food"],
    datingIntention: "Long-term relationship",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900",
      "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900",
    ],
    prompts: [
      {
        question: "My simple pleasure",
        answer: "A rainy evening with chai and a really good book.",
      },
    ],
    verified: true,
    latOffset: 0.052,
    lngOffset: 0.009,
    activeHoursAgo: 30,
  },

  {
    name: "Karan",
    email: "seed+karan@vibe.test",
    gender: "Man",
    interestedIn: "Women",
    age: 25,
    bio: "Weekend explorer. Professional overthinker. Amateur cook 🍜",
    description:
      "Trying to become better at cooking and worse at overthinking.",
    interests: ["Food", "Travel", "Music", "Fitness", "Movies"],
    datingIntention: "Figuring it out",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900",
    ],
    prompts: [
      {
        question: "Together we could",
        answer: "Attempt a complicated recipe and order pizza halfway through.",
      },
    ],
    verified: true,
    latOffset: -0.058,
    lngOffset: 0.026,
    activeHoursAgo: 36,
  },
];

const getBirthdayFromAge = (age) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  date.setMonth(date.getMonth() - 4);
  date.setDate(15);
  return date;
};

const seed = async () => {
      console.log("🔥 seed() started");


if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in server/.env");
}

await mongoose.connect(MONGODB_URI);

  console.log("MongoDB connected for seeding.");

  // Only remove our own test accounts.
  const existingSeedUsers = await User.find({
    email: /^seed\+.*@vibe\.test$/,
  }).select("_id");

  const existingSeedUserIds = existingSeedUsers.map((user) => user._id);

  if (existingSeedUserIds.length > 0) {
    await Profile.deleteMany({
      user: { $in: existingSeedUserIds },
    });

    await User.deleteMany({
      _id: { $in: existingSeedUserIds },
    });

    console.log(`Removed ${existingSeedUserIds.length} old seed users.`);
  }

  const passwordHash = await bcrypt.hash("Vibe123456", 12);

  // Approximate center used ONLY for development test locations.
  // Exact coordinates are never returned by the public profile API.
  const baseLatitude = 26.8467;
  const baseLongitude = 80.9462;

  for (const person of seedProfiles) {
    const user = await User.create({
      name: person.name,
      email: person.email,
      password: passwordHash,
      isEmailVerified: true,
      profileCompleted: true,
    });

    const lastActiveAt = new Date(
      Date.now() - person.activeHoursAgo * 60 * 60 * 1000
    );

    await Profile.create({
      user: user._id,
      dateOfBirth: getBirthdayFromAge(person.age),
      gender: person.gender,
      interestedIn: person.interestedIn,
      bio: person.bio,
      description: person.description,
      interests: person.interests,
      photos: person.photos,
      datingIntention: person.datingIntention,
      prompts: person.prompts,
      location: {
        latitude: baseLatitude + person.latOffset,
        longitude: baseLongitude + person.lngOffset,
      },
      isVerified: person.verified,
      lastActiveAt,
      isDiscoverable: true,
    });

    console.log(`✓ Seeded ${person.name}`);
  }

  console.log("");
  console.log("======================================");
  console.log("VIBE TEST DATA SEEDED SUCCESSFULLY 🚀");
  console.log("======================================");
  console.log(`Profiles created: ${seedProfiles.length}`);
  console.log("");
  console.log("Test login password:");
  console.log("Vibe123456");
  console.log("");
  console.log("Seed emails:");
  console.log("seed+riya@vibe.test");
  console.log("seed+ananya@vibe.test");
  console.log("seed+sofia@vibe.test");
  console.log("seed+meera@vibe.test");
  console.log("seed+ishita@vibe.test");
  console.log("seed+naina@vibe.test");
  console.log("...");
  console.log("");

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});