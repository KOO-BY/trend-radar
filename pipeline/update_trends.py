"""
update_trends.py — 성분 트렌드 데이터 자동 수집·정제 파이프라인
=====================================================================
실행 방법:
  1. pipeline/.env 파일 생성 (.env.example 참고하여 API 키 입력)
  2. cd trend-radar/pipeline
  3. python update_trends.py

필요 환경변수:
  NAVER_CLIENT_ID      — 네이버 개발자 센터 Client ID
  NAVER_CLIENT_SECRET  — 네이버 개발자 센터 Client Secret
  GEMINI_API_KEY       — Google AI Studio API Key
"""

import os
import json
import time
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path

import requests
from curl_cffi import requests as cffi_requests  # 올리브영 봇 차단 우회용
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# ─────────────────────────────────────────────
# google-generativeai 버전별 호환 처리
# ─────────────────────────────────────────────
try:
    # 0.8.x 이상 (최신 방식)
    from google import genai as google_genai
    GENAI_NEW_API = True
    GEMINI_MODEL_NAME = "gemini-2.5-flash"
except ImportError:
    # 0.7.x (레거시 방식)
    import google.generativeai as google_genai_legacy
    GENAI_NEW_API = False
    GEMINI_MODEL_NAME = "gemini-2.5-flash"

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# 경로 설정
BASE_DIR    = Path(__file__).resolve().parent.parent
MASTER_FILE = BASE_DIR / "ingredients_master.json"
OUTPUT_FILE = BASE_DIR / "trend_data.json"

# 네이버 데이터랩 API 설정
NAVER_CLIENT_ID     = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")
NAVER_API_URL       = "https://openapi.naver.com/v1/datalab/shopping/category/keywords"
NAVER_CATEGORIES    = {
    "cosmetics": "50000008",   # 화장품/미용
    "health":    "50000001",   # 건강식품
}

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# 올리브영 설정
OY_RANKING_URL = "https://www.oliveyoung.co.kr/store/main/getBestList.do"
OY_CATEGORIES = {
    "cosmetics": "10000010001", # 스킨케어 베스트
    "health":    "10000020001", # 건강식품 베스트
}
OY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/116.0.0.0",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "https://www.oliveyoung.co.kr/",
}

# 트렌드 점수 가중치
WEIGHT_OLIVEYOUNG = 0.60
WEIGHT_NAVER      = 0.40

# 방향 판별 임계값
HOT_THRESHOLD  = 15
UP_THRESHOLD   = 5
DOWN_THRESHOLD = -5


