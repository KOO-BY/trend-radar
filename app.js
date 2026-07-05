/**
 * 성분 트렌드 레이더 - app.js
 * 화장품·건기식 핫 성분 랭킹 & 소싱 빙고판
 *
 * 데이터 소스: trend_data.json (파이프라인이 매일 자동 갱신)
 * 파이프라인: pipeline/update_trends.py
 */

// ============================
// 성분 데이터 (trend_data.json에서 동적 로드)
// ============================
let INGREDIENTS = [  // fetch 완료 후 채워짐
  // 초기값: trend_data.json 로드 전 빈 배열
];

// 아래 const는 app.js에서 직접 참조되지 않습니다. 
// 실제 성분 데이터는 ingredients_master.json 또는 trend_data.json에서 로드됩니다.
const _INGREDIENTS_PLACEHOLDER = [
  // ── 화장품 ──────────────────────────────────────────────────
  {
    id: 'snail-ampule',
    category: 'cosmetics',
    emoji: '🐌',
    name: '달팽이 앰플',
    score: 97,
    direction: 'hot',
    shortDesc: '닥터지 등 브랜드 대표 제품, 온라인 대비 10배 마진 가능',
    desc: '달팽이 점액 필트레이트(Snail Secretion Filtrate) 성분은 피부 재생·보습 효능으로 수년간 꾸준히 수요가 높습니다. 특히 닥터지 같은 대중적 브랜드의 동일 성분 제품이 창고에 자주 입고되어 10배 이상의 마진을 기대할 수 있습니다.',
    products: ['닥터지 달팽이 앰플 30ml', 'COSRX 어드밴스드 달팽이 96 뮤신 파워 에센스', '미즈온 달팽이 크림'],
    priceRange: '창고 900~1,500원 → 판매가 8,000~15,000원',
    caution: '유통기한 최소 1년 이상 남은 제품만 사입하세요. 상세 페이지에 브랜드 공식 이미지 무단 사용 금지.',
  },
  {
    id: 'cherry-collagen',
    category: 'cosmetics',
    emoji: '🍒',
    name: '체리 콜라겐',
    score: 94,
    direction: 'hot',
    shortDesc: '신성분 등장으로 급부상 중, 트렌드 초입 단계',
    desc: '기존 콜라겐에서 진화한 체리 유래 폴리페놀 결합 콜라겐 성분으로 2025년 말부터 급부상했습니다. 아직 시장 초입 단계이므로 선점 효과가 크며, 창고에서 발견 즉시 대량 사입 추천합니다.',
    products: ['체리 콜라겐 앰플', '체리 콜라겐 크림 복합체', '안티에이징 체리 세럼'],
    priceRange: '창고 2,000~4,000원 → 판매가 15,000~28,000원',
    caution: '신성분이므로 성분 인증 여부(INCI 표기)를 꼭 확인하고, 리뷰 수가 적은 제품은 테스트 소량 사입부터 시작하세요.',
  },
  {
    id: 'retinol',
    category: 'cosmetics',
    emoji: '🌟',
    name: '레티놀',
    score: 91,
    direction: 'up',
    shortDesc: '스테디셀러 성분, 안정적 수요 보장',
    desc: '비타민 A 유도체인 레티놀은 피부 노화 방지·주름 개선 효능으로 수년간 검색량이 꾸준히 유지됩니다. 제품 회전율이 높아 재고 부담이 적습니다.',
    products: ['No.7 레티놀 세럼', '바닐라코 레티놀 앰플', '닥터자르트 레티놀 크림'],
    priceRange: '창고 3,000~6,000원 → 판매가 18,000~35,000원',
    caution: '빛에 민감한 성분으로 보관 상태(진열 환경)를 반드시 확인하세요.',
  },
  {
    id: 'niacinamide',
    category: 'cosmetics',
    emoji: '✨',
    name: '나이아신아마이드',
    score: 89,
    direction: 'up',
    shortDesc: '미백·모공 케어, 가장 보편적인 기능성 성분',
    desc: '비타민B3 계열로 미백, 모공 케어, 피지 조절 효능이 검증된 성분입니다. COSRX, 이니스프리 등 주요 브랜드 제품이 창고에 자주 등장하여 꾸준한 소싱처가 됩니다.',
    products: ['COSRX 나이아신아마이드 15 세럼', '이니스프리 비타씨 나이아신아마이드 세럼', '더랩 나이아신아마이드 20'],
    priceRange: '창고 2,000~5,000원 → 판매가 12,000~25,000원',
    caution: '10% 이상 고농도 제품은 자극 리뷰가 있을 수 있으니 농도 확인 후 상세 페이지에 명시하세요.',
  },
  {
    id: 'ceramide',
    category: 'cosmetics',
    emoji: '🛡️',
    name: '세라마이드',
    score: 85,
    direction: 'stable',
    shortDesc: '피부 장벽 성분, 겨울 시즌 수요 폭증',
    desc: '피부 장벽을 강화하는 지질 성분으로 민감성 피부 케어 제품에 필수적으로 사용됩니다. 건조한 계절(가을~겨울)에 검색량이 특히 급증합니다.',
    products: ['CeraVe 세라마이드 모이스처라이징 크림', '닥터자르트 세라딘 크림', '아토팜 세라마이드 크림'],
    priceRange: '창고 4,000~8,000원 → 판매가 20,000~45,000원',
    caution: '미국/유럽 브랜드 병행수입 제품의 경우 한국어 라벨 부착 여부를 확인하세요.',
  },
  {
    id: 'panthenol',
    category: 'cosmetics',
    emoji: '💧',
    name: '판테놀',
    score: 82,
    direction: 'up',
    shortDesc: '진정·보습 성분, 예민한 피부 케어 트렌드와 함께 상승',
    desc: '비타민 B5 계열로 피부 진정·보습·상처 회복에 효과적입니다. 예민성 피부 케어 트렌드와 맞물려 꾸준히 상승 중이며 다양한 가격대 제품이 있어 창고 소싱에 유리합니다.',
    products: ['라운드랩 판테놀 토너', '이니스프리 판테놀 시카 앰플', '닥터지 판테놀 크림'],
    priceRange: '창고 1,500~4,000원 → 판매가 10,000~22,000원',
    caution: '별다른 특이사항 없음. 유통기한만 확인하면 소싱 리스크가 낮은 편입니다.',
  },
  {
    id: 'glutathione',
    category: 'cosmetics',
    emoji: '💎',
    name: '글루타치온',
    score: 80,
    direction: 'up',
    shortDesc: '강력 미백·항산화, 먹는 제품과 바르는 제품 모두 인기',
    desc: '강력한 항산화·미백 효능으로 화장품과 건기식 양쪽 시장에서 동시에 인기입니다. "먹는 글루타치온"과 "바르는 글루타치온"이 동반 성장 중입니다.',
    products: ['글루타치온 앰플', '에스엔에이 글루타치온 세럼', '글루타치온 마스크팩'],
    priceRange: '창고 2,500~5,000원 → 판매가 15,000~30,000원',
    caution: '워낙 다양한 제품군이 있어 성분 함량 확인이 중요합니다. 고함량 제품일수록 판매가를 높게 책정할 수 있습니다.',
  },
  {
    id: 'peptide',
    category: 'cosmetics',
    emoji: '🔬',
    name: '펩타이드 복합체',
    score: 78,
    direction: 'up',
    shortDesc: '안티에이징 프리미엄 성분, 높은 판매가 형성 가능',
    desc: '멀티 펩타이드(마트릭실, 아르지렐린 등)는 피부 탄력·주름 개선에 효과적인 고기능 성분입니다. 프리미엄 제품에 주로 사용되어 마진이 높고 구매 고객의 재구매율도 높습니다.',
    products: ['The Ordinary 멀티 펩타이드 세럼', '오휘 피시스 펩타이드 앰플', '리더스 펩타이드 앰플'],
    priceRange: '창고 3,000~7,000원 → 판매가 18,000~45,000원',
    caution: '프리미엄 성분이므로 제품 상태(산화 여부) 육안 확인 필수.',
  },
  {
    id: 'aha-bha',
    category: 'cosmetics',
    emoji: '🌀',
    name: 'AHA/BHA 필링',
    score: 74,
    direction: 'stable',
    shortDesc: '각질 케어 필수 성분, 스킨케어 루틴 고정 아이템',
    desc: '글리콜산(AHA)과 살리실산(BHA) 기반 필링 제품은 각질 케어 필수 아이템으로 꾸준한 수요를 자랑합니다. COSRX BHA 블랙헤드 파워 리퀴드가 대표 아이템.',
    products: ['COSRX BHA 블랙헤드 파워 리퀴드', '폴라 초이스 BHA 9% 부스터', '이니스프리 포어 클라리파잉 BHA 세럼'],
    priceRange: '창고 3,000~6,000원 → 판매가 15,000~28,000원',
    caution: '산성 성분으로 보관 환경(직사광선, 고온)에 민감합니다. 창고 진열 상태 반드시 확인.',
  },

  // ── 건강기능식품 ─────────────────────────────────────────────
  {
    id: 'magnesium',
    category: 'health',
    emoji: '⚡',
    name: '마그네슘',
    score: 96,
    direction: 'hot',
    shortDesc: '수면·피로 회복, SNS 중심으로 수요 폭발 중',
    desc: '수면의 질 개선, 근육 경련 완화, 만성 피로 회복에 효과적인 마그네슘은 SNS(인스타, 틱톡)에서 "슬립 마그네슘"으로 바이럴되며 2025년부터 수요가 급격히 증가했습니다. 300mg 이상 고함량 제품이 특히 인기입니다.',
    products: ['솔가 마그네슘 400mg', '나우푸드 마그네슘 500mg', 'GNC 마그네슘 고함량'],
    priceRange: '창고 4,000~8,000원 → 판매가 18,000~38,000원',
    caution: '건기식은 유통기한 변질 위험이 있으므로 2년 이상 잔여 기간 제품만 사입하세요. 보관 온도 상온 여부 확인 필수.',
  },
  {
    id: 'nad-plus',
    category: 'health',
    emoji: '🔋',
    name: 'NAD+ (NMN/NR)',
    score: 93,
    direction: 'hot',
    shortDesc: '세포 에너지·항노화 성분, 현재 가장 핫한 건기식',
    desc: 'NMN(니코틴아마이드 모노뉴클레오타이드)과 NR(니코틴아마이드 리보사이드)은 세포 에너지 대사와 노화 방지에 관여하는 성분으로, 빌 게이츠·닥터 허브 등 셀럽 언급으로 급부상했습니다. 고가 제품이 많아 마진율이 높습니다.',
    products: ['Alive by Science NMN 500mg', '엘리바 NMN 250mg', 'Tru Niagen NR'],
    priceRange: '창고 8,000~15,000원 → 판매가 40,000~90,000원',
    caution: '냉장 보관 제품이 많습니다. 창고 보관 환경 필수 확인. 해외 직수입품은 한국어 라벨 부착 여부 확인.',
  },
  {
    id: 'probiotics',
    category: 'health',
    emoji: '🦠',
    name: '프로바이오틱스',
    score: 88,
    direction: 'up',
    shortDesc: '장 건강·면역력, 전 연령대 꾸준한 수요',
    desc: '유산균(프로바이오틱스)은 장 건강·면역력·피부 개선에 효과적으로, 남녀노소 전 연령대에 걸친 꾸준한 수요가 있습니다. 특히 100억 CFU 이상 고함량 제품이 인기입니다.',
    products: ['락토핏 장 건강', '종근당 프리바이오틱스 생유산균', '한국야쿠르트 헬리코박터 프로젝트 윌'],
    priceRange: '창고 3,000~7,000원 → 판매가 15,000~32,000원',
    caution: '냉장 보관 제품은 배송비가 크게 증가합니다. 상온 보관 가능 여부를 반드시 확인하세요.',
  },
  {
    id: 'omega3',
    category: 'health',
    emoji: '🐟',
    name: '오메가3 (고함량)',
    score: 86,
    direction: 'stable',
    shortDesc: '심혈관·눈 건강, 스테디셀러 건기식',
    desc: '오메가3(EPA·DHA)는 심혈관 건강, 눈 건강, 혈중 중성지방 감소에 효과적인 국민 건기식입니다. 특히 rTG 형태 고순도·고함량 제품이 일반 제품 대비 판매가를 2~3배 높게 받을 수 있습니다.',
    products: ['솔가 오메가3 950mg', '노르딕 내츄럴스 얼티밋 오메가', '뉴트리코어 오메가3 고함량'],
    priceRange: '창고 5,000~10,000원 → 판매가 22,000~50,000원',
    caution: '생선 비린내 제품은 반품률이 높습니다. 장용성 캡슐 여부를 확인하고 상세 페이지에 명시하세요.',
  },
  {
    id: 'biotin',
    category: 'health',
    emoji: '💇',
    name: '비오틴 (고함량)',
    score: 83,
    direction: 'up',
    shortDesc: '탈모·모발 건강, 2030 여성 중심 급상승',
    desc: '비타민 B7인 비오틴은 탈모 예방·모발 건강에 효과적으로 알려져 2030 여성 고객층을 중심으로 검색량이 급증하고 있습니다. 10,000mcg 이상 고함량 제품 선호도가 높습니다.',
    products: ['나우푸드 비오틴 10000mcg', '솔가 비오틴 5000mcg', '내추럴팩토리 비오틴'],
    priceRange: '창고 2,000~5,000원 → 판매가 12,000~28,000원',
    caution: '탈모 관련 제품은 효능 과대광고에 주의하세요. 식약처 기능성 인정 여부 확인 후 상세 페이지 작성.',
  },
  {
    id: 'berberine',
    category: 'health',
    emoji: '🌿',
    name: '베르베린',
    score: 81,
    direction: 'hot',
    shortDesc: '"자연 메트포르민" 별명으로 다이어트 관심층 급증',
    desc: '혈당 조절·인슐린 민감성 개선 효과로 "자연 메트포르민"이라는 별명을 얻으며 다이어트·혈당 관리 관심층 중심으로 폭발적 수요가 발생하고 있습니다. 아직 창고에서 자주 보이지 않아 희소성이 높습니다.',
    products: ['솔가 베르베린 500mg', 'Thorne Berberine 500mg', '나우푸드 베르베린'],
    priceRange: '창고 5,000~12,000원 → 판매가 28,000~55,000원',
    caution: '혈당강하제 복용자는 의사 상담 필요 문구를 상세 페이지에 필수 기재. 의약품이 아니므로 치료 효능 광고 금지.',
  },
  {
    id: 'coq10',
    category: 'health',
    emoji: '❤️',
    name: 'CoQ10',
    score: 77,
    direction: 'stable',
    shortDesc: '심장·에너지 대사, 40대 이상 중장년층 스테디셀러',
    desc: '코엔자임Q10은 세포 에너지 생산·항산화·심장 건강에 효과적으로 40대 이상 중장년층에서 꾸준한 수요가 있습니다. 유비퀴놀(환원형) 형태가 일반 유비퀴논 대비 흡수율이 높아 더 비싸게 팔립니다.',
    products: ['솔가 CoQ10 100mg', '나우푸드 유비퀴놀 100mg', '애플리이 CoQ10 200mg'],
    priceRange: '창고 4,000~9,000원 → 판매가 20,000~42,000원',
    caution: '지용성 성분이므로 보관 환경(고온·다습 주의) 확인 필수.',
  },
  {
    id: 'ashwagandha',
    category: 'health',
    emoji: '🧘',
    name: '아슈와간다',
    score: 76,
    direction: 'up',
    shortDesc: '스트레스 완화·코르티솔 조절, MZ세대 관심 급증',
    desc: '인도 전통 허브 성분으로 스트레스 호르몬(코르티솔) 조절·수면 질 개선·운동 퍼포먼스 향상 효능으로 MZ세대 사이에서 "번아웃 탈출 보조제"로 인기를 얻고 있습니다.',
    products: ['KSM-66 아슈와간다 300mg', '나우푸드 아슈와간다 450mg', 'Thorne Ashwagandha'],
    priceRange: '창고 3,500~7,000원 → 판매가 18,000~38,000원',
    caution: '임산부·갑상선 약 복용자는 주의 문구 필수 기재.',
  },
];

