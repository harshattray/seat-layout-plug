import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSeatBooking } from './useSeatBooking';
import { Seat } from '@types';

// Helper to create mock seats for booking tests
const getMockSeatsForBooking = (statuses: Record<string, 'available' | 'selected' | 'booked'>): Record<string, Seat> => {
  const mockSeats: Record<string, Seat> = {};
  Object.keys(statuses).forEach(key => {
    const [sectionId, rowStr, colStr] = key.split('-');
    mockSeats[key] = {
      key,
      sectionId,
      row: parseInt(rowStr, 10),
      col: parseInt(colStr, 10),
      status: statuses[key],
      displayLabel: `${sectionId}${parseInt(rowStr, 10)}${parseInt(colStr, 10)}`,
    };
  });
  return mockSeats;
};

describe('useSeatBooking', () => {
  let mockSetSeats: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetSeats = vi.fn();
  });

  it('should book selected seats and leave others unchanged', () => {
    const initialSeats = getMockSeatsForBooking({
      'A-1-1': 'selected',
      'A-1-2': 'available',
      'A-1-3': 'booked',
      'B-1-1': 'selected',
    });

    const { result } = renderHook(() => useSeatBooking({ setSeats: mockSetSeats }));

    act(() => {
      result.current.handleBookNow();
    });

    expect(mockSetSeats).toHaveBeenCalledTimes(1);
    const updater = mockSetSeats.mock.calls[0][0];
    const updatedSeats = updater(initialSeats);

    expect(updatedSeats['A-1-1'].status).toBe('booked');
    expect(updatedSeats['A-1-2'].status).toBe('available'); // Should remain available
    expect(updatedSeats['A-1-3'].status).toBe('booked');    // Should remain booked
    expect(updatedSeats['B-1-1'].status).toBe('booked');
  });

  it('should correctly handle booking when no seats are selected', () => {
    const initialSeats = getMockSeatsForBooking({
      'A-1-1': 'available',
      'A-1-2': 'booked',
    });

    const { result } = renderHook(() => useSeatBooking({ setSeats: mockSetSeats }));

    act(() => {
      result.current.handleBookNow();
    });

    expect(mockSetSeats).toHaveBeenCalledTimes(1);
    const updater = mockSetSeats.mock.calls[0][0];
    const updatedSeats = updater(initialSeats);

    expect(updatedSeats['A-1-1'].status).toBe('available');
    expect(updatedSeats['A-1-2'].status).toBe('booked');
  });

  it('should correctly handle booking with an empty seats object', () => {
    const initialSeats: Record<string, Seat> = {};
    const { result } = renderHook(() => useSeatBooking({ setSeats: mockSetSeats }));

    act(() => {
      result.current.handleBookNow();
    });

    expect(mockSetSeats).toHaveBeenCalledTimes(1);
    const updater = mockSetSeats.mock.calls[0][0];
    const updatedSeats = updater(initialSeats);

    expect(Object.keys(updatedSeats).length).toBe(0);
  });
});
