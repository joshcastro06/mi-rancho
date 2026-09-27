export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));

export const formatLongDate = (value = new Date()) =>
  new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(value);

export const today = () => new Date().toISOString().slice(0, 10);

export const isValidDate = (value: string) => Boolean(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());

export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
