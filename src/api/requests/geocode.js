import uri, { geocodeBase } from '@/api/requests/uri.js';
import { Request } from '@/api/requests/base.js';
export class GetGeocodeSuggestions extends Request {
    constructor(query) {
        super();
        this.query = query;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${geocodeBase}${uri.autocomplete}`,
            data: this.query
        };
    }
    makeResponse(resp) {
        return resp.data.results;
    }
}
export class GetGeocodeResults extends Request {
    constructor(query) {
        super();
        this.query = query;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${geocodeBase}${uri.search}`,
            data: this.query
        };
    }
    makeResponse(resp) {
        return resp.data.results;
    }
}
export class GetGeocodeResult extends Request {
    constructor(resultUUID) {
        super();
        this.resultUUID = resultUUID;
    }
    makeRequest() {
        return {
            method: 'get',
            url: `${geocodeBase}${uri.results}/${this.resultUUID}`
        };
    }
    makeResponse(resp) {
        return resp.data;
    }
}
export class GetGeocodeAddress extends Request {
    constructor(query) {
        super();
        this.query = query;
    }
    makeRequest() {
        return {
            method: 'post',
            url: `${geocodeBase}${uri.reverseSearch}`,
            data: this.query
        };
    }
}
