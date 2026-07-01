/**
 * API-клиент для Штурман Backend
 * POST-параметры передаются как JSON body (совместимо с FastAPI Body).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ─── Auth ──────────────────────────────────────────────────────────────────

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
  if (token) localStorage.setItem('shturman_token', token);
  else localStorage.removeItem('shturman_token');
}

export function getAuthToken(): string | null {
  if (_authToken) return _authToken;
  _authToken = localStorage.getItem('shturman_token');
  return _authToken;
}

async function request<T>(
  path: string,
  method: string = 'GET',
  body?: Record<string, any>,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options: RequestInit = { method, headers };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

function jget<T>(path: string): Promise<T> {
  return request<T>(path, 'GET');
}

function jpost<T>(path: string, data: Record<string, any>): Promise<T> {
  return request<T>(path, 'POST', data);
}

function jpostEmpty<T>(path: string): Promise<T> {
  return request<T>(path, 'POST');
}

// ─── Health ────────────────────────────────────────────────────────────────

export const healthAPI = {
  get: () => jget<{ status: string; service: string }>('/health'),
  db: () => jget<{ status: string; database: string }>('/health/db'),
};

// ─── VK Auth ───────────────────────────────────────────────────────────────

export const authAPI = {
  vkLogin: (vkParams: Record<string, string>) =>
    jpost<{ access_token: string; token_type: string; user_id: number; username: string }>(
      '/auth/vk',
      vkParams,
    ),
};

// ─── D1: Активный дневник (journal) ────────────────────────────────────

export interface JournalEntry {
  id: number;
  content: string;
  mood: string | null;
  created_at: string;
}

export const journalAPI = {
  list: () => jget<JournalEntry[]>('/journal/entries'),
  create: (content: string, mood?: string) =>
    jpost<{ id: number; status: string }>('/journal/entries', { content, mood }),
  get: (id: number) => jget<JournalEntry>(`/journal/entries/${id}`),
  generatePatterns: () =>
    jpostEmpty<{ id: number; patterns: string }>('/journal/patterns/generate'),
  generateAltReality: (entry_id: number, genre: string) =>
    jpost<{ id: number; genre: string; rewritten: string }>('/journal/alt-reality', {
      entry_id,
      genre,
    }),
  listPatterns: () =>
    jget<{ id: number; period: string; created_at: string }[]>('/journal/patterns'),
  listAltReality: () =>
    jget<{ id: number; genre: string; created_at: string }[]>('/journal/alt-reality'),
};

// ─── D2: Эмоциональный профиль (emotional) ─────────────────────────────

export interface EmotionalCheckin {
  id: number;
  emoji: string;
  event: string;
  time: string;
}

export const emotionalAPI = {
  listCheckins: () => jget<EmotionalCheckin[]>('/emotional/checkins'),
  createCheckin: (emoji: string, event_text = '') =>
    jpost<{ id: number; status: string }>('/emotional/checkins', { emoji, event_text }),
  streak: () =>
    jget<{
      total_days: number;
      days: { date: string; count: number }[];
      bonus_unlocked: boolean;
    }>('/emotional/checkins/streak'),
  generateBiorhythm: () =>
    jpostEmpty<{ id: number; report: string }>('/emotional/biorhythm'),
  listBiorhythms: () =>
    jget<{ id: number; period_days: number; created_at: string }[]>(
      '/emotional/biorhythm',
    ),
  generateResources: () =>
    jpostEmpty<{ id: number; resources: string }>('/emotional/resources'),
  listResources: () =>
    jget<{ id: number; month: string; created_at: string }[]>('/emotional/resources'),
  generateAvatar: () =>
    jpostEmpty<{ id: number; avatar: string; dalle_prompt: string }>(
      '/emotional/avatar',
    ),
  listAvatars: () =>
    jget<{ id: number; week: string; dalle_prompt: string; created_at: string }[]>(
      '/emotional/avatar',
    ),
};

// ─── D3: Рефрейминг (reframing) ─────────────────────────────────────────

export const reframingAPI = {
  createSession: (situation: string) =>
    jpost<{ id: number; status: string }>('/reframing/sessions', { situation }),
  listSessions: () =>
    jget<{ id: number; situation: string; created_at: string }[]>('/reframing/sessions'),
  generateInsightBox: () =>
    jpostEmpty<{ id: number; box: string }>('/reframing/insight-box'),
  listInsightBoxes: () =>
    jget<{ id: number; created_at: string }[]>('/reframing/insight-box'),
  blindSpot: (query: string) =>
    jpost<{ id: number; result: string }>('/reframing/blind-spot', { query }),
  aiAdvocate: (query: string) =>
    jpost<{ response: string }>('/reframing/ai-advocate', { query }),
};

// ─── D4: Диалог с Тенью (shadow) ─────────────────────────────────────────

export const shadowAPI = {
  createRecording: (transcript: string, irritation_target: string) =>
    jpost<{ id: number; status: string }>('/shadow/recordings', {
      transcript,
      irritation_target,
    }),
  listRecordings: () =>
    jget<
      { id: number; target: string; transcript: string; created_at: string }[]
    >('/shadow/recordings'),
  generateMirrorLetter: (recording_id: number) =>
    jpost<{ id: number; letter: string }>('/shadow/mirror-letter', { recording_id }),
  generateForbiddenDesire: () =>
    jpostEmpty<{ id: number; desire: string }>('/shadow/forbidden-desire'),
  generateAntiHero: () =>
    jpostEmpty<{ id: number; comic: string; dalle_prompt: string }>(
      '/shadow/anti-hero',
    ),
  listMirrorLetters: () =>
    jget<{ id: number; trait: string; created_at: string }[]>(
      '/shadow/mirror-letters',
    ),
  listComics: () =>
    jget<{ id: number; trait: string; dalle_prompt: string; created_at: string }[]>(
      '/shadow/anti-hero',
    ),
};

// ─── D5: Сенсорные якоря (sensory) ──────────────────────────────────────

export const sensoryAPI = {
  createCheckin: (sensation: string) =>
    jpost<{ id: number; status: string }>('/sensory/checkins', { sensation }),
  listCheckins: () =>
    jget<{ id: number; sensation: string; time: string }[]>('/sensory/checkins'),
  kineticData: () =>
    jget<{ sensation: string; time: string; hour: number; day: number }[]>(
      '/sensory/kinetic-data',
    ),
  saveAnchor: () =>
    jpostEmpty<{ id: number; vibration_pattern: number[]; status: string }>(
      '/sensory/anchor/save',
    ),
  playAnchor: () =>
    jget<{ vibration_pattern: number[]; breathing_rhythm: string }>(
      '/sensory/anchor/play',
    ),
  predict: () =>
    jget<{ prediction: string; confidence: number; recommendation: string }>(
      '/sensory/predict',
    ),
};

// ─── D6: Множественность Я (auth/subpersonality) ────────────────────────

export const multiplicityAPI = {
  createPost: (subpersonality: string, content: string) =>
    jpost<{ id: number; status: string }>('/auth/posts', { subpersonality, content }),
  listPosts: () =>
    jget<{ id: number; subpersonality: string; content: string; date: string }[]>(
      '/auth/posts',
    ),
  stats: () => jget<{ persona: string; count: number }[]>('/auth/posts/stats'),
  generateRoundTable: () =>
    jpostEmpty<{ id: number; dialogue: string; participants: string[] }>(
      '/auth/round-table',
    ),
  generateFamilyPortrait: () =>
    jpostEmpty<{ id: number; portrait: string; dalle_prompt: string }>(
      '/auth/family-portrait',
    ),
  generateNegotiator: (critic_quote: string) =>
    jpost<{ id: number; dialogue: string }>('/auth/negotiator', { critic_quote }),
  listRoundTables: () =>
    jget<{ id: number; participants: string[]; created_at: string }[]>(
      '/auth/round-table',
    ),
  listPortraits: () =>
    jget<{ id: number; dalle_prompt: string; created_at: string }[]>(
      '/auth/family-portrait',
    ),
};

// ─── D7: Эффект Бабочки (butterfly) ─────────────────────────────────────

export interface ButterflyEvent {
  id: number;
  event: string;
  date: string;
}

export const butterflyAPI = {
  createEvent: (event_text: string) =>
    jpost<{ id: number; status: string }>('/butterfly/events', { event_text }),
  listEvents: () => jget<ButterflyEvent[]>('/butterfly/events'),
  eventCount: () =>
    jget<{ total_events: number; bonus_unlocked: boolean }>(
      '/butterfly/events/count',
    ),
  generateFractal: (event_id: number) =>
    jpost<{ id: number; insight: string }>('/butterfly/fractal', { event_id }),
  generateVault: () =>
    jpostEmpty<{ id: number; vault: string }>('/butterfly/vault'),
  listFractals: () =>
    jget<{ id: number; event_id: number; created_at: string }[]>(
      '/butterfly/fractal',
    ),
  listVaults: () =>
    jget<{ id: number; month: string; has_parable: boolean }[]>(
      '/butterfly/vault',
    ),
};
