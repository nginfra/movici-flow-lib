import { UUID } from '@/flow/types/general';

export interface GeocodeSuggestion {
  text: string;
  result_uuid: UUID;
}

export interface GeocodeSearchResult {
  text: string;
  location: [number, number];
  bounding_box: [number, number, number, number];
}

export interface GeocodeSearchQuery {
  query: string;
  epsg_code?: number;
  bounding_box?: [number, number, number, number];
  nearby_location?: [number, number];
  language?: string;
}

export interface ReverseGeocodeSearchResult {
  text: string;
}

export interface ReverseGeocodeSearchQuery {
  location: [number, number];
  epsg_code: number;
  language?: string;
}
