/**
 * A ColorRuleSet has rules on how to visualize certain combinations of
 * Entity/Property(ie. Attribute). Every rule can apply to an entity type,
 * attribute, data type (eg. BOOLEAN), or always. Rules must be applied in priority
 * (low value means high priority) until all fields are set. See also
 * `generateColorSettings`
 */
export interface ColorRuleSet {
  colors: Record<string, string>;
  rules: ColorRule[];
}

export interface ColorRule {
  priority: number;
  selector: ColorRuleSelector;
  settings: Partial<ColorMapColorSettings>;
}
export interface ColorRuleSelector {
  entity_group?: string;
  property?: string;
  data_type?: string;
  always?: boolean;
}

export interface ColorMapColorSettings {
  // when updating these keys, also update them in `generateColorSettings`
  baseColor: string;
  colors: [number, string | null][];
  specialColor: string | null;
  undefinedColor: string | null;
}

export type RGBAColor = [number, number, number, number?];
