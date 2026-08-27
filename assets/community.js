var VOTED_KEY = "mbtigift_voted_ids";

function isConfigured() {
  return SUPABASE_URL.indexOf("__") !== 0 && SUPABASE_ANON_KEY.indexOf("__") !== 0;
}

function getVotedIds() {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function markVoted(id) {
  var ids = getVotedIds();
  ids.push(id);
  try { localStorage.setItem(VOTED_KEY, JSON.stringify(ids)); } catch (e) {}
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initCommunityForm() {
  var form = document.getElementById("reportForm");
  if (!form) return;

  var kindInput = document.getElementById("kindInput");
  var kindButtons = document.querySelectorAll(".kind-toggle button");
  kindButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      kindButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      kindInput.value = btn.getAttribute("data-kind");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = document.getElementById("formMsg");

    if (!isConfigured()) {
      msg.textContent = "아직 커뮤니티 기능 준비 중이에요. 곧 열릴게요!";
      return;
    }

    var payload = {
      mbti_type: document.getElementById("typeInput").value,
      kind: kindInput.value,
      title: document.getElementById("titleInput").value.trim(),
      content: document.getElementById("contentInput").value.trim()
    };

    if (!payload.title || !payload.content) {
      msg.textContent = "제목과 내용을 모두 입력해주세요.";
      return;
    }

    msg.textContent = "제출 중...";

    fetch(SUPABASE_URL + "/rest/v1/gift_reports", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.ok) {
        msg.textContent = "제보 완료! 검토 후 목록에 올라갈 거예요. 고마워요 🙏";
        form.reset();
        kindButtons.forEach(function (b) { b.classList.remove("active"); });
      } else {
        msg.textContent = "제출에 실패했어요. 잠시 후 다시 시도해주세요.";
      }
    }).catch(function () {
      msg.textContent = "네트워크 오류로 제출하지 못했어요.";
    });
  });
}

function renderReports(items) {
  var list = document.getElementById("reportList");
  if (!list) return;

  if (!items.length) {
    list.innerHTML = '<p style="color:var(--text-soft);font-size:13.5px;">아직 등록된 이야기가 없어요. 첫 번째 제보자가 되어보세요!</p>';
    return;
  }

  var votedIds = getVotedIds();

  list.innerHTML = items.map(function (item) {
    var voted = votedIds.indexOf(item.id) !== -1;
    var kindLabel = item.kind === "best" ? "최고의 선물" : "최악의 선물";
    return (
      '<div class="report-card" data-id="' + item.id + '">' +
        '<div class="r-top">' +
          '<span class="r-kind ' + item.kind + '">' + kindLabel + '</span>' +
          '<span class="r-type">' + escapeHtml(item.mbti_type) + '</span>' +
        '</div>' +
        '<div class="r-title">' + escapeHtml(item.title) + '</div>' +
        '<div class="r-content">' + escapeHtml(item.content) + '</div>' +
        '<button class="r-like' + (voted ? ' voted' : '') + '" data-id="' + item.id + '" ' + (voted ? 'disabled' : '') + '>' +
          '👍 공감 ' + (item.likes || 0) +
        '</button>' +
      '</div>'
    );
  }).join("");

  list.querySelectorAll(".r-like").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-id");
      if (getVotedIds().indexOf(id) !== -1) return;

      fetch(SUPABASE_URL + "/rest/v1/rpc/increment_likes", {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ row_id: id })
      }).then(function (res) {
        if (res.ok) {
          markVoted(id);
          btn.classList.add("voted");
          btn.disabled = true;
          var current = parseInt(btn.textContent.replace(/[^0-9]/g, "") || "0", 10);
          btn.textContent = "👍 공감 " + (current + 1);
        }
      }).catch(function () {});
    });
  });
}

function loadReports(filterKind) {
  var list = document.getElementById("reportList");
  if (!list) return;

  if (!isConfigured()) {
    list.innerHTML = '<p style="color:var(--text-soft);font-size:13.5px;">커뮤니티 기능 준비 중이에요. 조금만 기다려주세요!</p>';
    return;
  }

  list.innerHTML = '<p style="color:var(--text-soft);font-size:13.5px;">불러오는 중...</p>';

  var url = SUPABASE_URL + "/rest/v1/gift_reports?select=*&status=eq.approved&order=likes.desc&limit=50";
  if (filterKind && filterKind !== "all") {
    url += "&kind=eq." + filterKind;
  }

  fetch(url, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY
    }
  }).then(function (res) { return res.json(); })
    .then(function (data) { renderReports(Array.isArray(data) ? data : []); })
    .catch(function () {
      list.innerHTML = '<p style="color:var(--text-soft);font-size:13.5px;">불러오는 데 실패했어요.</p>';
    });
}

function initCommunityFilters() {
  var tabs = document.querySelectorAll(".filter-tabs button");
  if (!tabs.length) return;
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      loadReports(tab.getAttribute("data-filter"));
    });
  });
}
