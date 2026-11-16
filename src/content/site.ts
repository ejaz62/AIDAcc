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
    "AIDA — the Artificial Intelligence Digital Academy. Register your interest to hear when programme information is published.",
  /** Asks search engines not to index the site. Set to false at public launch. */
  blockSearchEngines: true,
} as const;

export const navigation = [
  { label: "About", href: "/about" },
  { label: "Programmes", href: "/programmes" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNavigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Programmes", href: "/programmes" },
  { label: "Register interest", href: "/register-interest" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy notice", href: "/privacy" },
] as const;

export const registerCta = { label: "Register interest", href: "/register-interest" } as const;

/** Shown wherever Register Interest appears, so it is never mistaken for an admission application. */
export const notAnApplication = {
  title: "Registering interest is not an application",
  body: "Registering interest only lets AIDA contact you with news. It is not an application for admission, does not reserve a place and creates no commitment for you or for AIDA. Formal admission applications will be handled through a separate process once admissions open.",
} as const;

export const hero = {
  eyebrow: "Artificial Intelligence Digital Academy",
  title: "Learn to understand, use and build with",
  highlight: "artificial intelligence.",
  lead: "AIDA is a digital academy dedicated to artificial intelligence education. Register your interest to be among the first to hear when programme information is published.",
  primaryCta: { label: "Register interest", href: "/register-interest" },
  secondaryCta: { label: "About AIDA", href: "/about" },
} as const;

export const about = {
  eyebrow: "About AIDA",
  title: "An academy built around artificial intelligence",
  lead: "Artificial intelligence is changing how we learn, work and create. AIDA exists to make AI education clear, practical and accessible.",
  placeholder: true,
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
  lead: "From first interest to formal application.",
  placeholder: true,
  steps: [
    { title: "Explore", body: "Read about AIDA and check back as programme information is published." },
    { title: "Register interest", body: "Leave your details so we can let you know about news and openings." },
    { title: "Receive updates", body: "We contact you by email when there is relevant information to share." },
    { title: "Apply", body: "When admissions open, apply formally through the separate admissions process." },
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
  eyebrow: "Stay informed",
  title: "Be the first to hear when programme information is published",
  lead: "Register your interest and we will contact you by email when there is news to share.",
} as const;
