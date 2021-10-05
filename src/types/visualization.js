export var VisualizationMode;
(function (VisualizationMode) {
    VisualizationMode["GEOMETRY"] = "geometry";
    VisualizationMode["SCENARIO"] = "scenario";
})(VisualizationMode || (VisualizationMode = {}));
export var LayerKind;
(function (LayerKind) {
    LayerKind["STATIC_COLOR"] = "static_color";
    LayerKind["HEAT_MAP"] = "heat_map";
    LayerKind["COLOR_MAP"] = "color_map";
    LayerKind["ACTIVE_ENTITY"] = "active_entity";
    LayerKind["UNKNOWN"] = "unknown";
})(LayerKind || (LayerKind = {}));
export class StaticColorLayerSettings {
    constructor(config) {
        this.kind = LayerKind.STATIC_COLOR;
        this.color = (config === null || config === void 0 ? void 0 : config.color) || [0, 0, 0];
    }
}
export class HeatmapLayerSettings {
    constructor() {
        this.kind = LayerKind.HEAT_MAP;
    }
}
export class ColorMapLayerSettings {
    constructor(config) {
        this.kind = LayerKind.COLOR_MAP;
        this.property = config === null || config === void 0 ? void 0 : config.property;
        this.colors = (config === null || config === void 0 ? void 0 : config.colors) || [];
        this.undefinedColor = (config === null || config === void 0 ? void 0 : config.undefinedColor) || [0, 0, 0];
        this.specialColor = (config === null || config === void 0 ? void 0 : config.specialColor) || [0, 0, 0];
        this.baseColorOverride = (config === null || config === void 0 ? void 0 : config.baseColorOverride) || null;
    }
}
export class ActiveEntityLayerSettings {
    constructor(config) {
        this.kind = LayerKind.ACTIVE_ENTITY;
        this.color = (config === null || config === void 0 ? void 0 : config.color) || [0, 0, 0];
        this.inverted = (config === null || config === void 0 ? void 0 : config.inverted) || false;
        this.property = config === null || config === void 0 ? void 0 : config.property;
        this.onHover = config === null || config === void 0 ? void 0 : config.onHover;
    }
}
export class UnknownLayerSettings {
    constructor() {
        this.kind = LayerKind.UNKNOWN;
    }
}
