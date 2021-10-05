import { RGBAColor } from './colors';
import { ByValueColorClause, FlowVisualizerType, LegendOptions, StaticColorClause } from './flowVisualizers';
export declare class ColorLegendItem {
    title: string;
    label?: string;
    visualizerType?: FlowVisualizerType;
    colorType: 'buckets' | 'gradient';
    colorLegends: [string, RGBAColor][];
    constructor({ title, label, visualizerType, colorType, colorLegends }: ColorLegendItem);
}
export declare class ColorByValueLegendItem extends ColorLegendItem {
    constructor(config: ColorLegendItem, byValue?: ByValueColorClause, legend?: LegendOptions);
}
export declare class ColorStaticLegendItem extends ColorLegendItem {
    constructor(config: ColorLegendItem, static_?: StaticColorClause, legend?: LegendOptions);
}
export declare type LegendItem = ColorByValueLegendItem | ColorStaticLegendItem;
