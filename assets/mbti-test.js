/* 간단 MBTI 테스트: 12문항 -> 4글자 유형 -> 해당 유형 선물 페이지로 연결.
 * data/mbti-questions.json 을 불러와서 렌더한다. 서버/로그인 불필요.
 * 결과는 #result=INTJ 해시로 공유. 공유 링크로 들어오면 결과부터 표시. */
(function () {
  var Q = [], NICK = {}, answers = {}, idx = 0;

  var TYPES = [
    "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"
  ];
  var SLUG = {};
  TYPES.forEach(function (t) { SLUG[t] = t.toLowerCase(); });

  var AXES = [
    { a: "E", b: "I", la: "외향", lb: "내향" },
    { a: "S", b: "N", la: "감각", lb: "직관" },
    { a: "T", b: "F", la: "사고", lb: "감정" },
    { a: "J", b: "P", la: "계획", lb: "즉흥" }
  ];

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    var total = Q.length;
    var q = Q[idx];
    var pct = Math.round((idx) / total * 100);
    el("mtProgressBar").style.width = pct + "%";
    el("mtProgressText").textContent = (idx + 1) + " / " + total;
    el("mtQuestion").textContent = q.q;
    el("mtA").textContent = q.a;
    el("mtB").textContent = q.b;
    el("mtPrev").style.visibility = idx === 0 ? "hidden" : "visible";
    el("mtA").classList.toggle("sel", answers[idx] === "a");
    el("mtB").classList.toggle("sel", answers[idx] === "b");
  }

  function choose(v) {
    answers[idx] = v;
    if (idx < Q.length - 1) { idx++; render(); }
    else finish();
  }

  function computeType() {
    var score = { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 };
    Q.forEach(function (q, i) {
      var pick = answers[i];
      if (pick === "a") score[q.axis[0]]++;
      else if (pick === "b") score[q.axis[1]]++;
    });
    var type =
      (score.E >= score.I ? "E" : "I") +
      (score.S >= score.N ? "S" : "N") +
      (score.T >= score.F ? "T" : "F") +
      (score.J >= score.P ? "J" : "P");
    return { type: type, score: score };
  }

  function axisBars(score) {
    return '<div class="mt-axes">' + AXES.map(function (ax) {
      var av = score ? (score[ax.a] || 0) : null;
      var bv = score ? (score[ax.b] || 0) : null;
      var tot = (av != null) ? (av + bv) : 0;
      var aPct = tot ? Math.round(av / tot * 100) : 50;
      var aWin = (av != null) && av >= bv;
      return '<div class="mt-axis">' +
        '<span class="mt-axis-lab' + (aWin ? " win" : "") + '">' + ax.a + ' ' + ax.la + '</span>' +
        '<span class="mt-axis-track"><span class="mt-axis-fill" style="width:' + aPct + '%"></span></span>' +
        '<span class="mt-axis-lab' + (!aWin ? " win" : "") + '">' + ax.lb + ' ' + ax.b + '</span>' +
      '</div>';
    }).join("") + '</div>';
  }

  function typeGrid(current) {
    return '<div class="mt-grid">' + TYPES.map(function (t) {
      return '<a href="types/' + SLUG[t] + '.html"' +
        (t === current ? ' class="cur"' : '') +
        ' data-t="' + t + '">' + t + '</a>';
    }).join("") + '</div>';
  }

  function showResult(type, score, pushHash) {
    var nick = NICK[type] || "";
    try { gtag && gtag("event", "mbti_test_complete", { mbti_type: type }); } catch (e) {}
    if (pushHash) {
      try { history.replaceState(null, "", "#result=" + type); } catch (e) {}
    }

    el("mtLoading").style.display = "none";
    el("mtCard").style.display = "none";
    var r = el("mtResult");
    r.style.display = "block";
    r.innerHTML =
      '<div class="mt-result-type">' + esc(type) + '</div>' +
      '<div class="mt-result-nick">' + esc(nick) + '</div>' +
      axisBars(score) +
      '<p class="mt-result-lead">이 유형에게 잘 맞는 선물을 성향·예산·상황별로 정리해뒀어요.</p>' +
      '<a class="mt-result-btn" href="types/' + SLUG[type] + '.html">' + esc(type) + ' 선물 추천 BEST 8 보기 →</a>' +
      '<div class="mt-share-row">' +
        '<button type="button" id="mtShare">결과 공유하기</button>' +
        '<button type="button" id="mtRetry">다시 하기</button>' +
      '</div>' +
      '<p class="mt-teaser">연인·친구 유형도 같이 테스트해서 서로에게 선물 힌트를 주고받아 보세요.</p>' +
      '<div class="mt-grid-head">다른 유형 선물도 궁금하다면</div>' +
      typeGrid(type) +
      '<p class="mt-disclaimer">간이 테스트예요. 정확한 검사는 전문 기관의 MBTI 검사를 이용하세요.</p>';

    el("mtRetry").addEventListener("click", function () {
      answers = {}; idx = 0;
      try { history.replaceState(null, "", location.pathname); } catch (e) {}
      r.style.display = "none"; el("mtCard").style.display = "block"; render();
      window.scrollTo(0, 0);
    });

    el("mtShare").addEventListener("click", function () {
      var url = location.origin + location.pathname + "#result=" + type;
      var text = "내 MBTI는 " + type + (nick ? " · " + nick : "") + " — 유형별 선물 추천까지 보기";
      try { gtag && gtag("event", "mbti_test_share", { mbti_type: type }); } catch (e) {}
      if (navigator.share) {
        navigator.share({ title: "MBTI 간단 테스트", text: text, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var b = el("mtShare"); b.textContent = "링크 복사됨!";
          setTimeout(function () { b.textContent = "결과 공유하기"; }, 1600);
        });
      }
    });

    Array.prototype.forEach.call(r.querySelectorAll(".mt-grid a"), function (a) {
      a.addEventListener("click", function () {
        try { gtag && gtag("event", "mbti_test_type_click", { mbti_type: a.getAttribute("data-t") }); } catch (e) {}
      });
    });

    window.scrollTo(0, 0);
  }

  function finish() {
    var res = computeType();
    showResult(res.type, res.score, true);
  }

  function checkHash() {
    var m = (location.hash || "").match(/result=([A-Za-z]{4})/);
    if (!m) return false;
    var t = m[1].toUpperCase();
    if (SLUG[t]) { showResult(t, null, false); return true; }
    return false;
  }

  function init() {
    fetch("data/mbti-questions.json").then(function (res) { return res.json(); }).then(function (d) {
      Q = d.questions; NICK = d.nicknames;
      if (checkHash()) return;
      el("mtLoading").style.display = "none";
      el("mtCard").style.display = "block";
      el("mtA").addEventListener("click", function () { choose("a"); });
      el("mtB").addEventListener("click", function () { choose("b"); });
      el("mtPrev").addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
      render();
    }).catch(function () {
      el("mtLoading").textContent = "문항을 불러오지 못했어요. 새로고침 해주세요.";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
