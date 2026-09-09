/* 제휴 링크 + 광고 로더 — 한 곳에서 관리한다.
 *
 * [쿠팡 파트너스]  채널 아이디: mbtigift (2026-09-09 생성, 최종 승인 대기 중)
 *   승인 전: 상품 버튼은 쿠팡 통합검색으로 연결된다(수익 없음, rel=sponsored nofollow).
 *   승인 후: COUPANG.enabled = true 로 바꾼다.
 *   ※ 주의: 지금 couLink()가 만드는 raw 검색 URL(coupang.com/np/search?...&traceid=)은
 *     쿠팡 파트너스가 추적·정산하지 않는다. 승인 후 아래 중 하나로 재작성 필요:
 *       (a) 쿠팡 파트너스 "자동 링크(다이나믹)" 스크립트를 페이지에 삽입
 *       (b) 딥링크 API로 빌드 시 link.coupang.com/a/... 추적 링크 생성
 *     그때 COUPANG.trackingCode(현재 채널 아이디 mbtigift)를 subId로 넘긴다.
 *
 * [여행 제휴 — 클룩 / 아고다 / 마이리얼트립]
 *   승인 전: 여행 버튼은 각 파트너 검색/홈으로 연결된다(수익 없음, rel=sponsored nofollow).
 *   승인 후: TRAVEL.enabled 를 true 로 바꾸고 각 파트너의 제휴 파라미터를 채우면
 *           [data-travel] 링크가 전 페이지에서 한 번에 제휴 링크로 바뀐다.
 *   - 클룩(Klook): TRAVEL.klook.aid  (Klook Affiliate 승인 후 발급되는 aid)
 *   - 아고다(Agoda): TRAVEL.agoda.cid (Agoda Partners cid)
 *   - 마이리얼트립: TRAVEL.myrealtrip.ref (제휴 발급 파라미터)
 *   국내 제휴 네트워크(링크프라이스/텐핑 등) 경유 시엔 그 네트워크가 준 링크를
 *   TRAVEL.<partner>.override 에 통째로 넣으면 그 링크를 그대로 쓴다(검색어 무시).
 *
 * [구글 애드센스]
 *   승인 전: ADSENSE.client 를 비워두면 광고 스크립트를 아예 로드하지 않는다(빈 광고/정책 위반 방지).
 *   승인 후: ADSENSE.client 에 'ca-pub-xxxxxxxxxxxxxxxx' 를 넣으면 .ad-slot 들이 자동으로 채워진다.
 *           (슬롯별 광고 단위 ID는 각 .ad-slot 의 data-ad-slot 속성에 넣는다)
 */
(function () {
  var COUPANG = {
    enabled: false,
    trackingCode: "mbtigift"   // 쿠팡 파트너스 채널 아이디 (최종 승인 후 링크 방식 재작성 필요 — 상단 주석 참고)
  };
  var TRAVEL = {
    enabled: false,
    klook: { aid: "", override: "" },
    agoda: { cid: "", override: "" },
    myrealtrip: { ref: "", override: "" }
  };
  var ADSENSE = {
    client: "ca-pub-2249886041953163"
  };

  // 쿠팡 링크 생성 — 상품명(검색어)을 받아 URL을 돌려준다.
  window.couLink = function (query) {
    var base = "https://www.coupang.com/np/search?component=&q=" + encodeURIComponent(query || "") + "&channel=user";
    if (COUPANG.enabled && COUPANG.trackingCode) {
      base += "&traceid=" + encodeURIComponent(COUPANG.trackingCode);
    }
    return base;
  };

  // 여행 제휴 링크 생성 — 파트너 키와 검색어를 받아 URL을 돌려준다.
  window.travelLink = function (partner, query) {
    var q = encodeURIComponent(query || "");
    var p = TRAVEL[partner] || {};
    if (TRAVEL.enabled && p.override) return p.override;
    if (partner === "klook") {
      var k = "https://www.klook.com/ko/search/?query=" + q;
      if (TRAVEL.enabled && p.aid) k += "&aid=" + encodeURIComponent(p.aid);
      return k;
    }
    if (partner === "agoda") {
      var a = "https://www.agoda.com/ko-kr/search?q=" + q;
      if (TRAVEL.enabled && p.cid) a += "&cid=" + encodeURIComponent(p.cid);
      return a;
    }
    if (partner === "myrealtrip") {
      var m = "https://www.myrealtrip.com/search?q=" + q;
      if (TRAVEL.enabled && p.ref) m += "&ref=" + encodeURIComponent(p.ref);
      return m;
    }
    return "https://www.google.com/search?q=" + q;
  };

  window.COUPANG_DISCLOSURE = COUPANG.enabled
    ? "이 페이지의 상품 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
    : "상품 링크는 현재 쿠팡 통합검색으로 연결됩니다. 파트너스 승인 후 제휴 링크로 교체되며, 그 경우 구매 시 일정액의 수수료가 발생할 수 있습니다.";

  window.TRAVEL_DISCLOSURE = TRAVEL.enabled
    ? "이 페이지의 여행 예약 링크(숙소·투어·입장권 등)는 제휴 활동의 일환으로, 예약 시 일정액의 수수료를 제공받을 수 있습니다."
    : "";

  // 페이지에 심어둔 [data-cou-q] / [data-travel] 링크들의 href 를 채운다.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-cou-q]").forEach(function (a) {
      a.setAttribute("href", window.couLink(a.getAttribute("data-cou-q")));
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "sponsored nofollow noopener");
    });

    document.querySelectorAll("[data-travel]").forEach(function (a) {
      var partner = a.getAttribute("data-travel");
      var q = a.getAttribute("data-q") || a.textContent || "";
      a.setAttribute("href", window.travelLink(partner, q));
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "sponsored nofollow noopener");
    });

    var disc = document.getElementById("affDisclosure");
    if (disc) {
      var lines = [window.COUPANG_DISCLOSURE];
      if (window.TRAVEL_DISCLOSURE) lines.push(window.TRAVEL_DISCLOSURE);
      else if (document.querySelector("[data-travel]")) {
        lines.push("여행 예약 링크는 현재 각 서비스(클룩·아고다·마이리얼트립 등) 검색으로 연결됩니다. 제휴 승인 후 예약 시 일정액의 수수료가 발생할 수 있습니다.");
      }
      disc.textContent = lines.join(" ");
    }

    // 애드센스: 로더 스크립트는 각 페이지 <head>에 정적으로 들어 있다(자동 광고).
    // 여기서는 명시적 광고 단위(.ad-slot[data-ad-slot="숫자"])만 채운다.
    // 아직 광고 단위 ID가 없으면(승인 전/자동광고만 사용) .ad-slot 은 숨긴다.
    var hasClient = ADSENSE.client && /^ca-pub-\d+$/.test(ADSENSE.client);
    document.querySelectorAll(".ad-slot").forEach(function (slot) {
      var unit = slot.getAttribute("data-ad-slot");
      if (hasClient && unit && /^\d+$/.test(unit)) {
        var ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.setAttribute("data-ad-client", ADSENSE.client);
        ins.setAttribute("data-ad-slot", unit);
        ins.setAttribute("data-ad-format", "auto");
        ins.setAttribute("data-full-width-responsive", "true");
        slot.appendChild(ins);
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      } else {
        slot.style.display = "none";
      }
    });
  });
})();
