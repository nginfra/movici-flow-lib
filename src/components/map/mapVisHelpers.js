import { getVisualizerType } from '@/visualizers';
export function determineChanges(newLayers, oldLayers) {
    const [toCreate, toDiscard, toKeep] = determineChangedIDs(newLayers, oldLayers);
    const [moreToCreate, moreToDiscard] = determineChangedVisualizers(toKeep, oldLayers);
    return [
        [...toCreate, ...moreToCreate],
        [...toDiscard, ...moreToDiscard]
    ];
}
function determineChangedIDs(newLayers, oldLayers) {
    const oldIds = new Set(oldLayers.map(l => l.id));
    const newIds = new Set(newLayers.map(l => l.id));
    const toCreate = newLayers.filter(l => !oldIds.has(l.id));
    const toDiscard = oldLayers.filter(l => !newIds.has(l.id));
    const toKeep = newLayers.filter(l => oldIds.has(l.id));
    return [toCreate, toDiscard, toKeep];
}
function determineChangedVisualizers(newLayers, oldLayers) {
    const oldLayerVisualizerTypes = oldLayers.reduce((obj, l) => {
        obj[l.id] = getVisualizerType(l);
        return obj;
    }, {});
    const oldLayersByID = oldLayers.reduce((obj, l) => {
        obj[l.id] = l;
        return obj;
    }, {});
    const [toCreate, toDiscard, toKeep] = [[], [], []];
    for (const layer of newLayers) {
        if (getVisualizerType(layer) === oldLayerVisualizerTypes[layer.id]) {
            toKeep.push(layer);
        }
        else {
            toCreate.push(layer);
            toDiscard.push(oldLayersByID[layer.id]);
        }
    }
    return [toCreate, toDiscard, toKeep];
}
