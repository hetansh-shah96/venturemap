import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Heart, Check, Plus, Trash2, Search, X, Globe } from "lucide-react";

interface WishlistPlace {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  category: "city" | "beach" | "mountain" | "island" | "temple" | "nature" | "other";
  notes: string;
  visited: boolean;
  priority: 1 | 2 | 3;
  addedAt: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  city: "🏙",
  beach: "🏖",
  mountain: "⛰",
  island: "🏝",
  temple: "⛩",
  nature: "🌲",
  other: "📍",
};

const DEFAULT_PLACES: WishlistPlace[] = [
  { id: "w-1", name: "Santorini", country: "Greece", lat: 36.3932, lng: 25.4615, category: "island", notes: "Sunsets over the caldera 🌅", visited: false, priority: 3, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-2", name: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681, category: "temple", notes: "Cherry blossoms in spring 🌸", visited: false, priority: 3, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-3", name: "Amalfi Coast", country: "Italy", lat: 40.634, lng: 14.6027, category: "beach", notes: "Limoncello and cliff roads", visited: false, priority: 2, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-4", name: "Maldives", country: "Maldives", lat: 3.2028, lng: 73.2207, category: "island", notes: "Overwater bungalow dream 💕", visited: false, priority: 3, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-5", name: "Swiss Alps", country: "Switzerland", lat: 46.8182, lng: 8.2275, category: "mountain", notes: "Winter skiing & hot chocolate", visited: false, priority: 2, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-6", name: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378, category: "city", notes: "Old town fairy-tale streets", visited: false, priority: 1, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-7", name: "Bali", country: "Indonesia", lat: -8.3405, lng: 115.092, category: "island", notes: "Rice terraces and temples", visited: false, priority: 2, addedAt: "2026-01-01T00:00:00Z" },
  { id: "w-8", name: "Northern Lights, Tromsø", country: "Norway", lat: 69.6489, lng: 18.9551, category: "nature", notes: "Aurora borealis under the stars 🌌", visited: false, priority: 3, addedAt: "2026-01-01T00:00:00Z" },
];

const createMarkerIcon = (visited: boolean, priority: number) => {
  const color = visited ? "#16a34a" : priority === 3 ? "#e11d48" : priority === 2 ? "#f97316" : "#6366f1";
  const inner = visited ? "✓" : "♥";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;background:${color};
      border:2.5px solid white;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:12px;color:white;line-height:1;font-weight:bold;">${inner}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -34],
  });
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function geocodePlace(query: string): Promise<{ lat: number; lng: number; name: string; country: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "VentureMapApp/1.0" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    const d = data[0];
    return {
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      name: d.address?.city || d.address?.town || d.address?.village || d.name || query,
      country: d.address?.country || "",
    };
  } catch {
    return null;
  }
}

const loadPlaces = (): WishlistPlace[] => {
  try {
    const saved = localStorage.getItem("venture_wishlist");
    return saved ? JSON.parse(saved) : DEFAULT_PLACES;
  } catch {
    return DEFAULT_PLACES;
  }
};