# ─────────────────────────────────────────────
# Gemini API 호출 헬퍼
# ─────────────────────────────────────────────
def call_gemini(prompt: str) -> str:
    """Gemini API를 호출하여 텍스트 응답을 반환합니다."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")

    if GENAI_NEW_API:
        # google-generativeai 0.8.x 이상 방식
        client = google_genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=GEMINI_MODEL_NAME,
            contents=prompt,
        )
        return response.text
    else:
        # google-generativeai 0.7.x 레거시 방식
        google_genai_legacy.configure(api_key=GEMINI_API_KEY)
        model = google_genai_legacy.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        return response.text


# ─────────────────────────────────────────────
# Step 1: 올리브영 베스트 상품명 스크래핑
# ─────────────────────────────────────────────
def scrape_oliveyoung(category_key: str) -> list:
    """올리브영 전체 베스트 페이지에서 탭을 클릭하여 상품명 수집 (Playwright 사용)."""
    cat_name = "화장품" if category_key == "cosmetics" else "건기식"
    disp_cat_no = OY_CATEGORIES[category_key]
    log.info(f"📦 올리브영 [{cat_name}] 베스트 스크래핑 시작 (Playwright)...")
    product_names = []

    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            # headless=True로 1차 시도
            # 데스크톱 버전 강제 및 뷰포트 확대 설정
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/120.0.0.0",
                viewport={"width": 1920, "height": 1080}
            )
            page = context.new_page()

            # 1. 메인 베스트 페이지 로드 (타임아웃 대기 설정)
            page.goto("https://www.oliveyoung.co.kr/store/main/getBestList.do", timeout=45000)

            # 2. 원하는 카테고리 탭 대기 및 클릭 (DOM 부착 상태만 대기 후 강제 클릭으로 안정성 극대화)
            selector = f'button[data-ref-dispcatno="{disp_cat_no}"]'
            try:
                page.wait_for_selector(selector, state="attached", timeout=20000)
                btn = page.locator(selector).first
                btn.click(force=True)
                page.wait_for_timeout(3000) # 데이터 로딩 대기
            except Exception as e:
                log.warning(f"  ⚠️  카테고리 버튼({disp_cat_no}) 로드 실패: {e}")
                # 디버깅용 스크린샷 저장
                try:
                    page.screenshot(path=f"pw_error_{category_key}.png")
                except:
                    pass

            # 3. 데이터 추출
            tx_names = page.locator(".tx_name").all_inner_texts()
            for raw_name in tx_names:
                clean_name = re.sub(r'\[.*?\]', '', raw_name).strip()
                if clean_name:
                    product_names.append(clean_name)
                    if len(product_names) >= 24: # TOP 24개까지만
                        break

            browser.close()

    except Exception as e:
        log.error(f"  ❌ 올리브영 [{cat_name}] 스크래핑 실패: {e}")
        log.warning("  → 마스터 데이터만으로 진행합니다.")

    log.info(f"📦 올리브영 [{cat_name}] 스크래핑 완료: {len(product_names)}개 상품명")
    return product_names

# ─────────────────────────────────────────────
# Step 2: Gemini로 성분명 추출
# ─────────────────────────────────────────────
def extract_ingredients_with_gemini(cos_names: list, health_names: list, master_names: list) -> dict:
    """
    상품명 리스트 → Gemini API → 성분 키워드 추출.
    Returns: { "성분명": {"count": int, "is_new": bool, "category": str, "gemini_meta": dict} }
    """
    if not GEMINI_API_KEY:
        log.warning("⚠️  GEMINI_API_KEY 미설정. Gemini 분석 건너뜀.")
        return {}

    if not cos_names and not health_names:
        log.warning("⚠️  올리브영 상품명 없음. Gemini 분석 건너뜀.")
        return {}

    log.info("🤖 Gemini API로 성분명 추출 중...")
    
    names_text = "=== 화장품(스킨케어) 베스트 ===\n"
    names_text += "\n".join(f"- {n}" for n in cos_names[:100])
    names_text += "\n\n=== 건강식품 베스트 ===\n"
    names_text += "\n".join(f"- {n}" for n in health_names[:100])

    prompt = f"""아래는 올리브영 화장품 및 건강식품 베스트셀러 상품명 목록입니다.
이 목록에서 유효 성분명(ingredient)만 추출하여 JSON으로 응답해 주세요.

규칙:
1. 브랜드명, 제품 시리즈명, 용량, 일반 명사(크림/세럼/토너/유산균/비타민 등 너무 포괄적인 단어)는 제외하세요.
2. 여러 표기는 대표 표기로 통합하세요 (예: "비타C" → "비타민C", "병풀" → "시카").
3. 각 성분이 상품명에 등장한 횟수(count)를 포함하세요.
4. 해당 성분이 주로 화장품에 쓰이면 "category": "cosmetics", 건기식에 쓰이면 "category": "health"로 분류하세요.
5. 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

상품명 목록:
{names_text}

응답 형식:
[
  {{"name": "달팽이점액", "category": "cosmetics", "count": 8}},
  {{"name": "아르기닌", "category": "health", "count": 5}}
]"""

    try:
        raw = call_gemini(prompt)
        json_match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if not json_match:
            log.error("  ❌ Gemini 응답에서 JSON 파싱 실패")
            return {}

        items = json.loads(json_match.group())
        result = {}
        for item in items:
            name = item.get("name", "").strip()
            cat = item.get("category", "cosmetics")
            count = int(item.get("count", 1))
            
            if name:
                is_new = not any(name in mn or mn in name for mn in master_names)
                result[name] = {"count": count, "is_new": is_new, "category": cat}

        log.info(f"  ✅ {len(result)}개 성분 추출 (신규: {sum(1 for v in result.values() if v['is_new'])}개)")

        # 신규 성분 설명 생성
        new_names = [n for n, v in result.items() if v["is_new"]]
        if new_names:
            result = _generate_new_descriptions(result, new_names)

        return result

    except Exception as e:
        log.error(f"  ❌ Gemini 오류: {e}")
        return {}


def _generate_new_descriptions(result: dict, new_names: list) -> dict:
    """신규 성분에 대해 Gemini로 간략 설명 생성."""
    log.info(f"  🆕 신규 성분 {len(new_names)}개 설명 생성 중: {new_names}")
    prompt = f"""아래 화장품·건기식 성분들에 대해 온라인 셀러를 위한 정보를 JSON으로 제공해 주세요.

