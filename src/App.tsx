import React, { useState } from "react";
import SeatingLayout, { Layout, SeatingLayoutProps } from "./SeatingLayout"; 
import { BeakerIcon, BuildingStorefrontIcon, FilmIcon, NoSymbolIcon } from '@heroicons/react/24/solid'; 
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

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

const theater3Layout: Omit<Layout, 'seats'> = {
  sections: [
    {
      id: "balcony-t3", name: "Upper Balcony", seatType: "balcony",
      rowPatterns: [
        [{ type: 'seats', count: 10 }],
        [{ type: 'seats', count: 12 }],
      ],
      rows: 2, 
      cols: 12 
    },
    {
      id: "loge-t3", name: "Loge Boxes", seatType: "loge",
      rowPatterns: [
        [{ type: 'seats', count: 3 }, { type: 'gap', count: 1 }, { type: 'seats', count: 3 }],
        [{ type: 'seats', count: 3 }, { type: 'gap', count: 1 }, { type: 'seats', count: 3 }],
      ],
      rows: 2, 
      cols: 7 
    },
    {
      id: "economy-t3", name: "Economy Plus", seatType: "economy_plus",
      rowPatterns: Array(4).fill(null).map(() => [{ type: 'seats', count: 15 }]),
      rows: 4,
      cols: 15
    },
  ],
  seatTypes: {
    balcony: { color: "#B0E0E6", price: 150 }, 
    loge: { icon: FilmIcon, color: "#DAA520", price: 250 }, 
    economy_plus: { color: "#90EE90", price: 180 }, 
    unavailable: { icon: NoSymbolIcon, color: "#A9A9A9", price: 0 },
  },
};

const theaterConfigs: TheaterConfig[] = [
  { id: "theater1", name: "Cinema Paradiso - Screen 1", layout: theater1Layout },
  { id: "theater2", name: "Majestic Movies - Audi A", layout: theater2Layout },
  { id: "theater3", name: "Indieplex - Hall C (Mixed Seating)", layout: theater3Layout }, 
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white text-gray-800 p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-center">Movie Theater Seating</h1>
      </header>

      <main className="p-4 md:p-8">
        {selectedConfig ? (
          <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-lg">
            <button 
              onClick={handleBackToTheaters} 
              className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded transition duration-150 ease-in-out flex items-center text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Theaters
            </button>
            <h2 className="text-xl font-semibold mb-2 text-center text-gray-700">{selectedConfig.name}</h2>
            <p className="text-xs text-gray-500 mb-6 text-center">Select your seats</p>
            <SeatingLayout 
              key={selectedConfig.id} 
              initialLayoutConfig={selectedConfig.layout} 
              dbName={`SeatingDB-${selectedConfig.id}`} 
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-700">Select a Theater</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {theaterConfigs.map((theater) => (
                <button
                  key={theater.id}
                  onClick={() => handleSelectTheater(theater.id)}
                  className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-px transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75"
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{theater.name}</h3>
                  <p className="text-xs text-gray-500">{'Tap to view seating'}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;