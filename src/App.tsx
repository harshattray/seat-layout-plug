import React, { useState } from "react";
import SeatingLayout, { Layout } from "./SeatingLayout"; 
import { BeakerIcon, BuildingStorefrontIcon, FilmIcon, NoSymbolIcon } from '@heroicons/react/24/solid'; 

interface TheaterConfig {
  id: string;
  name: string;
  layout: Omit<Layout, 'seats'>; 
}

const theater1Layout: Omit<Layout, 'seats'> = {
  sections: [
    {
      id: "platinum-t1", name: "Platinum Arena", seatType: "platinum",
      rowPatterns: [
        [{ type: 'seats', count: 2 }, { type: 'gap', count: 1 }, { type: 'seats', count: 6 }, { type: 'gap', count: 1 }, { type: 'seats', count: 2 }],
        [{ type: 'seats', count: 2 }, { type: 'gap', count: 1 }, { type: 'seats', count: 6 }, { type: 'gap', count: 1 }, { type: 'seats', count: 2 }],
      ],
      rows: 2, 
      cols: 12 
    },
    {
      id: "gold-t1", name: "Gold Circle", seatType: "gold",
      rowPatterns: Array(5).fill(null).map(() => [{ type: 'seats', count: 7 }, { type: 'gap', count: 1 }, { type: 'seats', count: 14 }]),
      rows: 5, 
      cols: 22 
    },
    {
      id: "loungers-t1", name: "Luxury Loungers", seatType: "loungers",
      rowPatterns: [[{ type: 'seats', count: 5 }, { type: 'gap', count: 1 }, { type: 'seats', count: 9 }]],
      rows: 1, 
      cols: 15 
    },
  ],
  seatTypes: {
    platinum: { icon: FilmIcon, color: "#E5E4E2", price: 350 },
    gold: { icon: BeakerIcon, color: "#FFD700", price: 295 },
    loungers: { icon: BuildingStorefrontIcon, color: "#D3D3D3", price: 295 },
    unavailable: { icon: NoSymbolIcon, color: "#A9A9A9", price: 0 },
  },
};

const theater2Layout: Omit<Layout, 'seats'> = {
  sections: [
    {
      id: "vip-t2", name: "VIP Box", seatType: "vip",
      rowPatterns: [
        [{ type: 'seats', count: 4 }],
        [{ type: 'seats', count: 4 }],
      ],
      rows: 2, 
      cols: 4  
    },
    {
      id: "regular-t2", name: "Main Auditorium", seatType: "regular",
      rowPatterns: Array(8).fill(null).map(() => [{ type: 'seats', count: 10 }, { type: 'gap', count: 2 }, { type: 'seats', count: 10 }]),
      rows: 8, 
      cols: 22 
    },
  ],
  seatTypes: {
    vip: { icon: FilmIcon, color: "#C0C0C0", price: 500 },
    regular: { icon: BeakerIcon, color: "#ADD8E6", price: 200 },
    unavailable: { icon: NoSymbolIcon, color: "#A9A9A9", price: 0 },
  },
};

const theaterConfigs: TheaterConfig[] = [
  { id: "theater1", name: "Cinema Paradiso - Screen 1", layout: theater1Layout },
  { id: "theater2", name: "Majestic Movies - Audi A", layout: theater2Layout },
];

const App: React.FC = () => {
  const [selectedTheaterId, setSelectedTheaterId] = useState<string | null>(null);

  const handleSelectTheater = (theaterId: string) => {
    setSelectedTheaterId(theaterId);
  };

  const handleBackToTheaters = () => {
    setSelectedTheaterId(null);
  };

  const selectedConfig = theaterConfigs.find(tc => tc.id === selectedTheaterId);

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-700">Movie Theater Seating</h1>
      </header>

      {selectedConfig ? (
        <div>
          <button 
            onClick={handleBackToTheaters}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            &larr; Back to Theaters
          </button>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">{selectedConfig.name}</h2>
          <SeatingLayout initialLayoutConfig={selectedConfig.layout} /> 
        </div>
      ) : (
        <div className="space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Select a Theater</h2>
          {theaterConfigs.map((theater) => (
            <button
              key={theater.id}
              onClick={() => handleSelectTheater(theater.id)}
              className="w-full px-6 py-4 bg-white text-blue-600 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-50 transition-all duration-200 ease-in-out text-left"
            >
              <span className="text-xl font-medium">{theater.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;