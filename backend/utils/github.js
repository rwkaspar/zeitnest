// GitHub-API-Client für das Feedback-Widget (Issues lesen/anlegen).
// Braucht GITHUB_TOKEN in der Umgebung; ohne Token liefern die Funktionen null.

const GITHUB_REPO = process.env.GITHUB_REPO || 'rwkaspar/zeitnest';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const API = 'https://api.github.com';

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'zeitnest-feedback',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function listOpenIssues() {
  if (!GITHUB_TOKEN) return null;
  try {
    const res = await fetch(`${API}/repos/${GITHUB_REPO}/issues?state=open&per_page=100`, { headers: headers() });
    if (!res.ok) {
      console.error(`[github] listOpenIssues HTTP ${res.status}`);
      return null;
    }
    const items = await res.json();
    // Pull Requests erscheinen ebenfalls im Issues-Endpoint — herausfiltern.
    return items
      .filter((i) => !i.pull_request)
      .map((i) => ({
        number: i.number,
        title: i.title,
        body: (i.body || '').slice(0, 500),
        labels: (i.labels || []).map((l) => l.name),
      }));
  } catch (err) {
    console.error('[github] listOpenIssues Fehler:', err.message);
    return null;
  }
}

async function createIssue(title, body, labels) {
  if (!GITHUB_TOKEN) return null;
  try {
    const res = await fetch(`${API}/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, labels }),
    });
    if (!res.ok) {
      console.error(`[github] createIssue HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const issue = await res.json();
    return { number: issue.number, url: issue.html_url };
  } catch (err) {
    console.error('[github] createIssue Fehler:', err.message);
    return null;
  }
}

module.exports = { listOpenIssues, createIssue, GITHUB_REPO };
