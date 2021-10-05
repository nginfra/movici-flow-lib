export class VisualizerModule {
    constructor(params) {
        this.info = params.info;
    }
    setInfo(info) {
        this.info = info;
    }
}
export class TapefileAccessor {
    constructor(mapping, tapefile) {
        this.mapping = mapping;
        this.tapefile = tapefile;
    }
    setTapefile(tapefile) {
        this.tapefile = tapefile;
    }
    getValue(index) {
        if (this.tapefile) {
            return this.mapping.getValue(this.tapefile.data[index]);
        }
        throw new Error('No tapefile defined for accessor');
    }
}
