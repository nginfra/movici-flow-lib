import {
  ByValueSizeClause,
  Coordinate,
  LayerParams,
  StaticSizeClause,
  SizeClause,
  TopologyLayerData,
  VisualizerCallbacks
} from '@/flow/src/types';
import isEqual from 'lodash/isEqual';
import { NumberSizeMap } from '../maps/sizeMaps';
import { SinglePropertyTapefile } from '../tapefile';
import { DIMENSIONS } from '../visualizers';
import { TapefileAccessor, VisualizerModule, VisualizerModuleParams } from './common';

type SizeAccessor<D> = ((d: D) => number) | number;

export default class SizeModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: SizeAccessor<LData>;
  currentSettings?: { static?: StaticSizeClause; byValue?: ByValueSizeClause };
  constructor(params: VisualizerModuleParams) {
    super(params);
  }
  compose(params: LayerParams<LData, Coord>, visualizer: VisualizerCallbacks) {
    const changed = this.updateSettings(this.info.settings?.size ?? {});
    const sizeClause = this.getClause();

    if (!params.props.updateTriggers) {
      params.props.updateTriggers = {};
    }
    const accessor = this.updateAccessor(changed, visualizer);
    let updateTriggers: string[];

    const {
      units,
      minPixels = DIMENSIONS.SIZE_MIN_PIXELS,
      maxPixels = DIMENSIONS.SIZE_MAX_PIXELS
    } = sizeClause ?? { units: 'pixels' };

    switch (params.type.layerName) {
      case 'ScatterplotLayer':
        params.props.getRadius = accessor;
        params.props.radiusUnits = units;
        if (units == 'meters') {
          params.props.radiusMaxPixels = maxPixels;
          params.props.radiusMinPixels = minPixels;
        }
        updateTriggers = ['getRadius'];
        break;
      case 'PathLayer':
      case 'LineLayer':
      case 'ArcLayer':
        params.props.getWidth = accessor;
        params.props.widthUnits = units;
        if (units == 'meters') {
          params.props.widthMaxPixels = maxPixels;
          params.props.widthMinPixels = minPixels;
        }
        updateTriggers = ['getWidth'];
        break;
      case 'PolygonLayer':
        params.props.getLineWidth = accessor;
        params.props.lineWidthUnits = units;
        if (units === 'meters') {
          params.props.lineWidthMaxPixels = maxPixels;
          params.props.lineWidthMinPixels = minPixels;
        }
        updateTriggers = ['getLineWidth'];
        break;
      default:
        params.props.getWidth = accessor;
        updateTriggers = ['getWidth'];
    }

    for (const trigger of updateTriggers) {
      params.props.updateTriggers[trigger] = [this.currentSettings];
    }
    return params;
  }

  getClause() {
    const size = this.info.settings?.size;
    if (size?.static) return size.static;
    if (size?.byValue) return size.byValue;
    return null;
  }

  /**
   * Updates current settings. returns true when values have changed, otherwise false
   * @param settings
   */
  private updateSettings(settings: {
    static?: StaticSizeClause;
    byValue?: ByValueSizeClause;
  }): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(changed: boolean, visualizer: VisualizerCallbacks): SizeAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: SizeClause | undefined,
    visualizer: VisualizerCallbacks
  ): SizeAccessor<LData> {
    if (clause?.byValue?.attribute) {
      const sizeMap = new NumberSizeMap({
        sizes: clause.byValue.sizes
      });

      const accessor = new TapefileAccessor(sizeMap);
      visualizer.requestTapefile(clause.byValue.attribute, t => {
        accessor.setTapefile(t as SinglePropertyTapefile<number>);
      });

      return (d: LData) => accessor.getValue(d.idx);
    }

    if (clause?.static) {
      return clause.static.size;
    }
    return DIMENSIONS.SIZE;
  }
}
