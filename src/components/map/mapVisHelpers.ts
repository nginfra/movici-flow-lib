import { Nullable } from '@movici-flow-common/types';
import { getVisualizerType, VisualizerConstructor } from '@movici-flow-common/visualizers';
import { BaseVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';

export function compareItems<T, K>(
  oldItems: T[],
  newItems: T[],
  key: (i: T) => K
): [T[], T[], T[]] {
  const oldKeys = new Set(oldItems.map(key));
  const newKeys = new Set(newItems.map(key));
  const toCreate = newItems.filter(l => !oldKeys.has(key(l)));
  const toDiscard = oldItems.filter(l => !newKeys.has(key(l)));
  const toKeep = newItems.filter(l => oldKeys.has(key(l)));
  return [toCreate, toDiscard, toKeep];
}

export function determineChanges<I extends BaseVisualizerInfo>(
  newLayers: I[],
  oldLayers: I[]
): [I[], I[]] {
  const [toCreate, toDiscard, toKeep] = determineChangedIDs(newLayers, oldLayers);
  const [moreToCreate, moreToDiscard] = determineChangedVisualizers(toKeep, oldLayers);

  return [
    [...toCreate, ...moreToCreate],
    [...toDiscard, ...moreToDiscard]
  ];
}

export function determineChangedIDs<I extends { id: string }>(
  newLayers: I[],
  oldLayers: I[]
): [I[], I[], I[]] {
  return compareItems(oldLayers, newLayers, l => l.id);
}

function determineChangedVisualizers<I extends BaseVisualizerInfo>(
  newLayers: I[],
  oldLayers: I[]
): [I[], I[], I[]] {
  const oldLayerVisualizerTypes = oldLayers.reduce(
    (obj: Record<string, Nullable<VisualizerConstructor>>, l) => {
      obj[l.id] = getVisualizerType(l);
      return obj;
    },
    {}
  );
  const oldLayersByID = oldLayers.reduce((obj: Record<string, I>, l) => {
    obj[l.id] = l;
    return obj;
  }, {});
  const [toCreate, toDiscard, toKeep]: I[][] = [[], [], []];
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
