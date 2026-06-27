import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Provide explicit read-only cookie handlers.
        // Supabase token refresh can attempt cookie writes during Server Component render.
        // Next.js throws: "Cookies can only be modified in a Server Action...".
        getAll: () => cookieStore.getAll(),

        // No-op write handlers (read-only mode)
        setAll: () => {},
      },

    },
  );


}

