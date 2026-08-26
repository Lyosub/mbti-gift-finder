function initGiftCards() {
  document.querySelectorAll(".gift-card").forEach(function (card) {
    card.addEventListener("click", function () {
      card.classList.toggle("flipped");
    });
  });
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
