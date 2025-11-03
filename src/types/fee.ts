export interface Fee {
  id: string;
  name: string;
  description: string;
  optional: boolean;
  frequency: 'yearly' | 'once' | 'semester';
}
export type FeeFormData = Omit<Fee, 'id'>;