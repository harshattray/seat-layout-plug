/**
 * @file useSeatInteraction.ts
 * @description Custom hook for managing seat selection, deselection, and interaction logic.
 * @author Harsha Attray
 * @version 1.0.0
 
 */
import { useCallback } from 'react';
import { Seat } from '@types';

const MAX_SELECTABLE_SEATS = 10;

interface UseSeatInteractionProps {
  seats: Record<string, Seat>;
  setSeats: (
    updater: (prevSeats: Record<string, Seat>) => Record<string, Seat>,
  ) => void;
  showNotification: (message: string) => void;
  maxSelectableSeats?: number;
}

export const useSeatInteraction = ({
  seats,
  setSeats,
  showNotification,
  maxSelectableSeats = MAX_SELECTABLE_SEATS,
}: UseSeatInteractionProps) => {
  const handleSeatClick = useCallback(
    (sectionId: string, row: number, col: number) => {
      const seatKey = `${sectionId}-${row}-${col}`;
      const seat = seats[seatKey];

      if (!seat || seat.status === 'booked' || !seat.displayLabel) return;

      const selectedSeatsArray = Object.values(seats).filter(
        (s) => s.status === 'selected',
      );

      if (seat.status === 'selected') {
        setSeats((prevSeats) => ({
          ...prevSeats,
          [seatKey]: { ...seat, status: 'available' },
        }));
      } else if (seat.status === 'available') {
        if (selectedSeatsArray.length >= maxSelectableSeats) {
          showNotification(
            `You can select a maximum of ${maxSelectableSeats} seats.`,
          );
          return;
        }
        setSeats((prevSeats) => ({
          ...prevSeats,
          [seatKey]: { ...seat, status: 'selected' },
        }));
      }
    },
    [seats, setSeats, showNotification, maxSelectableSeats],
  );

  const selectedSeatsCount = Object.values(seats).filter(
    (s) => s.status === 'selected',
  ).length;

  return { handleSeatClick, selectedSeatsCount };
};
