"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/client";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (provider: "google" | "kakao") => void;
}

/**
 * [로그인/회원가입 팝업 모달 컴포넌트]
 * 
 * - 현재 화면 가운데에 팝업되는 모달 창입니다.
 * - 사용자가 제공해주신 시안 디자인을 그대로 반영하여,
 *   화면 중앙 정렬 텍스트와 구글/카카오 소셜 로그인 버튼을 제공합니다.
 * - "구글로 계속하기", "카카오로 계속하기" 문구는 로고 유무와 상관없이
 *   버튼 너비 기준 정확하게 정중앙에 위치하도록 스타일링되었습니다.
 * - Supabase OAuth 기능을 연동하여 실제 구글/카카오 로그인으로 연결되며,
 *   로그인 성공 시 사용자가 보고 있던 원래 페이지(next)로 복귀합니다.
 */
export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  // 브라우저용 Supabase 클라이언트 초기화
  const supabase = createClient();

  // 로그인 진행 중(리다이렉트 대기) 상태 관리
  const [loadingProvider, setLoadingProvider] = useState<"google" | "kakao" | null>(null);

  // ESC 키를 누르면 모달 창이 닫히도록 이벤트 리스너 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // 모달이 열려 있을 때 배경 스크롤 방지
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // 소셜 로그인 실행 함수 (구글 또는 카카오)
  const handleSocialLogin = async (provider: "google" | "kakao") => {
    // 🛡️ 사전 검증: Supabase 환경 변수가 설정되어 있는지 확인
    if (!isSupabaseConfigured()) {
      alert("⚠️ Supabase 프로젝트 연동 설정이 필요합니다.\n\n프로젝트 루트의 [.env.local] 파일에\nNEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 입력해 주세요!");
      return;
    }

    try {
      setLoadingProvider(provider);
      onLogin?.(provider);

      // 1. 현재 사용자가 머물고 있는 URL 경로(패스 및 쿼리스트링)를 추출합니다.
      const currentPath = window.location.pathname + window.location.search;

      // 2. 로그인 완료 후 복귀할 콜백 URL을 생성합니다. (?next=현재페이지)
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`;

      // 3. Supabase 소셜 로그인(OAuth) 요청
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: provider === "google" ? {
            access_type: "offline",
            prompt: "consent",
          } : undefined,
        },
      });

      if (error) {
        alert(`로그인 요청 중 오류가 발생했습니다: ${error.message}`);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      console.error("소셜 로그인 에러:", err);
      alert(`로그인 처리 중 문제가 발생했습니다: ${err.message || err}`);
      setLoadingProvider(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 1. 어두운 반투명 배경 (클릭 시 닫힘) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. 로그인 모달 본체 (화면 정중앙 배치) */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full p-8 sm:p-10 z-10 text-center transform transition-all">
        
        {/* 우측 상단 닫기 (X) 버튼 */}
        <button
          onClick={onClose}
          disabled={loadingProvider !== null}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50 cursor-pointer"
          aria-label="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 모달 헤더: 제목 및 설명 (가운데 정렬) */}
        <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 mb-3 tracking-tight">
          로그인/회원가입
        </h2>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8 break-keep">
          딸각 스튜디오에서 나만의 특별한 이미지를 만들어보세요
        </p>

        {/* 모달 바디: 소셜 로그인 버튼 목록 */}
        <div className="space-y-3.5 w-full">
          
          {/* [버튼 1] 회색 배경 - 구글로 계속하기 */}
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={loadingProvider !== null}
            className="relative w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* 공식 구글 'G' 4색 로고 (좌측 고정 배치) */}
            <span className="absolute left-5 flex items-center justify-center">
              {loadingProvider === "google" ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.41 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.19 0 10.03 0 12s.46 3.81 1.26 5.41l4.02-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.59 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
              )}
            </span>
            {/* 로고와 무관하게 버튼 너비 기준 정확한 정중앙 텍스트 */}
            <span className="text-center w-full">
              {loadingProvider === "google" ? "구글 로그인으로 이동 중..." : "구글로 계속하기"}
            </span>
          </button>

          {/* [버튼 2] 노란색 배경 - 카카오로 계속하기 */}
          <button
            onClick={() => handleSocialLogin("kakao")}
            disabled={loadingProvider !== null}
            className="relative w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-semibold rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* 공식 카카오 말풍선 심볼 로고 (좌측 고정 배치) */}
            <span className="absolute left-5 flex items-center justify-center">
              {loadingProvider === "kakao" ? (
                <div className="w-5 h-5 border-2 border-[#191919]/40 border-t-[#191919] rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.828 1.83 5.312 4.625 6.728-.2.748-.734 2.703-.843 3.125-.133.515.195.508.41.367.168-.11 2.684-1.82 3.75-2.555.672.094 1.359.14 2.058.14 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                </svg>
              )}
            </span>
            {/* 로고와 무관하게 버튼 너비 기준 정확한 정중앙 텍스트 */}
            <span className="text-center w-full">
              {loadingProvider === "kakao" ? "카카오 로그인으로 이동 중..." : "카카오로 계속하기"}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
