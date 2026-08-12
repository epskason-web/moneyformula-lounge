// 錢途雅座 Money Formula Lounge — shared site script

const CI_STANDARD_DATE = '2026-09-01T00:00:00+08:00';

function daysUntilCIStandard() {
  const diff = new Date(CI_STANDARD_DATE) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function initMobileNav() {
  const btn = document.querySelector('.mobile-menu-btn');
  const panel = document.querySelector('.mobile-nav');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    btn.querySelector('path')?.setAttribute('d',
      open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
  });
}

function initToggleGroups() {
  document.querySelectorAll('.toggle-group').forEach(group => {
    group.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });
}

function initCountdown() {
  const days = daysUntilCIStandard();
  document.querySelectorAll('[data-ci-days]').forEach(el => { el.textContent = days; });

  const bar = document.querySelector('.countdown-bar');
  if (bar && sessionStorage.getItem('mfl-cd-bar-closed') === '1') bar.remove();
  bar?.querySelector('.cd-close')?.addEventListener('click', () => {
    sessionStorage.setItem('mfl-cd-bar-closed', '1');
    bar.remove();
  });

  const modal = document.querySelector('.cd-modal');
  if (!modal) return;
  const close = () => modal.classList.remove('open');
  modal.querySelector('.cd-x')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  document.querySelectorAll('[data-open-cd]').forEach(t => {
    t.addEventListener('click', e => { e.preventDefault(); modal.classList.add('open'); });
  });

  if (days > 0 && !localStorage.getItem('mfl-cd-modal-seen')) {
    setTimeout(() => {
      modal.classList.add('open');
      localStorage.setItem('mfl-cd-modal-seen', '1');
    }, 6000);
  }
}

/* ---------- 查詢清單 (wishlist, localStorage) ---------- */
const Wishlist = {
  key: 'mfl-wishlist',
  read() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; }
  },
  write(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    this.render();
  },
  has(id) { return this.read().some(i => i.id === id); },
  toggle(id, name, cat) {
    const items = this.read();
    const at = items.findIndex(i => i.id === id);
    if (at >= 0) items.splice(at, 1); else items.push({ id, name, cat });
    this.write(items);
  },
  remove(id) { this.write(this.read().filter(i => i.id !== id)); },
  render() {
    const items = this.read();
    document.querySelectorAll('.wish-count').forEach(c => {
      c.textContent = items.length;
      c.classList.toggle('show', items.length > 0);
    });
    document.querySelectorAll('[data-wish-id]').forEach(btn => {
      const on = this.has(btn.dataset.wishId);
      btn.classList.toggle('added', on);
      btn.textContent = on ? '✓ 已加入查詢清單' : '＋ 加入查詢清單';
    });
    const body = document.querySelector('.wish-body');
    if (!body) return;
    body.innerHTML = items.length
      ? items.map(i => `<div class="wish-item"><div><b></b><span></span></div><button aria-label="移除" data-wish-remove="${encodeURIComponent(i.id)}">✕</button></div>`).join('')
      : '<div class="wish-empty">查詢清單是空的<br>喺計劃頁面加入你有興趣嘅方案</div>';
    // Fill text via textContent so plan names can never inject markup
    body.querySelectorAll('.wish-item').forEach((row, idx) => {
      row.querySelector('b').textContent = items[idx].name;
      row.querySelector('span').textContent = items[idx].cat || '';
    });
    body.querySelectorAll('[data-wish-remove]').forEach(b => {
      b.addEventListener('click', () => this.remove(decodeURIComponent(b.dataset.wishRemove)));
    });
  }
};

function initWishlist() {
  const drawer = document.querySelector('.wish-drawer');
  const overlay = document.querySelector('.wish-overlay');
  const open = () => { drawer?.classList.add('open'); overlay?.classList.add('open'); };
  const close = () => { drawer?.classList.remove('open'); overlay?.classList.remove('open'); };

  document.querySelectorAll('.wish-btn').forEach(b => b.addEventListener('click', open));
  drawer?.querySelector('.wish-head button')?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  document.querySelectorAll('[data-wish-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      Wishlist.toggle(btn.dataset.wishId, btn.dataset.wishName, btn.dataset.wishCat);
    });
  });
  Wishlist.render();
}

