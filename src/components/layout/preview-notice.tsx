import { Info } from "lucide-react";
import { getSiteDetails } from "@/features/content/queries";

/** Site-wide strip shown while staff keep the "development preview" setting switched on. */
export async function PreviewNotice() {
  const { showPreviewNotice } = await getSiteDetails();
  if (!showPreviewNotice) return null;
  return (
    <div className="bg-warning-50 text-warning-900">
      <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
        <Info className="size-4 shrink-0" aria-hidden />
        Development preview: wording is provisional and official information is still being published.
      </p>
    </div>
  );
}
