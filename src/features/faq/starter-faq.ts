import { notAnApplication, site } from "@/content/site";

/**
 * Starter FAQ entries. They describe only how this website works (all verifiably
 * true of the platform) — never AIDA programmes, fees or dates. Staff can edit,
 * unpublish or delete them in Admin → FAQ.
 */
export const STARTER_FAQ = [
  {
    question: "What is AIDA?",
    answer: `AIDA stands for ${site.fullName}, a digital academy focused on artificial intelligence education. More information about AIDA will be published on the About page (/about) as it is confirmed.`,
  },
  {
    question: "How do I register my interest?",
    answer:
      "Use the form at /register-interest. Enter your name, email address and which description fits you best, and optionally a programme and a message. You will receive a confirmation email, and AIDA will contact you when there is news to share.",
  },
  {
    question: "Is registering interest the same as applying for admission?",
    answer: `No. ${notAnApplication.body}`,
  },
  {
    question: "Where can I find programme details and fees?",
    answer:
      "Published programmes are listed at /programmes, each with its overview, who it is for, duration, study format, entry requirements and fees. Details that have not been confirmed yet are shown as \"To be confirmed\".",
  },
  {
    question: "How is my personal information used?",
    answer:
      "Details you submit are used only to contact you about AIDA and to prevent spam. You can ask for them to be deleted at any time. The full privacy notice is at /privacy.",
  },
  {
    question: "How does the Ask AIDA assistant work?",
    answer:
      "Ask AIDA answers questions using only AIDA's published website information, so it will tell you when something has not been published yet. Please don't share personal details in the chat; conversations are kept for 30 days to improve answers.",
  },
];
