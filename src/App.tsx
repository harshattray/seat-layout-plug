import React, { useState } from "react";
import SeatingLayout from "@components/SeatingLayout"; 
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { theaterConfigs } from '@config/theaterLayouts';

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
              bookNowButtonColor="sky-600"
              screenImageUrl={selectedConfig.screenImageUrl}
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