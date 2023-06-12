import type {
  ByValueColorClause,
  ColorClause,
  Coordinate,
  LayerParams,
  RGBAColor,
  StaticColorClause,
  TopologyLayerData,
  IMapVisualizer,
  ITapefile,
} from "@movici-flow-common/types";
import isEqual from "lodash/isEqual";
import NumberMapper from "../maps/NumberMapper";
import {
  DEFAULT_POLYGON_FILL_OPACITY,
  interpolateColorMapping,
} from "@movici-flow-common/utils/colorUtils";
import {
  TapefileAccessor,
  VisualizerModule,
  type VisualizerModuleParams,
} from "../visualizerModules/common";
import {
  DEFAULT_SPECIAL_COLOR_TRIPLE,
  DEFAULT_UNDEFINED_COLOR_TRIPLE,
} from "../../utils/colorUtils";
import isError from "lodash/isError";
type ColorAccessor<D> = ((d: D) => RGBAColor) | RGBAColor;
export default class ColorModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: ColorAccessor<LData>;
  currentSettings?: ColorClause;
  constructor(params: VisualizerModuleParams) {
    super(params);
  }
  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    const changed = this.updateSettings(this.info.settings?.color ?? {});
    const accessor = this.updateAccessor(changed, visualizer);
    return this.assignAccessor(params, accessor);
  }

  /**
   * Updates current settings. returns true when values have changed, otherwise false
   * @param settings
   */
  private updateSettings(settings: {
    static?: StaticColorClause;
    byValue?: ByValueColorClause;
  }): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(
    changed: boolean,
    visualizer: IMapVisualizer<Coord>
  ): ColorAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: ColorClause | undefined,
    visualizer: IMapVisualizer<Coord>
  ): ColorAccessor<LData> {
    if (clause?.byValue?.attribute) {
      const colorMap = new NumberMapper<RGBAColor>({
        mapping: this.prepareColors(clause.byValue),
        specialResult: clause.advanced?.specialColor ?? DEFAULT_SPECIAL_COLOR_TRIPLE,
        undefinedResult: clause.advanced?.undefinedColor ?? DEFAULT_UNDEFINED_COLOR_TRIPLE,
      });

      const accessor = new TapefileAccessor(colorMap);
      visualizer.requestTapefile(clause.byValue.attribute, (t) => {
        accessor.setTapefile(t as ITapefile<number | null>);
        colorMap.setSpecialValue((t as ITapefile<number>).specialValue);
        t.onSpecialValue((val) => colorMap.setSpecialValue(val as number));
      });
      return (d: LData) => accessor.getValue(d.idx);
    }
    if (clause?.static) {
      return clause.static.color;
    }

    return DEFAULT_UNDEFINED_COLOR_TRIPLE;
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
  assignAccessor(params: LayerParams<LData, Coord>, accessor: ColorAccessor<LData>) {
    let updateTriggers: string[];
    switch (params.type.layerName) {
      case "ScatterplotLayer":
        params.props.getFillColor = accessor;
        updateTriggers = ["getFillColor"];
        break;
      case "PolygonLayer":
        params.props.getLineColor = this.asLineColor(accessor);
        params.props.getFillColor = this.asFillColor(accessor);
        updateTriggers = ["getLineColor", "getFillColor"];
        break;
      case "SolidPolygonLayer":
        params.props.getFillColor = this.asFillColor(accessor);
        updateTriggers = ["getFillColor"];
        break;
      case "ArcLayer":
        params.props.getSourceColor = accessor;
        params.props.getTargetColor = accessor;
        updateTriggers = ["getSourceColor", "getTargetColor"];
        break;
      case "ShapeIconLayer":
      default:
        params.props.getColor = accessor;
        updateTriggers = ["getColor"];
    }
    this.setUpdateTriggers(params, updateTriggers, this.currentSettings);

    return params;
  }
  private asFillColor(accessor: ColorAccessor<LData>): ColorAccessor<LData> {
    const relativeOpacity =
      (this.currentSettings?.advanced?.fillOpacity ?? DEFAULT_POLYGON_FILL_OPACITY) / 100;
    if (relativeOpacity === 1) {
      return accessor;
    }

    if (Array.isArray(accessor)) {
      return getFillOpacity(accessor, relativeOpacity);
    }
    return (d: LData) => getFillOpacity(accessor(d), relativeOpacity);
  }

  private asLineColor(accessor: ColorAccessor<LData>): ColorAccessor<LData> {
    const rawOpacity = this.currentSettings?.advanced?.fillOpacity ?? DEFAULT_POLYGON_FILL_OPACITY,
      // start darkening lines from 50% opacity upwards
      relativeOpacity = Math.max(rawOpacity - 50, 0) / 50;

    if (relativeOpacity >= 1) {
      return [0, 0, 0];
    }

    if (Array.isArray(accessor)) {
      return darken(accessor, relativeOpacity);
    }
    return (d: LData) => {
      const result = accessor(d).slice(0, 3);
      return darken(result as RGBAColor, relativeOpacity);
    };
  }
}

function getFillOpacity(color: RGBAColor, fillOpacity: number): RGBAColor {
  return [color[0], color[1], color[2], (color[3] ?? 255) * fillOpacity];
}

function darken(color: RGBAColor, fillOpacity: number): RGBAColor {
  return (color.slice(0, 3) as [number, number, number]).map(
    (c) => (1 - fillOpacity) * c
  ) as RGBAColor;
}
