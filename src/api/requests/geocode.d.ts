import { GeocodeSearchQuery, GeocodeSearchResult, GeocodeSuggestion, ReverseGeocodeSearchQuery, ReverseGeocodeSearchResult, UUID } from '@/types';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '@/api/requests/base.js';
export declare class GetGeocodeSuggestions extends Request<GeocodeSuggestion[]> {
    query: GeocodeSearchQuery;
    constructor(query: GeocodeSearchQuery);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): GeocodeSuggestion[];
}
export declare class GetGeocodeResults extends Request<GeocodeSearchResult[]> {
    query: GeocodeSearchQuery;
    constructor(query: GeocodeSearchQuery);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): GeocodeSearchResult[];
}
export declare class GetGeocodeResult extends Request<GeocodeSearchResult> {
    resultUUID: UUID;
    constructor(resultUUID: UUID);
    makeRequest(): AxiosRequestConfig;
    makeResponse(resp: AxiosResponse): GeocodeSearchResult;
}
export declare class GetGeocodeAddress extends Request<ReverseGeocodeSearchResult> {
    query: ReverseGeocodeSearchQuery;
    constructor(query: ReverseGeocodeSearchQuery);
    makeRequest(): AxiosRequestConfig;
}
