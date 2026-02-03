import { DataFilterExtension } from "@deck.gl/extensions";
import type {
  Coordinate,
  IMapVisualizer,
  ITapefile,
  LayerParams,
  TopologyLayerData,
  VisibilityClause,
} from "@movici-flow-lib/types";
import isEqual from "lodash/isEqual";
import NumberMapper from "../maps/NumberMapper";
import {
  TapefileAccessor,
  VisualizerModule,
  type VisualizerModuleParams,
} from "../visualizerModules/common";

type VisibilityAccessor<D> = ((d: D) => number) | number;

export default class VisibilityModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>,
> extends VisualizerModule<Coord, LData> {
  accessor?: null | VisibilityAccessor<LData>;
  currentSettings?: VisibilityClause;
  count: number;
  constructor(params: VisualizerModuleParams) {
    super(params);
    this.count = 0;
  }
  compose(params: LayerParams<LData, Coord>, visualizer: IMapVisualizer<Coord>) {
    const changed = this.updateSettings(this.info.settings?.visibility);

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
          filterSize: 1,
        }),
      );
      this.setUpdateTriggers(params, "getFilterValue", this.currentSettings);
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
    visualizer: IMapVisualizer<Coord>,
  ): null | VisibilityAccessor<LData> {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: VisibilityClause | undefined,
    visualizer: IMapVisualizer<Coord>,
  ): VisibilityAccessor<LData> | null {
    if (clause?.byValue.attribute) {
      const visibilityMapper = new NumberMapper<number>({
        mapping: clause.byValue.mapping.map(([inp, out]) => [Number(inp), Number(out)]),
        specialResult: 1,
        undefinedResult: 0,
      });
      const accessor: TapefileAccessor<number | null, number> = new TapefileAccessor(
        visibilityMapper,
      );

      visualizer.requestTapefile(clause.byValue.attribute, (t) => {
        accessor.setTapefile(t as ITapefile<number | null>);
      });
      return (d: LData) => accessor.getValue(d.idx);
    }

    return null;
  }
}
