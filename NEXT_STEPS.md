# What you need to do to go live

Four accounts and settings only you can create. Do them in this order. Each one takes a few minutes.
Never paste a password or an API key into a chat. They only ever go into the official websites below.

## 1. GitHub (where the code lives, public)

1. Go to https://github.com and click **Sign up**. Choose a username and finish the email check.
2. Tell me "GitHub is ready". I will then set up the sign-in tool on this Mac and give you one command to run. It opens your browser so you can approve it. After that I can create the public repository and upload the code.

## 2. Anthropic (the AI that writes the words)

1. Go to https://console.anthropic.com and create an account.
2. Open **Billing** and add a small amount of credit to start, for example $20.
3. Open **Limits** (under Settings) and set a **monthly spend limit**, for example $50. This is the hard ceiling the brief asks for.
4. Open **API keys**, click **Create key**, name it `soul-blueprint`, and copy it. You will paste it in step 3 below. Treat it like a password.

My estimate, not yet measured: one full Blueprint costs roughly 20 to 40 cents in AI usage.

## 3. Vercel (where the site runs)

1. Go to https://vercel.com, click **Sign up**, and choose **Continue with GitHub**.
2. Click **Add New**, then **Project**. Find `soul-blueprint` in the list and click **Import**.
3. Open **Environment Variables**. Name: `ANTHROPIC_API_KEY`. Value: paste the key from step 2. Click **Add**.
4. Click **Deploy**. Vercel runs the accuracy tests first. If a test fails, it refuses to publish. That is on purpose.
5. When it finishes you get a link ending in `.vercel.app`. Send it to me so I can test the live site.

## 4. Your domain (Squarespace to Vercel)

1. In Vercel, open the project, then **Settings**, then **Domains**. Type `blueprint.yourdomain.com` (with your real domain) and click **Add**.
2. Vercel shows one record to create. It looks like: type **CNAME**, name **blueprint**, value **cname.vercel-dns.com** (use the exact value Vercel shows you).
3. In Squarespace, open **Domains**, click your domain, then **DNS settings**, then **Add record**. Enter the same three things and save.
4. Wait. It usually works within an hour. Vercel shows a green check when it is connected.

## 5. Optional, but it makes the tests stronger

Two full charts (A and B) are checked against astro.com today. To check house positions on unusual births too, make an astro.com Data Sheet (the same kind you already made) for any of these and drop the PDFs in `reference-charts`:

- A birth far north, for example Reykjavik, Iceland
- A birth in the southern hemisphere, for example Sydney or Perth, Australia
- A birth on February 29
- Any two or three people whose exact birth time you trust

A Human Design chart for the same people makes them count twice.
