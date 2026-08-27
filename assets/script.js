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

var lastPicks = [];

function renderGiftGrid(pool, containerId, count) {
  var container = document.getElementById(containerId);
  if (!container) return;
  count = count || 5;
  var picks = pickWeekly(pool, count);
  lastPicks = picks;

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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  var words = text.split("");
  var line = "";
  var lines = [];
  for (var i = 0; i < words.length; i++) {
    var test = line + words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach(function (l, idx) {
    ctx.fillText(l, x, y + idx * lineHeight);
  });
  return lines.length;
}

function drawTasteCard(canvas, typeCode, typeNick, color) {
  var W = 900, H = 1200;
  canvas.width = W;
  canvas.height = H;
  var ctx = canvas.getContext("2d");

  var grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#141416");
  grad.addColorStop(1, "#1d1d21");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(W - 80, 120, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = color;
  ctx.font = "700 30px sans-serif";
  ctx.fillText("MBTI 선물 취향 카드", 60, 110);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 130px sans-serif";
  ctx.fillText(typeCode, 60, 300);

  ctx.fillStyle = "#c7c7cc";
  ctx.font = "500 34px sans-serif";
  ctx.fillText(typeNick, 60, 355);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(60, 410);
  ctx.lineTo(W - 60, 410);
  ctx.stroke();

  ctx.fillStyle = "#9c9ca3";
  ctx.font = "700 24px sans-serif";
  ctx.fillText("이번 주 나에게 어울리는 선물", 60, 470);

  var names = lastPicks.slice(0, 3).map(function (p) { return p.name; });
  var y = 540;
  names.forEach(function (name, i) {
    ctx.fillStyle = color;
    ctx.font = "800 32px sans-serif";
    ctx.fillText((i + 1) + ".", 60, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 32px sans-serif";
    var used = wrapText(ctx, name, 110, y, W - 170, 40);
    y += Math.max(used, 1) * 40 + 40;
  });

  ctx.fillStyle = "#6b6b70";
  ctx.font = "600 26px sans-serif";
  ctx.fillText("mbtigift.com 에서 내 유형 선물 보기", 60, H - 60);
}

function initTasteCard(typeCode, typeNick, color) {
  var btn = document.getElementById("cardBtn");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var canvas = document.createElement("canvas");
    drawTasteCard(canvas, typeCode, typeNick, color);
    canvas.toBlob(function (blob) {
      var file = new File([blob], typeCode.toLowerCase() + "-gift-card.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: typeCode + " 선물 취향 카드",
          text: "나는 " + typeCode + "(" + typeNick + ") — 내 선물 취향 카드"
        }).catch(function () {});
      } else {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = typeCode.toLowerCase() + "-gift-card.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        btn.textContent = "저장됨! (인스타에 올려보세요)";
        setTimeout(function () { btn.textContent = "선물 카드 만들기"; }, 2000);
      }
    }, "image/png");
  });
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
