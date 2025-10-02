import type { ShopItem } from "../api";

export type ShopFilter = "all" | "food" | "medicine" | "bg" | "item" | "pet";

export const SHOP_FILTERS: { id: ShopFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "food", label: "Еда" },
  { id: "medicine", label: "Лечение" },
  { id: "bg", label: "Фоны" },
  { id: "item", label: "Игрушки" },
  { id: "pet", label: "Питомцы" },
];

export function prettyType(type: ShopItem["type"]): string {
  switch (type) {
    case "food": return "Еда";
    case "medicine": return "Лечение";
    case "bg": return "Фон";
    case "item": return "Игрушка";
    case "pet": return "Питомец";
    default: return type;
  }
}

export function effectText(effect?: ShopItem["effect"] | null): string | null {
  if (!effect) return null;
  const parts: string[] = [];
  if (effect.satiety) parts.push(`+${effect.satiety} к сытости`);
  if (effect.mood) parts.push(`+${effect.mood} к настроению`);
  if (effect.health) parts.push(`+${effect.health} к здоровью`);
  return parts.length ? parts.join(" · ") : null;
}

export function filterItems(items: ShopItem[], filter: ShopFilter): ShopItem[] {
  if (!items.length) return [];
  if (filter === "all") return [...items].sort((a, b) => a.price - b.price);
  return items
    .filter((item) => item.type === filter)
    .sort((a, b) => a.price - b.price);
}