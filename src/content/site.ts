/**
 * Central site content.
 *
 * IMPORTANT: AIDA has not yet supplied verified programme, fee, contact or
 * institutional information. Everything below is neutral draft copy.
 * Items marked `placeholder: true` are visibly labelled as draft in the UI.
 * Replace them with approved information before launch — never add invented
 * courses, fees, dates, contact details, statistics or accreditation claims.
 */

export const site = {
  name: "AIDA",
  fullName: "Artificial Intelligence Digital Academy",
  description:
    "AIDA — the Artificial Intelligence Digital Academy. A 10-day, live, instructor-led online AI Training Programme for complete beginners.",
} as const;

export const navigation = [
  { label: "Home", href: "/" },
  { label: "About AIDA", href: "/about" },
  { label: "Founder Profile", href: "/founder" },
  { label: "AI Training Programme", href: "/programme" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Fees & Admission", href: "/fees-admission" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNavigation = [
  { label: "Home", href: "/" },
  { label: "About AIDA", href: "/about" },
  { label: "Founder Profile", href: "/founder" },
  { label: "AI Training Programme", href: "/programme" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Fees & Admission", href: "/fees-admission" },
  { label: "Programmes", href: "/programmes" },
  { label: "Register interest", href: "/register-interest" },
  { label: "FAQs", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy notice", href: "/privacy" },
  { label: "Staff login", href: "/admin/sign-in" },
] as const;

export const registerCta = { label: "Register interest", href: "/register-interest" } as const;
export const applyCta = { label: "Apply now", href: "/admission" } as const;

/** Shown wherever Register Interest appears, so it is never mistaken for an admission application. */
export const notAnApplication = {
  title: "Registering interest is not an application",
  body: "Registering interest only lets AIDA contact you with news. It is not an application for admission, does not reserve a place and creates no commitment for you or for AIDA. Formal admission applications will be handled through a separate process once admissions open.",
} as const;

export const hero = {
  eyebrow: "Artificial Intelligence Digital Academy",
  title: "Master practical AI in",
  highlight: "just 10 days.",
  lead: "Join the AIDA AI Training Programme: 10 days of live, instructor-led online classes for complete beginners — no coding needed. Learn Claude and AI tools, build websites with AI and create AI agents.",
  primaryCta: { label: "View the programme", href: "/programme" },
  secondaryCta: { label: "Fees & Admission", href: "/fees-admission" },
  highlights: ["10-day live online course", "9:00–10:00 PM PKT · monthly batches", "Ask AIDA assistant, any time"],
} as const;

export const about = {
  eyebrow: "About AIDA",
  title: "An academy built around artificial intelligence",
  lead: "Artificial intelligence is changing how we learn, work and create. AIDA exists to make AI education clear, practical and accessible.",
  placeholder: false,
} as const;

export const pillars = [
  {
    icon: "brain",
    title: "Understand AI",
    body: "Build a clear grasp of the core ideas behind modern artificial intelligence.",
  },
  {
    icon: "wrench",
    title: "Apply it in practice",
    body: "Learn through hands-on work that connects concepts to real tasks.",
  },
  {
    icon: "shield",
    title: "Use it responsibly",
    body: "Consider the ethical, social and safety questions that come with AI.",
  },
  {
    icon: "globe",
    title: "Learn digitally",
    body: "A digital-first academy, designed for learning online.",
  },
] as const;

export const approach = {
  eyebrow: "How it works",
  title: "Your path with AIDA",
  lead: "How to join the AIDA AI Training Programme.",
  placeholder: false,
  steps: [
    { title: "Contact Reception", body: "Call or message AIDA Reception on +92 322 720 4898 with any questions." },
    { title: "Choose a batch", body: "Pick a monthly batch: 1st–10th, 11th–20th or 21st–30th." },
    { title: "Pay the fee", body: "Pay via Easypaisa (Pakistan) or ask Reception for instructions from other countries." },
    { title: "Get confirmed", body: "AIDA verifies your payment and then confirms your registration." },
  ],
} as const;

export const programmes = {
  eyebrow: "Programmes",
  title: "Programme catalogue",
  lead: "Official AIDA programme information has not been published yet. Each programme listing will show the details below once confirmed.",
  /** Fields every programme listing will present. Values are deliberately unset. */
  fields: ["Overview", "Who it is for", "Duration", "Study format", "Entry requirements", "Fees"],
} as const;

export const contact = {
  eyebrow: "Ready to start?",
  title: "Join the next AIDA batch",
  lead: "Contact AIDA Reception to choose your batch, or register your interest and we will get in touch.",
} as const;
