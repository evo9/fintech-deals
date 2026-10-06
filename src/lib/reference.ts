import type {
  AssetCategory,
  AssetStatus,
  AssetType,
  BusinessStatus,
  BuyerType,
  LicenseType,
  ModerationAction,
  Role,
  UserStatus,
} from "@prisma/client";

export type Country = {
  /** ISO 3166-1 alpha-2, also the key of the SVG flag in country-flag-icons */
  code: string;
  name: string;
  eu: boolean;
  /** Default regulator, pre-filled in the asset form and editable there */
  regulator: string;
};

export const COUNTRIES: readonly Country[] = [
  { code: "MT", name: "Malta", eu: true, regulator: "MFSA" },
  { code: "LT", name: "Lithuania", eu: true, regulator: "Bank of Lithuania" },
  { code: "PL", name: "Poland", eu: true, regulator: "KNF" },
  { code: "CY", name: "Cyprus", eu: true, regulator: "CySEC" },
  { code: "EE", name: "Estonia", eu: true, regulator: "Finantsinspektsioon" },
  { code: "CZ", name: "Czech Republic", eu: true, regulator: "Czech National Bank" },
  { code: "IE", name: "Ireland", eu: true, regulator: "Central Bank of Ireland" },
  { code: "GB", name: "United Kingdom", eu: false, regulator: "FCA" },
  { code: "GE", name: "Georgia", eu: false, regulator: "National Bank of Georgia" },
  { code: "CA", name: "Canada", eu: false, regulator: "FINTRAC" },
  { code: "AE", name: "United Arab Emirates", eu: false, regulator: "VARA" },
];

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): Country | undefined {
  return COUNTRY_BY_CODE.get(code);
}

/** Falls back to the code so an unknown value never renders as empty. */
export function countryName(code: string): string {
  return COUNTRY_BY_CODE.get(code)?.name ?? code;
}

export function defaultRegulator(code: string): string {
  return COUNTRY_BY_CODE.get(code)?.regulator ?? "";
}

// Labels for every enum. Record<Enum, string> makes a missing label a compile error.

export const ROLE_LABELS = {
  BUYER: "Buyer",
  SELLER: "Seller",
  MANAGER: "Manager",
} satisfies Record<Role, string>;

export const USER_STATUS_LABELS = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  REMOVED: "Removed",
} satisfies Record<UserStatus, string>;

export const ASSET_CATEGORY_LABELS = {
  BANK: "Bank",
  FINTECH: "Fintech",
  PAYMENT: "Payment",
  EMI: "EMI",
  CRYPTO: "Crypto",
} satisfies Record<AssetCategory, string>;

export const LICENSE_TYPE_LABELS = {
  BANKING: "Banking",
  EMI: "EMI",
  PI: "PI",
  SPI: "SPI",
  PSP: "PSP",
  CASP: "CASP",
  VASP: "VASP",
  MSB: "MSB",
} satisfies Record<LicenseType, string>;

export const ASSET_TYPE_LABELS = {
  ACTIVE_BUSINESS: "Active business",
  LICENSE_ONLY: "License only",
  SHELF_COMPANY: "Shelf company",
} satisfies Record<AssetType, string>;

export const BUSINESS_STATUS_LABELS = {
  ACTIVE: "Active",
  NEVER_OPERATED: "Never operated",
  DORMANT: "Dormant",
} satisfies Record<BusinessStatus, string>;

export const ASSET_STATUS_LABELS = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  REMOVED: "Removed",
} satisfies Record<AssetStatus, string>;

export const BUYER_TYPE_LABELS = {
  STRATEGIC: "Strategic",
  FINANCIAL_INVESTOR: "Financial investor",
  FAMILY_OFFICE: "Family office",
  INDIVIDUAL: "Individual",
} satisfies Record<BuyerType, string>;

// Past tense: used in the moderation log
export const MODERATION_ACTION_LABELS = {
  SUSPEND: "Suspended user",
  RESTORE: "Restored user",
  REMOVE: "Removed user",
  REMOVE_ASSET: "Removed asset",
  VALIDATE_ASSET: "Validated asset",
} satisfies Record<ModerationAction, string>;

/** `{ value, label }[]` for selects and filters, in declaration order. */
export function toOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
