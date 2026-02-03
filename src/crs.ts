import proj4 from "proj4";
import { reproject } from "reproject";
import { GetEPSGProjection } from "./api/requests/epsg.io";
import { ValidationError } from "./errors";
import type {
  Coordinate3DArray,
  CoordinateArray,
  IClient,
  Point3DCoordinate,
  PointCoordinate,
} from "./types";

export type BoundingBox = [number, number, number, number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoJSON = any;
export const DEFAULT_CRS = "EPSG:28992";
export function setProjections(projections: Record<string, string>) {
  for (const [name, proj] of Object.entries(projections)) {
    proj4.defs(name, proj);
  }
}

export function transform(
  coord: PointCoordinate | Point3DCoordinate,
  crs?: string | number | null,
): PointCoordinate {
  crs = determineCRS(crs);
  return proj4(crs, "WGS84", [coord[0], coord[1]]);
}

export function reverseTransform(
  coord: PointCoordinate | Point3DCoordinate,
  crs?: string | number | null,
): PointCoordinate {
  crs = determineCRS(crs);
  return proj4("WGS84", crs, [coord[0], coord[1]]);
}

export function transformArray(
  arr: CoordinateArray | Coordinate3DArray,
  crs?: string | number | null,
): CoordinateArray {
  crs = determineCRS(crs);

  const len = arr.length;
  const rv: CoordinateArray = new Array(arr.length);
  for (let i = 0; i < len; i++) {
    rv[i] = transform(arr[i]!, crs);
  }
  return rv;
}

export function reverseTransformArray(
  arr: CoordinateArray | Coordinate3DArray,
  crs?: string | number | null,
): CoordinateArray {
  crs = determineCRS(crs);

  const len = arr.length;
  const rv: CoordinateArray = new Array(arr.length);
  for (let i = 0; i < len; i++) {
    rv[i] = reverseTransform(arr[i]!, crs);
  }
  return rv;
}
export function transformBBox(bounding_box: BoundingBox, crs?: string | number): BoundingBox {
  crs = determineCRS(crs);
  return [
    ...transform([bounding_box[0], bounding_box[1]], crs),
    ...transform([bounding_box[2], bounding_box[3]], crs),
  ];
}
export function determineCRS(crs?: string | number | null): string {
  if (typeof crs == "string") return crs;
  if (typeof crs === "number") return `EPSG:${crs}`;
  return DEFAULT_CRS;
}
function extractCRSName(geojson: GeoJSON) {
  const crsInfo = geojson.crs;
  let crsName;
  if (crsInfo === undefined) return "WGS84";

  // taken from reproject.detectCRS
  if (crsInfo.type === "name") {
    crsName = crsInfo?.properties?.name;
  } else if (crsInfo.type === "EPSG") {
    crsName = "EPSG:" + crsInfo?.properties?.code;
  }

  if (!proj4.defs(crsName)) {
    throw new ValidationError("Unsupported CRS: " + JSON.stringify(crsInfo));
  }
  return crsName;
}

export function transformGeoJsonToCRS(geojson: GeoJSON, targetCRS = "EPSG:28992") {
  const crs = extractCRSName(geojson);
  if (crs === targetCRS) return geojson;

  const result = reproject(geojson, crs, targetCRS, proj4.defs);
  result.crs = { properties: { name: targetCRS }, type: "name" };
  return result;
}

let api: IClient | null = null;

export function setClient(client: IClient) {
  api = client;
}

export async function ensureProjection(crs?: string | number | null) {
  crs = determineCRS(crs);
  if (proj4.defs(crs)) return;
  const proj = await api?.request(new GetEPSGProjection(crs));
  if (!proj) {
    throw new Error(`Could not determine projection for CRS ${crs}`);
  }
  setProjections({
    [crs]: proj,
  });
}

setProjections({
  "EPSG:28992":
    "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs",
});
