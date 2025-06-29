/**
 * @file theaterLayouts.ts
 * @description Configuration data for different theater layouts and seat types.
 * @author Harsha Attray
 * @version 1.0.0
 * @license MIT
 */

import { Layout } from '@types';
import {
  BeakerIcon,
  BuildingStorefrontIcon,
  FilmIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/solid';

export interface TheaterConfig {
  id: string;
  name: string;
  layout: Omit<Layout, 'seats'>;
  screenImageUrl?: string;
}

const theater1Layout: Omit<Layout, 'seats'> = {
  sections: [
    {
      id: 'platinum-t1',
      name: 'Platinum Arena',
      seatType: 'platinum',
      rowPatterns: [
        [
          { type: 'seats', count: 2 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 6 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 2 },
        ],
        [
          { type: 'seats', count: 2 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 6 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 2 },
        ],
      ],
      rows: 2,
      cols: 12,
    },
    {
      id: 'gold-t1',
      name: 'Gold Circle',
      seatType: 'gold',
      rowPatterns: Array(5)
        .fill(null)
        .map(() => [
          { type: 'seats', count: 7 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 14 },
        ]),
      rows: 5,
      cols: 22,
    },
    {
      id: 'loungers-t1',
      name: 'Luxury Loungers',
      seatType: 'loungers',
      rowPatterns: [
        [
          { type: 'seats', count: 5 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 9 },
        ],
      ],
      rows: 1,
      cols: 15,
    },
  ],
  seatTypes: {
    platinum: { icon: FilmIcon, color: '#E5E4E2', price: 350 },
    gold: { icon: BeakerIcon, color: '#FFD700', price: 295 },
    loungers: { icon: BuildingStorefrontIcon, color: '#D3D3D3', price: 295 },
    unavailable: { icon: NoSymbolIcon, color: '#A9A9A9', price: 0 },
  },
};

const theater2Layout: Omit<Layout, 'seats'> = {
  sections: [
    {
      id: 'vip-t2',
      name: 'VIP Box',
      seatType: 'vip',
      rowPatterns: [
        [{ type: 'seats', count: 4 }],
        [{ type: 'seats', count: 4 }],
      ],
      rows: 2,
      cols: 4,
    },
    {
      id: 'regular-t2',
      name: 'Main Auditorium',
      seatType: 'regular',
      rowPatterns: Array(8)
        .fill(null)
        .map(() => [
          { type: 'seats', count: 10 },
          { type: 'gap', count: 2 },
          { type: 'seats', count: 10 },
        ]),
      rows: 8,
      cols: 22,
    },
  ],
  seatTypes: {
    vip: { icon: FilmIcon, color: '#C0C0C0', price: 500 },
    regular: { icon: BeakerIcon, color: '#ADD8E6', price: 200 },
    unavailable: { icon: NoSymbolIcon, color: '#A9A9A9', price: 0 },
  },
};

const theater3Layout: Omit<Layout, 'seats'> = {
  sections: [
    {
      id: 'balcony-t3',
      name: 'Upper Balcony',
      seatType: 'balcony',
      rowPatterns: [
        [{ type: 'seats', count: 10 }],
        [{ type: 'seats', count: 12 }],
      ],
      rows: 2,
      cols: 12,
    },
    {
      id: 'loge-t3',
      name: 'Loge Boxes',
      seatType: 'loge',
      rowPatterns: [
        [
          { type: 'seats', count: 3 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 3 },
        ],
        [
          { type: 'seats', count: 3 },
          { type: 'gap', count: 1 },
          { type: 'seats', count: 3 },
        ],
      ],
      rows: 2,
      cols: 7,
    },
    {
      id: 'economy-t3',
      name: 'Economy Plus',
      seatType: 'economy_plus',
      rowPatterns: Array(4)
        .fill(null)
        .map(() => [{ type: 'seats', count: 15 }]),
      rows: 4,
      cols: 15,
    },
  ],
  seatTypes: {
    balcony: { color: '#B0E0E6', price: 150 },
    loge: { icon: FilmIcon, color: '#DAA520', price: 250 },
    economy_plus: { color: '#90EE90', price: 180 },
    unavailable: { icon: NoSymbolIcon, color: '#A9A9A9', price: 0 },
  },
};

export const theaterConfigs: TheaterConfig[] = [
  {
    id: 'theater1',
    name: 'Cinema Paradiso - Screen 1',
    layout: theater1Layout,
    screenImageUrl: '/assets/screen.png',
  },
  { id: 'theater2', name: 'Majestic Movies - Audi A', layout: theater2Layout },
  {
    id: 'theater3',
    name: 'Indieplex - Hall C (Mixed Seating)',
    layout: theater3Layout,
  },
];
