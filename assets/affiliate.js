/* 제휴 링크 + 광고 로더 — 한 곳에서 관리한다.
 *
 * [쿠팡 파트너스]
 *   승인 전: 상품 버튼은 쿠팡 통합검색으로 연결된다(수익 없음, rel=sponsored nofollow).
 *   승인 후: 아래 COUPANG.enabled 를 true 로 바꾸고, 파트너스에서 발급한
 *           서브아이디/트래킹코드를 COUPANG.trackingCode 에 넣으면 전 페이지 링크가 한 번에 바뀐다.
 *
 * [구글 애드센스]
 *   승인 전: ADSENSE.client 를 비워두면 광고 스크립트를 아예 로드하지 않는다(빈 광고/정책 위반 방지).
 *   승인 후: ADSENSE.client 에 'ca-pub-xxxxxxxxxxxxxxxx' 를 넣으면 .ad-slot 들이 자동으로 채워진다.
 *           (슬롯별 광고 단위 ID는 각 .ad-slot 의 data-ad-slot 속성에 넣는다)
 */
(function () {
  var COUPANG = {
    enabled: false,
    trackingCode: "AF6167749"
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
  window.COUPANG_DISCLOSURE = COUPANG.enabled
    ? "이 페이지의 상품 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
    : "상품 링크는 현재 쿠팡 통합검색으로 연결됩니다. 파트너스 승인 후 제휴 링크로 교체되며, 그 경우 구매 시 일정액의 수수료가 발생할 수 있습니다.";

  // 페이지에 심어둔 [data-cou-q] 버튼들의 href 를 채운다.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-cou-q]").forEach(function (a) {
      a.setAttribute("href", window.couLink(a.getAttribute("data-cou-q")));
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "sponsored nofollow noopener");
    });
    var disc = document.getElementById("affDisclosure");
    if (disc) disc.textContent = window.COUPANG_DISCLOSURE;

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
