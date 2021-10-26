import {
  Coordinate,
  LayerParams,
  PopupClause,
  PopupContent,
  TopologyLayerData,
  VisualizerCallbacks
} from '@/flow/types';
import isEqual from 'lodash/isEqual';
import { PickInfo } from '@deck.gl/core/lib/deck';
import { SinglePropertyTapefile } from '@/flow/visualizers/tapefile';
import {
  VisualizerModule,
  VisualizerModuleParams
} from '@/flow/visualizers/visualizerModules/common';

type PickingHandler<D> = (info: PickInfo<D>) => boolean;

export default class PopupModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor: PickingHandler<LData> | null;
  currentSettings: PopupClause | null;

  constructor(params: VisualizerModuleParams) {
    super(params);
    this.currentSettings = null;
    this.accessor = null;
  }

  compose(
    params: LayerParams<LData, Coord>,
    visualizer: VisualizerCallbacks
  ): LayerParams<LData, Coord> {
    const changed = this.updateSettings(this.info.settings?.popup || null),
      accessor = this.updateAccessor(changed, visualizer),
      when = this.currentSettings?.when,
      show = this.currentSettings?.show ?? true;

    params.props.pickable = false;

    if (show) {
      if (when) {
        params.props.pickable = true;
        params.props[when] = accessor;
      }
      // to close popup while on hover
      if (when === 'onHover') {
        params.props.onClick = () => {
          visualizer.onHover(null);
        };
      }
    }

    return params;
  }
  private updateSettings(settings: PopupClause | null): boolean {
    const changed = !isEqual(settings, this.currentSettings);
    if (changed) {
      this.currentSettings = settings;
    }
    return changed;
  }

  private updateAccessor(
    changed: boolean,
    visualizer: VisualizerCallbacks
  ): PickingHandler<LData> | null {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: PopupClause | null,
    visualizer: VisualizerCallbacks
  ): PickingHandler<LData> | null {
    if (!clause || !(clause.show ?? true)) {
      return null;
    }

    const accessor = new PopupContentAccessor(clause);
    for (const [idx, item] of clause.items.entries()) {
      visualizer.requestTapefile(item.attribute, t => {
        accessor.setTapefile(t, idx);
      });
    }

    // TODO fix typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (info: any) => {
      if (info && info.object) {
        visualizer[clause.when](accessor.getValue(info.object.idx, info));
      } else {
        visualizer[clause.when](null);
      }
      return true;
    };
  }
}

export class PopupContentAccessor {
  private readonly tapefiles: SinglePropertyTapefile<unknown>[];
  private popup: PopupClause;
  constructor(popup: PopupClause) {
    this.tapefiles = new Array(popup.items.length);
    this.popup = popup;
  }
  setTapefile(tapefile: SinglePropertyTapefile<unknown>, index: number) {
    if (index >= this.tapefiles.length) {
      throw new Error('Tapefile assignment out of bounds');
    }
    this.tapefiles[index] = tapefile;
  }

  getValue(index: number, pickInfo: PickInfo<unknown>): PopupContent {
    return {
      title: this.popup.title,
      pickInfo,
      when: this.popup.when,
      position: this.popup.position,
      items: this.popup.items.map((item, idx) => {
        return {
          name: item.name,
          attribute: item.attribute,
          tapefile: this.tapefiles[idx]
        };
      }),
      index
    };
  }
}
