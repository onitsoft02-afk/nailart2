"use client";

import { useState } from "react";

interface SampleGalleryProps {
  onSampleClick: (prompt: string) => void;
  isLoggedIn?: boolean;
  onOpenLogin?: () => void;
}

type Category = "female" | "male" | "child";

// 로컬 samples 폴더의 실제 이미지 데이터 매핑
const data = {
  female: {
    original: "/samples/woman/original.webp",
    samples: [
      { id: 1, url: "/samples/woman/ex1.webp", prompt: "여성, 화려한 이브닝 드레스, 우아한 분위기, 파티장 배경" },
      { id: 2, url: "/samples/woman/ex2.webp", prompt: "여성, 캐주얼한 스트릿 패션, 햇살 좋은 뉴욕 거리" },
      { id: 3, url: "/samples/woman/ex3.webp", prompt: "여성, 비즈니스 수트, 자신감 넘치는 표정, 오피스 배경" },
      { id: 4, url: "/samples/woman/ex4.webp", prompt: "여성, 수채화 스타일, 신비로운 숲의 요정" },
      { id: 5, url: "/samples/woman/ex5.webp", prompt: "여성, 사이버펑크 2077 스타일, 네온 사인 불빛, 미래 도시" },
      { id: 6, url: "/samples/woman/ex6.webp", prompt: "여성, 애니메이션 스타일, 벚꽃이 흩날리는 배경" },
      { id: 7, url: "/samples/woman/ex7.webp", prompt: "여성, 르네상스 명화 스타일, 고급스러운 유화" },
      { id: 8, url: "/samples/woman/ex8.webp", prompt: "여성, 여름 바캉스 룩, 챙이 넓은 모자, 해변 배경" },
      { id: 9, url: "/samples/woman/ex9.webp", prompt: "여성, 흑백 인물 사진, 클래식하고 깊이 있는 감성" },
    ]
  },
  male: {
    original: "/samples/man/original.webp",
    samples: [
      { id: 1, url: "/samples/man/ex1.webp", prompt: "남성, 세련된 정장 룩, 도시의 야경 배경" },
      { id: 2, url: "/samples/man/ex2.webp", prompt: "남성, 스포티한 운동복, 농구장, 역동적인 포즈" },
      { id: 3, url: "/samples/man/ex3.webp", prompt: "남성, 아웃도어 캠핑룩, 숲속 모닥불 옆" },
      { id: 4, url: "/samples/man/ex4.webp", prompt: "남성, SF 영화 주인공 스타일, 우주선 내부" },
      { id: 5, url: "/samples/man/ex5.webp", prompt: "남성, 판타지 전사, 갑옷 장착, 중세 성" },
      { id: 6, url: "/samples/man/ex6.webp", prompt: "남성, 빈티지 스타일, 1920년대 흑백 필름 느낌" },
      { id: 7, url: "/samples/man/ex7.webp", prompt: "남성, 스케치 펜슬 드로잉 스타일, 예술적 감각" },
      { id: 8, url: "/samples/man/ex8.webp", prompt: "남성, 해적 선장 코스튬, 넓은 바다와 범선" },
      { id: 9, url: "/samples/man/ex9.webp", prompt: "남성, 겨울 코트, 내리는 눈을 맞는 로맨틱한 분위기" },
    ]
  },
  child: {
    original: "/samples/baby/original.webp",
    samples: [
      { id: 1, url: "/samples/baby/ex1.webp", prompt: "아이, 마법사 복장, 지팡이에서 빛이 나는 씬" },
      { id: 2, url: "/samples/baby/ex2.webp", prompt: "아이, 픽사 3D 애니메이션 스타일, 귀엽고 발랄한 표정" },
      { id: 3, url: "/samples/baby/ex3.webp", prompt: "아이, 동화책 일러스트 스타일, 거대한 버섯 숲" },
      { id: 4, url: "/samples/baby/ex4.webp", prompt: "아이, 우주복 착용, 달 표면 위를 걷는 모습" },
      { id: 5, url: "/samples/baby/ex5.webp", prompt: "아이, 슈퍼히어로 망토, 도심을 날아가는 포즈" },
      { id: 6, url: "/samples/baby/ex6.webp", prompt: "아이, 귀여운 동물 잠옷, 포근한 침실 배경" },
      { id: 7, url: "/samples/baby/ex7.webp", prompt: "아이, 클레이 아트 스타일, 아기자기한 색감" },
      { id: 8, url: "/samples/baby/ex8.webp", prompt: "아이, 왕자/공주 대관식 의상, 화려한 성 내부" },
      { id: 9, url: "/samples/baby/ex9.webp", prompt: "아이, 장난감 자동차를 타고 경주하는 역동적인 모습" },
    ]
  }
};

/**
 * [SAMPLE GALLERY 컴포넌트]
 * 
 * - 여성, 남성, 아이 카테고리 탭 선택 지원
 * - 원본 사진 및 변환된 3x3 그리드 결과물 전시
 * - 비로그인 상태(`isLoggedIn === false`)에서 3x3 그리드 이미지 클릭 시 로그인 모달 팝업
 */
export default function SampleGallery({ 
  onSampleClick, 
  isLoggedIn = false, 
  onOpenLogin 
}: SampleGalleryProps) {
  const [activeTab, setActiveTab] = useState<Category>("female");
  
  const currentData = data[activeTab];

  // 3x3 그리드 아이템 클릭 핸들러
  const handleItemClick = (prompt: string) => {
    if (!isLoggedIn) {
      onOpenLogin?.();
      return;
    }
    onSampleClick(prompt);
  };

  return (
    <section className="w-full py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 섹션 타이틀 및 부제 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            SAMPLE GALLERY
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            프리미엄 AI 모델이 만든 놀라운 변화를 확인해보세요.
          </p>
        </div>

        {/* 여성, 남성, 아이 카테고리 선택 탭 */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab("female")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "female"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>여성</span>
            </button>
            <button
              onClick={() => setActiveTab("male")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "male"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>남성</span>
            </button>
            <button
              onClick={() => setActiveTab("child")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "child"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>아이</span>
            </button>
          </div>
        </div>

        {/* 원본 사진 및 3x3 그리드 결과 이미지 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* 1열: 원본 기준 사진 (Original) */}
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-3">
              원본 사진
            </span>
            <div className="w-full aspect-square relative rounded-xl overflow-hidden shadow-md">
              <img
                src={currentData.original}
                alt="원본 사진"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-3 text-xs text-gray-400 text-center font-medium">
              기준 얼굴 이미지
            </p>
          </div>

          {/* 2~4열: 3x3 변환 결과 그리드 (총 9장) */}
          <div className="md:col-span-3 grid grid-cols-3 gap-3 sm:gap-4">
            {currentData.samples.map((sample) => (
              <div
                key={sample.id}
                onClick={() => handleItemClick(sample.prompt)}
                className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
              >
                {/* 갤러리 이미지 */}
                <img
                  src={sample.url}
                  alt={`변환 샘플 ${sample.id}`}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />

                {/* 마우스 호버 시 오버레이 힌트 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center p-4">
                  <p className="text-white text-xs sm:text-sm text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md font-medium">
                    {isLoggedIn ? "클릭하여 스타일 적용하기" : "로그인 후 적용하기"}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
