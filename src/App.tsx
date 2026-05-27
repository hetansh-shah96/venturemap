import React, { useState, useEffect } from "react";
import {
  Compass,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  CheckSquare,
  Plus,
  Trash2,
  Camera,
  Sparkles,
  Clock,
  ArrowRight,
  Sun,
  BookOpen,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Heart,
  Plane,
  Coins,
  Luggage,
  Map
} from "lucide-react";
import WishlistMap from "./WishlistMap";

// Pre-defined high-resolution Unsplash hotlinks for stunning visual impact
interface CuratedDestination {
  id: string;
  city: string;
  country: string;
  image: string;
  vibe: string;
  season: string;
  description: string;
  budget: string;
}

const curatedDestinations: CuratedDestination[] = [
  {
    id: "dest-1",
    city: "Tokyo",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&q=80&w=800",
    vibe: "Neon Futurism & Cherry Blossoms",
    season: "Spring / Autumn",
    description: "Witness the exquisite synthesis of ancient temples, electric nightlife, and world-leading culinary wonders.",
    budget: "Moderate to Premium",
  },
  {
    id: "dest-2",
    city: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800",
    vibe: "Art, Romance & Café Culture",
    season: "Late Spring / Autumn",
    description: "Stroll along historic boulevards, explore world-renowned galleries, and indulge in gourmet patisserie at sunset.",
    budget: "Premium",
  },
  {
    id: "dest-3",
    city: "Bali",
    country: "Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800",
    vibe: "Tropical Relaxation & Ancient Shrines",
    season: "Dry Season (May - Sep)",
    description: "Breathe in volcanic vistas, unwind on pristine beaches, and hike through emerald rice terraces decorated by waterfalls.",
    budget: "Budget Friendly",
  },
  {
    id: "dest-4",
    city: "Rome",
    country: "Italy",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800",
    vibe: "Baroque Art & Imperial Vistas",
    season: "Spring / Early Summer",
    description: "Immerse yourself directly in living history, throw coins in the Trevi Fountain, and savor handmade pasta in cozy trastevere piazzas.",
    budget: "Moderate",
  },
  {
    id: "dest-5",
    city: "New York",
    country: "United States",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800",
    vibe: "High Energy Skylines & Playhouses",
    season: "Autumn / Christmas Season",
    description: "Stand amidst towering skyscrapers, grab authentic street bagels, and explore quiet pockets of Central Park.",
    budget: "Premium",
  },
  {
    id: "dest-6",
    city: "Cape Town",
    country: "South Africa",
    image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&q=80&w=800",
    vibe: "Coastal Mountains & Wine Tasting",
    season: "Summer (Nov - Feb)",
    description: "Scale iconic Table Mountain, take photos with Boulder Beach penguins, and savor award-winning vintage wines.",
    budget: "Moderate",
  },
];

