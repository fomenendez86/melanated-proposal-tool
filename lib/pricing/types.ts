export type PricingUnit = "flat" | "per_person" | "per_night" | "per_vehicle";
export type PricingDiscountType = "none" | "amount" | "percent";

export interface PricingCalculationInput {
  key: string;
  description: string;
  quantityMilli: number;
  unitPriceMinor: number;
  unit: PricingUnit;
  taxRateBps: number;
  discountType: PricingDiscountType;
  discountValue: number;
  optional: boolean;
  selected: boolean;
  quantityEditable: boolean;
}

export interface ProposalPricingEditorItem extends Omit<PricingCalculationInput, "selected"> {
  id: number;
  selectedByDefault: boolean;
  currency: string;
  sortOrder: number;
}

export interface ProposalPricingSelection {
  key: string;
  selected: boolean;
  quantityMilli: number;
}
