export type FieldType = "text" | "choice" | "number" | "date";

export interface FormField<T> {
  name: string;
  boundVariable: keyof T;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
}

export interface TextField<T> extends FormField<T> {
  type: "text";
}

export interface NumberField<T> extends FormField<T> {
  type: "number";
}

export interface ChoiceField<T> extends FormField<T> {
  type: "choice";
  choices: string[];
}
export interface ShowDateField<T> extends FormField<T> {
  type: "date";
}

export type Field<T> = TextField<T> | ChoiceField<T> | NumberField<T> | ShowDateField<T>;
