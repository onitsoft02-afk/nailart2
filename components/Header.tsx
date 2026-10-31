"use client";

import Link from "next/link";

interface HeaderProps {
  isLoggedIn?: boolean;
  userEmail?: string | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

/**
 * [상단 네비게이션 헤더 컴포넌트]
 * 
 * - 왼쪽: 딸각 스튜디오 로고
 * - 가운데: 메뉴 (이미지 생성, 내 갤러리, 요금제, 사용내역)
 *   - 비로그인 상태에서 '내 갤러리' 클릭 시 로그인 팝업 모달이 뜹니다.
 * - 오른쪽: 로그인 상태에 따른 버튼
 *   - 비로그인 상태: '시작하기' 버튼 (클릭 시 로그인 모달 표시)
 *   - 로그인 상태: 사용자 이메일 뱃지 및 '로그아웃' 버튼 표시
 */
export default function Header({ 
  isLoggedIn = false, 
  userEmail = null,
  onOpenLogin, 
  onLogout 
}: HeaderProps) {
  
  // '내 갤러리' 메뉴 클릭 핸들러
  const handleMyGalleryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onOpenLogin?.();
    } else {
      alert("로그인된 사용자의 내 갤러리 페이지로 이동합니다. (준비 중)");
    }
  };

  // '시작하기 / 로그아웃' 버튼 클릭 핸들러
  const handleAuthButtonClick = () => {
    if (!isLoggedIn) {
      onOpenLogin?.();
    } else {
      if (confirm("정말 로그아웃 하시겠습니까?")) {
        onLogout?.();
      }
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 왼쪽: 서비스 로고 */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight">
            딸각 스튜디오
          </Link>
        </div>

        {/* 가운데: 네비게이션 메뉴 */}
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            이미지 생성
          </Link>
          <button 
            onClick={handleMyGalleryClick}
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors cursor-pointer"
          >
            내 갤러리
          </button>
          <Link href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            요금제
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            사용내역
          </Link>
        </nav>

        {/* 오른쪽: 로그인/로그아웃 액션 버튼 */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {/* 로그인된 사용자 이메일 표시 */}
              <span className="hidden sm:inline-flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                {userEmail || "로그인 됨"}
              </span>

              {/* 로그아웃 버튼 */}
              <button 
                onClick={handleAuthButtonClick}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-xs"
              >
                로그아웃
              </button>
            </div>
          ) : (
            /* 비로그인 상태: 시작하기 버튼 */
            <button 
              onClick={handleAuthButtonClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-sm cursor-pointer"
            >
              시작하기
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
