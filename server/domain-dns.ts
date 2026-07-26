export type DnsRecordSource = "lms" | "generated" | "unavailable";
export type DnsRecordType = "MX" | "TXT" | "A" | "CNAME" | "NS" | "SRV";

export type DnsRecord = {
  type: DnsRecordType;
  name: string;
  value: string;
  source: DnsRecordSource;
  explanation?: string;
  desc?: string;
  selector?: string;
  actionable?: boolean;
  unavailableReason?: string;
};

export type DnsVerificationResults = { mx: boolean; spf: boolean; dkim: boolean; dmarc: boolean; bimi: boolean };
export type DnsVerificationStatus = "verified" | "missing" | "mismatch" | "pending";
export type DnsRecordKind = keyof DnsVerificationResults;
export type DnsRecordDiagnostic = {
  kind: DnsRecordKind;
  type: DnsRecordType;
  name: string;
  expected: string;
  found: string[];
  status: DnsVerificationStatus;
  message: string;
};
export type StructuredDnsVerification = {
  records: DnsRecordDiagnostic[];
  allVerified: boolean;
  nextCheckRecommendedAt: string;
};
export type DkimDiagnostics = { selector: string; found: boolean; values: string[] }[];
export type DnsVerificationResult = {
  results: DnsVerificationResults;
  records: DnsRecordDiagnostic[];
  allVerified: boolean;
  nextCheckRecommendedAt: string;
  diagnostics: { dkimAlternateSelectors: DkimDiagnostics; records: DnsRecordDiagnostic[] };
};
