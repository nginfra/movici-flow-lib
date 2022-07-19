import {
  createTapefileFromStateAndUpdates,
  SinglePropertyTapefile,
  TapefileUpdate
} from '@movici-flow-common/visualizers/tapefile';
import { omit } from 'lodash';
function filterVersion<T>(updates: TapefileUpdate<T> | TapefileUpdate<T>[]) {
  if (Array.isArray(updates)) {
    return updates.map(upd => omit(upd, ['version']));
  }
  return omit(updates, ['version']);
}

describe('tapefile.js/createTapefileFromStateAndUpdates', () => {
  const tapefile = createTapefileFromStateAndUpdates(
    { component: null, name: 'prop' },
    {
      id: [1, 2, 3],
      prop: [0, 0, 0]
    },
    [
      {
        timestamp: 1,
        iteration: 1,
        data: {
          id: [1],
          prop: [1]
        }
      },
      {
        timestamp: 2,
        iteration: 2,
        data: {
          id: [1, 2],
          prop: [2, 2]
        }
      },
      {
        timestamp: 3,
        iteration: 3,
        data: {
          id: [2, 3],
          prop: [3, 3]
        }
      }
    ],
    {
      prop: 12
    }
  );
  it('creates a tapefile', () => {
    expect(tapefile).toBeInstanceOf(SinglePropertyTapefile);
  });
  it('has the right size', () => {
    expect(tapefile.data.length).toEqual(3);
  });
  it('has the right special value', () => {
    expect(tapefile.specialValue).toEqual(12);
  });
  it('has the right updates', () => {
    expect(filterVersion(tapefile.updates)).toStrictEqual([
      {
        timestamp: -1,
        length: 3,
        indices: [0, 1, 2],
        data: [0, 0, 0]
      },
      {
        timestamp: 1,
        length: 1,
        indices: [0],
        data: [1],
        rollback: [0],
        fullRollback: false
      },
      {
        timestamp: 2,
        length: 2,
        indices: [0, 1],
        data: [2, 2],
        rollback: [1, 0],
        fullRollback: false
      },
      {
        timestamp: 3,
        length: 2,
        indices: [1, 2],
        data: [3, 3],
        rollback: [2, 2, 0],
        fullRollback: true
      }
    ] as TapefileUpdate<unknown>[]);
  });
  it('can create a tapefile with merged updates', () => {
    const tapefile = createTapefileFromStateAndUpdates(
      { component: null, name: 'prop' },
      {
        id: [1, 2, 3],
        prop: [0, 0, 0]
      },
      [
        {
          timestamp: 0,
          iteration: 1,
          data: {
            id: [1, 2],
            prop: [1, 1]
          }
        },
        {
          timestamp: 0,
          iteration: 2,
          data: {
            id: [2, 3],
            prop: [2, 2]
          }
        }
      ]
    );
    expect(filterVersion(tapefile.updates)).toStrictEqual([
      {
        timestamp: -1,
        length: 3,
        indices: [0, 1, 2],
        data: [0, 0, 0]
      },
      {
        timestamp: 0,
        length: 3,
        indices: [0, 1, 2],
        data: [1, 2, 2],
        rollback: [0, 0, 0],
        fullRollback: true
      }
    ] as TapefileUpdate<unknown>[]);
  });
});

describe('tapefile.js/SinglePropertyTapefile', () => {
  let tapeFile: SinglePropertyTapefile<number>;
  beforeEach(() => {
    tapeFile = createTapefileFromStateAndUpdates(
      { component: null, name: 'prop' },
      {
        id: [1, 2, 3],
        prop: [0, 0, 0]
      },
      [
        {
          timestamp: 1,
          iteration: 1,
          data: {
            id: [1],
            prop: [1]
          }
        },
        {
          timestamp: 2,
          iteration: 2,
          data: {
            id: [1, 2],
            prop: [2, 2]
          }
        },
        {
          timestamp: 3,
          iteration: 3,
          data: {
            id: [2, 3],
            prop: [3, 3]
          }
        }
      ],
      {
        prop: 12
      }
    );
  });
  it('moves forward to defined time', () => {
    tapeFile.moveTo(2);
    expect(tapeFile.copyState()).toStrictEqual([2, 2, 0]);
  });
  it('moves forward to in-between time', () => {
    tapeFile.moveTo(2.5);
    expect(tapeFile.copyState()).toStrictEqual([2, 2, 0]);
  });

  it('moves backward to defined time', () => {
    tapeFile.moveTo(2);
    tapeFile.moveTo(1);
    expect(tapeFile.copyState()).toStrictEqual([1, 0, 0]);
  });
  it('stores special value', () => {
    expect(tapeFile.specialValue).toEqual(12);
  });
  it('can lazily evaluate a rollback', () => {
    const updateUnderTest = tapeFile.updates[1];
    updateUnderTest.rollback = undefined;
    updateUnderTest.fullRollback = undefined;
    tapeFile.moveTo(updateUnderTest.timestamp);
    expect(updateUnderTest.rollback).toStrictEqual([0]);
    expect(updateUnderTest.fullRollback).toBeFalsy();
  });
  it('can lazily evaluate rollback for last update', () => {
    const updateUnderTest = tapeFile.updates[tapeFile.updates.length - 1];
    updateUnderTest.rollback = undefined;
    tapeFile.moveTo(updateUnderTest.timestamp);
    expect(updateUnderTest.rollback).toStrictEqual([2, 2, 0]);
    expect(updateUnderTest.fullRollback).toBeTruthy();
  });

  it('trims full rollback when not latest', () => {
    tapeFile.trimRollbacks();
    tapeFile.updates.push({
      timestamp: 4,
      version: 1,
      indices: [0, 1, 2],
      data: [4, 4, 4],
      length: 3,
      rollback: [2, 3, 3],
      fullRollback: true
    });
    tapeFile.trimRollbacks();
    expect(tapeFile.updates[tapeFile.updates.length - 2].rollback).toStrictEqual([2, 0]);
  });
  it('only trims rollbacks once', () => {
    tapeFile.trimRollbacks();
    tapeFile.updates[0].fullRollback = true;
    tapeFile.trimRollbacks();
    expect(tapeFile.updates[0].fullRollback).toBeTruthy();
  });

  it('updates state on moveTo with new version', () => {
    const lastUpdate = tapeFile.updates[tapeFile.updates.length - 1];
    tapeFile.moveTo(lastUpdate.timestamp);
    const idx = lastUpdate.indices[0]
    const currVal = tapeFile.copyState()[idx],
      newVal = currVal + 1;
    lastUpdate.data[0] = newVal;
    lastUpdate.version++;
    tapeFile.moveTo(lastUpdate.timestamp);
    expect(tapeFile.copyState()[idx]).toStrictEqual(newVal);
  });
});
