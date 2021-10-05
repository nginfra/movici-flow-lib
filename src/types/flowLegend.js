export class ColorLegendItem {
    constructor({ title, label, visualizerType, colorType, colorLegends }) {
        this.title = title;
        this.label = label;
        this.visualizerType = visualizerType;
        this.colorType = colorType;
        this.colorLegends = colorLegends !== null && colorLegends !== void 0 ? colorLegends : [];
    }
}
export class ColorByValueLegendItem extends ColorLegendItem {
    constructor(config, byValue, legend) {
        super(config);
        if (byValue && (legend === null || legend === void 0 ? void 0 : legend.labels)) {
            this.colorLegends = legend.labels.map((label, idx) => {
                return [label, byValue.colors[idx][1]];
            });
        }
    }
}
export class ColorStaticLegendItem extends ColorLegendItem {
    constructor(config, static_, legend) {
        super(config);
        if (static_ && legend) {
            this.colorLegends = [[legend.title || 'Topology', static_.color]];
        }
    }
}
