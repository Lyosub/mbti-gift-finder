# MBTI 선물찾기 정적 사이트 빌더
# data/mbti.json + 템플릿 -> types/*.html, index.html, sitemap.xml 재생성
# 실행: pwsh 또는 Windows PowerShell 에서  ./tools/build.ps1  (프로젝트 루트에서)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$data = Get-Content -Raw -Encoding UTF8 (Join-Path $root "data\mbti.json") | ConvertFrom-Json
$today = $data.updated
$site  = "https://mbtigift.com"

function HtmlEnc([string]$s) {
  if ($null -eq $s) { return "" }
  return $s.Replace("&","&amp;").Replace("<","&lt;").Replace(">","&gt;").Replace('"',"&quot;")
}
function JsonStr([string]$s) {
  if ($null -eq $s) { return '""' }
  return ($s | ConvertTo-Json)
}

$GA = @'
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VERVN3M9Q3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-VERVN3M9Q3');
</script>
'@

# 애드센스: 게시자 ID가 있으면 전 페이지 <head>에 스니펫을 넣는다(소유권 확인 + 자동 광고).
$adsenseClient = "ca-pub-2249886041953163"
$ADSENSE = ""
if ($adsenseClient) {
  $ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + $adsenseClient + '" crossorigin="anonymous"></script>' + "`n"
}

function Head($title, $desc, $canonical, $ogType, $cssPath, $ldJson) {
@"
<!DOCTYPE html>
<html lang="ko">
<head>
$GA$ADSENSE<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$(HtmlEnc $title)</title>
<meta name="description" content="$(HtmlEnc $desc)">
<link rel="canonical" href="$canonical">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="$ogType">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="MBTI 선물찾기">
<meta property="og:title" content="$(HtmlEnc $title)">
<meta property="og:description" content="$(HtmlEnc $desc)">
<meta property="og:url" content="$canonical">
<meta property="og:image" content="$site/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="naver-site-verification" content="8f3d4a6ba8bd9628db029bc30ce8af77a40acd1f" />
<link rel="stylesheet" href="$cssPath">
<script type="application/ld+json">
$ldJson
</script>
</head>
<body>
"@
}

$FooterCommon = @'
<footer class="site">
  MBTI 선물찾기 · 이 사이트에서 소개하는 성향 설명은 통용되는 MBTI 유형론을 바탕으로 자체적으로 작성한 콘텐츠이며, 특정 기관의 공식 검사 결과를 대체하지 않습니다.
  <br><a href="/about.html">소개</a> · <a href="/privacy.html">개인정보처리방침</a> · <a href="/guides/index.html">선물 가이드</a>
</footer>
'@

# ---------- 유형 페이지 ----------
$typeList = $data.types
$byCode = @{}
foreach ($t in $typeList) { $byCode[$t.code] = $t }

function RelatedTypes($t) {
  $same = $typeList | Where-Object { $_.group -eq $t.group -and $_.code -ne $t.code }
  $otherPool = @($typeList | Where-Object { $_.group -ne $t.group })
  $idx = [array]::IndexOf(($typeList | ForEach-Object { $_.code }), $t.code)
  $others = @($otherPool[$idx % $otherPool.Count], $otherPool[($idx + 5) % $otherPool.Count])
  $picks = @($same) + @($others)
  $html = '<div class="related-cards">'
  foreach ($r in $picks) {
    $html += '<a href="' + $r.slug + '.html"><span class="rc-code">' + $r.code + ' 선물</span><span class="rc-nick">' + (HtmlEnc $r.nick) + '</span></a>'
  }
  $html += '</div>'
  return $html
}

