import {
  ColorClause,
  Coordinate,
  LayerParams,
  TopologyLayerData,
  IMapVisualizer,
  RenderOrderType
} from '@movici-flow-common/types';
import isEqual from 'lodash/isEqual';
import { SinglePropertyTapefile } from '../tapefile';
import {
  TapefileAccessor,
  VisualizerModule,
  VisualizerModuleParams
} from '../visualizerModules/common';
import orderedRendering from '../layers/orderedRendering';

type RawValueAccessor<D> = (d: D) => number;

export default class RenderOrderModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: RawValueAccessor<LData>;
  currentSettings?: ColorClause;
  currentActive: boolean;
  count: number;

  constructor(params: VisualizerModuleParams) {
    super(params);
    this.count = 0;
    this.currentActive = false;
  }
  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    const changed = this.updateSettings(this.info.settings?.color ?? {});
    if (!params.props.updateTriggers) {
      params.props.updateTriggers = {};
    }
    const accessor = this.updateAccessor(changed, visualizer),
      filterRanges = this.getFilterRanges(),
      active = !!(accessor && filterRanges);

    if (active) {
      params.type = orderedRendering(params.type);
      params.props.getOrderingValue = accessor;
      params.props.filterRanges = filterRanges;
      params.props.updateTriggers['getOrderingValue'] = [this.currentSettings];
    }
    // If we change from filtered to non-filtered, we need to tell deck.gl to fully
    // re-render the layer.
    if (active !== this.currentActive) {
      visualizer.forceRender();
      this.currentActive = active;
    }

    return params;
  }

  /**
   * Updates current settings. returns true when values have changed, otherwise false
   * @param settings
   */
  private updateSettings(settings: ColorClause): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(
    changed: boolean,
    visualizer: IMapVisualizer<Coord>
  ): RawValueAccessor<LData> | undefined {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: ColorClause | undefined,
    visualizer: IMapVisualizer<Coord>
  ): RawValueAccessor<LData> | undefined {
    if (clause?.byValue?.attribute && clause?.byValue.type === 'buckets') {
      const accessor = new TapefileAccessor({
        getValue: (v: number) => {
          return v;
        }
      });
      visualizer.requestTapefile(clause.byValue.attribute, t => {
        accessor.setTapefile(t as SinglePropertyTapefile<number>);
      });
      return (d: LData) => {
        return accessor.getValue(d.idx);
      };
    }
  }

  private getFilterRanges(): [number, number][] | null {
    if (!this.currentSettings?.byValue) return null;

    const order = backwardsCompatibleOrder(this.currentSettings.advanced?.renderOrder);
    if (order === RenderOrderType.DISABLED) return null;

    const values = this.currentSettings.byValue.colors.map(pair => pair[0]);
    if (values.length < 2) return null;
    // the first color is rendered for any value until the second value in the colormap (the first
    // value doesn't actually play a role in the color calculation) so the filter range starts at
    // -inf. Similarly, the last color is valid for any value larger than the last value so the
    // filter range ends at +inf
    values[0] = Number.NEGATIVE_INFINITY;
    values.push(Number.POSITIVE_INFINITY);
    const rv: [number, number][] = [];
    for (let i = 1; i < values.length; i++) {
      rv.push([values[i - 1], values[i]]);
    }
    if (order === RenderOrderType.REVERSED) {
      rv.reverse();
    }
    return rv;
  }
}

function backwardsCompatibleOrder(order?: string): RenderOrderType {
  return Object.values(RenderOrderType).includes(order as RenderOrderType)
    ? (order as RenderOrderType)
    : RenderOrderType.DISABLED;
}