// Helper for local storage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage write failed:", e);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"wishlist" | "explore" | "planner" | "checklist" | "album">("wishlist");

  // State: Travel Planner
  const [plannerDestination, setPlannerDestination] = useState("");
  const [plannerDays, setPlannerDays] = useState(3);
  const [plannerBudget, setPlannerBudget] = useState("Moderate");
  const [plannerVibe, setPlannerVibe] = useState("Balanced Mix");
  const [plannerCompanion, setPlannerCompanion] = useState("Solo Traveller");

  const [isGenerating, setIsGenerating] = useState(false);
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [generatedItinerary, setGeneratedItinerary] = useState<any | null>(() => loadFromStorage("venture_current_itinerary", null));
  const [savedItineraries, setSavedItineraries] = useState<any[]>(() => loadFromStorage("venture_saved_itineraries", []));

  // State: Packing list
  const [packingItems, setPackingItems] = useState<any[]>(() => loadFromStorage("venture_packing_items", [
    { id: "p-1", text: "Passport & Visas", category: "Documents", checked: true },
    { id: "p-2", text: "Universal Power Adapter", category: "Electronics", checked: false },
    { id: "p-3", text: "Multi-use walking shoes", category: "Clothing", checked: false },
    { id: "p-4", text: "Toiletry travel liquids package", category: "Toiletries", checked: false },
    { id: "p-5", text: "Cash & International card copies", category: "Documents", checked: false },
  ]));
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Clothing");

  // State: Budget Planner
  const [expenses, setExpenses] = useState<any[]>(() => loadFromStorage("venture_expenses", [
    { id: "e-1", category: "Accommodation", amount: 450, note: "Hotel booking" },
    { id: "e-2", category: "Flight / Transit", amount: 650, note: "Round-trip flights" },
    { id: "e-3", category: "Dining", amount: 180, note: "Street food & dinners" },
    { id: "e-4", category: "Activities", amount: 120, note: "Museum passes & city tour" },
  ]));
  const [newExpenseCategory, setNewExpenseCategory] = useState("Accommodation");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseNote, setNewExpenseNote] = useState("");

  // State: Exploration Scrapbook / Diary
  const [albumDraft, setAlbumDraft] = useState("");
  const [albumLocation, setAlbumLocation] = useState("");
  const [isRefiningAlbum, setIsRefiningAlbum] = useState(false);
  const [albumLogs, setAlbumLogs] = useState<any[]>(() => loadFromStorage("venture_album_logs", [
    {
      id: "log-1",
      title: "First Light in Kyoto Gion",
      location: "Kyoto, Japan",
      refinedContent: "The dawn over the Gion district was quiet, broken only by the rhythmic wooden clack of Geta sandals on the cobblestone walkway. Mist floated above the canal as centuries-old machiya townhouses began waking up. Stumbling upon an ancient wooden bridge, I watched golden light filter slowly through wet willow leaves, breathing in cool air accented by the faint aroma of freshly toasted green tea.",
      postcardMood: "Warm vintage sunrise, historic streets, soft gold and matcha wash colors",
      travelQuote: "We travel not to escape life, but for life not to escape us.",
      customColorPrimary: "amber",
      customColorSecondary: "emerald",
      createdAt: "2026-05-25T08:00:00Z"
    },
    {
      id: "log-2",
      title: "Parisienne Sunset Over the Seine",
      location: "Paris, France",
      refinedContent: "As the sun dipped behind the Pont des Arts, the entire sky turned a luminous strawberry cream. We sat on the warm stone ledge of the Seine with a fresh baguette, salted butter, and high-altitude cider from Normandy. Musicians played jazz accordion, their notes weaving into the low-humming buzz of dusk boat tours drifting underneath.",
      postcardMood: "Hazy dusk romantic purple, vintage film grain, warm strawberry hues",
      travelQuote: "Paris is always a good idea.",
      customColorPrimary: "rose",
      customColorSecondary: "indigo",
      createdAt: "2026-05-26T10:00:00Z"
    }
  ]));

  // Active state handlers
  useEffect(() => {
    saveToStorage("venture_current_itinerary", generatedItinerary);
  }, [generatedItinerary]);

  useEffect(() => {
    saveToStorage("venture_saved_itineraries", savedItineraries);
  }, [savedItineraries]);

  useEffect(() => {
    saveToStorage("venture_packing_items", packingItems);
  }, [packingItems]);

  useEffect(() => {
    saveToStorage("venture_expenses", expenses);
  }, [expenses]);

  useEffect(() => {
    saveToStorage("venture_album_logs", albumLogs);
  }, [albumLogs]);

  // Request Itinerary to Backend
  const handleGenerateItinerary = async (destInput?: string) => {
    const destination = destInput || plannerDestination;
    if (!destination.trim()) {
      setPlannerError("Please provide a destination city to travel to!");
      return;
    }

    setPlannerError(null);
    setIsGenerating(true);
    // Switch to planner view automatically on triggers
    setActiveTab("planner");

    try {
      const resp = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: plannerDays,
          budget: plannerBudget,
          vibe: plannerVibe,
          companion: plannerCompanion,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.details || errData.error || "Itinerary fetch failed.");
      }

      const decoded = await resp.json();
      setGeneratedItinerary(decoded);
    } catch (err: any) {
      console.error(err);
      setPlannerError(err.message || "Something went wrong generating your trip.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCurrentItinerary = () => {
    if (!generatedItinerary) return;
    // Check if already saved
    if (savedItineraries.some((item) => item.destination === generatedItinerary.destination && item.days.length === generatedItinerary.days.length)) {
      alert("This itinerary is already safe in your Travel Archive!");
      return;
    }
    const updated = [generatedItinerary, ...savedItineraries];
    setSavedItineraries(updated);
    alert(`Successfully archived travel to ${generatedItinerary.destination}!`);
  };

  const deleteSavedItinerary = (index: number) => {
    const updated = [...savedItineraries];
    updated.splice(index, 1);
    setSavedItineraries(updated);
  };

  // Add Item to Packing Checkbox List
  const handleAddPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const addedItem = {
      id: "p-" + Date.now(),
      text: newItemText.trim(),
      category: newItemCategory,
      checked: false,
    };
    setPackingItems([...packingItems, addedItem]);
    setNewItemText("");
  };

  const togglePackingItem = (id: string) => {
    const updated = packingItems.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setPackingItems(updated);
  };

  const removePackingItem = (id: string) => {
    setPackingItems(packingItems.filter((item) => item.id !== id));
  };

  // Generate customized AI items based on itinerary
  const injectAIRecommendedPacking = () => {
    if (!generatedItinerary) {
      alert("Generate an AI Itinerary first to get smart recommendations!");
      return;
    }
    const additions = generatedItinerary.packingEssentials.map((text: string, index: number) => ({
      id: `p-ai-${Date.now()}-${index}`,
      text: `${text} (AI Pick)`,
      category: "AI Suggestions",
      checked: false,
    }));
    setPackingItems([...packingItems, ...additions]);
    alert("Injected smart items based on destination and activities!");
  };

  // Expenses management
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please provide a valid spent amount.");
      return;
    }
    const newExp = {
      id: "e-" + Date.now(),
      category: newExpenseCategory,
      amount: amountNum,
      note: newExpenseNote.trim() || `${newExpenseCategory} Cost`,
    };
    setExpenses([...expenses, newExp]);
    setNewExpenseAmount("");
    setNewExpenseNote("");
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // Scrapbook diary poet refinement
  const handleRefineLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumDraft.trim()) {
      alert("Provide some quick draft vibes first!");
      return;
    }
    setIsRefiningAlbum(true);
    try {
      const response = await fetch("/api/refine-travelogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftText: albumDraft,
          location: albumLocation,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not connect with creative copywriters.");
      }

      const refined = await response.json();
      const newLog = {
        id: "log-" + Date.now(),
        title: refined.title,
        location: albumLocation || "Unmapped World",
        refinedContent: refined.refinedContent,
        postcardMood: refined.postcardMood,
        travelQuote: refined.travelQuote,
        customColorPrimary: refined.customColorPrimary || "amber",
        customColorSecondary: refined.customColorSecondary || "slate",
        createdAt: new Date().toISOString(),
      };
      setAlbumLogs([newLog, ...albumLogs]);
      setAlbumDraft("");
      setAlbumLocation("");
      alert("Refined beautifully! Scroll down to see your new postcard journal.");
    } catch (err: any) {
      alert("Failed to refine diary entries: " + err.message);
    } finally {
      setIsRefiningAlbum(false);
    }
  };

  const deleteAlbumLog = (id: string) => {
    setAlbumLogs(albumLogs.filter((log) => log.id !== id));
  };

  // Aggregation computations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseByCategory = expenses.reduce((map: any, e) => {
    map[e.category] = (map[e.category] || 0) + e.amount;
    return map;
  }, {});

  // Prepopulate form when curated card is clicked
  const handlePrepopulate = (dest: CuratedDestination) => {
    setPlannerDestination(`${dest.city}, ${dest.country}`);
    setPlannerVibe(dest.vibe);
    setPlannerDays(3);
    handleGenerateItinerary(`${dest.city}, ${dest.country}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#F4F4F1]" id="main-travel-app">
      
      {/* Top Banner Alert / Artistic Vol. Number */}
      <div className="bg-[#1A1A1A] text-[#F4F4F1] text-[10px] tracking-[0.3em] uppercase py-2 px-6 flex justify-between items-center font-mono">
        <span>VentureMap® Archive // Vol. 004</span>
        <span className="hidden sm:inline">Zurich - Tokyo - Paris Symmetries</span>
      </div>

      {/* Visual Header / Navigation Block */}
      <header className="sticky top-0 z-40 bg-[#F4F4F1]/95 backdrop-blur-md border-b border-[#1A1A1A] py-6 px-6 md:px-12 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 border border-[#1A1A1A] flex items-center justify-center font-bold text-xs bg-[#EAEAE5] shadow-inner">
            VM
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-[#1A1A1A] font-serif flex items-center gap-2">
              VENTUREMAP™ <span className="text-[9px] font-sans tracking-[0.25em] bg-[#1A1A1A] text-[#F4F4F1] px-1.5 py-0.5 uppercase font-bold">Artistic Edition</span>
            </h1>
            <p className="text-[9px] text-[#1A1A1A]/60 font-sans tracking-widest font-bold uppercase mt-0.5">Automated Daily Itineraries & Vibe Scrapbooks</p>
          </div>
        </div>

        {/* Tab Selection */}
        <nav className="flex flex-wrap items-center bg-transparent border border-[#1A1A1A] p-0 rounded-none">
          <button
            id="tab-btn-wishlist"
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center gap-1.5 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-r border-[#1A1A1A] last:border-0 ${
              activeTab === "wishlist"
                ? "bg-[#1A1A1A] text-[#F4F4F1]"
                : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Wishlist
          </button>
          <button
            id="tab-btn-explore"
            onClick={() => setActiveTab("explore")}
            className={`flex items-center gap-1.5 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-r border-[#1A1A1A] last:border-0 ${
              activeTab === "explore"
                ? "bg-[#1A1A1A] text-[#F4F4F1]"
                : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Explore
          </button>
          <button
            id="tab-btn-planner"
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-1.5 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-r border-[#1A1A1A] last:border-0 ${
              activeTab === "planner"
                ? "bg-[#1A1A1A] text-[#F4F4F1]"
                : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Itineraries
          </button>
          <button
            id="tab-btn-checklist"
            onClick={() => setActiveTab("checklist")}
            className={`flex items-center gap-1.5 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all border-r border-[#1A1A1A] last:border-0 ${
              activeTab === "checklist"
                ? "bg-[#1A1A1A] text-[#F4F4F1]"
                : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Gear & Pocket
          </button>
          <button
            id="tab-btn-album"
            onClick={() => setActiveTab("album")}
            className={`flex items-center gap-1.5 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
              activeTab === "album"
                ? "bg-[#1A1A1A] text-[#F4F4F1]"
                : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Vibe Diary
          </button>
        </nav>
      </header>

      {/* Main Content Areas */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
        {/* SECTION 0: Travel Wishlist Map */}
        {activeTab === "wishlist" && (
          <div className="space-y-6" id="section-wishlist">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#1A1A1A] pb-4">
              <div>
                <h2 className="serif text-3xl font-light text-[#1A1A1A]">
                  <span className="italic">Our</span> Travel Wishlist
                </h2>
                <p className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-[0.05em] mt-1">
                  Every place we dream of together — pin it, track it, check it off
                </p>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-[#1A1A1A] bg-[#EAEAE5] px-3 py-1.5 border border-[#1A1A1A] uppercase tracking-[0.1em]">
                <Heart className="w-3 h-3 text-rose-600" /> Saved locally on your device
              </div>
            </div>
            <WishlistMap />
          </div>
        )}

             {/* SECTION 1: Curated Destinations & Inspire */}
        {activeTab === "explore" && (
          <div className="space-y-12" id="section-explore">
            
            {/* Architectural Layout: Asymmetrical split Hero Frame */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#1A1A1A] bg-[#EAEAE5] divide-y lg:divide-y-0 lg:divide-x divide-[#1A1A1A] overflow-hidden">
              <div className="lg:col-span-8 p-8 md:p-12 flex flex-col justify-between relative bg-cover bg-center min-h-[420px]" style={{ backgroundImage: "linear-gradient(rgba(244, 244, 241, 0.90), rgba(244, 244, 241, 0.92)), url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1200')" }}>
                <div className="space-y-6">
                  <div className="inline-block border border-[#1A1A1A] px-3 py-1 bg-[#1A1A1A] text-[#F4F4F1] text-[9px] font-bold tracking-[0.25em] uppercase">
                    Wanderlust Engine Ready
                  </div>
                  <h2 className="serif text-5xl md:text-7xl font-light leading-[1.0] text-[#1A1A1A]">
                    <span className="italic">Where should</span> <br/>
                    your mind travel next?
                  </h2>
                  <p className="text-xs leading-relaxed text-[#1A1A1A]/70 max-w-lg tracking-wide">
                    An exploration of symmetrical structures and daily travel paths. Design intricate hourly itineraries, formulate packing lists based on actual logistics, and craft poetic journal memories instantly.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#1A1A1A]/10 flex flex-col sm:flex-row gap-3 max-w-md w-full">
                  <input
                    type="text"
                    placeholder="Enter city (e.g. Barcelona, Kyoto...)"
                    value={plannerDestination}
                    onChange={(e) => setPlannerDestination(e.target.value)}
                    className="bg-[#F4F4F1] border border-[#1A1A1A] rounded-none px-4 py-3 text-xs focus:outline-none focus:bg-white text-[#1A1A1A] placeholder-[#1A1A1A]/40 flex-1 uppercase tracking-[0.05em]"
                  />
                  <button
                    onClick={() => handleGenerateItinerary()}
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#F4F4F1] font-bold text-[10px] uppercase tracking-[0.2em] px-8 py-3 transition-all duration-300 rounded-none flex items-center justify-center gap-2"
                  >
                    Build <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 p-8 md:p-12 flex flex-col justify-between bg-[#F4F4F1]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#1A1A1A]/10">
                    <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#1A1A1A]">Live AI Highlight</span>
                  </div>
                  <p className="serif italic text-sm text-[#1A1A1A]/80 leading-relaxed pt-2">
                    &ldquo;Spring and early autumn offer a divine temperature balance across northern hemisphere capitals. Rome is radiant, Tokyo enters cherry blossom or foliage peak, and Bali's dry trade winds have arrived.&rdquo;
                  </p>
                </div>
                <div className="text-[9px] font-mono text-[#1A1A1A]/50 pt-6 border-t border-[#1A1A1A]/10 space-y-1">
                  <div className="flex justify-between">
                    <span>ARCHIVE COGNITION:</span>
                    <span>STABLE SEASONAL TRAVEL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ENGINE INGRESS:</span>
                    <span>GROQ LLAMA 3.3 70B</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Curated List */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#1A1A1A] pb-4">
                <div>
                  <h3 className="serif text-3xl font-light text-[#1A1A1A]"><span className="italic">Curated</span> Global Symmetries</h3>
                  <p className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-[0.05em] mt-1">One-click to instantly populate and run the AI itinerary builder for these cities</p>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-[#1A1A1A] bg-[#EAEAE5] px-3 py-1.5 border border-[#1A1A1A] uppercase tracking-[0.1em]">
                  <Filter className="w-3 h-3" /> High-Resolution Photography Enabled
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {curatedDestinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="bg-[#EAEAE5] border border-[#1A1A1A] rounded-none overflow-hidden hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group"
                    id={`curated-${dest.city.toLowerCase()}`}
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="relative h-60 overflow-hidden bg-[#1A1A1A] border-b border-[#1A1A1A]">
                        <img
                          src={dest.image}
                          alt={`${dest.city}, ${dest.country}`}
                          className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-4 right-4 bg-[#F4F4F1] border border-[#1A1A1A] px-3 py-1 text-[9px] font-bold text-[#1A1A1A] tracking-wider uppercase">
                          {dest.city}
                        </div>
                        <div className="absolute bottom-4 left-4 bg-[#1A1A1A] text-[#F4F4F1] px-3 py-1.5 text-[9px] font-mono tracking-widest uppercase">
                          {dest.vibe}
                        </div>
                      </div>

                      {/* Content panel */}
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center text-[9px] font-mono text-[#1A1A1A]/60 uppercase tracking-widest">
                          <span>{dest.season}</span>
                          <span className="border-l border-[#1A1A1A]/10 pl-2">{dest.budget}</span>
                        </div>
                        <h4 className="serif text-2xl font-light text-[#1A1A1A] leading-tight">
                          {dest.city}, <span className="italic">{dest.country}</span>
                        </h4>
                        <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-sans tracking-wide">
                          {dest.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <button
                        onClick={() => handlePrepopulate(dest)}
                        className="w-full border border-[#1A1A1A] bg-[#1A1A1A] hover:bg-transparent hover:text-[#1A1A1A] text-[#F4F4F1] font-bold py-3 px-4 text-[10px] uppercase tracking-[0.2em] transition-all rounded-none flex items-center justify-center gap-2"
                      >
                        Enter Archive <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Travel Coach Corner Styled like brutalist placard layouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 border border-[#1A1A1A] divide-y md:divide-y-0 md:divide-x divide-[#1A1A1A] bg-[#F4F4F1]">
              <div className="p-8 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 border border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] bg-[#EAEAE5]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="serif uppercase text-xs font-bold tracking-[0.1em] text-[#1A1A1A]">01. Packing Principle</h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed tracking-wide">
                    Packing light is a modernist necessity. It allows unmatched travel flexibility, keeping logistical weights minimal during suburban transit movements.
                  </p>
                </div>
                <div className="h-[1px] bg-[#1A1A1A]/10 mt-4"></div>
              </div>

              <div className="p-8 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 border border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] bg-[#EAEAE5]">
                    <Coins className="w-4 h-4" />
                  </div>
                  <h4 className="serif uppercase text-xs font-bold tracking-[0.1em] text-[#1A1A1A]">02. Spatial Symmetries</h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed tracking-wide">
                    Ditch the tourist mainlines. Eat at markets situated three plus blocks from standard historic hubs. Pay forty percent less, experience eighty percent deeper authenticity.
                  </p>
                </div>
                <div className="h-[1px] bg-[#1A1A1A]/10 mt-4"></div>
              </div>

              <div className="p-8 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 border border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] bg-[#EAEAE5]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="serif uppercase text-xs font-bold tracking-[0.1em] text-[#1A1A1A]">03. Automated Cognition</h4>
                  <p className="text-xs text-[#1A1A1A]/70 leading-relaxed tracking-wide">
                    Combine Groq AI 3.5's neural architecture with responsive checklists to track structural budgets and custom logs inside a single high-contrast canvas.
                  </p>
                </div>
                <div className="h-[1px] bg-[#1A1A1A]/10 mt-4"></div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: AI Itinerary Creator */}
        {activeTab === "planner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="section-planner">
            
            {/* Planner Left Form (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#EAEAE5] p-6 rounded-none border border-[#1A1A1A] space-y-5">
                <div>
                  <h3 className="serif text-xl font-light text-[#1A1A1A]">Plan an <span className="italic">Adventure</span></h3>
                  <p className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-widest mt-0.5">Input parameters to request Groq AI Travel Cognition.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Destination City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#1A1A1A]/50" />
                      <input
                        type="text"
                        placeholder="e.g. Kyoto, Japan"
                        value={plannerDestination}
                        onChange={(e) => setPlannerDestination(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs tracking-wide focus:outline-none text-[#1A1A1A] font-semibold"
                        required
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap pt-1.5">
                      {["Kyoto", "Paris", "Bali", "Barcelona"].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setPlannerDestination(suggestion)}
                          className="text-[9px] bg-[#F4F4F1] hover:bg-[#1A1A1A] hover:text-[#F4F4F1] border border-[#1A1A1A]/30 px-2 py-1 rounded-none text-[#1A1A1A] font-medium transition-colors uppercase tracking-[0.05em]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Duration (Days)</label>
                      <span className="text-[10px] font-bold text-[#F4F4F1] bg-[#1A1A1A] px-2 py-0.5 uppercase tracking-wider">{plannerDays} days</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={plannerDays}
                      onChange={(e) => setPlannerDays(parseInt(e.target.value))}
                      className="w-full h-[3px] bg-[#1A1A1A]/20 cursor-pointer accent-[#1A1A1A]"
                    />
                    <div className="flex justify-between text-[9px] text-[#1A1A1A]/50 font-semibold uppercase tracking-wider">
                      <span>1 Day</span>
                      <span>5 Days</span>
                      <span>10 Days</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Financial Tier (Budget)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Budget", "Moderate", "Luxury"].map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPlannerBudget(tier)}
                          className={`py-2 px-3 text-[10px] uppercase tracking-[0.1em] font-semibold rounded-none text-center border transition-all ${
                            plannerBudget === tier
                              ? "bg-[#1A1A1A] border-[#1A1A1A] text-[#F4F4F1] shadow-sm font-bold"
                              : "border-[#1A1A1A]/35 text-[#1A1A1A] hover:bg-[#1A1A1A]/10"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Experience Vibe</label>
                    <select
                      value={plannerVibe}
                      onChange={(e) => setPlannerVibe(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold focus:outline-none uppercase tracking-wide text-[#1A1A1A]"
                    >
                      <option value="Balanced Highlights">Curated Balanced Mix</option>
                      <option value="Action & Outdoor Adventures">Action & Outdoor Adventures</option>
                      <option value="Deep History & Cultural Heritage">Deep History & Cultural Heritage</option>
                      <option value="Culinary Feast & Street Food">Culinary Feasts & Street Food</option>
                      <option value="Zen, Spas & Total Relaxation">Zen, Wellness & Relaxation</option>
                      <option value="Design, Architecture & Art Trails">Design & Art Trails</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Companion Setup</label>
                    <select
                      value={plannerCompanion}
                      onChange={(e) => setPlannerCompanion(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold focus:outline-none uppercase tracking-wide text-[#1A1A1A]"
                    >
                      <option value="Solo Traveller">Solo Adventurer</option>
                      <option value="Romantic Couple">Romantic Couple</option>
                      <option value="Family with Kids">Family with Kids</option>
                      <option value="Close Friends Crew">Close Friends Crew</option>
                    </select>
                  </div>

                  {plannerError && (
                    <div className="p-3 bg-rose-50 border border-[#1A1A1A] rounded-none text-xs text-rose-600 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{plannerError}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleGenerateItinerary()}
                    disabled={isGenerating}
                    className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#F4F4F1] font-bold py-4 px-4 rounded-none text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 disabled:bg-[#1A1A1A]/40 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Drafting Masterpiece...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Build AI Itinerary
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Saved Itineraries Archive */}
              {savedItineraries.length > 0 && (
                <div className="bg-[#F4F4F1] p-5 rounded-none border border-[#1A1A1A] space-y-4" id="saved-itineraries-shelf">
                  <h4 className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em] flex items-center gap-1.5 pb-2 border-b border-[#1A1A1A]/10">
                    <BookOpen className="w-4 h-4" /> Saved Archives ({savedItineraries.length})
                  </h4>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {savedItineraries.map((saved, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#EAEAE5] hover:bg-white rounded-none border border-[#1A1A1A]/20 flex items-center justify-between gap-3 group transition-all"
                      >
                        <div
                          className="cursor-pointer flex-1"
                          onClick={() => setGeneratedItinerary(saved)}
                        >
                          <h5 className="text-xs font-bold text-[#1A1A1A] group-hover:underline transition-all">{saved.destination}</h5>
                          <span className="text-[9px] text-[#1A1A1A]/60 font-mono uppercase tracking-wider block mt-0.5">
                            {saved.days.length} Days &bull; {saved.bestSeason}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteSavedItinerary(idx)}
                          className="text-[#1A1A1A]/60 hover:text-red-700 transition-colors p-1"
                          aria-label="Delete saved itinerary"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Planner Right Output (8 cols) */}
            <div className="lg:col-span-8">
              {isGenerating ? (
                /* Glowing Loading State */
                <div className="bg-[#EAEAE5] border border-[#1A1A1A] p-12 text-center space-y-8 flex flex-col items-center justify-center min-h-[500px]">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-none border-2 border-[#1A1A1A] border-t-transparent animate-spin"></div>
                    <Compass className="w-6 h-6 text-[#1A1A1A] absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h4 className="serif text-xl font-light text-[#1A1A1A]">Consulting Travel Secrets...</h4>
                    <p className="text-xs text-[#1A1A1A]/70 leading-relaxed uppercase tracking-wider">
                      Groq AI is compiling route sequences, authentic bistros, and localized architectural walks.
                    </p>
                  </div>
                  <div className="bg-[#F4F4F1] border border-[#1A1A1A] p-5 text-left max-w-md w-full text-xs space-y-1.5 font-mono">
                    <span className="font-bold text-[8px] uppercase text-[#1A1A1A] tracking-[0.2em] block">Concierge Telemetry</span>
                    <p className="text-[#1A1A1A]/80 leading-relaxed">System compiles customized baggage constraints dynamically under your tab guidelines.</p>
                  </div>
                </div>
              ) : generatedItinerary ? (
                /* Rendered Beautiful Itinerary */
                <div className="space-y-6" id="itinerary-output">
                  <div className="bg-[#F4F4F1] border border-[#1A1A1A] overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-[#1A1A1A] text-[#F4F4F1] p-8 space-y-6 relative">
                      <div className="absolute right-6 top-6 opacity-5">
                        <Map className="w-36 h-36" />
                      </div>
                      <div className="relative z-10 flex flex-wrap justify-between items-start gap-4">
                        <div className="space-y-2">
                          <span className="border border-[#F4F4F1]/40 text-[#F4F4F1] text-[9px] font-bold px-3 py-1 uppercase tracking-[0.2em]">
                            Automated Program
                          </span>
                          <h3 className="text-3xl md:text-5xl font-light font-serif tracking-tighter">{generatedItinerary.destination}</h3>
                          <p className="text-xs text-[#F4F4F1]/70 max-w-xl font-sans tracking-wide">{generatedItinerary.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveCurrentItinerary}
                            className="bg-[#F4F4F1] hover:bg-[#EAEAE5] text-[#1A1A1A] font-bold text-[10px] uppercase tracking-[0.15em] py-3 px-5 transition-all rounded-none"
                          >
                            Save Itinerary
                          </button>
                        </div>
                      </div>

                      {/* Stat Tiles in Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#F4F4F1]/20 relative z-10 text-xs font-mono">
                        <div className="bg-[#F4F4F1]/5 p-3 border border-[#F4F4F1]/10">
                          <span className="text-[#F4F4F1]/50 block text-[9px] uppercase tracking-wider">Optimal Season</span>
                          <span className="font-bold text-[#F4F4F1] block mt-1 uppercase">{generatedItinerary.bestSeason}</span>
                        </div>
                        <div className="bg-[#F4F4F1]/5 p-3 border border-[#F4F4F1]/10">
                          <span className="text-[#F4F4F1]/50 block text-[9px] uppercase tracking-wider">Estimated Base Cost</span>
                          <span className="font-bold text-[#F4F4F1] block mt-1 uppercase">{generatedItinerary.totalEstimatedCost}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-[#F4F4F1]/5 p-3 border border-[#F4F4F1]/10 flex items-center justify-between">
                          <div>
                            <span className="text-[#F4F4F1]/50 block text-[9px] uppercase tracking-wider">Packing Recs</span>
                            <span className="font-bold text-[#F4F4F1] block mt-1">{generatedItinerary.packingEssentials.length} Items</span>
                          </div>
                          <button
                            onClick={injectAIRecommendedPacking}
                            className="bg-[#F4F4F1]/10 hover:bg-[#F4F4F1]/20 text-[#F4F4F1] rounded-none p-2 border border-[#F4F4F1]/20 transition-colors"
                            title="Inject items in Gear and Pocket checklist"
                          >
                            <Luggage className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Day Schedule timeline */}
                    <div className="p-8 space-y-10 bg-[#F4F4F1]">
                      {generatedItinerary.days.map((day: any, dIdx: number) => (
                        <div key={day.dayNumber} className="relative pl-8 sm:pl-12 border-l border-[#1A1A1A]/25 last:border-0 pb-8 last:pb-0">
                          {/* Square Badge marker */}
                          <div className="absolute -left-[15px] top-0 w-7 h-7 bg-[#1A1A1A] text-[#F4F4F1] flex items-center justify-center font-serif text-xs font-bold border border-[#F4F4F1]/20">
                            {day.dayNumber}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <span className="text-[9px] text-[#1A1A1A]/40 font-mono tracking-widest block font-bold">SEQUENCE {day.dayNumber}</span>
                              <h4 className="text-xl font-light text-[#1A1A1A] font-serif">
                                Day {day.dayNumber}: <span className="italic">{day.title}</span>
                              </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {day.activities.map((act: any, aIdx: number) => (
                                <div key={aIdx} className="bg-[#EAEAE5] border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/50 rounded-none p-5 flex flex-col justify-between space-y-5 transition-all duration-300">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                                      <span className="bg-[#1A1A1A] text-[#F4F4F1] text-[8px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
                                        {act.timeOfDay}
                                      </span>
                                      {act.cost && (
                                        <span className="text-[9px] font-mono text-[#1A1A1A]/60">{act.cost}</span>
                                      )}
                                    </div>
                                    <h5 className="text-sm font-bold text-[#1A1A1A] tracking-tight uppercase">
                                      {act.activityName}
                                    </h5>
                                    <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-sans tracking-wide">
                                      {act.description}
                                    </p>
                                  </div>
                                  
                                  {act.tips && (
                                    <div className="bg-[#F4F4F1] border border-[#1A1A1A]/10 p-3 text-[10px] text-[#1A1A1A]/70 flex items-start gap-1.5 font-mono leading-relaxed">
                                      <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                                      <span>{act.tips}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Starter Empty State */
                <div className="bg-[#EAEAE5] border border-[#1A1A1A] p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[500px]">
                  <Compass className="w-12 h-12 text-[#1A1A1A]/40 animate-pulse" />
                  <div className="space-y-2 max-w-sm">
                    <h4 className="serif text-2xl font-light text-[#1A1A1A]">Your travel plan is <span className="italic">unchartered</span></h4>
                    <p className="text-xs text-[#1A1A1A]/60 uppercase tracking-widest leading-relaxed">
                      Select or fill in your desired destination city, pick your duration slides, and tap the builder button to summon curated daily programs immediately.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
                {/* SECTION 3: Gear, Packing & Budget */}
        {activeTab === "checklist" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="section-checklist">
            
            {/* Left: Gear Checklists */}
            <div className="bg-[#EAEAE5] p-6 md:p-8 rounded-none border border-[#1A1A1A] space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <h3 className="serif text-xl font-light text-[#1A1A1A] flex items-center gap-2">
                    <Luggage className="w-5 h-5" /> Gear & Packing
                  </h3>
                  <p className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-widest font-semibold">Ensure essentials are secured, weights legal, logs clean.</p>
                </div>

                <button
                  onClick={injectAIRecommendedPacking}
                  className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#F4F4F1] font-bold border border-[#1A1A1A] py-1.5 px-3 rounded-none text-[9px] uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#F4F4F1]" /> Inject AI Picks
                </button>
              </div>

              {/* Progress bar */}
              <div className="bg-[#F4F4F1] p-4 rounded-none border border-[#1A1A1A]/30 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-[#1A1A1A] uppercase tracking-wider">
                  <span>Bag Volume Checklist</span>
                  <span>
                    {packingItems.filter((i) => i.checked).length} of {packingItems.length} packed
                  </span>
                </div>
                <div className="h-[6px] bg-[#1A1A1A]/10 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-[#1A1A1A] transition-all duration-300"
                    style={{
                      width: `${
                        packingItems.length > 0
                          ? (packingItems.filter((i) => i.checked).length / packingItems.length) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Category split render */}
              {["Documents", "Clothing", "Electronics", "Toiletries", "AI Suggestions"].map((cat) => {
                const itemsInCat = packingItems.filter((i) => i.category === cat);
                if (itemsInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <h4 className="text-[9px] font-black uppercase text-[#1A1A1A]/50 tracking-widest border-b border-[#1A1A1A]/10 pb-1">{cat}</h4>
                    <div className="space-y-1">
                      {itemsInCat.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 hover:bg-[#F4F4F1] rounded-none border-b border-[#1A1A1A]/5 transition-all"
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => togglePackingItem(item.id)}
                              className="w-4 h-4 text-[#1A1A1A] border-[#1A1A1A] rounded-none cursor-pointer accent-[#1A1A1A]"
                            />
                            <span className={`text-xs ${item.checked ? "line-through text-[#1A1A1A]/40 font-mono" : "text-[#1A1A1A] font-semibold"}`}>
                              {item.text}
                            </span>
                          </label>
                          <button
                            onClick={() => removePackingItem(item.id)}
                            className="text-[#1A1A1A]/40 hover:text-red-700 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add custom packing item form */}
              <form onSubmit={handleAddPackingItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-[#1A1A1A]/10">
                <input
                  type="text"
                  placeholder="Custom item (e.g. Passport...)"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="sm:col-span-6 px-3 py-2.5 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide focus:outline-none"
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="sm:col-span-4 px-3 py-2.5 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide focus:outline-none"
                >
                  <option value="Clothing">Clothing</option>
                  <option value="Documents">Documents</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Toiletries">Toiletries</option>
                </select>
                <button
                  type="submit"
                  className="sm:col-span-2 bg-[#1A1A1A] text-[#F4F4F1] rounded-none px-4 py-2 hover:bg-[#2A2A2A] transition-colors text-[10px] tracking-widest uppercase font-bold"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Right: Cash Ledger & Budget Planner */}
            <div className="bg-[#EAEAE5] p-6 md:p-8 rounded-none border border-[#1A1A1A] space-y-6">
              <div className="space-y-1">
                <h3 className="serif text-xl font-light text-[#1A1A1A] flex items-center gap-2">
                  <Coins className="w-5 h-5" /> Expense Ledger
                </h3>
                <p className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-widest font-semibold">Track totals, analyze ratios, log travel currency details.</p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAF9F6] p-4 rounded-none border border-[#1A1A1A]/20 text-left">
                  <span className="text-[9px] text-[#1A1A1A]/55 uppercase font-bold tracking-[0.1em] block">Total Spent (USD)</span>
                  <p className="text-2xl font-light text-[#1A1A1A] mt-1 serif">${totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-[#FAF9F6] p-4 rounded-none border border-[#1A1A1A]/20 text-left">
                  <span className="text-[9px] text-[#1A1A1A]/55 uppercase font-bold tracking-[0.1em] block">Active Ledger Logs</span>
                  <p className="text-2xl font-light text-[#1A1A1A] mt-1 serif">{expenses.length} Records</p>
                </div>
              </div>

              {/* Custom SVG/Tailwind Budget Chart */}
              <div className="bg-[#F4F4F1] p-4 rounded-none border border-[#1A1A1A]/20 space-y-3">
                <h4 className="text-[9px] font-bold uppercase text-[#1A1A1A]/65 tracking-widest border-b border-[#1A1A1A]/10 pb-1">Resource Allocation</h4>
                {expenses.length === 0 ? (
                  <p className="text-xs text-[#1A1A1A]/50 py-4 text-center font-semibold">Add budget ledger logs to inspect visual breakdown ratios.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {["Accommodation", "Flight / Transit", "Dining", "Activities", "Souvenirs & Other"].map((cat) => {
                      const amount = expenseByCategory[cat] || 0;
                      const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-[#1A1A1A]/85 uppercase tracking-wide">{cat}</span>
                            <span className="text-[#1A1A1A]/85 font-mono">${amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-[4px] bg-[#1A1A1A]/10 rounded-none overflow-hidden">
                            <div
                              className="h-full bg-[#1A1A1A]"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expenses table / list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-[#F4F4F1] hover:bg-white rounded-none border border-[#1A1A1A]/15 flex justify-between items-center gap-3 transition-all text-xs font-semibold text-[#1A1A1A]"
                  >
                    <div>
                      <h4 className="font-bold uppercase tracking-wide">{exp.note}</h4>
                      <span className="text-[9px] text-[#1A1A1A]/60 font-mono mt-0.5 block uppercase">{exp.category}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold">${exp.amount.toLocaleString()}</span>
                      <button
                        onClick={() => removeExpense(exp.id)}
                        className="text-[#1A1A1A]/40 hover:text-red-700 transition-colors p-1"
                        aria-label="Remove expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-[#1A1A1A]/10">
                <input
                  type="text"
                  placeholder="Note (e.g. Hotel Booking...)"
                  value={newExpenseNote}
                  onChange={(e) => setNewExpenseNote(e.target.value)}
                  className="sm:col-span-5 px-3 py-2 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide focus:outline-none"
                  required
                />
                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="sm:col-span-3 px-3 py-2 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide focus:outline-none"
                >
                  <option value="Accommodation">Accommodation</option>
                  <option value="Flight / Transit">Flight / Transit</option>
                  <option value="Dining">Dining</option>
                  <option value="Activities">Activities</option>
                  <option value="Souvenirs & Other">Souvenirs & Other</option>
                </select>
                <div className="sm:col-span-4 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-2.5 text-[#1A1A1A]/55 text-xs font-mono">$</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      className="w-full pl-5 pr-2 py-2 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A] font-mono focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#1A1A1A] text-[#F4F4F1] hover:bg-[#2A2A2A] px-3.5 py-2 rounded-none transition-all text-[10px] tracking-widest uppercase font-bold"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
                {/* SECTION 4: Exploration Scrapbook / Diary */}
        {activeTab === "album" && (
          <div className="space-y-8" id="section-album">
            
            {/* Log creation panel */}
            <div className="bg-[#EAEAE5] p-6 md:p-8 rounded-none border border-[#1A1A1A] max-w-3xl mx-auto space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="serif text-xl font-light text-[#1A1A1A]">
                  Poetic Travel <span className="italic">Postcard Diary</span>
                </h3>
                <p className="text-[10px] text-[#1A1A1A]/60 uppercase tracking-[0.2em] max-w-md mx-auto font-semibold">
                  Input raw thoughts or observations, and let Groq AI compile postcards in elegant spacing layouts.
                </p>
              </div>

              <form onSubmit={handleRefineLog} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Postcard Title or Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Shinjuku Streets & Ramen"
                      value={albumLocation}
                      onChange={(e) => setAlbumLocation(e.target.value)}
                      className="w-full p-3 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Vibe Quick-Fill Ideas</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {["Golden hour temples", "Midnight neon rain", "Lazy morning bakery"].map((idea) => (
                        <button
                          key={idea}
                          type="button"
                          onClick={() => setAlbumLocation(idea)}
                          className="text-[9px] bg-[#F4F4F1] hover:bg-[#1A1A1A] hover:text-[#F4F4F1] border border-[#1A1A1A]/30 px-2 py-1 rounded-none text-[#1A1A1A] font-medium transition-colors uppercase tracking-[0.05em]"
                        >
                          {idea}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Your Messy Notes, Impressions & Vibe</label>
                  <textarea
                    rows={4}
                    placeholder="Describe elements, tastes, smells, music, what stood out: (e.g. Raining in Shinjuku, glowing red lanterns, smell of tonkotsu broth, synthwave music in tiny bar, warm sake...)"
                    value={albumDraft}
                    onChange={(e) => setAlbumDraft(e.target.value)}
                    className="w-full p-3 bg-[#F4F4F1] border border-[#1A1A1A] rounded-none text-xs font-semibold text-[#1A1A1A]"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isRefiningAlbum}
                  className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#F4F4F1] font-bold py-4 px-4 rounded-none text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  {isRefiningAlbum ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Refining Postcard Prose...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#F4F4F1]" />
                      Transform to Poetic Postcard
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Postcard gallery feed with distinct background colors mapping to custom color attributes */}
            <div className="space-y-6">
              <h4 className="serif text-xl font-light text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 pl-1">Your scrapbook gallery archive</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="scrapbook-gallery">
                {albumLogs.map((log) => {
                  // Handle custom palette color configurations for responsive card framing
                  const colors: any = {
                    amber: { bg: "bg-[#FAF5EC]", border: "border-[#1A1A1A]", text: "text-[#1A1A1A]/70", textDark: "text-[#1A1A1A]" },
                    rose: { bg: "bg-[#FAECED]", border: "border-[#1A1A1A]", text: "text-[#1A1A1A]/70", textDark: "text-[#1A1A1A]" },
                    emerald: { bg: "bg-[#ECFAF2]", border: "border-[#1A1A1A]", text: "text-[#1A1A1A]/70", textDark: "text-[#1A1A1A]" },
                    sky: { bg: "bg-[#EDF5FA]", border: "border-[#1A1A1A]", text: "text-[#1A1A1A]/70", textDark: "text-[#1A1A1A]" },
                    indigo: { bg: "bg-[#EEEDFA]", border: "border-[#1A1A1A]", text: "text-[#1A1A1A]/70", textDark: "text-[#1A1A1A]" },
                    slate: { bg: "bg-[#FAF9F6]", border: "border-[#1A1A1A]", text: "text-[#1A1A1A]/70", textDark: "text-[#1A1A1A]" },
                  };

                  const theme = colors[log.customColorPrimary] || colors.slate;

                  return (
                    <div
                      key={log.id}
                      className={`rounded-none border-2 ${theme.border} p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-none transition-all relative ${theme.bg}`}
                    >
                      {/* Decorative Postcard Stamp and Line indicators */}
                      <div className="absolute top-6 right-6 w-14 h-18 border border-[#1A1A1A] border-dashed rounded-none flex flex-col items-center justify-center text-[7px] font-mono tracking-widest text-[#1A1A1A] select-none bg-[#EAEAE5] rotate-6 p-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1A1A1A] mb-0.5" />
                        STAMP 10¢
                      </div>

                      <div className="space-y-4 max-w-[80%] sm:max-w-[75%]">
                        <div className="space-y-1">
                          <span className="text-[9px] text-[#1A1A1A]/40 font-mono tracking-wider font-bold">POSTCARD JOURNAL</span>
                          <h4 className="text-xl font-serif font-light text-[#1A1A1A] leading-tight italic">{log.title}</h4>
                          <span className="text-[10px] font-bold text-[#1A1A1A]/70 flex items-center gap-1 mt-1 font-mono uppercase">
                            <MapPin className="w-3.5 h-3.5" /> {log.location}
                          </span>
                        </div>

                        {/* Prose segment */}
                        <p className="text-xs text-[#1A1A1A] font-sans italic leading-relaxed font-semibold">
                          &ldquo;{log.refinedContent}&rdquo;
                        </p>
                      </div>

                      {/* Split divider for postcard style */}
                      <div className="border-t border-dashed border-[#1A1A1A]/30 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3.5">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/45">Vibe Motif</span>
                          <p className={`text-[9px] font-mono font-bold uppercase tracking-wider ${theme.textDark}`}>
                            {log.postcardMood}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 self-end">
                          <button
                            onClick={() => deleteAlbumLog(log.id)}
                            className="text-[#1A1A1A]/40 hover:text-red-700 transition-colors p-1"
                            title="Remove log"
                            aria-label="Delete scrapbook log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {log.travelQuote && (
                        <div className="bg-white/95 border border-[#1A1A1A]/10 p-2.5 rounded-none text-[9px] text-[#1A1A1A]/75 leading-relaxed font-bold font-serif italic text-center w-full">
                          &ldquo;{log.travelQuote}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Aesthetic Site Footer */}
      <footer className="bg-[#1A1A1A] text-[#F4F4F1]/65 text-[9px] py-10 text-center border-t border-[#1A1A1A] mt-24 font-mono uppercase tracking-wider">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-bold">
            VentureMap Travel Concierge &bull; Powered by Groq AI Cognition &bull; Full-Stack React Express
          </p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Offline local archives active</span>
            <span className="hover:text-white cursor-pointer transition-colors">&copy; 2026 World Explorers Club</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
