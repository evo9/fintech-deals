// Demo data. Idempotent: wipes every table in FK order, then recreates everything.
// Run only on the developer's request: the database is shared with production.
import {
  AssetCategory,
  AssetType,
  BusinessStatus,
  BuyerType,
  LicenseType,
  Prisma,
  PrismaClient,
  type Asset,
  type AssetStatus,
  type User,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_ACCOUNT_EMAILS } from "../src/features/auth/demo";
import { defaultRegulator } from "../src/lib/reference";

const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY);

// ---------- users ----------

const SUSPENDED_SELLER_REASON = "Listing information could not be verified";
const REMOVED_SELLER_REASON = "Repeated violations of marketplace rules";
const SUSPENDED_BUYER_REASON = "Suspicious activity reported by a seller";

const sellers = [
  { email: "seller.malta@example.com", name: "Marco Vella", companyName: "Vella Corporate Services", country: "MT" },
  { email: "seller.baltic@example.com", name: "Jonas Petrauskas", companyName: "Baltic License Partners", country: "LT" },
  { email: "seller.georgia@example.com", name: "Nino Beridze", companyName: "Caucasus Fintech Holdings", country: "GE" },
  { email: "seller.cyprus@example.com", name: "Elena Christou", companyName: "Meridian Advisory", country: "CY", status: "SUSPENDED" as const, statusReason: SUSPENDED_SELLER_REASON, statusChangedAt: daysAgo(9) },
  { email: "seller.gulf@example.com", name: "Omar Haddad", companyName: "Gulf Digital Assets", country: "AE", status: "REMOVED" as const, statusReason: REMOVED_SELLER_REASON, statusChangedAt: daysAgo(21) },
];

type BuyerSeed = {
  email: string;
  name: string;
  companyName: string;
  country: string;
  status?: "SUSPENDED";
  statusReason?: string;
  statusChangedAt?: Date;
  profile: {
    buyerType?: BuyerType;
    headline?: string;
    about?: string;
    budgetMin?: number;
    budgetMax?: number;
    countries?: string[];
    licenseTypes?: LicenseType[];
    categories?: AssetCategory[];
    assetTypes?: AssetType[];
  };
};

