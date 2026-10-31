"use client";

import { ChangeEvent, useRef } from "react";

interface AiGeneratorProps {
  promptText: string;
  setPromptText: (text: string) => void;
  model: string;
  setModel: (val: string) => void;
  style: string;
  setStyle: (val: string) => void;
  ratio: string;
  setRatio: (val: string) => void;
  uploadedImage: string | null;
  setUploadedImage: (val: string | null) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

/**
 * [AI 이미지 생성 인터페이스 컴포넌트]
 * 
 * - 모델, 스타일, 비율 선택 드롭다운
 * - 프롬프트 입력창 및 첨부 이미지 미리보기
 * - 이미지 업로드 아이콘
 * - 생성하기 버튼
 * 
 * [비로그인 보호 로직]
 * - 비로그인 상태(`isLoggedIn === false`)일 때:
 *   1) 모델/스타일/비율 드롭다운 클릭 시
 *   2) 프롬프트 입력창 클릭/포커스 시
 *   3) 이미지 업로드 버튼 클릭 시
 *   4) 생성하기 버튼 클릭 시
 *   -> 즉시 화면 중앙 로그인 팝업 모달이 표시됩니다.
 */
export default function AiGenerator({ 
  promptText, setPromptText, 
  model, setModel, 
  style, setStyle, 
  ratio, setRatio, 
  uploadedImage, setUploadedImage,
  onGenerate, isLoading,
  isLoggedIn = false,
  onOpenLogin
}: AiGeneratorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 프롬프트 입력창 클릭/포커스 시 비로그인 체크
  const handleInputInteraction = (e: React.MouseEvent | React.FocusEvent) => {
    if (!isLoggedIn) {
      (e.target as HTMLElement).blur(); // 키보드 커서 포커스 해제
      onOpenLogin?.();
    }
  };

  // 드롭다운 클릭 시 비로그인 체크 (이벤트 캡처링)
  const handleDropdownContainerClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      onOpenLogin?.();
    }
  };

  // 생성하기 버튼 클릭 핸들러
  const handleGenerateClick = () => {
    if (!isLoggedIn) {
      onOpenLogin?.();
      return;
    }
    onGenerate();
  };

  return (
    <section className="w-full max-w-4xl mx-auto mb-20">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
        
        {/* 드롭다운 옵션 그룹 (모델, 스타일, 비율) */}
        <div 
          onClickCapture={handleDropdownContainerClick}
          className="flex flex-wrap gap-4 mb-6"
        >
          {/* 1. 모델 드롭다운 */}
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            disabled={!isLoggedIn}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none transition-colors cursor-pointer"
          >
            <option value="schnell">FLUX.1 [Schnell]</option>
            <option value="dev">FLUX.1 [Dev]</option>
          </select>

          {/* 2. 스타일 드롭다운 */}
          <select 
            value={style} 
            onChange={(e) => setStyle(e.target.value)}
            disabled={!isLoggedIn}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none transition-colors cursor-pointer"
          >
            <option value="">스타일 선택 (없음)</option>
            <option value="photorealistic">포토 사실주의</option>
            <option value="cinematic">시네마틱</option>
            <option value="anime">애니메이션</option>
            <option value="3d">3D 렌더링</option>
            <option value="watercolor">수채화</option>
            <option value="cyberpunk">사이버펑크</option>
          </select>

          {/* 3. 비율 드롭다운 */}
          <select 
            value={ratio} 
            onChange={(e) => setRatio(e.target.value)}
            disabled={!isLoggedIn}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 outline-none transition-colors cursor-pointer"
          >
            <option value="1:1">비율 (1:1)</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
          </select>
        </div>

        {/* 첨부된 이미지 미리보기 (프롬프트 입력창 바로 위) */}
        {uploadedImage && (
          <div className="mb-4 relative inline-block">
            <img src={uploadedImage} alt="Uploaded" className="w-32 h-32 object-cover rounded-lg shadow-sm border border-gray-200" />
            <button 
              onClick={() => setUploadedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors cursor-pointer"
              title="삭제"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* 프롬프트 입력창 */}
        <div className="relative mb-4">
          <textarea
            value={promptText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPromptText(e.target.value)}
            onClick={handleInputInteraction}
            onFocus={handleInputInteraction}
            readOnly={!isLoggedIn}
            className={`w-full h-32 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-shadow ${!isLoggedIn ? 'cursor-pointer' : ''}`}
            placeholder="원하는 이미지를 자세히 설명해주세요. (예: 숲 속을 걷는 빨간 모자를 쓴 소녀, 동화 스타일)"
          />
          {/* 이미지 업로드 아이콘 (우측 하단) */}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button 
            onClick={() => {
              if (!isLoggedIn) {
                onOpenLogin?.();
                return;
              }
              fileInputRef.current?.click();
            }}
            className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-emerald-500 transition-colors rounded-full hover:bg-emerald-50 cursor-pointer"
            title="이미지 업로드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>

        {/* 생성하기 버튼 */}
        <button 
          onClick={handleGenerateClick}
          disabled={isLoading || (isLoggedIn && !promptText.trim())}
          className={`w-full bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              이미지 생성 중...
            </>
          ) : (
            "생성하기"
          )}
        </button>
      </div>
    </section>
  );
}
