import React, { useEffect, useState, useCallback, ElementType, useRef } from "react";
import { openDB, IDBPDatabase } from "idb";

export interface SeatType { 
  icon?: ElementType;
  color: string;
  price: number;
}

export interface Seat { 
  key: string;
  row: number;
  col: number;
  status: "available" | "selected" | "booked";
  sectionId: string;
  displayLabel: string; 
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

export interface SeatingLayoutProps {
  initialLayoutConfig: Omit<Layout, 'seats'>;
  dbName?: string;
}

const MAX_SELECTABLE_SEATS = 10;

const SeatingLayout: React.FC<SeatingLayoutProps> = ({ 
  initialLayoutConfig,
  dbName = "SeatingDB",
}) => {
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  const calculateDisplayLabelForSeat = (
    targetGridRow: number, // 0-indexed from top
    targetGridCol: number, // 0-indexed from left
    section: Section
  ): string => {
    if (!section.rowPatterns || !section.rowPatterns[targetGridRow]) {
      const displayRowLetter = String.fromCharCode(65 + section.rows - 1 - targetGridRow);
      return `${displayRowLetter}${targetGridCol + 1}`;
    }

    const displayRowLetter = String.fromCharCode(65 + section.rows - 1 - targetGridRow);
    let currentGridColPointer = 0;
    let seatNumberInDisplayRow = 0; 

    for (const patternItem of section.rowPatterns[targetGridRow]) {
      if (patternItem.type === 'seats') {
        for (let i = 0; i < patternItem.count; i++) {
          if (currentGridColPointer === targetGridCol) {
            return `${displayRowLetter}${seatNumberInDisplayRow + 1}`;
          }
          seatNumberInDisplayRow++;
          currentGridColPointer++;
        }
      } else { 
        if (targetGridCol >= currentGridColPointer && targetGridCol < currentGridColPointer + patternItem.count) {
          return ""; 
        }
        currentGridColPointer += patternItem.count;
      }
    }
    return ""; 
  };

  const initializeSeats = useCallback(() => {
    console.log("Attempting to initialize seats with config:", initialLayoutConfig);
    const initialSeatsMap: Record<string, Seat> = {};
    if (!initialLayoutConfig || !initialLayoutConfig.sections) {
      console.error("Cannot initialize seats: initialLayoutConfig or sections are missing.");
      setSeats({}); 
      return;
    }
    initialLayoutConfig.sections.forEach((section: Section) => {
       for (let r = 0; r < section.rows; r++) {
          for (let c = 0; c < section.cols; c++) {
             const key = `${section.id}-${r}-${c}`;
             const displayLabel = calculateDisplayLabelForSeat(r, c, section);
             initialSeatsMap[key] = {
                key: key,
                row: r,
                col: c,
                status: displayLabel ? "available" : "booked", 
                sectionId: section.id,
                displayLabel: displayLabel, 
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
        initializeSeats(); 
      }
    })();
  }, [initialLayoutConfig, initializeSeats]); 

  useEffect(() => {
    if (Object.keys(seats).length > 0) { 
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

  const showNotification = (message: string, duration: number = 3000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const dbPromise: Promise<IDBPDatabase> = openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("layouts")) {
        console.log('Creating layouts object store in IndexedDB');
        db.createObjectStore("layouts");
      }
    }
  });

  interface SeatProps {
    status: "available" | "selected" | "booked";
    icon: ElementType | null; 
    color: string;
    onClick: () => void;
    displayLabel: string; 
  }

  const SeatDisplayComponent: React.FC<SeatProps> = ({ status, icon: Icon, color, onClick, displayLabel }) => {
    const [isHovered, setIsHovered] = useState(false);
    let bgColor, textColor, borderColor;
    const seatColor = color; 

    let isGap = !displayLabel;
    if (isGap) {
        return <div style={{ width: 30, height: 30, margin: 4 }} />;
    }

    if (status === "booked") { 
      bgColor = "#A9A9A9"; 
      textColor = "#DDD";
      borderColor = "#A9A9A9";
    } else if (status === "selected" || (isHovered && status === "available")) {
      bgColor = seatColor;
      textColor = "white";
      borderColor = seatColor;
    } else { // Available, not hovered
      bgColor = "white";
      textColor = seatColor;
      borderColor = seatColor;
    }

    const hasIcon = !!Icon;
    const effectiveCursor = status === "booked" ? "not-allowed" : "pointer";

    return (
      <div
        onClick={status !== "booked" ? onClick : undefined} 
        onMouseEnter={() => status === "available" && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 30,
          height: 30,
          margin: 4,
          backgroundColor: bgColor,
          color: textColor, 
          border: `1.5px solid ${borderColor}`,
          display: "flex",
          flexDirection: 'column', 
          justifyContent: hasIcon ? "space-between" : "center", 
          alignItems: "center",
          cursor: effectiveCursor,
          borderRadius: '4px',
          fontSize: hasIcon ? '0.6rem' : '0.75rem', 
          padding: hasIcon ? '2px 0' : '0', 
          transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
        }}
        title={displayLabel} 
      >
        {Icon && <Icon style={{ fontSize: '0.8rem', color: textColor }} />}
        <div style={{ lineHeight: hasIcon ? '0.8rem' : 'normal' }}>{displayLabel}</div>
      </div>
    );
  };

  // Booking and selection logic
  const toggleSeatStatus = (sectionId: string, row: number, col: number) => {
    const seatId = `${sectionId}-${row}-${col}`;
    
    setSeats(prevSeats => {
      const currentSeat = prevSeats[seatId];
      if (!currentSeat || currentSeat.status === "booked") return prevSeats;

      const selectedSeatsCount = Object.values(prevSeats).filter(s => s.status === 'selected').length;

      if (currentSeat.status === "available") {
        if (selectedSeatsCount >= MAX_SELECTABLE_SEATS) { 
          showNotification(`You can select a maximum of ${MAX_SELECTABLE_SEATS} seat(s).`);
          return prevSeats; 
        }
        return {
          ...prevSeats,
          [seatId]: { ...currentSeat, status: "selected" as const }
        };
      } else if (currentSeat.status === "selected") {
        return {
          ...prevSeats,
          [seatId]: { ...currentSeat, status: "available" as const }
        };
      }
      // Should not be reached if logic is correct, but as a fallback:
      return prevSeats;
    });
  };

  const bookSeats = () => {
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
       if (!seat || !section || !seatTypeData) {
        console.warn(`getSeatInfo(${seatKey}): Missing data. Seat: ${!!seat}, Section: ${!!section}, SeatType: ${!!seatTypeData}`);
       }
       return { seat, section, seatType: seatTypeData };
   }, [seats, initialLayoutConfig]);

  return (
    <div className="p-4 flex flex-col items-center mx-auto relative"> 
      {/* Notification Display */}
      {notification && (
        <div 
          style={{
            position: 'fixed', 
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          {notification}
        </div>
      )}

      <div className={`w-full flex flex-col items-center`}>
        {initialLayoutConfig && initialLayoutConfig.sections && initialLayoutConfig.sections.map((section: Section) => (
          <div key={section.id} className="mb-6 flex flex-col items-center w-full">
            <h2 className="text-lg mb-2 text-gray-600 font-semibold">{section.name} (Rs. {initialLayoutConfig.seatTypes[section.seatType]?.price})</h2> 
            <div className="border p-1 inline-block"> 
              {Array.from({ length: section.rows }).map((_, rowIndex) => {
                const displayRowIdentifier = String.fromCharCode(65 + section.rows - 1 - rowIndex);
                return (
                  <div key={`section-${section.id}-row-${rowIndex}`} className="flex flex-nowrap items-center justify-center">
                    <div 
                      style={{
                        width: 20, 
                        marginRight: 8, 
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        color: '#4A5568', 
                        fontWeight: 'medium'
                      }}
                    >
                      {displayRowIdentifier}
                    </div>
                    {Array.from({ length: section.cols }).map((_, colIndex) => {
                      const seatKey = `${section.id}-${rowIndex}-${colIndex}`;
                      const { seat, seatType } = getSeatInfo(seatKey);

                      if (!seat) {
                        return <div key={seatKey} style={{ width: 30, height: 30, margin: 4, visibility: 'hidden' }} />;
                      }

                      const currentSeatType = seat.displayLabel ? seatType : undefined;

                      return (
                        <SeatDisplayComponent
                          key={seatKey} 
                          status={seat.status}
                          icon={currentSeatType?.icon || null}
                          color={currentSeatType?.color || "transparent"} 
                          onClick={() => toggleSeatStatus(section.id, seat.row, seat.col)} 
                          displayLabel={seat.displayLabel}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Screen representation - Updated container styling */}
      <div className="w-full max-w-xl my-4"> 
        <img src="/assets/screen.png" alt="Screen" style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }} /> 
      </div>

      <button 
          onClick={bookSeats} 
          disabled={Object.values(seats).filter(s => s.status === 'selected').length === 0}
          className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
          Book Now ({Object.values(seats).filter(s => s.status === 'selected').length} selected)
      </button>
    </div>
  );
};

export default SeatingLayout;