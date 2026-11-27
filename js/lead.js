/* 택스민 상담 접수 — window.TaxminLead.send(payload) → Promise<{ok, message, field?, code}>
 *
 * 따라 한 것(2026-11-25 taxminlp.com 의 js/config.js · js/tm.js 를 읽고 그대로 맞춤):
 *  - 받는 곳: config.js 의 TM.endpoint (구글 Apps Script 웹 앱 /exec — 사무소 시트·메일, 당근 랜딩과 같은 접수처). 토큰·키 없음.
 *  - 보내는 꼴: fetch POST, 'Content-Type: text/plain;charset=utf-8', body = JSON.stringify(data)  (tm.js 전화 상담 예약과 같음)
 *  - data 칸 이름(시트 열): type:'lead' · 요청 · 이름 · 연락처 · 통화 편한 시간 · 업종 · 남기실 말씀 · 작년 매출 · 직원(4대보험) ·
 *    추천 요금제 · 예상 기장료 · 들어온 곳 · 광고 · 캠페인 · 시안 · 개인정보 수집·이용 동의 · _honey
 *  - 답(글자): 'ok'·'dup'·'held' = 접수됨, 'bad' = 번호가 틀림, 그 밖 = 실패. 20초 넘으면 끊음(tm.js 신청 창과 같음).
 *  - 휴대폰 번호 검사도 tm.js 와 같음(010 은 11자리, 011·016~019 는 10~11자리, +82 10… 은 010… 으로).
 *  - 들어온 곳(광고·검색) 기록도 tm.js 와 같은 키: sessionStorage 'tm_src'(이번 방문) · localStorage 'tm_first'(처음, 30일).
 *    시트로 보내는 것은 [선택] 광고 확인 동의(payload.adConsent === true)가 있을 때만 — 없으면 tm.js 처럼 '(광고 확인 동의 안 함)'.
 *  - 이 페이지 접수는 '시안' 칸이 custom-main / custom-build 로 남아 taxminlp.com 접수(srch-…)와 구분됨.
 *
 * payload (모두 글자, 없으면 빈칸):
 *  name 이름 또는 상호 · tel 휴대폰 번호(필수) · agree 필수 동의(true 여야 보냄) · when 편한 연락 시간
 *  startMonth 시작 희망 달 · current 지금 맡긴 곳(있음/없음) · message 문의 내용 · plan 고른 설계안 요약(→ '남기실 말씀'에 붙음)
 *  ind 업종 · rev 작년 매출 · emp 직원 수 · tier 구간 · price 예상 기장료 · page 'main'|'build' · where 어느 창에서 보냈나
 *  honey 로봇 막기 숨은 칸 값 · adConsent [선택] 광고 확인 동의
 */
