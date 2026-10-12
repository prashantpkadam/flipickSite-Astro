# Writing blog posts, case studies and whitepapers

Content is written in **Pages CMS**, a web form. Every Save becomes a commit to the
GitHub repository, and Vercel builds the site from it. Nobody needs to know git.

```
Editor fills in the form  ->  Save  ->  commit on branch `staging`
        ->  Vercel builds staging.flipick.com (drafts are visible there)
        ->  an admin approves  ->  staging is merged into `main`  ->  flipick.com
```

## Part 1: One-time setup (admin)

1. Open <https://app.pagescms.org> and sign in with GitHub.
2. Install the **GitHub App** on the account that owns the repository
   (`prashantpkadam`) and give it access to `flipickSite-Astro`.
3. Open the repository in Pages CMS and pick the branch **`staging`**. The form
   definitions come from `.pages.yml` on that branch.
4. In Pages CMS open **Collaborators** and invite each editor **by email**. Editors do
   not need a GitHub account.
5. In Vercel (project Settings -> Environment Variables) add `SHOW_DRAFTS` = `true`
   for the **Preview** environment only. Never add it to Production. This makes drafts
   and scheduled posts visible on staging, marked "Draft" and hidden from Google.
6. Make `staging.flipick.com` point at the `staging` branch (Vercel -> Settings ->
   Domains), so editors have one address to check.

Developers: editors commit straight to `staging`, so merge `origin/staging` back into
`dev` regularly (`git fetch && git merge origin/staging`) before promoting `dev`.

## Part 2: Editor guide

### Create a post
1. Open Pages CMS, choose the site, then **Blog posts**, **Case studies** or
   **Whitepapers**.
2. Click **Add new**.
3. Type the **file name** when asked. It becomes the web address, so use lowercase
   words with hyphens: `grocery-vvp` becomes `flipick.com/blog/grocery-vvp`.
4. Fill in the form:
   - **Title** (up to 110 characters) and **Short description** (up to 200).
   - **Publish date**. The post appears on this date once Draft is off.
   - **Draft**. Leave it **ON** while you work.
   - **Cover image**: upload a WebP or JPG, about 1200 x 630 pixels, under 200 KB.
     Then fill in **Cover image description** (required when there is an image).
   - **Tags**, then write the article in the big **Article** box.
5. Click **Save**.

### Check it before it goes live
Open `staging.flipick.com/blog` (or `/case-studies`, `/white-papers`). Drafts show a
yellow **Draft** tag and a banner. Fix anything in Pages CMS and Save again.

### Publish
1. Switch **Draft** to **OFF** and Save.
2. Tell an admin the post is ready. The admin merges `staging` into `main`, and the
   post appears on flipick.com within a few minutes.
3. To publish on a future date: set that **Publish date** with Draft OFF. The site is
   rebuilt every night at 00:05 India time, so the post goes live on its date.

### Rules
- Do not rename a published post (that changes its web address). The form blocks it.
- Deleting is blocked too. Ask a developer to remove a published post.
- Images: always fill in the description (alt text). Keep files small.
- Start article sections with a second-level heading, not a first-level one.
  The title is already the main heading.

### If something looks wrong
- A page missing on staging: the build may have failed. Ask a developer to check the
  **Deployments** tab in Vercel. The message names the file and the field.
- You see raw `---` lines at the top of a page: a field was left in the wrong place.
  Open the entry in Pages CMS and re-save it.
