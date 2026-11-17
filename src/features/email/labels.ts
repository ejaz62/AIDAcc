/** Display labels for stored emails (shared by admin pages). */
export const KIND_LABELS: Record<string, string> = {
  registrant_confirmation: "Confirmation to registrant",
  staff_alert: "Staff alert",
  staff_digest: "Daily summary",
  test: "Test email",
  admission_alert: "Admission alert",
  applicant_confirmation: "Confirmation to applicant",
};

/** `tone` maps onto the admin StatusBadge colours. */
export const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  SENT: { label: "Sent", tone: "CONTACTED" },
  PREVIEW: { label: "Preview only", tone: "NEW" },
  PENDING: { label: "Queued", tone: "ARCHIVED" },
  FAILED: { label: "Failed", tone: "FAILED" },
};
