import { Coordinate, IconClause, LayerParams, TopologyLayerData } from '@movici-flow-common/types';
import isEqual from 'lodash/isEqual';
import { IconMappingItem } from '../layers/ShapeIconLayer';
import { VisualizerModule, VisualizerModuleParams } from './common';
import { MAPPED_ICONS } from './iconCommon';

type IconAccessor<D> = ((d: D) => IconMappingItem) | IconMappingItem;

export default class ShapeModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: IconAccessor<LData>;
  currentSettings?: IconClause;

  constructor(params: VisualizerModuleParams) {
    super(params);
  }

  compose(params: LayerParams<LData, Coord>) {
    const settings = this.info.settings?.shape ?? {},
      changed = this.updateSettings(settings);

    if (!params.props.updateTriggers) {
      params.props.updateTriggers = {};
    }
    const accessor = this.updateAccessor(changed);
    let updateTriggers: string[] = [];

    switch (params.type.layerName) {
      case 'ShapeIconLayer':
        params.props.hasShape = !!accessor;
        params.props.getShape = accessor;
        params.props.shapeMapping = MAPPED_ICONS['shapes'];
        updateTriggers = ['getShape'];
        break;
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
  private updateSettings(settings: IconClause): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(changed: boolean) {
    if (!changed && this.accessor) {
      return this.accessor;
    }

    return this.getAccessor(this.currentSettings);
  }

  private getAccessor(clause: IconClause | undefined) {
    const iconName = clause?.static?.icon;
    if (!iconName) return; // this is necessary for hasShape

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (d: LData) => {
      return iconName;
    };
  }
}
