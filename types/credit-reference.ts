export type CreditReferenceStatus =
  | "PENDING"
  | "VERIFIED"
  | "DISPUTED"
  | "RESOLVED";

export type DebtStatus =
  | "ACTIVE"
  | "PAID"
  | "INACTIVE"
  | "PAYMENT_PLAN"
  | "DISPUTED";

export interface CreditReference {
  id: string;
  personId: string;
  personName: string;
  personRuc: string;
  creditorName: string;
  creditorId: string;
  debtAmount: number;
  debtCurrency: string;
  debtStatus: DebtStatus;
  reason: string;
  city: string;
  region: string;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
  status: CreditReferenceStatus;
}

export interface CreateCreditReferenceInput {
  personName: string;
  personRuc: string;
  creditorName: string;
  creditorId: string;
  debtAmount: number;
  debtCurrency: string;
  debtStatus: DebtStatus;
  reason: string;
  city: string;
  region: string;
}

export interface SearchResult {
  query: string;
  results: CreditReference[];
}
