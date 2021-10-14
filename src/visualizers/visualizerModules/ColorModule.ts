import {
  ByValueColorClause,
  ColorClause,
  Coordinate,
  LayerParams,
  RGBAColor,
  StaticColorClause,
  TopologyLayerData,
  VisualizerCallbacks
} from '@/types';
import isEqual from 'lodash/isEqual';
import { NumberColorMap } from '@/visualizers/maps/colorMaps';
import { SinglePropertyTapefile } from '@/visualizers/tapefile';
import { interpolateColorMapping } from '@/utils/colorUtils';
import {
  TapefileAccessor,
  VisualizerModule,
  VisualizerModuleParams
} from '@/visualizers/visualizerModules/common';

type ColorAccessor<D> = ((d: D) => RGBAColor) | RGBAColor;

export default class ColorModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: ColorAccessor<LData>;
  currentSettings?: { static?: StaticColorClause; byValue?: ByValueColorClause };
  constructor(params: VisualizerModuleParams) {
    super(params);
  }
  compose(params: LayerParams<LData, Coord>, visualizer: VisualizerCallbacks) {
    const changed = this.updateSettings(this.info.settings?.color ?? {});
    if (!params.props.updateTriggers) {
      params.props.updateTriggers = {};
    }
    const accessor = this.updateAccessor(changed, visualizer);
    let updateTriggers: string[];
    switch (params.type.layerName) {
      case 'ScatterplotLayer':
        params.props.getFillColor = accessor;
        updateTriggers = ['getFillColor'];
        break;
      case 'PolygonLayer':
        params.props.getLineColor = accessor;
        params.props.getFillColor = this.setOpacity(accessor, 80);
        updateTriggers = ['getLineColor', 'getFillColor'];
        break;
      case 'ArcLayer':
        params.props.getSourceColor = accessor;
        params.props.getTargetColor = accessor;
        updateTriggers = ['getSourceColor', 'getTargetColor'];
        break;
      default:
        params.props.getColor = accessor;
        updateTriggers = ['getColor'];
    }
    for (const trigger of updateTriggers) {
      params.props.updateTriggers[trigger] = [this.currentSettings];
    }
    return params;
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

  private updateAccessor(changed: boolean, visualizer: VisualizerCallbacks): ColorAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: ColorClause | undefined,
    visualizer: VisualizerCallbacks
  ): ColorAccessor<LData> {
    if (clause?.byValue?.attribute) {
      const colorMap = new NumberColorMap({
        colors: this.prepareColors(clause.byValue),
        specialColor: clause.byValue.specialColor ?? [0, 0, 0],
        undefinedColor: clause.byValue.undefinedColor ?? [0, 0, 0]
      });
      const accessor = new TapefileAccessor(colorMap);
      visualizer.requestTapefile(clause.byValue.attribute, t => {
        accessor.setTapefile(t as SinglePropertyTapefile<number>);
      });
      return (d: LData) => accessor.getValue(d.idx);
    }
    if (clause?.static) {
      return clause.static.color;
    }
    return [0, 0, 0];
  }
  private setOpacity(accessor: ColorAccessor<LData>, opacity: number): ColorAccessor<LData> {
    if (Array.isArray(accessor)) {
      const rv: RGBAColor = [...accessor];
      rv[3] = opacity;
      return rv;
    }
    return (d: LData) =>
      [...(accessor(d).slice(0, 3) as [number, number, number]), opacity] as RGBAColor;
  }

  prepareColors(colorClause: ByValueColorClause): [number, RGBAColor][] {
    const colors = colorClause.colors;
    if (colors.length < 2 || colorClause.type == 'buckets') {
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
      rv.push(...interpolateColorMapping(colors[i], colors[i + 1], inBetween));
    }
    rv.push(colors[colors.length - 1]);
    return rv;
  }
}
