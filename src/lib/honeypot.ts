/**
 * Anti-spam "honeypot" field shared by the public forms. It is hidden from people,
 * so only bots fill it in. The name is deliberately meaningless: names such as
 * "company_website" get filled in by browser autofill, which made real
 * submissions look like spam.
 */
export const HONEYPOT_FIELD = "aida_hidden_check";

/** Attributes that tell browsers and password managers not to autofill the field. */
export const HONEYPOT_INPUT_PROPS = {
  id: HONEYPOT_FIELD,
  name: HONEYPOT_FIELD,
  type: "text",
  tabIndex: -1,
  autoComplete: "off",
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
} as const;
