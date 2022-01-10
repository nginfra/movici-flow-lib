import { entityGroupToCSV } from '@movici-flow-common/utils/csvUtils';

describe('convertToCSV', () => {
  it('converts entity data to csv', () => {
    expect(
      entityGroupToCSV({
        id: [1, 2],
        bla: [3, 4]
      })
    ).toEqual('"id","bla"\n1,3\n2,4\n');
  });
  it('converts arrays to json', () => {
    expect(
      entityGroupToCSV({
        id: [1, 2],
        bla: [[], [4]]
      })
    ).toEqual('"id","bla"\n1,"[]"\n2,"[4]"\n');
  });
  it('converts null', () => {
    expect(
      entityGroupToCSV({
        id: [1],
        bla: [null]
      })
    ).toEqual('"id","bla"\n1,null\n');
  });
  it('converts booleans', () => {
    expect(
      entityGroupToCSV({
        id: [1, 2],
        bla: [true, false]
      })
    ).toEqual('"id","bla"\n1,true\n2,false\n');
  });
  it('converts data with components', () => {
    expect(
      entityGroupToCSV({
        id: [1, 2],
        component: {
          bla: [3, 4]
        }
      })
    ).toEqual('"id","component/bla"\n1,3\n2,4\n');
  });
});
