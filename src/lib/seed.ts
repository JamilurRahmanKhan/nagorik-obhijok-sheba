import type {
  Attachment,
  Complaint,
  DbState,
  HistoryEntry,
  Officer,
  Priority,
  Settings,
  Status,
} from "./types";

export const DB_VERSION = 1;

export const ADMIN_NAME = "মাহমুদা হক";

export const DEFAULT_CATEGORIES = [
  "রাস্তা ও অবকাঠামো",
  "পানি সরবরাহ",
  "বিদ্যুৎ",
  "গ্যাস সংযোগ",
  "বর্জ্য ব্যবস্থাপনা",
  "ড্রেনেজ",
  "লাইসেন্স",
  "নিবন্ধন",
  "দুর্নীতি",
  "অন্যান্য",
];

export const DEFAULT_DEPARTMENTS = [
  "সিটি কর্পোরেশন",
  "ওয়াসা (পানি সরবরাহ)",
  "পল্লী বিদ্যুৎ সমিতি",
  "তিতাস গ্যাস",
  "সড়ক ও জনপথ অধিদপ্তর",
];

export const DEFAULT_SETTINGS: Settings = {
  orgName: "নাগরিক অভিযোগ সেল",
  orgSub: "স্থানীয় সরকার বিভাগ",
  slaDays: { high: 3, medium: 7, low: 15 },
  categories: DEFAULT_CATEGORIES,
  departments: DEFAULT_DEPARTMENTS,
  smsOnSubmit: true,
  smsOnStatusChange: true,
  smsTemplates: {
    received:
      "আপনার অভিযোগ গৃহীত হয়েছে। ট্র্যাকিং আইডি: {id}। অগ্রগতি জানতে আমাদের ওয়েবসাইটে আইডি ও মোবাইল নম্বর দিয়ে খুঁজুন।",
    assigned:
      "আপনার অভিযোগ ({id}) সমাধানের জন্য {officer}-কে দায়িত্ব দেওয়া হয়েছে। বিস্তারিত ট্র্যাকিং পেজে দেখুন।",
    resolved:
      "আপনার অভিযোগ ({id}) সমাধান করা হয়েছে। সেবার মান সম্পর্কে মতামত জানাতে আমাদের সাথে যোগাযোগ করুন।",
  },
};

const D = DEFAULT_DEPARTMENTS;
const CITY = D[0];
const WASA = D[1];
const PBS = D[2];
const TITAS = D[3];
const RHD = D[4];

export const CATEGORY_DEPARTMENT: Record<string, string> = {
  "রাস্তা ও অবকাঠামো": RHD,
  "পানি সরবরাহ": WASA,
  "বিদ্যুৎ": PBS,
  "গ্যাস সংযোগ": TITAS,
  "বর্জ্য ব্যবস্থাপনা": CITY,
  "ড্রেনেজ": WASA,
  "লাইসেন্স": CITY,
  "নিবন্ধন": CITY,
  "দুর্নীতি": CITY,
  "অন্যান্য": CITY,
};

export const SEED_OFFICERS: Officer[] = [
  { id: "off-1", name: "রাশেদুল ইসলাম", designation: "প্রকৌশলী", department: RHD, phone: "01711204518", email: "rashedul@example.com", active: true },
  { id: "off-2", name: "নাজিয়া সুলতানা", designation: "সহকারী প্রকৌশলী", department: RHD, phone: "01819332076", email: "nazia@example.com", active: true },
  { id: "off-3", name: "কামাল হোসেন", designation: "ইন্সপেক্টর", department: CITY, phone: "01911458820", email: "kamal@example.com", active: true },
  { id: "off-4", name: "তাহমিনা আক্তার", designation: "উপ-সহকারী প্রকৌশলী", department: WASA, phone: "01615770934", email: "tahmina@example.com", active: true },
  { id: "off-5", name: "মাহফুজুর রহমান", designation: "নির্বাহী প্রকৌশলী", department: PBS, phone: "01712985604", email: "mahfuz@example.com", active: true },
  { id: "off-6", name: "সাবিনা ইয়াসমিন", designation: "সহকারী পরিচালক", department: TITAS, phone: "01517663291", email: "sabina@example.com", active: true },
  { id: "off-7", name: "আনোয়ার হোসেন", designation: "পরিদর্শক", department: CITY, phone: "01816220157", email: "anwar@example.com", active: true },
  { id: "off-8", name: "ফাহমিদা রহমান", designation: "সমন্বয়কারী", department: CITY, phone: "01913804465", email: "fahmida@example.com", active: false },
];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** ISO in Asia/Dhaka (+06:00). */
function at(y: number, m: number, d: number, h = 10, min = 0): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return new Date(`${y}-${p(m)}-${p(d)}T${p(h)}:${p(min)}:00+06:00`).toISOString();
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

