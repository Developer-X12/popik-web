export async function onRequestGet({ params, env }: any) {
  const id = params.id as string;

  // 1) env が入ってるか即チェック
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response(
      `Missing env\nSUPABASE_URL=${String(env.SUPABASE_URL)}\nSUPABASE_ANON_KEY=${env.SUPABASE_ANON_KEY ? "set" : "missing"}`,
      { status: 500 }
    );
  }

  const url =
    `${env.SUPABASE_URL}/rest/v1/pick_posts` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&select=question,image_a_url,image_b_url`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(`Supabase error\nstatus=${res.status}\nurl=${url}\n\n${text}`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const rows = await res.json();
    if (!rows?.length) {
      return new Response("Not found (no rows)", { status: 404 });
    }

    // とりあえず成功確認用
    return new Response(JSON.stringify(rows[0], null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (e: any) {
    return new Response(`Exception\n${e?.stack || e?.message || String(e)}`, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