// 방향 설정
const DIRECTION_MAP = {
  hot:    { label: '↑↑ 급상승',  class: 'dir-hot',    emoji: '🔥' },
  up:     { label: '↑ 상승 중',  class: 'dir-up',     emoji: '📈' },
  stable: { label: '→ 안정적',   class: 'dir-stable', emoji: '➡️' },
  down:   { label: '↓ 하락 중',  class: 'dir-down',   emoji: '📉' },
};

// ─────────────────────────────────────
// trend_data.json 로드 함수 (중앙 데이터 배포 모델)
// ─────────────────────────────────────
const REPO_OWNER = 'KOO-BY';
const REPO_NAME = 'trend-database'; // 새로 만든 공개 데이터 저장소 이름
const DATA_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/trend_data.json`;
const MASTER_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/ingredients_master.json`;

async function loadTrendData() {
  const loadingEl = document.getElementById('loading-overlay');
  const errorEl   = document.getElementById('error-overlay');

  if (loadingEl) loadingEl.classList.remove('hidden');

  try {
    // 중앙 GitHub 저장소에서 최신 트렌드 데이터 가져오기 (캐시 방지)
    let data;
    try {
      const res = await fetch(DATA_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error('trend_data.json not found on remote');
      data = await res.json();
      INGREDIENTS = data.ingredients || [];
      
      const updatedAt = data.updated_at ? new Date(data.updated_at) : null;
      if (updatedAt) {
        const el = document.getElementById('update-date');
        if (el) el.textContent = `${updatedAt.getFullYear()}.${String(updatedAt.getMonth()+1).padStart(2,'0')}.${String(updatedAt.getDate()).padStart(2,'0')} 갱신`;
      }
      console.log(`✅ 원격 데이터 로드 완료: ${INGREDIENTS.length}개 성분`);
    } catch {
      // 폴백: 마스터 데이터 읽기
      console.warn('⚠️ 원격 trend_data.json 없음 → 마스터 데이터로 폴백');
      const res = await fetch(MASTER_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error('Master data also not found');
      const master = await res.json();
      INGREDIENTS = master.map((item, idx) => ({
        ...item,
        score: Math.max(10, 95 - idx * 5),
        direction: 'stable',
      }));
      const el = document.getElementById('update-date');
      if (el) el.textContent = '마스터 데이터 (서버 미갱신)';
    }
  } catch (err) {
    console.error('❌ 데이터 로드 실패:', err);
    if (errorEl) errorEl.classList.remove('hidden');
  } finally {
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

// ============================
// 상태 관리
// ============================
let state = {
  activeTab: 'trend',
  activeFilter: 'all',
  selectedIngredient: null,
};

// ============================
// DOM 참조
// ============================
const $ = (id) => document.getElementById(id);

import { auth, onAuthStateChanged, signOut } from './auth.js';

// 인증 상태 확인 (비로그인 시 로그인 페이지로 강제 이동)
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace('login.html');
  } else {
    // 로그인 된 상태라면 UI 표시 시작
    document.body.style.display = 'block';
  }
});

const dom = {
  panelTrend: $('panel-trend'),
  panelCalc: $('panel-calculator'),
  tabTrend: $('tab-trend'),
  tabCalc: $('tab-calculator'),
  radarBars: $('radar-bars'),
  rankingList: $('ranking-list'),
  filterAll: $('filter-all'),
  filterCosmetics: $('filter-cosmetics'),
  filterHealth: $('filter-health'),
  
  // 마진 계산기 DOM
  calcResultCard: $('calc-result-card'),
  calcNetProfit: $('calc-net-profit'),
  calcMarginRate: $('calc-margin-rate'),
  calcRoi: $('calc-roi'),
  calcCost: $('calc-cost'),
  calcPrice: $('calc-price'),
  calcFee: $('calc-fee'),
  calcShipping: $('calc-shipping'),
  calcOther: $('calc-other'),
  btnResetCalc: $('btn-reset-calc'),
  modalOverlay: $('modal-overlay'),
  modalClose: $('modal-close'),
  modalEmoji: $('modal-emoji'),
  modalCatBadge: $('modal-cat-badge'),
  modalIngredientName: $('modal-ingredient-name'),
  modalScore: $('modal-score'),
  modalDirection: $('modal-direction'),
  modalDesc: $('modal-desc'),
  modalProducts: $('modal-products'),
  modalPriceRange: $('modal-price-range'),
  modalCaution: $('modal-caution'),
};

// ============================
// 필터링 & 정렬
// ============================
function getFilteredIngredients(filter) {
  const list = filter === 'all'
    ? INGREDIENTS
    : INGREDIENTS.filter(i => i.category === filter);
  return [...list].sort((a, b) => b.score - a.score);
}

// ============================
// 트렌드 랭킹 렌더링
// ============================
function renderRadarBars(ingredients) {
  const top5 = ingredients.slice(0, 5);
  const max = top5[0]?.score || 100;

  dom.radarBars.innerHTML = top5.map((ing, idx) => {
    const rankClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
    const dir = DIRECTION_MAP[ing.direction];
    const barColor = ing.category === 'cosmetics'
      ? 'linear-gradient(90deg, #ec4899, #f97316)'
      : 'linear-gradient(90deg, #10b981, #00d4ff)';
    const widthPct = (ing.score / max) * 100;

    return `
      <div class="radar-bar-item">
        <span class="radar-bar-rank ${rankClass}">${idx + 1}</span>
        <div class="radar-bar-info">
          <div class="radar-bar-name">
            ${ing.emoji} ${ing.name}
            <span class="${dir.class}" style="font-size:11px">${dir.emoji}</span>
          </div>
          <div class="radar-bar-track">
            <div class="radar-bar-fill" style="width:0%; background:${barColor}" data-target="${widthPct}"></div>
          </div>
        </div>
        <span class="radar-bar-score">${ing.score}</span>
      </div>
    `;
  }).join('');

  // 애니메이션 (0 → target)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dom.radarBars.querySelectorAll('.radar-bar-fill').forEach(el => {
        el.style.width = el.dataset.target + '%';
        el.style.transition = 'width 0.9s cubic-bezier(0.34,1.1,0.64,1)';
      });
    });
  });
}

