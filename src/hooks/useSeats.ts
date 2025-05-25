import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { Seat, Section, SeatingLayoutProps } from '@types';
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
    } else { // type === 'gap'
      // If the target column falls within a gap, it has no display label
      if (targetGridCol >= currentGridColPointer && targetGridCol < currentGridColPointer + patternItem.count) {
        return "";
      }
      currentGridColPointer += patternItem.count;
    }
  }
  return ""; // Should not be reached if logic is correct and col is within bounds
};

export const useSeats = (initialLayoutConfig: SeatingLayoutProps['initialLayoutConfig'], dbName: string = "SeatingDB") => {
  const [seats, setSeats] = useState<Record<string, Seat>>({});
  const dbPromiseRef = useRef<Promise<IDBPDatabase> | null>(null);

  if (!dbPromiseRef.current) {
    dbPromiseRef.current = openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("layouts")) {
          console.log('Creating layouts object store in IndexedDB via useSeats');
          db.createObjectStore("layouts");
        }
      },
    });
  }
  const dbPromise = dbPromiseRef.current;

  const initializeSeats = useCallback(() => {
    console.log("useSeats: Attempting to initialize seats with config:", initialLayoutConfig);
    const initialSeatsMap: Record<string, Seat> = {};
    if (!initialLayoutConfig || !initialLayoutConfig.sections) {
      console.error("useSeats: Cannot initialize seats: initialLayoutConfig or sections are missing.");
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
            status: displayLabel ? "available" : "booked", // 'booked' if no display label (e.g. gap)
            sectionId: section.id,
            displayLabel: displayLabel,
          };
        }
      }
    });
    console.log("useSeats: Initialized seats map:", initialSeatsMap);
    setSeats(initialSeatsMap);
  }, [initialLayoutConfig]);

  useEffect(() => {
    console.log("useSeats: useEffect for loading seats triggered. initialLayoutConfig or initializeSeats changed.");
    (async () => {
      try {
        const db = await dbPromise;
        console.log("useSeats: Accessing IndexedDB...");
        const savedLayout = await db.get("layouts", "currentLayout");

        let loadSavedData = false;
        if (savedLayout && typeof savedLayout.seats === 'object' && savedLayout.seats !== null && Object.keys(savedLayout.seats).length > 0) {
          const firstSavedKey = Object.keys(savedLayout.seats)[0];
          const firstConfigSectionId = initialLayoutConfig?.sections?.[0]?.id;
          if (firstSavedKey && firstConfigSectionId && firstSavedKey.startsWith(firstConfigSectionId + '-')) {
            loadSavedData = true;
          } else {
            console.warn("useSeats: Saved IndexedDB data key format appears to mismatch current layout config. Re-initializing.");
          }
        }

        if (loadSavedData) {
          console.log("useSeats: Loading seats from DB:", savedLayout.seats);
          setSeats(savedLayout.seats);
        } else {
          console.log("useSeats: No saved layout, empty seats in DB, or key mismatch. Calling initializeSeats().");
          initializeSeats();
        }
      } catch (error) {
        console.error("useSeats: Failed to load seats from DB, calling initializeSeats() as fallback.", error);
        initializeSeats();
      }
    })();
  }, [initialLayoutConfig, initializeSeats, dbPromise]);

  const saveSeatsToDB = useCallback(async (seatsData: Record<string, Seat>) => {
    try {
      const db = await dbPromise;
      await db.put("layouts", { seats: seatsData }, "currentLayout");
      console.log("useSeats: Seats saved to DB.");
    } catch (error) {
      console.error("useSeats: Failed to save seats to DB:", error);
    }
  }, [dbPromise]);

  useEffect(() => {
    if (Object.keys(seats).length > 0) {
      saveSeatsToDB(seats);
    }
  }, [seats, saveSeatsToDB]);

  return { seats, setSeats, initializeSeats };
};
