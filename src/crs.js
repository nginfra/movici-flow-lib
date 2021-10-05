import proj4 from 'proj4';
import { reproject } from 'reproject';
import { ValidationError } from '@/errors.js';
proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
export function transform(coord) {
    return proj4('EPSG:28992', 'WGS84', [coord[0], coord[1]]);
}
export function reverseTransform(coord) {
    return proj4('WGS84', 'EPSG:28992', [coord[0], coord[1]]);
}
export function transformArray(arr) {
    const len = arr.length;
    const rv = new Array(arr.length);
    for (let i = 0; i < len; i++) {
        rv[i] = transform(arr[i]);
    }
    return rv;
}
function extractCRSName(geojson) {
    var _a, _b;
    const crsInfo = geojson.crs;
    let crsName;
    if (crsInfo === undefined)
        return 'WGS84';
    // taken from reproject.detectCRS
    if (crsInfo.type === 'name') {
        crsName = (_a = crsInfo === null || crsInfo === void 0 ? void 0 : crsInfo.properties) === null || _a === void 0 ? void 0 : _a.name;
    }
    else if (crsInfo.type === 'EPSG') {
        crsName = 'EPSG:' + ((_b = crsInfo === null || crsInfo === void 0 ? void 0 : crsInfo.properties) === null || _b === void 0 ? void 0 : _b.code);
    }
    // @ts-expect-error
    if (!proj4.defs[crsName]) {
        throw new ValidationError('Unsupported CRS: ' + JSON.stringify(crsInfo));
    }
    return crsName;
}
export function transformGeoJsonToCRS(geojson, targetCRS = 'EPSG:28992') {
    const crs = extractCRSName(geojson);
    if (crs === targetCRS)
        return geojson;
    const result = reproject(geojson, crs, targetCRS, proj4.defs);
    result.crs = { properties: { name: targetCRS }, type: 'name' };
    return result;
}
