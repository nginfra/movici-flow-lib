import {
  ByValueIconClause,
  Coordinate,
  IconClause,
  LayerParams,
  StaticIconClause,
  TopologyLayerData
} from '@movici-flow-common/types';
import isEqual from 'lodash/isEqual';
import { IconMappingItem } from '../layers/ShapeIconLayer';
import { VisualizerModule, VisualizerModuleParams } from './common';
import { MAPPED_ICONS } from './iconCommon';

type IconAccessor<D> = ((d: D) => IconMappingItem) | IconMappingItem;

export default class IconModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor?: IconAccessor<LData>;
  currentSettings?: { static?: StaticIconClause; byValue?: ByValueIconClause };

  constructor(params: VisualizerModuleParams) {
    super(params);
  }

  compose(params: LayerParams<LData, Coord>) {
    const settings = this.info.settings?.icon ?? {},
      changed = this.updateSettings(settings);

    if (!params.props.updateTriggers) {
      params.props.updateTriggers = {};
    }
    const accessor = this.updateAccessor(changed);
    let updateTriggers: string[] = [];

    if (settings.static) {
      switch (params.type.layerName) {
        case 'ShapeIconLayer':
          params.props.hasIcon = !!accessor;
          params.props.getIcon = accessor;
          params.props.iconAtlas = `/static/icons/icons.png`;
          params.props.iconMapping = MAPPED_ICONS.icons;
          updateTriggers = ['getIcon'];
          break;
      }
    }

    for (const trigger of updateTriggers) {
      params.props.updateTriggers[trigger] = [this.currentSettings];
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

  private updateAccessor(changed: boolean) {
    if (!changed && this.accessor) {
      return this.accessor;
    }

    return this.getAccessor(this.currentSettings);
  }

  private getAccessor(clause: IconClause | undefined) {
    const iconName = clause?.static?.icon;
    if (!iconName) return; // this is necessary for hasIcon

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (d: LData) => {
      return iconName;
    };
  }
}