export default function WishlistMap() {
  const [places, setPlaces] = useState<WishlistPlace[]>(loadPlaces);
  const [filter, setFilter] = useState<"all" | "wishlist" | "visited">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    category: "city" as WishlistPlace["category"],
    notes: "",
    priority: 2 as 1 | 2 | 3,
  });

  useEffect(() => {
    localStorage.setItem("venture_wishlist", JSON.stringify(places));
  }, [places]);

  const filteredPlaces = places.filter((p) =>
    filter === "all" ? true : filter === "visited" ? p.visited : !p.visited
  );

  const stats = {
    total: places.length,
    visited: places.filter((p) => p.visited).length,
    wishlist: places.filter((p) => !p.visited).length,
    countries: new Set(places.map((p) => p.country).filter(Boolean)).size,
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!addMode) return;
    setPendingCoords({ lat, lng });
    setFormData((f) => ({ ...f, name: "", country: "" }));
    setShowAddForm(true);
    setAddMode(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const result = await geocodePlace(searchQuery);
    setIsSearching(false);
    if (!result) {
      alert("Place not found. Try a more specific name (e.g. 'Paris, France').");
      return;
    }
    setPendingCoords({ lat: result.lat, lng: result.lng });
    setFormData((f) => ({ ...f, name: result.name, country: result.country }));
    setShowAddForm(true);
    setSearchQuery("");
  };

  const handleAddPlace = () => {
    if (!pendingCoords || !formData.name.trim()) return;
    const newPlace: WishlistPlace = {
      id: "w-" + Date.now(),
      ...formData,
      lat: pendingCoords.lat,
      lng: pendingCoords.lng,
      visited: false,
      addedAt: new Date().toISOString(),
    };
    setPlaces((prev) => [...prev, newPlace]);
    setPendingCoords(null);
    setShowAddForm(false);
    setFormData({ name: "", country: "", category: "city", notes: "", priority: 2 });
  };

  const toggleVisited = (id: string) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, visited: !p.visited } : p)));
  };

  const deletePlace = (id: string) => {
    if (!confirm("Remove this place from your wishlist?")) return;
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setPendingCoords(null);
    setAddMode(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-4 border border-[#1A1A1A] divide-x divide-[#1A1A1A] bg-[#EAEAE5]">
        {[
          { label: "Total", value: stats.total, icon: "📍" },
          { label: "Visited", value: stats.visited, icon: "✅" },
          { label: "Wishlist", value: stats.wishlist, icon: "♥" },
          { label: "Countries", value: stats.countries, icon: "🌍" },
        ].map((s) => (
          <div key={s.label} className="p-3 md:p-4 text-center">
            <div className="text-base md:text-lg">{s.icon}</div>
            <div className="text-xl md:text-2xl font-light font-serif text-[#1A1A1A]">{s.value}</div>
            <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/60">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main layout: map + sidebar */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 border border-[#1A1A1A] overflow-hidden"
        style={{ height: "72vh", minHeight: "520px" }}
      >
        {/* Map */}
        <div className="lg:col-span-8 relative" style={{ minHeight: "320px" }}>
          {addMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-rose-600 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-widest shadow-lg pointer-events-none">
              Click anywhere on the map to drop a pin
            </div>
          )}
          <MapContainer
            center={[20, 10]}
            zoom={2}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {filteredPlaces.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={createMarkerIcon(place.visited, place.priority)}
              >
                <Popup>
                  <div className="min-w-[160px] text-sm">
                    <div className="font-bold text-base">
                      {CATEGORY_EMOJI[place.category]} {place.name}
                    </div>
                    <div className="text-gray-500 text-xs">{place.country}</div>
                    {place.notes && <div className="text-xs mt-1 italic text-gray-600">{place.notes}</div>}
                    <div className="text-xs mt-1">{"♥".repeat(place.priority)}</div>
                    <button
                      onClick={() => toggleVisited(place.id)}
                      className="mt-2 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded w-full text-left transition-colors"
                    >
                      {place.visited ? "↩ Mark as wishlist" : "✓ Mark as visited"}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div
          className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#1A1A1A] flex flex-col bg-[#F4F4F1]"
          style={{ overflow: "hidden" }}
        >
          {/* Sidebar controls */}
          <div className="p-4 border-b border-[#1A1A1A] space-y-3 flex-shrink-0 bg-[#F4F4F1]">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]">
                Our Places
              </h3>
            </div>

            {/* Search geocoder */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Search a place to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-2.5 py-2 bg-[#EAEAE5] border border-[#1A1A1A] text-[10px] uppercase tracking-wide focus:outline-none font-semibold text-[#1A1A1A] placeholder-[#1A1A1A]/40"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-[#1A1A1A] text-[#F4F4F1] px-2.5 py-2 hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSearching ? (
                  <span className="text-[9px] font-mono">...</span>
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Pin on map button */}
            <button
              onClick={() => setAddMode(!addMode)}
              className={`w-full text-[9px] font-bold uppercase tracking-wider py-2 px-3 border transition-all flex items-center justify-center gap-1.5 ${
                addMode
                  ? "bg-rose-600 text-white border-rose-600"
                  : "border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
              }`}
            >
              <Plus className="w-3 h-3" />
              {addMode ? "Cancel — click map to pin" : "Drop pin on map"}
            </button>

            {/* Filter tabs */}
            <div className="flex border border-[#1A1A1A]">
              {(["all", "wishlist", "visited"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                    filter === f ? "bg-[#1A1A1A] text-[#F4F4F1]" : "text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Add place form */}
          {showAddForm && (
            <div className="p-4 border-b border-[#1A1A1A] bg-[#EAEAE5] flex-shrink-0 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">
                  Add Place
                </span>
                <button onClick={cancelAdd} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Place name *"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-2.5 py-2 bg-[#F4F4F1] border border-[#1A1A1A] text-[10px] uppercase tracking-wide focus:outline-none font-semibold text-[#1A1A1A]"
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-2.5 py-2 bg-[#F4F4F1] border border-[#1A1A1A] text-[10px] uppercase tracking-wide focus:outline-none font-semibold text-[#1A1A1A]"
              />
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, category: e.target.value as WishlistPlace["category"] }))
                }
                className="w-full px-2.5 py-2 bg-[#F4F4F1] border border-[#1A1A1A] text-[10px] uppercase tracking-wide focus:outline-none font-semibold text-[#1A1A1A]"
              >
                {Object.entries(CATEGORY_EMOJI).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v} {k}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-2.5 py-2 bg-[#F4F4F1] border border-[#1A1A1A] text-[10px] tracking-wide focus:outline-none font-semibold text-[#1A1A1A]"
              />
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#1A1A1A]/60">
                  Dream level:
                </span>
                {([1, 2, 3] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData((f) => ({ ...f, priority: p }))}
                    className={`text-lg transition-all leading-none ${
                      formData.priority >= p ? "text-rose-600" : "text-[#1A1A1A]/20"
                    }`}
                  >
                    ♥
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddPlace}
                disabled={!formData.name.trim()}
                className="w-full bg-[#1A1A1A] text-[#F4F4F1] py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors disabled:opacity-40"
              >
                Add to Our Wishlist
              </button>
            </div>
          )}

          {/* Places list */}
          <div className="flex-1 overflow-y-auto">
            {filteredPlaces.length === 0 ? (
              <div className="p-6 text-center">
                <Globe className="w-8 h-8 text-[#1A1A1A]/20 mx-auto mb-2" />
                <p className="text-[10px] text-[#1A1A1A]/40 uppercase tracking-widest font-semibold">
                  No places yet. Search or drop a pin on the map.
                </p>
              </div>
            ) : (
              filteredPlaces
                .sort((a, b) => b.priority - a.priority)
                .map((place) => (
                  <div
                    key={place.id}
                    className="p-3 border-b border-[#1A1A1A]/10 hover:bg-[#EAEAE5] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">{CATEGORY_EMOJI[place.category]}</span>
                          <span className="text-xs font-bold text-[#1A1A1A] truncate">{place.name}</span>
                          {place.visited && (
                            <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 font-bold uppercase tracking-wider">
                              visited
                            </span>
                          )}
                        </div>
                        {place.country && (
                          <div className="text-[9px] text-[#1A1A1A]/50 font-mono uppercase tracking-wider mt-0.5">
                            {place.country}
                          </div>
                        )}
                        {place.notes && (
                          <div className="text-[9px] text-[#1A1A1A]/60 mt-0.5 italic truncate">
                            {place.notes}
                          </div>
                        )}
                        <div className="text-[10px] mt-0.5 leading-none">
                          <span className="text-rose-500">{"♥".repeat(place.priority)}</span>
                          <span className="text-[#1A1A1A]/15">{"♥".repeat(3 - place.priority)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                        <button
                          onClick={() => toggleVisited(place.id)}
                          title={place.visited ? "Move to wishlist" : "Mark as visited"}
                          className={`p-1 border transition-all ${
                            place.visited
                              ? "bg-green-600 text-white border-green-600"
                              : "border-[#1A1A1A]/30 text-[#1A1A1A]/40 hover:border-green-600 hover:text-green-600"
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deletePlace(place.id)}
                          title="Remove place"
                          className="p-1 text-[#1A1A1A]/30 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/50">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-600"></span> High dream (♥♥♥)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span> Medium (♥♥)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-indigo-500"></span> Someday (♥)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span> Visited ✓
        </span>
      </div>
    </div>
  );
}
