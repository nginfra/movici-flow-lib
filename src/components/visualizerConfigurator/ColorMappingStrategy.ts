import type { RGBAColor } from "@movici-flow-lib/types";
import { MappingStrategy } from "./ValueMappingHelper";
import type ColorPalette from "./colorPalettes";
import { MoviciColors, hexToColorTriple } from "@movici-flow-lib/visualizers/maps/colorMaps";

export default class ColorMappingStrategy extends MappingStrategy<RGBAColor> {
  palette: ColorPalette | null;
  constructor(palette?: ColorPalette | null) {
    super();
    this.palette = palette ?? null;
  }

  protected doRecalculateOutputs(outputs: RGBAColor[], nSteps: number): RGBAColor[] {
    if (this.palette) {
      return this.palette.getColorTriplesForSize(nSteps);
    }
    return super.doRecalculateOutputs(outputs, nSteps);
  }

  defaultStepCount(): number {
    return 4;
  }

  defaultOutput(): RGBAColor {
    return hexToColorTriple(MoviciColors.WHITE);
  }

  setColorPalette(palette: ColorPalette | null) {
    this.palette = palette;
  }
}
