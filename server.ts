import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize server-side Gemini AI client safely using the instructions from the gemini-api skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Endpoint: Generate structured travel itineraries
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { destination, days, budget, vibe, companion } = req.body;

    if (!destination) {
      return res.status(400).json({ error: "Destination is required." });
    }

    const duration = days || 3;
    const prompt = `Generate a highly personalized, exquisite daily travel itinerary for a ${duration}-day trip to ${destination}.
Travel preferences:
- Budget Tier: ${budget || "Moderate"}
- Experience Vibe: ${vibe || "Curated Mix"}
- Companion Group: ${companion || "Solo travel"}

Make the activities vivid, interactive, and distinct. Provide local secrets, precise timings, and logical route flows. Ensure names are authentic and provide practical travel tips for each location.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master globetrotter, world-class luxury concierge, and local expert travel guide. Generate detailed, authentic itineraries customized to user preferences with specific local highlights.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
            description: { type: Type.STRING },
            bestSeason: { type: Type.STRING },
            totalEstimatedCost: { type: Type.STRING },
            packingEssentials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeOfDay: { type: Type.STRING }, // "Morning", "Afternoon", "Evening", "Night"
                        location: { type: Type.STRING },
                        activityName: { type: Type.STRING },
                        description: { type: Type.STRING },
                        tips: { type: Type.STRING },
                        cost: { type: Type.STRING },
                      },
                      required: ["timeOfDay", "location", "activityName", "description"],
                    },
                  },
                },
                required: ["dayNumber", "title", "activities"],
              },
            },
          },
          required: ["destination", "description", "bestSeason", "totalEstimatedCost", "packingEssentials", "days"],
        },
      },
    });

    const itineraryJson = response.text;
    if (!itineraryJson) {
      throw new Error("No itinerary generated from Gemini.");
    }

    res.json(JSON.parse(itineraryJson));
  } catch (error: any) {
    console.error("Error creating itinerary:", error);
    res.status(500).json({
      error: "Failed to generate travel itinerary. Please verify your Gemini API key in Settings > Secrets.",
      details: error.message,
    });
  }
});

// Endpoint: Refine random draft travel memories into a beautiful scrapbook card
app.post("/api/refine-travelogue", async (req, res) => {
  try {
    const { draftText, location } = req.body;

    if (!draftText) {
      return res.status(400).json({ error: "Draft memory content is required." });
    }

    const prompt = `Refine this raw, draft travel log memory entry into an evocative, beautiful, and narrative travel scrapbook entry.
Location Context: ${location || "Unknown Explorer Location"}
Raw Notes: "${draftText}"

Enhance the descriptions, add historical notes if applicable, and format it artistically. Advise on a specific visual 'vibe/style palette' describing custom color pairings.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a poetic travel writer, creative scrapbook artist, and visual designer. Convert messy draft notes into beautifully descriptive personal diary archives.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            refinedContent: { type: Type.STRING },
            postcardMood: { type: Type.STRING },
            travelQuote: { type: Type.STRING },
            customColorPrimary: { type: Type.STRING }, // e.g. "slate", "emerald", "amber", "rose", "sky"
            customColorSecondary: { type: Type.STRING },
          },
          required: ["title", "refinedContent", "postcardMood", "travelQuote", "customColorPrimary", "customColorSecondary"],
        },
      },
    });

    const travelogueJson = response.text;
    if (!travelogueJson) {
      throw new Error("No travelogue generated from Gemini.");
    }

    res.json(JSON.parse(travelogueJson));
  } catch (error: any) {
    console.error("Error refining travelogue:", error);
    res.status(500).json({
      error: "Failed to refine memory entry. Please check configuration settings.",
      details: error.message,
    });
  }
});

// Configure Vite integration
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    // Serve static files from React build directory
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res, next) => {
      // Don't intercept /api routes
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    // Integrate Vite in Middleware mode to serve client code on port 3000
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting full-stack server:", err);
});
