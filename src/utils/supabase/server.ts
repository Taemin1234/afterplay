import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!;

export const createSupabaseServerClient = async () => {
    const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabasePublicKey,
    {
      cookies: {
        getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // 서버 컴포넌트에서 쿠키를 수정하려 할 때 발생하는 에러를 무시합니다.
              // 보통 Middleware에서 처리하게 됩니다.
            }
        },
      },
    },
  );
};
