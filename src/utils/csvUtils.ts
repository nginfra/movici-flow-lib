import { ComponentData, EntityGroupData } from '@/flow/types';

export function entityGroupToCSV(entityGroup: EntityGroupData<unknown>): string {
  return new CSVBuilder(entityGroup).buildCSV();
}

export function objectToCSV(obj: Record<string, unknown>): string {
  let rv = '';
  for (const [key, val] of Object.entries(obj)) {
    rv += `${key},${anyToString(val)}\n`;
  }
  return rv;
}

function anyToString(item: unknown): string {
  if (item === null) {
    return 'null';
  }
  if (item instanceof Object) {
    return '"' + JSON.stringify(item) + '"';
  }
  if (typeof item === 'string') {
    return '"' + item + '"';
  }
  return String(item);
}
class CSVBuilder {
  data: [string, unknown[]][];
  size: number;

  constructor(entityGroup: EntityGroupData<unknown>) {
    this.data = flatten(entityGroup);
    this.size = entityGroup.id.length;
  }
  buildCSV(): string {
    let rv = '';
    rv = this.writeHeader(rv);
    for (let i = 0; i < this.size; i++) {
      rv = this.writeRow(i, rv);
    }
    return rv;
  }

  private writeHeader(output: string) {
    return output + this.rowToString(this.data.map(d => d[0]));
  }
  private writeRow(idx: number, output: string) {
    return output + this.rowToString(this.getRow(idx));
  }

  private getRow(idx: number): unknown[] {
    return this.data.map(d => {
      return d[1][idx];
    });
  }

  private rowToString(items: unknown[]): string {
    return items.map(i => anyToString(i)).join(',') + '\n';
  }
}

function flatten(
  entityGroup: EntityGroupData<unknown> | ComponentData<unknown>,
  prefix = ''
): [string, unknown[]][] {
  const rv: [string, unknown[]][] = [];

  if (Array.isArray(entityGroup['id'])) {
    rv.push(['id', entityGroup['id']]);
  }
  if (Array.isArray(entityGroup['reference'])) {
    rv.push(['reference', entityGroup['reference']]);
  }

  for (const [key, item] of Object.entries(entityGroup)) {
    if (key === 'id' || key == 'reference') {
      continue;
    }
    if (Array.isArray(item)) {
      rv.push([prefix + key, item]);
    } else {
      rv.push(...flatten(item, key + '/'));
    }
  }
  return rv;
}