/* ---------- 智能配對問答 (keyword-matched FAQ, not generative AI) ---------- */
const FAQ_BANK = [
  { q: '我月入 3 萬，應該點樣安排保障？',
    k: ['月入', '收入', '3萬', '三萬', '預算', '點買', '應該買'],
    a: '一般規劃次序係：先補「一場大病會即刻拖垮現金流」嘅缺口，再講儲蓄增值。實務上多數人會由自願醫保（住院手術實報實銷、保費可扣稅）打底，再加危疾一筆過賠償去頂住治療期間停工嘅收入損失，最後先用剩餘預算做儲蓄或年金。每個人家庭負擔同現有公司保障都唔同，建議由顧問睇過你現有保單先落決定。' },
  { q: '危疾同醫療保險有咩分別？',
    k: ['危疾', '醫療', '分別', '唔同', '差別', 'vs'],
    a: '醫療保險係「實報實銷」— 你住院做手術，佢照單據賠返醫療開支，錢係跟住帳單走。危疾保險係「一筆過現金」— 確診指定疾病，保險公司即刻過一筆錢俾你，你想用嚟交醫藥費、請人照顧屋企、抑或補返停工嘅人工都得。兩者係互補，唔係二選一：醫保處理帳單，危疾處理帳單以外嘅生活衝擊。' },
  { q: '2026 年 9 月 1 日危疾定義標準化，關我咩事？',
    k: ['標準化', '9月', '定義', 'hkfi', '保聯', '新標準', '倒數'],
    a: '香港保險業聯會將 21 項危疾定義統一，2026 年 9 月 1 日生效。重點係：新準則<b>不具追溯效力</b>，只適用於生效日或之後推出嘅新產品，你手上已簽發嘅保單條款維持不變。所以如果你現有保單喺某啲項目比新標準寬鬆（例如冇 90／180 日持續期要求），嗰個係你既有嘅合約利益。想知自己張單企喺邊，可以睇我哋嘅對照分析。' },
  { q: '點樣合法慳稅？',
    k: ['慳稅', '扣稅', '稅務', '免稅', '報稅'],
    a: '香港個人入息稅有三類保險／退休相關扣除：自願醫保（VHIS）每名受保人每年上限 HK$8,000；合資格延期年金（QDAP）連同強積金可扣稅自願性供款（TVC）合計每年上限 HK$60,000。實際慳到幾多 = 扣除額 × 你嘅邊際稅率，可以用我哋嘅稅務計算機估算。以稅務局最新指引為準。' },
  { q: '退休要儲幾多錢先夠？',
    k: ['退休', '幾多錢', '年金', '夠唔夠', '養老'],
    a: '常見做法係倒推：先估退休後每月開支（多數人約為退休前收入嘅 60–70%），乘以預計退休年期，再減去強積金同其他資產嘅預期提取額，個差額就係你要自己補嘅缺口。年金產品嘅作用係將一筆資產轉成「派到百年歸老」嘅穩定現金流，對沖長壽風險。' },
  { q: '我同太太啱啱有 BB，要買咩？',
    k: ['bb', '仔女', '小朋友', '新生', '爸媽', '生仔', '家庭'],
    a: '新手父母通常有三個缺口：（一）家庭經濟支柱嘅人壽保障 — 萬一收入斷咗，屋企仲有錢生活；（二）大人自己嘅危疾同醫保 — 照顧者病咗先係最大風險；（三）小朋友嘅醫療保障同教育儲蓄。次序上建議先保大人再保細路，因為細路嘅生活係靠大人嘅收入撐住。' },
  { q: '我有冇保障 gap？',
    k: ['gap', '缺口', '夠唔夠', '檢視', '現有'],
    a: '快速自檢四條問題：① 公司醫保以外，你有冇自己嘅個人醫保？（離職即失效）② 你嘅危疾保額夠唔夠覆蓋 2–3 年家庭開支？③ 你嘅人壽保額有冇覆蓋按揭餘額同子女到成年嘅開支？④ 你張醫保有冇保證續保？任何一條答唔到，就係缺口。我哋提供免費保單檢視。' },
  { q: '已經有公司醫保，仲需唔需要自己買？',
    k: ['公司醫保', '團體', '轉工', '離職', '仲使唔使'],
    a: '需要。公司醫保通常離職即終止，而人往往喺年紀大咗、身體開始有狀況先離開職場 — 嗰陣再買個人醫保，可能要加保費甚至被拒保。個人醫保嘅價值係「鎖住你健康時嘅核保條件」，而且可以同公司醫保疊埋用，減低自付金額。' }
];

