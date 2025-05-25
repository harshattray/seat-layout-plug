/**
 * @file useSeatBooking.ts
 * @description Custom hook for handling the logic of booking selected seats.
 * @author Harsha Attray
 * @version 1.0.0
 * @license MIT
 */
import { useCallback } from 'react';
import { Seat } from '@types';

interface UseSeatBookingProps {
  setSeats: (
    updater: (prevSeats: Record<string, Seat>) => Record<string, Seat>,
  ) => void;
}

export const useSeatBooking = ({ setSeats }: UseSeatBookingProps) => {
  const handleBookNow = useCallback(() => {
    console.log('Booking selected seats via useSeatBooking hook');
    setSeats((prevSeats) => {
      const updatedSeats = { ...prevSeats };
      for (const key in updatedSeats) {
        if (updatedSeats[key].status === 'selected') {
          updatedSeats[key] = {
            ...updatedSeats[key],
            status: 'booked' as const,
          };
        }
      }
      return updatedSeats;
    });
  }, [setSeats]);

  return { handleBookNow };
};
