import type { Lang } from "./context";

/** Parameterized strings (e.g. "{n}টি অভিযোগ পাওয়া গেছে") — one {bn, en} template per key. */
export const TEMPLATES: Record<string, Record<Lang, string>> = {
  // shared
  paginationRange: { bn: "{total}টির মধ্যে {from}–{to}", en: "{from}–{to} of {total}" },
  viewDetailFor: { bn: "{id} বিস্তারিত দেখুন", en: "View details for {id}" },
  viewLarger: { bn: "{name} বড় করে দেখুন", en: "View {name} larger" },
  removeFile: { bn: "{name} সরান", en: "Remove {name}" },
  removeItem: { bn: "{name} সরান", en: "Remove {name}" },
  addLabel: { bn: "{label} যুক্ত করুন", en: "Add {label}" },
  editName: { bn: "{name} সম্পাদনা", en: "Edit {name}" },
  deleteName: { bn: "{name} মুছুন", en: "Delete {name}" },
  daysCount: { bn: "{n} দিন", en: "{n} days" },

  // dashboard
  filteredListHeading: { bn: "অভিযোগের তালিকা — {label}", en: "Complaint list — {label}" },
  viewAllCount: { bn: "সবগুলো ({n}টি) দেখুন →", en: "View all ({n}) →" },

  // notification bell
  newComplaintsNotification: { bn: "বিজ্ঞপ্তি, {n}টি নতুন অভিযোগ", en: "Notifications, {n} new complaints" },
  newComplaintsHeading: { bn: "নতুন অভিযোগ ({n})", en: "New complaints ({n})" },

  // complaints list
  complaintsFoundCount: { bn: "{n}টি অভিযোগ পাওয়া গেছে", en: "{n} complaints found" },

  // complaint form
  maxFilesAllowed: { bn: "সর্বোচ্চ {n}টি ফাইল যুক্ত করা যাবে", en: "At most {n} files can be added" },
  onlyJpgPngPdf: { bn: '"{name}" — শুধু JPG, PNG বা PDF গ্রহণযোগ্য', en: '"{name}" — only JPG, PNG or PDF is accepted' },
  fileTooLarge: { bn: '"{name}" — ফাইলের আকার ৫ এমবির বেশি', en: '"{name}" — file is larger than 5 MB' },
  charCountHint: { bn: "{n} অক্ষর — কোথায়, কবে থেকে এবং কী সমস্যা তা উল্লেখ করুন", en: "{n} characters — mention where, since when, and what the problem is" },
  uploadHint: { bn: "JPG, PNG, PDF (সর্বোচ্চ ৫ এমবি, {n}টি পর্যন্ত)", en: "JPG, PNG, PDF (up to 5 MB, up to {n} files)" },
  submittedHint: {
    bn: "আমাদের সংশ্লিষ্ট বিভাগ শীঘ্রই আপনার অভিযোগ পর্যালোচনা করবে। নিচের ট্র্যাকিং আইডি সংরক্ষণ করুন — অগ্রগতি জানতে এই আইডি ও আপনার মোবাইল নম্বর ({phone}) লাগবে।",
    en: "Our relevant department will review your complaint shortly. Save the tracking ID below — you'll need it along with your mobile number ({phone}) to check progress.",
  },
  complaintAddedToast: { bn: "অভিযোগ {id} যুক্ত হয়েছে", en: "Complaint {id} added" },
  fixFieldsCount: { bn: "{n}টি ঘর সংশোধন করুন", en: "Please fix {n} field(s)" },

  // track page
  attachmentCount: { bn: "সংযুক্ত ফাইল: {n}টি।", en: "Attached files: {n}." },

  // complaint detail
  noComplaintForId: { bn: '"{id}" আইডির কোনো অভিযোগ নেই।', en: 'There is no complaint with ID "{id}".' },
  slaOpenOk: { bn: "নির্ধারিত সময়ের মধ্যে — {n} দিন বাকি", en: "Within deadline — {n} day(s) left" },
  slaOpenLate: { bn: "সময়সীমা {n} দিন অতিক্রান্ত", en: "Overdue by {n} day(s)" },
  slaDoneOk: { bn: "{n} দিনে সমাধান — নির্ধারিত সময়ের মধ্যে", en: "Resolved in {n} day(s) — within deadline" },
  slaDoneLate: { bn: "{n} দিনে সমাধান — নির্ধারিত সময়ের পরে", en: "Resolved in {n} day(s) — after deadline" },
  slaClosed: { bn: "বাতিলকৃত অভিযোগ", en: "Rejected complaint" },
  statusChangeTitle: { bn: "স্ট্যাটাস: {label}", en: "Status: {label}" },
  smsSentToast: { bn: "{phone} নম্বরে SMS পাঠানো হয়েছে (ডেমো)", en: "SMS sent to {phone} (demo)" },
  smsCharCount: { bn: "{chars} অক্ষর · প্রায় {segments}টি SMS", en: "{chars} characters · about {segments} SMS" },

  // reports
  openCountHint: { bn: "চলমান {n}টি", en: "{n} open" },
  resolvedCountHint: { bn: "{n}টি সমাধান", en: "{n} resolved" },
  withinSlaHint: { bn: "নির্ধারিত সময়ে সমাধান {pct}%", en: "{pct}% resolved within SLA" },
  slaFooter: {
    bn: "নির্ধারিত সময়সীমা: উচ্চ অগ্রাধিকার {high} দিন, মধ্যম {medium} দিন, সাধারণ {low} দিন (সেটিংস থেকে পরিবর্তনযোগ্য)।",
    en: "Deadlines: high priority {high} days, medium {medium} days, low {low} days (changeable in Settings).",
  },

  // officers
  officersSummary: { bn: "মোট {total} জন কর্মকর্তা, সক্রিয় {active} জন", en: "{total} officers total, {active} active" },
  officerDeactivated: { bn: "{name} নিষ্ক্রিয় করা হয়েছে", en: "{name} has been deactivated" },
  officerActivated: { bn: "{name} সক্রিয় করা হয়েছে", en: "{name} has been activated" },
  officerDeleted: { bn: "{name}-কে মুছে ফেলা হয়েছে", en: "{name} has been deleted" },

  // settings
  slaFieldLabel: { bn: "{label} (দিন)", en: "{label} (days)" },
  resetConfirmBody: {
    bn: "বর্তমান সব অভিযোগ, কর্মকর্তা ও সেটিংস মুছে গিয়ে প্রাথমিক ডেমো ডেটা ফিরে আসবে ({n}টি অভিযোগ বর্তমানে আছে)। এটি ফেরানো যাবে না — প্রয়োজনে আগে ব্যাকআপ নিন।",
    en: "All current complaints, officers and settings will be deleted and replaced with the original demo data ({n} complaints currently exist). This can't be undone — take a backup first if needed.",
  },
};
