import { z } from "zod";

/** Describes the registrant — not an AIDA programme or category. */
export const learnerTypes = [
  { value: "STUDENT", label: "Student or learner" },
  { value: "PROFESSIONAL", label: "Working professional" },
  { value: "EDUCATOR", label: "Teacher or educator" },
  { value: "ORGANISATION", label: "Enquiring for an organisation" },
  { value: "OTHER", label: "Other" },
] as const;

export type LearnerTypeValue = (typeof learnerTypes)[number]["value"];

const learnerTypeValues = learnerTypes.map((t) => t.value) as [LearnerTypeValue, ...LearnerTypeValue[]];

export const LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 254,
  messageMax: 1000,
  maxLinksInMessage: 2,
} as const;

const countLinks = (s: string) => (s.match(/https?:\/\/|www\./gi) ?? []).length;

export const interestSchema = z.object({
  fullName: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(LIMITS.nameMin, { error: "Please enter your full name." })
    .max(LIMITS.nameMax, { error: `Name must be ${LIMITS.nameMax} characters or fewer.` })
    .refine((v) => !/[<>]/.test(v), { error: "Name contains characters that are not allowed." }),
  email: z
    .string({ error: "Please enter your email address." })
    .trim()
    .toLowerCase()
    .max(LIMITS.emailMax, { error: "Email address is too long." })
    .pipe(z.email({ error: "Please enter a valid email address." })),
  learnerType: z.enum(learnerTypeValues, { error: "Please choose the option that best describes you." }),
  message: z
    .string()
    .trim()
    .max(LIMITS.messageMax, { error: `Message must be ${LIMITS.messageMax} characters or fewer.` })
    .refine((v) => countLinks(v) <= LIMITS.maxLinksInMessage, {
      error: "Please remove some of the links from your message.",
    })
    .optional()
    .transform((v) => (v ? v : undefined)),
  /** Optional id of a published programme; checked against the database by the service. */
  programme: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
  consent: z.literal("on", {
    error: "Please confirm you have read the privacy notice.",
  }),
});

export type InterestInput = z.infer<typeof interestSchema>;
export type InterestField = keyof z.input<typeof interestSchema>;

/** Converts submitted FormData into a plain object for validation. */
export function readInterestForm(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : undefined;
  };
  return {
    fields: {
      fullName: str("fullName"),
      email: str("email"),
      learnerType: str("learnerType"),
      message: str("message"),
      programme: str("programme"),
      consent: str("consent"),
    },
    honeypot: str("company_website") ?? "",
    formToken: str("formToken"),
    startedAt: str("startedAt"),
  };
}
