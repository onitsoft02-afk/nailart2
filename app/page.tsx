"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import AiGenerator from "@/components/AiGenerator";
import SampleGallery from "@/components/SampleGallery";
import CtaSection from "@/components/CtaSection";
import LoginModal from "@/components/LoginModal";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * [딸각 스튜디오 메인 랜딩 페이지]
 * 
 * - Supabase 서버사이드(SSR) 인증과 브라우저 세션을 연동합니다.
 * - 로그인 상태 관리 (`isLoggedIn`, `user`, `isLoginModalOpen`)
 * - 비로그인 상태 시 지정된 7개 요소를 클릭하면 로그인 팝업 모달이 화면 정중앙에 표시됩니다.
 * - 구글/카카오 로그인 후 원래 페이지로 복귀하며, 실시간 세션 감지를 통해 헤더 및 모든 기능이 활성화됩니다.
 */
export default function Home() {
  // 브라우저용 Supabase 클라이언트 생성
  const supabase = createClient();

  // AI 생성 옵션 및 프롬프트 상태
  const [promptText, setPromptText] = useState("");
  const [model, setModel] = useState("schnell");
  const [style, setStyle] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // API 로딩, 생성 결과, 에러 상태
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🔒 사용자 인증 및 로그인 모달 상태
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // [인증 세션 실시간 동기화]
  useEffect(() => {
    // Supabase 키가 아직 설정되지 않은 경우 네트워크 호출을 건너뜁니다.
    if (!isSupabaseConfigured()) {
      return;
    }

    // 1. 현재 접속된 사용자 세션 확인
    const checkCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("인증 세션 확인 중 에러:", err);
      }
    };

    checkCurrentUser();

    // 2. 로그인/로그아웃 등 세션 상태 변화를 실시간으로 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        setIsLoginModalOpen(false); // 로그인 성공 시 모달 자동 닫기
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    // 3. 만약 로그인 실패 에러 파라미터(?error=auth_failed)가 URL에 있다면 알림 표시
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "auth_failed") {
        alert("소셜 로그인 인증에 실패했습니다. 다시 시도해 주세요.");
        // URL에서 에러 파라미터 정리
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 로그인 모달 열기 핸들러
  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  // 로그인 모달 닫기 핸들러
  const handleCloseLogin = () => {
    setIsLoginModalOpen(false);
  };

  // 실제 Supabase 로그아웃 처리 핸들러
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert(`로그아웃 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        alert("정상적으로 로그아웃되었습니다.");
      }
    } catch (err: any) {
      console.error("로그아웃 실패:", err);
      alert("로그아웃 처리 중 문제가 발생했습니다.");
    }
  };

  // 샘플 갤러리 아이템 클릭 시 프롬프트 적용 및 입력창으로 스크롤 이동
  const handleSampleClick = (prompt: string) => {
    setPromptText(prompt);
    // 화면을 상단 프롬프트 입력창으로 부드럽게 스크롤
    window.scrollTo({
      top: 350,
      behavior: "smooth"
    });
  };

  // 하단 CTA '바로 시작하기' 클릭 시 프롬프트 입력창으로 스크롤 이동
  const handleScrollToGenerator = () => {
    window.scrollTo({
      top: 350,
      behavior: "smooth"
    });
  };

  // 이미지 생성 API 호출 핸들러
  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          model,
          style,
          ratio,
          image: uploadedImage // base64 string
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "이미지 생성에 실패했습니다.");
      }

      setGeneratedImage(data.imageUrl);
      
      // 결과 이미지로 부드럽게 스크롤
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. 상단 네비게이션 헤더 (로그인 정보 및 로그아웃 기능 포함) */}
      <Header 
        isLoggedIn={isLoggedIn}
        userEmail={user?.email || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.preferred_username || "카카오 사용자"}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2. Hero 섹션 */}
        <Hero />
        
        {/* 3. 프롬프트 인터페이스 (AiGenerator) */}
        <AiGenerator 
          promptText={promptText} 
          setPromptText={setPromptText} 
          model={model} setModel={setModel}
          style={style} setStyle={setStyle}
          ratio={ratio} setRatio={setRatio}
          uploadedImage={uploadedImage} setUploadedImage={setUploadedImage}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          isLoggedIn={isLoggedIn}
          onOpenLogin={handleOpenLogin}
        />
        
        {/* 4. 생성된 이미지 결과 영역 (AiGenerator 바로 아래) */}
        {(generatedImage || isLoading || errorMsg) && (
          <section id="result-section" className="w-full max-w-4xl mx-auto mb-20 flex flex-col items-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">생성 결과</h3>
            {isLoading && (
              <div className="w-full aspect-square max-w-md bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center border border-gray-200">
                <p className="text-gray-500 font-medium">AI가 이미지를 생성하고 있습니다...</p>
              </div>
            )}
            {errorMsg && (
              <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center">
                {errorMsg}
              </div>
            )}
            {generatedImage && !isLoading && (
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img src={generatedImage} alt="Generated AI" className="w-full h-auto object-contain" />
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  FLUX.1 {model === "schnell" ? "[Schnell]" : "[Dev]"}
                </div>
              </div>
            )}
          </section>
        )}
        
        {/* 5. 갤러리 섹션 (SampleGallery) */}
        <SampleGallery 
          onSampleClick={handleSampleClick} 
          isLoggedIn={isLoggedIn}
          onOpenLogin={handleOpenLogin}
        />
        
        {/* 6. CTA 섹션 */}
        <CtaSection 
          isLoggedIn={isLoggedIn}
          onOpenLogin={handleOpenLogin}
          onStart={handleScrollToGenerator}
        />
      </main>

      {/* 7. 하단 푸터 */}
      <Footer />

      {/* 8. 화면 정중앙 로그인/회원가입 팝업 모달 */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={handleCloseLogin}
      />
    </>
  );
}
