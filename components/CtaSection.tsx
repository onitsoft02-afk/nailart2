"use client";

interface CtaSectionProps {
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
  onStart?: () => void;
}

/**
 * [하단 CTA (Call To Action) 섹션]
 * 
 * - 바로 시작하기 버튼
 * - 비로그인 상태(`isLoggedIn === false`)에서 클릭 시 로그인 팝업 모달이 뜹니다.
 * - 로그인 상태일 경우 상단 프롬프트 입력 섹션으로 부드럽게 스크롤 이동합니다.
 */
export default function CtaSection({ 
  isLoggedIn = false, 
  onOpenLogin,
  onStart
}: CtaSectionProps) {

  const handleClick = () => {
    if (!isLoggedIn) {
      onOpenLogin?.();
    } else {
      onStart?.();
    }
  };

  return (
    <section className="w-full py-20 mt-10">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          지금 바로 시작해보세요
        </h2>
        <p className="text-gray-300 mb-10 text-lg md:text-xl font-medium">
          당신의 상상력을 현실로 만들어줄 단 하나의 서비스, 딸각 스튜디오.
        </p>
        <button 
          onClick={handleClick}
          className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-xl text-xl font-bold transition-transform hover:scale-105 shadow-lg cursor-pointer"
        >
          바로 시작하기
        </button>
      </div>
    </section>
  );
}
