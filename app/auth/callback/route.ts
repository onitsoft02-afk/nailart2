import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * [Supabase Auth 콜백 라우트 핸들러]
 * 
 * - 사용자가 구글 또는 카카오 로그인을 승인한 후,
 *   Supabase가 전달해 주는 일회용 인증 코드(code)를 받아 처리하는 서버 엔드포인트입니다.
 * - 인증 코드를 안전하게 실제 세션(JWT 쿠키)으로 교환(exchange)합니다.
 * - 세션 저장이 완료되면 사용자가 원래 머물던 페이지(next)로 안전하게 되돌려보냅니다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // 1. URL 쿼리 파라미터에서 인증 코드(code)와 복귀할 주소(next)를 추출합니다.
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  // 🔒 보안 강화: 오픈 리다이렉트(Open Redirect) 취약점 방지
  // next 파라미터가 '/'로 시작하지 않는 외부 URL인 경우 기본 경로('/')로 강제 설정합니다.
  if (!next.startsWith("/")) {
    next = "/";
  }

  // 2. 인증 코드(code)가 존재하는 경우 Supabase 서버 클라이언트를 통해 세션으로 교환합니다.
  if (code) {
    const supabase = await createClient();
    
    // PKCE 플로우: 코드를 세션 쿠키로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 리버스 프록시 및 로드 밸런서 환경(Vercel 등) 감지
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // 로컬 개발 환경(localhost:3000)일 때는 현재 origin을 그대로 사용합니다.
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // 배포 환경에서 로드 밸런서가 있는 경우 원래 도메인 호스트로 리다이렉트합니다.
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error("Supabase 세션 교환 오류:", error.message);
    }
  }

  // 3. 코드 교환 실패 또는 코드가 없는 경우 에러 파라미터를 붙여 원래 페이지로 복귀합니다.
  return NextResponse.redirect(`${origin}${next}?error=auth_failed`);
}
