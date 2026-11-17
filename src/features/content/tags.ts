/** Cache tags for staff-managed content. Admin actions call `updateTag` with these. */
export const CONTENT_TAGS = {
  programmes: "content:programmes",
  site: "content:site",
  faq: "content:faq",
} as const;
