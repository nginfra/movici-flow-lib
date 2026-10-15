/*
An EditableGeoJsonLayer that snaps the cursor to existing geometry. It rewrites event.mapCoords
before the edit mode sees it, so the modes, onEdit and the editor store need no changes.
*/
import { EditableGeoJsonLayer, getPickedEditHandle } from "@deck.gl-community/editable-layers";
import type {
  ClickEvent,
  DraggingEvent,
  EditableGeoJsonLayerProps,
  FeatureCollection,
  PointerMoveEvent,
  StartDraggingEvent,
  StopDraggingEvent,
} from "@deck.gl-community/editable-layers";
import { ScatterplotLayer } from "@deck.gl/layers";
import type { Feature, Position } from "geojson";
import {
  findSnap,
  SNAP_TOLERANCE_PX,
  type SnapResult,
  type SnapType,
} from "@movici-flow-lib/utils/snapping";

export type SnapTrigger = "pointer" | "drag";

type SnappingProps = {
  snapTargets: Feature[];
  snapTypes: SnapType[];
  snapTolerance: number;
  snapTrigger: SnapTrigger;
};
export type SnappingEditableGeoJsonLayerProps = EditableGeoJsonLayerProps<FeatureCollection> &
  Partial<SnappingProps>;
type SnappableEvent = { screenCoords: number[]; mapCoords: Position };

const SNAP_INDICATOR_COLOR: [number, number, number, number] = [255, 0, 255, 255];

export class SnappingEditableGeoJsonLayer extends EditableGeoJsonLayer {
  static layerName = "SnappingEditableGeoJsonLayer";
  static defaultProps = {
    ...EditableGeoJsonLayer.defaultProps,
    snapTargets: [],
    snapTypes: [],
    snapTolerance: SNAP_TOLERANCE_PX,
    snapTrigger: "pointer",
  };

  constructor(props: SnappingEditableGeoJsonLayerProps) {
    super(props);
  }

  get snapProps(): SnappingProps {
    return this.props as unknown as SnappingProps;
  }

  get snapIndicator(): SnapResult | null {
    return (this.state as { snapIndicator?: SnapResult | null }).snapIndicator ?? null;
  }

  canSnap(trigger: SnapTrigger): boolean {
    const { snapTargets, snapTypes, snapTrigger } = this.snapProps;
    return snapTrigger === trigger && snapTargets.length > 0 && snapTypes.length > 0;
  }

  snapEvent<T extends SnappableEvent>(event: T): T {
    const { snapTargets, snapTypes, snapTolerance } = this.snapProps;
    const viewport = this.context.viewport;
    const snap = findSnap(event.screenCoords as [number, number], snapTargets, {
      types: snapTypes,
      tolerancePx: snapTolerance,
      project: (p) => viewport.project(p),
      unproject: (p) => viewport.unproject(p),
    });
    this.setSnapIndicator(snap);
    return snap ? { ...event, mapCoords: snap.position } : event;
  }

  setSnapIndicator(snap: SnapResult | null) {
    const current = this.snapIndicator;
    const same =
      current === snap ||
      (current !== null &&
        snap !== null &&
        current.type === snap.type &&
        current.position[0] === snap.position[0] &&
        current.position[1] === snap.position[1]);
    // only re-render when the marker really moved
    if (!same) this.setState({ snapIndicator: snap });
  }

  // A drag only snaps when it started on an edit handle
  startedOnHandle(picks: StartDraggingEvent["picks"] | null | undefined): boolean {
    return !!getPickedEditHandle(picks);
  }

  //  draw modes
  onPointerMove(event: PointerMoveEvent) {
    if (this.canSnap("pointer")) {
      super.onPointerMove(this.snapEvent(event));
    } else {
      this.setSnapIndicator(null);
      super.onPointerMove(event);
    }
  }

  onLayerClick(event: ClickEvent) {
    super.onLayerClick(this.canSnap("pointer") ? this.snapEvent(event) : event);
  }

  //  modify
  onStartDragging(event: StartDraggingEvent) {
    const snap = this.canSnap("drag") && this.startedOnHandle(event.picks);
    super.onStartDragging(snap ? this.snapEvent(event) : event);
  }

  onDragging(event: DraggingEvent) {
    const snap = this.canSnap("drag") && this.startedOnHandle(event.pointerDownPicks);
    super.onDragging(snap ? this.snapEvent(event) : event);
  }

  onStopDragging(event: StopDraggingEvent) {
    const snap = this.canSnap("drag") && this.startedOnHandle(event.pointerDownPicks);
    if (!snap) return super.onStopDragging(event);

    super.onStopDragging({
      ...this.snapEvent(event),
      picks: event.pointerDownPicks ?? event.picks,
    });
    this.setSnapIndicator(null);
  }

  renderLayers() {
    const layers = super.renderLayers();
    const snap = this.snapIndicator;
    if (!snap || !this.snapProps.snapTargets.length) return layers;
    return [
      ...layers,
      new ScatterplotLayer<SnapResult>({
        ...this.getSubLayerProps({ id: "snap-indicator" }),
        data: [snap],
        getPosition: (d) => d.position as [number, number],
        filled: false,
        stroked: true,
        radiusUnits: "pixels",
        getRadius: 8,
        lineWidthUnits: "pixels",
        getLineWidth: 2,
        getLineColor: SNAP_INDICATOR_COLOR,
        // MUST stay false: otherwise deck would crash here
        pickable: false,
      }),
    ];
  }
}
