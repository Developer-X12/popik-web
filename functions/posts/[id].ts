export async function onRequestGet({ params, env, request }: any) {
  const id = params.id as string;

  // Supabase REST（public readできる前提：RLSがキツいなら後で調整）
  const url =
    `${env.SUPABASE_URL}/rest/v1/pick_posts` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&select=question,image_a_url,image_b_url`;

  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await res.json();
  const post = rows?.[0];
  if (!post) return new Response("Not found", { status: 404 });

  const title = post.question ?? "Popik";
  const desc = `Pick A or B. Share your gut pick!`;
  const image = post.image_a_url || post.image_b_url || "";

  const pageUrl = new URL(request.url).toString();

  // ここは後で App Store のURL or スキームに差し替えればOK
  const appLink = env.APP_LINK_FALLBACK || "https://popikapp.com";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}

  <meta http-equiv="refresh" content="0; url=${escapeHtml(appLink)}" />
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
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