const buyers: BuyerSeed[] = [
  {
    email: "lukas.weber@example.com", name: "Lukas Weber", companyName: "Weber Family Office", country: "IE",
    profile: { buyerType: "FAMILY_OFFICE", headline: "Family office seeking regulated payment businesses in the EU", about: "We hold regulated financial infrastructure for the long term and keep existing teams in place. Open to minority and majority stakes.", budgetMin: 2_000_000, budgetMax: 10_000_000, countries: ["MT", "LT", "IE"], licenseTypes: ["PI", "EMI"], categories: ["PAYMENT", "EMI"], assetTypes: ["ACTIVE_BUSINESS"] },
  },
  {
    email: "sofia.marino@example.com", name: "Sofia Marino", companyName: "Adriatic Payments Group", country: "CY",
    profile: { buyerType: "STRATEGIC", headline: "Strategic acquirer expanding card issuing in the EU", about: "Adriatic Payments operates in six markets and is adding an EU e-money licence to issue cards under our own brand.", budgetMin: 5_000_000, budgetMax: 15_000_000, countries: ["MT", "LT", "CY", "EE"], licenseTypes: ["EMI"], categories: ["EMI", "PAYMENT"], assetTypes: ["ACTIVE_BUSINESS"] },
  },
  {
    email: "daniel.brooks@example.com", name: "Daniel Brooks", companyName: "Brooks Digital Ventures", country: "GB",
    profile: { buyerType: "FINANCIAL_INVESTOR", headline: "Crypto-focused investor with a licence-first approach", about: "We back founders who need a ready licence to launch a regulated crypto product. We prefer entities without legacy liabilities.", budgetMin: 500_000, budgetMax: 3_000_000, countries: ["MT", "LT", "GE", "AE"], licenseTypes: ["VASP", "CASP"], categories: ["CRYPTO"], assetTypes: ["LICENSE_ONLY", "SHELF_COMPANY"] },
  },
  {
    email: "amira.khalil@example.com", name: "Amira Khalil", companyName: "Khalil Capital", country: "AE",
    profile: { buyerType: "FINANCIAL_INVESTOR", headline: "Looking for fintech and payment platforms in Georgia and Cyprus", about: "Khalil Capital invests in operating payment businesses with a proven transaction history.", budgetMin: 1_000_000, budgetMax: 5_000_000, countries: ["GE", "CY"], licenseTypes: ["PSP", "PI"], categories: ["FINTECH", "PAYMENT"], assetTypes: [] },
  },
  {
    email: "tomasz.nowak@example.com", name: "Tomasz Nowak", companyName: "Nowak Holdings", country: "PL",
    profile: { buyerType: "STRATEGIC", headline: "Polish group entering licensed payments", about: "We want to move our existing merchant network onto our own licence. A clean shell with an approved application is ideal.", budgetMax: 4_000_000, countries: ["PL", "CZ", "EE", "LT"], licenseTypes: ["PI", "SPI"], categories: ["PAYMENT"], assetTypes: ["LICENSE_ONLY", "SHELF_COMPANY"] },
  },
  {
    email: "helen.park@example.com", name: "Helen Park", companyName: "Park Wealth", country: "CA",
    profile: { buyerType: "INDIVIDUAL", headline: "Individual buyer interested in small licensed shells", budgetMin: 40_000, budgetMax: 500_000, countries: ["MT", "LT", "PL"], licenseTypes: [], categories: ["PAYMENT", "CRYPTO"], assetTypes: ["SHELF_COMPANY"] },
  },
  {
    email: "viktor.horak@example.com", name: "Viktor Horak", companyName: "Horak & Partners", country: "CZ",
    profile: { buyerType: "FAMILY_OFFICE", headline: "Long-term holder of regulated financial infrastructure", about: "Looking for a small credit institution with a stable deposit base. We do not plan to change management.", budgetMin: 8_000_000, countries: [], licenseTypes: ["BANKING"], categories: ["BANK"], assetTypes: ["ACTIVE_BUSINESS"] },
  },
  {
    email: "rachel.green@example.com", name: "Rachel Green", companyName: "Northgate Fintech", country: "GB",
    profile: { buyerType: "STRATEGIC", headline: "Fintech operator adding EU payment licences", about: "Northgate needs EU passporting after Brexit and is open to both operating businesses and dormant entities.", budgetMin: 1_000_000, budgetMax: 6_000_000, countries: ["IE", "CY", "MT"], licenseTypes: ["EMI", "PSP"], categories: ["FINTECH", "EMI"], assetTypes: [] },
  },
  {
    email: "mark.silva@example.com", name: "Mark Silva", companyName: "Silva Trading", country: "CY",
    status: "SUSPENDED", statusReason: SUSPENDED_BUYER_REASON, statusChangedAt: daysAgo(5),
    profile: { buyerType: "INDIVIDUAL", headline: "Private buyer looking for a Maltese VASP", budgetMin: 500_000, budgetMax: 1_500_000, countries: ["MT"], licenseTypes: ["VASP"], categories: ["CRYPTO"], assetTypes: [] },
  },
  {
    // empty profile: hidden from the buyers catalog, sees the "add your interests" hint
    email: "irina.kowal@example.com", name: "Irina Kowal", companyName: "Kowal Advisory", country: "EE",
    profile: {},
  },
];

// ---------- assets ----------

type Status = "P" | "D" | "A" | "R";
const STATUS: Record<Status, AssetStatus> = { P: "PUBLISHED", D: "DRAFT", A: "ARCHIVED", R: "REMOVED" };

