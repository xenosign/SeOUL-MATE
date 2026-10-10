import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RequestCard, type RequestWithTraveler } from "@/components/request-card";

const SELECT = "*, traveler:profiles!traveler_id(display_name, avatar_url, nationality)";

export default async function RequestsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === "traveler") {
    const { data } = await supabase
      .from("guide_requests")
      .select(SELECT)
      .eq("traveler_id", profile.id)
      .order("travel_date", { ascending: false });
    const requests = (data ?? []) as RequestWithTraveler[];

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My requests</h1>
          <Link
            href="/requests/new"
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            + New request
          </Link>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {requests.length === 0 ? (
            <Empty>
              You haven&apos;t posted a request yet.{" "}
              <Link href="/requests/new" className="font-medium text-rose-600 underline">
                Find a guide
              </Link>
            </Empty>
          ) : (
            requests.map((r) => <RequestCard key={r.id} request={r} />)
          )}
        </div>
      </div>
    );
  }

  // Guide: browse upcoming open requests
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("guide_requests")
    .select(SELECT)
    .eq("status", "open")
    .gte("travel_date", today)
    .order("travel_date", { ascending: true })
    .limit(100);
  const requests = (data ?? []) as RequestWithTraveler[];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Travelers looking for a guide</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Open a request and send a message to offer your help.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {requests.length === 0 ? (
          <Empty>No open requests right now. Check back soon!</Empty>
        ) : (
          requests.map((r) => <RequestCard key={r.id} request={r} />)
        )}
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">
      {children}
    </p>
  );
}
