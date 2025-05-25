import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSeatInteraction } from './useSeatInteraction';
import { Seat } from '@types';
const getMockSeats = (statuses: Record<string, 'available' | 'selected' | 'booked' | 'invalid'> = {}): Record<string, Seat> => {
  const baseSeats: Record<string, Seat> = {
    'A-1-1': { key: 'A-1-1', sectionId: 'A', row: 1, col: 1, status: 'available', displayLabel: 'A1' },
    'A-1-2': { key: 'A-1-2', sectionId: 'A', row: 1, col: 2, status: 'available', displayLabel: 'A2' },
    'A-1-3': { key: 'A-1-3', sectionId: 'A', row: 1, col: 3, status: 'booked', displayLabel: 'A3' },
    'B-1-1': { key: 'B-1-1', sectionId: 'B', row: 1, col: 1, status: 'available', displayLabel: 'B1' },
    'B-1-2': { key: 'B-1-2', sectionId: 'B', row: 1, col: 2, status: 'available', displayLabel: 'B2' },
  };

  // Apply custom statuses
  for (const key in statuses) {
    if (baseSeats[key]) {
      if (statuses[key] === 'invalid') {
        baseSeats[key].displayLabel = ''; // Changed from undefined to empty string
      } else {
        baseSeats[key].status = statuses[key] as 'available' | 'selected' | 'booked';
      }
    }
  }
  return baseSeats;
};

