import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase URL 뒤에 붙은 불필요한 경로(/rest/v1 또는 마지막 슬래시)를 자동 정제하는 함수
 */
function cleanSupabaseUrl(url?: string): string {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Supabase URL이 올바른 HTTP/HTTPS 형식인지 검증하는 도우미 함수
 */
function isValidUrl(url?: string): boolean {
  if (!url) return false;
  const cleaned = cleanSupabaseUrl(url);
  if (cleaned === "your-supabase-project-url" || (!cleaned.startsWith("http://") && !cleaned.startsWith("https://"))) {
    return false;
  }
  return true;
}

/**
 * [세션 갱신 미들웨어 유틸리티]
 * 
 * - 사용자가 페이지를 이동할 때마다 만료 예정인 세션 토큰을 자동으로 갱신(Refresh)합니다.
 * - 만약 .env.local에 Supabase URL이 아직 입력되지 않았더라도
 *   사이트 전체가 멈추는 에러(Invalid supabaseUrl)를 방지하도록 안전 검사 로직이 포함되어 있습니다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // 🛡️ 안전 검증: URL 또는 Key가 유효하지 않으면 크래시를 방지하고 정상 통과시킵니다.
  if (!isValidUrl(rawUrl) || !supabaseAnonKey || supabaseAnonKey === "your-supabase-anon-key") {
    return supabaseResponse;
  }

  const supabaseUrl = cleanSupabaseUrl(rawUrl!);

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 중요: 사용자의 로그인 세션 유효성을 확인하고 쿠키를 갱신합니다.
    await supabase.auth.getUser();
  } catch (error) {
    console.error("미들웨어 세션 갱신 중 예외 발생:", error);
  }

  return supabaseResponse;
}
