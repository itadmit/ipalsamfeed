export interface PostBackground {
  id: string;
  label: string;
  colors: string[];
  emoji?: string;
  pickerEmoji?: string;
}

export const POST_BACKGROUNDS: PostBackground[] = [
  { id: "gradient-sunset", label: "שקיעה", colors: ["#fb923c", "#f43f5e", "#ec4899"] },
  { id: "gradient-ocean", label: "אוקיינוס", colors: ["#22d3ee", "#3b82f6", "#6366f1"] },
  { id: "gradient-forest", label: "יער", colors: ["#34d399", "#22c55e", "#0f766e"] },
  { id: "gradient-night", label: "לילה", colors: ["#6366f1", "#9333ea", "#6d28d9"] },
  { id: "gradient-fire", label: "אש", colors: ["#facc15", "#f97316", "#ef4444"] },
  { id: "gradient-pastel-pink", label: "פסטל ורוד", colors: ["#f9a8d4", "#e879f9", "#c084fc"] },
  { id: "gradient-gold", label: "זהב", colors: ["#fcd34d", "#facc15", "#f97316"] },
  { id: "gradient-midnight", label: "חצות", colors: ["#1e293b", "#111827", "#18181b"] },
  { id: "gradient-candy", label: "סוכריה", colors: ["#f472b6", "#f87171", "#facc15"] },
  { id: "gradient-aurora", label: "זוהר צפוני", colors: ["#86efac", "#22d3ee", "#2563eb"] },
  { id: "gradient-lavender", label: "לבנדר", colors: ["#a78bfa", "#c084fc", "#6366f1"] },
  { id: "gradient-peach", label: "אפרסק", colors: ["#fed7aa", "#fda4af", "#f472b6"] },
  { id: "emoji-hearts", label: "לבבות", colors: ["#fb7185", "#ec4899", "#d946ef"], emoji: "❤️", pickerEmoji: "❤️" },
  { id: "emoji-love", label: "מאוהב", colors: ["#f472b6", "#f43f5e", "#ef4444"], emoji: "😍", pickerEmoji: "😍" },
  { id: "emoji-happy", label: "שמח", colors: ["#fde047", "#fbbf24", "#fb923c"], emoji: "😊", pickerEmoji: "😊" },
  { id: "emoji-poop", label: "קקי", colors: ["#d97706", "#a16207", "#9a3412"], emoji: "💩", pickerEmoji: "💩" },
  { id: "emoji-fire", label: "אש", colors: ["#f97316", "#ef4444", "#f43f5e"], emoji: "🔥", pickerEmoji: "🔥" },
  { id: "emoji-stars", label: "כוכבים", colors: ["#4f46e5", "#7c3aed", "#581c87"], emoji: "⭐", pickerEmoji: "⭐" },
  { id: "emoji-party", label: "מסיבה", colors: ["#d946ef", "#a855f7", "#6366f1"], emoji: "🎉", pickerEmoji: "🎉" },
  { id: "emoji-muscle", label: "חזק", colors: ["#0ea5e9", "#2563eb", "#4338ca"], emoji: "💪", pickerEmoji: "💪" },
];

export function getPostBackground(id: string | null | undefined): PostBackground | null {
  if (!id) return null;
  return POST_BACKGROUNDS.find((bg) => bg.id === id) ?? null;
}

export const EMOJI_POSITIONS: [number, number, number, number][] = [
  [5, 8, -15, 1.3], [12, 72, 20, 0.9], [8, 40, -8, 1.1],
  [28, 15, 12, 0.8], [22, 85, -25, 1.2], [35, 55, 18, 1.0],
  [45, 5, -10, 1.4], [50, 78, 22, 0.7], [42, 35, -20, 1.1],
  [60, 60, 8, 0.9], [65, 20, -12, 1.3], [58, 90, 15, 1.0],
  [75, 45, -18, 0.8], [78, 10, 25, 1.2], [82, 70, -5, 1.0],
  [90, 30, 10, 0.9], [88, 85, -22, 1.1], [15, 55, 30, 0.7],
  [70, 80, -8, 1.3], [95, 50, 14, 0.8],
];
