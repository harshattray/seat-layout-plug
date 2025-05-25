import React, { useEffect, useState, useCallback, ElementType, useMemo } from "react";
import { openDB, IDBPDatabase } from "idb";

export interface SeatType { 
  icon: ElementType;
  color: string;
  price: number;
}

export interface Seat { 
  key: string;
  row: number;
  col: number;
  status: "available" | "selected" | "booked";
  sectionId: string;
}

export interface Section { 
  id: string;
  name: string;
  rows: number; 
  cols: number; 
  seatType: string;
  rowPatterns?: Array<{ type: 'seats' | 'gap'; count: number }[]>; 
}

export interface Layout { 
  sections: Section[];
  seatTypes: Record<string, SeatType>;
  seats: Record<string, Seat>; 
}

interface SeatingLayoutProps {
  initialLayoutConfig: Omit<Layout, 'seats'>; 
}

// Moved dbPromise outside the component for stability
const dbPromise: Promise<IDBPDatabase> = openDB("SeatingDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("layouts")) {
      console.log('Creating layouts object store in IndexedDB');
      db.createObjectStore("layouts");
    }
  }
});

const SeatingLayout: React.FC<SeatingLayoutProps> = ({ initialLayoutConfig }) => {
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [numberOfTickets, setNumberOfTickets] = useState<number>(1);

  // initializeSeats definition moved before its usage in useEffect
  const initializeSeats = useCallback(() => {
    console.log("Attempting to initialize seats with config:", initialLayoutConfig);
    const initialSeatsMap: Record<string, Seat> = {};
    if (!initialLayoutConfig || !initialLayoutConfig.sections) {
      console.error("Cannot initialize seats: initialLayoutConfig or sections are missing.");
      setSeats({}); // Set to empty if config is bad
      return;
    }
    initialLayoutConfig.sections.forEach((section: Section) => {
       for (let r = 0; r < section.rows; r++) {
          for (let c = 0; c < section.cols; c++) {
             const key = `${section.id}-${r}-${c}`;
             initialSeatsMap[key] = {
                key: key,
                row: r,
                col: c,
                status: "available",
                sectionId: section.id,
             };
          }
       }
    });
    console.log("Initialized seats map:", initialSeatsMap);
    setSeats(initialSeatsMap);
  },[initialLayoutConfig]);

  useEffect(() => {
    console.log("SeatingLayout: useEffect for loading seats triggered. initialLayoutConfig changed or initializeSeats changed.");
    (async () => {
      try {
        const db = await dbPromise;
        console.log("Accessing IndexedDB...");
        const savedLayout = await db.get("layouts", "currentLayout"); 

        let loadSavedData = false;
        if (savedLayout && typeof savedLayout.seats === 'object' && savedLayout.seats !== null && Object.keys(savedLayout.seats).length > 0) {
          // Basic check: Does the first key in saved data seem to match the current config's first section ID?
          const firstSavedKey = Object.keys(savedLayout.seats)[0];
          const firstConfigSectionId = initialLayoutConfig?.sections?.[0]?.id;
          if (firstSavedKey && firstConfigSectionId && firstSavedKey.startsWith(firstConfigSectionId + '-')) {
            loadSavedData = true;
          } else {
            console.warn("Saved IndexedDB data key format appears to mismatch current layout config. Re-initializing.");
          }
        }

        if (loadSavedData) {
           console.log("Loading seats from DB:", savedLayout.seats);
           setSeats(savedLayout.seats);
        } else {
           console.log("No saved layout, empty seats in DB, or key mismatch. Calling initializeSeats().");
           initializeSeats();
        }
      } catch (error) {
        console.error("Failed to load seats from DB, calling initializeSeats() as fallback.", error);
        initializeSeats(); // Fallback to initialize
      }
    })();
  }, [initialLayoutConfig, initializeSeats]); // dbPromise removed from deps as it's stable now

  useEffect(() => {
    if (Object.keys(seats).length > 0) { 
      // console.log("Saving seats to DB:", seats); // Optional: can be noisy
      saveSeats(seats);
    }
  }, [seats]);

  const saveSeats = async (seatsData: Record<string, Seat>) => {
    try {
      const db = await dbPromise;
      await db.put("layouts", { seats: seatsData }, "currentLayout"); 
    } catch (error) {
      console.error("saveSeats: Failed to save seats to DB:", error);
    }
  };

  interface SeatProps {
    status: "available" | "selected" | "booked";
    icon: ElementType | null;
    color: string;
    onClick: () => void;
  }

  const SeatDisplayComponent: React.FC<SeatProps> = ({ status, icon: Icon, color, onClick }) => {
    // console.log(`SeatDisplayComponent props: status=${status}, icon=${Icon ? 'Exists' : 'Null'}, color=${color}`); // Optional: can be very noisy
    let bgColor = color;
    if (status === "booked") bgColor = "#ccc";
    if (status === "selected") bgColor = "#8FBC8F";

    return (
      <div
        onClick={onClick}
        style={{
          width: 30,
          height: 30,
          margin: 4,
          backgroundColor: bgColor,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: status !== "booked" ? "pointer" : "not-allowed",
          border: status === "selected" ? "2px solid #4682B4" : "none",
          borderRadius: '4px'
        }}
      >
        {Icon && <Icon style={{ fontSize: '1rem', color: '#1f2937' }} />}
      </div>
    );
  };

  const toggleSeatStatus = (sectionId: string, row: number, col: number) => {
    const seatKey = `${sectionId}-${row}-${col}`;
    console.log(`Toggling seat: ${seatKey}`);
    setSeats(prevSeats => {
      const seatToToggle = prevSeats[seatKey];
      console.log(`Seat to toggle (${seatKey}):`, seatToToggle, 'Current NofTickets:', numberOfTickets);

      if (!seatToToggle || seatToToggle.status === "booked") {
        console.log(`Seat ${seatKey} not found or booked.`);
        return prevSeats;
      }

      const selectedSeatsCount = Object.values(prevSeats).filter(seat => seat.status === "selected").length;
      console.log(`Currently selected seats: ${selectedSeatsCount}`);

      if (seatToToggle.status === "available" && selectedSeatsCount < numberOfTickets) {
        console.log(`Selecting seat ${seatKey}`);
        return { ...prevSeats,
          [seatKey]: { ...seatToToggle, status: "selected" as const }
        };
      } else if (seatToToggle.status === "selected") {
        console.log(`Deselecting seat ${seatKey}`);
        return { ...prevSeats,
          [seatKey]: { ...seatToToggle, status: "available" as const }
        };
      } else {
        console.log(`Cannot toggle seat ${seatKey}: available but selected count (${selectedSeatsCount}) >= numberOfTickets (${numberOfTickets})`);
        return prevSeats;
      }
    });
  };

  const bookSelectedSeats = () => {
    console.log("Booking selected seats");
    setSeats(prevSeats => {
      const updatedSeats = { ...prevSeats };
      for (const seatKey in updatedSeats) {
        if (updatedSeats[seatKey].status === "selected") {
          updatedSeats[seatKey].status = "booked" as const;
        }
      }
      return updatedSeats;
    });
  };

  const getSeatInfo = useCallback((seatKey: string) => {
       const seat = seats[seatKey];
       let section, seatTypeData;
       if (seat) {
         section = initialLayoutConfig.sections.find((s: Section) => s.id === seat.sectionId);
         if (section) {
           seatTypeData = initialLayoutConfig.seatTypes[section.seatType];
         }
       }
       // console.log(`getSeatInfo for ${seatKey}: seat=${!!seat}, section=${!!section}, seatTypeData=${!!seatTypeData}`); // Optional: can be noisy
       if (!seat || !section || !seatTypeData) {
        // console.warn(`getSeatInfo(${seatKey}): Missing data. Seat: ${!!seat}, Section: ${!!section}, SeatType: ${!!seatTypeData}`);
       }
       return { seat, section, seatType: seatTypeData };
   }, [seats, initialLayoutConfig]);

   const seatKeys: string[] = useMemo(() => {
       console.log("Recalculating seatKeys. initialLayoutConfig sections:", initialLayoutConfig?.sections?.length);
       const keys: string[] = [];
       if (!initialLayoutConfig || !initialLayoutConfig.sections) {
         console.warn("Cannot generate seatKeys: initialLayoutConfig or sections are missing.");
         return keys;
       }
       initialLayoutConfig.sections.forEach((section: Section) => {
           for(let r = 0; r < section.rows; r++) {
               for (let c = 0; c < section.cols; c++) {
                   keys.push(`${section.id}-${r}-${c}`);
               }
           }
       });
       console.log(`Generated ${keys.length} seatKeys.`);
       return keys;
   }, [initialLayoutConfig]);


  return (
    <div className="p-4 flex flex-col items-center mx-auto">
      <div 
        className="mb-8 p-3 bg-gray-700 text-white text-center rounded-lg shadow-md w-4/5 max-w-md mx-auto"
      >
        All eyes this way please!
      </div>

      <div className="mb-4 flex items-center">
          <label htmlFor="numTickets" className="mr-2">Number of Tickets (1-8):</label>
          <input
              type="number"
              id="numTickets"
              min="1"
              max="8"
              value={numberOfTickets}
              onChange={(e) => setNumberOfTickets(parseInt(e.target.value, 10))}
              className="border p-1 w-16 text-center"
          />
      </div>

      <div className="w-full flex flex-col items-center">
        {initialLayoutConfig && initialLayoutConfig.sections && initialLayoutConfig.sections.map((section: Section) => (
          <div key={section.id} className="mb-6 flex flex-col items-center">
            <h2 className="text-lg mb-2">{section.name} (Rs. {initialLayoutConfig.seatTypes[section.seatType]?.price})</h2>
            <div className="flex flex-wrap justify-center w-fit border p-2">
              {seatKeys
                  .filter(key => key.startsWith(section.id + '-'))
                  .map(seatKey => {
                   const { seat, seatType } = getSeatInfo(seatKey);
                   const status = seat?.status || "available";
                   const icon = seatType?.icon || null; 
                   const color = seatType?.color || "#ccc";

                   return (
                     <div key={seatKey}>
                        <SeatDisplayComponent
                          status={status}
                          icon={icon}
                          color={color}
                          onClick={() => toggleSeatStatus(section.id, seat?.row || 0, seat?.col || 0)}
                        />
                     </div>
                   );
                 })
               }
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
          <button
              onClick={bookSelectedSeats}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={Object.values(seats).filter(seat => seat.status === "selected").length === 0}
          >
              Book Now
          </button>
      </div>

    </div>
  );
};

export default SeatingLayout;