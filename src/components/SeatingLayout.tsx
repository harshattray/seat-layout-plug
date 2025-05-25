import React, { useCallback } from "react"; 
import { Seat, Section, SeatingLayoutProps, SeatType } from "../types";
import { useNotification } from "../hooks/useNotification";
import { useSeats } from "../hooks/useSeats";
import SeatDisplayComponent from "./SeatDisplay";

const MAX_SELECTABLE_SEATS = 10;

const SeatingLayout: React.FC<SeatingLayoutProps> = ({ 
  initialLayoutConfig,
  dbName = "SeatingDB",
  bookNowButtonText = "Book Now",
  bookNowButtonColor = "blue-500",
  screenImageUrl = "/assets/screen.png",
}) => {
  const { notification, showNotification } = useNotification();
  const { seats, setSeats } = useSeats(initialLayoutConfig, dbName);

  const handleSeatClick = (sectionId: string, row: number, col: number) => {
    const seatKey = `${sectionId}-${row}-${col}`;
    const seat = seats[seatKey];

    if (!seat || seat.status === 'booked' || !seat.displayLabel) return; 

    const selectedSeatsArray = Object.values(seats).filter(s => s.status === 'selected');

    if (seat.status === 'selected') {
      setSeats(prevSeats => ({
        ...prevSeats,
        [seatKey]: { ...seat, status: 'available' },
      }));
    } else if (seat.status === 'available') {
      if (selectedSeatsArray.length >= MAX_SELECTABLE_SEATS) {
        showNotification(`You can select a maximum of ${MAX_SELECTABLE_SEATS} seats.`);
        return;
      }
      setSeats(prevSeats => ({
        ...prevSeats,
        [seatKey]: { ...seat, status: 'selected' },
      }));
    }
  };

  const handleBookNow = () => {
    console.log("Booking selected seats");
    setSeats(prevSeats => {
      const updatedSeats = { ...prevSeats };
      for (const key in updatedSeats) {
        if (updatedSeats[key].status === "selected") {
          updatedSeats[key] = { ...updatedSeats[key], status: "booked" as const };
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
    return { seat, section, seatType: seatTypeData };
  }, [seats, initialLayoutConfig]);

  if (!initialLayoutConfig || !initialLayoutConfig.sections || !initialLayoutConfig.seatTypes) {
    return <div className="text-red-500">Error: Initial layout configuration is missing or incomplete.</div>;
  }
  
  if (Object.keys(seats).length === 0 && initialLayoutConfig.sections.length > 0) {
    return <div className="p-4 text-center">Loading seating layout...</div>;
  }

  const selectedSeatsCount = Object.values(seats).filter(s => s.status === 'selected').length;

  return (
    <div className="p-4 flex flex-col items-center mx-auto relative">
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
        {initialLayoutConfig.sections.map((section: Section) => (
          <div key={section.id} className="mb-6 flex flex-col items-center w-full">
            <h2 className="text-lg mb-2 text-gray-600 font-semibold">
              {section.name} (Rs. {initialLayoutConfig.seatTypes[section.seatType]?.price})
            </h2> 
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
                          onClick={() => handleSeatClick(section.id, seat.row, seat.col)} 
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

      <div className="w-full max-w-xl my-4"> 
        <img src={screenImageUrl} alt="Screen" style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }} /> 
      </div>

      <button 
          onClick={handleBookNow} 
          disabled={selectedSeatsCount === 0}
          className={`mt-6 bg-white !text-${bookNowButtonColor} border-2 border-${bookNowButtonColor} hover:bg-${bookNowButtonColor} hover:!text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed`}
      >
          {bookNowButtonText} ({selectedSeatsCount} selected)
      </button>
    </div>
  );
};

export default SeatingLayout;