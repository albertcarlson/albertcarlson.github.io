/**
 * BLOG POSTS INDEX
 * ─────────────────
 * To add a new post:
 *   1. Create a new file in /posts/your-post-slug.html  (copy _template.html)
 *   2. Add an entry to the POSTS array below (newest first)
 */

const POSTS = [
  // {
  //   slug:    "hello-world",          // matches /posts/hello-world.html
  //   title:   "Hello, World!",
  //   date:    "2026-03-31",
  //   tag:     "Meta",                 // optional label shown in blue
  //   excerpt: "A short description shown in the post list.",
  // },
  {
    slug:    "grandma",          // matches /posts/hello-world.html
    title:   "The Day the Lottery Got Too Expensive for Grandma",
    date:    "2024-06-08",
    tag:     "Rant",                 // optional label shown in blue
    excerpt: "'Back in the day, I'd grab one of those lottery tickets every Friday, and it only cost four bucks. Just the other day, I went down to the kiosk again, ...",
  },
];

/* ── Renders the post list into #post-list ── */
function renderPostList() {
  const el = document.getElementById("post-list");
  if (!el) return;

  if (POSTS.length === 0) {
    el.innerHTML = '<li style="padding:1.25rem 0;color:var(--gray-text)">No posts yet — check back soon.</li>';
    return;
  }

  el.innerHTML = POSTS.map(p => `
    <li class="post-item">
      <a href="posts/${p.slug}.html">
        <div class="post-meta">
          <span>${formatDate(p.date)}</span>
          ${p.tag ? `<span class="post-tag">${p.tag}</span>` : ""}
        </div>
        <div class="post-title">${p.title}</div>
        ${p.excerpt ? `<div class="post-excerpt">${p.excerpt}</div>` : ""}
      </a>
    </li>
  `).join("");
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
}

document.addEventListener("DOMContentLoaded", renderPostList);
