/* 간이 퍼스널컬러 테스트: 10문항 -> 4계절 타입 -> 어울리는 색 + 선물 방향.
 * data/pc-questions.json 을 불러온다. 서버/로그인 불필요.
 * 결과는 #result=spring 해시로 공유. 공유 링크로 들어오면 결과부터 표시. */
(function () {
  var Q = [], T = {}, answers = {}, idx = 0;
  var ORDER = ["spring", "summer", "autumn", "winter"];
  var GUIDE = "guides/personal-color-gift.html";

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    var total = Q.length, q = Q[idx];
    el("pcProgressBar").style.width = Math.round(idx / total * 100) + "%";
    el("pcProgressText").textContent = (idx + 1) + " / " + total;
    el("pcQuestion").textContent = q.q;
    el("pcA").textContent = q.a;
    el("pcB").textContent = q.b;
    el("pcPrev").style.visibility = idx === 0 ? "hidden" : "visible";
    el("pcA").classList.toggle("sel", answers[idx] === "a");
    el("pcB").classList.toggle("sel", answers[idx] === "b");
  }

  function choose(v) {
    answers[idx] = v;
    if (idx < Q.length - 1) { idx++; render(); }
    else finish();
  }

  function computeType() {
    var warm = 0, wcTot = 0, clear = 0, cmTot = 0;
    Q.forEach(function (q, i) {
      var pick = answers[i];
      if (q.axis === "wc") { wcTot++; if (pick === "a") warm++; }
      else if (q.axis === "cm") { cmTot++; if (pick === "a") clear++; }
    });
    var isWarm = warm >= (wcTot / 2);
    var isClear = clear >= (cmTot / 2);
    var key = isWarm ? (isClear ? "spring" : "autumn") : (isClear ? "winter" : "summer");
    return key;
  }

  function chips(colors) {
    return '<div class="pc-chips">' + colors.map(function (c) {
      return '<span class="pc-chip">' + esc(c) + '</span>';
    }).join("") + '</div>';
  }

  function typeGrid(current) {
    return '<div class="mt-grid pc-grid">' + ORDER.map(function (k) {
      return '<a href="' + GUIDE + '#' + k + '"' + (k === current ? ' class="cur"' : '') +
        ' data-t="' + k + '">' + esc(T[k].name.split(" ")[0] + T[k].name.split(" ")[1]) + '</a>';
    }).join("") + '</div>';
  }

  function showResult(key, pushHash) {
    var t = T[key];
    if (!t) return;
    try { gtag && gtag("event", "pc_test_complete", { pc_type: key }); } catch (e) {}
    if (pushHash) { try { history.replaceState(null, "", "#result=" + key); } catch (e) {} }

    el("pcLoading").style.display = "none";
    el("pcCard").style.display = "none";
    var r = el("pcResult");
    r.style.display = "block";
    r.innerHTML =
      '<div class="mt-result-type pc-result-type">' + esc(t.name) + '</div>' +
      '<p class="mt-result-nick">' + esc(t.line) + '</p>' +
      '<div class="pc-sec-lab">잘 어울리는 색</div>' + chips(t.colors) +
      '<div class="pc-sec-lab">피하면 좋은 색</div>' + chips(t.avoid) +
      '<p class="mt-result-lead">' + esc(t.gift) + '</p>' +
      '<a class="mt-result-btn" href="' + GUIDE + '#' + key + '">이 톤에 맞는 선물 자세히 보기 →</a>' +
      '<div class="mt-share-row">' +
        '<button type="button" id="pcShare">결과 공유하기</button>' +
        '<button type="button" id="pcRetry">다시 하기</button>' +
      '</div>' +
      '<p class="mt-teaser">MBTI 테스트도 같이 해보면 선물 힌트가 두 배가 됩니다. <a href="test.html">MBTI 간단 테스트 →</a></p>' +
      '<div class="mt-grid-head">다른 톤 결과도 궁금하다면</div>' +
      typeGrid(key) +
      '<p class="mt-disclaimer">화면 색은 기기마다 달라 정확하지 않아요. 재미로 참고하고, 정확한 진단은 전문 퍼스널컬러 컨설팅을 이용하세요.</p>';

    el("pcRetry").addEventListener("click", function () {
      answers = {}; idx = 0;
      try { history.replaceState(null, "", location.pathname); } catch (e) {}
      r.style.display = "none"; el("pcCard").style.display = "block"; render();
      window.scrollTo(0, 0);
    });
    el("pcShare").addEventListener("click", function () {
      var url = location.origin + location.pathname + "#result=" + key;
      var text = "내 퍼스널컬러는 " + t.name + " — 어울리는 색이랑 선물까지 보기";
      try { gtag && gtag("event", "pc_test_share", { pc_type: key }); } catch (e) {}
      if (navigator.share) navigator.share({ title: "간이 퍼스널컬러 테스트", text: text, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () {
        var b = el("pcShare"); b.textContent = "링크 복사됨!";
        setTimeout(function () { b.textContent = "결과 공유하기"; }, 1600);
      });
    });
    Array.prototype.forEach.call(r.querySelectorAll(".pc-grid a"), function (a) {
      a.addEventListener("click", function () {
        try { gtag && gtag("event", "pc_test_type_click", { pc_type: a.getAttribute("data-t") }); } catch (e) {}
      });
    });
    window.scrollTo(0, 0);
  }

  function finish() { showResult(computeType(), true); }

  function checkHash() {
    var m = (location.hash || "").match(/result=([a-z]+)/i);
    if (m && T[m[1].toLowerCase()]) { showResult(m[1].toLowerCase(), false); return true; }
    return false;
  }

  function init() {
    fetch("data/pc-questions.json").then(function (res) { return res.json(); }).then(function (d) {
      Q = d.questions; T = d.types;
      if (checkHash()) return;
      el("pcLoading").style.display = "none";
      el("pcCard").style.display = "block";
      el("pcA").addEventListener("click", function () { choose("a"); });
      el("pcB").addEventListener("click", function () { choose("b"); });
      el("pcPrev").addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
      render();
    }).catch(function () {
      el("pcLoading").textContent = "문항을 불러오지 못했어요. 새로고침 해주세요.";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
