export async function onRequestGet({ params, env }: any) {
  const id = params.id as string;

  const url =
    `${env.SUPABASE_URL}/rest/v1/pick_posts` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&select=title,image_a_url,image_b_url`;

  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`Supabase error ${res.status}\n${text}`, { status: 500 });
  }

  const rows = await res.json();
  const post = rows?.[0];
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const title = post.title ?? "Popik";
  const imgA = post.image_a_url ?? "";
  const imgB = post.image_b_url ?? "";
  const pageUrl = `https://popikapp.com/posts/${id}`;

  // SNS用はog:imageが超重要。まずAを代表にするのが安定
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>${escapeHtml(title)}</title>

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="Vote on Popik" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${imgA}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:image" content="${imgA}" />

  <style>
    body { margin:0; font-family: -apple-system, system-ui, sans-serif; background:#0b0b0f; color:#fff; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
    h1 { font-size: 22px; margin: 0 0 16px; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    img { width: 100%; height: auto; border-radius: 16px; display:block; }
    .btn { margin-top: 18px; display:block; text-align:center; padding:14px 16px; border-radius: 16px;
           background: #3b82f6; color:#fff; text-decoration:none; font-weight:600; }
    .hint { opacity:.7; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(title)}</h1>

    <div class="grid">
      ${imgA ? `<img src="${imgA}" alt="A" />` : ""}
      ${imgB ? `<img src="${imgB}" alt="B" />` : ""}
    </div>

    <a class="btn" href="popik://posts/${id}">Open in Popik</a>
    <div class="hint">If the app is not installed, download Popik from the store.</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // SNSプレビュー更新が遅いとき用。慣れてきたら調整してOK
      "cache-control": "public, max-age=60",
    },
  });
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
