/* 간단 MBTI 테스트: 12문항 -> 4글자 유형 -> 해당 유형 선물 페이지로 연결.
 * data/mbti-questions.json 을 불러와서 렌더한다. 서버/로그인 불필요. */
(function () {
  var Q = [], NICK = {}, answers = {}, idx = 0;

  var SLUG = {
    INTJ:"intj",INTP:"intp",ENTJ:"entj",ENTP:"entp",INFJ:"infj",INFP:"infp",ENFJ:"enfj",ENFP:"enfp",
    ISTJ:"istj",ISFJ:"isfj",ESTJ:"estj",ESFJ:"esfj",ISTP:"istp",ISFP:"isfp",ESTP:"estp",ESFP:"esfp"
  };

  function el(id) { return document.getElementById(id); }

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
    // 이전 선택 표시
    el("mtA").classList.toggle("sel", answers[idx] === "a");
    el("mtB").classList.toggle("sel", answers[idx] === "b");
  }

  function choose(v) {
    answers[idx] = v;
    if (idx < Q.length - 1) { idx++; render(); }
    else finish();
  }

  function finish() {
    var score = { E:0,I:0,S:0,N:0,T:0,F:0,J:0,P:0 };
    Q.forEach(function (q, i) {
      var pick = answers[i];
      var pair = q.axis; // "EI" 등
      if (pick === "a") score[pair[0]]++;
      else if (pick === "b") score[pair[1]]++;
    });
    var type =
      (score.E >= score.I ? "E" : "I") +
      (score.S >= score.N ? "S" : "N") +
      (score.T >= score.F ? "T" : "F") +
      (score.J >= score.P ? "J" : "P");
    var nick = NICK[type] || "";
    try { gtag && gtag("event", "mbti_test_complete", { mbti_type: type }); } catch (e) {}

    el("mtCard").style.display = "none";
    var r = el("mtResult");
    r.style.display = "block";
    r.innerHTML =
      '<div class="mt-result-type">' + type + '</div>' +
      '<div class="mt-result-nick">' + nick + '</div>' +
      '<p class="mt-result-lead">이 유형에게 잘 맞는 선물을 성향·예산·상황별로 정리해뒀어요.</p>' +
      '<a class="mt-result-btn" href="types/' + SLUG[type] + '.html">' + type + ' 선물 추천 BEST 8 보기 →</a>' +
      '<div class="mt-result-sub">' +
        '<a href="#" id="mtRetry">다시 하기</a> · ' +
        '<a href="index.html">16유형 전체 보기</a>' +
      '</div>' +
      '<p class="mt-disclaimer">간이 테스트예요. 정확한 검사는 전문 기관의 MBTI 검사를 이용하세요.</p>';
    el("mtRetry").addEventListener("click", function (e) {
      e.preventDefault(); answers = {}; idx = 0;
      r.style.display = "none"; el("mtCard").style.display = "block"; render();
    });
    window.scrollTo(0, 0);
  }

  function init() {
    fetch("data/mbti-questions.json").then(function (res) { return res.json(); }).then(function (d) {
      Q = d.questions; NICK = d.nicknames;
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
