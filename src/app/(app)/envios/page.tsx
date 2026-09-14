import type { Metadata } from "next";
import Link from "next/link";
import { Send } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/cabecalho";
import { ListaEnvios } from "@/components/envios/lista";
import type { Envio } from "@/lib/types";

export const metadata: Metadata = { title: "Envios" };

export default async function PaginaEnvios() {
  const supabase = await criarClienteServidor();

  const { data: envios } = await supabase
    .from("envios")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(100);

  const ids = (envios ?? []).map((e) => e.id);
  const quantidades: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: itens } = await supabase
      .from("envio_itens")
      .select("envio_id")
      .in("envio_id", ids);

    for (const item of itens ?? []) {
      quantidades[item.envio_id] = (quantidades[item.envio_id] ?? 0) + 1;
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Envios"
        descricao="Envios em massa, imediatos ou agendados."
        acoes={
          <Link
            href="/envios/novo"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-acento px-3 text-[13px] font-medium text-acento-texto transition hover:opacity-90"
          >
            <Send className="size-3.5" />
            Novo envio
          </Link>
        }
      />
      <div className="p-4 md:p-6">
        <ListaEnvios envios={(envios ?? []) as Envio[]} quantidades={quantidades} />
      </div>
    </>
  );
}