type AssetSeed = {
  seller: number; // index in `sellers`
  status: Status;
  ago: number; // days since publication
  validated: boolean;
  category: AssetCategory;
  license: LicenseType;
  type: AssetType;
  business: BusinessStatus;
  country: string;
  price: number | null;
  year: number | null;
  employees: number | null;
  headline: string;
  description: string;
  removedReason?: string;
};

function a(
  seller: number, status: Status, ago: number, validated: boolean,
  category: AssetCategory, license: LicenseType, type: AssetType, business: BusinessStatus,
  country: string, price: number | null, year: number | null, employees: number | null,
  headline: string, description: string, removedReason?: string,
): AssetSeed {
  return { seller, status, ago, validated, category, license, type, business, country, price, year, employees, headline, description, removedReason };
}

const AB = "ACTIVE_BUSINESS", LO = "LICENSE_ONLY", SC = "SHELF_COMPANY";
const ACT = "ACTIVE", NEV = "NEVER_OPERATED", DOR = "DORMANT";

const assets: AssetSeed[] = [
  // seller 0 - Malta (12)
  a(0, "P", 5, true, "PAYMENT", "PI", AB, ACT, "MT", 3_800_000, 2016, 18, "Maltese payment institution with a merchant acquiring portfolio", "Fully licensed payment institution with an established merchant acquiring book across Southern Europe. Clean regulatory history and an in-country compliance team."),
  a(0, "P", 12, true, "EMI", "EMI", AB, ACT, "MT", 9_500_000, 2018, 32, "Malta EMI with prepaid card programme and BIN sponsorship", "Operating electronic money institution issuing prepaid cards to SMEs. Includes principal scheme membership and an in-house card processing stack."),
  a(0, "P", 21, false, "CRYPTO", "VASP", LO, NEV, "MT", 1_200_000, 2022, null, "MFSA-registered VASP licence, never operated", "VASP licence granted in 2022 to an entity that has not started operations. Board members and MLRO can be transferred on request."),
  a(0, "P", 33, true, "FINTECH", "PSP", AB, ACT, "IE", 2_400_000, 2019, 11, "Irish cross-border B2B payments platform", "Operating B2B payments platform with corridors into the UK and the EU. Fully documented onboarding and monitoring processes, audited accounts for the last three years."),
  a(0, "P", 47, false, "PAYMENT", "SPI", SC, NEV, "CZ", 650_000, 2023, null, "Czech shelf company with an approved small payment institution licence", "Newly licensed small payment institution without any customers or liabilities. A quick route to a Czech National Bank licence for a regional payments launch."),
  a(0, "P", 58, true, "EMI", "EMI", AB, DOR, "MT", 5_200_000, 2017, 6, "Dormant Malta EMI with existing safeguarding arrangements", "E-money licence in good standing, operations paused since 2023. Safeguarding account and scheme access are in place and can be reactivated within weeks."),
  a(0, "P", 74, true, "BANK", "BANKING", AB, ACT, "MT", 25_000_000, 2008, 140, "Maltese credit institution with a retail deposit base", "Established bank with a stable retail deposit portfolio and a conservative lending book. Experienced management, no pending enforcement actions."),
  a(0, "P", 90, false, "CRYPTO", "CASP", AB, ACT, "MT", null, 2021, 24, "Crypto exchange with a MiCA-ready Maltese entity", "Operating spot exchange with a growing retail base and an entity prepared for the MiCA transition. Price discussed with qualified buyers."),
  a(0, "P", 104, true, "PAYMENT", "PI", LO, NEV, "PL", 900_000, 2022, null, "Polish payment institution licence without operating history", "KNF-authorised payment institution that never launched. Documentation, policies and the IT security framework were approved at licensing."),
  a(0, "D", 0, false, "PAYMENT", "PSP", AB, ACT, "MT", 1_700_000, 2020, 9, "Merchant payment processor with ecommerce focus", "Payment service provider processing ecommerce volumes for around 300 merchants. Draft listing, details being finalised."),
  a(0, "A", 66, false, "EMI", "EMI", AB, ACT, "GB", 3_100_000, 2015, 14, "UK e-money institution serving expat communities", "Authorised EMI offering multi-currency accounts to individuals. Withdrawn from the market while the seller reviews offers."),
  a(0, "R", 40, false, "CRYPTO", "VASP", AB, ACT, "MT", 8_000_000, 2020, 19, "Crypto custody platform with institutional clients", "Custody and trading platform for institutional clients with a regulated Maltese entity.", "Asking price and licence details could not be confirmed with the regulator."),

  // seller 1 - Baltics (12)
  a(1, "P", 3, true, "PAYMENT", "PI", AB, ACT, "LT", 4_600_000, 2017, 21, "Lithuanian payment institution with SEPA and SWIFT access", "Direct SEPA participant with SWIFT connectivity and a diversified corporate client base. The compliance function is staffed and audited annually."),
  a(1, "P", 9, true, "EMI", "EMI", AB, ACT, "LT", 7_800_000, 2019, 27, "Vilnius EMI with a growing neobank customer base", "Licensed e-money institution with 40,000 retail accounts and a mobile app. Includes the app source code and the card issuing contract."),
  a(1, "P", 15, false, "FINTECH", "PSP", AB, ACT, "EE", 1_350_000, 2018, 8, "Estonian payment services provider for online marketplaces", "Compact PSP serving online marketplaces with split payments and escrow. Profitable for the last two years."),
  a(1, "P", 26, true, "CRYPTO", "VASP", AB, ACT, "LT", 2_900_000, 2020, 15, "Registered Lithuanian VASP with fiat on-ramp", "Operating virtual asset service provider with a banking partner for fiat on and off ramps. Full AML framework and a transaction monitoring system."),
  a(1, "P", 38, false, "PAYMENT", "SPI", LO, NEV, "LT", 420_000, 2023, null, "Small payment institution licence in Lithuania", "Freshly granted small payment institution licence with approved business plan. No customers, no employees, no debt."),
  a(1, "P", 52, true, "EMI", "EMI", LO, NEV, "LT", 2_100_000, 2022, null, "E-money licence granted in 2022, ready to launch", "Bank of Lithuania EMI licence with the capital already in place. Management team can stay for a transition period."),
  a(1, "P", 63, true, "BANK", "BANKING", AB, ACT, "LT", 14_500_000, 2012, 58, "Specialised bank focused on SME trade finance", "Licensed specialised bank with a trade finance portfolio and correspondent relationships in the Baltics. Capital ratios well above the regulatory minimum."),
  a(1, "P", 81, false, "PAYMENT", "PI", SC, NEV, "PL", 380_000, 2024, null, "Clean Polish shell prepared for a payment institution application", "Newly incorporated company with a drafted application package and an IT security concept. Reduces the time to a KNF filing by several months."),
  a(1, "P", 97, true, "EMI", "EMI", AB, DOR, "CZ", 3_300_000, 2016, 5, "Czech EMI with a lending product, currently dormant", "E-money institution with a built lending engine and a loan servicing platform. Operations were paused after a change of strategy."),
  a(1, "P", 110, false, "CRYPTO", "CASP", SC, NEV, "LT", null, 2024, null, "Lithuanian shell company structured for CASP authorisation", "Entity built for MiCA authorisation with local directors and office. Terms are agreed individually."),
  a(1, "D", 0, false, "EMI", "EMI", AB, ACT, "LT", 5_000_000, 2018, 16, "EMI with corporate accounts and card issuing", "Operating EMI for corporate clients, listing is being prepared and not yet public."),
  a(1, "A", 70, false, "PAYMENT", "PSP", AB, ACT, "LT", 1_900_000, 2016, 7, "Payment gateway for regional ecommerce", "Gateway connecting regional merchants to local banks and cards. Archived while the seller restructures the offer."),

  // seller 2 - Georgia (10)
  a(2, "P", 7, true, "PAYMENT", "PSP", AB, ACT, "GE", 2_750_000, 2019, 34, "Operating Georgian PSP and VASP platform with mobile wallet", "Operating Georgian PSP and VASP platform with a mobile wallet, proprietary QR and kiosk ecosystem. Over 200,000 registered users and own terminal network."),
  a(2, "P", 19, false, "CRYPTO", "VASP", AB, ACT, "GB", 1_600_000, 2021, 12, "Registered UK crypto asset firm with a trading app", "FCA-registered crypto asset business with a mobile trading app and a stable retail user base. Compliance officer and MLRO are part of the transfer."),
  a(2, "P", 30, true, "FINTECH", "PSP", AB, ACT, "GE", 880_000, 2020, 10, "Georgian fintech with a bill payment network", "Bill payment network connecting utilities and telecom providers to a kiosk and app channel. Steady monthly volumes and no external debt."),
  a(2, "P", 44, false, "PAYMENT", "PI", AB, ACT, "GB", 1_050_000, 2018, 9, "UK authorised payment institution for remittances", "Small payment institution focused on remittances to Eastern Europe and Central Asia. Agent network and bank accounts are included."),
  a(2, "P", 68, true, "BANK", "BANKING", AB, ACT, "GE", 12_000_000, 2010, 85, "Georgian commercial bank with a regional branch network", "Commercial bank with 12 branches, a retail and SME loan book and a core banking system upgraded in 2022. Audited by an international firm."),
  a(2, "P", 86, false, "CRYPTO", "CASP", LO, NEV, "GE", 95_000, 2024, null, "Entry-level crypto service licence in Georgia", "Newly obtained crypto service licence suited to a small exchange or custody launch. Local registered office included."),
  a(2, "P", 101, true, "EMI", "EMI", AB, ACT, "GE", 3_900_000, 2017, 22, "Georgian e-money issuer with agent network", "E-money issuer with prepaid products and a network of 150 cash-in agents. Own processing platform and a card scheme partnership."),
  a(2, "P", 115, false, "PAYMENT", "PSP", SC, NEV, "GE", 40_000, 2024, null, "Georgian shell company for a payment aggregator licence", "Registered company with a prepared payment aggregator application. Suitable for a very small launch."),
  a(2, "D", 0, false, "FINTECH", "PSP", AB, ACT, "GE", 1_200_000, 2019, 8, "Open banking aggregator for the Caucasus region", "Aggregation platform connecting bank APIs to fintech apps. Draft, awaiting financials."),
  a(2, "P", 14, false, "EMI", "EMI", AB, ACT, "GE", 2_300_000, 2021, 17, "Georgian e-money wallet with cash-in desks", "E-money wallet with a network of cash-in desks and a corporate client list. Operates under a Georgian e-money issuer licence."),

  // seller 3 - Cyprus, suspended (6)
  a(3, "P", 11, true, "PAYMENT", "PI", AB, ACT, "CY", 6_200_000, 2016, 26, "Cypriot payment institution with acquiring licences", "CySEC-adjacent payment institution with acquiring licences from two schemes and a portfolio of high-risk merchants. Includes the risk engine."),
  a(3, "P", 28, false, "EMI", "EMI", AB, ACT, "CY", 11_000_000, 2015, 41, "Cyprus EMI with a corporate multi-currency offer", "Established EMI with a corporate client base and a multi-currency account product. Two banking partners in the EU."),
  a(3, "P", 55, false, "CRYPTO", "CASP", LO, NEV, "CY", 1_450_000, 2023, null, "CySEC CASP authorisation, no operating history", "Crypto asset service authorisation held by a newly formed company. Documentation is audit-ready."),
  a(3, "P", 72, false, "FINTECH", "PSP", AB, ACT, "IE", 2_050_000, 2019, 13, "Irish payment services provider for travel businesses", "Payment provider serving travel agencies and booking platforms in the EU. Gross volumes grew year on year for three years."),
  a(3, "P", 88, false, "PAYMENT", "SPI", LO, NEV, "CY", 560_000, 2023, null, "Small payment institution licence in Cyprus", "A small payment institution licence without any operations. Suitable for a domestic launch."),
  a(3, "P", 99, false, "EMI", "EMI", SC, NEV, "CY", null, 2024, null, "Cypriot shell company prepared for an EMI application", "Entity with directors, office and a drafted EMI application. Price on request."),

  // seller 4 - UAE, removed (5)
  a(4, "P", 17, false, "CRYPTO", "VASP", AB, ACT, "AE", 18_000_000, 2020, 63, "Dubai VASP exchange with institutional liquidity", "VARA-licensed exchange with institutional liquidity providers and a custody arm. Large user base across the GCC."),
  a(4, "P", 36, false, "CRYPTO", "VASP", LO, NEV, "AE", 4_300_000, 2023, null, "VARA licence for advisory and broker-dealer services", "Newly granted licence with an approved operating model and a local office."),
  a(4, "P", 60, false, "PAYMENT", "PSP", AB, ACT, "AE", 2_650_000, 2018, 20, "Gulf payment service provider for SME merchants", "Merchant acquiring and payment links for SMEs in the UAE and Saudi Arabia. Settlement is done through two local banks."),
  a(4, "P", 83, false, "FINTECH", "MSB", AB, ACT, "CA", 1_100_000, 2019, 7, "Canadian money services business with FINTRAC registration", "FINTRAC-registered MSB focused on cross-border transfers for the diaspora. Agreements with two Canadian banks are in place."),
  a(4, "P", 108, false, "PAYMENT", "PSP", SC, NEV, "AE", null, 2024, null, "UAE shell company structured for a payment licence", "Free zone company prepared for a payment services application. Terms on request."),
];

