export function entityGroupToCSV(entityGroup) {
    return new CSVBuilder(entityGroup).buildCSV();
}
export function objectToCSV(obj) {
    let rv = '';
    for (const [key, val] of Object.entries(obj)) {
        rv += `${key},${anyToString(val)}\n`;
    }
    return rv;
}
function anyToString(item) {
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
    constructor(entityGroup) {
        this.data = flatten(entityGroup);
        this.size = entityGroup.id.length;
    }
    buildCSV() {
        let rv = '';
        rv = this.writeHeader(rv);
        for (let i = 0; i < this.size; i++) {
            rv = this.writeRow(i, rv);
        }
        return rv;
    }
    writeHeader(output) {
        return output + this.rowToString(this.data.map(d => d[0]));
    }
    writeRow(idx, output) {
        return output + this.rowToString(this.getRow(idx));
    }
    getRow(idx) {
        return this.data.map(d => {
            return d[1][idx];
        });
    }
    rowToString(items) {
        return items.map(i => anyToString(i)).join(',') + '\n';
    }
}
function flatten(entityGroup, prefix = '') {
    const rv = [];
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
        }
        else {
            rv.push(...flatten(item, key + '/'));
        }
    }
    return rv;
}
