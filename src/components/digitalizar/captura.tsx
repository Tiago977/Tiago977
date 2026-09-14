"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { Botao } from "@/components/ui";
import { canvasParaBlob } from "@/lib/imagem/nucleo";

type Lado = "environment" | "user";

/** Câmera ao vivo com botão de captura, e envio de arquivos como alternativa. */
export function Captura({
  onCapturar,
  ocupado,
}: {
  onCapturar: (arquivos: Blob[]) => void;
  ocupado: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [lado, setLado] = useState<Lado>("environment");
  const [ligada, setLigada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  const desligar = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLigada(false);
  }, []);

  useEffect(() => desligar, [desligar]);

  async function ligar(qual: Lado) {
    setErro(null);
    setIniciando(true);
    desligar();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: qual },
          width: { ideal: 2560 },
          height: { ideal: 1920 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setLado(qual);
      setLigada(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setIniciando(false);
    }
  }

  async function fotografar() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    onCapturar([await canvasParaBlob(canvas, "image/jpeg", 0.95)]);
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-borda bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[3/4] w-full object-cover sm:aspect-[4/3]"
          style={{ display: ligada ? "block" : "none" }}
        />

        {!ligada ? (
          <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 bg-painel-suave px-6 text-center sm:aspect-[4/3]">
            <Camera className="size-7 text-texto-suave" />
            <p className="max-w-xs text-[13px] text-texto-suave">
              {erro ?? "Aponte a câmera para o documento sobre uma superfície de cor diferente."}
            </p>
            <Botao onClick={() => ligar(lado)} disabled={iniciando}>
              {iniciando ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              Ligar câmera
            </Botao>
          </div>
        ) : null}

        {ligada ? (
          <button
            type="button"
            onClick={() => ligar(lado === "environment" ? "user" : "environment")}
            aria-label="Trocar de câmera"
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
          >
            <RefreshCw className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Botao
          variante="solido"
          tamanho="lg"
          className="flex-1"
          onClick={fotografar}
          disabled={!ligada || ocupado}
        >
          {ocupado ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Capturar página
        </Botao>

        <label className="contents">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              const arquivos = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (arquivos.length) onCapturar(arquivos);
            }}
          />
          <span
            role="button"
            tabIndex={0}
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-borda bg-painel px-4 text-[15px] font-medium transition hover:border-borda-forte"
          >
            <ImagePlus className="size-4" />
            <span className="hidden sm:inline">Enviar foto</span>
          </span>
        </label>
      </div>
    </div>
  );
}

function mensagemDeErro(erro: unknown) {
  const nome = erro instanceof DOMException ? erro.name : "";
  if (nome === "NotAllowedError")
    return "Permissão de câmera negada. Libere o acesso nas configurações do navegador ou envie uma foto.";
  if (nome === "NotFoundError") return "Nenhuma câmera encontrada. Envie uma foto do dispositivo.";
  if (!window.isSecureContext)
    return "A câmera só funciona em conexões seguras (https). Envie uma foto do dispositivo.";
  return "Não foi possível abrir a câmera. Envie uma foto do dispositivo.";
}
