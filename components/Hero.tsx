export default function Hero() {
  return (
    <section className="w-full py-24 text-center flex flex-col items-center justify-center">
      <div className="relative inline-block mb-6">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
          딸각 스튜디오
        </h1>
        {/* 우측 상단 우측으로 30도 기울어진 "AI" 배지 */}
        <div className="absolute -top-4 -right-8 md:-right-12 bg-emerald-500 text-white text-sm md:text-base font-bold px-3 py-1 rounded-full shadow-lg transform rotate-[30deg]">
          AI
        </div>
      </div>
      <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-medium">
        내 얼굴은 그대로, 원하는 모습으로 변신!
      </p>
    </section>
  );
}
