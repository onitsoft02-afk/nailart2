import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * [Next.js 미들웨어]
 * 
 * - 모든 요청마다 Supabase 인증 세션을 갱신하여 최신 로그인 상태를 유지합니다.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음으로 시작하는 경로를 제외한 모든 요청에 미들웨어를 적용합니다:
     * - _next/static (정적 자바스크립트, CSS 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - 정적 미디어 확장자 (svg, png, jpg, jpeg, gif, webp 등)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
