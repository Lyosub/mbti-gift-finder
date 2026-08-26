function initGiftCards() {
  document.querySelectorAll(".gift-card").forEach(function (card) {
    card.addEventListener("click", function () {
      card.classList.toggle("flipped");
    });
  });
}

function weekIndex() {
  var now = new Date();
  var startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  var diffDays = Math.floor((today - startOfYear) / 86400000);
  return now.getUTCFullYear() * 100 + Math.floor(diffDays / 7);
}

function weekLabel() {
  var now = new Date();
  var startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  var diffDays = Math.floor((today - startOfYear) / 86400000);
  var week = Math.floor(diffDays / 7) + 1;
  return now.getUTCFullYear() + "년 " + week + "주차";
}

function pickWeekly(pool, count) {
  var start = weekIndex() % pool.length;
  var picked = [];
  for (var i = 0; i < count; i++) {
    picked.push(pool[(start + i) % pool.length]);
  }
  return picked;
}

function renderGiftGrid(pool, containerId, count) {
  var container = document.getElementById(containerId);
  if (!container) return;
  count = count || 5;
  var picks = pickWeekly(pool, count);

  var labelEl = document.getElementById("weekLabel");
  if (labelEl) labelEl.textContent = weekLabel();

  container.innerHTML = picks.map(function (g, i) {
    return (
      '<div class="gift-card"><div class="gift-inner">' +
        '<div class="gift-face gift-front"><span>선물 ' + (i + 1) + '</span><span class="tap-hint">눌러서 확인</span></div>' +
        '<div class="gift-face gift-back">' +
          '<span class="name">' + g.name + '</span>' +
          '<span class="reason">' + g.reason + '</span>' +
          '<a class="buy" href="https://www.coupang.com/np/search?q=' + encodeURIComponent(g.query) + '" target="_blank" rel="noopener sponsored">쿠팡에서 보기 →</a>' +
        '</div>' +
      '</div></div>'
    );
  }).join("");

  initGiftCards();
}

function initShare(typeCode, typeNick) {
  var shareBtn = document.getElementById("shareBtn");
  var copyBtn = document.getElementById("copyBtn");

  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url = window.location.href;
      var text = "나는 " + typeCode + "(" + typeNick + ") - 나한테 어울리는 선물 뭔지 보러 가기";
      if (navigator.share) {
        navigator.share({ title: text, url: url }).catch(function () {});
      } else {
        navigator.clipboard.writeText(url).then(function () {
          shareBtn.textContent = "링크 복사됨!";
          setTimeout(function () { shareBtn.textContent = "공유하기"; }, 1500);
        });
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(window.location.href).then(function () {
        copyBtn.textContent = "복사됨!";
        setTimeout(function () { copyBtn.textContent = "링크 복사"; }, 1500);
      });
    });
  }
}

function initRandomButton() {
  var btn = document.getElementById("randomBtn");
  if (!btn) return;
  var types = [
    "istj","isfj","estj","esfj",
    "istp","isfp","estp","esfp",
    "intj","intp","entj","entp",
    "infj","infp","enfj","enfp"
  ];
  btn.addEventListener("click", function () {
    var pick = types[Math.floor(Math.random() * types.length)];
    window.location.href = "types/" + pick + ".html";
  });
}
