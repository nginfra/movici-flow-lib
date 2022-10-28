export type FieldType = 'text' | 'choice';

export interface FormField<T> {
  name: string;
  boundVariable: keyof T;
  type: FieldType;
  required: boolean;
}

export interface TextField<T> extends FormField<T> {
  type: 'text';
}

export interface ChoiceField<T> extends FormField<T> {
  type: 'choice';
  choices: string[];
}

export type Field<T> = TextField<T> | ChoiceField<T>;
