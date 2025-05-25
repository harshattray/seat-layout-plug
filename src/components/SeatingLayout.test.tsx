import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SeatingLayout from './SeatingLayout';
import { Seat, Section, Layout, SeatType, SeatingLayoutProps } from '@types';

// Import the actual hooks that will be mocked
import { useNotification } from '@hooks/useNotification';
import { useSeats } from '@hooks/useSeats';
import { useSeatInteraction } from '@hooks/useSeatInteraction';
import { useSeatBooking } from '@hooks/useSeatBooking';

// Mock the custom hooks
const mockShowNotification = vi.fn();
const mockSetSeats = vi.fn();
const mockHandleSeatClick = vi.fn();
const mockHandleBookNow = vi.fn();
const mockInitializeSeats = vi.fn(); // Added for useSeats

vi.mock('@hooks/useNotification', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/useNotification')>();
  return {
    ...actual,
    useNotification: vi.fn(() => ({
      notification: null, 
      showNotification: mockShowNotification,
    })),
  };
});

vi.mock('@hooks/useSeats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/useSeats')>();
  return {
    ...actual,
    useSeats: vi.fn(() => ({
      seats: {},
      setSeats: mockSetSeats,
      initializeSeats: mockInitializeSeats, // Added
    })),
  };
});

vi.mock('@hooks/useSeatInteraction', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/useSeatInteraction')>();
  return {
    ...actual,
    useSeatInteraction: vi.fn(() => ({
      handleSeatClick: mockHandleSeatClick,
      selectedSeatsCount: 0,
    })),
  };
});

vi.mock('@hooks/useSeatBooking', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/useSeatBooking')>();
  return {
    ...actual,
    useSeatBooking: vi.fn(() => ({
      handleBookNow: mockHandleBookNow,
    })),
  };
});

// Helper to create a minimal valid initialLayoutConfig
const createMockLayoutConfig = (sections: Section[] = [], seatTypes: Record<string, SeatType> = {}): Omit<Layout, 'seats'> => ({
  sections: sections.length > 0 ? sections : [
    {
      id: 'A',
      name: 'Section A',
      rows: 2,
      cols: 2,
      seatType: 'standard',
      rowPatterns: [], // Optional, can be empty for basic mock
    },
  ],
  seatTypes: Object.keys(seatTypes).length > 0 ? seatTypes : {
    standard: { color: 'bg-blue-500', price: 10 },
  },
});

const mockDefaultSeats: Record<string, Seat> = {
  'A-0-0': { key: 'A-0-0', sectionId: 'A', row: 0, col: 0, status: 'available', displayLabel: 'A1' },
  'A-0-1': { key: 'A-0-1', sectionId: 'A', row: 0, col: 1, status: 'available', displayLabel: 'A2' },
  'A-1-0': { key: 'A-1-0', sectionId: 'A', row: 1, col: 0, status: 'booked', displayLabel: 'B1' },
  'A-1-1': { key: 'A-1-1', sectionId: 'A', row: 1, col: 1, status: 'available', displayLabel: 'B2' },
};