const FLOW: Status[] = ["new", "reviewing", "assigned", "in_progress", "resolved"];

/**
 * Builds a history trail up to `status`.
 * `gapsHours[i]` = hours between step i and step i+1.
 */
function buildHistory(
  createdAt: string,
  status: Status,
  gapsHours: number[],
  notes: Partial<Record<Status, string>> = {},
): HistoryEntry[] {
  const path: Status[] =
    status === "rejected" ? ["new", "reviewing", "rejected"] : FLOW.slice(0, FLOW.indexOf(status) + 1);
  const out: HistoryEntry[] = [];
  let t = createdAt;
  path.forEach((s, i) => {
    if (i > 0) t = addHours(t, gapsHours[i - 1] ?? 24);
    out.push({
      status: s,
      at: t,
      by: s === "new" ? "নাগরিক" : ADMIN_NAME,
      note: notes[s],
    });
  });
  return out;
}

function photos(n: number): Attachment[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `সংযুক্ত ছবি ${i + 1}`,
    type: "image/jpeg",
    size: 0,
  }));
}

interface Hand {
  id: string;
  subject: string;
  category: string;
  department?: string;
  description: string;
  priority: Priority;
  status: Status;
  name: string;
  phone: string;
  email?: string;
  address: string;
  created: string;
  officerId?: string;
  gaps: number[];
  notes?: Partial<Record<Status, string>>;
  photos?: number;
}

function fromHand(h: Hand): Complaint {
  const history = buildHistory(h.created, h.status, h.gaps, h.notes);
  return {
    id: h.id,
    subject: h.subject,
    category: h.category,
    department: h.department ?? CATEGORY_DEPARTMENT[h.category] ?? CITY,
    description: h.description,
    priority: h.priority,
    status: h.status,
    citizen: { name: h.name, phone: h.phone, email: h.email, address: h.address },
    attachments: photos(h.photos ?? 0),
    officerId: h.officerId,
    createdAt: h.created,
    updatedAt: history[history.length - 1].at,
    history,
    notes: [],
    source: "online",
  };
}

/* ------------------------------------------------------------------ */
/* hand-written recent complaints (0114–0128)                          */
/* ------------------------------------------------------------------ */