const INCLUDED_POOL: Record<AssetType, string[]> = {
  ACTIVE_BUSINESS: ["Operating licence", "Customer base", "Core platform and source code", "Compliance and risk team", "Banking relationships", "Audited financial statements"],
  LICENSE_ONLY: ["Licence and approval documents", "Corporate entity with clean history", "Policies and procedures", "Registered office", "Transition support from management"],
  SHELF_COMPANY: ["Corporate entity with clean history", "Drafted application package", "Policies and procedures", "Local director arrangement", "Registered office"],
};

function includedFor(asset: AssetSeed, index: number): string[] {
  const pool = INCLUDED_POOL[asset.type];
  const count = Math.min(pool.length, 2 + (index % 5));
  return Array.from({ length: count }, (_, i) => pool[(index + i) % pool.length]);
}

// ---------- conversations ----------

type Msg = ["b" | "s", string];
type ConvSeed = {
  buyer: number; // index in `buyers`
  seller: number; // index in `sellers`
  asset?: string; // part of the asset headline; omitted = general conversation
  startedDaysAgo: number;
  unreadForBuyer?: boolean;
  messages: Msg[];
};

const conversations: ConvSeed[] = [
  { buyer: 0, seller: 0, asset: "Maltese payment institution", startedDaysAgo: 8, messages: [
    ["b", "Hello Marco, we are interested in the Maltese payment institution. Could you share the last two years of audited accounts?"],
    ["s", "Hello Lukas, thanks for reaching out. I can share them under an NDA. Shall I send the template?"],
    ["b", "Yes please, we will sign it this week."],
    ["s", "Sent to your email. After that I can arrange a call with the CEO."],
  ] },
  { buyer: 1, seller: 0, asset: "Malta EMI with prepaid card", startedDaysAgo: 6, messages: [
    ["b", "Is the BIN sponsorship transferable with the licence?"],
    ["s", "It needs consent from the sponsor, which we expect to get. They have already confirmed in principle."],
    ["b", "Good. What is the notice period for the key staff?"],
  ] },
  { buyer: 2, seller: 1, asset: "Registered Lithuanian VASP", startedDaysAgo: 14, messages: [
    ["b", "Hi Jonas, is the VASP registration held by the company being sold?"],
    ["s", "Yes, the registration is held by the company and no holding structure sits in between."],
    ["b", "Does the bank partner for fiat on-ramp stay after the change of control?"],
    ["s", "The partner requires a re-approval, usually four to six weeks. I can introduce you to their compliance team."],
    ["b", "That works. Please send the partner agreement summary."],
    ["s", "Will do by tomorrow."],
  ] },
  // general conversation, the last message is from the seller and unread by the buyer
  { buyer: 0, seller: 1, startedDaysAgo: 4, unreadForBuyer: true, messages: [
    ["b", "Jonas, we are looking for an EMI in the Baltics at around 5-8 million. Do you have anything that is not yet listed?"],
    ["s", "I may have one in the pipeline. I will come back to you once the seller agrees to show it."],
  ] },
  { buyer: 3, seller: 2, asset: "Operating Georgian PSP", startedDaysAgo: 10, messages: [
    ["b", "Hello Nino, we like the platform. How many of the 200,000 registered users were active in the last 90 days?"],
    ["s", "Around 38,000 monthly active users. I can send the cohort report."],
    ["b", "Please do, and the terminal network ownership structure."],
    ["s", "Both are in the data room, I will grant you access today."],
    ["b", "Received, thank you. We will come back with an offer next week."],
  ] },
  { buyer: 4, seller: 1, asset: "Small payment institution licence in Lithuania", startedDaysAgo: 3, messages: [
    ["b", "Is the licence limited to domestic payments, or can it be extended to the EU?"],
    ["s", "Small institutions cannot passport. An upgrade to a full licence is possible, I can outline the steps."],
  ] },
  // seller is suspended: history is visible, the input is disabled
  { buyer: 7, seller: 3, asset: "Cypriot payment institution", startedDaysAgo: 12, messages: [
    ["b", "Hello Elena, could you confirm the number of acquiring merchants?"],
    ["s", "We have 312 active merchants, the list is available after the NDA."],
    ["b", "Thank you, we will review it internally."],
  ] },
  // buyer is suspended: the seller sees a paused conversation
  { buyer: 8, seller: 0, asset: "MFSA-registered VASP licence", startedDaysAgo: 7, messages: [
    ["b", "I would like to buy this licence quickly. What is the lowest price?"],
    ["s", "The price is stated in the listing, but I am open to discussing terms once we have your proof of funds."],
  ] },
];

