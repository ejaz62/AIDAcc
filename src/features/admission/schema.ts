import { z } from "zod";

export const COURSE_DEFAULT = "AIDA AI Training Programme";

export const BATCHES = [
  { value: "B1", label: "1st – 10th of the month" },
  { value: "B2", label: "11th – 20th of the month" },
  { value: "B3", label: "21st – 30th of the month" },
  { value: "UNSURE", label: "Not sure yet" },
] as const;

export const COMPUTER_KNOWLEDGE = [
  { value: "YES", label: "Yes, I can create and save a Word document or a file." },
  { value: "BASIC", label: "I have basic knowledge but need some guidance." },
  { value: "NONE", label: "No, I am a complete beginner." },
] as const;

export const AI_EXPERIENCE = [
  { value: "NONE", label: "No, I am a complete beginner." },
  { value: "SOME", label: "Yes, I have some experience." },
  { value: "REGULAR", label: "I regularly use AI tools." },
] as const;

export const ADMISSION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "PAYMENT_PENDING", label: "Awaiting payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "NOT_PROCEEDING", label: "Not proceeding" },
] as const;
export type AdmissionStatusValue = (typeof ADMISSION_STATUSES)[number]["value"];

type Opt = readonly { value: string; label: string }[];
const values = <T extends Opt>(o: T) => o.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];
export const labelOf = (o: Opt, v: string) => o.find((x) => x.value === v)?.label ?? v;

const noTags = (v: string) => !/[<>]/.test(v);
const countLinks = (s: string) => (s.match(/https?:\/\/|www\./gi) ?? []).length;
const optional = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, { error: msg })
    .optional()
    .transform((v) => (v ? v : undefined));

export const admissionSchema = z.object({
  fullName: z
    .string({ error: "Please enter your full name." })
    .trim()
    .min(2, { error: "Please enter your full name." })
    .max(120, { error: "Name must be 120 characters or fewer." })
    .refine(noTags, { error: "Name contains characters that are not allowed." }),
  whatsapp: z
    .string({ error: "Please enter your WhatsApp number." })
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{9,15}$/, { error: "Please enter a valid WhatsApp number, e.g. 03001234567 or +923001234567." })),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { error: "Email address is too long." })
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.email({ error: "Please enter a valid email address." }).optional()),
  location: z
    .string({ error: "Please enter your city and country." })
    .trim()
    .min(2, { error: "Please enter your city and country." })
    .max(120, { error: "Please keep this under 120 characters." })
    .refine(noTags, { error: "This contains characters that are not allowed." }),
  course: z.string().trim().max(150).optional().transform((v) => v || COURSE_DEFAULT),
  batch: z.enum(values(BATCHES), { error: "Please choose a preferred batch." }),
  computerKnowledge: z.enum(values(COMPUTER_KNOWLEDGE), { error: "Please answer this question." }),
  aiExperience: z.enum(values(AI_EXPERIENCE), { error: "Please answer this question." }),
  message: optional(1000, "Please keep your message under 1000 characters.").refine(
    (v) => !v || countLinks(v) <= 2,
    { error: "Please remove some of the links from your message." },
  ),
  consent: z.literal("on", { error: "Please confirm you have read the privacy notice." }),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;
export type AdmissionField = keyof z.input<typeof admissionSchema>;

export function readAdmissionForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : undefined;
  };
  return {
    fields: {
      fullName: str("fullName"),
      whatsapp: str("whatsapp"),
      email: str("email"),
      location: str("location"),
      course: str("course"),
      batch: str("batch"),
      computerKnowledge: str("computerKnowledge"),
      aiExperience: str("aiExperience"),
      message: str("message"),
      consent: str("consent"),
    },
    honeypot: str("company_website") ?? "",
    formToken: str("formToken"),
    startedAt: str("startedAt"),
  };
}

export type AdmissionFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<AdmissionField, string>>;
  values?: Partial<Record<AdmissionField, string>>;
};