function renderRankingList(ingredients) {
  dom.rankingList.innerHTML = ingredients.map((ing, idx) => {
    const dir = DIRECTION_MAP[ing.direction];
    const rankClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
    const catClass = ing.category === 'cosmetics' ? 'cosmetics' : 'health';
    const catLabel = ing.category === 'cosmetics' ? '💄 화장품' : '💊 건기식';

    return `
      <div class="rank-card cat-${ing.category}" data-id="${ing.id}" style="animation-delay:${idx * 40}ms" role="button" tabindex="0" aria-label="${ing.name} 상세 보기">
        <span class="rank-num ${rankClass}">${idx + 1}</span>
        <span class="rank-emoji">${ing.emoji}</span>
        <div class="rank-info">
          <div class="rank-name">
            ${escapeHTML(ing.name)}
            <span class="cat-badge ${catClass}">${catLabel}</span>
          </div>
          <div class="rank-meta">${escapeHTML(ing.shortDesc)}</div>
        </div>
        <div class="rank-right">
          <span class="trend-direction ${dir.class}">${dir.label.split(' ')[0]}</span>
          <span class="rank-score">${ing.score}</span>
          <span class="rank-arrow">›</span>
        </div>
      </div>
    `;
  }).join('');

  // 카드 클릭 이벤트 바인딩
  dom.rankingList.querySelectorAll('.rank-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(card.dataset.id); });
  });
}

