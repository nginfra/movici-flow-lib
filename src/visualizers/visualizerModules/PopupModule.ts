import type {
  Coordinate,
  ITapefile,
  LayerParams,
  PopupClause,
  PopupContent,
  TopologyLayerData,
  IMapVisualizer,
  PopupContentItem,
  DeckMouseEvent,
  PickingHandler,
} from "@movici-flow-common/types";
import isEqual from "lodash/isEqual";
import type { PickInfo } from "@deck.gl/core/lib/deck";
import { VisualizerModule, type VisualizerModuleParams } from "../visualizerModules/common";

export default class PopupModule<
  Coord extends Coordinate,
  LData extends TopologyLayerData<Coord>
> extends VisualizerModule<Coord, LData> {
  accessor: PickingHandler<LData> | null;
  currentSettings: PopupClause | null;
  enums: Record<string, string[]>;

  constructor(params: VisualizerModuleParams) {
    super(params);
    this.currentSettings = null;
    this.accessor = null;
    this.enums = this.info.summary?.general?.enum ?? {};
  }

  compose(
    params: LayerParams<LData, Coord>,
    visualizer: IMapVisualizer<Coord>
  ): LayerParams<LData, Coord> {
    const changed = this.updateSettings(this.info.settings?.popup || null),
      accessor = this.updateAccessor(changed, visualizer),
      show = this.currentSettings?.show;

    if (show) {
      params.props.onHover = accessor;
      params.props.onClick = accessor;
    }
    this.setUpdateTriggers(params, ["onHover", "onClick"], this.currentSettings);

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
    visualizer: IMapVisualizer<Coord>
  ): PickingHandler<LData> | null {
    if (!changed && this.accessor) {
      return this.accessor;
    }
    this.accessor = this.getAccessor(this.currentSettings, visualizer);
    return this.accessor;
  }

  private getAccessor(
    clause: PopupClause | null,
    visualizer: IMapVisualizer<Coord>
  ): PickingHandler<LData> | null {
    if (!clause || !(clause.show ?? true)) {
      return null;
    }

    const accessor = new PopupContentAccessor(clause);
    for (const [idx, item] of clause.items.entries()) {
      visualizer.requestTapefile(item.attribute, (t) => {
        accessor.setTapefile(t as ITapefile<unknown>, idx);
      });
    }
    const onHover = clause.onHover;

    return (info: PickInfo<LData>, ev?: DeckMouseEvent) => {
      const when = ev?.type === "click" ? "onClick" : "onHover";

      if (when === "onHover" && !onHover) {
        return false;
      }

      if (info?.object) {
        visualizer[when](accessor.getValue(info.object.idx, info, this.enums) as PopupContent, ev);
      } else {
        visualizer.onHover(null, ev);
      }

      return false;
    };
  }
}

export class PopupContentAccessor {
  private readonly tapefiles: ITapefile<unknown>[];
  private popup: PopupClause;

  constructor(popup: PopupClause) {
    this.tapefiles = new Array(popup.items.length);
    this.popup = popup;
  }

  setTapefile(tapefile: ITapefile<unknown>, index: number) {
    if (index >= this.tapefiles.length) {
      throw new Error("Tapefile assignment out of bounds");
    }
    this.tapefiles[index] = tapefile;
  }

  getValue<D>(
    index: number,
    pickInfo: PickInfo<D>,
    enums: Record<string, string[]>
  ): PopupContent<D> {
    const { title, dynamicTitle, items } = this.popup;

    return {
      entityIndex: index,
      title,
      pickInfo,
      dynamicTitle,
      items: items.map((item, idx) => {
        const rv: PopupContentItem = {
          name: item.name,
          attribute: item.attribute,
          tapefile: this.tapefiles[idx],
        };

        if (item.attribute.enum_name) {
          rv.enum = enums[item.attribute.enum_name];
        }

        return rv;
      }),
    };
  }
}
