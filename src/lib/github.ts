import "server-only";

export type Repo = { full_name: string; name: string; html_url: string; description: string | null; pushed_at: string; private: boolean; language: string | null };
export type Commit = { sha: string; message: string; date: string; url: string };

const headers = () => ({
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});

/** Repos de l'utilisateur. Avec GITHUB_TOKEN, les repos privés sont inclus. */
export async function listRepos(login: string): Promise<Repo[]> {
  const url = process.env.GITHUB_TOKEN
    ? "https://api.github.com/user/repos?sort=pushed&per_page=100&affiliation=owner,collaborator"
    : `https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=pushed&per_page=100`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 300 } });
  if (!res.ok) return [];
  return res.json();
}

export async function recentCommits(fullName: string, n = 5): Promise<Commit[]> {
  const res = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=${n}`, { headers: headers(), next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((c: { sha: string; html_url: string; commit: { message: string; author: { date: string } } }) => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split("\n")[0],
    date: c.commit.author.date,
    url: c.html_url,
  }));
}
