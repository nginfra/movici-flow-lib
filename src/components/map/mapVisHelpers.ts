import { Nullable } from '@/types';
import { getVisualizerType, VisualizerConstructor } from '@/visualizers';
import { AnyVisualizerInfo } from '@/visualizers/VisualizerInfo';

export function determineChanges(
  newLayers: AnyVisualizerInfo[],
  oldLayers: AnyVisualizerInfo[]
): [AnyVisualizerInfo[], AnyVisualizerInfo[]] {
  const [toCreate, toDiscard, toKeep] = determineChangedIDs(newLayers, oldLayers);
  const [moreToCreate, moreToDiscard] = determineChangedVisualizers(toKeep, oldLayers);

  return [
    [...toCreate, ...moreToCreate],
    [...toDiscard, ...moreToDiscard]
  ];
}

function determineChangedIDs(
  newLayers: AnyVisualizerInfo[],
  oldLayers: AnyVisualizerInfo[]
): [AnyVisualizerInfo[], AnyVisualizerInfo[], AnyVisualizerInfo[]] {
  const oldIds = new Set(oldLayers.map(l => l.id));
  const newIds = new Set(newLayers.map(l => l.id));
  const toCreate = newLayers.filter(l => !oldIds.has(l.id));
  const toDiscard = oldLayers.filter(l => !newIds.has(l.id));
  const toKeep = newLayers.filter(l => oldIds.has(l.id));
  return [toCreate, toDiscard, toKeep];
}

function determineChangedVisualizers(
  newLayers: AnyVisualizerInfo[],
  oldLayers: AnyVisualizerInfo[]
): [AnyVisualizerInfo[], AnyVisualizerInfo[], AnyVisualizerInfo[]] {
  const oldLayerVisualizerTypes = oldLayers.reduce(
    (obj: Record<string, Nullable<VisualizerConstructor>>, l) => {
      obj[l.id] = getVisualizerType(l);
      return obj;
    },
    {}
  );
  const oldLayersByID = oldLayers.reduce((obj: Record<string, AnyVisualizerInfo>, l) => {
    obj[l.id] = l;
    return obj;
  }, {});
  const [toCreate, toDiscard, toKeep]: AnyVisualizerInfo[][] = [[], [], []];
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
