import uri, { geocodeBase } from '@/flow/api/requests/uri';
import {
  GeocodeSearchQuery,
  GeocodeSearchResult,
  GeocodeSuggestion,
  ReverseGeocodeSearchQuery,
  ReverseGeocodeSearchResult,
  UUID
} from '@/flow/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '@/flow/api/requests/base';

export class GetGeocodeSuggestions extends Request<GeocodeSuggestion[]> {
  query: GeocodeSearchQuery;
  constructor(query: GeocodeSearchQuery) {
    super();
    this.query = query;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'post',
      url: `${geocodeBase}${uri.autocomplete}`,
      data: this.query
    };
  }
  makeResponse(resp: AxiosResponse): GeocodeSuggestion[] {
    return resp.data.results as GeocodeSuggestion[];
  }
}

export class GetGeocodeResults extends Request<GeocodeSearchResult[]> {
  query: GeocodeSearchQuery;
  constructor(query: GeocodeSearchQuery) {
    super();
    this.query = query;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'post',
      url: `${geocodeBase}${uri.search}`,
      data: this.query
    };
  }
  makeResponse(resp: AxiosResponse): GeocodeSearchResult[] {
    return resp.data.results as GeocodeSearchResult[];
  }
}

export class GetGeocodeResult extends Request<GeocodeSearchResult> {
  resultUUID: UUID;
  constructor(resultUUID: UUID) {
    super();
    this.resultUUID = resultUUID;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'get',
      url: `${geocodeBase}${uri.results}/${this.resultUUID}`
    };
  }
  makeResponse(resp: AxiosResponse): GeocodeSearchResult {
    return resp.data as GeocodeSearchResult;
  }
}

export class GetGeocodeAddress extends Request<ReverseGeocodeSearchResult> {
  query: ReverseGeocodeSearchQuery;
  constructor(query: ReverseGeocodeSearchQuery) {
    super();
    this.query = query;
  }
  makeRequest(): AxiosRequestConfig {
    return {
      method: 'post',
      url: `${geocodeBase}${uri.reverseSearch}`,
      data: this.query
    };
  }
}
