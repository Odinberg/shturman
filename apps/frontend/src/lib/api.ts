/**
 * API-клиент для Штурман Backend
 * Все запросы к FastAPI на localhost:8000/api/
 * POST-параметры передаются как query string (FastAPI ожидает Query-параметры)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function request<T>(path: string, options?: RequestInit, query?: Record<string, any>): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

function jpost<T>(path: string, data: Record<string, any>): Promise<T> {
  return request<T>(path, { method: 'POST' }, data);
}

function jpostEmpty<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'POST' });
}

// ─── Health ────────────────────────────────────────────────────────────────

export const healthAPI = {
  get: () => request<{ status: string; service: string }>('/health'),
  db: () => request<{ status: string; database: string }>('/health/db'),
};

// ─── D1: Активный дневник (journal) ────────────────────────────────────

export interface JournalEntry {
  id: number;
  content: string;
  mood: string | null;
  created_at: string;
}

export const journalAPI = {
  list: () => request<JournalEntry[]>('/journal/entries'),
  create: (content: string, mood?: string) => jpost<{ id: number; status: string }>('/journal/entries', { content, mood }),
  get: (id: number) => request<JournalEntry>(`/journal/entries/${id}`),
  generatePatterns: () => jpostEmpty<{ id: number; patterns: string }>('/journal/patterns/generate'),
  generateAltReality: (entry_id: number, genre: string) => jpost<{ id: number; genre: string; rewritten: string }>('/journal/alt-reality', { entry_id, genre }),
  listPatterns: () => request<{ id: number; period: string; created_at: string }[]>('/journal/patterns'),
  listAltReality: () => request<{ id: number; genre: string; created_at: string }[]>('/journal/alt-reality'),
};

// ─── D2: Эмоциональный профиль (emotional) ─────────────────────────────

export interface EmotionalCheckin {
  id: number;
  emoji: string;
  event: string;
  time: string;
}

export const emotionalAPI = {
  listCheckins: () => request<EmotionalCheckin[]>('/emotional/checkins'),
  createCheckin: (emoji: string, event_text = '') => jpost<{ id: number; status: string }>('/emotional/checkins', { emoji, event_text }),
  streak: () => request<{ total_days: number; days: { date: string; count: number }[]; bonus_unlocked: boolean }>('/emotional/checkins/streak'),
  generateBiorhythm: () => jpostEmpty<{ id: number; report: string }>('/emotional/biorhythm'),
  listBiorhythms: () => request<{ id: number; period_days: number; created_at: string }[]>('/emotional/biorhythm'),
  generateResources: () => jpostEmpty<{ id: number; resources: string }>('/emotional/resources'),
  listResources: () => request<{ id: number; month: string; created_at: string }[]>('/emotional/resources'),
  generateAvatar: () => jpostEmpty<{ id: number; avatar: string; dalle_prompt: string }>('/emotional/avatar'),
  listAvatars: () => request<{ id: number; week: string; dalle_prompt: string; created_at: string }[]>('/emotional/avatar'),
};

// ─── D3: Рефрейминг (reframing) ─────────────────────────────────────────

export const reframingAPI = {
  createSession: (situation: string) => jpost<{ id: number; status: string }>('/reframing/sessions', { situation }),
  listSessions: () => request<{ id: number; situation: string; created_at: string }[]>('/reframing/sessions'),
  generateInsightBox: () => jpostEmpty<{ id: number; box: string }>('/reframing/insight-box'),
  listInsightBoxes: () => request<{ id: number; created_at: string }[]>('/reframing/insight-box'),
  blindSpot: (query: string) => jpost<{ id: number; result: string }>('/reframing/blind-spot', { query }),
  aiAdvocate: (query: string) => jpost<{ response: string }>('/reframing/ai-advocate', { query }),
};

// ─── D4: Диалог с Тенью (shadow) ─────────────────────────────────────────

export const shadowAPI = {
  createRecording: (transcript: string, irritation_target: string) => jpost<{ id: number; status: string }>('/shadow/recordings', { transcript, irritation_target }),
  listRecordings: () => request<{ id: number; target: string; transcript: string; created_at: string }[]>('/shadow/recordings'),
  generateMirrorLetter: (recording_id: number) => jpost<{ id: number; letter: string }>('/shadow/mirror-letter', { recording_id }),
  generateForbiddenDesire: () => jpostEmpty<{ id: number; desire: string }>('/shadow/forbidden-desire'),
  generateAntiHero: () => jpostEmpty<{ id: number; comic: string; dalle_prompt: string }>('/shadow/anti-hero'),
  listMirrorLetters: () => request<{ id: number; trait: string; created_at: string }[]>('/shadow/mirror-letters'),
  listComics: () => request<{ id: number; trait: string; dalle_prompt: string; created_at: string }[]>('/shadow/anti-hero'),
};

// ─── D5: Сенсорные якоря (sensory) ──────────────────────────────────────

export const sensoryAPI = {
  createCheckin: (sensation: string) => jpost<{ id: number; status: string }>('/sensory/checkins', { sensation }),
  listCheckins: () => request<{ id: number; sensation: string; time: string }[]>('/sensory/checkins'),
  kineticData: () => request<{ sensation: string; time: string; hour: number; day: number }[]>('/sensory/kinetic-data'),
  saveAnchor: () => jpostEmpty<{ id: number; vibration_pattern: number[]; status: string }>('/sensory/anchor/save'),
  playAnchor: () => request<{ vibration_pattern: number[]; breathing_rhythm: string }>('/sensory/anchor/play'),
  predict: () => request<{ prediction: string; confidence: number; recommendation: string }>('/sensory/predict'),
};

// ─── D6: Множественность Я (auth/subpersonality) ────────────────────────

export const multiplicityAPI = {
  createPost: (subpersonality: string, content: string) => jpost<{ id: number; status: string }>('/auth/posts', { subpersonality, content }),
  listPosts: () => request<{ id: number; subpersonality: string; content: string; date: string }[]>('/auth/posts'),
  stats: () => request<{ persona: string; count: number }[]>('/auth/posts/stats'),
  generateRoundTable: () => jpostEmpty<{ id: number; dialogue: string; participants: string[] }>('/auth/round-table'),
  generateFamilyPortrait: () => jpostEmpty<{ id: number; portrait: string; dalle_prompt: string }>('/auth/family-portrait'),
  generateNegotiator: (critic_quote: string) => jpost<{ id: number; dialogue: string }>('/auth/negotiator', { critic_quote }),
  listRoundTables: () => request<{ id: number; participants: string[]; created_at: string }[]>('/auth/round-table'),
  listPortraits: () => request<{ id: number; dalle_prompt: string; created_at: string }[]>('/auth/family-portrait'),
};

// ─── D7: Эффект Бабочки (butterfly) ─────────────────────────────────────

export interface ButterflyEvent {
  id: number;
  event: string;
  date: string;
}

export const butterflyAPI = {
  createEvent: (event_text: string) => jpost<{ id: number; status: string }>('/butterfly/events', { event_text }),
  listEvents: () => request<ButterflyEvent[]>('/butterfly/events'),
  eventCount: () => request<{ total_events: number; bonus_unlocked: boolean }>('/butterfly/events/count'),
  generateFractal: (event_id: number) => jpost<{ id: number; insight: string }>('/butterfly/fractal', { event_id }),
  generateVault: () => jpostEmpty<{ id: number; vault: string }>('/butterfly/vault'),
  listFractals: () => request<{ id: number; event_id: number; created_at: string }[]>('/butterfly/fractal'),
  listVaults: () => request<{ id: number; month: string; has_parable: boolean }[]>('/butterfly/vault'),
};
