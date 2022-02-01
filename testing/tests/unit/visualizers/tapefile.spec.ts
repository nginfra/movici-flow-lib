import {
  createTapefileFromStateAndUpdates,
  mergeUpdates,
  SinglePropertyTapefile,
  TapefileBuilder
} from '@movici-flow-common/visualizers/tapefile';
import { EntityGroupData } from '@movici-flow-common/types';
const initialState = {
  id: [1, 2, 3],
  component: {
    some_property: [6, 6, 8]
  }
};

const someUpdate = {
  id: [2],
  component: {
    some_property: [7]
  }
};

function makeBuilder<T>(initialState: EntityGroupData<T>) {
  return new TapefileBuilder({ component: 'component', name: 'some_property' }, initialState);
}
describe('tapefile.js/mergeUpdates', () => {
  it('can merge updates', () => {
    expect(
      mergeUpdates(
        {
          timestamp: 0,
          length: 2,
          indices: [2, 3],
          data: [5, 5]
        },
        {
          timestamp: 0,
          length: 2,
          indices: [2, 4],
          data: [6, 6]
        }
      )
    ).toStrictEqual({
      timestamp: 0,
      length: 3,
      indices: [2, 3, 4],
      data: [6, 5, 6]
    });
  });
});
describe('tapefile.js/TapefileBuilder', () => {
  it('can parse an initial data', () => {
    const builder = new TapefileBuilder(
      { component: 'component', name: 'some_property' },
      initialState
    );

    expect(builder.updates).toStrictEqual([
      {
        timestamp: 0,
        length: 3,
        indices: [0, 1, 2],
        data: [6, 6, 8],
        rollback: [null, null, null]
      }
    ]);
  });
  it('can add an update', () => {
    const builder = makeBuilder(initialState);
    builder.addUpdate({ timestamp: 1, iteration: 1, data: someUpdate });
    expect(builder.updates.length).toBe(2);
    expect(builder.updates[1]).toStrictEqual({
      timestamp: 1,
      length: 1,
      indices: [1],
      data: [7],
      rollback: [6]
    });
  });
  it('merges updates at equal timestamps', () => {
    const builder = makeBuilder(initialState);
    builder.addUpdate({ timestamp: 0, iteration: 1, data: someUpdate });
    expect(builder.updates).toStrictEqual([
      {
        timestamp: 0,
        length: 3,
        indices: [0, 1, 2],
        data: [6, 7, 8],
        rollback: [null, null, null]
      }
    ]);
  });
  it('ignores updates without correct data', () => {
    const builder = makeBuilder(initialState);
    builder.addUpdate({
      timestamp: 0,
      iteration: 1,
      data: {
        id: [1, 2],
        different_property: [3, 4]
      }
    });
    expect(builder.updates.length).toBe(1);
  });

  it('ignores null values in updates', () => {
    const builder = makeBuilder(initialState);
    builder.addUpdate({
      timestamp: 1,
      iteration: 1,
      data: {
        id: [1, 2],
        component: {
          some_property: [4, null]
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    });
    expect(builder.updates[1]).toStrictEqual({
      timestamp: 1,
      length: 1,
      indices: [0],
      data: [4],
      rollback: [6]
    });
  });

  it('works correctly without initial state on t0', () => {
    const initialState = {
      id: [1, 2, 3]
    };
    const builder = makeBuilder(initialState);
    builder.addUpdate({
      timestamp: 1,
      iteration: 1,
      data: {
        id: [1, 2],
        component: {
          some_property: [3, 4]
        }
      }
    });
    const tapefile = builder.createTapefile();
    tapefile.moveTo(0);
    expect(tapefile.copyState()).toStrictEqual([null, null, null]);
  });

  it('works correctly without initial state on first update', () => {
    const initialState = {
      id: [1, 2, 3]
    };
    const builder = makeBuilder(initialState);
    builder.addUpdate({
      timestamp: 1,
      iteration: 1,
      data: {
        id: [1, 2],
        component: {
          some_property: [3, 4]
        }
      }
    });
    const tapefile = builder.createTapefile();
    tapefile.moveTo(1);
    expect(tapefile.copyState()).toStrictEqual([3, 4, null]);
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
    tapeFile;
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
});
