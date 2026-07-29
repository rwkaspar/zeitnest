// Client für die interne Ollama-Instanz (Duplikat-Check im Feedback-Flow).
// Fällt der Dienst aus, liefern die Funktionen null — der Aufrufer muss damit
// umgehen (Feedback wird dann ohne KI-Check weiterverarbeitet).

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama-mini:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:2b';
const TIMEOUT_MS = 90 * 1000;

async function askOllamaJson(systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: 'json',
        // Thinking-Modelle (z.B. qwen3.5) würden sonst minutenlang auf CPU
        // "denken", bevor die Antwort kommt — Nicht-Thinking-Modelle ignorieren das.
        think: false,
        keep_alive: '1h',
        options: { temperature: 0 },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`[ollama] HTTP ${res.status} von ${OLLAMA_URL}`);
      return null;
    }
    const data = await res.json();
    const content = data?.message?.content;
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      console.error('[ollama] Antwort war kein gültiges JSON:', content.slice(0, 200));
      return null;
    }
  } catch (err) {
    console.error('[ollama] Fehler:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { askOllamaJson, OLLAMA_MODEL };
