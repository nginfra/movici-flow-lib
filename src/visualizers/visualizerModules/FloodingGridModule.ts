import type {
  Coordinate,
  FloodingGridClause,
  IMapVisualizer,
  LayerParams,
  TopologyLayerData,
} from "@movici-flow-lib/types";

import { VisualizerModule } from "./common";

import { fromArrayBuffer } from "geotiff";
import type { TypedArray } from "@deck.gl/layers/path-layer/path-layer";
import isEqual from "lodash/isEqual";
type NumberAccessor<D> = ((d: D) => number) | number;

export default class FloodingGridModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: NumberAccessor<LData>;
  currentSettings?: FloodingGridClause;
  workerID?: number;

  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    if (params.type.layerName !== "GridLayer") {
      return params;
    }
    const changed = this.updateSettings(this.info.settings?.floodingGrid);

    if (this.currentSettings) {
      const datasetUUID = this.currentSettings.heightMapDatasetUUID;
      if (!datasetUUID) throw new Error("Invalid heightmap dataset");
      const { url, options } = visualizer.getFetchRequest("datasetDataBlob", { datasetUUID });
      params.props.texture = url;
      params.props.loadOptions = Object.assign(params.props.loadOptions ?? {}, {
        fetch: options,
      });
      params.props.loaders ??= [];
      params.props.loaders.push(this.getLoader(changed));
      params.props.opacity = 0.8;
    }

    return params;
  }

  /**
   * Updates current settings. returns true when values have changed, otherwise false
   * @param settings
   */
  private updateSettings(settings?: FloodingGridClause): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  getLoader(resetStatus: boolean) {
    const status = this.info.status;
    let onDone: (() => void) | undefined = undefined;
    if (status) {
      let workerID: number | undefined;
      try {
        status.addTasks({ heightmap: 40 });
      } catch {
        workerID = this.workerID;
      }

      workerID ??= status.register(["heightmap"]);
      this.workerID = workerID;
      if (resetStatus) {
        status.updateProgress(workerID, "heightmap", 0);
      }
      onDone = () => {
        status.updateProgress(workerID as number, "heightmap", 100);
      };
    }
    return GeoTIFFLoader(onDone);
  }
}

function GeoTIFFLoader(onDone?: () => void) {
  return {
    name: "GeoTIFF Loader",
    id: "geotiff",
    extensions: ["tiff", "tif", "geotiff"],
    mimeTypes: ["image/tiff", "image/geo+tiff"],
    async parse(buffer: ArrayBuffer) {
      const geotiff = await fromArrayBuffer(buffer);
      const image = await geotiff.getImage();

      const rasters = (await image.readRasters()) as TypedArray[] & {
        width: number;
        height: number;
      };
      const [x0, y0] = image.getOrigin();
      const resolution = image.getResolution();
      const x1 = x0 + rasters.width * resolution[0];
      const y1 = y0 + rasters.height * resolution[1];
      const bboxTexture = [x0, y0, x1, y1];
      onDone?.();
      return {
        data: rasters[0],
        width: rasters.width,
        height: rasters.height,
        bbox: bboxTexture,
      };
    },
  };
}