const HAND: Hand[] = [
  {
    id: "BD-2026-0114",
    subject: "রাস্তার বাতি নষ্ট - ধানমন্ডি ২৭",
    category: "রাস্তা ও অবকাঠামো",
    department: CITY,
    description:
      "ধানমন্ডি ২৭ নম্বর সড়কের প্রায় সবক'টি স্ট্রিট লাইট দুই সপ্তাহ ধরে বন্ধ। সন্ধ্যার পর রাস্তা পুরো অন্ধকার থাকে, পথচারী ও নারীদের চলাচলে নিরাপত্তা ঝুঁকি তৈরি হয়েছে।",
    priority: "medium",
    status: "in_progress",
    name: "মো. রফিকুল ইসলাম",
    phone: "01716230884",
    email: "rafiq.islam@example.com",
    address: "বাসা ৪৫, রোড ২৭, ধানমন্ডি, ঢাকা",
    created: at(2026, 9, 22, 9, 40),
    officerId: "off-3",
    gaps: [3, 20, 30],
    photos: 1,
  },
  {
    id: "BD-2026-0115",
    subject: "পানি সরবরাহে দীর্ঘ বিলম্ব",
    category: "পানি সরবরাহ",
    department: WASA,
    description:
      "গত চার দিন ধরে সকালের নির্ধারিত সময়ে লাইনে পানি আসছে না। রাতের দিকে অল্প সময়ের জন্য এলেও চাপ খুব কম। বাসায় শিশু ও বয়স্ক সদস্য থাকায় সমস্যা প্রকট।",
    priority: "high",
    status: "new",
    name: "সুমাইয়া আক্তার",
    phone: "01811947602",
    address: "ফ্ল্যাট ৩বি, ৭২ পশ্চিম আগারগাঁও, ঢাকা",
    created: at(2026, 9, 21, 14, 15),
    gaps: [],
  },
  {
    id: "BD-2026-0116",
    subject: "নির্ধারিত দিনে ময়লা অপসারণ হয়নি",
    category: "বর্জ্য ব্যবস্থাপনা",
    department: CITY,
    description:
      "আমাদের ওয়ার্ডে শনি ও মঙ্গলবার ময়লা সংগ্রহের কথা থাকলেও গত দুই সপ্তাহে গাড়ি আসেনি। বাসার সামনের ভ্যাটে ময়লা জমে দুর্গন্ধ ছড়াচ্ছে।",
    priority: "medium",
    status: "resolved",
    name: "আব্দুল করিম",
    phone: "01914358870",
    address: "১৮/এ, কাজীপাড়া, মিরপুর, ঢাকা",
    created: at(2026, 9, 20, 11, 5),
    officerId: "off-7",
    gaps: [2, 6, 10, 26],
    notes: { resolved: "ময়লা অপসারণ সম্পন্ন; সংগ্রহের সময়সূচি পুনর্নির্ধারণ করা হয়েছে।" },
  },
  {
    id: "BD-2026-0117",
    subject: "সড়কে বড় গর্ত, দুর্ঘটনার আশঙ্কা — ধানমন্ডি ২৭ নম্বর সড়ক",
    category: "রাস্তা ও অবকাঠামো",
    department: RHD,
    description:
      "ধানমন্ডি ২৭ নম্বর সড়কের মাঝামাঝি অংশে প্রায় তিন ফুট চওড়া একটি গর্ত তৈরি হয়েছে, যা গত এক সপ্তাহ ধরে মেরামত করা হয়নি। রাতের বেলা দৃশ্যমানতা কম থাকায় একাধিকবার মোটরসাইকেল দুর্ঘটনার ঝুঁকি তৈরি হয়েছে। এলাকাবাসীর পক্ষ থেকে দ্রুত মেরামতের অনুরোধ জানানো হয়েছে।",
    priority: "high",
    status: "in_progress",
    name: "নাজমুল হক",
    phone: "01712345678",
    email: "nazmul.h@example.com",
    address: "বাসা ১২, রোড ২৭, ধানমন্ডি, ঢাকা",
    created: at(2026, 9, 19, 10, 30),
    officerId: "off-1",
    gaps: [4, 24, 48],
    photos: 2,
  },
  {
    id: "BD-2026-0118",
    subject: "ড্রেনেজ ব্লক, জলাবদ্ধতা সৃষ্টি",
    category: "ড্রেনেজ",
    department: WASA,
    description:
      "সামান্য বৃষ্টিতেই আমাদের গলির ড্রেন উপচে রাস্তায় পানি জমছে। ড্রেনে প্লাস্টিক ও নির্মাণ বর্জ্য আটকে আছে, দ্রুত পরিষ্কার প্রয়োজন।",
    priority: "high",
    status: "new",
    name: "ফারজানা ইয়াসমিন",
    phone: "01517209946",
    address: "৫/২, বাড্ডা লিংক রোড, ঢাকা",
    created: at(2026, 9, 18, 16, 50),
    gaps: [],
    photos: 1,
  },
  {
    id: "BD-2026-0119",
    subject: "বিদ্যুৎ সংযোগ বারবার বিচ্ছিন্ন",
    category: "বিদ্যুৎ",
    department: PBS,
    description:
      "গত এক মাসে প্রায় প্রতিদিন কয়েক দফা বিদ্যুৎ চলে যাচ্ছে। এলাকার আরও কয়েকজন একই সমস্যায় ভুগছেন।",
    priority: "medium",
    status: "rejected",
    name: "তানভীর আহমেদ",
    phone: "01611873305",
    address: "উত্তর বাড্ডা, ঢাকা",
    created: at(2026, 9, 17, 12, 20),
    gaps: [5, 28],
    notes: { rejected: "অভিযোগটি ইতোমধ্যে দায়েরকৃত BD-2026-0102-এর সাথে অভিন্ন; একই নম্বরে অগ্রগতি জানানো হবে।" },
  },
  {
    id: "BD-2026-0120",
    subject: "ট্রেড লাইসেন্স নবায়নে বিলম্ব",
    category: "লাইসেন্স",
    department: CITY,
    description:
      "সব কাগজপত্র জমা দেওয়ার পরও তিন সপ্তাহ পার হয়ে গেছে, ট্রেড লাইসেন্স নবায়ন হয়নি। বারবার অফিসে গিয়েও নির্দিষ্ট উত্তর পাচ্ছি না।",
    priority: "low",
    status: "resolved",
    name: "রোকসানা বেগম",
    phone: "01718552209",
    address: "দোকান ১০, নিউ মার্কেট, ঢাকা",
    created: at(2026, 9, 16, 10, 0),
    officerId: "off-3",
    gaps: [6, 20, 40, 52],
    notes: { resolved: "লাইসেন্স নবায়ন সম্পন্ন হয়েছে এবং কপি সংগ্রহের জন্য জানানো হয়েছে।" },
  },
  {
    id: "BD-2026-0121",
    subject: "জন্ম নিবন্ধনে তথ্য সংশোধন",
    category: "নিবন্ধন",
    department: CITY,
    description:
      "আমার সন্তানের জন্ম নিবন্ধন সনদে মায়ের নামের বানান ভুল ছাপা হয়েছে। সংশোধনের আবেদন করেছি, কিন্তু দুই মাসেও অগ্রগতি নেই।",
    priority: "low",
    status: "in_progress",
    name: "শাহীন মিয়া",
    phone: "01915630127",
    address: "গ্রাম: রামপুর, ডাকঘর: টঙ্গী, গাজীপুর",
    created: at(2026, 9, 15, 15, 10),
    officerId: "off-7",
    gaps: [8, 22, 52],
  },
  {
    id: "BD-2026-0122",
    subject: "গ্যাসের চাপ খুবই কম, রান্না করা যাচ্ছে না",
    category: "গ্যাস সংযোগ",
    department: TITAS,
    description:
      "সকাল ও সন্ধ্যার রান্নার সময় চুলায় প্রায় গ্যাসই থাকে না। গত দশ দিন ধরে একই অবস্থা, পুরো ভবনের ১২টি পরিবার ভুগছে।",
    priority: "medium",
    status: "resolved",
    name: "মোছা. নাসরিন সুলতানা",
    phone: "01710448821",
    address: "বাড়ি ৯, সেক্টর ৭, উত্তরা, ঢাকা",
    created: at(2026, 9, 14, 9, 25),
    officerId: "off-6",
    gaps: [3, 18, 30, 72],
    notes: { resolved: "মূল লাইনের ভালভ পরিবর্তন করে চাপ স্বাভাবিক করা হয়েছে।" },
  },
  {
    id: "BD-2026-0123",
    subject: "খোলা ম্যানহোল, শিশুদের জন্য ঝুঁকিপূর্ণ",
    category: "রাস্তা ও অবকাঠামো",
    department: CITY,
    description:
      "স্কুলগামী পথে একটি ম্যানহোলের ঢাকনা নেই, কয়েক দিন ধরে খোলা পড়ে আছে। বৃষ্টির সময় পানিতে ঢাকা পড়ে গেলে বড় দুর্ঘটনার আশঙ্কা।",
    priority: "high",
    status: "in_progress",
    name: "সাইফুল আলম",
    phone: "01813207764",
    address: "রোড ৩, ব্লক সি, মোহাম্মদপুর, ঢাকা",
    created: at(2026, 9, 13, 8, 45),
    officerId: "off-1",
    gaps: [2, 10, 26],
    photos: 2,
  },
  {
    id: "BD-2026-0124",
    subject: "নতুন পানির সংযোগ পেতে অতিরিক্ত টাকা দাবি",
    category: "দুর্নীতি",
    department: WASA,
    description:
      "নতুন পানির সংযোগের সরকারি ফি জমা দেওয়ার পরও মাঠ পর্যায়ের একজন কর্মী সংযোগ দিতে আলাদা করে টাকা দাবি করছেন। বিষয়টি তদন্তের অনুরোধ জানাচ্ছি।",
    priority: "high",
    status: "assigned",
    name: "গোপনীয়তা কাম্য (নাগরিক)",
    phone: "01912774093",
    address: "যাত্রাবাড়ী, ঢাকা",
    created: at(2026, 9, 12, 13, 35),
    officerId: "off-4",
    gaps: [5, 28],
  },
  {
    id: "BD-2026-0125",
    subject: "নিয়মিত ময়লা ফেলার ভ্যাট নেই, রাস্তায় স্তূপ",
    category: "বর্জ্য ব্যবস্থাপনা",
    department: CITY,
    description:
      "বাজারের পাশের মোড়ে ময়লা ফেলার কোনো নির্দিষ্ট স্থান নেই। প্রতিদিন রাস্তার ওপর ময়লার স্তূপ জমে, যানবাহন ও পথচারী উভয়েরই সমস্যা হয়।",
    priority: "low",
    status: "reviewing",
    name: "মিজানুর রহমান",
    phone: "01718009235",
    address: "কাওরান বাজার, ঢাকা",
    created: at(2026, 9, 11, 17, 5),
    gaps: [36],
  },
  {
    id: "BD-2026-0126",
    subject: "বিদ্যুতের খুঁটি হেলে পড়েছে",
    category: "বিদ্যুৎ",
    department: PBS,
    description:
      "গত ঝড়ে আমাদের পাড়ার বিদ্যুতের খুঁটি প্রায় ৪৫ ডিগ্রি হেলে পড়েছে এবং তার নিচু হয়ে ঝুলছে। শিশুদের খেলার জায়গার একদম পাশে হওয়ায় জরুরি ব্যবস্থা প্রয়োজন।",
    priority: "high",
    status: "resolved",
    name: "রেহানা পারভীন",
    phone: "01611590873",
    address: "পশ্চিমপাড়া, সাভার, ঢাকা",
    created: at(2026, 9, 10, 10, 15),
    officerId: "off-5",
    gaps: [1, 4, 10, 30],
    notes: { resolved: "খুঁটি সোজা করে নতুন স্টে-তার লাগানো হয়েছে।" },
    photos: 1,
  },
  {
    id: "BD-2026-0127",
    subject: "অন্য এলাকার সমস্যা নিয়ে অভিযোগ",
    category: "অন্যান্য",
    department: CITY,
    description: "পাশের জেলার একটি সরকারি স্কুলের ভবন নিয়ে অভিযোগ জানাতে চাই।",
    priority: "low",
    status: "rejected",
    name: "জাহিদ হাসান",
    phone: "01715662384",
    address: "মিরপুর ১০, ঢাকা",
    created: at(2026, 9, 9, 11, 40),
    gaps: [12, 20],
    notes: { rejected: "অভিযোগটি এই সেলের এখতিয়ারভুক্ত নয়; জেলা শিক্ষা অফিসে যোগাযোগ করার পরামর্শ দেওয়া হয়েছে।" },
  },
  {
    id: "BD-2026-0128",
    subject: "সড়কের ডিভাইডারে গাছ ভেঙে পড়ে আছে",
    category: "রাস্তা ও অবকাঠামো",
    department: RHD,
    description:
      "গত সপ্তাহের ঝড়ে ডিভাইডারের একটি বড় গাছ ভেঙে অর্ধেক রাস্তা আটকে আছে। সকাল ও সন্ধ্যায় তীব্র যানজট হচ্ছে।",
    priority: "medium",
    status: "in_progress",
    name: "আসিফ ইকবাল",
    phone: "01813380456",
    address: "বনানী ১১, ঢাকা",
    created: at(2026, 9, 8, 9, 10),
    officerId: "off-2",
    gaps: [6, 22, 46],
    photos: 2,
  },
];

