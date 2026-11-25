/* 새 메인·기장 설계 페이지의 전환 신호 — tm.js 의 track()·hit()·출처(SRC) 규칙을 그대로 옮김(tm.js 의 화면 부품에는 기대지 않음).
   track(name,p): dataLayer · gtag('event') · window.TM_CONV(tags.js: 구글 광고 전환) · 사무소 시트 집계(hit, 같은 받는 곳·같은 꼴).
   연결: 전화 링크 → tel_click · 카톡 링크 → kakao_click · 설계 화면 링크 → calc_open(전환 아님) · TaxminLead.send 결과 ok → form_submit([선택] 광고 확인 동의 없으면 경로 없이 anon).
   calc_complete 는 build.html 이 window.TM_TRACK 으로 부른다. 페이지 이름은 <body data-page> (srch- 를 붙임). */
(function () {
  'use strict';
  var doc = document, C = window.TM || {};
  var ENDPOINT = C.endpoint || '';
  var PAGE = (C.pagePrefix || 'srch-') + (doc.body.getAttribute('data-page') || 'main');
  var bot = /bot|crawl|spider|Yeti|AdsBot|HeadlessChrome/i.test(navigator.userAgent) || /[?&]norv\b/.test(location.search);

  function sget(k, local) { try { return (local ? localStorage : sessionStorage).getItem(k); } catch (e) { return null; } }
  function sset(k, v, local) { try { (local ? localStorage : sessionStorage).setItem(k, v); } catch (e) {} }
  function parse(s) { try { return JSON.parse(s || 'null'); } catch (e) { return null; } }

  /* 들어온 곳 — tm.js SRC 와 같은 규칙·같은 저장 키(tm_src·tm_first) */
  var SRC = (function () {
    var q = new URLSearchParams(location.search);
    function g(k) { return (q.get(k) || '').trim(); }
    var label = '', key = 'direct';
    if (g('n_media') || g('n_keyword') || g('n_query') || g('n_ad')) { label = '네이버 검색광고'; key = 'naver_ad'; }
    else if (g('gclid') || g('gbraid') || g('wbraid')) { label = '구글 광고'; key = 'google_ad'; }
    else if (g('utm_source') || g('src')) { key = label = g('utm_source') || g('src'); }
    else {
      var host = '';
      try { host = doc.referrer ? new URL(doc.referrer).hostname : ''; } catch (e) {}
      var map = [[/naver\./, '네이버 검색', 'naver'], [/google\./, '구글 검색', 'google'], [/daum\.|kakao\./, '다음·카카오', 'daum'],
        [/daangn|karrot/, '당근', 'daangn'], [/instagram|facebook/, '인스타그램', 'instagram'], [/youtube/, '유튜브', 'youtube']];
      for (var i = 0; i < map.length; i++) { if (map[i][0].test(host)) { label = map[i][1]; key = map[i][2]; break; } }
      if (!label && host && host !== location.hostname) { label = key = host; }
    }
    var cur = { key: key, ad: g('utm_content') || g('n_ad') || '' };
    var prev = parse(sget('tm_src'));
    /* lead.js 가 같은 키에 전체 기록(label·camp 포함)을 쓰므로 여기서는 읽기만 하고 덮어쓰지 않음 */
    if (key === 'direct' && prev) cur = prev;
    return cur;
  })();

  function hit(e, anon) {
    if (!ENDPOINT || C.hitBeacon === false) return;
    var body = JSON.stringify({ type: 'hit', e: e, s: anon ? '-' : SRC.key, v: anon ? '-' : (SRC.ad || '-'), page: PAGE });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      else fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, keepalive: true });
    } catch (x) {}
  }
  function track(name, p) {
    p = p || {}; var anon = !!p.anon; delete p.anon;
    p.page = PAGE; p.traffic_src = anon ? '-' : SRC.key; p.ad = anon ? '-' : (SRC.ad || '-');
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, p));
    try { if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, p)); } catch (x) {}
    try { if (typeof window.TM_CONV === 'function') window.TM_CONV(name, p); } catch (x) {}
    if (/^(kakao_click|tel_click|form_submit|calc_complete)$/.test(name)) hit(name, anon);
  }
  window.TM_TRACK = track;
  if (!bot && !sget('tm_view_' + PAGE)) { sset('tm_view_' + PAGE, '1'); hit('view'); }

  doc.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (/^tel:/i.test(h)) track('tel_click', { position: a.className || '-' });
    else if (/pf\.kakao\.com/i.test(h)) track('kakao_click', { position: a.className || '-', device: window.innerWidth >= 1024 ? 'pc' : 'mobile' });
    else if (/^build\.html/i.test(h)) track('calc_open', { position: a.getAttribute('data-pos') || a.className || '-' });
  }, true);

  /* 접수 성공 → form_submit (index·build 모두 lead.js 의 send 로 보냄) */
  var L = window.TaxminLead;
  if (L && typeof L.send === 'function') {
    var send = L.send;
    L.send = function (p) {
      return send.apply(this, arguments).then(function (r) {
        if (r && r.ok) track('form_submit', p && p.adConsent === true ? {} : { anon: 1 });
        return r;
      });
    };
  }
})();