function renderTrend() {
  const ingredients = getFilteredIngredients(state.activeFilter);
  renderRadarBars(ingredients);
  renderRankingList(ingredients);
}

// ============================
// 모달
// ============================
function openModal(id) {
  const ing = INGREDIENTS.find(i => i.id === id);
  if (!ing) return;

  const dir = DIRECTION_MAP[ing.direction];
  dom.modalEmoji.textContent = ing.emoji;
  dom.modalCatBadge.textContent = ing.category === 'cosmetics' ? '💄 화장품' : '💊 건기식';
  dom.modalCatBadge.className = `modal-category-badge ${ing.category === 'health' ? 'health' : ''}`;
  dom.modalIngredientName.textContent = ing.name;
  dom.modalScore.textContent = ing.score;
  dom.modalDirection.textContent = dir.label;
  dom.modalDirection.className = `modal-direction ${dir.class}`;
  dom.modalDesc.textContent = ing.desc;
  dom.modalProducts.innerHTML = (ing.products || []).map(p => `<li>${escapeHTML(p)}</li>`).join('');
  dom.modalPriceRange.textContent = ing.priceRange;
  dom.modalCaution.textContent = ing.caution;

  dom.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  dom.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ============================
// 마진 계산기 로직
// ============================
function calculateMargin() {
  const cost = parseInt(dom.calcCost.value.replace(/,/g, '')) || 0;
  const price = parseInt(dom.calcPrice.value.replace(/,/g, '')) || 0;
  const feeRate = parseFloat(dom.calcFee.value) || 0;
  const shipping = parseInt(dom.calcShipping.value.replace(/,/g, '')) || 0;
  const other = parseInt(dom.calcOther.value.replace(/,/g, '')) || 0;

  const feeAmount = price * (feeRate / 100);
  const netProfit = price - (cost + feeAmount + shipping + other);
  
  let marginRate = 0;
  if (price > 0) {
    marginRate = (netProfit / price) * 100;
  }
  
  let roi = 0;
  if (cost > 0) {
    roi = (netProfit / cost) * 100;
  }

  // UI 업데이트
  dom.calcNetProfit.textContent = Math.floor(netProfit).toLocaleString() + '원';
  dom.calcMarginRate.textContent = marginRate.toFixed(1) + '%';
  dom.calcRoi.textContent = roi.toFixed(1) + '%';

  // 적자/흑자 색상 처리
  if (netProfit < 0) {
    dom.calcResultCard.classList.remove('profit');
    dom.calcResultCard.classList.add('loss');
  } else if (netProfit > 0) {
    dom.calcResultCard.classList.remove('loss');
    dom.calcResultCard.classList.add('profit');
  } else {
    dom.calcResultCard.classList.remove('loss', 'profit');
  }
}

function formatNumberInput(e) {
  let val = e.target.value.replace(/[^0-9]/g, '');
  if (val) {
    e.target.value = parseInt(val).toLocaleString();
  } else {
    e.target.value = '';
  }
  calculateMargin();
}

function resetCalculator() {
  dom.calcCost.value = '';
  dom.calcPrice.value = '';
  dom.calcFee.value = '6';
  dom.calcShipping.value = '3,000';
  dom.calcOther.value = '0';
  calculateMargin();
}

// ============================
// 탭 전환
// ============================
function switchTab(tab) {
  state.activeTab = tab;

  [dom.tabTrend, dom.tabCalc].forEach(el => {
    el.classList.remove('active');
    el.setAttribute('aria-selected', 'false');
  });

  [dom.panelTrend, dom.panelCalc].forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('active');
  });

  if (tab === 'trend') {
    dom.tabTrend.classList.add('active');
    dom.tabTrend.setAttribute('aria-selected', 'true');
    dom.panelTrend.classList.remove('hidden');
    dom.panelTrend.classList.add('active');
  } else {
    dom.tabCalc.classList.add('active');
    dom.tabCalc.setAttribute('aria-selected', 'true');
    dom.panelCalc.classList.remove('hidden');
    dom.panelCalc.classList.add('active');
  }
}

// ============================
// 유틸
// ============================
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function setUpdateDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  $('update-date').textContent = `${y}.${m} 기준`;
}

// ============================
// 이벤트 바인딩
// ============================
function bindEvents() {
  // 탭
  dom.tabTrend.addEventListener('click', () => switchTab('trend'));
  dom.tabCalc.addEventListener('click', () => switchTab('calculator'));

  // 트렌드 필터
  [$('filter-all'), $('filter-cosmetics'), $('filter-health')].forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderTrend();
    });
  });

  // 계산기 이벤트
  [dom.calcCost, dom.calcPrice, dom.calcShipping, dom.calcOther].forEach(input => {
    input.addEventListener('input', formatNumberInput);
  });
  dom.calcFee.addEventListener('input', calculateMargin); // 수수료는 포맷팅 생략
  dom.btnResetCalc.addEventListener('click', resetCalculator);

  // 모달 닫기
  dom.modalClose.addEventListener('click', closeModal);
  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closeModal();
  });


  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        // signOut이 성공하면 onAuthStateChanged에서 감지하여 리다이렉트합니다.
      } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// ============================
// 초기화
// ============================
async function init() {
  await loadTrendData();   // JSON 로드 완료 후 렌더링
  renderTrend();
  bindEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
