export const reflectionTemplates = {
  STAR: {
    id: 'star',
    name: 'STAR 기법',
    description: '구조화된 경험 정리 - 상황, 과제, 행동, 결과',
    category: '구조화',
    icon: '⭐',
    questions: [
      { key: 'situation', label: 'Situation (상황)', prompt: '어떤 상황이었나요? 프로젝트나 업무의 배경을 설명해주세요.' },
      { key: 'task', label: 'Task (과제)', prompt: '당신에게 주어진 목표나 해결해야 할 과제는 무엇이었나요?' },
      { key: 'action', label: 'Action (행동)', prompt: '목표를 달성하기 위해 구체적으로 어떤 행동을 취했나요?' },
      { key: 'result', label: 'Result (결과)', prompt: '그 결과는 어땠나요? 구체적인 성과나 배운 점을 말씀해주세요.' }
    ],
    competencies: ['문제해결', '실행력', '성과지향', '분석적사고']
  },
  '5F': {
    id: '5f',
    name: '5F 회고',
    description: '사실-감정-발견-미래-피드백 단계별 성찰',
    category: '심화',
    icon: '🔍',
    questions: [
      { key: 'fact', label: 'Fact (사실)', prompt: '무슨 일이 있었나요? 객관적인 사실을 있는 그대로 말씀해주세요.' },
      { key: 'feeling', label: 'Feeling (감정)', prompt: '그때 어떤 감정을 느꼈나요? 솔직하게 표현해주세요.' },
      { key: 'finding', label: 'Finding (발견)', prompt: '이 경험에서 무엇을 발견하거나 배웠나요?' },
      { key: 'future', label: 'Future (미래)', prompt: '앞으로 비슷한 상황에서 어떻게 하고 싶으신가요?' },
      { key: 'feedback', label: 'Feedback (피드백)', prompt: '자신에게 해주고 싶은 피드백이 있나요?' }
    ],
    competencies: ['자기인식', '성찰력', '학습민첩성', '감성지능']
  },
  KPT: {
    id: 'kpt',
    name: 'KPT 회고',
    description: '유지할 점, 문제점, 시도할 점',
    category: '기본',
    icon: '✅',
    questions: [
      { key: 'keep', label: 'Keep (유지할 점)', prompt: '잘했던 점, 계속 유지하고 싶은 것은 무엇인가요?' },
      { key: 'problem', label: 'Problem (문제점)', prompt: '어려웠던 점이나 개선이 필요한 부분은 무엇인가요?' },
      { key: 'try', label: 'Try (시도할 점)', prompt: '다음에 새롭게 시도해보고 싶은 것은 무엇인가요?' }
    ],
    competencies: ['개선지향', '문제인식', '실행력', '학습능력']
  },
  '4L': {
    id: '4l',
    name: '4L 회고',
    description: '좋았던 것, 배운 것, 부족했던 것, 바라는 것',
    category: '균형',
    icon: '💡',
    questions: [
      { key: 'liked', label: 'Liked (좋았던 것)', prompt: '이번 경험에서 좋았던 점은 무엇인가요?' },
      { key: 'learned', label: 'Learned (배운 것)', prompt: '새롭게 배우거나 깨달은 것은 무엇인가요?' },
      { key: 'lacked', label: 'Lacked (부족했던 것)', prompt: '부족하거나 아쉬웠던 점은 무엇인가요?' },
      { key: 'longed', label: 'Longed for (바라는 것)', prompt: '앞으로 어떻게 되기를 바라나요?' }
    ],
    competencies: ['자기성찰', '학습지향', '목표설정', '성장마인드']
  },
  PMI: {
    id: 'pmi',
    name: 'PMI 회고',
    description: '긍정적인 면, 부정적인 면, 흥미로운 점',
    category: '분석',
    icon: '📊',
    questions: [
      { key: 'plus', label: 'Plus (긍정적인 면)', prompt: '이번 경험의 긍정적인 측면은 무엇인가요?' },
      { key: 'minus', label: 'Minus (부정적인 면)', prompt: '개선이 필요하거나 부정적이었던 부분은 무엇인가요?' },
      { key: 'interesting', label: 'Interesting (흥미로운 점)', prompt: '예상치 못했거나 흥미로웠던 발견은 무엇인가요?' }
    ],
    competencies: ['비판적사고', '분석력', '객관성', '통찰력']
  }
};