describe('SeatingLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test

    // Setup default mock implementations for hooks using the imported and auto-mocked versions
    vi.mocked(useSeats).mockReturnValue({
      seats: mockDefaultSeats,
      setSeats: mockSetSeats,
      initializeSeats: mockInitializeSeats, // Added
    });

    vi.mocked(useSeatInteraction).mockReturnValue({
      handleSeatClick: mockHandleSeatClick,
      selectedSeatsCount: 0, // Default to 0
    });
    
    vi.mocked(useSeatBooking).mockReturnValue({
        handleBookNow: mockHandleBookNow,
    });

    // Default for useNotification (can be overridden in specific tests)
    vi.mocked(useNotification).mockReturnValue({
      notification: null, // Align with actual hook's string | null type
      showNotification: mockShowNotification,
    });
  });

  const defaultProps: SeatingLayoutProps = {
    initialLayoutConfig: createMockLayoutConfig(),
    dbName: 'TestDB',
  };

  it('should render correctly with valid props', () => {
    render(<SeatingLayout {...defaultProps} />);

    expect(screen.getByAltText('Screen')).toBeInTheDocument();
    expect(screen.getByText(/Section A/)).toBeInTheDocument();
    expect(screen.getByText(/Book Now/)).toBeInTheDocument(); 

    expect(screen.getByLabelText('Seat A1, Status: available')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat A2, Status: available')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat B1, Status: booked')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat B2, Status: available')).toBeInTheDocument();
  });

  it('should display loading message if seats are empty but config is present', () => {
    vi.mocked(useSeats).mockReturnValueOnce({ 
      seats: {}, 
      setSeats: mockSetSeats, 
      initializeSeats: mockInitializeSeats 
    });
    render(<SeatingLayout {...defaultProps} />);
    expect(screen.getByText('Loading seating layout...')).toBeInTheDocument();
  });

  it('should display error message if initialLayoutConfig is incomplete', () => {
    // @ts-ignore : Testing invalid prop for error state
    render(<SeatingLayout {...defaultProps} initialLayoutConfig={{ sections: null, seatTypes: {} } as any} />); 
    expect(screen.getByText('Error: Initial layout configuration is missing or incomplete.')).toBeInTheDocument();
  });

  it('should handle seat click and update selected count', () => {
    // Initial state: 0 selected
    vi.mocked(useSeatInteraction).mockReturnValue({
      handleSeatClick: mockHandleSeatClick,
      selectedSeatsCount: 0,
    });
    const { rerender } = render(<SeatingLayout {...defaultProps} />); 

    fireEvent.click(screen.getByLabelText('Seat A1, Status: available'));
    expect(mockHandleSeatClick).toHaveBeenCalledWith('A', 0, 0); // Assuming A-0-0 is 'A1'

    vi.mocked(useSeatInteraction).mockReturnValue({
      handleSeatClick: mockHandleSeatClick, // Keep the same mock function
      selectedSeatsCount: 1, // Update selected count
    });
    // Simulate seats data changing (e.g., A1 is now 'selected')
    const updatedSeatsAfterSelection = {
      ...mockDefaultSeats,
      'A-0-0': { ...mockDefaultSeats['A-0-0'], status: 'selected' as const },
    };
    vi.mocked(useSeats).mockReturnValue({
      seats: updatedSeatsAfterSelection,
      setSeats: mockSetSeats,
      initializeSeats: mockInitializeSeats, // Added
    });

    rerender(<SeatingLayout {...defaultProps} />); // Rerender with new mock state

    expect(screen.getByText(/Book Now \(1 selected\)/)).toBeInTheDocument();
  });

  it('should handle booking selected seats', () => {
    // Initial state: 1 seat 'A1' is selected
    const seatsWithSelection = {
      ...mockDefaultSeats,
      'A-0-0': { ...mockDefaultSeats['A-0-0'], status: 'selected' as const },
    };
    vi.mocked(useSeats).mockReturnValue({
      seats: seatsWithSelection,
      setSeats: mockSetSeats,
      initializeSeats: mockInitializeSeats, // Added
    });
    vi.mocked(useSeatInteraction).mockReturnValue({
      handleSeatClick: mockHandleSeatClick,
      selectedSeatsCount: 1,
    });

    const { rerender } = render(<SeatingLayout {...defaultProps} />);
    expect(screen.getByText(/Book Now \(1 selected\)/)).toBeInTheDocument();

    const bookNowButton = screen.getByRole('button', { name: /Book Now/ });
    fireEvent.click(bookNowButton);
    expect(mockHandleBookNow).toHaveBeenCalled();

    const seatsAfterBooking = {
      ...seatsWithSelection,
      'A-0-0': { ...seatsWithSelection['A-0-0'], status: 'booked' as const },
    };
    vi.mocked(useSeats).mockReturnValue({
      seats: seatsAfterBooking,
      setSeats: mockSetSeats,
      initializeSeats: mockInitializeSeats, // Added
    });
    vi.mocked(useSeatInteraction).mockReturnValue({
      handleSeatClick: mockHandleSeatClick,
      selectedSeatsCount: 0, // Selected count resets
    });

    rerender(<SeatingLayout {...defaultProps} />);

    expect(screen.getByText(/Book Now \(0 selected\)/)).toBeInTheDocument();
  });

  it('should display notification when a message is present', () => {
    const notificationMessage = 'Test notification!';
    vi.mocked(useNotification).mockReturnValue({
        notification: notificationMessage, 
        showNotification: mockShowNotification,
    });

    render(<SeatingLayout {...defaultProps} />);
    expect(screen.getByText(notificationMessage)).toBeInTheDocument();
  });

});
