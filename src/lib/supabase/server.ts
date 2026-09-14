import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

export async function criarClienteServidor() {
  const jar = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              jar.set(name, value, options);
            }
          } catch {
            // Server Components não podem gravar cookies; o proxy.ts renova a sessão.
          }
        },
      },
    },
  );
}
