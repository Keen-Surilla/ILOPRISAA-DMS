export type DocumentStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface AthleteDocument {
  id: string;
  name: string;
  type: "PSA" | "SCHOOL_ID" | "MEDICAL";
  status: DocumentStatus;
  updatedAt: string;
  url?: string;
}
