/* 택스민 랜딩 설정 — 값만 바꾸면 된다(코드는 tm.js·tags.js).
   ga4·gads·naverWa 가 비어 있으면 그 도구는 켜지지 않는다(개인정보처리방침 4번과 맞춰 켤 것). */
window.TM = {
  kakao: 'https://pf.kakao.com/_Mxojqs/chat',
  tel: '0507-1445-7729',
  /* 전화 상담 예약 → 구글 Apps Script → 사무소 시트·메일(기존 당근 랜딩과 같은 접수처) */
  endpoint: 'https://script.google.com/macros/s/AKfycbxk6_zDmGd_aj9bfhUwitYn-3rVxdYVI9JQ9tuUpjGZn5TlRgt86-tV7uZ88HVkZmpt4A/exec',
  hitBeacon: true,
  ga4: 'G-3QN21HDBPJ',        /* 예: 'G-XXXXXXXXXX' (새 도메인용 GA4 속성) */
  gads: 'AW-18554274766',   /* 구글 광고 계정 382-975-1705 */
  gadsLabels: {             /* 구글 광고 전환 액션 라벨 */
    kakao_click: 'HGJaCOqCmrcdEM6Hr49F',    /* 카톡 상담 클릭 */
    tel_click: 'ny3pCO2CmrcdEM6Hr49F',      /* 전화 버튼 클릭 */
    form_submit: '-23eCPCCmrcdEM6Hr49F',    /* 전화 상담 예약 */
    calc_complete: '2mzsCPOCmrcdEM6Hr49F'   /* 기장료 계산 완료 */
  },
  naverWa: '',      /* 네이버 검색광고 전환 추적 계정 값(설치 안내 메일) */
  naverConv: {      /* 전환 이름 → 네이버 전환 유형(설치 안내 메일 기준으로 맞춤) */
    form_submit: 'lead',
    kakao_click: 'custom001',
    tel_click: 'custom002',
    calc_complete: 'custom003'
  }
};
