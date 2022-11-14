import { PathStyleExtension } from '@deck.gl/extensions';
import {
  ByValueSizeClause,
  Coordinate,
  LayerParams,
  StaticSizeClause,
  SizeClause,
  TopologyLayerData,
  IMapVisualizer
} from '@movici-flow-common/types';
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
  currentDashed: boolean;
  constructor(params: VisualizerModuleParams) {
    super(params);
    this.currentDashed = false;
  }
  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    const changed = this.updateSettings(this.info.settings?.size ?? {});
    const sizeClause = this.getClause();

    const accessor = this.updateAccessor(changed, visualizer);
    let updateTriggers: string[];

    const {
      units,
      minPixels = DIMENSIONS.SIZE_MIN_PIXELS,
      maxPixels = DIMENSIONS.SIZE_MAX_PIXELS
    } = sizeClause ?? { units: 'pixels' };

    switch (params.type.layerName) {
      case 'ShapeIconLayer':
        params.props.getSize = accessor;
        params.props.sizeUnits = units;
        if (units == 'meters') {
          params.props.sizeMaxPixels = maxPixels;
          params.props.sizeMinPixels = minPixels;
        }
        updateTriggers = ['getSize'];
        break;
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

    this.setDashed(params, this.info.settings?.size?.dashed ?? false, visualizer);
    this.setUpdateTriggers(params, updateTriggers, this.currentSettings);

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

  private updateAccessor(changed: boolean, visualizer: IMapVisualizer<Coord>): SizeAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: SizeClause | undefined,
    visualizer: IMapVisualizer<Coord>
  ): SizeAccessor<LData> {
    if (clause?.byValue?.attribute) {
      const sizeMap = new NumberSizeMap({
        sizes: clause.byValue.sizes
      });

      const accessor = new TapefileAccessor(sizeMap);
      visualizer.requestTapefile(clause.byValue.attribute, t => {
        accessor.setTapefile(t as SinglePropertyTapefile<number | null>);
      });

      return (d: LData) => accessor.getValue(d.idx);
    }

    if (clause?.static) {
      return clause.static.size;
    }
    return DIMENSIONS.SIZE;
  }

  private setDashed(
    params: LayerParams<LData, Coord>,
    dashed: boolean,
    visualizer: IMapVisualizer<Coord>
  ) {
    // If we change from dashed to non-dashed, we need to tell deck.gl to fully
    // re-render the layer.
    if (dashed !== this.currentDashed) {
      visualizer.forceRender();
      this.currentDashed = dashed;
    }
    if (dashed) {
      switch (params.type.layerName) {
        case 'PathLayer':
        case 'PolygonLayer':
          params.props.extensions ??= [];
          params.props.extensions.push(
            new PathStyleExtension({ dash: true, highPrecisionDash: true })
          );
          params.props.getDashArray = [3, 6];
          break;
        default:
          break;
      }
    }
  }
}
