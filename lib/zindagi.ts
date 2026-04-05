// lib/zindagi.ts
// Zindagi Dashboard + Scheme Radar — core types, scheme data, matching logic

export interface ZindagiProfile {
  name: string;
  age: number;
  state: string;
  category: "General" | "OBC" | "SC" | "ST" | "EWS" | "";
  occupation:
    | "Farmer"
    | "Daily wage worker"
    | "Small business"
    | "Govt employee"
    | "Private job"
    | "Student"
    | "Unemployed"
    | "";
  income: number;       // annual in INR
  land: number;         // acres
  family: number;       // size
  hasBPL: boolean | null;
  hasJanDhan: boolean | null;
}

export interface Scheme {
  id: string;
  name: string;
  desc: string;
  benefit: number;      // max annual benefit in INR
  urgency: "urgent" | "high" | "medium";
  deadline: string;
  icon: string;
  category: string;
  applyUrl?: string;
}

export const SCHEMES: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    desc: "₹6,000/year direct to farmer bank accounts in 3 installments",
    benefit: 6000,
    urgency: "urgent",
    deadline: "Next installment: Jun 2025",
    icon: "🌾",
    category: "Agriculture",
    applyUrl: "https://pmkisan.gov.in",
  },
  {
    id: "ayushman",
    name: "Ayushman Bharat PM-JAY",
    desc: "₹5 lakh/year cashless health cover for low-income families",
    benefit: 500000,
    urgency: "high",
    deadline: "Enroll before hospital visit",
    icon: "⚕️",
    category: "Healthcare",
    applyUrl: "https://pmjay.gov.in",
  },
  {
    id: "ujjwala",
    name: "PM Ujjwala Yojana",
    desc: "Free LPG connection for BPL households — save on fuel cost",
    benefit: 1600,
    urgency: "medium",
    deadline: "Open enrollment",
    icon: "🔥",
    category: "Social",
    applyUrl: "https://pmuy.gov.in",
  },
  {
    id: "pmay",
    name: "Pradhan Mantri Awas Yojana",
    desc: "Subsidy up to ₹2.67 lakh for building/buying a home",
    benefit: 267000,
    urgency: "high",
    deadline: "Applications close Sep 2025",
    icon: "🏠",
    category: "Housing",
    applyUrl: "https://pmaymis.gov.in",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card",
    desc: "Short-term crop loans at subsidised interest rates",
    benefit: 30000,
    urgency: "urgent",
    deadline: "Kharif season: apply by May",
    icon: "💳",
    category: "Agriculture",
    applyUrl: "https://www.nabard.org",
  },
  {
    id: "jandhan",
    name: "PM Jan Dhan Yojana",
    desc: "Zero-balance bank account with RuPay card & ₹2L accident insurance",
    benefit: 200000,
    urgency: "medium",
    deadline: "Always open",
    icon: "🏦",
    category: "Finance",
    applyUrl: "https://pmjdy.gov.in",
  },
  {
    id: "pmkvy",
    name: "Skill India / PMKVY",
    desc: "Free vocational training + ₹8,000 stipend on completion",
    benefit: 8000,
    urgency: "medium",
    deadline: "Next batch: Jul 2025",
    icon: "🎓",
    category: "Career",
    applyUrl: "https://www.skillindia.gov.in",
  },
  {
    id: "mgnrega",
    name: "MGNREGA Work Guarantee",
    desc: "100 days guaranteed work at minimum wages in your village",
    benefit: 24000,
    urgency: "high",
    deadline: "Demand work within 15 days of applying",
    icon: "⚒️",
    category: "Employment",
    applyUrl: "https://nrega.nic.in",
  },
  {
    id: "fasal-bima",
    name: "Pradhan Mantri Fasal Bima",
    desc: "Crop insurance against drought, flood & natural calamity",
    benefit: 50000,
    urgency: "urgent",
    deadline: "Kharif deadline: 31 Jul 2025",
    icon: "🌧️",
    category: "Agriculture",
    applyUrl: "https://pmfby.gov.in",
  },
  {
    id: "sukanya",
    name: "Sukanya Samriddhi Yojana",
    desc: "7.6% interest savings scheme for girl child education & marriage",
    benefit: 150000,
    urgency: "medium",
    deadline: "Open anytime",
    icon: "👧",
    category: "Finance",
    applyUrl: "https://www.india.gov.in/sukanya-samriddhi-yojna",
  },
];

// Match schemes to a profile — returns matched schemes sorted by urgency
export function matchSchemes(profile: Partial<ZindagiProfile>): Scheme[] {
  const urgencyOrder = { urgent: 0, high: 1, medium: 2 };

  return SCHEMES.filter((s) => {
    // Agriculture schemes — only for farmers with land
    if (["pm-kisan", "kcc", "fasal-bima"].includes(s.id)) {
      if (profile.occupation !== "Farmer") return false;
      if ((profile.land ?? 0) <= 0) return false;
    }
    // BPL-gated schemes
    if (["ujjwala"].includes(s.id)) {
      if (profile.hasBPL === false) return false;
    }
    // Jan Dhan — only if they don't already have it
    if (s.id === "jandhan") {
      if (profile.hasJanDhan === true) return false;
    }
    // Income cap: Ayushman, PMAY, MGNREGA, Ujjwala
    if (["ayushman", "ujjwala", "mgnrega"].includes(s.id)) {
      if ((profile.income ?? 0) > 250000) return false;
    }
    if (s.id === "pmay") {
      if ((profile.income ?? 0) > 600000) return false;
    }
    // Skill India — age under 35
    if (s.id === "pmkvy") {
      if ((profile.age ?? 99) > 35) return false;
    }
    // MGNREGA — rural/low income only
    if (s.id === "mgnrega") {
      if (!["Farmer", "Daily wage worker", "Unemployed"].includes(profile.occupation ?? "")) return false;
    }
    return true;
  }).sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

// Calculate Zindagi Score (0-100)
export function calcZindagiScore(profile: Partial<ZindagiProfile>): number {
  const fields: (keyof ZindagiProfile)[] = [
    "name", "age", "state", "category", "occupation",
    "income", "land", "family", "hasBPL", "hasJanDhan",
  ];
  const filled = fields.filter((f) => {
    const v = profile[f];
    return v !== undefined && v !== null && v !== "" && v !== 0;
  });
  return Math.round((filled.length / fields.length) * 100);
}

// WhatsApp message with urgent schemes
export function buildWhatsAppMessage(profile: Partial<ZindagiProfile>, schemes: Scheme[]): string {
  const urgent = schemes.filter((s) => s.urgency === "urgent");
  const lines = [
    `Hi! I want deadline alerts for my govt schemes on MARGDARSHAK.`,
    ``,
    `My profile: ${profile.occupation || "Worker"}, ${profile.state || "India"}, ₹${(profile.income || 0).toLocaleString("en-IN")}/yr`,
    ``,
    `Urgent schemes:`,
    ...urgent.map((s) => `• ${s.name} — ${s.deadline}`),
  ];
  return lines.join("\n");
}

// Persist profile to localStorage
export const STORAGE_KEY = "margdarshak_zindagi_profile";

export function saveProfile(profile: ZindagiProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

export function loadProfile(): Partial<ZindagiProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}