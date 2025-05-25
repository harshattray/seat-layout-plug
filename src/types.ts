/**
 * @file types.ts
 * @description Defines shared TypeScript types and interfaces used throughout the application.
 * @author Harsha Attray
 */

import { ElementType } from 'react';

export interface SeatType {
  icon?: ElementType;
  color: string;
  price: number;
}

export interface Seat {
  key: string;
  row: number;
  col: number;
  status: 'available' | 'selected' | 'booked';
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
  bookNowButtonText?: string;
  bookNowButtonColor?: string;
  screenImageUrl?: string;
}
