/* 서비스 이름 옆 '?' 설명 — index.html · build.html 이 함께 씀(부품 하나 + 설명표 하나).
   글은 이 두 페이지(서비스 소개·자주 묻는 질문·설계 화면)에 이미 있는 문장만 옮김. 종합소득세·법인세 수수료 금액은 넣지 않음.
   쓰는 법: 화면 글 안에 QI.btn('pay') 를 넣거나, 처음부터 있는 <button class="qi" data-qi="pay"></button> 은 이 파일이 채움.
   열기·닫기는 브라우저 popover(Esc·바깥 누름으로 닫힘, 초점은 '?' 단추에 그대로). 열린 동안 단추를 따라가고, 단추가 사라지면 닫음. */
(function () {
  'use strict';
  var T = {
    base: ['기본 4가지', '장부·부가세 신고·전담 담당자·세무사 상담 네 가지가 기본이에요. 월별 매출 보고서도 기본에 들어 있어요.'],
    book: ['월 매출·매입 관리', '홈택스의 카드·현금영수증·세금계산서를 모아 장부로 정리해요. 쇼핑몰이라면 스마트스토어·오픈마켓 매출과 판매 수수료도 함께 정리해요.'],
    vat: ['부가가치세 신고', '신고부터 납부서 안내까지, 마감 전에 먼저 챙겨요.'],
    team: ['전담 담당자 · 세무사 상담', '처음 만난 담당자가 계속 맡고, 카톡으로 바로 물어보면 돼요. 세무 판단은 세무사가 직접 답하고, 담당자 답변도 세무사가 확인해요.'],
    review: ['담당자 작성 → 세무사 검토', '기본은 담당자가 장부를 작성하고 세무사가 검토해요. 세무 판단은 세무사가 직접 답하고, 담당자 답변도 세무사가 확인해요.'],
    ai: ['AI 매출 모니터링', '홈택스로 들어오는 카드·현금영수증·세금계산서 매출을 AI가 매달 모아 연말 매출을 예상해요. 신고 의무가 바뀌기 전에 담당자가 먼저 알려 드려요.'],
    rep: ['월별 매출 보고서', '매달 매출·매입 흐름을 한 장으로 받아 봐요. 기본에 들어 있어요.'],
    pay: ['인건비 신고 (4대보험 포함)', '직원 월급 신고와 4대보험 신고를 함께 해요. 직원이 들어오고 나갈 때도 담당자가 먼저 챙겨요. 3명까지 같은 금액이고, 4명부터는 상담 때 정해요.'],
    co: ['공동사업장', '대표가 둘 이상인 사업장이라면 더해요. 소득을 나눠 각자 신고해요.'],
    cpa: ['세무사가 장부를 직접', '기본은 담당자가 작성하고 세무사가 검토해요. 이걸 더하면 세무사가 장부와 신고를 처음부터 직접 맡아요.'],
    tax: ['종합소득세·법인세 신고', '신고 수수료는 장부 상태에 따라 달라서, 신고 전에 금액을 먼저 알려 드리고 동의하신 뒤에 진행해요.'],
    inh: ['증여·상속', '가족에게 재산을 넘기는 일, 세무사가 직접 상담해요. 비용은 일마다 따로이고, 상담 때 먼저 알려 드려요.'],
    law: ['법무', '등기·계약 같은 법무는 법무사·변호사를 연결해 드려요. 비용은 일마다 따로이고, 상담 때 먼저 알려 드려요.'],
    lab: ['노무', '근로계약·분쟁 같은 노무는 노무사를 연결해 드려요. 비용은 일마다 따로이고, 상담 때 먼저 알려 드려요.'],
    loan: ['청약·대출·정책자금', '청약 자격, 사업자 대출, 소상공인 정책자금까지 받을 수 있는지 함께 알아봐 드려요. 신청은 사장님이 직접 하시고, 중개는 하지 않아요.']
  };
  /* 화면에 보이는 이름 → 설명표 키(앞부분이 맞으면 됨, 위에서부터) */
  var NAMES = [['기본 4가지', 'base'], ['월 매출·매입 관리', 'book'], ['법인 장부', 'book'], ['부가가치세 신고', 'vat'], ['전담 담당자', 'team'],
    ['AI 매출 모니터링', 'ai'], ['월별 매출 보고서', 'rep'], ['인건비 신고', 'pay'], ['공동사업장', 'co'], ['세무사가 장부를 직접', 'cpa'],
    ['종합소득세', 'tax'], ['법인세 신고', 'tax'], ['증여·상속', 'inh'], ['법무', 'law'], ['노무', 'lab'], ['청약·대출·정책자금', 'loan']];
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.2"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.2-2.5 3.9"/><circle cx="12" cy="17.1" r=".5" fill="currentColor"/></svg>';
  var ok = typeof HTMLElement !== 'undefined' && HTMLElement.prototype.hasOwnProperty('popover');

  function key(name) { name = String(name || ''); for (var i = 0; i < NAMES.length; i++) if (name.indexOf(NAMES[i][0]) === 0) return NAMES[i][1]; return ''; }
  function btn(k) {
    if (!T[k] || !ok) return '';   // shortcut: popover 가 없는 옛 브라우저(사파리 16 이하 등)에는 '?' 를 그리지 않음 — 설명은 서비스 소개에 그대로 있음
    return '<button type="button" class="qi" data-qi="' + k + '" popovertarget="qi-pop" aria-label="' + T[k][0] + ' 설명 보기">' + ICON + '</button>';
  }

  var css = document.createElement('style');
  css.textContent =
    '.qi{position:relative;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin:0 0 0 6px;padding:0;border:0;border-radius:50%;background:none;color:#8A919C;cursor:pointer;vertical-align:-3px;flex:none;-webkit-tap-highlight-color:transparent}' +
    '.qi::before{content:"";position:absolute;inset:-7px}' +   /* 누르는 자리 32px — 모양 크기·줄 높이는 그대로 */
    '.qi svg{width:18px;height:18px;display:block}' +
    '.qi:hover,.qi.on{color:#2554F0}' +
    '.qi:focus-visible{outline:2px solid #2554F0;outline-offset:2px}' +
    '.qi-pop{position:fixed;inset:auto;margin:0;width:min(300px,calc(100vw - 24px));padding:14px 16px;border:1px solid #E6E8EC;border-radius:10px;background:#fff;color:#191B1F;box-shadow:0 12px 32px rgba(2,6,23,.16);font:500 14px/1.65 "Manrope","Pretendard Variable",Pretendard,system-ui,sans-serif;letter-spacing:-.01em;word-break:keep-all;text-align:left}' +
    '.qi-pop b{display:block;font-weight:700;color:#020617;margin-bottom:4px}' +
    '@media print{.qi,.qi-pop{display:none!important}}';
  document.head.appendChild(css);

  var pop = document.createElement('div'), anchor = null, raf = 0;
  pop.id = 'qi-pop'; pop.className = 'qi-pop';
  if (ok) { pop.setAttribute('popover', ''); document.body.appendChild(pop); }

  function fill(b) {
    var t = T[b.getAttribute('data-qi')]; if (!t) return;
    pop.innerHTML = '<b></b><span></span>'; pop.firstChild.textContent = t[0]; pop.lastChild.textContent = t[1];
    if (anchor) anchor.classList.remove('on');
    anchor = b; b.classList.add('on');
  }
  function place() {
    if (!anchor || !anchor.isConnected || !anchor.getClientRects().length) { try { pop.hidePopover(); } catch (e) {} return; }
    var r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), vw - w - 12), y = r.bottom + 10;
    if (y + h > vh - 8 && r.top - 10 - h > 8) y = r.top - 10 - h;
    pop.style.left = Math.round(x) + 'px'; pop.style.top = Math.round(y) + 'px';
  }
  function tick() { if (!pop.matches(':popover-open')) return; place(); raf = requestAnimationFrame(tick); }

  if (ok) {
    pop.addEventListener('toggle', function (e) {
      cancelAnimationFrame(raf);
      if (e.newState === 'open') tick(); else if (anchor) { anchor.classList.remove('on'); anchor = null; }
    });
    /* 단추의 기본 동작(열기·닫기)보다 먼저: 글을 채움. 다른 '?' 를 누르면 닫지 않고 그 설명으로 바꿈 */
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.qi[data-qi]'); if (!b) return;
      var open = pop.matches(':popover-open');
      if (open && b !== anchor) { e.preventDefault(); fill(b); place(); return; }
      if (!open) fill(b);
    }, true);
  }
  /* 처음부터 화면에 있는 빈 '?' 단추 채우기 */
  [].forEach.call(document.querySelectorAll('button.qi[data-qi]:empty'), function (b) {
    if (!ok || !T[b.dataset.qi]) { b.remove(); return; }
    b.setAttribute('popovertarget', 'qi-pop'); b.setAttribute('aria-label', T[b.dataset.qi][0] + ' 설명 보기'); b.innerHTML = ICON;
  });

  console.assert(key('인건비 신고 (4대보험 포함)') === 'pay' && key('법인세 신고') === 'tax' && key('비용') === '' && key('월 매출·매입 관리 · 플랫폼 매출·수수료') === 'book', 'qi: 이름 → 설명 키');
  window.QI = { btn: btn, key: key };
})();
