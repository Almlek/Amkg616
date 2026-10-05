/* ═══════════════════════════════════════════════════════
   onboarding.js — معالج الحصول على مفتاح Gemini API خطوة بخطوة
   ملف مستقل تماماً عن core.js — لا يحتاج أي تعديل بـ index.html.
   يعتمد فقط على window.HaelCore (getApiKey, saveApiKeyDirect).
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const APIKEY_URL = 'https://aistudio.google.com/apikey';
  const IMG_STEP1 = 'assets/apikey-step1.jpg';
  const IMG_STEP2 = 'assets/apikey-step2.jpg';
  const IMG_STEP3 = 'assets/apikey-step3.jpg';

  function core() { return window.HaelCore; }
  let step = 0;
  let modalEl = null;

  function injectStyles() {
    if (document.getElementById('obStyles')) return;
    const css = `
    .ob-body{padding:18px;display:flex;flex-direction:column;gap:14px;max-height:78vh;overflow-y:auto}
    .ob-title{font-size:16px;font-weight:900;color:var(--primary-2,#6D28D9);margin:0}
    .ob-text{font-size:13.5px;line-height:1.85;color:var(--ink,#1E1B4B);margin:0}
    .ob-img-wrap{border:2px solid var(--primary,#7C3AED);border-radius:12px;overflow:hidden;background:#111}
    .ob-img-wrap img{width:100%;display:block}
    .ob-caption{background:var(--primary-soft,#EDE9FE);color:var(--primary-2,#6D28D9);border-radius:10px;padding:10px 12px;font-size:13.5px;font-weight:700;text-align:center;line-height:1.7}
    .ob-link-btn{display:block;text-align:center;background:var(--primary,#7C3AED);color:#fff;text-decoration:none;padding:13px;border-radius:12px;font-weight:800;font-size:15px}
    .ob-actions{display:flex;gap:8px;margin-top:4px}
    .ob-btn{flex:1;padding:12px;border-radius:10px;border:none;font-weight:800;font-size:14px;font-family:inherit;cursor:pointer}
    .ob-btn.primary{background:var(--primary,#7C3AED);color:#fff}
    .ob-btn.ghost{background:var(--primary-soft,#EDE9FE);color:var(--primary-2,#6D28D9)}
    .ob-key-input{width:100%;box-sizing:border-box;border:1.5px solid var(--line,#eee);border-radius:10px;padding:12px;font-size:14px;text-align:center;letter-spacing:1px;font-family:monospace;background:var(--paper,#FAF5FF);color:var(--ink,#1E1B4B)}
    .ob-dots{display:flex;justify-content:center;gap:6px;margin-top:2px}
    .ob-dot{width:7px;height:7px;border-radius:50%;background:var(--line,#e5e7eb)}
    .ob-dot.active{background:var(--primary,#7C3AED)}
    .ob-skip{text-align:center;font-size:12px;color:var(--text-soft,#6b7280);cursor:pointer;text-decoration:underline}
    .ob-success{text-align:center;padding:20px 10px}
    .ob-success .emoji{font-size:52px}
    `.trim();
    const style = document.createElement('style');
    style.id = 'obStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildModal() {
    injectStyles();
    const bg = document.createElement('div');
    bg.className = 'modal-bg is-active';
    bg.id = 'obModal';
    bg.innerHTML = `
      <div class="modal-card">
        <div class="modal-hdr">
          <strong>🔑 إعداد مفتاح الذكاء الاصطناعي</strong>
          <button class="modal-close" id="obCloseBtn" type="button">✕</button>
        </div>
        <div class="ob-body" id="obBody"></div>
      </div>`;
    document.body.appendChild(bg);
    bg.querySelector('#obCloseBtn').addEventListener('click', closeModal);
    modalEl = bg;
    return bg;
  }

  function closeModal() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
  }

  function dots(activeIndex, total) {
    let html = '<div class="ob-dots">';
    for (let i = 0; i < total; i++) html += `<span class="ob-dot ${i === activeIndex ? 'active' : ''}"></span>`;
    return html + '</div>';
  }

  function renderStep0() {
    const body = document.getElementById('obBody');
    body.innerHTML = `
      <p class="ob-title">قبل ما تبدأ...</p>
      <p class="ob-text">كل ميزات الذكاء الاصطناعي بالتطبيق (تحضير الدروس، الاختبارات، المساعد الذكي...) تحتاج مفتاحاً مجانياً من Google. الحصول عليه يأخذ أقل من دقيقة، وسنمشي معك خطوة بخطوة بالصور.</p>
      <a class="ob-link-btn" href="${APIKEY_URL}" target="_blank" rel="noopener" id="obGoLink">🔗 اضغط هنا للذهاب إلى الموقع</a>
      <div class="ob-actions">
        <button class="ob-btn primary" id="obNextBtn" type="button">التالي: كيف أنشئ المفتاح؟</button>
      </div>
      <div class="ob-skip" id="obSkipBtn">تخطّي الآن، أدخل المفتاح لاحقاً من الإعدادات</div>
      ${dots(0, 5)}
    `;
    body.querySelector('#obNextBtn').addEventListener('click', () => { step = 1; renderStep1(); });
    body.querySelector('#obSkipBtn').addEventListener('click', closeModal);
  }

  function renderStep1() {
    const body = document.getElementById('obBody');
    body.innerHTML = `
      <p class="ob-title">الخطوة 1 من 3</p>
      <div class="ob-img-wrap"><img src="${IMG_STEP1}" alt="اضغط Create API key"></div>
      <div class="ob-caption">اضغط على الزر "Create API key" في الأعلى — بالضبط مكان الدائرة الحمراء 👆</div>
      <div class="ob-actions">
        <button class="ob-btn ghost" id="obBackBtn" type="button">رجوع</button>
        <button class="ob-btn primary" id="obNextBtn" type="button">ضغطت عليه، التالي</button>
      </div>
      ${dots(1, 5)}
    `;
    body.querySelector('#obBackBtn').addEventListener('click', () => { step = 0; renderStep0(); });
    body.querySelector('#obNextBtn').addEventListener('click', () => { step = 2; renderStep2(); });
  }

  function renderStep2() {
    const body = document.getElementById('obBody');
    body.innerHTML = `
      <p class="ob-title">الخطوة 2 من 3</p>
      <div class="ob-img-wrap"><img src="${IMG_STEP2}" alt="اضغط Create key"></div>
      <div class="ob-caption">اترك الاسم كما هو (أو غيّره إن حبيت)، ثم اضغط "Create key" — بالضبط مكان الدائرة الحمراء 👆</div>
      <div class="ob-actions">
        <button class="ob-btn ghost" id="obBackBtn" type="button">رجوع</button>
        <button class="ob-btn primary" id="obNextBtn" type="button">ظهرت التفاصيل، التالي</button>
      </div>
      ${dots(2, 5)}
    `;
    body.querySelector('#obBackBtn').addEventListener('click', () => { step = 1; renderStep1(); });
    body.querySelector('#obNextBtn').addEventListener('click', () => { step = 3; renderStep3(); });
  }

  function renderStep3() {
    const body = document.getElementById('obBody');
    body.innerHTML = `
      <p class="ob-title">الخطوة 3 من 3</p>
      <div class="ob-img-wrap"><img src="${IMG_STEP3}" alt="انسخ المفتاح"></div>
      <div class="ob-caption">ستظهر لك شاشة "API key details" فيها المفتاح كاملاً (يبدأ بـ AQ.) — اضغط أيقونة النسخ 📋 بجانبه بالضبط مكان الدائرة الحمراء 👆</div>
      <div class="ob-actions">
        <button class="ob-btn ghost" id="obBackBtn" type="button">رجوع</button>
        <button class="ob-btn primary" id="obNextBtn" type="button">نسخت المفتاح، التالي</button>
      </div>
      ${dots(3, 5)}
    `;
    body.querySelector('#obBackBtn').addEventListener('click', () => { step = 2; renderStep2(); });
    body.querySelector('#obNextBtn').addEventListener('click', () => { step = 4; renderStep4(); });
  }

  function renderStep4() {
    const body = document.getElementById('obBody');
    body.innerHTML = `
      <p class="ob-title">الصق المفتاح الآن</p>
      <p class="ob-text">المفتاح الذي نسخته يبدأ بـ <b>AQ.</b> — الصقه هنا:</p>
      <input type="text" class="ob-key-input" id="obKeyInput" placeholder="الصق المفتاح هنا">
      <div class="ob-actions">
        <button class="ob-btn ghost" id="obPasteBtn" type="button">📋 لصق من الحافظة</button>
        <button class="ob-btn primary" id="obSaveBtn" type="button">حفظ المفتاح</button>
      </div>
      <div class="ob-text" id="obErrMsg" style="color:#DC2626;text-align:center;display:none">الصق المفتاح أولاً بالمربع أعلاه.</div>
      ${dots(4, 5)}
    `;
    body.querySelector('#obPasteBtn').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) document.getElementById('obKeyInput').value = text.trim();
      } catch (e) {
        document.getElementById('obKeyInput').focus(); // فشل الوصول التلقائي للحافظة — يلصق المعلم يدوياً
      }
    });
    body.querySelector('#obSaveBtn').addEventListener('click', () => {
      const key = document.getElementById('obKeyInput').value.trim();
      if (!key) { document.getElementById('obErrMsg').style.display = 'block'; return; }
      core().saveApiKeyDirect(key);
      step = 5; renderStep5();
    });
  }

  function renderStep5() {
    const body = document.getElementById('obBody');
    body.innerHTML = `
      <div class="ob-success">
        <div class="emoji">🎉</div>
        <p class="ob-title">مبروك عليك!</p>
        <p class="ob-text">تم حفظ مفتاحك بنجاح. تقدر الآن تستخدم كل ميزات الذكاء الاصطناعي بالتطبيق — تحضير الدروس، الاختبارات، والمساعد الذكي.</p>
      </div>
      <div class="ob-actions">
        <button class="ob-btn primary" id="obDoneBtn" type="button">ابدأ الاستخدام</button>
      </div>
    `;
    body.querySelector('#obDoneBtn').addEventListener('click', closeModal);
  }

  function openWizard() {
    if (modalEl) return;
    buildModal();
    step = 0;
    renderStep0();
  }

  // زر "؟" صغير بجانب حقل مفتاح API بشاشة الإعدادات، بدون أي تعديل على index.html
  function injectHelperLink() {
    const field = document.getElementById('sApiKey');
    if (!field || document.getElementById('obHelperLink')) return;
    const link = document.createElement('div');
    link.id = 'obHelperLink';
    link.textContent = '❓ ما أدري كيف أحصل على المفتاح — وضّح لي بالصور';
    link.style.cssText = 'font-size:12.5px;color:var(--primary-2,#6D28D9);text-decoration:underline;cursor:pointer;margin-top:6px;font-weight:700';
    link.addEventListener('click', openWizard);
    field.insertAdjacentElement('afterend', link);
  }

  function boot() {
    injectHelperLink();
    if (!core() || core().getApiKey()) return; // عنده مفتاح مسبقاً — لا داعي للمعالج التلقائي
    openWizard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // إعادة محاولة إضافة الزر المساعد لو شاشة الإعدادات لم تُبنَ بعد وقت التحميل الأول
  setTimeout(injectHelperLink, 1500);
})();