foreach ($t in $typeList) {
  $g = $data.groups.($t.group)
  $title = "$($t.code) 선물 추천 BEST 8 | $($t.nick)가 진짜 좋아하는 선물"
  $desc  = "$($t.code)($($t.nick))에게 어울리는 선물을 성향·예산·상황별로 정리했어요. 피해야 할 선물과 자주 묻는 질문까지 한 번에."
  $canonical = "$site/types/$($t.slug).html"

  # JSON-LD
  $faqLd = ($t.faq | ForEach-Object {
    '{"@type":"Question","name":' + (JsonStr $_.q) + ',"acceptedAnswer":{"@type":"Answer","text":' + (JsonStr $_.a) + '}}'
  }) -join ","
  $itemLd = @()
  for ($i=0; $i -lt $t.gifts.Count; $i++) {
    $itemLd += '{"@type":"ListItem","position":' + ($i+1) + ',"name":' + (JsonStr $t.gifts[$i].name) + '}'
  }
  $itemLd = $itemLd -join ","
  $ld = @"
[
 {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
   {"@type":"ListItem","position":1,"name":"홈","item":"$site/"},
   {"@type":"ListItem","position":2,"name":"MBTI 유형별 선물","item":"$site/#types"},
   {"@type":"ListItem","position":3,"name":"$($t.code) 선물","item":"$canonical"}]},
 {"@context":"https://schema.org","@type":"Article","headline":$(JsonStr $title),"description":$(JsonStr $desc),"inLanguage":"ko-KR","datePublished":"$today","dateModified":"$today","mainEntityOfPage":"$canonical","author":{"@type":"Organization","name":"MBTI 선물찾기"},"publisher":{"@type":"Organization","name":"MBTI 선물찾기","url":"$site/"}},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[$faqLd]},
 {"@context":"https://schema.org","@type":"ItemList","name":$(JsonStr "$($t.code) 추천 선물"),"itemListElement":[$itemLd]}
]
"@

  $sb = [System.Text.StringBuilder]::new()
  [void]$sb.Append((Head $title $desc $canonical "article" "../assets/style.css" $ld))
  [void]$sb.Append(@"
<header class="site">
  <a class="logo" href="../index.html">🎁 MBTI 선물찾기</a>
  <nav><a href="../index.html">홈</a><a href="../test.html">테스트</a><a href="../guides/index.html">가이드</a></nav>
</header>
<div class="wrap">
  <nav class="breadcrumb"><a href="../index.html">홈</a><span>›</span><a href="../index.html#types">MBTI 유형별 선물</a><span>›</span>$($t.code)</nav>
  <section class="type-hero">
    <span class="badge $($t.group)">$(HtmlEnc $g.name)</span>
    <h1>$($t.code) · $(HtmlEnc $t.nick)</h1>
    <p class="lead">$(HtmlEnc $t.tagline)</p>
  </section>

  <div class="toc">
    <strong>이 글에서</strong>
    <a href="#psych">선물 심리</a>
    <a href="#gifts">추천 선물 8</a>
    <a href="#avoid">피해야 할 선물</a>
    <a href="#occasion">상황별</a>
    <a href="#faq">자주 묻는 질문</a>
  </div>

  <div class="article">
    <h2 id="psych">$($t.code)는 어떤 선물에 마음이 움직일까</h2>
"@)
  foreach ($p in $t.intro) { [void]$sb.Append("    <p>" + (HtmlEnc $p) + "</p>`n") }
  [void]$sb.Append("    <h3>이런 걸 좋아해요</h3>`n    <div class=`"chips`">`n")
  foreach ($x in $t.loves) { [void]$sb.Append("      <span class=`"chip good`">" + (HtmlEnc $x) + "</span>`n") }
  [void]$sb.Append("    </div>`n  </div>`n")

  [void]$sb.Append('  <div class="ad-slot" data-ad-slot=""></div>' + "`n")

  [void]$sb.Append(@"
  <section class="gift-zone">
    <h2 id="gifts">$(HtmlEnc $t.nick)에게 어울리는 선물 BEST 8</h2>
    <p class="sub" style="color:var(--text-soft);font-size:13px;margin:0 0 12px;">가격대(저 = ~3만 원 / 중 = 3~7만 원 / 고 = 7만 원~) 는 참고용이에요.</p>
    <div class="gift-list">
"@)
  foreach ($gift in $t.gifts) {
    [void]$sb.Append(@"
      <div class="gift-item">
        <div class="gi-top"><span class="gi-name">$(HtmlEnc $gift.name)</span><span class="gi-tier">$(HtmlEnc $gift.tier)</span></div>
        <div class="gi-why">$(HtmlEnc $gift.why)</div>
        <a class="gi-buy" data-cou-q="$(HtmlEnc $gift.q)" rel="sponsored nofollow noopener">쿠팡에서 가격 보기 →</a>
      </div>
"@)
  }
  [void]$sb.Append("    </div>`n  </section>`n")

  [void]$sb.Append(@"
  <div class="article">
    <h2 id="avoid">$($t.code)에게 피해야 할 선물</h2>
    <div class="chips">
"@)
  foreach ($x in $t.avoid) { [void]$sb.Append("      <span class=`"chip bad`">" + (HtmlEnc $x) + "</span>`n") }
  [void]$sb.Append("    </div>`n")
  [void]$sb.Append("    <h2 id=`"occasion`">상황별로 골라주기</h2>`n")
  foreach ($oc in $t.occasions) {
    [void]$sb.Append("    <div class=`"occasion-block`"><div class=`"oc-label`">" + (HtmlEnc $oc.label) + "</div><div class=`"oc-tip`">" + (HtmlEnc $oc.tip) + "</div></div>`n")
  }
  [void]$sb.Append("  </div>`n")

  [void]$sb.Append('  <div class="ad-slot" data-ad-slot=""></div>' + "`n")

  [void]$sb.Append("  <section class=`"faq`">`n    <h2 id=`"faq`">자주 묻는 질문</h2>`n")
  foreach ($f in $t.faq) {
    [void]$sb.Append("    <details><summary>" + (HtmlEnc $f.q) + "</summary><div class=`"fa`">" + (HtmlEnc $f.a) + "</div></details>`n")
  }
  [void]$sb.Append("  </section>`n")

  [void]$sb.Append(@"
  <div class="share-bar">
    <button id="shareBtn">공유하기</button>
    <button id="copyBtn">링크 복사</button>
  </div>
  <p class="aff-disclosure" id="affDisclosure"></p>

  <section class="related">
    <h3>다른 유형 선물도 보기</h3>
    $(RelatedTypes $t)
  </section>

  <div class="cta-band">
    <p>줄 사람의 MBTI를 모르겠다면?</p>
    <a href="../index.html">16유형 한눈에 보기</a>
  </div>
</div>
$FooterCommon
<script src="../assets/affiliate.js"></script>
<script src="../assets/script.js"></script>
<script>initShare("$($t.code)", "$(HtmlEnc $t.nick)");</script>
</body>
</html>
"@)

  $out = Join-Path $root ("types\" + $t.slug + ".html")
  [System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  types/$($t.slug).html"
}

# ---------- 홈 ----------
$homeTitle = "MBTI 선물 추천 | 16유형별로 진짜 좋아하는 선물 찾기"
$homeDesc  = "MBTI 16유형별로 실제로 좋아할 만한 선물을 성향·예산·상황별로 정리했어요. 친구·연인·부모님·동료 선물 고민을 유형 하나로 좁혀보세요."
$homeLd = @"
[
 {"@context":"https://schema.org","@type":"WebSite","name":"MBTI 선물찾기","url":"$site/","inLanguage":"ko-KR"},
 {"@context":"https://schema.org","@type":"Organization","name":"MBTI 선물찾기","url":"$site/","logo":"$site/assets/og-image.jpg"},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
   {"@type":"Question","name":"MBTI로 선물을 고르면 정말 도움이 되나요?","acceptedAnswer":{"@type":"Answer","text":"성격 유형은 '어떤 결의 선물에 반응하는지'를 좁혀줍니다. 정답을 주진 않지만, 후보를 절반으로 줄여 고민 시간을 아껴줍니다."}},
   {"@type":"Question","name":"상대방 MBTI를 정확히 몰라요.","acceptedAnswer":{"@type":"Answer","text":"E/I(활동적인지)와 T/F(실용 vs 마음) 두 축만 어림해도 방향이 잡힙니다. 그래도 모르겠으면 관계별 가이드를 참고하세요."}},
   {"@type":"Question","name":"추천 상품 링크는 어디로 연결되나요?","acceptedAnswer":{"@type":"Answer","text":"현재는 쿠팡 통합검색으로 연결됩니다. 쿠팡 파트너스 승인 후에는 제휴 링크로 바뀌며 구매 시 일정액의 수수료가 발생할 수 있습니다."}}
 ]}
]
"@

$grid = ""
foreach ($t in $typeList) {
  $grid += '    <a class="type-card ' + $t.group + '" href="types/' + $t.slug + '.html"><span class="code">' + $t.code + '</span><span class="nick">' + (HtmlEnc $t.nick) + '</span></a>' + "`n"
}

$homeHtml = (Head $homeTitle $homeDesc "$site/" "website" "assets/style.css" $homeLd) + @"
<header class="site">
  <a class="logo" href="index.html">🎁 MBTI 선물찾기</a>
  <nav>
    <a href="test.html">MBTI 테스트</a>
    <a href="guides/index.html">가이드</a>
    <a href="games/index.html">미니게임</a>
    <a href="community.html">제보</a>
    <a href="about.html">소개</a>
  </nav>
</header>
<div class="wrap">
  <section class="hero">
    <h1>선물 뭐 사줘야 할지<br>모르겠을 때</h1>
    <p>줄 사람의 MBTI만 알면 후보가 절반으로 줄어듭니다. 유형을 골라보세요.</p>
  </section>

  <div class="grid16" id="types">
$grid  </div>

  <a class="random-btn" href="test.html" style="text-decoration:none;">🧩 내 MBTI부터 모르겠다면 — 1분 테스트</a>
  <a class="random-btn" href="pc-test.html" style="text-decoration:none;margin-top:8px;background:var(--card-bg);color:var(--text);border:1px solid var(--border);">🎨 퍼스널컬러도 1분 테스트 — 톤별 선물</a>
  <button class="random-btn" id="randomBtn" style="margin-top:8px;background:var(--card-bg);color:var(--text);border:1px solid var(--border);">🎲 그냥 랜덤으로 보기</button>

  <div class="ad-slot" data-ad-slot=""></div>

  <section class="section">
    <h2>MBTI 4그룹, 선물 성향 요약</h2>
    <div class="occasion-block"><div class="oc-label" style="color:var(--nt)">분석가형 (NT · INTJ·INTP·ENTJ·ENTP)</div><div class="oc-tip">쓸모와 효율을 증명해야 마음이 움직여요. 작업환경·생산성 도구, 취향을 저격한 '한 끗 다른' 디자인.</div></div>
    <div class="occasion-block"><div class="oc-label" style="color:var(--nf)">외교관형 (NF · INFJ·INFP·ENFJ·ENFP)</div><div class="oc-tip">물건보다 그 안에 담긴 '이야기'가 핵심. 손편지, 커스텀 제작, 함께하는 경험.</div></div>
    <div class="occasion-block"><div class="oc-label" style="color:var(--sj)">관리자형 (SJ · ISTJ·ISFJ·ESTJ·ESFJ)</div><div class="oc-tip">품질 좋고 오래 쓰는 검증된 실용품. 이미 쓰는 물건의 '한 단계 위 버전'이 안전합니다.</div></div>
    <div class="occasion-block"><div class="oc-label" style="color:var(--sp)">탐험가형 (SP · ISTP·ISFP·ESTP·ESFP)</div><div class="oc-tip">지금 당장 즐길 수 있는 것, 감각적으로 예쁜 것, 함께 노는 경험.</div></div>
  </section>

  <section class="section">
    <h2>관계별로 골라보기</h2>
    <div class="related-cards">
      <a href="guides/girlfriend-gift.html"><span class="rc-code">여자친구 선물</span><span class="rc-nick">기념일마다 고민될 때</span></a>
      <a href="guides/boyfriend-gift.html"><span class="rc-code">남자친구 선물</span><span class="rc-nick">무난한 지갑·향수 말고</span></a>
      <a href="guides/friend-birthday-gift.html"><span class="rc-code">친구 생일선물</span><span class="rc-nick">부담 없이 센스 있게</span></a>
      <a href="guides/mom-birthday-gift.html"><span class="rc-code">엄마 생일선물</span><span class="rc-nick">꽃다발 다음이 고민일 때</span></a>
      <a href="guides/dad-birthday-gift.html"><span class="rc-code">아빠 생일선물</span><span class="rc-nick">건강식품·지갑 말고</span></a>
      <a href="guides/coworker-boss-gift.html"><span class="rc-code">직장 동료·상사 선물</span><span class="rc-nick">적당한 거리감 지키기</span></a>
    </div>
  </section>

  <section class="section">
    <h2>왜 MBTI로 선물을 고르면 쉬워질까</h2>
    <p>
      같은 생일 선물이라도 T는 "이게 왜 필요한지"부터 따지고, F는 "이 선물에 담긴 마음"부터 봅니다.
      J는 계획대로 딱 맞는 걸 받아야 만족하고, P는 예상 못 한 의외의 선물에 더 크게 웃습니다.
      정성껏 고른 선물인데 반응이 미지근했던 기억, 별생각 없이 산 물건에 상대가 의외로 감동했던 기억 —
      성격이 다르면 좋아하는 선물의 결도 다르기 때문입니다.
      이 사이트는 그 16가지 결을 유형별로 정리해, 고민하는 시간을 줄여줍니다.
    </p>
  </section>

  <section class="faq">
    <h2>자주 묻는 질문</h2>
    <details><summary>MBTI로 선물을 고르면 정말 도움이 되나요?</summary><div class="fa">성격 유형은 '어떤 결의 선물에 반응하는지'를 좁혀줍니다. 정답을 주진 않지만 후보를 절반으로 줄여 고민 시간을 아껴줍니다.</div></details>
    <details><summary>상대방 MBTI를 정확히 몰라요.</summary><div class="fa">E/I(활동적인지)와 T/F(실용 vs 마음) 두 축만 어림해도 방향이 잡힙니다. 그래도 모르겠으면 관계별 가이드를 참고하세요.</div></details>
    <details><summary>추천 상품 링크는 어디로 연결되나요?</summary><div class="fa">현재는 쿠팡 통합검색으로 연결됩니다. 쿠팡 파트너스 승인 후에는 제휴 링크로 바뀌며, 구매 시 일정액의 수수료가 발생할 수 있습니다.</div></details>
  </section>

  <p class="aff-disclosure" id="affDisclosure"></p>
</div>
$FooterCommon
<script src="assets/affiliate.js"></script>
<script src="assets/script.js"></script>
<script>initRandomButton();</script>
</body>
</html>
"@
[System.IO.File]::WriteAllText((Join-Path $root "index.html"), $homeHtml, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  index.html"

# ---------- 가이드 페이지 ----------
$gdata = Get-Content -Raw -Encoding UTF8 (Join-Path $root "data\guides.json") | ConvertFrom-Json
$groupBlurb = @{
  nt = "쓸모와 효율을 증명해야 마음이 움직여요. 작업환경·생산성 도구, 취향을 저격한 '한 끗 다른' 디자인."
  nf = "물건보다 그 안에 담긴 '이야기'가 핵심. 손편지, 커스텀 제작, 함께하는 경험."
  sj = "품질 좋고 오래 쓰는 검증된 실용품. 이미 쓰는 물건의 '한 단계 위 버전'이 안전합니다."
  sp = "지금 당장 즐길 수 있는 것, 감각적으로 예쁜 것, 함께 노는 경험."
}
$groupOrder = @("nt","nf","sj","sp")

function GuideRelated($slugs) {
  $names = @{
    "budget-by-relationship"="관계별 선물 예산"; "gift-fail-checklist"="선물 실패 체크리스트";
    "couple-gift-etiquette"="커플 선물 매너"; "coworker-gift-manners"="직장 선물 매너";
    "birthday-timing"="생일선물 준비 타이밍"; "gift-wrapping-tips"="선물 포장 팁";
    "disappointing-gifts"="유형별 실망하는 선물"; "girlfriend-gift"="여자친구 선물";
    "boyfriend-gift"="남자친구 선물"; "friend-birthday-gift"="친구 생일선물";
    "mom-birthday-gift"="엄마 생일선물"; "dad-birthday-gift"="아빠 생일선물";
    "coworker-boss-gift"="직장 동료·상사 선물"; "housewarming-gift"="집들이 선물"; "christmas-gift"="크리스마스 선물"
  }
  $h = '<div class="related-cards">'
  foreach ($s in $slugs) { if ($names[$s]) { $h += '<a href="' + $s + '.html"><span class="rc-code">' + (HtmlEnc $names[$s]) + '</span></a>' } }
  $h += '<a href="../index.html"><span class="rc-code">MBTI 16유형 전체 보기</span></a>'
  $h += '</div>'
  return $h
}

# 아티클형 가이드
foreach ($a in $gdata.articleGuides) {
  $canonical = "$site/guides/$($a.slug).html"
  $faqLd = ($a.faq | ForEach-Object { '{"@type":"Question","name":' + (JsonStr $_.q) + ',"acceptedAnswer":{"@type":"Answer","text":' + (JsonStr $_.a) + '}}' }) -join ","
  $ld = @"
[
 {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
   {"@type":"ListItem","position":1,"name":"홈","item":"$site/"},
   {"@type":"ListItem","position":2,"name":"선물 가이드","item":"$site/guides/index.html"},
   {"@type":"ListItem","position":3,"name":$(JsonStr $a.h1),"item":"$canonical"}]},
 {"@context":"https://schema.org","@type":"Article","headline":$(JsonStr $a.title),"description":$(JsonStr $a.desc),"inLanguage":"ko-KR","datePublished":"$($gdata.updated)","dateModified":"$($gdata.updated)","mainEntityOfPage":"$canonical","author":{"@type":"Organization","name":"MBTI 선물찾기"},"publisher":{"@type":"Organization","name":"MBTI 선물찾기","url":"$site/"}},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[$faqLd]}
]
"@
  $sb = [System.Text.StringBuilder]::new()
  [void]$sb.Append((Head $a.title $a.desc $canonical "article" "../assets/style.css" $ld))
  [void]$sb.Append(@"
<header class="site">
  <a class="logo" href="../index.html">🎁 MBTI 선물찾기</a>
  <nav><a href="../index.html">홈</a><a href="../test.html">테스트</a><a href="index.html">가이드</a></nav>
</header>
<div class="wrap">
  <nav class="breadcrumb"><a href="../index.html">홈</a><span>›</span><a href="index.html">선물 가이드</a><span>›</span>$(HtmlEnc $a.h1)</nav>
  <section class="type-hero">
    <span class="badge guide">선물 가이드</span>
    <h1>$(HtmlEnc $a.h1)</h1>
    <p class="lead">$(HtmlEnc $a.lead)</p>
  </section>
  <div class="article">
"@)
  $sc = 0
  foreach ($s in $a.sections) {
    $h2id = if ($s.PSObject.Properties['id'] -and $s.id) { ' id="' + $s.id + '"' } else { '' }
    [void]$sb.Append("    <h2$h2id>" + (HtmlEnc $s.h2) + "</h2>`n")
    foreach ($p in $s.p) { [void]$sb.Append("    <p>" + (HtmlEnc $p) + "</p>`n") }
    $sc++
    if ($sc -eq 2) { [void]$sb.Append('  </div>' + "`n" + '  <div class="ad-slot" data-ad-slot=""></div>' + "`n" + '  <div class="article">' + "`n") }
  }
  [void]$sb.Append("  </div>`n")
  [void]$sb.Append("  <section class=`"faq`">`n    <h2>자주 묻는 질문</h2>`n")
  foreach ($f in $a.faq) { [void]$sb.Append("    <details><summary>" + (HtmlEnc $f.q) + "</summary><div class=`"fa`">" + (HtmlEnc $f.a) + "</div></details>`n") }
  [void]$sb.Append("  </section>`n")
  [void]$sb.Append('  <div class="ad-slot" data-ad-slot=""></div>' + "`n")
  [void]$sb.Append("  <section class=`"related`">`n    <h3>관련 가이드</h3>`n    " + (GuideRelated $a.related) + "`n  </section>`n")
  [void]$sb.Append("  <p class=`"aff-disclosure`" id=`"affDisclosure`"></p>`n</div>`n")
  [void]$sb.Append($FooterCommon + "`n<script src=`"../assets/affiliate.js`"></script>`n</body>`n</html>`n")
  [System.IO.File]::WriteAllText((Join-Path $root ("guides\" + $a.slug + ".html")), $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  guides/$($a.slug).html"
}

# MBTI 성향형 가이드
foreach ($m in $gdata.mbtiGuides) {
  $canonical = "$site/guides/$($m.slug).html"
  $faqLd = ($m.faq | ForEach-Object { '{"@type":"Question","name":' + (JsonStr $_.q) + ',"acceptedAnswer":{"@type":"Answer","text":' + (JsonStr $_.a) + '}}' }) -join ","
  $ld = @"
[
 {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
   {"@type":"ListItem","position":1,"name":"홈","item":"$site/"},
   {"@type":"ListItem","position":2,"name":"선물 가이드","item":"$site/guides/index.html"},
   {"@type":"ListItem","position":3,"name":$(JsonStr $m.h1),"item":"$canonical"}]},
 {"@context":"https://schema.org","@type":"Article","headline":$(JsonStr $m.title),"description":$(JsonStr $m.desc),"inLanguage":"ko-KR","datePublished":"$($gdata.updated)","dateModified":"$($gdata.updated)","mainEntityOfPage":"$canonical","author":{"@type":"Organization","name":"MBTI 선물찾기"},"publisher":{"@type":"Organization","name":"MBTI 선물찾기","url":"$site/"}},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[$faqLd]}
]
"@
  $sb = [System.Text.StringBuilder]::new()
  [void]$sb.Append((Head $m.title $m.desc $canonical "article" "../assets/style.css" $ld))
  [void]$sb.Append(@"
<header class="site">
  <a class="logo" href="../index.html">🎁 MBTI 선물찾기</a>
  <nav><a href="../index.html">홈</a><a href="../test.html">테스트</a><a href="index.html">가이드</a></nav>
</header>
<div class="wrap">
  <nav class="breadcrumb"><a href="../index.html">홈</a><span>›</span><a href="index.html">선물 가이드</a><span>›</span>$(HtmlEnc $m.h1)</nav>
  <section class="type-hero">
    <span class="badge guide">선물 가이드</span>
    <h1>$(HtmlEnc $m.h1)</h1>
    <p class="lead">$(HtmlEnc $m.lead)</p>
  </section>
  <div class="article">
"@)
  foreach ($p in $m.intro) { [void]$sb.Append("    <p>" + (HtmlEnc $p) + "</p>`n") }
  [void]$sb.Append("  </div>`n")
  [void]$sb.Append('  <div class="ad-slot" data-ad-slot=""></div>' + "`n")
  [void]$sb.Append("  <div class=`"article`">`n    <h2>성향 그룹별로 좁히기</h2>`n")
  foreach ($grp in $groupOrder) {
    $gg = $data.groups.$grp
    $members = $typeList | Where-Object { $_.group -eq $grp }
    [void]$sb.Append("    <h3 style=`"color:$($gg.color)`">" + (HtmlEnc $gg.name) + " · " + (($members | ForEach-Object { $_.code }) -join "·") + "</h3>`n")
    [void]$sb.Append("    <p>" + (HtmlEnc $groupBlurb[$grp]) + "</p>`n")
    [void]$sb.Append("    <div class=`"related-cards`">`n")
    foreach ($mem in $members) {
      [void]$sb.Append('      <a href="../types/' + $mem.slug + '.html"><span class="rc-code">' + $mem.code + ' 선물 →</span><span class="rc-nick">' + (HtmlEnc $mem.nick) + '</span></a>' + "`n")
    }
    [void]$sb.Append("    </div>`n")
  }
  [void]$sb.Append("    <h2>$(HtmlEnc $m.relLabel)에게 피해야 할 선물</h2>`n    <div class=`"chips`">`n")
  foreach ($x in $m.avoid) { [void]$sb.Append("      <span class=`"chip bad`">" + (HtmlEnc $x) + "</span>`n") }
  [void]$sb.Append("    </div>`n  </div>`n")
  [void]$sb.Append('  <div class="ad-slot" data-ad-slot=""></div>' + "`n")
  [void]$sb.Append("  <section class=`"faq`">`n    <h2>자주 묻는 질문</h2>`n")
  foreach ($f in $m.faq) { [void]$sb.Append("    <details><summary>" + (HtmlEnc $f.q) + "</summary><div class=`"fa`">" + (HtmlEnc $f.a) + "</div></details>`n") }
  [void]$sb.Append("  </section>`n")
  [void]$sb.Append("  <div class=`"cta-band`">`n    <p>줄 사람의 MBTI를 알고 있다면?</p>`n    <a href=`"../index.html`">16유형 한눈에 보기</a>`n  </div>`n")
  [void]$sb.Append("  <section class=`"related`">`n    <h3>관련 가이드</h3>`n    " + (GuideRelated @("girlfriend-gift","boyfriend-gift","friend-birthday-gift","mom-birthday-gift","dad-birthday-gift","housewarming-gift")) + "`n  </section>`n")
  [void]$sb.Append("  <p class=`"aff-disclosure`" id=`"affDisclosure`"></p>`n</div>`n")
  [void]$sb.Append($FooterCommon + "`n<script src=`"../assets/affiliate.js`"></script>`n</body>`n</html>`n")
  [System.IO.File]::WriteAllText((Join-Path $root ("guides\" + $m.slug + ".html")), $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  guides/$($m.slug).html"
}

# 가이드 인덱스
$allG = @()
foreach ($a in $gdata.articleGuides) { $allG += [pscustomobject]@{ slug=$a.slug; title=$a.h1; desc=$a.desc } }
foreach ($m in $gdata.mbtiGuides) { $allG += [pscustomobject]@{ slug=$m.slug; title=$m.h1; desc=$m.desc } }
$giCards = ($allG | ForEach-Object {
  '    <a class="guide-card" href="' + $_.slug + '.html"><span class="g-title">' + (HtmlEnc $_.title) + '</span><span class="g-desc">' + (HtmlEnc $_.desc) + '</span></a>'
}) -join "`n"
$giLd = @"
[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {"@type":"ListItem","position":1,"name":"홈","item":"$site/"},
 {"@type":"ListItem","position":2,"name":"선물 가이드","item":"$site/guides/index.html"}]}]
"@
$giHtml = (Head "선물 가이드 모음 | MBTI 선물찾기" "관계별 선물, 예산, 매너, 타이밍, 포장까지 — 선물 고를 때 알아두면 좋은 가이드를 모았어요." "$site/guides/index.html" "website" "../assets/style.css" $giLd) + @"
<header class="site">
  <a class="logo" href="../index.html">🎁 MBTI 선물찾기</a>
  <nav><a href="../index.html">홈</a><a href="../test.html">테스트</a><a href="index.html">가이드</a></nav>
</header>
<div class="wrap">
  <nav class="breadcrumb"><a href="../index.html">홈</a><span>›</span>선물 가이드</nav>
  <section class="hero">
    <h1>선물 가이드 모음</h1>
    <p>MBTI 유형별 추천과 함께, 누구에게나 통하는 선물의 기본기를 정리했어요.</p>
  </section>
  <div class="guide-grid">
$giCards
  </div>
  <div class="ad-slot" data-ad-slot=""></div>
  <p class="aff-disclosure" id="affDisclosure"></p>
</div>
$FooterCommon
<script src="../assets/affiliate.js"></script>
</body>
</html>
"@
[System.IO.File]::WriteAllText((Join-Path $root "guides\index.html"), $giHtml, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  guides/index.html"

# ---------- sitemap ----------
$sm = [System.Text.StringBuilder]::new()
[void]$sm.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sm.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
function SmUrl($loc, $pri) { "  <url><loc>$loc</loc><lastmod>$today</lastmod><changefreq>weekly</changefreq><priority>$pri</priority></url>" }
[void]$sm.AppendLine((SmUrl "$site/" "1.0"))
[void]$sm.AppendLine((SmUrl "$site/test.html" "0.9"))
[void]$sm.AppendLine((SmUrl "$site/pc-test.html" "0.9"))
foreach ($t in $typeList) { [void]$sm.AppendLine((SmUrl "$site/types/$($t.slug).html" "0.9")) }
[void]$sm.AppendLine((SmUrl "$site/guides/index.html" "0.7"))
foreach ($a in $gdata.articleGuides) { [void]$sm.AppendLine((SmUrl "$site/guides/$($a.slug).html" "0.7")) }
foreach ($m in $gdata.mbtiGuides) { [void]$sm.AppendLine((SmUrl "$site/guides/$($m.slug).html" "0.8")) }
foreach ($p in @("about.html","privacy.html","community.html","games/index.html")) { [void]$sm.AppendLine((SmUrl "$site/$p" "0.4")) }
[void]$sm.AppendLine('</urlset>')
[System.IO.File]::WriteAllText((Join-Path $root "sitemap.xml"), $sm.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  sitemap.xml"

Write-Host "`n빌드 완료: $($typeList.Count) 유형 + index + sitemap"
