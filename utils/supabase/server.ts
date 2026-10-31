import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase URL 뒤에 붙은 불필요한 경로(/rest/v1 또는 마지막 슬래시)를 자동 정제하는 함수
 */
function cleanSupabaseUrl(url?: string): string {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * [서버 컴포넌트 & 라우트 핸들러용 Supabase 클라이언트]
 * 
 * - Next.js 서버 환경(Route Handlers, Server Actions, Server Components)에서 사용합니다.
 * - 쿠키(Cookies)를 통해 암호화된 세션 토큰을 안전하게 읽고 씁니다.
 * - 환경 변수가 비어 있더라도 서버 오류가 발생하지 않도록 방어 코드가 적용되어 있습니다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const url = cleanSupabaseUrl(rawUrl);

  const isConfigured = 
    url && 
    anonKey && 
    url !== "your-supabase-project-url" && 
    anonKey !== "your-supabase-anon-key" &&
    (url.startsWith("http://") || url.startsWith("https://"));

  const supabaseUrl = isConfigured ? url : "https://placeholder-project.supabase.co";
  const supabaseAnonKey = isConfigured ? anonKey : "placeholder-anon-key";

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 setAll이 호출되는 경우의 예외 무시
            // (미들웨어에서 토큰을 갱신하므로 정상 동작합니다)
          }
        },
      },
    }
  );
}
