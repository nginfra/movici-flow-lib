import {
  Coordinate,
  LayerParams,
  Mapper,
  VisibilityClause,
  TopologyLayerData,
  IVisualizer
} from '@movici-flow-common/types';
import isEqual from 'lodash/isEqual';
import { SinglePropertyTapefile } from '../tapefile';
import {
  TapefileAccessor,
  VisualizerModule,
  VisualizerModuleParams
} from '../visualizerModules/common';
import { DataFilterExtension } from '@deck.gl/extensions';

type VisibilityAccessor<D> = ((d: D) => number) | number;

export default class VisibilityModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: null | VisibilityAccessor<LData>;
  currentSettings?: VisibilityClause;
  count: number;
  constructor(params: VisualizerModuleParams) {
    super(params);
    this.count = 0;
  }
  compose(params: LayerParams<LData, Coord>, visualizer: IVisualizer) {
    const changed = this.updateSettings(this.info.settings?.visibility);
    if (!params.props.updateTriggers) {
      params.props.updateTriggers = {};
    }
    const accessor = this.updateAccessor(changed, visualizer);

    // If we change from filtered to non-filtered, we need to tell deck.gl to fully
    // re-render the layer.
    if (changed) {
      visualizer.forceRender();
    }

    if (accessor !== null) {
      params.props.getFilterValue = accessor;
      params.props.filterRange = [0.1, 1];
      params.props.extensions ??= [];
      params.props.extensions.push(
        new DataFilterExtension({
          filterSize: 1
        })
      );
      params.props.updateTriggers.getFilterValue = [this.currentSettings];
    }
    return params;
  }

  /**
   * Updates current settings. returns true when values have changed, otherwise false
   * @param settings
   */
  private updateSettings(settings?: VisibilityClause): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(
    changed: boolean,
    visualizer: IVisualizer
  ): null | VisibilityAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: VisibilityClause | undefined,
    visualizer: IVisualizer
  ): VisibilityAccessor<LData> | null {
    if (clause?.byValue.attribute) {
      const visibilityMapper = new VisiblityMapper(
        clause.byValue.mapping.map(([inp, out]) => [inp, Number(out)])
      );
      const accessor: TapefileAccessor<number | boolean, number> = new TapefileAccessor(
        visibilityMapper
      );

      visualizer.requestTapefile(clause.byValue.attribute, t => {
        accessor.setTapefile(t as SinglePropertyTapefile<number>);
      });
      return (d: LData) => accessor.getValue(d.idx);
    }

    return null;
  }
}

export type BooleanMapping = [boolean | number, number][];
export class VisiblityMapper implements Mapper<number | boolean, number> {
  mapping: BooleanMapping;
  staticValue?: number;
  onValue?: boolean;
  constructor(mapping: BooleanMapping) {
    this.mapping = mapping;
    if (!this.setupSimpleMapping(mapping)) {
      throw new Error('Only supports simple, boolean mapping for visibility');
    }
  }

  setupSimpleMapping(mapping: BooleanMapping): boolean {
    if (!mapping) return true;
    if (mapping.length === 0) {
      this.staticValue = 1;
      return true;
    }

    if (mapping.every(i => i[1] == mapping[0][1])) {
      this.staticValue = mapping[0][1];
      return true;
    }

    if (mapping.every(i => typeof i[0] === 'boolean')) {
      this.onValue = mapping[0][0] == mapping[0][1];
      return true;
    }
    return false;
  }
  getValue(input: number | boolean): number {
    if (this.staticValue !== undefined) return this.staticValue;
    if (this.onValue !== undefined) return input == this.onValue ? 1 : 0;
    return 1;
  }
}