/* ------------------------------------------------------------------ */
/* deterministic history (0001–0113)                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AREAS = ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "মোহাম্মদপুর", "যাত্রাবাড়ী", "বাড্ডা", "মালিবাগ", "কমলাপুর", "তেজগাঁও", "লালবাগ", "বসুন্ধরা"];
const NAMES = [
  "মো. জাহাঙ্গীর আলম", "শারমিন সুলতানা", "আবুল কালাম", "নুসরাত জাহান", "হাসান মাহমুদ", "লিপি আক্তার",
  "মিজানুর রহমান", "পারভীন আক্তার", "রুবেল হোসেন", "তাসলিমা বেগম", "ইমরান খান", "সালমা খাতুন",
  "শফিকুল ইসলাম", "জেসমিন আরা", "মাসুদ রানা", "ফাতেমা তুজ জোহরা", "কবির হোসেন", "রুমানা আফরোজ",
  "নজরুল ইসলাম", "মৌসুমী আক্তার", "আলমগীর কবির", "সাবরিনা ইসলাম",
];

const SUBJECTS: Record<string, string[]> = {
  "রাস্তা ও অবকাঠামো": ["রাস্তায় গর্ত, যান চলাচলে বিঘ্ন", "ফুটপাত ভেঙে পথচারীদের চলাচলে সমস্যা", "রাস্তার বাতি নষ্ট", "সড়ক মেরামতের কাজ অসমাপ্ত ফেলে রাখা হয়েছে"],
  "পানি সরবরাহ": ["লাইনে পানির চাপ কম", "ঘোলা ও দুর্গন্ধযুক্ত পানি সরবরাহ", "পানির লাইন ফেটে অপচয়", "মিটার রিডিং ও বিলে গরমিল"],
  "বিদ্যুৎ": ["দীর্ঘক্ষণ লোডশেডিং", "ভুল বিদ্যুৎ বিল", "ঝুলন্ত তার, দুর্ঘটনার আশঙ্কা", "ট্রান্সফরমার নষ্ট"],
  "গ্যাস সংযোগ": ["গ্যাসের চাপ কম", "নতুন গ্যাস সংযোগে দীর্ঘসূত্রতা", "গ্যাস লিকেজের গন্ধ"],
  "বর্জ্য ব্যবস্থাপনা": ["নিয়মিত ময়লা সংগ্রহ হচ্ছে না", "খোলা স্থানে ময়লার স্তূপ", "ভ্যাট উপচে রাস্তায় ময়লা"],
  "ড্রেনেজ": ["ড্রেন বন্ধ, জলাবদ্ধতা", "খোলা নর্দমা থেকে দুর্গন্ধ", "ড্রেনের ঢাকনা ভাঙা"],
  "লাইসেন্স": ["ট্রেড লাইসেন্স ইস্যুতে বিলম্ব", "লাইসেন্স ফি নিয়ে অস্পষ্টতা"],
  "নিবন্ধন": ["জন্ম নিবন্ধনে বিলম্ব", "মৃত্যু নিবন্ধন সনদ পেতে হয়রানি"],
  "দুর্নীতি": ["সেবা পেতে ঘুষ দাবি", "অনিয়মিত ফি আদায়"],
  "অন্যান্য": ["সরকারি অফিসে সেবা প্রদানে অবহেলা", "তথ্য না দিয়ে ঘোরানো হচ্ছে"],
};

const CATEGORY_WEIGHTS: [string, number][] = [
  ["রাস্তা ও অবকাঠামো", 22], ["পানি সরবরাহ", 16], ["বিদ্যুৎ", 14], ["গ্যাস সংযোগ", 7], ["বর্জ্য ব্যবস্থাপনা", 15],
  ["ড্রেনেজ", 9], ["লাইসেন্স", 5], ["নিবন্ধন", 5], ["দুর্নীতি", 3], ["অন্যান্য", 4],
];

function history(): Complaint[] {
  const rnd = mulberry32(2026);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const total = CATEGORY_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  const pickCategory = () => {
    let r = rnd() * total;
    for (const [c, w] of CATEGORY_WEIGHTS) {
      if ((r -= w) <= 0) return c;
    }
    return "অন্যান্য";
  };

  const start = new Date("2026-04-01T09:00:00+06:00").getTime();
  const end = new Date("2026-09-07T18:00:00+06:00").getTime();
  const times = Array.from({ length: 113 }, () => start + rnd() * (end - start)).sort((a, b) => a - b);
  // quieter start, busier recently: skew a bit toward the end
  const out: Complaint[] = [];

  times.forEach((t, i) => {
    const n = i + 1;
    const created = new Date(t).toISOString();
    const category = pickCategory();
    const department = CATEGORY_DEPARTMENT[category];
    const pool = SEED_OFFICERS.filter((o) => o.active && o.department === department);
    const officer = pool.length ? pick(pool) : undefined;
    const area = pick(AREAS);
    const priority: Priority = rnd() < 0.22 ? "high" : rnd() < 0.55 ? "medium" : "low";
    const recent = t > new Date("2026-08-22T00:00:00+06:00").getTime();
    const roll = rnd();
    let status: Status = "resolved";
    if (roll > 0.93) status = "rejected";
    else if (recent && roll > 0.55) status = pick<Status>(["in_progress", "in_progress", "assigned", "reviewing"]);

    const gaps = [2 + rnd() * 10, 6 + rnd() * 30, 12 + rnd() * 60, 24 + rnd() * (priority === "high" ? 60 : 200)];
    const hist = buildHistory(created, status, gaps, {
      rejected: "প্রয়োজনীয় তথ্য/এখতিয়ার না থাকায় বাতিল করা হয়েছে।",
      resolved: "সমস্যাটির সমাধান সম্পন্ন হয়েছে।",
    });
    const subject = `${pick(SUBJECTS[category])} — ${area}`;
    const name = pick(NAMES);
    const phone = `01${pick(["3", "5", "6", "7", "8", "9"])}${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`;

    out.push({
      id: `BD-2026-${String(n).padStart(4, "0")}`,
      subject,
      category,
      department,
      description: `${area} এলাকায় ${subject.split(" — ")[0]} সমস্যাটি দীর্ঘদিন ধরে চলছে। সংশ্লিষ্ট কর্তৃপক্ষের দ্রুত হস্তক্ষেপ কামনা করছি।`,
      priority,
      status,
      citizen: { name, phone, address: `${area}, ঢাকা` },
      attachments: [],
      officerId: status === "new" || status === "reviewing" || status === "rejected" ? undefined : officer?.id,
      createdAt: created,
      updatedAt: hist[hist.length - 1].at,
      history: hist,
      notes: [],
      source: rnd() < 0.85 ? "online" : "admin",
    });
  });
  return out;
}

export function buildSeed(): DbState {
  return {
    version: DB_VERSION,
    complaints: [...history(), ...HAND.map(fromHand)],
    officers: SEED_OFFICERS,
    settings: DEFAULT_SETTINGS,
  };
}
