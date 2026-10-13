# 0xmg portfolio — Eleventy edition

Your two designs (`portfolio-v2.html` and `articles.html`), turned into a site you update
without writing HTML. Output is plain static files, no backend.

## Run it locally

    npm install        # once
    npm start          # live preview, reloads when you save

`npm run build` writes the finished site to `_site/`.

## Where things live

| You want to change...            | Edit this                          |
|----------------------------------|------------------------------------|
| Add / edit a **post**            | a `.md` file in `posts/`           |
| Add / edit a **project** card    | `_data/projects.json`              |
| Add / rename a **drawer** (topic)| `_data/drawers.json`               |
| Email, LinkedIn, CV path, photo  | `_data/site.json`                  |
| Hero, About text, Timeline       | `index.njk` (plain HTML)           |
| Colors, fonts, layout            | `css/home.css`, `css/post.css`     |

Put your files here: **photo** `images/lo.jpg`, **CV** `cv/CV.pdf`, post screenshots `images/posts/`.

## Add a post (the 30-second version)

Create `posts/my-new-box.md`:

    ---
    title: "Box name"
    date: 2026-10-12
    tag: htb-machines
    summary: "One or two lines shown on the folder in the cabinet."
    ---

    ## Recon

    Write in normal Markdown. Code goes in fenced blocks:

    ```
    nmap -sC -sV 10.10.10.10
    ```

- `tag` must match a key in `_data/drawers.json` (`htb-machines`, `htb-pro-labs`, `homelabs`, `embedded-iot`).
  The folder appears in that drawer automatically, newest first, and the file counter updates.
- Wrap `title` and `summary` in quotes. A colon inside an unquoted value breaks the file.
- Use `##` for sections (the page title is already the H1).
- Add `[[toc]]` on its own line wherever you want a generated table of contents.
  It uses the post's `##` and deeper headings, with matching links; omit it when
  a post does not need a table of contents.
- Images: `<figure><img src="/images/posts/shot.png" alt="..."><figcaption>Caption</figcaption></figure>`
- Highlighted note: `<aside><p><b>Note:</b> ...</p></aside>`
- Quote: start the line with `>`
- Callout box (types: note, tip, important, warning, caution, info, danger):

      > [!WARNING]
      > This deletes everything under the namespace!

  Add a custom title on the marker line: `> [!TIP] Faster way`
- Colored code: put the language after the opening fence, e.g. ` ```bash `, ` ```python `, ` ```php `.
  Without a language the block is plain.
- Curly braces like `{{7*7}}` are safe inside posts.
- Add `draft: true` to hide a post from the live site while still seeing it in `npm start`.

## Add a drawer

Add a line to `_data/drawers.json`, then use its key as `tag:` in posts:

    "web-apps": { "name": "Web Apps", "note": "Bugs in the wild" }

## Add a project

Add a block to `_data/projects.json`. Set `"active": true` for the red "ACTIVE" tag.

## Publish on GitHub Pages

1. Create a GitHub repo. Naming it `yourusername.github.io` serves the site at the root URL.
2. Push this folder to the `main` branch.
3. Repo > Settings > Pages > Source: **GitHub Actions**.
4. Every `git push` rebuilds and publishes. Progress shows in the Actions tab.

The workflow in `.github/workflows/deploy.yml` sets the sub-path automatically for repos
not named `*.github.io`, so links and CSS keep working. With a custom domain, set
`PATH_PREFIX` to `/` in that workflow.

## Notes

- Fonts load from Google Fonts, so they need an internet connection.
- The timeline (red-string board) is plain HTML in `index.njk`. Copy one of the `.item`
  blocks to add an event; the string redraws itself through every pin.