function initSmartFaq() {
  const box = document.querySelector('.faq-ai');
  if (!box) return;
  const input = box.querySelector('input');
  const panel = box.querySelector('.faq-ai-answer');

  const show = item => {
    panel.querySelector('h5').textContent = item.q;
    panel.querySelector('p').innerHTML = item.a;
    panel.classList.add('show');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const match = text => {
    const t = text.toLowerCase().replace(/\s/g, '');
    if (!t) return null;
    let best = null, bestScore = 0;
    for (const item of FAQ_BANK) {
      const score = item.k.reduce((n, kw) => n + (t.includes(kw.toLowerCase()) ? 1 : 0), 0);
      if (score > bestScore) { best = item; bestScore = score; }
    }
    return best;
  };

  const ask = () => {
    const hit = match(input.value);
    if (hit) return show(hit);
    panel.querySelector('h5').textContent = '呢條問題想搵人真人答？';
    panel.querySelector('p').innerHTML =
      '呢個係關鍵字配對嘅常見問題庫，暫時未收錄你問嘅內容。你可以撳下面嘅熱門問題，或者直接 WhatsApp 我哋嘅持牌顧問，由真人幫你分析。';
    panel.classList.add('show');
  };

  box.querySelector('.faq-ai-input button')?.addEventListener('click', ask);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });
  box.querySelectorAll('.faq-ai-chips button').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent;
      ask();
    });
  });
}

/* ---------- 稅務計算機 ---------- */
const TAX_BANDS = [[50000, 0.02], [50000, 0.06], [50000, 0.10], [50000, 0.14], [Infinity, 0.17]];
const STANDARD_RATE = 0.15;
const VHIS_CAP_PER_PERSON = 8000;
const QDAP_TVC_CAP = 60000;

function progressiveTax(net) {
  let remaining = Math.max(0, net), tax = 0;
  for (const [width, rate] of TAX_BANDS) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, width);
    tax += slice * rate;
    remaining -= slice;
  }
  return tax;
}

function taxPayable(income, allowance, deductions) {
  const net = income - allowance - deductions;
  return Math.min(progressiveTax(net), Math.max(0, income - deductions) * STANDARD_RATE);
}

function initTaxCalculator() {
  const form = document.querySelector('.calc-form');
  if (!form) return;
  const num = sel => Math.max(0, Number(form.querySelector(sel)?.value) || 0);
  const money = n => 'HK$' + Math.round(n).toLocaleString('en-US');

  const recalc = () => {
    const income = num('#calc-income') * 12;
    const allowance = Number(form.querySelector('#calc-allowance')?.value) || 132000;
    const vhisPeople = num('#calc-vhis-people');
    const vhisPaid = num('#calc-vhis');
    const qdapPaid = num('#calc-qdap');

    const vhisDeduction = Math.min(vhisPaid, VHIS_CAP_PER_PERSON * vhisPeople);
    const qdapDeduction = Math.min(qdapPaid, QDAP_TVC_CAP);
    const total = vhisDeduction + qdapDeduction;

    const saved = taxPayable(income, allowance, 0) - taxPayable(income, allowance, total);

    document.querySelector('#res-saved').textContent = money(saved);
    document.querySelector('#res-vhis').textContent = money(vhisDeduction);
    document.querySelector('#res-qdap').textContent = money(qdapDeduction);
    document.querySelector('#res-total').textContent = money(total);
    document.querySelector('#res-income').textContent = money(income);
  };

  form.addEventListener('input', recalc);
  recalc();
}

/* ---------- Motion: scroll reveal + reading progress ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(e => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  els.forEach(e => io.observe(e));
}

function initReadProgress() {
  const bar = document.querySelector('.read-progress');
  const body = document.querySelector('.article-body');
  if (!bar || !body) return;
  const update = () => {
    const start = body.offsetTop, height = body.offsetHeight - innerHeight;
    const pct = Math.min(100, Math.max(0, ((scrollY - start) / Math.max(height, 1)) * 100));
    bar.style.width = pct + '%';
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------- Insights hub: highlight the category you're reading ---------- */
function initHubRail() {
  const links = document.querySelectorAll('.hub-rail a[href^="#cat-"], .hub-mobile-cats a[href^="#cat-"]');
  const blocks = document.querySelectorAll('.cat-block');
  if (!links.length || !blocks.length) return;
  const setOn = id => links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) setOn(en.target.id); });
  }, { rootMargin: '-96px 0px -70% 0px' });
  blocks.forEach(b => io.observe(b));
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initReveal();
  initReadProgress();
  initHubRail();
  initToggleGroups();
  initCountdown();
  initWishlist();
  initSmartFaq();
  initTaxCalculator();
});
