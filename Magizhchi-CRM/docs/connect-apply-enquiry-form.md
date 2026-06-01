# Connect apply.magizhchi.academy/enquiry → Magizhchi CRM

This guide wires your public enquiry form to the CRM so every submission becomes a
lead automatically (auto-detected name/phone/email, all other fields kept, dedup,
and auto-assigned if Automatic mode is on).

---

## Step 1 — Create the lead source (in the CRM, get your key)

1. Log in to the CRM as the **company** account.
2. Go to **Lead Sources → + Web Service (API)**.
3. Name it `Apply Enquiry Form` → **Create source**.
4. The next screen shows two things **once** — copy both:
   - **Endpoint URL**:  `https://<YOUR-CRM-DOMAIN>/api/v1/ingest/<SOURCE-ID>/leads`
   - **API key**:  `mzk_…`  (shown only once — save it now)

> The API key is a secret. Store it server-side; never expose it in public
> browser JavaScript (see the security note at the bottom).

Verified working: a POST with the valid key returns `200 {"status":"accepted"}`,
a wrong key returns `401`, and the lead lands in **Leads** with `source = API` and
every submitted field preserved.

---

## Step 2 — Send each enquiry to the endpoint

When someone submits the form at `apply.magizhchi.academy/enquiry`, your site makes
one HTTP POST. You can send **any field names** — the CRM auto-detects name/phone/email
and keeps the rest.

### cURL (for testing)
```bash
curl -X POST "https://<YOUR-CRM-DOMAIN>/api/v1/ingest/<SOURCE-ID>/leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: mzk_your_real_key" \
  -d '{
        "full_name":     "Asha R",
        "student_phone": "+919812345678",
        "email":         "asha@example.com",
        "course_type":   "Data Science",
        "city":          "Madurai",
        "filledAt":      "website"
      }'
```

### Node / Next.js API route (recommended — keeps the key server-side)
```js
// pages/api/enquiry.js  (or an Express handler on your apply.magizhchi.academy backend)
export default async function handler(req, res) {
  const r = await fetch(
    `https://YOUR-CRM-DOMAIN/api/v1/ingest/${process.env.CRM_SOURCE_ID}/leads`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CRM_API_KEY,   // from env, never hard-coded
      },
      body: JSON.stringify(req.body),            // pass the form fields straight through
    }
  )
  if (!r.ok) return res.status(502).json({ ok: false })
  res.json({ ok: true })
}
```

### PHP (if the form posts to a PHP backend)
```php
<?php
$payload = json_encode($_POST); // or your sanitized fields
$ch = curl_init("https://YOUR-CRM-DOMAIN/api/v1/ingest/SOURCE_ID/leads");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ["Content-Type: application/json", "X-API-Key: " . getenv("CRM_API_KEY")],
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_RETURNTRANSFER => true,
]);
curl_exec($ch);
```

### WordPress / no-code (Zapier / Make)
Trigger = "new form submission" → Action = "Webhook → POST" to the endpoint URL,
add header `X-API-Key: mzk_…`, map the form fields into the JSON body.

---

## ⚠️ Important: the CRM must be reachable from the internet

Right now the CRM runs on **`localhost:8080`** (your PC). Your public site
`apply.magizhchi.academy` **cannot reach localhost**. Before the live form can post
leads, the CRM needs a public address. Pick one:

- **Quick test:** run a tunnel (`cloudflared tunnel --url http://localhost:8080`
  or `ngrok http 8080`) and use the temporary public URL as `<YOUR-CRM-DOMAIN>`.
- **Production:** deploy the CRM behind a real domain, e.g.
  `https://crm.magizhchi.academy`, and use that.

Until then you can fully test the integration **locally** (a POST from your PC to
`http://localhost:8080/...` works — verified).

---

## 🔒 Security note — don't put the API key in browser JS

If your enquiry form is pure front-end (static HTML/JS), calling the ingest endpoint
directly from the browser would expose the API key to anyone viewing source. Two safe
options:

1. **Proxy through your own backend** (the Node/PHP examples above) — the key stays on
   your server. Best option.
2. **Use a Webhook source instead of API** — create the source as **Webhook** in the
   CRM; it gives a URL with a token (`…/api/v1/webhooks/<id>?token=…`). The token is
   lower-risk than an API key and can be rotated by recreating the source. Still
   prefer a server-side proxy when possible.

---

## What happens after a lead arrives
- Appears instantly in **Leads** (`source = API` or `WEBHOOK`).
- All fields preserved; name/phone/email auto-detected (re-mappable later).
- Duplicate phone/email is skipped automatically.
- If **Settings → Auto-assign** is ON, it's routed by your rules (area/age/etc.) or
  the fallback the moment it arrives.