// ---------- seed ----------

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // wipe in FK order
  await db.moderationLog.deleteMany();
  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.asset.deleteMany();
  await db.buyerProfile.deleteMany();
  await db.user.deleteMany();
  // asset ids start at 700 on every run (deleteMany does not rewind the sequence)
  await db.$executeRawUnsafe(`ALTER SEQUENCE "Asset_id_seq" RESTART WITH 700`);

  const manager = await db.user.create({
    data: { email: "anna@example.com", name: "Anna Kovalenko", companyName: "FintechDeeals", country: "MT", role: "MANAGER", passwordHash },
  });

  const sellerRows: User[] = [];
  for (const s of sellers) {
    sellerRows.push(await db.user.create({ data: { ...s, role: "SELLER", passwordHash } }));
  }

  const buyerRows: User[] = [];
  for (const { profile, ...b } of buyers) {
    buyerRows.push(
      await db.user.create({
        data: {
          ...b,
          role: "BUYER",
          passwordHash,
          buyerProfile: { create: profile },
        },
      }),
    );
  }

  // assets
  const assetRows: Asset[] = [];
  for (const [i, s] of assets.entries()) {
    const published = s.status !== "D";
    const publishedAt = published ? daysAgo(s.ago) : null;
    assetRows.push(
      await db.asset.create({
        data: {
          sellerId: sellerRows[s.seller].id,
          headline: s.headline,
          category: s.category,
          licenseType: s.license,
          assetType: s.type,
          businessStatus: s.business,
          country: s.country,
          regulator: defaultRegulator(s.country),
          yearOfIssue: s.year,
          employees: s.employees,
          askingPrice: s.price,
          included: includedFor(s, i),
          description: s.description,
          status: STATUS[s.status],
          publishedAt,
          validatedAt: s.validated && publishedAt ? new Date(publishedAt.getTime() + 2 * DAY) : null,
          removedReason: s.removedReason ?? null,
          createdAt: publishedAt ? new Date(publishedAt.getTime() - 3 * DAY) : daysAgo(2),
        },
      }),
    );
  }

  // assets are looked up by headline so reordering the list cannot break the links
  const assetByHeadline = (part: string) => {
    const i = assets.findIndex((x) => x.headline.includes(part));
    if (i < 0) throw new Error(`Seed asset not found: ${part}`);
    return { row: assetRows[i], seed: assets[i] };
  };

  for (const c of conversations) {
    const asset = c.asset ? assetByHeadline(c.asset) : null;
    const start = daysAgo(c.startedDaysAgo).getTime();
    const times = c.messages.map((_, i) => new Date(start + i * 3 * HOUR));
    const last = times[times.length - 1];
    const conversation = await db.conversation.create({
      data: {
        buyerId: buyerRows[c.buyer].id,
        sellerId: sellerRows[c.seller].id,
        assetId: asset?.row.id ?? null,
        createdAt: new Date(start),
        lastMessageAt: last,
        buyerLastReadAt: c.unreadForBuyer ? times[0] : last,
        sellerLastReadAt: last,
      },
    });
    for (const [i, [who, body]] of c.messages.entries()) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: who === "b" ? buyerRows[c.buyer].id : sellerRows[c.seller].id,
          body,
          createdAt: times[i],
        },
      });
    }
  }

  // moderation log: one entry per suspension/removal above, plus a few validations
  const removedAsset = assetByHeadline("Crypto custody platform");
  const log: Prisma.ModerationLogUncheckedCreateInput[] = [
    { managerId: manager.id, action: "SUSPEND", targetUserId: sellerRows[3].id, reason: SUSPENDED_SELLER_REASON, createdAt: daysAgo(9) },
    { managerId: manager.id, action: "REMOVE", targetUserId: sellerRows[4].id, reason: REMOVED_SELLER_REASON, createdAt: daysAgo(21) },
    { managerId: manager.id, action: "SUSPEND", targetUserId: buyerRows[8].id, reason: SUSPENDED_BUYER_REASON, createdAt: daysAgo(5) },
    { managerId: manager.id, action: "REMOVE_ASSET", targetAssetId: removedAsset.row.id, reason: removedAsset.seed.removedReason, createdAt: daysAgo(30) },
  ];
  assets.forEach((s, i) => {
    const validatedAt = assetRows[i].validatedAt;
    if (s.validated && s.status === "P" && validatedAt && log.length < 8) {
      log.push({ managerId: manager.id, action: "VALIDATE_ASSET", targetAssetId: assetRows[i].id, createdAt: validatedAt });
    }
  });
  for (const entry of log) await db.moderationLog.create({ data: entry });

  // the login page lists accounts from DEMO_ACCOUNT_EMAILS: fail loudly if the two drift apart
  const seeded = (await db.user.findMany({ select: { email: true } })).map((u) => u.email).sort();
  const listed = [...DEMO_ACCOUNT_EMAILS].sort();
  if (seeded.join() !== listed.join()) {
    throw new Error("Seeded emails differ from DEMO_ACCOUNT_EMAILS in src/features/auth/demo.ts");
  }

  const counts = {
    users: await db.user.count(),
    buyerProfiles: await db.buyerProfile.count(),
    assets: await db.asset.count(),
    conversations: await db.conversation.count(),
    messages: await db.message.count(),
    moderationLog: await db.moderationLog.count(),
  };
  console.log("Seed done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
