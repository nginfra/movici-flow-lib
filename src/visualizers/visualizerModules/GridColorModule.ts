import type {
  ColorClause,
  Coordinate,
  LayerParams,
  TopologyLayerData,
  ITapefile,
  ByValueColorClause,
  IMapVisualizer,
} from "@movici-flow-lib/types";
import isEqual from "lodash/isEqual";
import { TapefileAccessor, VisualizerModule, type VisualizerModuleParams } from "./common";

import NumberToNumberMap from "../maps/NumberToNumberMap";
import type { RGBAColor } from "deck.gl";
import { interpolateColorMapping } from "@movici-flow-lib/utils/colorUtils";
import isError from "lodash/isError";
type NumberAccessor<D> = ((d: D) => number) | number;

export default class GridColorModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: NumberAccessor<LData>;
  currentSettings?: ColorClause;
  constructor(params: VisualizerModuleParams) {
    super(params);
  }
  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    if (params.type.layerName !== "GridLayer") {
      return params;
    }

    const changed = this.updateSettings(this.info.settings?.color ?? {});
    const accessor = this.updateAccessor(changed, visualizer);

    params.props.getCellValue = accessor;
    params.props.colorMap = this.getColorMap();
    this.setUpdateTriggers(params, "getCellValue", this.currentSettings);

    return params;
  }

  /**
   * Updates current settings. returns true when values have changed, otherwise false
   * @param settings
   */
  private updateSettings(settings: Pick<ColorClause, "static" | "byValue">): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(
    changed: boolean,
    visualizer: IMapVisualizer<Coord>
  ): NumberAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: ColorClause | undefined,
    visualizer: IMapVisualizer<Coord>
  ): NumberAccessor<LData> {
    if (clause?.byValue?.attribute) {
      const mapper = new NumberToNumberMap();

      const accessor = new TapefileAccessor(mapper);
      visualizer.requestTapefile(clause.byValue.attribute, (t) => {
        accessor.setTapefile(t as ITapefile<number | null>);
        mapper.setSpecialValue((t as ITapefile<number>).specialValue);
        t.onSpecialValue((val) => mapper.setSpecialValue(val as number));
      });
      return (d: LData) => accessor.getValue(d.idx);
    }
    return 0;
  }

  private getColorMap(): [number, RGBAColor][] {
    const settings = this.currentSettings;
    if (settings?.byValue) {
      return this.prepareColors(settings.byValue);
    }
    const staticColor = settings?.static?.color ?? [0, 0, 0];

    return [
      [0, staticColor],
      [1, staticColor],
    ];
  }
  prepareColors(colorClause: ByValueColorClause): [number, RGBAColor][] {
    const colors = colorClause.colors;
    if (colors.length < 2 || colorClause.type == "buckets") {
      return colors;
    }

    const minColors = 20;
    const minInBetween = 5;

    const inBetween = Math.max(
      minInBetween,
      Math.ceil((minColors - colors.length) / (colors.length - 1))
    );
    const rv: [number, RGBAColor][] = [];
    for (let i = 0; i < colors.length - 1; i++) {
      rv.push(colors[i]);
      try {
        rv.push(...interpolateColorMapping(colors[i], colors[i + 1], inBetween));
      } catch (e) {
        let msg = "Could not interpolate between colors";

        if (isError(e)) {
          msg += ": " + e.message;
        }
        throw new Error(msg);
      }
    }
    rv.push(colors[colors.length - 1]);
    return rv;
  }
}
