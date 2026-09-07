import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Endpoint: Generate structured travel itineraries
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, days, budget, vibe, companion } = req.body;

    if (!destination) {
      return res.status(400).json({ error: "Destination is required." });
    }

    const duration = days || 3;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a master globetrotter, world-class luxury concierge, and local expert travel guide. Generate detailed, authentic itineraries customized to user preferences with specific local highlights.

Always respond with valid JSON matching exactly this structure:
{
  "destination": "string",
  "description": "string",
  "bestSeason": "string",
  "totalEstimatedCost": "string",
  "cities": ["string"],
  "budgetBreakdown": {
    "accommodation": "string",
    "flightTransit": "string",
    "dining": "string",
    "activities": "string"
  },
  "packingEssentials": ["string"],
  "gearByCategory": {
    "Clothing": ["string"],
    "Electronics": ["string"],
    "Documents": ["string"],
    "Toiletries": ["string"],
    "Health & Safety": ["string"],
    "Outdoor & Adventure": ["string"]
  },
  "hotels": [
    {
      "name": "string",
      "type": "string",
      "priceRange": "string",
      "city": "string",
      "highlight": "string"
    }
  ],
  "restaurants": [
    {
      "name": "string",
      "cuisine": "string",
      "priceRange": "string",
      "city": "string",
      "mustTry": "string"
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "city": "string",
      "title": "string",
      "activities": [
        {
          "timeOfDay": "Morning|Afternoon|Evening|Night",
          "location": "string",
          "activityName": "string",
          "description": "string",
          "tips": "string",
          "cost": "string"
        }
      ]
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Generate a highly personalized, exquisite daily travel itinerary for a ${duration}-day trip to ${destination}.

If the destination includes multiple cities (e.g. "Italy — Rome, Vatican, Lake Como"), distribute the days logically across all cities, set "cities" to list each city, and add a "city" field to each day. For single-city trips set "cities" to that one city.

Travel preferences:
- Budget Tier: ${budget || "Moderate"}
- Experience Vibe: ${vibe || "Curated Mix"}
- Companion Group: ${companion || "Solo travel"}

Make the activities vivid, interactive, and distinct. Provide local secrets, precise timings, and logical route flows. Ensure names are authentic and provide practical travel tips for each location. Include 3-4 activities per day.

For hotels: recommend 2-3 options per city at different price points (budget/mid/luxury).
For restaurants: recommend 3-4 notable dining spots per city with diverse cuisine styles. Include the must-try dish.
For gearByCategory: tailor suggestions specifically to this destination's climate, terrain, culture, and planned activities.
For budgetBreakdown: provide realistic per-category cost ranges (e.g. "$400-600") for the full trip duration.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    });

    const itineraryJson = completion.choices[0]?.message?.content;
    if (!itineraryJson) {
      throw new Error("No itinerary generated.");
    }

    res.json(JSON.parse(itineraryJson));
  } catch (error: any) {
    console.error("Error creating itinerary:", error);
    res.status(500).json({
      error: "Failed to generate travel itinerary. Please check your GROQ_API_KEY.",
      details: error.message,
    });
  }
});

// Endpoint: Refine draft travel memories into a beautiful scrapbook card
app.post("/api/refine-travelogue", async (req, res) => {
  try {
    const { draftText, location } = req.body;

    if (!draftText) {
      return res.status(400).json({ error: "Draft memory content is required." });
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a poetic travel writer, creative scrapbook artist, and visual designer. Convert messy draft notes into beautifully descriptive personal diary archives.

Always respond with valid JSON matching exactly this structure:
{
  "title": "string",
  "refinedContent": "string",
  "postcardMood": "string",
  "travelQuote": "string",
  "customColorPrimary": "amber|rose|emerald|sky|indigo|slate",
  "customColorSecondary": "amber|rose|emerald|sky|indigo|slate"
}`,
        },
        {
          role: "user",
          content: `Refine this raw, draft travel log memory entry into an evocative, beautiful, and narrative travel scrapbook entry.
Location Context: ${location || "Unknown Explorer Location"}
Raw Notes: "${draftText}"

Enhance the descriptions, add historical notes if applicable, and format it artistically. Advise on a specific visual vibe/style palette describing custom color pairings.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 1024,
    });

    const travelogueJson = completion.choices[0]?.message?.content;
    if (!travelogueJson) {
      throw new Error("No travelogue generated.");
    }

    res.json(JSON.parse(travelogueJson));
  } catch (error: any) {
    console.error("Error refining travelogue:", error);
    res.status(500).json({
      error: "Failed to refine memory entry. Please check your GROQ_API_KEY.",
      details: error.message,
    });
  }
});

// Configure Vite integration
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});
