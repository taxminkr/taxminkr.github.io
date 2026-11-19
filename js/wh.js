/* 택스민 시안(위하고 느낌) — 첫 화면 배경 영상·질문 타자 효과·서비스 탭·맨 위로.
   '움직임 줄이기'면 영상·타자 효과를 켜지 않는다. 화면을 그리는 글은 모두 HTML 에 있고, 여기서는 움직임만 더한다. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var IO = 'IntersectionObserver' in window;

  /* ── 첫 화면 배경 영상: 첫 그림이 뜬 뒤 불러온다(움직임 줄이기·데이터 절약이면 사진만) */
  var hero = $('[data-wh-hero]'), v = $('[data-wh-v]');
  if (hero && v && !calm && !(navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')))) {
    var playV = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var startV = function () {
      /* 휴대폰은 세로 영상, 아주 큰 화면(가로 2500px 넘게 그려질 때)만 4K, 그 밖에는 1080p */
      var big = window.innerWidth * (window.devicePixelRatio || 1) >= 2500;
      v.src = !window.matchMedia('(min-width: 720px)').matches ? 'img/wh/silk-m.mp4' : big ? 'img/wh/silk-4k.mp4' : 'img/wh/silk.mp4';
      v.addEventListener('playing', function () { v.classList.add('is-on'); }, { once: true });
      playV();
    };
    v.preload = 'auto'; startV();   /* 페이지를 다 읽을 때까지 기다리지 않고 바로 받는다 */
    if (IO) new IntersectionObserver(function (es) { if (!v.src) return; if (es[0].isIntersecting) playV(); else v.pause(); }).observe(hero);
    doc.addEventListener('visibilitychange', function () { if (!v.src) return; if (doc.hidden) v.pause(); else playV(); });
  }

  /* ── 광고 키워드가 법인이면(bd.js 가 표시) 제목 금액도 법인 기준으로 */
  var amt = $('[data-wh-amt]');
  if (amt && doc.documentElement.getAttribute('data-bd-k') === 'corp') amt.textContent = '월 10만원';

  /* ── 카톡 질문 칸: 사장님이 자주 묻는 말을 한 글자씩 */
  var tw = $('[data-wh-type]');
  if (tw && !calm) {
    var Q = ['이번 부가세 신고는 언제까지예요?', '알바 월급 신고도 맡길 수 있나요?', '배달앱 매출도 장부에 들어가요?', '받을 수 있는 세액감면·공제가 있나요?', '세무사를 바꾸려면 어떻게 해요?'];
    var qi = 0, ci = Q[0].length, del = false, vis = true;
    if (IO) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(tw);
    var tick = function () {
      var wait = 60;
      if (vis && !doc.hidden) {
        var s = Q[qi];
        if (!del) { if (ci < s.length) { ci++; wait = 70; } else { del = true; wait = 2200; } }
        else { if (ci > 0) { ci--; wait = 28; } else { del = false; qi = (qi + 1) % Q.length; wait = 380; } }
        tw.textContent = Q[qi].slice(0, ci);
      } else wait = 400;
      setTimeout(tick, wait);
    };
    setTimeout(function () { del = true; tick(); }, 2600);
  }

  /* ── 서비스 탭(좌우 화살표·Home·End) */
  $$('[data-wh-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var pick = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t, p = doc.getElementById(x.getAttribute('aria-controls'));
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      var list = t.parentNode;
      if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: t.offsetLeft - 16, behavior: calm ? 'auto' : 'smooth' });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t); });
      t.addEventListener('keydown', function (ev) {
        var j = -1;
        if (ev.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (ev.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (ev.key === 'Home') j = 0;
        else if (ev.key === 'End') j = tabs.length - 1;
        if (j < 0) return;
        ev.preventDefault(); pick(tabs[j], true);
      });
    });
  });

  /* ── 맨 위로 */
  var top = $('[data-wh-top]');
  if (top) top.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    var h = $('#ap-h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
})();
