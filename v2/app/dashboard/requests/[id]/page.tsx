import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: requestRow, error } = await supabase
    .from("requests")
    .select("id,service_type,details,status,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !requestRow) notFound();

  const { data: events } = await supabase
    .from("request_events")
    .select("id,event_type,message,created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="container section">
      <div className="top">
        <div>
          <p className="eyebrow">تفاصيل الطلب</p>
          <h1>{requestRow.service_type}</h1>
        </div>
        <Link className="btn alt" href="/dashboard">العودة للوحة</Link>
      </div>

      <section className="panel">
        <div className="top">
          <strong>الحالة الحالية</strong>
          <span className="status">{requestRow.status}</span>
        </div>
        <p>{requestRow.details}</p>
        <small className="muted">
          تاريخ الطلب: {new Date(requestRow.created_at).toLocaleString("ar-SA")}
        </small>
      </section>

      <section className="panel">
        <h2>سجل الطلب</h2>
        {!events?.length ? (
          <p className="muted">لا توجد تحديثات حتى الآن.</p>
        ) : (
          events.map((event) => (
            <article className="request" key={event.id}>
              <strong>{event.message || "تحديث على الطلب"}</strong>
              <div className="muted">
                {new Date(event.created_at).toLocaleString("ar-SA")}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