export const surveyQuestions = [
  {
    id: 'experience_type',
    question: '어떤 경험을 회고하고 싶으신가요?',
    type: 'single',
    options: [
      { value: 'project', label: '프로젝트 수행', icon: '🚀' },
      { value: 'problem', label: '문제 해결', icon: '🔧' },
      { value: 'collaboration', label: '팀 협업', icon: '👥' },
      { value: 'learning', label: '학습 및 성장', icon: '📚' },
      { value: 'challenge', label: '도전 과제', icon: '💪' }
    ]
  },
  {
    id: 'reflection_purpose',
    question: '회고의 주된 목적은 무엇인가요?',
    type: 'single',
    options: [
      { value: 'achievement', label: '성과 정리', icon: '🏆' },
      { value: 'learning', label: '배움 기록', icon: '✍️' },
      { value: 'improvement', label: '개선점 찾기', icon: '📈' },
      { value: 'competency', label: '역량 파악', icon: '💎' },
      { value: 'emotional', label: '감정 정리', icon: '❤️' }
    ]
  },
  {
    id: 'detail_level',
    question: '얼마나 상세하게 회고하고 싶으신가요?',
    type: 'single',
    options: [
      { value: 'simple', label: '간단하게 (3-4개 질문)', icon: '⚡' },
      { value: 'moderate', label: '적당하게 (4-5개 질문)', icon: '⭐' },
      { value: 'detailed', label: '상세하게 (5개 이상 질문)', icon: '🔍' }
    ]
  },
  {
    id: 'focus_area',
    question: '어떤 부분에 집중하고 싶으신가요? (복수 선택 가능)',
    type: 'multiple',
    options: [
      { value: 'process', label: '진행 과정', icon: '🔄' },
      { value: 'result', label: '결과와 성과', icon: '🎯' },
      { value: 'emotion', label: '감정과 느낌', icon: '💭' },
      { value: 'learning', label: '배운 점', icon: '💡' },
      { value: 'future', label: '향후 계획', icon: '🚀' }
    ]
  }
];

export const competencyKeywords = {
  '문제해결': ['문제', '해결', '분석', '원인', '개선', '방안'],
  '실행력': ['실행', '완료', '달성', '수행', '진행', '추진'],
  '성과지향': ['목표', '성과', '결과', '달성', '기여', '효과'],
  '분석적사고': ['분석', '평가', '검토', '비교', '조사', '파악'],
  '자기인식': ['느낌', '생각', '깨달음', '인식', '이해', '자각'],
  '성찰력': ['돌아보', '반성', '성찰', '되돌아', '회고', '점검'],
  '학습민첩성': ['배움', '학습', '습득', '익힘', '터득', '이해'],
  '감성지능': ['감정', '공감', '이해', '배려', '소통', '관계'],
  '개선지향': ['개선', '향상', '발전', '나아', '더 나은', '업그레이드'],
  '문제인식': ['문제', '이슈', '어려움', '한계', '제약', '과제'],
  '학습능력': ['배우', '익히', '습득', '학습', '공부', '연구'],
  '자기성찰': ['반성', '성찰', '돌아보', '점검', '평가', '검토'],
  '학습지향': ['배우', '성장', '발전', '향상', '습득', '학습'],
  '목표설정': ['목표', '계획', '방향', '지향', '추구', '달성'],
  '성장마인드': ['성장', '발전', '향상', '나아', '도전', '시도'],
  '비판적사고': ['비판', '평가', '검토', '판단', '분석', '고찰'],
  '분석력': ['분석', '파악', '조사', '연구', '검토', '평가'],
  '객관성': ['객관', '사실', '데이터', '근거', '증거', '실제'],
  '통찰력': ['통찰', '발견', '깨달음', '인사이트', '파악', '이해'],
  '리더십': ['리드', '이끌', '주도', '조율', '관리', '지휘'],
  '커뮤니케이션': ['소통', '전달', '공유', '논의', '설명', '대화'],
  '협업능력': ['협업', '협력', '팀워크', '조율', '함께', '공동'],
  '창의성': ['창의', '아이디어', '새로운', '혁신', '독창', '발상'],
  '책임감': ['책임', '완수', '마무리', '끝까지', '담당', '맡'],
  '적응력': ['적응', '대응', '유연', '변화', '조정', '맞춤']
};
