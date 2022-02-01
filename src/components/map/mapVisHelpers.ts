import { Nullable } from '@movici-flow-common/types';
import { getVisualizerType, VisualizerConstructor } from '@movici-flow-common/visualizers';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';

export function determineChanges(
  newLayers: ComposableVisualizerInfo[],
  oldLayers: ComposableVisualizerInfo[]
): [ComposableVisualizerInfo[], ComposableVisualizerInfo[]] {
  const [toCreate, toDiscard, toKeep] = determineChangedIDs(newLayers, oldLayers);
  const [moreToCreate, moreToDiscard] = determineChangedVisualizers(toKeep, oldLayers);

  return [
    [...toCreate, ...moreToCreate],
    [...toDiscard, ...moreToDiscard]
  ];
}

function determineChangedIDs(
  newLayers: ComposableVisualizerInfo[],
  oldLayers: ComposableVisualizerInfo[]
): [ComposableVisualizerInfo[], ComposableVisualizerInfo[], ComposableVisualizerInfo[]] {
  const oldIds = new Set(oldLayers.map(l => l.id));
  const newIds = new Set(newLayers.map(l => l.id));
  const toCreate = newLayers.filter(l => !oldIds.has(l.id));
  const toDiscard = oldLayers.filter(l => !newIds.has(l.id));
  const toKeep = newLayers.filter(l => oldIds.has(l.id));
  return [toCreate, toDiscard, toKeep];
}

function determineChangedVisualizers(
  newLayers: ComposableVisualizerInfo[],
  oldLayers: ComposableVisualizerInfo[]
): [ComposableVisualizerInfo[], ComposableVisualizerInfo[], ComposableVisualizerInfo[]] {
  const oldLayerVisualizerTypes = oldLayers.reduce(
    (obj: Record<string, Nullable<VisualizerConstructor>>, l) => {
      obj[l.id] = getVisualizerType(l);
      return obj;
    },
    {}
  );
  const oldLayersByID = oldLayers.reduce((obj: Record<string, ComposableVisualizerInfo>, l) => {
    obj[l.id] = l;
    return obj;
  }, {});
  const [toCreate, toDiscard, toKeep]: ComposableVisualizerInfo[][] = [[], [], []];
  for (const layer of newLayers) {
    if (getVisualizerType(layer) === oldLayerVisualizerTypes[layer.id]) {
      toKeep.push(layer);
    } else {
      toCreate.push(layer);
      toDiscard.push(oldLayersByID[layer.id]);
    }
  }
  return [toCreate, toDiscard, toKeep];
}
