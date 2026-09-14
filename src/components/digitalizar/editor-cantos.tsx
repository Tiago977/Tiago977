"use client";

import { useRef, useState } from "react";
import type { Quad } from "@/lib/imagem/nucleo";
import { limitar } from "@/lib/imagem/nucleo";

const NOMES = ["canto superior esquerdo", "canto superior direito", "canto inferior direito", "canto inferior esquerdo"];
const PASSO_TECLADO = 0.01;

/**
 * Prévia da foto com os quatro cantos do recorte arrastáveis. As coordenadas
 * são normalizadas (0..1), então o mesmo recorte vale em qualquer tamanho de
 * tela e na resolução cheia na hora de processar.
 */
export function EditorCantos({
  previa,
  largura,
  altura,
  quad,
  onChange,
}: {
  previa: string;
  largura: number;
  altura: number;
  quad: Quad;
  onChange: (quad: Quad) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);

  function mover(indice: number, clienteX: number, clienteY: number) {
    const area = areaRef.current?.getBoundingClientRect();
    if (!area || area.width === 0 || area.height === 0) return;

    const proximo = quad.map((p, i) =>
      i === indice
        ? {
            x: limitar((clienteX - area.left) / area.width, 0, 1),
            y: limitar((clienteY - area.top) / area.height, 0, 1),
          }
        : p,
    ) as Quad;

    onChange(proximo);
  }

  function aoTeclar(indice: number, evento: React.KeyboardEvent) {
    const deslocamentos: Record<string, [number, number]> = {
      ArrowLeft: [-PASSO_TECLADO, 0],
      ArrowRight: [PASSO_TECLADO, 0],
      ArrowUp: [0, -PASSO_TECLADO],
      ArrowDown: [0, PASSO_TECLADO],
    };
    const deslocamento = deslocamentos[evento.key];
    if (!deslocamento) return;

    evento.preventDefault();
    const proximo = quad.map((p, i) =>
      i === indice
        ? { x: limitar(p.x + deslocamento[0], 0, 1), y: limitar(p.y + deslocamento[1], 0, 1) }
        : p,
    ) as Quad;
    onChange(proximo);
  }

  const pontos = quad.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");

  return (
    <div
      ref={areaRef}
      className="relative mx-auto w-full touch-none overflow-hidden rounded-xl bg-painel-suave select-none"
      style={{ aspectRatio: `${largura} / ${altura}`, maxHeight: "min(58vh, 560px)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previa}
        alt="Foto capturada"
        className="pointer-events-none absolute inset-0 size-full object-contain"
        draggable={false}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <mask id="recorte-mascara">
            <rect width="100" height="100" fill="#fff" />
            <polygon points={pontos} fill="#000" />
          </mask>
        </defs>
        <rect width="100" height="100" fill="rgb(0 0 0 / 0.45)" mask="url(#recorte-mascara)" />
        <polygon
          points={pontos}
          fill="none"
          stroke="var(--acento)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {quad.map((ponto, indice) => (
        <button
          key={indice}
          type="button"
          aria-label={`Ajustar ${NOMES[indice]}`}
          onKeyDown={(e) => aoTeclar(indice, e)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setArrastando(indice);
          }}
          onPointerMove={(e) => {
            if (arrastando === indice) mover(indice, e.clientX, e.clientY);
          }}
          onPointerUp={() => setArrastando(null)}
          onPointerCancel={() => setArrastando(null)}
          className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
          style={{ left: `${ponto.x * 100}%`, top: `${ponto.y * 100}%` }}
        >
          <span
            className="block rounded-full border-2 border-acento bg-painel transition-[width,height]"
            style={{
              width: arrastando === indice ? 22 : 16,
              height: arrastando === indice ? 22 : 16,
            }}
          />
        </button>
      ))}
    </div>
  );
}