(function () {
  'use strict';
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxk6_zDmGd_aj9bfhUwitYn-3rVxdYVI9JQ9tuUpjGZn5TlRgt86-tV7uZ88HVkZmpt4A/exec';
  var TEL = '0507-1445-7729';
  var TIMEOUT = 20000;
  var OTHER = '전화(' + TEL + ')나 카톡으로 연락 주세요.';
  var TEL_MSG = '010 등으로 시작하는 휴대폰 번호를 적어 주세요. 예: 010-1234-5678';   // index·build 의 why() 와 같은 글(okTel 이 011·016~019 도 받음)

  function sget(k, local) { try { return (local ? localStorage : sessionStorage).getItem(k); } catch (e) { return null; } }
  function sset(k, v, local) { try { (local ? localStorage : sessionStorage).setItem(k, v); } catch (e) {} }
  function parse(s) { try { return JSON.parse(s || 'null'); } catch (e) { return null; } }
  function str(v) { return v == null ? '' : String(v).trim(); }
  function digitsOf(t) { var d = str(t).replace(/\D/g, ''); return /^8210/.test(d) ? '0' + d.slice(2) : d; }
  function okTel(t) { return /^(010\d{8}|01[16789]\d{7,8})$/.test(digitsOf(t)); }
  function pretty(d) { return d.length === 11 ? d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7) : d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6); }

  /* 들어온 곳(tm.js SRC 와 같은 규칙) — 페이지를 열 때 한 번 기억 */
  var SRC = (function () {
    var q, g = function () { return ''; };
    try { q = new URLSearchParams(location.search); g = function (k) { return (q.get(k) || '').trim(); }; } catch (e) {}
    var kw = g('n_keyword') || g('n_query') || g('utm_term');
    var label = '', key = 'direct';
    if (g('n_media') || g('n_keyword') || g('n_query') || g('n_ad')) { label = '네이버 검색광고' + (kw ? ' · 키워드 ' + kw : ''); key = 'naver_ad'; }
    else if (g('gclid') || g('gbraid') || g('wbraid')) { label = '구글 광고' + (kw ? ' · 키워드 ' + kw : ''); key = 'google_ad'; }
    else if (g('utm_source') || g('src')) {
      var s = g('utm_source') || g('src');
      label = s + (g('utm_medium') ? ' / ' + g('utm_medium') : '') + (g('utm_campaign') ? ' · ' + g('utm_campaign') : '');
      key = s;
    } else {
      var host = '';
      try { host = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
      var map = [[/naver\./, '네이버 검색', 'naver'], [/google\./, '구글 검색', 'google'], [/daum\.|kakao\./, '다음·카카오', 'daum'],
        [/daangn|karrot/, '당근', 'daangn'], [/instagram|facebook/, '인스타그램', 'instagram'], [/youtube/, '유튜브', 'youtube']];
      for (var i = 0; i < map.length; i++) { if (map[i][0].test(host)) { label = map[i][1]; key = map[i][2]; break; } }
      if (!label) {
        if (host && host !== location.hostname) { label = host; key = host; }
        else { label = '직접 방문'; key = 'direct'; }
      }
    }
    var cur = { label: label, key: key, ad: g('utm_content') || g('n_ad') || '', camp: g('utm_campaign') || g('n_campaign_type') || '' };
    var prev = parse(sget('tm_src'));
    if (key === 'direct' && prev) cur = prev; else sset('tm_src', JSON.stringify(cur));
    var first = parse(sget('tm_first', 1));
    if (!first || !first.t || (Date.now() - first.t) > 30 * 864e5) { first = { label: cur.label, t: Date.now() }; sset('tm_first', JSON.stringify(first), 1); }
    cur.full = cur.label + (first.label && first.label !== cur.label ? ' (처음 들어온 곳: ' + first.label + ')' : '');
    return cur;
  })();

  /* 우리 칸 → taxminlp.com 시트 칸 */
  function toData(p) {
    var ad = p.adConsent === true;
    var said = [
      str(p.message) && '문의: ' + str(p.message),
      str(p.startMonth) && '시작 희망: ' + str(p.startMonth),
      str(p.current) && '지금 맡긴 곳: ' + str(p.current),
      str(p.plan) && '설계안: ' + str(p.plan),
      str(p.where) || (p.page === 'build' ? '기장 설계 화면' : '메인 화면')
    ].filter(Boolean).join(' · ');
    return {
      type: 'lead', '요청': '전화 상담 예약', '이름': str(p.name) || '(호칭 없음)', '연락처': pretty(digitsOf(p.tel)),
      '통화 편한 시간': str(p.when) || '언제든',
      '업종': str(p.ind) || '-', '남기실 말씀': said,
      '작년 매출': str(p.rev) || '-', '직원(4대보험)': str(p.emp) || '-', '추천 요금제': str(p.tier) || '-',
      '예상 기장료': str(p.price) ? str(p.price) + ' (부가세 별도)' : '-',
      '들어온 곳': ad ? SRC.full : '(광고 확인 동의 안 함)', '광고': ad ? (SRC.ad || '-') : '-', '캠페인': ad ? (SRC.camp || '-') : '-',
      '시안': 'custom-' + (p.page === 'build' ? 'build' : 'main'),
      '개인정보 수집·이용 동의': '동의함', '_honey': str(p.honey)
    };
  }

  var busy = false;
  function send(p) {
    p = p || {};
    var fail = function (m, field, code) { return Promise.resolve({ ok: false, message: m, field: field, code: code || 'invalid' }); };
    if (busy) return fail('보내는 중이에요. 잠시만 기다려 주세요.', null, 'busy');
    if (!okTel(p.tel)) return fail(TEL_MSG, 'tel');
    if (p.agree !== true) return fail('상담 연락 동의(필수)에 체크해 주세요.', 'agree');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return fail('인터넷이 끊겨 있어요. 연결을 확인하고 다시 눌러 주세요.', null, 'offline');
    var data = toData(p), tel = data['연락처'];
    busy = true;
    var ac = typeof AbortController === 'function' ? new AbortController() : null;
    var to = setTimeout(function () { if (ac) ac.abort(); }, TIMEOUT);
    var done = function (r) { clearTimeout(to); busy = false; return r; };
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), signal: ac ? ac.signal : undefined })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        t = String(t || '').trim();
        if (t === 'ok' || t === 'dup' || t === 'held') return done({ ok: true, code: t, message: '접수됐어요. 평일 10:00~17:30 사이에, 주말·공휴일이면 다음 평일에 전화드릴게요. (' + tel + ')' });
        if (t === 'bad') return done({ ok: false, code: 'bad', field: 'tel', message: TEL_MSG });
        return done({ ok: false, code: 'server', message: '보내지 못했어요. 잠시 뒤 다시 눌러 주시거나 ' + OTHER });
      })
      .catch(function (e) {
        var late = e && e.name === 'AbortError';
        return done({ ok: false, code: late ? 'timeout' : 'network', message: (late ? '연결이 오래 걸려 보내지 못했어요. ' : '보내지 못했어요. ') + '잠시 뒤 다시 눌러 주시거나 ' + OTHER });
      });
  }

  console.assert(okTel('010-1234-5678') && okTel('+82 10-1234-5678') && okTel('011-123-4567') && !okTel('02-123-4567') && !okTel('0507-1445-7729') && !okTel('010-123-456'), 'lead: 휴대폰 번호 검사');
  console.assert(pretty('01012345678') === '010-1234-5678' && pretty('0111234567') === '011-123-4567', 'lead: 번호 모양');
  window.TaxminLead = { send: send, toData: toData };
})();
