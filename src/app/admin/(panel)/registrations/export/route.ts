import { getDb } from "@/lib/db";
import { exportRegistrationsCsv, filtersSchema } from "@/features/admin/registrations";
import { getAdminUser } from "@/features/admin/session";

/** CSV download of registrations matching the current filters. Admin only. */
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return new Response("Unauthorised", { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = filtersSchema.parse(params);
  const { csv } = await exportRegistrationsCsv(getDb(), user, filters);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aida-registrations-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
