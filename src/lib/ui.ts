import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});
const DATA_COMPLETA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const HORA = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function formatarData(iso: string) {
  const data = new Date(iso);
  const agora = new Date();
  const mesmoDia =
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth() &&
    data.getDate() === agora.getDate();

  if (mesmoDia) return HORA.format(data);
  if (data.getFullYear() === agora.getFullYear()) return DATA_CURTA.format(data);
  return DATA_COMPLETA.format(data);
}

export function formatarDataHora(iso: string) {
  return DATA_COMPLETA.format(new Date(iso));
}

export function iniciais(nome: string, email: string) {
  const base = nome.trim() || email.split("@")[0] || "?";
  const partes = base.split(/[\s._-]+/).filter(Boolean);
  const letras = partes.slice(0, 2).map((p) => p[0]);
  return (letras.join("") || base[0]).toUpperCase();
}

/** Converte um valor de <input type="datetime-local"> em ISO, respeitando o fuso do usuário. */
export function localParaIso(valor: string) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

export function isoParaLocal(iso: string | null) {
  if (!iso) return "";
  const data = new Date(iso);
  const deslocamento = data.getTimezoneOffset() * 60_000;
  return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16);
}

export function validarEmail(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}
