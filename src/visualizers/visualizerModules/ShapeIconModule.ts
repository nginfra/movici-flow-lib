import type {
  ByValueIconClause,
  Coordinate,
  IconClause,
  ITapefile,
  LayerParams,
  StaticIconClause,
  TopologyLayerData,
  IMapVisualizer,
} from "@movici-flow-lib/types";
import isEqual from "lodash/isEqual";
import NumberMapper from "../maps/NumberMapper";
import { TapefileAccessor, VisualizerModule, type VisualizerModuleParams } from "./common";
import { MAPPED_ICONS } from "./iconCommon";

type IconAccessor<D> = ((d: D) => string) | string;

const DEFAULT_SPECIAL_UNDEFINED_ICON = "question";
const DEFAULT_SPECIAL_UNDEFINED_SHAPE = "map-marker";

abstract class ShapeIconModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: IconAccessor<LData> | null;
  currentSettings?: { static?: StaticIconClause; byValue?: ByValueIconClause };
  abstract fallbackIcon: string;
  constructor(params: VisualizerModuleParams) {
    super(params);
  }

  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    const settings = this.getSettings(),
      changed = this.updateSettings(settings);

    const accessor = this.updateAccessor(changed, visualizer);

    if (params.type.layerName === "ShapeIconLayer") {
      this.updateParams(params, accessor);
    }

    return params;
  }

  private updateSettings(settings: {
    static?: StaticIconClause;
    byValue?: ByValueIconClause;
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
  ): IconAccessor<LData> | null {
    if (!changed && this.accessor) {
      return this.accessor;
    }

    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(clause: IconClause | undefined, visualizer: IMapVisualizer<Coord>) {
    if (clause?.byValue?.attribute) {
      const iconMap = new NumberMapper<string>({
        mapping: clause.byValue.icons,
        specialResult: this.fallbackIcon,
        undefinedResult: this.fallbackIcon,
      });

      const accessor = new TapefileAccessor(iconMap);
      visualizer.requestTapefile(clause.byValue.attribute, (t) => {
        accessor.setTapefile(t as ITapefile<number | null>);
        iconMap.setSpecialValue((t as ITapefile<number>).specialValue);
        t.onSpecialValue((val) => iconMap.setSpecialValue(val as number));
      });
      return (d: LData) => accessor.getValue(d.idx);
    }
    if (clause?.static) {
      const icon = clause.static.icon;
      return () => icon;
    }
    return null;
  }
  abstract getSettings(): IconClause;

  abstract updateParams(
    params: LayerParams<LData, Coord>,
    accessor: IconAccessor<LData> | null
  ): void;
}

export class IconModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends ShapeIconModule<Coord, LData> {
  fallbackIcon = DEFAULT_SPECIAL_UNDEFINED_ICON;
  getSettings() {
    return this.info.settings?.icon ?? {};
  }
  updateParams(params: LayerParams<LData, Coord>, accessor: IconAccessor<LData> | null) {
    params.props.hasIcon = !!accessor;
    params.props.getIcon = accessor;
    params.props.iconAtlas = `/static/icons/icons.png`;
    params.props.iconMapping = MAPPED_ICONS.icons;
    this.setUpdateTriggers(params, ["hasIcon", "getIcon"], this.currentSettings);
  }
}

export class ShapeModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends ShapeIconModule<Coord, LData> {
  fallbackIcon = DEFAULT_SPECIAL_UNDEFINED_SHAPE;
  getSettings() {
    return this.info.settings?.shape ?? {};
  }
  updateParams(params: LayerParams<LData, Coord>, accessor: IconAccessor<LData> | null) {
    params.props.hasShape = !!accessor;
    params.props.getShape = accessor;
    params.props.shapeAtlas = `/static/icons/shapes.png`;
    params.props.shapeMapping = MAPPED_ICONS.shapes;
    this.setUpdateTriggers(params, ["hasShape", "getShape"], this.currentSettings);
  }
}
