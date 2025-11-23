import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyBmag2xIc9sLH-IWHrzY67uD6B3hqYwl0w');

const jobDescriptions: {[key: string]: string} = {
  MKT: '마케팅/그로스',
  PM: '서비스 기획/PM',
  DATA: '데이터 분석',
  DEV: '개발/엔지니어',
  DESIGN: 'UX/UI 디자인',
  PEOPLE: 'HR/조직문화'
};

export async function POST(request: Request) {
  try {
    const { topJob, topJobName, scores } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
당신은 경험이 풍부한 커리어 코치입니다.
취업 준비생이 팀 프로젝트 시뮬레이션을 완료했고, 다음과 같은 결과가 나왔습니다:

**가장 적합한 직무**: ${topJobName}

**각 직무별 점수**:
- 마케팅/그로스: ${scores.MKT}점
- 서비스 기획/PM: ${scores.PM}점
- 데이터 분석: ${scores.DATA}점
- 개발/엔지니어: ${scores.DEV}점
- UX/UI 디자인: ${scores.DESIGN}점
- HR/조직문화: ${scores.PEOPLE}점

이 학생에게 따뜻하고 격려하는 톤으로 다음 내용을 포함한 3-4문단의 메시지를 작성해주세요:

1. 시뮬레이션에서 보여준 강점과 특징 칭찬하기
2. ${topJobName} 직무가 잘 맞는 이유 구체적으로 설명하기
3. 다른 직무 점수들을 고려한 종합적인 성향 분석
4. 앞으로의 성장 방향과 응원의 메시지

**톤**: 친근하고 따뜻하며, 전문적이지만 격식을 차리지 않은 선배의 조언
**길이**: 200-300자 정도
**형식**: 반말 사용 (예: ~해, ~야, ~어)
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'AI 분석 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
