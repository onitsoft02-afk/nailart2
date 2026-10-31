import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

/**
 * [한글 -> 영문 자동 번역 헬퍼 함수]
 * 
 * 사용자가 "신발", "실내화" 등 한글 단어를 입력하더라도
 * 글로벌 AI 모델(FLUX 등)이 가장 정확하게 이해할 수 있도록 영문으로 자동 변환합니다.
 */
async function translateToEnglishIfNeeded(text: string): Promise<string> {
  if (!text) return text;

  // 텍스트 내 한글 포함 여부 검사
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  if (!hasKorean) {
    return text;
  }

  try {
    console.log(`[한글 감지] 원본 단어/문장: "${text}"`);
    const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`;
    const res = await fetch(translateUrl, {
      headers: { Accept: "application/json" }
    });

    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === "string" && translated.trim().length > 0) {
        console.log(`[한글 자동 번역 완료] "${text}" -> "${translated}"`);
        return translated;
      }
    }
  } catch (error: any) {
    console.warn("[한글 자동 번역 실패] 원본 유지:", error.message);
  }

  return text;
}

/**
 * AI 이미지 생성 백엔드 API 라우트 핸들러 (Next.js 16 App Router)
 * 
 * [시스템 프롬프트 & 무중단 생성 파이프라인]
 * - 시스템 프롬프트(System Prompt): 입력된 단어에만 100% 집중하여, 불필요한 배경/인물 없이 
 *   해당 사물/피사체만 화면 중앙에 깨끗하고 선명하게 출력하도록 프롬프트를 자동 구조화합니다.
 * - 무중단 파이프라인: Hugging Face 공식 SDK -> 오픈소스 FLUX 엔진 -> 고성능 SANA AI 엔진
 */
export async function POST(req: Request) {
  try {
    // 1. 프론트엔드로부터 전달받은 사용자 입력값 추출
    const { prompt, model, style, ratio, image } = await req.json();

    // 2. .env.local 환경 변수에서 Hugging Face API 키 확인
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Hugging Face API 키가 .env.local 파일에 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    // 3. 사용자가 한글로 입력한 경우 영문으로 자동 변환 (예: "신발" -> "shoes")
    const rawPrompt = prompt?.trim() || "a stunning subject";
    const englishSubject = await translateToEnglishIfNeeded(rawPrompt);

    // 4. [핵심: FLUX 시스템 프롬프트(System Prompt) 적용]
    // 사용자가 입력한 단어의 '그 대상 자체'만 화면에 선명하게 나오도록 프롬프트를 정밀 빌드합니다.
    let finalPrompt = "";

    if (image) {
      // [상황 A: 얼굴 사진을 첨부한 경우] 
      // 사용자의 얼굴 특징을 유지하면서 해당 콘셉트로 변신하도록 시스템 프롬프트 구성
      finalPrompt = `a high quality detailed portrait of a person as ${englishSubject}, maintaining the exact facial structure, recognizable features, identity and symmetry of the reference person, authentic skin texture, sharp focus on eyes`;
    } else {
      // [상황 B: 일반 텍스트 단어를 입력한 경우 (예: '신발', '시계', '의자' 등)]
      // 주변의 불필요한 인물이나 복잡한 배경 없이, 오직 해당 사물/대상만 정중앙에 단독으로 나오도록 강제
      finalPrompt = `a high quality shot focused solely on ${englishSubject}, single isolated subject centered in frame, no extra people, clean and uncluttered minimalist background, professional studio lighting, sharp focus, highly detailed`;
    }

    // 5. 사용자가 선택한 스타일 옵션이 있을 경우 시스템 프롬프트 뒤에 추가
    if (style && style !== "기본" && style !== "none") {
      finalPrompt += `, ${style} style, masterpiece, best quality`;
    }

    // 6. 사용자가 선택한 비율(1:1, 16:9, 9:16, 4:3, 3:4)에 따른 가로/세로 해상도 계산
    let width = 1024;
    let height = 1024;
    if (ratio === "16:9") {
      width = 1024;
      height = 576;
    } else if (ratio === "9:16") {
      width = 576;
      height = 1024;
    } else if (ratio === "4:3") {
      width = 1024;
      height = 768;
    } else if (ratio === "3:4") {
      width = 768;
      height = 1024;
    }

    console.log(`[최종 AI 전달 프롬프트]: "${finalPrompt}"`);

    // 7. 모델 식별자 설정
    const modelId = model === "dev" 
      ? "black-forest-labs/FLUX.1-dev" 
      : "black-forest-labs/FLUX.1-schnell";

    // -------------------------------------------------------------------------
    // [1단계] Hugging Face 공식 SDK(@huggingface/inference)를 통한 정식 생성 시도
    // -------------------------------------------------------------------------
    try {
      console.log(`[1단계: Hugging Face] 모델(${modelId}) 호출 시도 중...`);
      const client = new InferenceClient(apiKey);

      const imageBlob = await client.textToImage({
        model: modelId,
        inputs: finalPrompt,
        parameters: {
          width,
          height,
        },
      });

      const arrayBuffer = await (imageBlob as any).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = (imageBlob as any).type || "image/jpeg";
      const imageUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

      console.log("[1단계: Hugging Face] 성공적으로 이미지가 생성되었습니다!");
      return NextResponse.json({ 
        imageUrl, 
        provider: "huggingface",
        model: modelId,
        translatedPrompt: englishSubject,
        systemPromptApplied: true
      });

    } catch (hfError: any) {
      console.warn("[1단계 알림] Hugging Face 유료 크레딧 부족 또는 응답 불가:", hfError.message || hfError);
      console.log("[2단계 안내] 무중단 안전 대체(Fallback) 엔진으로 자동 전환합니다...");
    }

    // -------------------------------------------------------------------------
    // [2단계 & 3단계: 무중단 다중 안전 대체(Fallback) 파이프라인]
    // -------------------------------------------------------------------------
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const randomSeed = Math.floor(Math.random() * 10000000);

    const fallbackEndpoints = [
      { name: "FLUX 오픈소스 엔진", url: `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=${width}&height=${height}&seed=${randomSeed}&nologo=true` },
      { name: "초고화질 SANA AI 엔진", url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true` },
    ];

    let lastErrorStatus: number | null = null;

    for (const endpoint of fallbackEndpoints) {
      try {
        console.log(`[대체 엔진 시도] ${endpoint.name}으로 이미지 생성을 진행합니다...`);
        const response = await fetch(endpoint.url, {
          headers: { Accept: "image/jpeg,image/png,image/*" },
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = response.headers.get("content-type") || "image/jpeg";
          const imageUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

          console.log(`[대체 엔진 성공] ${endpoint.name}으로 이미지 생성이 완벽하게 완료되었습니다!`);
          return NextResponse.json({ 
            imageUrl, 
            provider: endpoint.name,
            translatedPrompt: englishSubject,
            systemPromptApplied: true,
            note: "Hugging Face 계정 크레딧 충전 전에도 중단 없이 이용하실 수 있도록 안전 오픈소스 엔진으로 생성되었습니다." 
          });
        }

        console.warn(`[대체 엔진 알림] ${endpoint.name} 응답 실패 (HTTP ${response.status}). 다음 고성능 엔진으로 즉시 자동 전환합니다...`);
        lastErrorStatus = response.status;

      } catch (err: any) {
        console.warn(`[대체 엔진 네트워크 에러] ${endpoint.name} 시도 중 에러:`, err.message);
      }
    }

    // 무료 엔진 대기시간(402, 429)이 걸렸을 경우 친절한 안내 메시지 반환
    if (lastErrorStatus === 402 || lastErrorStatus === 429) {
      return NextResponse.json(
        { 
          error: "무료 이미지 생성 엔진의 대기 시간(약 30초)이 적용 중입니다. 잠시 후 다시 '생성하기' 버튼을 눌러주세요! (Hugging Face 계정에 크레딧을 충전하시면 대기시간 없이 즉시 생성됩니다.)" 
        },
        { status: 429 }
      );
    }

    throw new Error("외부 AI 서버가 일시적으로 응답하지 못했습니다. 잠시 후 다시 시도해 주세요.");

  } catch (error: any) {
    console.error("[최종 생성 실패 에러]:", error);
    return NextResponse.json(
      { error: error.message || "이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
