import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase URL 뒤에 붙은 불필요한 경로(/rest/v1 또는 마지막 슬래시)를 자동 정제하는 함수
 */
export function cleanSupabaseUrl(url?: string): string {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

/**
 * Supabase URL이 올바른 HTTP/HTTPS 형식인지 검증하는 도우미 함수
 */
export function isSupabaseConfigured(): boolean {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return false;
  if (rawUrl === "your-supabase-project-url" || anonKey === "your-supabase-anon-key") return false;
  const url = cleanSupabaseUrl(rawUrl);
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * [브라우저용 Supabase 클라이언트]
 * 
 * - React 클라이언트 컴포넌트('use client')에서 사용합니다.
 * - 로그인/로그아웃, 사용자 세션 실시간 구독 등에 활용됩니다.
 * - .env.local에 키가 아직 비어 있더라도 브라우저 화면이 멈추지(Crash) 않도록
 *   안전한 기본값을 적용하는 방어 코드가 포함되어 있습니다.
 */
export function createClient() {
  const isConfigured = isSupabaseConfigured();
  
  // 환경 변수가 올바르게 설정되어 있다면 실제 값을 정제하여 사용하고,
  // 아직 설정 전이라면 임시 가상 URL을 사용하여 브라우저 크래시를 방지합니다.
  const supabaseUrl = isConfigured 
    ? cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!) 
    : "https://placeholder-project.supabase.co";

  const supabaseAnonKey = isConfigured 
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim() 
    : "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
