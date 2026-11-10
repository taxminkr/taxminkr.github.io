/* 택스민 첫 화면 새 틀의 움직임(2026-11-10) — 바깥 도구 없이 직접 짬(CSP: script-src 'self').
   ① 큰 화면 자동 넘김(6초 · 화살표 · 밀기 · 멈춤 단추)  ② 스크롤 등장 + 숫자 올라가기  ③ 흐르는 사진 띠
   ④ 서비스 카드 넘김  ⑤ PC 아래 신청 바(접수 = tm.js 와 같은 주소·같은 키 순서)
   움직임 줄이기 설정이면 자동으로 움직이는 것은 모두 끈다. 화면 밖·다른 탭·신청 창이 열려 있으면 쉰다. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var IO = 'IntersectionObserver' in window;
  var rv = IO && !calm && root.classList.contains('js-rv');
  var paused = false;                       /* 멈춤 단추 — 넘김·사진 띠·카드 넘김을 함께 멈춤(WCAG 2.2.2) */
  var dlgOpen = function () { return !!doc.querySelector('dialog[open]'); };
  var syncs = [];
  var syncAll = function () { syncs.forEach(function (f) { f(); }); };
  doc.addEventListener('visibilitychange', syncAll);
  if ('MutationObserver' in window) $$('dialog').forEach(function (d) { new MutationObserver(syncAll).observe(d, { attributes: true, attributeFilter: ['open'] }); });

  /* ── ② 스크롤 등장 + 숫자 올라가기 */
  var count = function (b, delay) {
    var to = +b.getAttribute('data-bd-count'), from = +(b.getAttribute('data-bd-from') || 0), t0 = 0, dur = 1100;
    setTimeout(function () {
      requestAnimationFrame(function f(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        b.textContent = Math.round(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(f);
      });
    }, delay);
  };
  if (rv) {
    root.classList.add('bd-rv');
    /* 올라가는 숫자는 눈으로만 — 화면 읽기 프로그램에는 처음부터 마지막 값(10초·0번)을 읽어 준다 */
    $$('[data-bd-count]').forEach(function (b) {
      var s = doc.createElement('span'); s.className = 'bd-sr'; s.textContent = b.textContent;
      b.setAttribute('aria-hidden', 'true'); b.parentNode.insertBefore(s, b);
      b.textContent = b.getAttribute('data-bd-from') || '0';
    });
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, d = k++ * 110;
        io.unobserve(el);
        el.style.transitionDelay = d + 'ms';
        el.classList.add('bd-in');
        setTimeout(function () { el.style.transitionDelay = ''; }, d + 900);
        $$('[data-bd-count]', el).forEach(function (b, i) { count(b, d + 150 + i * 140); });
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
    $$('[data-bd-rv]').forEach(function (el) { io.observe(el); });
  }

  /* ── ① 큰 화면 넘김 */
  var hero = $('[data-bd-hero]');
  if (hero) (function () {
    var slides = $$('[data-bd-slide]', hero), n = slides.length, i = 0, DUR = 6000, timer = 0, vis = true, hold = false;
    var cur = $('[data-bd-cur]', hero), prog = $('[data-bd-prog]', hero), pp = $('[data-bd-pause]', hero);
    var mark = function () {
      /* 초점이 지금 장면 안에 있었으면(키보드 좌우로 넘길 때) 새 장면의 첫 단추로 옮긴다 — 숨은 장면에 남아 사라지지 않게 */
      var a = doc.activeElement, had = !!a && a !== hero && hero.contains(a);
      slides.forEach(function (s, j) {
        s.classList.toggle('on', j === i);
        if (j === i) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
      });
      if (cur) cur.textContent = '0' + (i + 1);
      if (had && !slides[i].contains(a)) {
        var t = $('a, button', slides[i]);
        if (t) { try { t.focus({ preventScroll: true }); } catch (x) { t.focus(); } }
      }
    };
    var running = function () { return !calm && !paused && vis && !hold && !doc.hidden && !dlgOpen(); };
    var restart = function () {
      clearTimeout(timer);
      if (prog) { prog.style.animation = 'none'; void prog.offsetWidth; }
      if (!running()) return;
      if (prog) prog.style.animation = 'bdProg ' + DUR + 'ms linear both';
      timer = setTimeout(function () { go(i + 1); }, DUR);
    };
    var go = function (j) { i = (j + n) % n; mark(); restart(); };
    var prev = $('[data-bd-prev]', hero), next = $('[data-bd-next]', hero);
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    if (pp) {
      if (calm) pp.hidden = true;
      pp.addEventListener('click', function () {
        paused = !paused;
        pp.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pp.setAttribute('aria-label', paused ? '자동 넘김 다시 시작' : '자동 넘김 멈춤');
        root.classList.toggle('bd-paused', paused);
        syncAll();
      });
    }
    hero.addEventListener('keydown', function (ev) {
      if (ev.target.matches && ev.target.matches('input, select, textarea')) return;
      if (ev.key === 'ArrowLeft') go(i - 1); else if (ev.key === 'ArrowRight') go(i + 1);
    });
    hero.addEventListener('focusin', function () { hold = true; restart(); });
    hero.addEventListener('focusout', function () { hold = false; restart(); });
    /* 손가락으로 밀기(옆으로 48px 넘게, 위아래보다 클 때만) */
    var sx = 0, sy = 0, down = false;
    hero.addEventListener('pointerdown', function (ev) { if (ev.pointerType === 'mouse') return; down = true; sx = ev.clientX; sy = ev.clientY; });
    hero.addEventListener('pointerup', function (ev) {
      if (!down) return; down = false;
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(i + (dx < 0 ? 1 : -1));
    });
    hero.addEventListener('pointercancel', function () { down = false; });
    if (IO) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; restart(); }, { threshold: 0.25 }).observe(hero);
    syncs.push(restart);
    mark(); restart();
  })();

  /* ── ③ 흐르는 사진 띠: 한 벌 더 붙여 끊김 없이 */
  var mq = $('[data-bd-mq]');
  if (mq && calm) mq.tabIndex = -1;   /* 움직임 줄이기: 옆으로 미는 띠가 되는데, 꾸밈(aria-hidden)이라 Tab 이 멈추지 않게 */
  if (mq && !calm) {
    var mtr = $('.bd-mq-tr', mq);
    $$('li', mtr).forEach(function (li) { mtr.appendChild(li.cloneNode(true)); });
    mq.classList.add('run');
    if (IO) new IntersectionObserver(function (es) { mq.classList.toggle('off', !es[0].isIntersecting); }).observe(mq);
  }

  /* ── ④ 서비스 카드 넘김 */
  var car = $('[data-bd-car]');
  if (car) (function () {
    var tr = $('[data-bd-car-tr]', car), vis = false, hold = false, timer = 0;
    var step = function (d) {
      var li = $('li', tr); if (!li) return;
      var w = li.getBoundingClientRect().width + (parseFloat(getComputedStyle(tr).columnGap) || 0);
      var max = tr.scrollWidth - tr.clientWidth, x = tr.scrollLeft + d * w;
      if (d > 0 && tr.scrollLeft >= max - 4) x = 0;
      if (d < 0 && tr.scrollLeft <= 4) x = max;
      tr.scrollTo({ left: Math.max(0, Math.min(max, x)), behavior: calm ? 'auto' : 'smooth' });
    };
    var sync = function () {
      clearInterval(timer);
      if (calm || paused || !vis || hold || doc.hidden || dlgOpen()) return;
      timer = setInterval(function () { step(1); }, 3600);
    };
    var p = $('[data-bd-car-prev]', car), nx = $('[data-bd-car-next]', car);
    if (p) p.addEventListener('click', function () { step(-1); sync(); });
    if (nx) nx.addEventListener('click', function () { step(1); sync(); });
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (e) { car.addEventListener(e, function () { hold = true; sync(); }, { passive: true }); });
    ['pointerleave', 'focusout'].forEach(function (e) { car.addEventListener(e, function () { hold = false; sync(); }); });
    car.addEventListener('touchend', function () { setTimeout(function () { hold = false; sync(); }, 6000); }, { passive: true });
    if (IO) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; sync(); }, { threshold: 0.4 }).observe(car);
    syncs.push(sync);
  })();

  /* ── ⑤ PC 아래 신청 바 */
  var bar = $('[data-bd-bar]');
  if (bar) (function () {
    var C = window.TM || {}, ENDPOINT = C.endpoint || '';
    var f = $('[data-bd-form]', bar), tel = f.elements.tel, ok = f.elements.ok, go = $('button[type=submit]', f);
    var msg = $('[data-bd-msg]', bar), pop = $('[data-bd-pop]', bar), more = $('[data-bd-more]', bar), done = $('[data-bd-done]', bar);
    var TELRE = /^(010\d{8}|01[16789]\d{7,8})$/, busy = false;
    var TEL_BAD = '휴대폰 번호를 확인해 주세요. 예) 010-1234-5678', SEND_BAD = '보내지 못했어요. 잠시 뒤 다시 눌러 보시거나 카톡·전화로 상담해 주세요';
    var digits = function (v) { var d = String(v || '').replace(/\D/g, ''); return /^8210/.test(d) ? '0' + d.slice(2) : d; };
    if (!msg.id) msg.id = 'bd-bar-msg';
    /* 안내 글은 저절로 사라지지 않는다(고칠 때까지 보임) · 잘못된 칸과 이어 준다 */
    var say = function (t, field) {
      msg.textContent = t; msg.hidden = !t;
      [tel, ok].forEach(function (x) { x.removeAttribute('aria-invalid'); x.removeAttribute('aria-describedby'); });
      if (t && field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', msg.id); }
      if (pop && t) { pop.hidden = true; more.setAttribute('aria-expanded', 'false'); }
    };
    setTimeout(function () { bar.classList.add('on'); }, calm ? 0 : 700);
    ok.addEventListener('change', function () { if (!msg.hidden) say(''); });
    tel.addEventListener('input', function () {
      if (!msg.hidden) say('');
      var d = digits(tel.value).slice(0, 11); if (!/^01/.test(d)) return;
      var mid = d.length === 10 ? 6 : 7;
      tel.value = d.length < 4 ? d : d.length <= mid ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, mid) + '-' + d.slice(mid);
    });
    if (more) more.addEventListener('click', function () {
      var on = pop.hidden; pop.hidden = !on; more.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on) say('');
    });
    doc.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape' || !pop || pop.hidden) return;
      var inPop = pop.contains(doc.activeElement);
      pop.hidden = true; more.setAttribute('aria-expanded', 'false');
      if (inPop) more.focus();   /* 안내 글 안에 있던 초점이 사라지지 않게 '보기' 단추로 */
    });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) return;
      if (!TELRE.test(digits(tel.value))) { say(TEL_BAD, tel); tel.focus(); return; }
      if (!ok.checked) { say('[필수] 개인정보 수집·이용 동의에 체크해 주세요', ok); ok.focus(); return; }
      if (!ENDPOINT) { say(SEND_BAD); return; }
      var biz = f.elements.biz.value, ind = f.elements.ind.value;
      var data = {
        type: 'lead', '요청': '전화 상담 예약', '이름': '(호칭 없음)', '연락처': tel.value.trim(), '통화 편한 시간': '언제든',
        '업종': ind || '(선택 안 함)', '남기실 말씀': [biz, '신청 페이지 아래 신청 바'].join(' · '),
        '작년 매출': '-', '직원(4대보험)': '-', '추천 요금제': '-', '예상 기장료': '-',
        '들어온 곳': '(광고 확인 동의 안 함)', '광고': '-', '캠페인': '-', '시안': doc.body.getAttribute('data-page') || 'apply',
        '개인정보 수집·이용 동의': '동의함', '_honey': (f.elements.hp || {}).value || ''
      };
      busy = true; go.setAttribute('aria-disabled', 'true'); say('');
      var ac = 'AbortController' in window ? new AbortController() : null, to = ac ? setTimeout(function () { ac.abort(); }, 20000) : 0;
      var idle = function () { clearTimeout(to); busy = false; go.removeAttribute('aria-disabled'); };
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), signal: ac ? ac.signal : undefined })
        .then(function (r) { return r.text(); })
        .then(function (t) {
          idle(); t = String(t || '').trim();
          if (t === 'bad') { say(TEL_BAD, tel); tel.focus(); return; }
          if (t !== 'ok' && t !== 'dup' && t !== 'held') { say(SEND_BAD); return; }
          try { if (typeof window.TM_TRACK === 'function') window.TM_TRACK('form_submit', {}); } catch (x) {}
          /* 어느 번호로 접수됐는지 보여 주고(잘못 친 번호를 알아채게), 초점을 완료 글로 옮긴다 */
          var ds = $('span', done); if (ds) ds.textContent = '· 평일 10:00~17:30에 전화드릴게요 (' + tel.value.trim() + ')';
          f.hidden = true; done.hidden = false; done.tabIndex = -1;
          try { done.focus({ preventScroll: true }); } catch (x) { done.focus(); }
        })
        .catch(function () { idle(); say(SEND_BAD); });
    });
  })();
})();