성분 목록: {', '.join(new_names)}

각 성분:
[
  {{
    "name": "성분명",
    "emoji": "이모지 1개",
    "shortDesc": "20자 이내 한 줄 설명",
    "desc": "트렌드 이유와 소싱 팁 2~3문장",
    "priceRange": "창고 예상가 → 판매가 범위",
    "caution": "소싱 주의사항 한 문장"
  }}
]

JSON만 응답하세요."""

    try:
        raw = call_gemini(prompt)
        json_match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if json_match:
            items = json.loads(json_match.group())
            for item in items:
                name = item.get("name", "")
                if name in result:
                    result[name]["gemini_meta"] = item
        log.info("  ✅ 신규 성분 설명 생성 완료")
    except Exception as e:
        log.warning(f"  ⚠️  신규 성분 설명 생성 실패: {e}")
    return result


# ─────────────────────────────────────────────
# Step 3: 네이버 데이터랩 API
# ─────────────────────────────────────────────
def fetch_naver_trend(ingredient_names: list, category: str) -> dict:
    """
    네이버 데이터랩 쇼핑인사이트 API 호출.
    Returns: { "성분명": score(0~100) }
    """
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        log.warning(f"⚠️  네이버 API 키 미설정 → 네이버 점수 0으로 처리")
        return {}

    if not ingredient_names:
        return {}

    end_date   = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    cat_code   = NAVER_CATEGORIES.get(category, NAVER_CATEGORIES["cosmetics"])
    scores     = {}

    for i in range(0, len(ingredient_names), 5):  # API: 한 번에 최대 5개
        batch = ingredient_names[i: i + 5]
        body = {
            "startDate": start_date,
            "endDate":   end_date,
            "timeUnit":  "month",
            "category":  cat_code,
            "keyword":   [{"name": n, "param": [n]} for n in batch]
        }
        headers = {
            "X-Naver-Client-Id":     NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
            "Content-Type":          "application/json",
        }
        try:
            resp = requests.post(NAVER_API_URL, headers=headers, json=body, timeout=10)
            resp.raise_for_status()
            for item in resp.json().get("results", []):
                data = item.get("data", [])
                if data:
                    scores[item["title"]] = max(p.get("ratio", 0) for p in data)
            time.sleep(0.3)
        except Exception as e:
            log.warning(f"  ⚠️  네이버 API 오류 (배치 {i}): {e}")

    log.info(f"  ✅ 네이버 트렌드 [{category}]: {len(scores)}개 점수 수집")
    return scores


# ─────────────────────────────────────────────
# Step 4 & 5: 점수 계산 및 JSON 생성
# ─────────────────────────────────────────────
def calc_score(oy_count: int, oy_max: int, naver_score: float) -> int:
    oy_norm = (oy_count / max(oy_max, 1)) * 100
    return min(100, max(1, round(oy_norm * WEIGHT_OLIVEYOUNG + naver_score * WEIGHT_NAVER)))


def calc_direction(current: int, prev) -> str:
    if prev is None:
        return "up"
    diff = current - prev
    if diff >= HOT_THRESHOLD:   return "hot"
    elif diff >= UP_THRESHOLD:  return "up"
    elif diff <= DOWN_THRESHOLD: return "down"
    return "stable"


def load_prev_scores() -> dict:
    if not OUTPUT_FILE.exists():
        return {}
    try:
        data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        return {i["id"]: i["score"] for i in data.get("ingredients", [])}
    except Exception:
        return {}


def build_output(master, gemini_results, naver_by_cat, prev_scores) -> dict:
    oy_max = max((v["count"] for v in gemini_results.values()), default=1)
    final  = []

    for item in master:
        name, cat = item["name"], item["category"]
        oy_count = next(
            (v["count"] for g_name, v in gemini_results.items()
             if g_name in name or name in g_name), 0
        )
        naver_score = naver_by_cat.get(cat, {}).get(name, 0.0)
        score = calc_score(oy_count, oy_max, naver_score)
        final.append({
            **item,
            "score":     score,
            "direction": calc_direction(score, prev_scores.get(item["id"])),
        })

    # 신규 Gemini 발견 성분 추가
    master_names = {i["name"] for i in master}
    for g_name, g_val in gemini_results.items():
        if not g_val.get("is_new"):
            continue
        if any(g_name in mn or mn in g_name for mn in master_names):
            continue
        
        cat = g_val.get("category", "cosmetics")
        meta = g_val.get("gemini_meta", {})
        score = calc_score(g_val["count"], oy_max, naver_by_cat.get(cat, {}).get(g_name, 0.0))
        
        final.append({
            "id":        re.sub(r"[^\w]+", "-", g_name).strip("-").lower(),
            "category":  cat,
            "emoji":     meta.get("emoji", "🆕"),
            "name":      g_name,
            "score":     score,
            "direction": "hot",
            "shortDesc": meta.get("shortDesc", "Gemini 발견 신규 트렌드 성분"),
            "desc":      meta.get("desc", ""),
            "products":  [],
            "priceRange": meta.get("priceRange", "데이터 수집 중"),
            "caution":   meta.get("caution", "신규 성분이므로 소량 테스트 사입 권장."),
        })
        log.info(f"  🆕 신규 성분 추가: {g_name} ({cat}, 점수: {score})")

    final.sort(key=lambda x: x["score"], reverse=True)
    # UTC 기준 ISO 포맷팅 + Z 접미사 추가로 프론트엔드 로컬 타임 변환 지원
    utc_now = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    return {"updated_at": utc_now, "ingredients": final}


# ─────────────────────────────────────────────
# 메인
# ─────────────────────────────────────────────
def main():
    log.info("=" * 55)
    log.info("📡 성분 트렌드 파이프라인 시작 (화장품 & 건기식)")
    log.info("=" * 55)

    master      = json.loads(MASTER_FILE.read_text(encoding="utf-8"))
    prev_scores = load_prev_scores()
    log.info(f"📚 마스터 성분: {len(master)}개 | 이전 기록: {len(prev_scores)}개")

    # Step 1: 올리브영 스크래핑 (화장품 + 건기식)
    cosmetics_names = scrape_oliveyoung("cosmetics")
    health_names    = scrape_oliveyoung("health")

    # Step 2: Gemini 성분 추출
    master_names    = [i["name"] for i in master]
    gemini_results  = extract_ingredients_with_gemini(cosmetics_names, health_names, master_names)

    # 네이버 API 쿼리 목록 준비
    names_cos = [i["name"] for i in master if i["category"] == "cosmetics"]
    names_hlt = [i["name"] for i in master if i["category"] == "health"]
    
    for g_name, g_val in gemini_results.items():
        if g_val.get("is_new"):
            cat = g_val.get("category", "cosmetics")
            (names_cos if cat == "cosmetics" else names_hlt).append(g_name)

    # Step 3: 네이버 데이터랩
    log.info("🔍 네이버 데이터랩 API 호출 중...")
    naver_by_cat = {
        "cosmetics": fetch_naver_trend(names_cos, "cosmetics"),
        "health":    fetch_naver_trend(names_hlt, "health"),
    }

    # Step 4 & 5: 조립 및 저장
    log.info("📊 데이터 조립 중...")
    output = build_output(master, gemini_results, naver_by_cat, prev_scores)
    OUTPUT_FILE.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    # Step 6: 신규 성분을 마스터 파일에 영구 저장
    new_master_added = False
    for g_name, g_val in gemini_results.items():
        if g_val.get("is_new"):
            cat = g_val.get("category", "cosmetics")
            meta = g_val.get("gemini_meta", {})
            new_item = {
                "id":        re.sub(r"[^\w]+", "-", g_name).strip("-").lower(),
                "category":  cat,
                "emoji":     meta.get("emoji", "🆕"),
                "name":      g_name,
                "shortDesc": meta.get("shortDesc", "Gemini 발견 신규 트렌드 성분"),
                "desc":      meta.get("desc", ""),
                "priceRange": meta.get("priceRange", "데이터 수집 중"),
                "caution":   meta.get("caution", "신규 성분이므로 소량 테스트 사입 권장.")
            }
            master.append(new_item)
            new_master_added = True
            log.info(f"✨ [마스터 업데이트] 신규 성분 자동 추가: {g_name} ({cat})")

    if new_master_added:
        MASTER_FILE.write_text(json.dumps(master, ensure_ascii=False, indent=2), encoding="utf-8")
        log.info("💾 ingredients_master.json 덮어쓰기 완료!")

    log.info("=" * 55)
    log.info(f"✅ 완료! trend_data.json 생성됨")
    log.info(f"   성분 수: {len(output['ingredients'])}개")
    log.info(f"   갱신 시각: {output['updated_at']}")
    log.info("=" * 55)


if __name__ == "__main__":
    main()
