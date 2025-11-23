'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Users, GraduationCap, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: number;
  speaker: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  phase?: string;
}

interface Option {
  text: string;
  scores: {
    [key: string]: number;
  };
}

interface Scenario {
  id: number;
  phase: string;
  phaseName: string;
  speaker: string;
  text: string;
  options: Option[];
}

type Department = 'Business' | 'Economics' | 'Statistics';

// 학과별 시나리오 DB (Scenario_Script.md 기반)
const SCENARIO_DB: Record<Department, Scenario[]> = {
  Business: [ // 경영학과 - 친환경 생활용품 신규 브랜드 런칭
    // Phase 1 - 팀플 협업 (MGT-P1)
    { id: 0, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '시스템', text: "첫 모임에서 분위기가 어색하다. 교수는 '창의성, 실현 가능성, 발표 완성도'를 강조했다.\n\n이 상황에서 당신은 무엇을 먼저 제안하겠는가? (1/15)", options: [
      { text: "요구사항부터 정리하고 해야 할 일 리스트를 만들어요.", scores: { PM: 2, HR: 1 } },
      { text: "시장 트렌드부터 같이 보고 재밌는 브랜드 아이디어를 던져볼까요?", scores: { MKT: 2, DESIGN: 1 } },
      { text: "각자 강점이 뭔지 이야기하고 역할부터 정해보는 게 어떨까요?", scores: { HR: 2, PM: 1 } },
      { text: "일단 모두 자기소개만 하고, 내일까지 각자 아이디어 하나씩 가져오는 걸로 할까요?", scores: { PM: 1, MKT: 1 } }
    ]},
    { id: 1, phase: 'P1. 팀플 킥오프', phaseName: 'Phase 1. 팀플 킥오프', speaker: '열정맨', text: "우리 무조건 A+ 받아요! 매일 밤 10시에 회의하죠! 🔥 (2/15)", options: [
      { text: "매일은 비효율적이고, 주 2회 고정으로 하죠. (체계적)", scores: { PM: 2 } },
      { text: "회의 횟수보단 각자 맡은 조사 퀄리티가 중요해요. (성과)", scores: { FIN: 2 } },
      { text: "카톡으로 편하게 소통하고 유동적으로 모여요. (유연)", scores: { HR: 2 } },
      { text: "회의실보단 핫플 카페 투어하면서 회의해요! (현장)", scores: { MKT: 2 } }
    ]},
    { id: 2, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원B', text: "협업 도구를 정해야 합니다.\n\n팀원 모두가 쓰기 편한 방법은? (3/15)", options: [
      { text: "노션으로 일정, 회의록, 자료를 한 곳에 모아요.", scores: { PM: 2, DATA: 1 } },
      { text: "구글 드라이브로 파일 공유만 하고, 카톡으로 소통해요.", scores: { HR: 2, PM: 1 } },
      { text: "각자 편한 대로 작업하고 정기 회의 때 취합하죠.", scores: { DESIGN: 1, MKT: 1 } },
      { text: "Figma나 Miro 같은 시각화 툴로 아이디어 보드를 만들어요.", scores: { DESIGN: 2, MKT: 1 } }
    ]},
    { id: 3, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '조장', text: "일정 계획을 세워야 합니다.\n\n시간 관리 방식으로 무엇이 적절할까요? (4/15)", options: [
      { text: "전체 타임라인을 먼저 정하고, 마일스톤별로 체크포인트를 둬요.", scores: { PM: 2, DATA: 1 } },
      { text: "우선순위가 높은 작업부터 하고, 유동적으로 조정해요.", scores: { MKT: 2, HR: 1 } },
      { text: "각자 작업 기한을 정하고, 주 1회 정기 회의로 조율해요.", scores: { HR: 2, PM: 1 } },
      { text: "일단 빠르게 시작하고, 중간 피드백 받으며 수정해요.", scores: { DESIGN: 2, MKT: 1 } }
    ]},
    { id: 4, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원C', text: "팀원 A는 열정적이지만, B는 소극적입니다.\n\n이 차이를 어떻게 조율하시겠습니까? (5/15)", options: [
      { text: "각자의 강점과 역할을 명확히 나누고, B에게 맞는 업무를 배정해요.", scores: { HR: 2, PM: 1 } },
      { text: "A에게 리더십을 맡기고, B는 서포트 역할로 참여하게 해요.", scores: { PM: 2, HR: 1 } },
      { text: "팀 목표를 다시 공유하고, B의 의견을 적극적으로 물어봐요.", scores: { HR: 2, MKT: 1 } },
      { text: "일단 A 중심으로 진행하고, B는 자연스럽게 따라오게 둬요.", scores: { MKT: 1, DESIGN: 1 } }
    ]},
    // Phase 2
    { id: 5, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "시장 분석을 위해 어떤 데이터를 활용할까요?\n\n당신의 접근 방식은? (6/15)", options: [
      { text: "통계청 소비 트렌드 데이터를 분석해 시장 규모를 추정해요.", scores: { DATA: 2, PM: 1 } },
      { text: "SNS 해시태그와 리뷰를 크롤링해 소비자 니즈를 파악해요.", scores: { MKT: 2, DATA: 1 } },
      { text: "경쟁사 제품을 직접 체험하고 차별화 포인트를 찾아요.", scores: { MKT: 2, DESIGN: 1 } },
      { text: "브랜드 스토리와 감성적 메시지에 집중해요.", scores: { DESIGN: 2, MKT: 1 } }
    ]},
    { id: 6, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "브랜드 콘셉트를 정해야 합니다.\n\n어떤 방향이 효과적일까요? (7/15)", options: [
      { text: "친환경 가치를 강조하는 감성적인 브랜드 메시지를 만들어요.", scores: { MKT: 2, DESIGN: 1 } },
      { text: "제품 성능과 실용성 데이터를 중심으로 신뢰감을 구축해요.", scores: { DATA: 2, PM: 1 } },
      { text: "경쟁사 대비 가격 경쟁력을 강조하는 전략을 써요.", scores: { FIN: 2, MKT: 1 } },
      { text: "타겟 고객의 라이프스타일과 공감할 수 있는 스토리를 만들어요.", scores: { MKT: 2, HR: 1 } }
    ]},
    { id: 7, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "마케팅 채널을 선택해야 합니다.\n\n어느 채널에 집중할까요? (8/15)", options: [
      { text: "인스타그램 광고와 인플루언서 협업으로 바이럴 마케팅을 진행해요.", scores: { MKT: 2, DESIGN: 1 } },
      { text: "네이버 블로그와 검색 최적화(SEO)로 유입을 늘려요.", scores: { DATA: 2, MKT: 1 } },
      { text: "오프라인 팝업스토어로 체험 기회를 제공해요.", scores: { DESIGN: 2, HR: 1 } },
      { text: "CRM 시스템으로 기존 고객 재구매를 유도해요.", scores: { PM: 2, DATA: 1 } }
    ]},
    { id: 8, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "예산을 배분해야 합니다.\n\n어디에 가장 많이 투자할까요? (9/15)", options: [
      { text: "제품 개발과 품질 향상에 집중 투자해요.", scores: { PM: 2, FIN: 1 } },
      { text: "마케팅과 브랜드 홍보에 집중 투자해요.", scores: { MKT: 2, DESIGN: 1 } },
      { text: "고객 데이터 분석 시스템 구축에 투자해요.", scores: { DATA: 2, TECH: 1 } },
      { text: "균형 있게 배분하되 유연하게 조정 가능하도록 설계해요.", scores: { FIN: 2, PM: 1 } }
    ]},
    { id: 9, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "발표 자료를 준비합니다.\n\n당신의 우선순위는? (10/15)", options: [
      { text: "논리적 구조와 스토리라인부터 완성해요.", scores: { PM: 2, DATA: 1 } },
      { text: "시각적 디자인과 레이아웃에 집중해요.", scores: { DESIGN: 2, MKT: 1 } },
      { text: "핵심 메시지를 명확히 하고 간결하게 전달해요.", scores: { MKT: 2, PM: 1 } },
      { text: "데이터와 그래프로 객관성을 강조해요.", scores: { DATA: 2, FIN: 1 } }
    ]},
    // Phase 3
    { id: 10, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원A', text: "팀원 한 명이 갑자기 불참하겠다고 하네요.\n\n이 상황을 어떻게 해결할까요? (11/15)", options: [
      { text: "해당 팀원과 따로 이야기하며 이유를 듣고 조율해요.", scores: { HR: 2, PM: 1 } },
      { text: "작업량을 재분배하고 남은 팀원끼리 진행해요.", scores: { PM: 2, HR: 1 } },
      { text: "교수님께 상황을 보고하고 지침을 받아요.", scores: { FIN: 2, PM: 1 } },
      { text: "피해를 최소화하려고 빠르게 대체 방안을 찾아요.", scores: { MKT: 1, DATA: 1 } }
    ]},
    { id: 11, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원B', text: "필요한 데이터를 찾을 수 없습니다.\n\n대안은 무엇일까요? (12/15)", options: [
      { text: "대체 데이터를 찾거나 간접적인 방법으로 추정해요.", scores: { DATA: 2, PM: 1 } },
      { text: "설문조사를 직접 진행해 필요한 데이터를 모아요.", scores: { DATA: 2, MKT: 1 } },
      { text: "데이터 없이도 진행 가능하도록 분석 방향을 조정해요.", scores: { PM: 2, MKT: 1 } },
      { text: "교수님이나 전문가에게 도움을 요청해요.", scores: { HR: 2, PM: 1 } }
    ]},
    { id: 12, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원C', text: "팀원들 간 의견이 충돌합니다.\n\n어떻게 조율할까요? (13/15)", options: [
      { text: "각 의견의 근거를 들어보고 논리적으로 판단해요.", scores: { PM: 2, DATA: 1 } },
      { text: "투표나 다수결로 결정하고 빠르게 진행해요.", scores: { FIN: 2, PM: 1 } },
      { text: "모두의 의견을 종합한 절충안을 찾아요.", scores: { HR: 2, PM: 1 } },
      { text: "시간이 없으니 리더가 결정하고 따라가요.", scores: { MKT: 1, HR: 1 } }
    ]},
    { id: 13, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '교수님', text: "발표 직전, 내용 수정을 요청하셨습니다.\n\n어떻게 대응할까요? (14/15)", options: [
      { text: "지적사항을 최대한 빠르게 반영해 수정해요.", scores: { PM: 2, HR: 1 } },
      { text: "핵심만 간결하게 수정하고 나머지는 그대로 진행해요.", scores: { MKT: 2, PM: 1 } },
      { text: "수정이 어려운 이유를 설명하고 현재 방향을 설득해요.", scores: { HR: 2, MKT: 1 } },
      { text: "데이터와 근거를 보강해 신뢰성을 높여요.", scores: { DATA: 2, FIN: 1 } }
    ]},
    { id: 14, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '조장', text: "프로젝트가 끝났습니다.\n\n가장 의미 있었던 것은? (15/15)", options: [
      { text: "완성도 높은 결과물을 만들어낸 것이 뿌듯해요.", scores: { PM: 2, DESIGN: 1 } },
      { text: "팀원들과 협력하며 성장한 경험이 가장 소중해요.", scores: { HR: 2, MKT: 1 } },
      { text: "실무적인 기획 능력을 배운 것이 큰 수확이에요.", scores: { MKT: 2, DATA: 1 } },
      { text: "데이터 분석과 논리적 사고를 익힌 게 유익했어요.", scores: { DATA: 2, PM: 1 } }
    ]}
  ],
  Economics: [ // 경제학과
    { id: 0, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '조장', text: "첫 모임에서 분석 범위를 정해야 합니다.\n\n어디에 집중할까요? (1/15)", options: [
      { text: "기준금리, 물가, 환율 같은 거시변수와 소비의 관계를 분석해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "소비심리와 소비 패턴 변화를 정성적으로 분석해요.", scores: { MKT: 2, HR: 1 } },
      { text: "금리 인상이 청년층 가계 예산에 미치는 영향을 분석해요.", scores: { FIN: 2, DATA: 1 } },
      { text: "다양한 관점을 균형 있게 다루며 종합적으로 접근해요.", scores: { PM: 2, HR: 1 } }
    ]},
    { id: 1, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원A', text: "데이터를 어떻게 수집할까요?\n\n당신의 접근 방식은? (2/15)", options: [
      { text: "한국은행 ECOS와 통계청 데이터를 활용해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "설문조사로 직접 청년의 소비 패턴을 조사해요.", scores: { MKT: 2, DATA: 1 } },
      { text: "기존 연구 논문과 보고서를 분석해 인사이트를 얻어요.", scores: { PM: 2, FIN: 1 } },
      { text: "다양한 방법을 조합해 종합적인 데이터를 모아요.", scores: { HR: 2, PM: 1 } }
    ]},
    { id: 2, phase: 'P1. 팀플 킥오프', phaseName: 'Phase 1. 팀플 킥오프', speaker: '조장', text: "데이터 공유는 뭘로 할까요? (3/15)", options: [
      { text: "통계청, ECOS 데이터 공유는 엑셀로 하죠. (실무)", scores: { FIN: 1 } },
      { text: "논문 스크랩이랑 요약은 노션에 정리하죠. (정리)", scores: { PM: 2 } },
      { text: "R이나 Stata 코드 공유는 깃허브로 하시죠. (분석)", scores: { DATA: 2 } },
      { text: "카톡으로 기사 링크랑 아이디어 수시로 공유해요. (속도)", scores: { MKT: 1 } }
    ]},
    { id: 3, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '조장', text: "일정을 어떻게 관리할까요?\n\n효율적인 방법은? (4/15)", options: [
      { text: "전체 타임라인을 세우고 주간 마일스톤을 설정해요.", scores: { PM: 2, DATA: 1 } },
      { text: "유연하게 진행하며 필요에 따라 일정을 조정해요.", scores: { HR: 2, MKT: 1 } },
      { text: "각자 맡은 부분의 마감일을 정하고 주 1회 회의로 조율해요.", scores: { FIN: 2, PM: 1 } },
      { text: "일단 빠르게 시작하고 피드백을 받아가며 수정해요.", scores: { DATA: 1, MKT: 1 } }
    ]},
    { id: 4, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원C', text: "팀원 간 역할이 겨칩니다.\n\n어떻게 조율할까요? (5/15)", options: [
      { text: "각자의 강점을 파악해 역할을 명확히 나눠요.", scores: { HR: 2, PM: 1 } },
      { text: "공평하게 분담하고 주기적으로 진도를 확인해요.", scores: { FIN: 2, PM: 1 } },
      { text: "유연하게 협업하며 필요할 때 서로 도와요.", scores: { HR: 2, MKT: 1 } },
      { text: "작업 리스트를 만들고 체계적으로 관리해요.", scores: { PM: 2, DATA: 1 } }
    ]},
    { id: 5, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "어떤 이론적 프레임워크를 사용할까요?\n\n분석의 기반은? (6/15)", options: [
      { text: "거시경제학 모형(IS-LM, AD-AS)을 활용해요.", scores: { FIN: 2, DATA: 1 } },
      { text: "소비자 선택 이론과 행동경제학적 접근을 써요.", scores: { MKT: 2, HR: 1 } },
      { text: "시계열 분석과 회귀모형으로 실증분석해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "다양한 관점을 통합해 종합적으로 접근해요.", scores: { PM: 2, HR: 1 } }
    ]},
    { id: 6, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "분석 방법을 선택해야 합니다.\n\n어떻게 접근할까요? (7/15)", options: [
      { text: "회귀분석으로 변수 간 관계를 정량화해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "설문조사로 소비자의 심리와 행동을 파악해요.", scores: { MKT: 2, HR: 1 } },
      { text: "사례 연구로 특정 그룹의 소비 패턴을 심층 분석해요.", scores: { PM: 2, MKT: 1 } },
      { text: "이론적 모델을 구축하고 수식으로 설명해요.", scores: { FIN: 2, DATA: 1 } }
    ]},
    { id: 7, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "데이터를 어떻게 해석할까요?\n\n결과를 풀어내는 방법은? (8/15)", options: [
      { text: "통계적 유의성과 계수의 크기를 중심으로 해석해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "경제학 이론과 연결해 인과관계를 설명해요.", scores: { FIN: 2, PM: 1 } },
      { text: "시각화 도구로 트렌드와 패턴을 직관적으로 보여줘요.", scores: { DESIGN: 2, DATA: 1 } },
      { text: "실제 사례와 연결해 실용적인 인사이트를 제공해요.", scores: { MKT: 2, PM: 1 } }
    ]},
    { id: 8, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "결론을 어떻게 도출할까요?\n\n분석 결과를 바탕으로? (9/15)", options: [
      { text: "데이터가 보여주는 명확한 패턴을 제시해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "정책적 시사점과 해결 방안을 제안해요.", scores: { FIN: 2, PM: 1 } },
      { text: "실용적인 제언과 향후 연구 방향을 제시해요.", scores: { PM: 2, HR: 1 } },
      { text: "한계점을 인정하고 종합적인 관점을 제시해요.", scores: { HR: 2, MKT: 1 } }
    ]},
    { id: 9, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "발표 자료를 준비합니다.\n\n무엇에 집중할까요? (10/15)", options: [
      { text: "논리적 흐름과 스토리라인을 명확히 해요.", scores: { PM: 2, FIN: 1 } },
      { text: "데이터와 그래프로 객관성을 강조해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "시각적 디자인과 가독성에 신경 써요.", scores: { DESIGN: 2, MKT: 1 } },
      { text: "핵심 메시지를 간결하고 명확하게 전달해요.", scores: { MKT: 2, PM: 1 } }
    ]},
    { id: 10, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원A', text: "팀원 한 명이 참여하지 못하게 되었습니다.\n\n어떻게 대처할까요? (11/15)", options: [
      { text: "해당 팀원과 따로 이야기하며 이유를 듣고 조율해요.", scores: { HR: 2, PM: 1 } },
      { text: "작업량을 재분배하고 남은 팀원끼리 진행해요.", scores: { PM: 2, HR: 1 } },
      { text: "교수님께 상황을 보고하고 지침을 받아요.", scores: { FIN: 2, PM: 1 } },
      { text: "피해를 최소화하려고 빠르게 대체 방안을 찾아요.", scores: { MKT: 1, DATA: 1 } }
    ]},
    { id: 11, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원B', text: "분석 결과가 예상과 다릅니다.\n\n어떻게 대응할까요? (12/15)", options: [
      { text: "데이터를 재검토하고 분석 방법을 수정해요.", scores: { DATA: 2, PM: 1 } },
      { text: "예상과 다른 결과도 의미 있는 발견으로 해석해요.", scores: { PM: 2, MKT: 1 } },
      { text: "이론적 배경을 다시 살펴보고 논리를 보완해요.", scores: { FIN: 2, DATA: 1 } },
      { text: "팀원들과 논의하며 새로운 관점을 찾아봐요.", scores: { HR: 2, PM: 1 } }
    ]},
    { id: 12, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원C', text: "다른 팀과 주제가 겹칩니다.\n\n어떻게 차별화할까요? (13/15)", options: [
      { text: "분석 방법론을 더 정교하게 개선해 차별화해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "우리만의 독특한 관점과 인사이트를 강조해요.", scores: { MKT: 2, PM: 1 } },
      { text: "두 팀이 협력해 비교 분석하는 방식을 제안해요.", scores: { HR: 2, PM: 1 } },
      { text: "시각화와 발표 방식을 창의적으로 구성해요.", scores: { DESIGN: 2, MKT: 1 } }
    ]},
    { id: 13, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '교수님', text: "분석의 한계와 신뢰성에 대한 질문을 받았습니다.\n\n어떻게 답변할까요? (14/15)", options: [
      { text: "한계점을 솔직히 인정하고 향후 연구 과제로 제시해요.", scores: { DATA: 2, PM: 1 } },
      { text: "이론적 근거를 들어 분석의 타당성을 설명해요.", scores: { FIN: 2, PM: 1 } },
      { text: "지적에 감사하며 보완 계획을 제시해요.", scores: { HR: 2, MKT: 1 } },
      { text: "사용한 방법론의 강점과 적용 사례를 설명해요.", scores: { PM: 2, DATA: 1 } }
    ]},
    { id: 14, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '조장', text: "프로젝트가 끝났습니다.\n\n가장 의미 있었던 것은? (15/15)", options: [
      { text: "체계적인 연구 과정을 경험한 것이 가장 유익했어요.", scores: { PM: 2, FIN: 1 } },
      { text: "데이터 분석 능력과 경제학적 사고가 성장했어요.", scores: { DATA: 2, FIN: 1 } },
      { text: "팀원들과 협력하며 소통하는 법을 배웠어요.", scores: { HR: 2, MKT: 1 } },
      { text: "실제 경제 현상을 이해하는 통찰을 얻었어요.", scores: { FIN: 2, PM: 1 } }
    ]}
  ],
  Statistics: [ // 통계학과
    { id: 0, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '조장', text: "첫 모임에서 문제를 정의해야 합니다.\n\n무엇부터 시작할까요? (1/15)", options: [
      { text: "설문 설계의 타당성과 신뢰성을 먼저 고려해요.", scores: { DATA: 2, PM: 1 } },
      { text: "학생들의 실제 불만 사항을 직접 듣고 문항을 구성해요.", scores: { MKT: 2, HR: 1 } },
      { text: "기존 연구 논문을 참고해 이론적 배경을 먼저 정리해요.", scores: { PM: 2, FIN: 1 } },
      { text: "팀원들의 의견을 모아 종합적으로 접근해요.", scores: { HR: 2, PM: 1 } }
    ]},
    { id: 1, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원A', text: "데이터 수집 방법을 정해야 합니다.\n\n어떤 방식이 좋을까요? (2/15)", options: [
      { text: "온라인 설문으로 대량의 데이터를 빠르게 수집해요.", scores: { DATA: 2, MKT: 1 } },
      { text: "식당 앞에서 직접 설문해 응답률을 높여요.", scores: { HR: 2, MKT: 1 } },
      { text: "학교 데이터베이스나 기존 자료를 활용해요.", scores: { PM: 2, DATA: 1 } },
      { text: "여러 방법을 조합해 다양한 데이터를 모아요.", scores: { MKT: 1, HR: 1 } }
    ]},
    { id: 2, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원B', text: "분석 도구를 선택해야 합니다.\n\n무엇을 사용할까요? (3/15)", options: [
      { text: "R이나 Python으로 전문적인 통계 분석을 해요.", scores: { DATA: 2, TECH: 1 } },
      { text: "Excel로 기초 통계와 시각화를 간편하게 처리해요.", scores: { FIN: 2, PM: 1 } },
      { text: "SPSS나 Stata 같은 통계 소프트웨어를 활용해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "Tableau로 시각화 중심의 분석을 해요.", scores: { DESIGN: 2, DATA: 1 } }
    ]},
    { id: 3, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '조장', text: "역할을 분담해야 합니다.\n\n각자 무엇을 맡을까요? (4/15)", options: [
      { text: "데이터 수집, 전처리, 분석, 시각화로 명확히 나눠요.", scores: { PM: 2, DATA: 1 } },
      { text: "각자 강점에 맞춰 유연하게 협업해요.", scores: { HR: 2, PM: 1 } },
      { text: "모든 과정을 함께하며 서로 배워가요.", scores: { HR: 2, MKT: 1 } },
      { text: "핵심 작업은 전문가가, 보조 작업은 분담해요.", scores: { DATA: 1, FIN: 1 } }
    ]},
    { id: 4, phase: 'P1. 팀플 협업', phaseName: 'Phase 1. 팀플 협업', speaker: '팀원C', text: "일정을 계획해야 합니다.\n\n어떻게 관리할까요? (5/15)", options: [
      { text: "전체 타임라인을 세우고 단계별로 진행해요.", scores: { PM: 2, DATA: 1 } },
      { text: "데이터 수집 완료 후 분석 일정을 확정해요.", scores: { DATA: 2, PM: 1 } },
      { text: "주 1회 회의로 진도를 확인하며 조정해요.", scores: { HR: 2, PM: 1 } },
      { text: "유연하게 진행하며 필요에 따라 수정해요.", scores: { MKT: 1, HR: 1 } }
    ]},
    { id: 5, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "설문 문항을 설계합니다.\n\n어떻게 구성할까요? (6/15)", options: [
      { text: "리커트 척도로 정량적 측정이 가능하게 설계해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "개방형 질문으로 다양한 의견을 수집해요.", scores: { MKT: 2, HR: 1 } },
      { text: "기존 검증된 척도를 참고해 신뢰성을 높여요.", scores: { PM: 2, DATA: 1 } },
      { text: "학생들이 이해하기 쉬운 언어로 작성해요.", scores: { HR: 2, MKT: 1 } }
    ]},
    { id: 6, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "데이터 전처리가 필요합니다.\n\n어떻게 처리할까요? (7/15)", options: [
      { text: "결측치와 이상치를 체계적으로 처리해요.", scores: { DATA: 2, PM: 1 } },
      { text: "변수를 표준화하고 정규화해 분석을 준비해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "탐색적 데이터 분석(EDA)으로 패턴을 먼저 파악해요.", scores: { PM: 2, DATA: 1 } },
      { text: "주요 변수들 간의 관계를 시각화해 확인해요.", scores: { DESIGN: 2, DATA: 1 } }
    ]},
    { id: 7, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "통계 분석 방법을 선택합니다.\n\n어떤 기법을 사용할까요? (8/15)", options: [
      { text: "회귀분석으로 만족도 영향 요인을 파악해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "요인분석으로 주요 차원을 도출해요.", scores: { DATA: 2, PM: 1 } },
      { text: "집단 간 차이 검정(t-test, ANOVA)을 실시해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "상관분석으로 변수 간 관계를 먼저 탐색해요.", scores: { PM: 2, DATA: 1 } }
    ]},
    { id: 8, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "결과를 시각화해야 합니다.\n\n어떤 방식이 효과적일까요? (9/15)", options: [
      { text: "통계 소프트웨어로 전문적인 그래프를 작성해요.", scores: { DATA: 2, TECH: 1 } },
      { text: "인포그래픽으로 직관적이고 이해하기 쉽게 표현해요.", scores: { DESIGN: 2, MKT: 1 } },
      { text: "표와 그래프를 적절히 조합해 제시해요.", scores: { PM: 2, DATA: 1 } },
      { text: "핵심 수치를 강조하며 스토리텔링 방식으로 전달해요.", scores: { MKT: 2, PM: 1 } }
    ]},
    { id: 9, phase: 'P2. 개인 아이디어', phaseName: 'Phase 2. 개인 아이디어', speaker: '나(독백)', text: "분석 결과를 해석합니다.\n\n어떻게 풀어낼까요? (10/15)", options: [
      { text: "통계적 유의성과 효과 크기를 중심으로 설명해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "실제 학식 개선 방안과 연결해 실용적으로 제시해요.", scores: { MKT: 2, PM: 1 } },
      { text: "이론적 배경과 연결해 학술적으로 해석해요.", scores: { FIN: 2, PM: 1 } },
      { text: "시각 자료와 함께 직관적으로 설명해요.", scores: { DESIGN: 2, MKT: 1 } }
    ]},
    { id: 10, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원A', text: "응답 데이터에 문제가 있습니다.\n\n어떻게 처리할까요? (11/15)", options: [
      { text: "응답 패턴을 분석해 문제 데이터를 제거해요.", scores: { DATA: 2, PM: 1 } },
      { text: "결측치 처리 방법을 적용해 데이터를 보완해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "추가 설문을 진행해 샘플 크기를 확보해요.", scores: { PM: 2, HR: 1 } },
      { text: "현재 데이터로 가능한 분석을 진행해요.", scores: { MKT: 1, HR: 1 } }
    ]},
    { id: 11, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원B', text: "유의미한 결과가 나오지 않습니다.\n\n어떻게 대응할까요? (12/15)", options: [
      { text: "변수 변환이나 다른 분석 기법을 시도해봐요.", scores: { DATA: 2, PM: 1 } },
      { text: "유의하지 않은 결과도 의미 있는 발견으로 보고해요.", scores: { PM: 2, FIN: 1 } },
      { text: "표본 크기나 측정 도구의 문제를 검토해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "정성적 분석을 보강해 연구의 가치를 높여요.", scores: { MKT: 2, HR: 1 } }
    ]},
    { id: 12, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '팀원C', text: "발표 준비가 부족합니다.\n\n어떻게 할까요? (13/15)", options: [
      { text: "분석을 담당한 사람이 발표를 맡아요.", scores: { DATA: 2, PM: 1 } },
      { text: "발표 스크립트를 준비해 읽으며 발표해요.", scores: { PM: 2, HR: 1 } },
      { text: "팀원들이 협력해 분담 발표를 진행해요.", scores: { HR: 2, PM: 1 } },
      { text: "시각 자료에 집중해 간결하게 발표해요.", scores: { DESIGN: 2, MKT: 1 } }
    ]},
    { id: 13, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '교수님', text: "분석 방법의 적절성에 대한 질문을 받았습니다.\n\n어떻게 답변할까요? (14/15)", options: [
      { text: "통계적 근거와 가정을 명확히 설명해요.", scores: { DATA: 2, FIN: 1 } },
      { text: "기존 연구에서 검증된 방법론을 적용했다고 설명해요.", scores: { FIN: 2, PM: 1 } },
      { text: "한계를 인정하고 대안적 분석도 고려했다고 답변해요.", scores: { PM: 2, HR: 1 } },
      { text: "지적에 감사하며 추가 분석 계획을 제시해요.", scores: { HR: 2, PM: 1 } }
    ]},
    { id: 14, phase: 'P3. 돌발 상황', phaseName: 'Phase 3. 돌발 상황', speaker: '조장', text: "프로젝트가 끝났습니다.\n\n가장 의미 있었던 것은? (15/15)", options: [
      { text: "데이터 분석 기술과 통계적 사고력이 크게 성장했어요.", scores: { DATA: 2, TECH: 1 } },
      { text: "실제 문제를 해결하는 과정이 흥미롭고 보람 있었어요.", scores: { PM: 2, MKT: 1 } },
      { text: "팀원들과 협력하며 함께 성장한 경험이 소중해요.", scores: { HR: 2, PM: 1 } },
      { text: "통계로 세상을 이해하는 새로운 관점을 얻었어요.", scores: { FIN: 2, DATA: 1 } }
    ]}
  ]
};

// 기존 시나리오 (백업용)
const oldScenarios: Scenario[] = [
  // Phase 1: 팀플 협업 (Kick-off & Team Building)
  {
    id: 0,
    phase: 'teamwork',
    phaseName: 'Phase 1. 팀플 협업',
    speaker: '시스템',
    text: '(카페에 모인 4명. 아무도 입을 떼지 않고 아이스 아메리카노만 바라보고 있다...)\n\n칼졸업(선배): "..."\n금손이(후배): "(눈치...)"\n\n이 어색한 정적... 나는 어떻게 행동할까?',
    options: [
      { 
        text: '(밝게 웃으며) "안녕하세요! 다들 전공이 어떻게 되세요? 저희 통성명부터 하죠!"', 
        scores: { PEOPLE: 2, PM: 1 }
      },
      { 
        text: '시간 아까우니까 바로 본론으로 들어가죠. 이번 과제 주제 생각해오신 거 있나요?', 
        scores: { PM: 2, DATA: 1 }
      },
      { 
        text: '일단 단톡방이랑 자료 공유할 클라우드 폴더부터 만들어서 초대할게요.', 
        scores: { DEV: 1, PM: 1 }
      },
      { 
        text: '(누군가 말할 때까지 기다리며 회의록 적을 준비를 한다)', 
        scores: { DEV: 1, DESIGN: 1 }
      }
    ]
  },
  {
    id: 1,
    phase: 'teamwork',
    phaseName: 'Phase 1. 팀플 협업',
    speaker: '열정맨(동기)',
    text: '여러분! 우리 진짜 레전드 팀 한번 만들어봐요. 지각비는 1분당 천 원! 회의는 매일 저녁 9시 어때요? 🔥\n\n금손이(후배): "헉... 매일은 좀 부담스러운데요 ㅠㅠ 알바도 있어서..."\n\n팀 규칙, 어떻게 정하는 게 좋을까?',
    options: [
      { 
        text: '규칙은 확실해야죠. 지각비 걷고, 주 2회 오프라인 회의 고정으로 박읍시다.', 
        scores: { PM: 2 }
      },
      { 
        text: '각자 사정이 있으니까, 기본적으로 카톡으로 소통하고 필요할 때만 유동적으로 모여요.', 
        scores: { DESIGN: 1, PEOPLE: 1 }
      },
      { 
        text: '회의 자주 한다고 능사가 아니에요. 각자 맡은 결과물만 제때 가져오면 터치하지 맙시다.', 
        scores: { DEV: 2 }
      },
      { 
        text: '규칙보다는 팀워크죠! 회의 끝나고 맛집 탐방 가는 걸 규칙으로 해요.', 
        scores: { PEOPLE: 2 }
      }
    ]
  },
  {
    id: 2,
    phase: 'teamwork',
    phaseName: 'Phase 1. 팀플 협업',
    speaker: '칼졸업(선배)',
    text: '자료 정리는 뭘로 할래? 카톡은 파일 기간 만료돼서 나중에 찾기 힘들던데.\n\n우리 팀의 협업 도구는?',
    options: [
      { 
        text: '노션(Notion) 페이지 하나 파서 일정, 회의록, 자료실 싹 다 정리할게요.', 
        scores: { PM: 2, MKT: 1 }
      },
      { 
        text: '개발할 때 편하게 깃허브(GitHub)랑 슬랙(Slack) 연동해서 쓰죠.', 
        scores: { DEV: 2 }
      },
      { 
        text: '새로운 툴 배우는 시간도 아까워요. 그냥 카톡 게시판이랑 앨범 기능 활용하죠.', 
        scores: { PEOPLE: 1, DESIGN: 1 }
      },
      { 
        text: '구글 스프레드시트 공유해서 탭별로 진행 상황이랑 데이터 정리하는 게 제일 깔끔해요.', 
        scores: { DATA: 2 }
      }
    ]
  },
  {
    id: 3,
    phase: 'teamwork',
    phaseName: 'Phase 1. 팀플 협업',
    speaker: '칼졸업(선배)',
    text: '자, 가장 중요한 시간입니다. 각자 1인분은 해야죠? 본인이 제일 "캐리"할 수 있는 파트를 맡아주세요.\n\n내가 자신 있게 손드는 역할은?',
    options: [
      { 
        text: '전체적인 일정 관리랑 기획서 취합은 제가 책임지고 하겠습니다.', 
        scores: { PM: 2 }
      },
      { 
        text: '설문조사 돌리고 통계 내서 시장 분석하는 건 제가 할게요.', 
        scores: { DATA: 2 }
      },
      { 
        text: '핵심 기능 구현이랑 프로토타입 제작은 제가 맡겠습니다.', 
        scores: { DEV: 2, DESIGN: 1 }
      },
      { 
        text: '발표 자료(PPT) 예쁘게 만들고, 교수님 앞에서 발표하는 건 제가 할게요.', 
        scores: { MKT: 2, DESIGN: 1 }
      }
    ]
  },
  {
    id: 4,
    phase: 'teamwork',
    phaseName: 'Phase 1. 팀플 협업',
    speaker: '시스템',
    text: '(회의가 끝났다. 다들 주섬주섬 짐을 챙긴다.)\n\n헤어지기 전, 내가 마지막으로 챙기는 것은?',
    options: [
      { 
        text: '자, 오늘 정한 내용 회의록으로 정리해서 톡방에 올릴게요. 다음 회의 수요일 맞죠?', 
        scores: { PM: 2 }
      },
      { 
        text: '다들 첫날이라 고생하셨는데, 저녁 같이 드실래요? 제가 근처 맛집 알아요!', 
        scores: { PEOPLE: 2 }
      },
      { 
        text: '다음 시간까지 각자 타겟 유저랑 경쟁사 분석 자료 꼼꼼하게 조사해오기입니다!', 
        scores: { MKT: 1, DATA: 1 }
      },
      { 
        text: '(집에 가면서) "아까 말한 그 기능, 오픈소스로 구현 가능한지 라이브러리 찾아봐야겠다."', 
        scores: { DEV: 2 }
      }
    ]
  },

  // Phase 2: 개인 아이디어 (Ideation & Deep Dive)
  {
    id: 5,
    phase: 'ideation',
    phaseName: 'Phase 2. 개인 아이디어',
    speaker: '나(독백)',
    text: '주제는 "대학생 시간관리 앱"으로 정해졌어. 근거 자료를 찾아야 하는데... 뭐부터 볼까?\n\n나의 자료 조사 스타일은?',
    options: [
      { 
        text: '에타랑 대나무숲 크롤링해서 학생들이 "시간표" 관련해서 쓴 불만 글을 텍스트 마이닝해본다.', 
        scores: { DATA: 2 }
      },
      { 
        text: '앱스토어 1위 시간관리 앱은 어떻게 생겼지? UI랑 버튼 배치를 캡처해서 분석한다.', 
        scores: { DESIGN: 2, PM: 1 }
      },
      { 
        text: '관련 논문이나 뉴스 기사, 통계청 자료를 찾아서 공신력 있는 팩트를 확보한다.', 
        scores: { DATA: 1, MKT: 1 }
      },
      { 
        text: '시간표 API를 학교 서버에서 긁어올 수 있나? 깃허브에 비슷한 프로젝트 코드가 있는지 본다.', 
        scores: { DEV: 2 }
      }
    ]
  },
  {
    id: 6,
    phase: 'ideation',
    phaseName: 'Phase 2. 개인 아이디어',
    speaker: '나(독백)',
    text: '조사하다 보니 좋은 기능이 떠오르네. 이걸 어떻게 구체화해서 팀원들에게 보여주지?\n\n아이디어를 표현하는 방법은?',
    options: [
      { 
        text: '마인드맵으로 핵심 기능을 분류하고, 포스트잇으로 위계 질서를 잡아 구조화한다.', 
        scores: { PM: 2 }
      },
      { 
        text: '아이패드나 연습장에 화면 흐름도(UI 스케치)를 쓱쓱 그려서 보여준다.', 
        scores: { DESIGN: 2 }
      },
      { 
        text: '친구한테 전화해서 "야 이런 기능 있으면 쓸 거 같아?"라고 말로 설명하며 반응을 본다.', 
        scores: { MKT: 2, PEOPLE: 1 }
      },
      { 
        text: '데이터가 입력되면 어떤 로직으로 처리되어서 출력될지 플로우차트(알고리즘)를 그린다.', 
        scores: { DEV: 2 }
      }
    ]
  },
  {
    id: 7,
    phase: 'ideation',
    phaseName: 'Phase 2. 개인 아이디어',
    speaker: '나(독백)',
    text: '중간 발표용 PPT 장표를 만드는 중이야. 내가 가장 신경 써서 다듬는 부분은?\n\n문서 작업의 핵심은?',
    options: [
      { 
        text: '디자인이 생명이지! 폰트, 자간, 색감 통일성. 1mm 어긋난 것도 용납 못 해.', 
        scores: { DESIGN: 2 }
      },
      { 
        text: '기획 의도가 잘 전달돼야 해. "Why-What-How" 논리 흐름과 스토리텔링에 집중한다.', 
        scores: { PM: 2, MKT: 1 }
      },
      { 
        text: '설문조사 그래프랑 수치 데이터가 제일 크게, 잘 보이게 배치해서 신뢰도를 높인다.', 
        scores: { DATA: 2 }
      },
      { 
        text: '백문이 불여일견. 실제 작동하는 시연 영상이나 프로토타입 링크를 QR코드로 박는다.', 
        scores: { DEV: 2 }
      }
    ]
  },
  {
    id: 8,
    phase: 'ideation',
    phaseName: 'Phase 2. 개인 아이디어',
    speaker: '나(독백)',
    text: '아... 하다가 막혔다. 도저히 좋은 해결책이 안 떠오르는데 어떡하지?\n\n슬럼프 탈출법은?',
    options: [
      { 
        text: '잠깐 산책하거나 유튜브 보면서 머리를 식힌다. 영감은 쉴 때 온다.', 
        scores: { DESIGN: 1, MKT: 1 }
      },
      { 
        text: '팀 단톡방에 "다들 여기 좀 봐주세요 ㅠㅠ" 하고 SOS를 쳐서 집단지성을 빌린다.', 
        scores: { PEOPLE: 2 }
      },
      { 
        text: '유사한 문제를 해결한 해외 사례나 논문을 미친 듯이 디깅(Digging)해서 답을 찾는다.', 
        scores: { DATA: 1, DEV: 1 }
      },
      { 
        text: '교수님이나 선배에게 메일을 보내서 피드백을 요청한다.', 
        scores: { PM: 1, PEOPLE: 1 }
      }
    ]
  },
  {
    id: 9,
    phase: 'ideation',
    phaseName: 'Phase 2. 개인 아이디어',
    speaker: '나(독백)',
    text: '제출 10분 전! 파일 전송하기 전에 마지막으로 딱 하나만 더 확인하자.\n\n최후의 점검 포인트는?',
    options: [
      { 
        text: '오타나 맞춤법 틀린 거 없나? 비문은 없나? 기본이 제일 중요해.', 
        scores: { PM: 1, MKT: 1 }
      },
      { 
        text: '앞뒤 내용이 모순되는 건 없나? 결론이 근거랑 연결되나? 논리 점검.', 
        scores: { PM: 1, DATA: 1 }
      },
      { 
        text: '이미지가 깨지거나 레이아웃 틀어진 곳은 없나? 비주얼 점검.', 
        scores: { DESIGN: 2 }
      },
      { 
        text: '프로토타입 링크 클릭했을 때 404 에러 안 뜨고 잘 넘어가나? 기능 점검.', 
        scores: { DEV: 2 }
      }
    ]
  },

  // Phase 3: 돌발 상황 (Crisis Management)
  {
    id: 10,
    phase: 'crisis',
    phaseName: 'Phase 3. 돌발 상황',
    speaker: '금손이(후배)',
    text: '선배님... 열정맨 오빠가 이틀째 카톡을 안 읽어요. 자기 파트 자료 안 줬는데... 잠수 탔나 봐요 ㅠㅠ\n\n사라진 팀원, 어떻게 처리할까?',
    options: [
      { 
        text: '어쩔 수 없다. 걔 이름 빼고 우리끼리 나눠서 빨리 끝내자. 학점은 챙겨야지.', 
        scores: { PM: 2 }
      },
      { 
        text: '무슨 사정이 있겠지... 사고라도 났나? 내가 개인톡이랑 전화 계속 시도해볼게.', 
        scores: { PEOPLE: 2 }
      },
      { 
        text: '아 답답해. 걔가 맡은 게 기술 조사였지? 그냥 내가 빨리 찾아서 채워 넣을게.', 
        scores: { DEV: 1, DESIGN: 1 }
      },
      { 
        text: '증거 자료 캡처해서 교수님께 메일 보내자. 무임승차는 용납 못 해.', 
        scores: { PM: 1, DATA: 1 }
      }
    ]
  },
  {
    id: 11,
    phase: 'crisis',
    phaseName: 'Phase 3. 돌발 상황',
    speaker: '칼졸업(선배)',
    text: '야 큰일 났다. 조교님이 우리 주제 너무 흔하다고 빠꾸 먹이셨어. 마감 3일 전인데... 다 엎으라는데?\n\n3일 남기고 주제 변경 위기, 나의 선택은?',
    options: [
      { 
        text: '3일이면 충분해! 오늘 다 같이 밤새서 싹 다 뜯어고치자. 할 수 있어!', 
        scores: { DEV: 2, DESIGN: 1 }
      },
      { 
        text: '지금 바꾸는 건 불가능해요. 기존 주제의 차별점을 더 강조하는 방향으로 기획서만 수정해서 설득해봐요.', 
        scores: { MKT: 2, PM: 1 }
      },
      { 
        text: '지적받은 포인트만 데이터로 보완해서 살짝만 피봇팅(수정)합시다. 효율적으로 가야죠.', 
        scores: { DATA: 1, PM: 1 }
      },
      { 
        text: '하... 다들 멘붕 오지 마요. 일단 밥부터 먹고 당 섭취하면서 차근차근 얘기해요.', 
        scores: { PEOPLE: 2 }
      }
    ]
  },
  {
    id: 12,
    phase: 'crisis',
    phaseName: 'Phase 3. 돌발 상황',
    speaker: '열정맨(동기)',
    text: '(갑자기 등장) 앗 죄송해요 잠들었어요! 근데... 제가 구현하려던 AI 챗봇 기능, 제 실력으론 도저히 안 될 것 같아요 ㅎㅎ;\n\n핵심 기능 구현 실패 위기, 대처법은?',
    options: [
      { 
        text: '그럴 줄 알았다... 그냥 버튼 누르면 "준비 중입니다" 팝업만 뜨게 처리하고 넘어가.', 
        scores: { DEV: 1, PM: 1 }
      },
      { 
        text: '오픈소스 찾아보거나 챗GPT API라도 연동해볼까? 내가 코드 같이 봐줄게.', 
        scores: { DEV: 2 }
      },
      { 
        text: '구현 대신에, "이렇게 작동할 것이다"라는 시연 영상을 기깔나게 만들어서 보여주자.', 
        scores: { DESIGN: 1, MKT: 1 }
      },
      { 
        text: '할 수 있는 데까지만 하고, 왜 실패했는지 분석해서 "향후 개선 계획"으로 보고서에 쓰자.', 
        scores: { DATA: 1, PEOPLE: 1 }
      }
    ]
  },
  {
    id: 13,
    phase: 'crisis',
    phaseName: 'Phase 3. 돌발 상황',
    speaker: '금손이(후배)',
    text: '발표 10분 전인데... 강의실 빔프로젝터가 고장 났대요! 화면이 안 나와요 ㅠㅠ 저희 어떡해요?\n\n발표 직전 장비 고장, 나의 행동은?',
    options: [
      { 
        text: '자료 못 보여줘도 괜찮아. 내가 말로 다 설명해서 교수님 홀려볼게. 나만 믿어.', 
        scores: { MKT: 2, PEOPLE: 1 }
      },
      { 
        text: '노트북 들고 앞으로 가서 교수님께 직접 화면 보여드리면서 진행하죠. 적극성을 어필합시다.', 
        scores: { PM: 1, PEOPLE: 1 }
      },
      { 
        text: '강의실 PC 문제일 수도 있으니 제 노트북으로 다시 연결해볼게요. HDMI 선 가져와봐요.', 
        scores: { DEV: 2 }
      },
      { 
        text: '조교님 불러서 수리 요청하고, 우리 순서 맨 뒤로 바꿔달라고 협상하고 올게요.', 
        scores: { PM: 2 }
      }
    ]
  },
  {
    id: 14,
    phase: 'crisis',
    phaseName: 'Phase 3. 돌발 상황',
    speaker: '교수님',
    text: '(발표 직후) 흠... 자네 조의 아이디어는 수익성이 전혀 없어 보이는데? 이거 어떻게 운영비 감당할 건가?\n\n교수님의 압박 질문, 나의 방어 논리는?',
    options: [
      { 
        text: '초기에는 사용자 트래픽을 모아서 맞춤형 광고와 제휴 마케팅을 붙이면 수익 창출이 가능합니다.', 
        scores: { MKT: 2 }
      },
      { 
        text: '시장 점유율 확보가 우선입니다. 카카오톡도 처음엔 적자였습니다. 데이터를 모으는 게 자산입니다.', 
        scores: { DATA: 2, PM: 1 }
      },
      { 
        text: '기본 기능은 무료로 풀고, 고급 기능은 구독형으로 파는 "프리미엄(Freemium)" 모델을 도입하겠습니다.', 
        scores: { PM: 2 }
      },
      { 
        text: '저희는 수익보다는 학생들의 불편 해결이라는 "사회적 가치"에 더 집중했습니다! 학교 지원을 받을 계획입니다.', 
        scores: { PEOPLE: 2, DESIGN: 1 }
      }
    ]
  }
];

export default function JobSimulationModal({
  onClose,
  onComplete,
}: any) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [scores, setScores] = useState<{[key: string]: number}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showOptions]);

  // 학과 선택 핸들러
  const handleDepartmentSelect = (dept: Department) => {
    setSelectedDepartment(dept);
    setScenarios(SCENARIO_DB[dept]);
    
    // 학과별 점수 시스템 초기화
    const initialScores: {[key: string]: number} = {};
    SCENARIO_DB[dept][0].options.forEach(option => {
      Object.keys(option.scores).forEach(key => {
        if (!(key in initialScores)) {
          initialScores[key] = 0;
        }
      });
    });
    setScores(initialScores);

    // 학과 선택 후 환영 메시지
    const deptNames: Record<Department, string> = {
      Business: '경영학과',
      Economics: '경제학과',
      Statistics: '통계학과'
    };

    const welcomeMessage: Message = {
      id: Date.now(),
      speaker: '시스템',
      text: `📚 ${deptNames[dept]} 전공 필수 과목\n\n한 학기 동안의 조별과제를 경험하며\n당신의 진짜 직무 성향을 파악하는 시뮬레이션입니다.\n\n총 15개의 상황이 주어집니다.\n선택에 정답은 없으니 평소 자신의 모습대로 선택해주세요!`,
      isUser: false,
      timestamp: new Date(),
      phase: 'intro'
    };
    
    setMessages([welcomeMessage]);
  };

  // 초기화 useEffect - 한 번만 실행
  useEffect(() => {
    let mounted = true;
    
    const initSimulation = () => {
      if (!mounted || messages.length > 0) return;
      
      const introMessage: Message = {
        id: Date.now(),
        speaker: '시스템',
        text: '🎓 대학생 직무 성향 테스트\n\n조별과제 시뮬레이션을 통해\n당신에게 가장 잘 맞는 직무를 찾아드립니다.\n\n먼저, 당신의 전공 학과를 선택해주세요!',
        isUser: false,
        timestamp: new Date(),
        phase: 'intro'
      };
      
      setMessages([introMessage]);
    };
    
    initSimulation();
    
    return () => {
      mounted = false;
    };
  }, []);

  // 시나리오 진행 useEffect
  useEffect(() => {
    if (selectedDepartment && scenarios.length > 0 && messages.length === 1 && messages[0].phase === 'intro') {
      const timer = setTimeout(() => {
        showNextMessage();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, selectedDepartment, scenarios]);

  const showNextMessage = () => {
    if (currentScenarioIndex >= scenarios.length) {
      // 시뮬레이션 완료
      calculateResult();
      return;
    }

    const scenario = scenarios[currentScenarioIndex];
    handleNextScenario(scenario, currentScenarioIndex);
  };

  const addScenarioMessage = (scenario: Scenario) => {
    setIsTyping(true);
    setShowOptions(false);

    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now(),
        speaker: scenario.speaker,
        text: scenario.text,
        isUser: false,
        timestamp: new Date(),
        phase: scenario.phase
      };

      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      
      // 선택지 표시
      setTimeout(() => {
        setShowOptions(true);
      }, 600);
    }, 800);
  };

  const handleOptionClick = (option: Option) => {
    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now(),
      speaker: '나',
      text: option.text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowOptions(false);

    // 점수 업데이트
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([key, value]) => {
      newScores[key as keyof typeof scores] += value || 0;
    });
    setScores(newScores);

    // 다음 시나리오로
    const nextIndex = currentScenarioIndex + 1;
    
    setTimeout(() => {
      setCurrentScenarioIndex(nextIndex);
      
      // 다음 메시지가 있으면 표시
      setTimeout(() => {
        if (nextIndex < scenarios.length) {
          // showNextMessage는 업데이트된 currentScenarioIndex를 사용하지 않고 nextIndex를 직접 사용
          const scenario = scenarios[nextIndex];
          handleNextScenario(scenario, nextIndex);
        } else {
          calculateResult();
        }
      }, 600);
    }, 400);
  };

  const handleNextScenario = (scenario: Scenario, index: number) => {
    // Phase 변경 체크
    if (scenario.phaseName !== currentPhase) {
      setCurrentPhase(scenario.phaseName);
      
      // Phase 전환 메시지 추가 (단, 첫 시나리오가 아닐 때만)
      if (index > 0) {
        const phaseMessage: Message = {
          id: Date.now(),
          speaker: '시스템',
          text: `━━━━━━━━━━━━━━━━\n${scenario.phaseName}\n━━━━━━━━━━━━━━━━`,
          isUser: false,
          timestamp: new Date(),
          phase: 'transition'
        };
        
        setMessages(prev => [...prev, phaseMessage]);
        
        setTimeout(() => {
          addScenarioMessage(scenario);
        }, 1000);
      } else {
        addScenarioMessage(scenario);
      }
    } else {
      addScenarioMessage(scenario);
    }
  };

  const calculateResult = () => {
    // 가장 높은 점수의 직무 찾기
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topJob = sortedScores[0][0];
    
    // 모든 가능한 직무명 매핑
    const jobNames: {[key: string]: string} = {
      // 경영학과
      MKT: '마케팅',
      PM: '기획/PM',
      DATA: '데이터 분석',
      FIN: '재무/회계',
      DESIGN: '디자인',
      HR: 'HR/인사',
      // 기존 (공통)
      DEV: '개발/엔지니어',
      PEOPLE: 'HR/조직문화'
    };

    // 완료 메시지 추가
    const completeMessage: Message = {
      id: Date.now(),
      speaker: '시스템',
      text: '🎉 조별과제가 모두 끝났습니다!\n\n한 학기 동안 고생 많으셨어요.\n이제 당신의 직무 성향을 분석해드릴게요...',
      isUser: false,
      timestamp: new Date(),
      phase: 'complete'
    };
    
    setMessages(prev => [...prev, completeMessage]);

    setTimeout(() => {
      const jobName = jobNames[topJob] || topJob;
      toast.success(`분석 완료! 당신에게 가장 맞는 직무는 "${jobName}"입니다! 🎉`);
      
      setTimeout(() => {
        onComplete(topJob, jobName, selectedDepartment, scores);
      }, 1500);
    }, 2000);
  };

  const currentScenario = scenarios[currentScenarioIndex];
  
  // Phase별 아이콘
  const getPhaseIcon = (phase?: string) => {
    if (phase?.includes('킥오프')) return '🤝';
    if (phase?.includes('아이디어')) return '💡';
    if (phase?.includes('돌발')) return '🚨';
    
    switch (phase) {
      case 'teamwork': return '🤝';
      case 'ideation': return '💡';
      case 'crisis': return '🚨';
      case 'intro': return '📚';
      case 'complete': return '🎉';
      case 'transition': return '📍';
      default: return '💬';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1B1C1E] rounded-2xl w-[95vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#1B1C1E] to-[#2D2F31] border-b-2 border-[#25A778] p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#25A778] to-[#2DC98E] rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedDepartment ? 
                  (selectedDepartment === 'Business' ? '💼 경영학과' : 
                   selectedDepartment === 'Economics' ? '📈 경제학과' : '📊 통계학과') 
                  : '대학생 직무 성향 테스트'}
              </h2>
              <p className="text-sm text-[#CACBCC] mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {selectedDepartment ? `${currentScenarioIndex} / ${scenarios.length}` : '조별과제 시뮬레이션'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <X className="w-6 h-6 text-[#CACBCC]" />
          </button>
        </div>

        {/* 채팅 영역 */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-3 relative"
          style={{ 
            background: '#F1F2F3',
            paddingBottom: showOptions ? '450px' : '20px'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className="max-w-[80%]">
                {!message.isUser && message.phase !== 'transition' && (
                  <div className="flex items-center gap-2 text-xs text-[#6B6D70] mb-1.5 px-2">
                    <span>{getPhaseIcon(message.phase)}</span>
                    <span className="font-semibold">{message.speaker}</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                    message.isUser
                      ? 'bg-[#25A778] text-white'
                      : message.phase === 'transition'
                      ? 'bg-[#1B1C1E] text-white text-center font-bold py-4'
                      : message.phase === 'intro' || message.phase === 'complete'
                      ? 'bg-gradient-to-br from-[#DDF3EB] to-[#E8F1FF] text-[#1B1C1E] border border-[#25A778]/20'
                      : 'bg-white text-[#1B1C1E]'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {message.text}
                  </div>
                  {!message.phase || (message.phase !== 'transition' && message.phase !== 'intro') ? (
                    <div className={`text-xs mt-2 opacity-70 ${message.isUser ? 'text-white' : 'text-[#6B6D70]'}`}>
                      {message.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {/* 학과 선택 버튼 (시뮬레이션 시작 전) */}
          {!selectedDepartment && messages.length > 0 && !isTyping && (
            <div className="flex justify-center mt-6 animate-in fade-in slide-in-from-bottom-3">
              <div className="max-w-2xl w-full space-y-3">
                {/* 경영학과 */}
                <button
                  onClick={() => handleDepartmentSelect('Business')}
                  className="group relative w-full bg-white hover:bg-gray-50 border-2 border-[#25A778] rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0 w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    {/* 텍스트 */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                        경영학과 기반 종합 시작
                      </h3>
                      <p className="text-sm text-gray-500">
                        카페 런칭, 마케팅, 재무 분석 등
                      </p>
                    </div>
                    
                    {/* 체크마크 */}
                    <div className="flex-shrink-0 w-9 h-9 bg-[#25A778] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* 경제학과 */}
                <button
                  onClick={() => handleDepartmentSelect('Economics')}
                  className="group relative w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#25A778] rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    
                    {/* 텍스트 */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                        경제학과 기반 종합 분석
                      </h3>
                      <p className="text-sm text-gray-500">
                        금리 인상, 소비 분석, 경제 이론 등
                      </p>
                    </div>
                    
                    {/* 체크마크 */}
                    <div className="flex-shrink-0 w-9 h-9 bg-[#25A778] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* 통계학과 */}
                <button
                  onClick={() => handleDepartmentSelect('Statistics')}
                  className="group relative w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#25A778] rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {/* 아이콘 */}
                    <div className="flex-shrink-0 w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    
                    {/* 텍스트 */}
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                        통계학과 기반 데이터 분석
                      </h3>
                      <p className="text-sm text-gray-500">
                        학식 만족도, 설문 분석, 통계 모델링 등
                      </p>
                    </div>
                    
                    {/* 체크마크 */}
                    <div className="flex-shrink-0 w-9 h-9 bg-[#25A778] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in">
              <div className="bg-white rounded-2xl px-5 py-3.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#25A778]" />
                  <span className="text-sm text-[#6B6D70]">입력 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 선택지 영역 - 채팅 위에 겹치는 디자인 */}
        {showOptions && currentScenario && selectedDepartment && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1B1C1E] via-[#1B1C1E]/98 to-[#1B1C1E]/60 pt-8 pb-6 px-8">
            <div className="max-w-6xl mx-auto">
              {/* 선택 안내 */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#25A778] to-[#2DC98E] text-white px-5 py-2 rounded-full shadow-lg mb-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-bold text-sm">당신의 선택은?</span>
                </div>
                <p className="text-xs text-[#CACBCC]">
                  선택에 정답은 없습니다. 평소 당신의 모습대로 선택해주세요.
                </p>
              </div>
              
              {/* 선택지 버튼들 */}
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {currentScenario.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(option)}
                    className="group relative w-full bg-[#2D2F31] hover:bg-[#25A778]/20 border-2 border-[#3A3C3E] hover:border-[#25A778] rounded-lg px-5 py-3.5 text-left transition-all duration-200 shadow-md hover:shadow-xl"
                  >
                    {/* 선택지 번호 뱃지 */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-br from-[#25A778] to-[#2DC98E] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                      {index + 1}
                    </div>
                    
                    {/* 선택지 텍스트 */}
                    <div className="flex items-center justify-between pl-11">
                      <span className="text-sm text-white group-hover:text-[#2DC98E] font-medium leading-relaxed pr-3 flex-1">
                        {option.text}
                      </span>
                      
                      {/* 화살표 아이콘 */}
                      <div className="flex-shrink-0 w-8 h-8 bg-[#1B1C1E] group-hover:bg-gradient-to-br group-hover:from-[#25A778] group-hover:to-[#2DC98E] rounded-full flex items-center justify-center transition-all">
                        <svg 
                          className="w-4 h-4 text-[#6B6D70] group-hover:text-white transition-colors" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 진행 상황 표시 - 심플한 디자인 */}
        <div className="absolute top-20 right-6 bg-[#1B1C1E]/95 backdrop-blur-sm rounded-lg px-4 py-2.5 shadow-lg border border-[#25A778]/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="text-xs text-[#CACBCC] font-medium">진행 상황</div>
            <div className="text-sm font-bold text-[#25A778]">
              {currentScenarioIndex} / {scenarios.length}
            </div>
          </div>
          <div className="w-32 h-1.5 bg-[#2D2F31] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#25A778] to-[#2DC98E] transition-all duration-500"
              style={{ width: `${(currentScenarioIndex / scenarios.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1B1C1E;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #25A778;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #2DC98E;
          }
        `}</style>
      </div>
    </div>
  );
}