describe('useSeatInteraction', () => {
  let mockSetSeats: ReturnType<typeof vi.fn>;
  let mockShowNotification: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetSeats = vi.fn(); 
    mockShowNotification = vi.fn(); 
  });

  it('should initialize with 0 selected seats', () => {
    const { result } = renderHook(() =>
      useSeatInteraction({
        seats: getMockSeats(),
        setSeats: mockSetSeats,
        showNotification: mockShowNotification,
      })
    );
    expect(result.current.selectedSeatsCount).toBe(0);
  });

  it('should select an available seat', () => {
    const initialSeats = getMockSeats();
    const { result } = renderHook(() =>
      useSeatInteraction({
        seats: initialSeats,
        setSeats: mockSetSeats,
        showNotification: mockShowNotification,
      })
    );

    act(() => {
      result.current.handleSeatClick('A', 1, 1);
    });
    
    const updater = mockSetSeats.mock.calls[0][0];
    const updatedSeats = updater(initialSeats);

    expect(mockSetSeats).toHaveBeenCalledTimes(1);
    expect(updatedSeats['A-1-1'].status).toBe('selected');
    const { result: updatedResult } = renderHook(() => useSeatInteraction({ seats: updatedSeats, setSeats: mockSetSeats, showNotification: mockShowNotification }));
    expect(updatedResult.current.selectedSeatsCount).toBe(1);
  });

  it('should deselect a selected seat', () => {
    const seatsWithSelected = getMockSeats({ 'A-1-1': 'selected' });
    const { result } = renderHook(() =>
      useSeatInteraction({
        seats: seatsWithSelected,
        setSeats: mockSetSeats,
        showNotification: mockShowNotification,
      })
    );

    act(() => {
      result.current.handleSeatClick('A', 1, 1);
    });

    const updater = mockSetSeats.mock.calls[0][0];
    const updatedSeats = updater(seatsWithSelected);

    expect(mockSetSeats).toHaveBeenCalledTimes(1);
    expect(updatedSeats['A-1-1'].status).toBe('available');
    const { result: updatedResult } = renderHook(() => useSeatInteraction({ seats: updatedSeats, setSeats: mockSetSeats, showNotification: mockShowNotification }));
    expect(updatedResult.current.selectedSeatsCount).toBe(0);
  });

  it('should not select a booked seat', () => {
    const initialSeats = getMockSeats(); // A-1-3 is booked by default
    const { result } = renderHook(() =>
      useSeatInteraction({
        seats: initialSeats,
        setSeats: mockSetSeats,
        showNotification: mockShowNotification,
      })
    );

    act(() => {
      result.current.handleSeatClick('A', 1, 3);
    });

    expect(mockSetSeats).not.toHaveBeenCalled();
    expect(initialSeats['A-1-3'].status).toBe('booked');
    expect(result.current.selectedSeatsCount).toBe(0);
  });

  it('should not select an invalid seat (no displayLabel)', () => {
    const seatsWithInvalid = getMockSeats({ 'B-1-1': 'invalid' });
     const { result } = renderHook(() =>
      useSeatInteraction({
        seats: seatsWithInvalid,
        setSeats: mockSetSeats,
        showNotification: mockShowNotification,
      })
    );

    act(() => {
      result.current.handleSeatClick('B', 1, 1);
    });

    expect(mockSetSeats).not.toHaveBeenCalled();
    expect(result.current.selectedSeatsCount).toBe(0);
  });

  describe('maxSelectableSeats functionality', () => {
    it('should not allow selecting more than maxSelectableSeats (default 10)', () => {
      const initialSeats = getMockSeats();
      const seatsWithMaxSelected: Record<string, Seat> = { ...initialSeats };
      for (let i = 0; i < 10; i++) {
        if (i < 2) { // A-1-1, A-1-2
            seatsWithMaxSelected[`A-1-${i+1}`] = { ...initialSeats[`A-1-${i+1}`], status: 'selected' };
        }
        // B-1-1, B-1-2
        if (i >=2 && i < 4) {
            seatsWithMaxSelected[`B-1-${i-1}`] = { ...initialSeats[`B-1-${i-1}`], status: 'selected' };
        }
      }

      const customMax = 2;
      const twoSelectedSeats = getMockSeats({ 'A-1-1': 'selected', 'A-1-2': 'selected' });

      const { result } = renderHook(() =>
        useSeatInteraction({
          seats: twoSelectedSeats,
          setSeats: mockSetSeats,
          showNotification: mockShowNotification,
          maxSelectableSeats: customMax,
        })
      );
      
      // Attempt to select one more seat (B-1-1 is available)
      act(() => {
        result.current.handleSeatClick('B', 1, 1);
      });

      expect(mockSetSeats).not.toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith(`You can select a maximum of ${customMax} seats.`);
      const { result: updatedResultHook } = renderHook(() => useSeatInteraction({ seats: twoSelectedSeats, setSeats: mockSetSeats, showNotification: mockShowNotification, maxSelectableSeats: customMax }));
      expect(updatedResultHook.current.selectedSeatsCount).toBe(customMax); // Count should remain at customMax
    });

    it('should allow selecting another seat after deselecting one at max limit', () => {
      const customMax = 2;
      const twoSelectedSeats = getMockSeats({ 'A-1-1': 'selected', 'A-1-2': 'selected' });
      let currentSeats = { ...twoSelectedSeats };

      const testSetSeats = (updater: (prev: Record<string, Seat>) => Record<string, Seat>) => {
        currentSeats = updater(currentSeats);
        mockSetSeats(updater); // Call the actual mock for verification purposes
      };

      const { result, rerender } = renderHook(
        (props) => useSeatInteraction(props),
        {
          initialProps: {
            seats: currentSeats,
            setSeats: testSetSeats, // Pass our testSetSeats
            showNotification: mockShowNotification,
            maxSelectableSeats: customMax,
          }
        }
      );

      // At max (2 selected: A-1-1, A-1-2)
      // Attempt to select B-1-1 (available) - should fail and notify
      act(() => {
        result.current.handleSeatClick('B', 1, 1);
      });
      expect(mockSetSeats).not.toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith(`You can select a maximum of ${customMax} seats.`);
      mockShowNotification.mockClear(); // Clear mock for next assertion
      mockSetSeats.mockClear(); // Clear mock for next assertion

      // Deselect A-1-1 (1 selected: A-1-2)
      act(() => {
        result.current.handleSeatClick('A', 1, 1);
      });
      // Rerender with the updated currentSeats and the same testSetSeats function
      rerender({ seats: currentSeats, setSeats: testSetSeats, showNotification: mockShowNotification, maxSelectableSeats: customMax });
      expect(currentSeats['A-1-1'].status).toBe('available');
      expect(result.current.selectedSeatsCount).toBe(1);
      mockSetSeats.mockClear();

      // Now select B-1-1 (2 selected: A-1-2, B-1-1)
      act(() => {
        result.current.handleSeatClick('B', 1, 1);
      });
      // Rerender with the updated currentSeats and the same testSetSeats function
      rerender({ seats: currentSeats, setSeats: testSetSeats, showNotification: mockShowNotification, maxSelectableSeats: customMax });
      expect(currentSeats['B-1-1'].status).toBe('selected');
      expect(result.current.selectedSeatsCount).toBe(customMax);
      expect(mockShowNotification).not.toHaveBeenCalled(); // Should not notify this time
    });
  });

});
