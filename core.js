/* ═══════════════════════════════════════════
   الذكي v2.2 — core.js
   ═══════════════════════════════════════════ */
(function () {
  'use strict';




  /* ─── Helpers ─── */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
    // 💡 دالة سحرية لفتح جميع نوافذ التحضير (النص وعناصر التوليد) دفعة واحدة
  function expandPreparationAccordions() {
    $$('.acc-item', $('#newAccordion')).forEach(it => {
      it.classList.add('is-open');
      const panel = $('.acc-panel', it);
      if (panel) panel.hidden = false;
    });
    // التمرير السلس للأسفل ليرى المعلم النص وأزرار التوليد بوضوح
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  // المترجم الشامل للشفرات الرياضية (يعمل بشكل طبيعي مع النصوص المستخرجة)
  function parseMathHTML(text) {
    let t = String(text || '');
    
    // 1. الكسور أولاً: (السر هنا!) نعالج الكسور قبل أي شيء لكي لا تمزق أكواد HTML الخاصة بالأسس
    // 💡 الدرع المطور: يمنع الروابط والتواريخ، و {1,35} يمنع تحويل الجمل النصية الطويلة بالخطأ
    t = t.replace(/\(\s*([^/)'":?]{1,35})\s*\/\s*([^/)'":?]{1,35})\s*\)/g, (m, num, den) => `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 4px; direction: rtl; font-size: 0.9em;"><span style="padding: 0 3px; line-height: 1;">${num.trim()}</span><span style="border-top: 1.5px solid currentColor; margin-top: 1px; padding: 0 3px; line-height: 1;">${den.trim()}</span></span>`);

    // 2. الجذور: تحويل الجذور المكتوبة نصياً مثل: جذر(3) أو sqrt(16)
    t = t.replace(/(?:sqrt|جذر)\s*\(([^)]+)\)/gi, (m, val) => `<span style="display: inline-flex; direction: rtl; align-items: stretch; vertical-align: middle; margin: 0 4px;"><span style="flex-shrink: 0; align-self: stretch; min-width: 10px; background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 30%22%3E%3Cpath d=%22M1 0 L13 28 L18 19%22 stroke=%22%23000%22 stroke-width=%223.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 fill=%22none%22/%3E%3C/svg%3E'); background-size: 100% 100%; background-repeat: no-repeat;"></span><span style="border-top: 1.5px solid currentColor; margin-top: 1.5px; padding: 2px 4px 0 4px; line-height: 1.2;">${val.trim()}</span></span>`);

    // 3. الأسس: ستجد الأسس وتتكفل بها بهدوء سواء كانت منفردة أو بداخل كود الكسر الذي تم تكوينه
    // 💡 استخدام وسم <sup> الأصلي المدعوم لضمان عدم وجود مسافات أو تشتت في الطباعة
    t = t.replace(/([)\]a-zA-Z\u0600-\u06FF0-9٠-٩]+)\s*\^\s*([a-zA-Z\u0600-\u06FF0-9٠-٩\-]+)/g, (m, base, exp) => `<span style="display: inline-block; direction: rtl; unicode-bidi: isolate; margin: 0 2px;"><span style="font-size: 1.1em;">${base.trim()}</span><sup style="font-size: 0.8em; margin-right: 2px; top: -0.5em;">${exp.trim()}</sup></span>`);
    
    // 4. الحفاظ على الشفرات الكبرى إن وُجدت (نهايات، تكامل، معادلة)
    t = t.replace(/\[\s*(?:limit|نهاية)\s*:\s*([^,،\]]+)\s*[,،]\s*([\s\S]+?)\s*\]/gi, (m, cond, func) => `<span style="display: inline-flex; flex-direction: column; align-items: center; vertical-align: baseline; margin: 0 2px; direction: rtl;"><span style="font-weight: bold; font-family: 'Amiri', serif; font-size:1.2em; line-height: 1;">نهــــــا</span><span style="font-size: 0.75em; margin-top:-2px;">${cond.trim()}</span></span><span style="margin-right: 4px;">${func.trim()}</span>`);
    
    t = t.replace(/\[\s*(?:int|تكامل)\s*:\s*([^,،\]]+)\s*[,،]\s*([^,،\]]+)\s*[,،]\s*([\s\S]+?)\s*\]/gi, (m, func, lower, upper) => `<span style="display: inline-flex; align-items: center; direction: rtl; margin: 0 5px; vertical-align: middle;"><span style="position: relative; display: inline-flex; justify-content: center; align-items: center; width: 24px; height: 40px;"><span style="font-size: 2.8em; font-family: 'Times New Roman', serif; font-weight: normal; line-height: 1;">∫</span><span style="position: absolute; top: -8px; right: -6px; font-size: 0.7em;">${upper.trim()}</span><span style="position: absolute; bottom: -8px; left: -6px; font-size: 0.7em;">${lower.trim()}</span></span><span style="margin-right: 10px;">${func.trim()}</span></span>`);
    
    t = t.replace(/\[\s*(?:eq|معادلة)\s*:\s*([\s\S]+?)\s*\]/gi, (m, eq) => `<span dir="rtl" style="unicode-bidi: isolate; display: inline-block; margin: 0 4px;">${eq.trim()}</span>`);

    return t;
  }


  function esc(s) {
    let safeText = (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    return parseMathHTML(safeText);
  }

  function formatDate(d) {
    if (!d) return '';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  }
  async function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('read_fail'));
      r.readAsDataURL(file);
    });
  }
  function sanitizeFilename(n) {
    return (n || 'خطة-الدرس').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 80) || 'خطة-الدرس';
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 4000);
  }
  function shuffleArrayFisherYates(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // مكتبة html2canvas لا تدعم text-decoration:underline إطلاقًا (قصور معروف بالمكتبة)
  // الحل: تحويل أي عنصر مسطّر إلى حد سفلي حقيقي (border-bottom) قبل التصدير، فهذا يُرسم بشكل صحيح دائمًا
  function fixUnderlinesForExport(container) {
    const all = container.querySelectorAll('*');
    all.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.textDecorationLine.includes('underline') || el.tagName === 'U') {
        el.style.textDecoration = 'none';
        el.style.borderBottom = '1.5px solid currentColor';
        el.style.paddingBottom = '1px';
        el.style.display = el.style.display || 'inline-block';
      }
    });
    return container;
  }

  /* ─── Constants ─── */
    /* ─── Constants ─── */
  const SETTINGS_KEY = 'haael_settings_v2';
  const DB_NAME = 'haaelDB_v2', DB_VERSION = 5; // رفعنا الإصدار إلى 2 لإنشاء المخزن الجديد
  const LESSONS_STORE = 'lessons', BOOKS_STORE = 'books';
  const EXTRACTS_STORE = 'extracts'; // مخزن دروس شاشة "دروس واختبارات"
  const EXAM_APP_FILE = 'exams.html';
 // اسم ملف تطبيق الاختبارات الرسمي (يجب أن يطابق اسم الملف الفعلي تماماً)

  const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
  const FALLBACK_CHAIN = [
    'gemini-3.5-flash','gemini-3.1-flash-lite','gemini-2.5-flash','gemini-2.0-flash','gemini-flash-latest'
  ];  function mathRulesBlock(isEnglish) {
    if (isEnglish) return `
⚠️ MATH RULES: 
- Use standard text for math: Use ^ for powers (e.g., x^2). Use sqrt() for roots (e.g., sqrt(16)). Use ( / ) for fractions.
- Never use complex HTML or custom shortcodes. Just plain text symbols.
`;
    return `
⚠️ قواعد الرياضيات (هامة جداً):
- اكتب الرياضيات بشكل نصي طبيعي ومقروء تماماً كما في الكتب المدرسية.
- للأسس: استخدم علامة ^ (مثال: س^٢ أو (س+ص)^٢). يُمنع منعاً باتاً استخدام شفرات معقدة أو كلمات إنجليزية.
- للجذور: استخدم كلمة جذر (مثال: جذر(٣) أو جذر(س+١)).
- للكسور: استخدم الأقواس وعلامة القسمة (مثال: (س / ص)).
- استخدم الأرقام العربية الشرقية (١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ ٠).
`;
  }

  /* ─── State ─── */
  const state = {
    settings: {
      apiKey:'', school:'', teacher:'', directorate:'', subject:'',
      defaultLang:'ar', defaultModel:'gemini-3.5-flash'
    },
    viewStack: ['home'],
    sourceType: 'title',
    language: 'ar',
    currentRecord: null,
    archiveCache: [],
    archiveKind: 'plan',
        examGenerationTarget: 'internal', // لمعرفة هل الزر المضغوط داخلي أم للاختبار الرسمي
    archiveGrade: '',
    archiveSubject: '',
    selectionMode: false,
    selectedIds: new Set(),
    booksCache: [],
    editMode: false,
    phoneViewMode: false,
    fontScale: 1,
    db: null
  };

  /* ─── Lazy Loaders ─── */
  let _pdfjsP = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('load_fail'));
      document.head.appendChild(s);
    });
  }
  function ensurePdfJs() {
    if (typeof pdfjsLib !== 'undefined') return Promise.resolve();
    if (!_pdfjsP) _pdfjsP = loadScript('/pdf.min.js')
      .then(() => { pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'; })
      .catch(e => { _pdfjsP = null; throw e; });
    return _pdfjsP;
  }

  /* ─── Navigation ─── */
  const VIEW_TITLES = {
    home:'الذكي', new:'تحضير جديد', result:'الخطة الدرسية',
    archive:'الأرشيف', library:'المكتبة', settings:'الإعدادات',
    bank:'دروس واختبارات'
  };
  function showView(name) {
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== name; });
    $('#appbarTitle').textContent = VIEW_TITLES[name] || 'الذكي';
    $('#btnBack').hidden = name === 'home';
    window.scrollTo(0, 0);
  }
  function navigate(name) {
    if (state.viewStack[state.viewStack.length - 1] !== name) state.viewStack.push(name);
    showView(name);
  }
  function goBack() {
    if (state.viewStack.length > 1) state.viewStack.pop();
    showView(state.viewStack[state.viewStack.length - 1]);
  }
  // يغلق أي نافذة منبثقة/عارض مفتوح حالياً (أولوية أعلى من التنقل بين الشاشات)
  // يُستخدم من زر الرجوع الظاهر في الشريط ومن زر الرجوع الفعلي بالجهاز، حتى يكون
  // سلوك "الرجوع" متسقاً دائماً: يغلق ما هو مفتوح فوق الشاشة أولاً، ثم يرجع خطوة بالتنقل
  function closeTopmostOverlay() {
    const modal = $('.modal-bg.is-active');
    if (modal) { modal.classList.remove('is-active'); return true; }
    if ($('#bookReaderOverlay')?.classList.contains('is-active')) { closeBookReader(); return true; }
    return false;
  }
  function handleBackAction() {
    if (closeTopmostOverlay()) return;
    goBack();
  }

  /* ─── Toast / Overlay ─── */
  let _toastTimer;
  function toast(msg, kind) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast is-active' + (kind ? ' toast-' + kind : '');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('is-active'), 3600);
  }
  function showOverlay(text) {
    $('#loadingText').textContent = text || 'جاري المعالجة...';
    $('#loadingOverlay').classList.add('is-active');
  }
  function hideOverlay() { $('#loadingOverlay').classList.remove('is-active'); }

  /* ─── Settings ─── */
  function loadSettings() {
    try { const r = localStorage.getItem(SETTINGS_KEY); if (r) Object.assign(state.settings, JSON.parse(r)); } catch (e) {}
    try { state.fontScale = parseFloat(localStorage.getItem('haael_fs') || '1') || 1; } catch (e) {}
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) {}
  }
  function populateSettingsForm() {
    $('#sApiKey').value       = state.settings.apiKey       || '';
    $('#sSchool').value       = state.settings.school       || '';
    $('#sTeacher').value      = state.settings.teacher      || '';
    $('#sDirectorate').value  = state.settings.directorate  || '';
    $('#sSubject').value      = state.settings.subject      || '';
    $('#sDefaultLang').value  = state.settings.defaultLang  || 'ar';
    $('#sDefaultModel').value = state.settings.defaultModel || 'gemini-3.1-flash-lite';
  }
  function onSaveSettings() {
    state.settings.apiKey       = $('#sApiKey').value.trim();
    state.settings.school       = $('#sSchool').value.trim();
    state.settings.teacher      = $('#sTeacher').value.trim();
    state.settings.directorate  = $('#sDirectorate').value.trim();
    state.settings.subject      = $('#sSubject').value.trim();
    state.settings.defaultLang  = $('#sDefaultLang').value;
    state.settings.defaultModel = $('#sDefaultModel').value;
    saveSettings();
    toast('تم حفظ الإعدادات ✓', 'success');
  }

  /* ─── Font / Theme — --fz لمحتوى المستندات، --ui-scale لعناصر الواجهة (الأزرار/البطاقات/القوائم) ─── */
  function applyFontScale(s) {
    // 🌟 السر هنا: خفضنا الحد الأدنى للتصغير إلى 0.2 (أي 20%) لتتمكن من تصغير الخطة جداً حتى تظهر كاملة
    state.fontScale = Math.max(0.2, Math.min(4.0, s));
    
    // تطبيق الحجم الأساسي
    document.documentElement.style.setProperty('--fz', (18 * state.fontScale) + 'px');
    
    // إبقاء أزرار الواجهة بحجم معقول ومقروء حتى لو صغرت الخطة جداً
    const uiScale = Math.max(0.85, Math.min(1.35, state.fontScale));
    document.documentElement.style.setProperty('--ui-scale', uiScale);
    try { localStorage.setItem('haael_fs', state.fontScale); } catch (e) {}

    // إعادة ضبط وضع الهاتف ليتماشى مع الحجم الجديد بدون أي خلل
    if (state.phoneViewMode) {
      state.phoneViewMode = false; 
      togglePhoneView(); 
    }
  }
  function applyTheme(name) {
    if (!name) return;
    document.documentElement.dataset.theme = name;
    try { localStorage.setItem('haael_theme', name); } catch (e) {}
  }
  function applyFont(family) {
    if (!family) return;
    document.documentElement.style.setProperty('--font-ui',  family);
    document.documentElement.style.setProperty('--font-doc', family);
    document.documentElement.style.setProperty('--font-en',  family);
    try { localStorage.setItem('haael_font', family); } catch (e) {}
  }

  /* ─── IndexedDB ─── */
    /* ─── IndexedDB ─── */
  function openDB() {
    return new Promise((res, rej) => {
      if (state.db) { res(state.db); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(LESSONS_STORE)) {
          const ls = db.createObjectStore(LESSONS_STORE, { keyPath:'id', autoIncrement:true });
          ls.createIndex('title','title',{unique:false});
          ls.createIndex('createdAt','createdAt',{unique:false});
        }
        if (!db.objectStoreNames.contains(BOOKS_STORE)) {
          db.createObjectStore(BOOKS_STORE, { keyPath:'id', autoIncrement:true });
        }
        // --- [دروس واختبارات] ---
        if (!db.objectStoreNames.contains(EXTRACTS_STORE)) {
          db.createObjectStore(EXTRACTS_STORE, { keyPath:'id', autoIncrement:true });
        }
      };
      
      req.onsuccess = e => { state.db = e.target.result; res(state.db); };
      req.onerror = e => rej(e.target.error);
    });
  }

  function dbOp(store, mode, fn) {
    return openDB().then(db => new Promise((res, rej) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      req.onsuccess = () => res(req.result);
      req.onerror = e => rej(e.target.error);
    }));
  }
    // 💡 إضافة دالة التذكير بالنسخ الاحتياطي
  function showBackupReminderModal() {
    let modal = $('#backupReminderModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-bg';
      modal.id = 'backupReminderModal';
      modal.innerHTML = `
        <div class="modal-card" style="max-width: 400px; text-align: center; padding: 25px;">
          <div style="font-size: 50px; margin-bottom: 10px;">🛡️</div>
          <h2 style="color: #4f46e5; margin-bottom: 10px; font-size: 22px; font-weight: 900;">تأمين مجهودك!</h2>
          <p style="color: #475569; font-size: 14.5px; font-weight: bold; line-height: 1.6; margin-bottom: 25px;">
            لقد قمت بتحضير وإضافة 15 درساً جديداً منذ آخر نسخة احتياطية. لحماية مجهودك من أي طارئ، ننصحك بشدة بأخذ نسخة احتياطية لبياناتك الآن.
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-primary" style="padding:14px; border-radius:12px; font-size:15px; font-weight:900; background:#10b981; transition:0.2s; border:none; color:white; cursor:pointer;" onclick="document.getElementById('backupReminderModal').classList.remove('is-active'); document.getElementById('btnExportBackup').click();">💾 تصدير نسخة احتياطية الآن</button>
            <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14px; font-weight:bold; background:#cbd5e1; color:#334155; transition:0.2s; border:none; cursor:pointer;" onclick="document.getElementById('backupReminderModal').classList.remove('is-active');">ذكرني لاحقاً</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.add('is-active');
  }

  // 💡 محرك الإضافة لقاعدة البيانات (مدمج معه عداد النسخ الاحتياطي ودرع حماية)
  const dbAdd = (store, r) => dbOp(store, 'readwrite', s => s.add(r)).then(id => {
      try {
          // إذا تم الحفظ في الأرشيف أو بنك الدروس
          if (store === LESSONS_STORE || store === EXTRACTS_STORE) {
              let count = parseInt(localStorage.getItem('haael_unbacked_count') || '0');
              count++;
              if (count >= 15) {
                  setTimeout(showBackupReminderModal, 1500); 
                  localStorage.setItem('haael_unbacked_count', '0'); 
              } else {
                  localStorage.setItem('haael_unbacked_count', count);
              }
          }
      } catch(e) { /* حماية للهواتف التي تحظر التخزين المحلي */ }
      return id;
  });

  const dbPut    = (store, r)  => dbOp(store, 'readwrite', s => s.put(r));
  const dbGet    = (store, id) => dbOp(store, 'readonly',  s => s.get(id));
  const dbGetAll = store       => dbOp(store, 'readonly',  s => s.getAll());
  const dbDelete = (store, id) => dbOp(store, 'readwrite', s => s.delete(id));
  const dbClearAll = store     => dbOp(store, 'readwrite', s => s.clear());

  /* ─── Segmented controls ─── */
  function wireSegmented(containerId, dataAttr, onChange) {
    const el = $('#' + containerId);
    el.addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn'); if (!btn) return;
      $$('.seg-btn', el).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset[dataAttr]);
    });
  }
  function onSourceChange(src) {
    state.sourceType = src;
    ['title','text','images','pdf','library'].forEach(s => {
      $('#panel-' + s).hidden = s !== src;
    });
  }
  function onLanguageChange(lang) { state.language = lang; updateTranslateBtn(); }

  /* ─── Image Compression ─── */
  // نطلب من المتصفح فك تشفير الصورة "مصغّرة مباشرة" (resize أثناء فك الترميز نفسه)
  // بدل فك الصورة الأصلية بكامل دقتها أولاً ثم تصغيرها لاحقاً — هذا هو الفرق الحقيقي
  // الذي يمنع انهيار الذاكرة مع الصور الكبيرة جداً (بخلاف المحاولة السابقة).
  async function loadDrawableSafe(file, maxDim) {
    if (window.createImageBitmap) {
      try {
        // resizeWidth فقط (بدون resizeHeight) يحافظ على أبعاد الصورة تلقائياً
        // ويسمح للمتصفح بفك الترميز مباشرة على الحجم المصغّر (توفير حقيقي بالذاكرة)
        const bmp = await createImageBitmap(file, { resizeWidth: maxDim, resizeQuality: 'medium' });
        if (bmp.height <= maxDim) return { bitmap: bmp, w: bmp.width, h: bmp.height };
        // حماية إضافية للصور الطويلة جداً (بانورامية/ممسوحة عمودياً) — العملية هنا رخيصة
        // لأنها تُجرى على النسخة المصغّرة أصلاً وليس على الصورة الأصلية
        const w2 = Math.round(bmp.width * maxDim / bmp.height), h2 = maxDim;
        const shrunk = await createImageBitmap(bmp, { resizeWidth: w2, resizeHeight: h2, resizeQuality: 'medium' });
        bmp.close();
        return { bitmap: shrunk, w: w2, h: h2 };
      } catch (e) { /* نتابع بالطريقة التقليدية أدناه فقط عند تعذّر ما سبق */ }
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else       { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        resolve({ bitmap: img, w, h });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img_load')); };
      img.src = url;
    });
  }
  async function compressImage(file, maxDim, quality) {
    const { bitmap, w, h } = await loadDrawableSafe(file, maxDim);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', quality).split(',')[1];
    if (bitmap.close) bitmap.close(); // تحرير ذاكرة الصورة المفكوكة فوراً
    canvas.width = canvas.height = 0;
    return out;
  }
  // مصغّرة عرض خفيفة جداً — تُستخدم للمعاينة فقط بدل تحميل الصورة الأصلية كاملة
  async function makeThumb(file) {
    try { return 'data:image/jpeg;base64,' + await compressImage(file, 240, 0.6); }
    catch (e) { return null; }
  }


  /* ─── Images via Gemini Vision ─── */
  function handleImagePick() { 
  $('#imageInput').value = ''; 
  $('#imageInput').click(); 
}

        // =========================================================================
  // 1. استخراج النصوص من الصور العادية (Supercharged Vision OCR)
  // =========================================================================
    /* ─── Images via Gemini Vision ─── */
  function handleImagePick() { 
    $('#imageInput').value = ''; 
    $('#imageInput').click(); 
  }

  async function handleImagesChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return; 
    $('#btnRetryImages').hidden = false;
    
    const thumbs = $('#imageThumbs');
    thumbs.innerHTML = '';
    // مصغّرات خفيفة الحجم بدل عرض الصور الأصلية كاملة (تفادي انهيار الذاكرة مع صور كبيرة جداً)
    for (const f of files) {
      const img = document.createElement('img');
      makeThumb(f).then(src => { if (src) img.src = src; });
      thumbs.appendChild(img);
    }
    
    if (!state.settings.apiKey) {
      toast('أدخل مفتاح API لقراءة الصور تلقائياً', 'error');
      $('#imageTextWrap').hidden = false;
      return;
    }

    const prog = $('#ocrProgress'), fill = $('#ocrBarFill'), status = $('#ocrStatus');
    prog.hidden = false; fill.style.width = '5%';
    status.textContent = 'جاري تجهيز الصور...';
    $('#imageTextWrap').hidden = true;
    
    const model = state.settings.defaultModel || 'gemini-2.0-flash';
    const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(state.settings.apiKey)}`;
    
    // 💡 البرومبت الحديدي الموحد للصور
        const STRICT_OCR_PROMPT = `أنت خبير ذكاء اصطناعي مبرمج لتعمل كماسح ضوئي (OCR) فائق الدقة للمناهج التعليمية.
مهمتك: استخراج كافة النصوص من هذه الصفحة بنسبة تطابق 100% دون أي تفكير إبداعي.
قواعد صارمة جداً إجبارية:
1. اللغات: استخرج النصوص العربية والإنجليزية حرفياً كما هي.
2. الرياضيات والعلوم (هام جداً): اكتب المعادلات نصياً لتجنب تشوهها. للكسور اكتب (البسط / المقام). للجذور اكتب جذر(الرقم). للأسس اكتب (الأساس^الأس). لسهم الاستنتاج/الاستلزام اكتب (<==) دائماً بنفس الصيغة النصية الموحدة.
3. الرموز العربية: حافظ على الرموز الرياضية العربية (س، ص، ع، ط، جا، جتا، ظا) ولا تحولها للإنجليزية أبداً.
4. التنسيق: حافظ على ترتيب الأسطر، القوائم النقطية، والجداول كما تظهر تماماً.
5. المخرجات: أعد النص المستخرج فقط وفقط.`;

    const extractedTexts = [];
    let skipped = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        status.textContent = `قراءة الصورة ${i + 1} من ${files.length}...`;
        fill.style.width = Math.round(5 + (i / files.length) * 90) + '%';
        
        // 💡 [الحل السحري]: الانتظار 3.5 ثوانٍ لتجنب حظر جوجل
        if (i > 0) {
          status.textContent = `تأمين الاتصال للصورة ${i + 1} (لتجنب الحظر)...`;
          await new Promise(resolve => setTimeout(resolve, 3500)); 
          status.textContent = `قراءة الصورة ${i + 1} من ${files.length}...`;
        }

        try {
          // 💡 الضغط الخارق: 900 بكسل وجودة 45% لعدم إرهاق الهاتف
          const b64 = await compressImage(files[i], 1200, 0.75); 
          const res = await fetch(url, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              contents: [{ role:'user', parts: [
                { inlineData: { mimeType:'image/jpeg', data:b64 } },
                { text: STRICT_OCR_PROMPT }
              ]}],
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ],
              generationConfig: { temperature: 0.0 } // 💡 صفر إبداع لدقة مطلقة
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || `خطأ ${res.status}`);
          const text = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
          if (text) extractedTexts.push(text); else skipped++;
        } catch (imgErr) {
          skipped++; 
        }
      }
      
      if (skipped) toast(`تعذّر استخراج نص ${skipped} صورة، تم تجاوزها`, 'error');
      fill.style.width = '100%';
      const combined = extractedTexts.join('\n\n');
      if (combined) {
        $('#imagesExtractedText').value = combined;
        $('#imageTextWrap').hidden = false;
        status.textContent = 'تم الاستخراج بنجاح ✓';
        toast('تم قراءة الصور بنجاح ✓', 'success');
                // 💡 إظهار نافذة الخيارات التلقائية للصور
        if (combined.trim().length > 10) {
          setTimeout(showPostExtractModal, 500);
        }

      } else {
        status.textContent = 'لم يُستخرج نص (قد يكون بسبب جودة الصور)';
        $('#imageTextWrap').hidden = false;
        toast('لم يُستخرج نص', 'error');
      }
    } catch (err) {
      $('#ocrBarFill').style.width = '0%';
      $('#ocrStatus').textContent = 'تعذر: ' + (err.message || 'خطأ');
      $('#imageTextWrap').hidden = false;
      toast('فشل: ' + (err.message || 'خطأ غير معروف'), 'error');
    }
  }

  /* ─── PDF Hybrid Extraction (نص + Gemini Vision للمُصوَّر) ─── */
  function handlePdfPick() { 
    $('#pdfInput').value = ''; 
    $('#pdfInput').click(); 
  }
  
  async function handlePdfChange(e) {
    const file = e.target.files?.[0]; 
    if (!file) return; 
    $('#btnRetryPdf').hidden = false;
    
    $('#pdfFileName').textContent = file.name; $('#pdfFileName').hidden = false;
    const from = parseInt($('#pdfPageFrom').value) || 1;
    const to   = parseInt($('#pdfPageTo').value)   || 5;
    await extractPdfRange(file, from, to, 'pdf');
  }

  /* ─── OCR أولي (صفحة واحدة) — نواة مشتركة تُستخدم من extractPdfRange ومن library-extract.js عبر HaelCore ─── */
  const SHARED_STRICT_OCR_PROMPT = `أنت خبير ذكاء اصطناعي مبرمج لتعمل كماسح ضوئي (OCR) فائق الدقة للمناهج التعليمية.
مهمتك: استخراج كافة النصوص من هذه الصفحة بنسبة تطابق 100% دون أي تفكير إبداعي.
قواعد صارمة جداً إجبارية:
1. اللغات: استخرج النصوص العربية والإنجليزية حرفياً كما هي.
2. الرياضيات والعلوم (هام جداً): اكتب المعادلات نصياً لتجنب تشوهها. للكسور اكتب (البسط / المقام). للجذور اكتب جذر(الرقم). للأسس اكتب (الأساس^الأس). لسهم الاستنتاج/الاستلزام اكتب (<==) دائماً بنفس الصيغة النصية الموحدة.
3. الرموز العربية: حافظ على الرموز الرياضية العربية (س، ص، ع، ط، جا، جتا، ظا) ولا تحولها للإنجليزية أبداً.
4. التنسيق: حافظ على ترتيب الأسطر، القوائم النقطية، والجداول كما تظهر تماماً.
5. المخرجات: أعد النص المستخرج فقط وفقط.`;

  async function ocrPdfPageToText(pdf, pageNum) {
    if (!state.settings.apiKey) { const e = new Error('لا يوجد مفتاح API'); e.code = 'no-api-key'; throw e; }
    const page = await pdf.getPage(pageNum);
    const nativeVp = page.getViewport({ scale: 1 });
    const MAX_SIDE = 1280;
    const longSide = Math.max(nativeVp.width, nativeVp.height);
    const safeScale = Math.min(0.8, MAX_SIDE / longSide);
    const viewport = page.getViewport({ scale: Math.max(safeScale, 0.25) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const b64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
    canvas.width = canvas.height = 0;

    const model = state.settings.defaultModel || 'gemini-2.0-flash';
    const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(state.settings.apiKey || '')}`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'image/jpeg', data: b64 } },
          { text: SHARED_STRICT_OCR_PROMPT }
        ]}],
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: 0.0 }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `خطأ ${res.status}`);
    return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  }
  // 💡 استنتاج العنوان آلياً من الفهرس فقط، أو تركه فارغاً ليدخله المعلم يدوياً
  function ensureTitleAutoFilled() {
    const titleInput = $('#fTitle');
    const bookSelect = $('#libraryBookSelect');
    const fromInput = $('#libPageFrom');
    
    // إذا كان الحقل يحتوي بالفعل على قيمة كتبها المعلم
    if (titleInput && titleInput.value.trim()) return titleInput.value.trim();

    if (bookSelect && fromInput && bookSelect.value) {
      const bookId = parseInt(bookSelect.value);
      const fromP = parseInt(fromInput.value);
      const book = state.booksCache.find(b => b.id === bookId);
      
      if (book && book.toc) {
        const tocItem = book.toc.find(t => fromP >= t.page && fromP <= t.endPage) || book.toc.find(t => t.page === fromP);
        if (tocItem && tocItem.title) {
          if (titleInput) titleInput.value = tocItem.title.trim();
          return tocItem.title.trim();
        }
      }
    }
    return '';
  }

  // 💡 نافذة الخيارات الذكية ما بعد الاستخراج (معدلة: الحفظ أولاً + حقول إجبارية)
  function showPostExtractModal() {
    const detectedTitle = ensureTitleAutoFilled();
    const currentSubject = $('#fSubject')?.value.trim() || state.settings.subject || '';
    const currentGrade = $('#fGrade')?.value.trim() || '';

    let modal = $('#postExtractModal');
    if (modal) modal.remove(); // إزالة النافذة القديمة لضمان تحديث الحقول والقيم

    modal = document.createElement('div');
    modal.className = 'modal-bg is-active';
    modal.id = 'postExtractModal';
    modal.style.zIndex = '9999';

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 480px; text-align: center; padding: 20px; border-radius: 16px;">
        <div class="modal-hdr" style="justify-content: center; position: relative; border-bottom: 2px dashed #e2e8f0; padding-bottom: 10px;">
          <h2 style="color: #10b981; margin: 0; font-size: 21px; font-weight: 900;">✅ اكتمل استخراج النص بنجاح</h2>
          <button class="modal-close" style="position: absolute; left: 0; top: -5px;" onclick="document.getElementById('postExtractModal').remove()">✕</button>
        </div>
        
        <div class="modal-body" style="display:flex; flex-direction:column; gap:10px; padding-top: 12px; max-height: 75vh; overflow-y: auto;">
          
          <!-- 📝 بطاقة إدخال بيانات الدرس الإجبارية -->
          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: right;">
            <label style="display:block; font-weight:900; font-size:13px; color:#1e293b; margin-bottom:4px;">
              📌 عنوان الدرس <span style="color:#ef4444;">*</span>
              <input id="postModalTitle" type="text" value="${esc(detectedTitle)}" placeholder="اكتب عنوان الدرس..." style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #94a3b8; font-family:inherit; font-weight:bold; font-size:13.5px; margin-top:3px; outline:none; box-sizing:border-box;">
            </label>
            
            <div style="display:flex; gap:10px; margin-top:8px;">
              <label style="flex:1; font-weight:900; font-size:13px; color:#1e293b;">
                📚 المادة <span style="color:#ef4444;">*</span>
                <input id="postModalSubject" type="text" value="${esc(currentSubject)}" placeholder="المادة..." style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #94a3b8; font-family:inherit; font-weight:bold; font-size:13.5px; margin-top:3px; outline:none; box-sizing:border-box;">
              </label>
              
              <label style="flex:1; font-weight:900; font-size:13px; color:#1e293b;">
                🏫 الصف <span style="color:#ef4444;">*</span>
                <input id="postModalGrade" type="text" value="${esc(currentGrade)}" placeholder="الصف..." style="width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #94a3b8; font-family:inherit; font-weight:bold; font-size:13.5px; margin-top:3px; outline:none; box-sizing:border-box;">
              </label>
            </div>
          </div>

          <p style="font-size:13px; color:#475569; margin: 4px 0; font-weight: 800;">اختر الإجراء المطلوب لتنفيذه:</p>

          <!-- 💾 زر الحفظ أولاً وبشكل بارز -->
          <button id="btnSavePostExtract" class="btn-primary" style="padding:14px; border-radius:12px; font-size:15px; font-weight:900; background:#4f46e5; border:none; color:white; cursor:pointer; box-shadow:0 4px 10px rgba(79,70,229,0.25);" onclick="executePostExtractAction('save_only');">
            💾 حفظ في دروس واختبارات (البنك) أولاً
          </button>

          <hr style="border:0; border-top:1.5px dashed #e2e8f0; margin: 4px 0;">

          <!-- بقية خيارات التحضير والتوليد -->
          <button class="btn-primary" ... onclick="executePostExtractAction('plan');">📝 توليد خطة درس (PPP)</button>

          <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14.5px; font-weight:900; background:#059669; border:none; color:white; cursor:pointer;" onclick="executePostExtractAction('board');">🖍️ توليد سبورة تفاعلية</button>
          <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14.5px; font-weight:900; background:#d97706; border:none; color:white; cursor:pointer;" onclick="executePostExtractAction('quiz');">🧩 توليد ملخص واختبار (سريع)</button>
          <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14.5px; font-weight:900; background:#8b5cf6; border:none; color:white; cursor:pointer;" onclick="executePostExtractAction('summary');">📜 بناء ملخص شامل احترافي</button>
          <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14.5px; font-weight:900; background:#db2777; border:none; color:white; cursor:pointer;" onclick="executePostExtractAction('exam_internal');">🧪 إعداد اختبار شامل</button>
          <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14.5px; font-weight:900; background:#1e40af; border:none; color:white; cursor:pointer;" onclick="executePostExtractAction('exam_official');">📝 تصدير لاختبار رسمي للطباعة</button>
          <button class="btn-primary" style="padding:12px; border-radius:12px; font-size:14.5px; font-weight:900; background:#0284c7; border:none; color:white; cursor:pointer;" onclick="executePostExtractAction('audio');">🎧 إعداد درس صوتي</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  // 💡 فحص إجبارية البيانات وتطبيق الإجراء المطلوب (محدث: تنبيه منبثق وإبقاء النافذة مفتوحة)
  window.executePostExtractAction = async function(action) {
    const titleInp = $('#postModalTitle');
    const subjInp = $('#postModalSubject');
    const gradeInp = $('#postModalGrade');

    const title = titleInp ? titleInp.value.trim() : '';
    const subject = subjInp ? subjInp.value.trim() : '';
    const grade = gradeInp ? gradeInp.value.trim() : '';

    // إعادة الحدود للونها الطبيعي
    if (titleInp) titleInp.style.borderColor = '#94a3b8';
    if (subjInp) subjInp.style.borderColor = '#94a3b8';
    if (gradeInp) gradeInp.style.borderColor = '#94a3b8';

    // 1. فحص العنوان
    if (!title) {
      if (titleInp) titleInp.style.borderColor = '#ef4444';
      alert('⚠️ تنبيه: يرجى كتابة عنوان الدرس أولاً للمتابعة.');
      titleInp?.focus();
      return;
    }

    // 2. فحص المادة
    if (!subject) {
      if (subjInp) subjInp.style.borderColor = '#ef4444';
      alert('⚠️ تنبيه: يرجى إدخال اسم المادة الدراسية.');
      subjInp?.focus();
      return;
    }

    // 3. فحص الصف
    if (!grade) {
      if (gradeInp) gradeInp.style.borderColor = '#ef4444';
      alert('⚠️ تنبيه: يرجى تحديد الصف الدراسي.');
      gradeInp?.focus();
      return;
    }

    // ترحيل البيانات المدخلة إلى حقول الشاشة الرئيسية تلقائياً
    if ($('#fTitle')) $('#fTitle').value = title;
    if ($('#fSubject')) $('#fSubject').value = subject;
    if ($('#fGrade')) $('#fGrade').value = grade;

    const content = getContentText();
    if (!content) {
      alert('⚠️ لا يوجد نص مستخرج للحفظ!');
      return;
    }

    // 💾 مسار الحفظ في البنك: يحفظ ويبقى داخل اللوحة
    if (action === 'save_only') {
      showOverlay('جاري حفظ الدرس في بنك الدروس...');
      try {
        const meta = gatherMeta();
        const record = {
          title: title, subject: subject, grade: grade, section: meta.section || '',
          content: content, sourceType: meta.sourceType, savedAt: Date.now()
        };
        await dbAdd(EXTRACTS_STORE, record);
        hideOverlay();
        toast('تم حفظ الدرس في "دروس واختبارات" بنجاح 📚', 'success');

        // تحديث مظهر زر الحفظ ليعرف المعلم أنه تم الحفظ مع إبقاء النافذة مفتوحة
        const saveBtn = document.getElementById('btnSavePostExtract');
        if (saveBtn) {
          saveBtn.style.background = '#10b981';
          saveBtn.innerHTML = '✅ تم الحفظ في البنك بنجاح (يمكنك اختيار إجراء آخر الآن)';
        }
      } catch (e) {
        hideOverlay();
        toast('تعذر حفظ الدرس', 'error');
      }
      return;
    }

    // إجراءات التحضير المباشرة (تغلق النافذة وتنتقل للشاشة المطلوبة)
    if (action === 'plan') {
      $('#postExtractModal')?.remove();
      $('#btnGenerate')?.click();
      return;
    }
    if (action === 'board') {
      $('#postExtractModal')?.remove();
      $('#btnGenerateBoard')?.click();
      return;
    }
    if (action === 'quiz') {
      $('#postExtractModal')?.remove();
      $('#btnGenerateQuiz')?.click();
      return;
    }
    if (action === 'audio') {
      $('#postExtractModal')?.remove();
      $('#btnGenerateAudio')?.click();
      return;
    }

    // إجراءات البنك المتقدمة (الملخص الشامل والاختبارات)
    if (typeof quickTriggerBankAction === 'function') {
      quickTriggerBankAction(action);
    }
  };


  // 💡 محرك لتنفيذ خيارات البنك الشاملة مباشرة من نافذة الاستخراج بدون مغادرتها
  window.quickTriggerBankAction = async function(action) {
      const content = getContentText();
      if (!content) { toast('لا يوجد نص مستخرج!', 'error'); return; }
      const meta = gatherMeta();
      const title = $('#fTitle').value.trim();
      
      showOverlay('جاري تجهيز العملية...');
      try {
          // التحقق مما إذا كان الدرس محفوظاً مسبقاً لتجنب التكرار في الأرشيف
          const existing = await dbGetAll(EXTRACTS_STORE);
          let recordId = null;
          const matched = existing.find(r => r.title === title && r.content === content);
          
          if (matched) {
              recordId = matched.id;
          } else {
              const record = {
                  title: title, subject: meta.subject, grade: meta.grade, section: meta.section,
                  content: content, sourceType: meta.sourceType, savedAt: Date.now()
              };
              recordId = await dbAdd(EXTRACTS_STORE, record);
          }
          
          // تحديث الواجهة وتحديد الدرس برمجياً في الخلفية
          await loadKnowledgeBank(); 
          document.querySelectorAll('.bank-chk').forEach(cb => cb.checked = false);
          
          setTimeout(() => {
              const newCb = document.querySelector(`.bank-chk[value="${recordId}"]`);
              if (newCb) newCb.checked = true;
              
              hideOverlay();
              
              // إغلاق هذه النافذة لفتح النوافذ المنبثقة الخاصة باختيارات (الاختبار الشامل)
              $('#postExtractModal')?.remove();
              
              // محاكاة النقر على الأزرار الأصلية
              if (action === 'summary') {
                  $('#btnGenBankSummary')?.click();
              } else if (action === 'exam_internal') {
                  $('#btnGenBankQuiz')?.click(); 
              } else if (action === 'exam_official') {
                  $('#btnGenOfficialExam')?.click();
              }
          }, 400);

      } catch (e) {
          hideOverlay(); toast('تعذر تجهيز العملية', 'error');
      }
  };

    async function extractPdfRange(fileOrBuffer, pageFrom, pageTo, prefix) {
    const fill   = $('#' + prefix + 'BarFill');
    const status = $('#' + prefix + 'Status');
    const textWrap = $('#' + prefix + 'TextWrap');
    const textArea = $('#' + prefix + 'ExtractedText');
    const prog = $('#' + prefix + 'Progress');
    prog.hidden = false; fill.style.width = '0%';
    status.textContent = 'جاري فتح ملف PDF...'; textWrap.hidden = true;

    try { await ensurePdfJs(); }
    catch (e) { status.textContent = 'تعذر تحميل مكتبة PDF'; textWrap.hidden = false; return; }

    let objectUrl = null;
          try {
            let pdf;
            
            // 💡 الفحص الذكي لمعرفة ما إذا كان الملف من نوع Blob أو فقد هويته بسبب التحديث
            const isBlob = fileOrBuffer instanceof Blob || (fileOrBuffer && typeof fileOrBuffer.size === 'number' && typeof fileOrBuffer.slice === 'function');
            
            if (isBlob) {
              objectUrl = URL.createObjectURL(fileOrBuffer);
              pdf = await pdfjsLib.getDocument(objectUrl).promise;
            } else {
              pdf = await pdfjsLib.getDocument({ data: fileOrBuffer }).promise;
            }
      
      const toPage = Math.min(pageTo, pdf.numPages);
      let combinedText = '';
      
      // 💡 تم رفع الحد لـ 20 صفحة دفعة واحدة بأمان
      const MAX_SCANNED = 20; 
      let scannedCount = 0;
      const model = state.settings.defaultModel || 'gemini-2.0-flash';
      const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(state.settings.apiKey || '')}`;

      const STRICT_OCR_PROMPT = `أنت خبير ذكاء اصطناعي مبرمج لتعمل كماسح ضوئي (OCR) فائق الدقة للمناهج التعليمية.
مهمتك: استخراج كافة النصوص من هذه الصفحة بنسبة تطابق 100% دون أي تفكير إبداعي.
قواعد صارمة جداً إجبارية:
1. اللغات: استخرج النصوص العربية والإنجليزية حرفياً كما هي.
2. الرياضيات والعلوم (هام جداً): اكتب المعادلات نصياً لتجنب تشوهها. للكسور اكتب (البسط / المقام). للجذور اكتب جذر(الرقم). للأسس اكتب (الأساس^الأس). لسهم الاستنتاج/الاستلزام اكتب (<==) دائماً بنفس الصيغة النصية الموحدة.
3. الرموز العربية: حافظ على الرموز الرياضية العربية (س، ص، ع، ط، جا، جتا، ظا) ولا تحولها للإنجليزية أبداً.
4. التنسيق: حافظ على ترتيب الأسطر، القوائم النقطية، والجداول كما تظهر تماماً.
5. المخرجات: أعد النص المستخرج فقط وفقط.`;

      for (let i = pageFrom; i <= toPage; i++) {
        fill.style.width = Math.round(((i - pageFrom) / (toPage - pageFrom + 1)) * 90) + '%';
        status.textContent = `فحص الصفحة ${i} من ${toPage}...`;

        // 💡 الانتظار 3.5 ثوانٍ بين الصفحات لتجنب الحظر
        if (i > pageFrom) {
          status.textContent = `تأمين الاتصال للصفحة ${i} (لتجنب الحظر)...`;
          await new Promise(resolve => setTimeout(resolve, 3500));
          status.textContent = `فحص الصفحة ${i} من ${toPage}...`;
        }

        const page = await pdf.getPage(i);

        if (scannedCount >= MAX_SCANNED) {
          toast(`تنبيه: تم الاكتفاء بأول ${MAX_SCANNED} صفحة كحد أقصى`, 'error');
          break;
        }

        status.textContent = `جاري تجهيز صفحة ${i} كصورة خفيفة جداً...`;
        let b64;
        try {
          const nativeVp = page.getViewport({ scale: 1 });
          const MAX_SIDE = 1280; 
          const longSide = Math.max(nativeVp.width, nativeVp.height);
          const safeScale = Math.min(0.8, MAX_SIDE / longSide);
          const viewport = page.getViewport({ scale: Math.max(safeScale, 0.25) });
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;

          b64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
          canvas.width = canvas.height = 0; 
        } catch (pageErr) {
          toast(`تعذّر تصوير الصفحة ${i}، تم تجاوزها`, 'error');
          continue;
        }

        if (!state.settings.apiKey) throw new Error('الصفحات المصورة تتطلب مفتاح API');
        scannedCount++;
        status.textContent = `قراءة الصفحة ${i} بالذكاء الاصطناعي...`;
        
        try {
          const res = await fetch(url, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              contents:[{role:'user', parts:[
                { inlineData: { mimeType: 'image/jpeg', data: b64 } },
                { text: STRICT_OCR_PROMPT }
              ]}],
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ],
              generationConfig:{temperature: 0.0}
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || `خطأ ${res.status}`);
          const aiText = (data.candidates?.[0]?.content?.parts||[]).map(p => p.text||'').join('').trim();
          if (aiText) combinedText += aiText + '\n\n';
        } catch (apiErr) {
          toast(`تعذّرت قراءة الصفحة ${i}: ${apiErr.message || ''}`, 'error');
        }
      }

      const finalResult = combinedText.trim();
      textArea.value = finalResult;
      textWrap.hidden = false;
      fill.style.width = '100%';
      
      if (finalResult.length > 5) {
        status.textContent = 'تم الاستخراج بنجاح ✓';
        toast('تم استخراج النص ✓', 'success');
        
        // 👈 السطر السحري: إظهار النص وأزرار التوليد
        expandPreparationAccordions();
        
        // 💡 إظهار نافذة الخيارات التلقائية
        if (typeof showPostExtractModal === 'function' && combinedText.trim().length > 10) {
          setTimeout(showPostExtractModal, 500); 
        }
      } else {
        status.textContent = 'لم يُستخرج نص (تأكد من جودة الملف أو اتصال الإنترنت)';
        toast('اكتملت العملية ولكن لم يُستخرج أي نص!', 'error');
      }
      
    } catch (err) {
      fill.style.width = '0%';
      status.textContent = 'تعذر: ' + (err.message || 'خطأ');
      textWrap.hidden = false;
      toast(err.message || 'تعذر استخراج النص', 'error');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }

  /* ─── Library ─── */
  function finalizeToc(flat, totalPages, offsetPages) {
    offsetPages = parseInt(offsetPages) || 0;
    const seen = new Set();
    const clean = flat.filter(x => {
      if (!x.title || !x.page || x.page < 1) return false;
      if (seen.has(x.page)) return false;
      seen.add(x.page); return true;
    });
    if (!clean.length) return null;
    return clean.map((x, i) => ({
      title: x.title,
      page: Math.min(x.page + offsetPages, totalPages),
      endPage: Math.min((clean[i+1] ? clean[i+1].page - 1 : totalPages) + offsetPages, totalPages)
    }));
  }
  async function tocViaAI(pdf, fromPage, toPage, offsetPages) {
    if (!state.settings.apiKey) { const e = new Error('لا يوجد مفتاح API'); e.code = 'no-api-key'; throw e; }
    const total = pdf.numPages;
    fromPage = Math.max(1, Math.min(fromPage, total));
    toPage = Math.max(fromPage, Math.min(toPage, total, fromPage + 6)); // حد أقصى 7 صفحات دفعة واحدة
    const parts = [];
        for (let i = fromPage; i <= toPage; i++) {
      const page = await pdf.getPage(i);
      const nativeVp = page.getViewport({ scale: 1 });
      const MAX_SIDE = 1500;
      const longSide = Math.max(nativeVp.width, nativeVp.height);
      const safeScale = Math.min(0.7, MAX_SIDE / longSide);
      const viewport = page.getViewport({ scale: Math.max(safeScale, 0.15) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const b64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
      canvas.width = canvas.height = 0;
    }
    parts.push({ text: 'أنت مساعد ذكي متخصص في تحليل المستندات. المرفقات هي صور لفهرس كتاب (Table of Contents).\nمهمتك: استخراج الفهرس بالكامل وبدقة متناهية سطراً بسطر.\nالقواعد:\n1. استخرج كل عنوان (سواء كان وحدة رئيسية، أو درساً فرعياً، أو قسم قواعد/مفردات) مع رقم الصفحة المقابل له بالضبط كما هو مطبوع.\n2. لا تلخص، ولا تتجاهل أي عنوان فرعي موجود في الصورة.\n3. حافظ على لغة العناوين الأصلية (الإنجليزية بالإنجليزية، والعربية بالعربية).\n4. إذا لم تجد رقم صفحة لعنوان معين، تجاهل هذا العنوان فقط.\nأعد النتيجة بصيغة JSON فقط: مصفوفة تحتوي عناصر بالشكل التالي: {"title":"اسم الموضوع","page":رقم الصفحة كعدد صحيح}. لا تكتب أي نص أو تعليق خارج مصفوفة الـ JSON.' });

    const model = state.settings.defaultModel || 'gemini-2.0-flash';
    const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(state.settings.apiKey)}`;
    let res, data;
    try {
      res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });
      data = await res.json();
    } catch (e) { const err = new Error('فشل الاتصال بالشبكة'); err.code = 'network'; throw err; }
    if (!res.ok) { const err = new Error(data?.error?.message || 'خطأ من الخادم'); err.code = 'api-error'; throw err; }
    const raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    let list;
    try { list = JSON.parse(raw); }
    catch (e) {
      const m = raw.match(/\[[\s\S]*\]/);
      if (!m) { const err = new Error('تعذر فهم استجابة النموذج'); err.code = 'parse-error'; throw err; }
      list = JSON.parse(m[0]);
    }
    if (!Array.isArray(list) || !list.length) { const err = new Error('لم يُعثر على فهرس'); err.code = 'empty-result'; throw err; }
    const flat = list.map(x => ({ title: String(x.title||'').trim(), page: parseInt(x.page) }))
      .filter(x => x.title && x.page > 0);
    flat.sort((a,b) => a.page - b.page);
    const toc = finalizeToc(flat, total, offsetPages);
    if (!toc) { const err = new Error('لم يُعثر على فهرس'); err.code = 'empty-result'; throw err; }
    return toc;
  }
  async function runTocExtraction(bookId, fromPage, toPage, offsetPages) {
    const modal = $('#tocRangeModal'), btn = $('#btnConfirmTocRange'), prog = $('#tocRangeProgress');
    prog.hidden = false; btn.disabled = true;
    let objectUrl = null;
    try {
      const book = await dbGet(BOOKS_STORE, bookId);
      if (!book) throw new Error('الكتاب غير موجود');
      if (!book.data) throw new Error('لا يوجد ملف PDF مرفق بهذا الكتاب (فهرس مستورد فقط) — أعد رفع الكتاب الأصلي');
      await ensurePdfJs();
      objectUrl = URL.createObjectURL(book.data);
      const pdf = await pdfjsLib.getDocument(objectUrl).promise;
      const toc = await tocViaAI(pdf, fromPage, toPage, offsetPages);
      book.toc = toc;
      await dbPut(BOOKS_STORE, book);
      modal.classList.remove('is-active');
      toast(`تم استخراج فهرس بـ ${toc.length} موضوع ✓`, 'success');
      await refreshLibraryList(); await refreshLibrarySelect();
    } catch (e) {
      const msgs = {
        'no-api-key': 'أدخل مفتاح Gemini في الإعدادات أولاً',
        'empty-result': 'لم يُعثر على فهرس ضمن الصفحات المحددة، تحقق من الأرقام وحاول مجدداً',
        'network': 'تعذر الاتصال بالإنترنت، حاول مجدداً',
        'parse-error': 'تعذر فهم نتيجة الاستخراج، جرّب صفحات أخرى'
      };
      toast(msgs[e.code] || e.message || 'تعذر استخراج الفهرس', 'error');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      prog.hidden = true; btn.disabled = false;
    }
  }
  function openTocRangeModal(bookId) {
    $('#tocRangeModal').dataset.bookId = bookId;
    $('#tocRangeFrom').value = 2; $('#tocRangeTo').value = 3;
    if ($('#tocOffsetPages')) $('#tocOffsetPages').value = 0;
    $('#tocRangeProgress').hidden = true;
    $('#tocRangeModal').classList.add('is-active');
  }
  function openTocViewModal(bookId) {
    const book = state.booksCache.find(b => b.id === bookId);
    if (!book?.toc?.length) return;
    $('#tocViewList').innerHTML = book.toc.map(t => `
      <div class="toc-item" data-book="${bookId}" data-from="${t.page}" data-to="${t.endPage}" data-title="${esc(t.title)}">
        <span class="toc-item-title">${esc(t.title)}</span>
        <span class="toc-item-pages">ص ${t.page}–${t.endPage}</span>
      </div>`).join('');
    $('#tocViewModal').classList.add('is-active');
  }
  async function jumpToLibraryTopic(bookId, fromPage, toPage, topicTitle) {
    $('#tocViewModal').classList.remove('is-active');
    navigate('new');
    
    // 💡 السطر السحري الجديد: وضع العنوان مباشرة في حقل الدرس
    if (topicTitle) {
        $('#fTitle').value = topicTitle;
    }
    
    // 💡 السطر السحري: فتح قسم إضافة المحتوى (الأكورديون) ليرى المعلم شريط التقدم والنص فوراً
    expandPreparationAccordions();
    
    $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === 'library'));
    onSourceChange('library');
    await refreshLibrarySelect();
    $('#libraryBookSelect').value = String(bookId);
    renderLibraryToc();
    $('#libPageFrom').value = fromPage;
    $('#libPageTo').value = toPage;
    onExtractFromLib();
  }
  /* ─── قارئ الكتاب الداخلي (تصفح صفحة بصفحة + تحديد نطاق للاستخراج) ─── */
  const readerState = { pdf:null, bookId:null, pageNum:1, rangeStart:null, rangeEnd:null, rendering:false, objectUrl:null };

  async function openBookReader(bookId) {
    const book = await dbGet(BOOKS_STORE, bookId);
    if (!book) { toast('تعذر العثور على الكتاب', 'error'); return; }
    if (!book.data) { toast('هذا الكتاب فهرس مستورد فقط بدون ملف PDF فعلي — أعد رفع الكتاب الأصلي لاستعراضه', 'error'); return; }
    showOverlay('جاري فتح الكتاب...');
    try {
      await ensurePdfJs();
      readerState.objectUrl = URL.createObjectURL(book.data);
      readerState.pdf = await pdfjsLib.getDocument(readerState.objectUrl).promise;
      readerState.bookId = bookId;
      readerState.pageNum = 1;
      readerState.rangeStart = null;
      readerState.rangeEnd = null;
      $('#readerBookTitle').textContent = book.name || 'كتاب';
      $('#readerTotalPages').textContent = readerState.pdf.numPages;
      $('#readerPageInput').max = readerState.pdf.numPages;
      updateReaderSelectionBar();
      $('#bookReaderOverlay').classList.add('is-active');
      hideOverlay();
      await renderReaderPage(1);
    } catch (e) {
      hideOverlay();
      console.error('[reader] فشل فتح الكتاب', e);
      toast('تعذر فتح الكتاب', 'error');
    }
  }

    async function renderReaderPage(num) {
    if (!readerState.pdf || readerState.rendering) return;
    num = Math.max(1, Math.min(num, readerState.pdf.numPages));
    readerState.rendering = true;
    try {
      const page = await readerState.pdf.getPage(num);
      const canvas = $('#bookReaderCanvas');
      const wrap = $('#bookReaderCanvasWrap');
      const baseViewport = page.getViewport({ scale:1 });
      
      // حساب الحجم الذي يملأ الشاشة بصرياً
      const displayScale = Math.max(0.2, Math.min(wrap.clientWidth / baseViewport.width, wrap.clientHeight / baseViewport.height) || 1);
      
      // 💡 السر هنا: معامل الدقة (نضاعف عدد البكسلات لتناسب الشاشات الحديثة وتوضيح الخط)
      const qualityMultiplier = Math.max(window.devicePixelRatio || 1, 2.5); // حد أدنى 2.5 ضعف للوضوح الفائق
      const renderViewport = page.getViewport({ scale: displayScale * qualityMultiplier });
      
      // 1. تحديد الدقة الفعلية العالية جداً للرسم (البيانات الخام)
      canvas.width = renderViewport.width; 
      canvas.height = renderViewport.height;
      
      // 2. إجبار الكانفس بصرياً على الظهور بحجم الشاشة (تصغير الصورة العالية الدقة لتصبح حادة جداً)
      canvas.style.width = (baseViewport.width * displayScale) + 'px';
      canvas.style.height = (baseViewport.height * displayScale) + 'px';
      canvas.style.maxWidth = '100%';
      canvas.style.objectFit = 'contain';

      const ctx = canvas.getContext('2d');
      
      // تفعيل تنعيم الخطوط العالي الجودة
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
      readerState.pageNum = num;
      $('#readerPageInput').value = num;
    } catch (e) {
      console.error('[reader] فشل رسم الصفحة', num, e);
      toast('تعذر عرض هذه الصفحة', 'error');
    } finally {
      readerState.rendering = false;
    }
  }

  function readerNext() { renderReaderPage(readerState.pageNum + 1); }
  function readerPrev() { renderReaderPage(readerState.pageNum - 1); }

  function closeBookReader() {
    $('#bookReaderOverlay').classList.remove('is-active');
    if (readerState.objectUrl) { URL.revokeObjectURL(readerState.objectUrl); readerState.objectUrl = null; }
    readerState.pdf = null; readerState.bookId = null;
    readerState.rangeStart = null; readerState.rangeEnd = null;
  }

  function markReaderRangeStart() {
    readerState.rangeStart = readerState.pageNum;
    readerState.rangeEnd = null;
    updateReaderSelectionBar();
  }
  function markReaderRangeEnd() {
    if (readerState.rangeStart == null) return;
    let a = readerState.rangeStart, b = readerState.pageNum;
    if (b < a) { const t = a; a = b; b = t; }
    readerState.rangeStart = a; readerState.rangeEnd = b;
    updateReaderSelectionBar();
  }
  function cancelReaderRange() {
    readerState.rangeStart = null; readerState.rangeEnd = null;
    updateReaderSelectionBar();
  }
  function updateReaderSelectionBar() {
    const bar = $('#readerSelectionBar');
    const { rangeStart, rangeEnd } = readerState;
    if (rangeStart == null) {
      bar.innerHTML = `<button class="btn-sec" id="btnMarkRangeStart">🔖 تحديد كبداية</button>`;
      $('#btnMarkRangeStart').addEventListener('click', markReaderRangeStart);
    } else if (rangeEnd == null) {
      bar.innerHTML = `
        <span class="reader-range-label">🔖 البداية: صفحة ${rangeStart}</span>
        <button class="btn-sec" id="btnMarkRangeEnd">🔚 تحديد كنهاية</button>
        <button class="btn-sm" id="btnCancelRange">إلغاء</button>`;
      $('#btnMarkRangeEnd').addEventListener('click', markReaderRangeEnd);
      $('#btnCancelRange').addEventListener('click', cancelReaderRange);
    } else {
      bar.innerHTML = `
        <span class="reader-range-label">📍 من صفحة ${rangeStart} إلى ${rangeEnd}</span>
        <button class="btn-board" id="btnExtractAsToc">📑 استخراج كفهرس</button>
        <button class="btn-board" id="btnExtractAsText">📄 استخراج كنص درس</button>
        <button class="btn-sm" id="btnCancelRange">إلغاء</button>`;
      $('#btnExtractAsToc').addEventListener('click', () => {
        const { bookId, rangeStart, rangeEnd } = readerState;
        closeBookReader();
        openTocRangeModal(bookId);
        $('#tocRangeFrom').value = rangeStart;
        $('#tocRangeTo').value = rangeEnd;
      });
      $('#btnExtractAsText').addEventListener('click', () => {
        const { bookId, rangeStart, rangeEnd } = readerState;
        closeBookReader();
        jumpToLibraryTopic(bookId, rangeStart, rangeEnd);
      });
      $('#btnCancelRange').addEventListener('click', cancelReaderRange);
    }
  }

  // سحب (Swipe) للتنقل بين الصفحات
  let readerTouchStartX = null;
  function onReaderTouchStart(e) { readerTouchStartX = e.touches[0].clientX; }
  function onReaderTouchEnd(e) {
    if (readerTouchStartX == null) return;
    const dx = e.changedTouches[0].clientX - readerTouchStartX;
    readerTouchStartX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) readerNext(); else readerPrev();
  }
  async function handleBookUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const prog = $('#bookUploadProgress'), fill = $('#bookBarFill'), status = $('#bookStatus');
    prog.hidden = false; fill.style.width = '20%'; status.textContent = 'جاري قراءة الملف...';
    let objectUrl = null;
    try {
      await ensurePdfJs();
      objectUrl = URL.createObjectURL(file);
      const pdf = await pdfjsLib.getDocument(objectUrl).promise;
      fill.style.width = '80%'; status.textContent = 'جاري الحفظ...';
      const rec = { name: file.name.replace(/\.pdf$/i,''), type:'pdf', pageCount: pdf.numPages, data: file, addedAt: Date.now() };
      
      const newBookId = await dbAdd(BOOKS_STORE, rec); 
      
      fill.style.width = '100%'; status.textContent = `تم الحفظ ✓ — ${rec.pageCount} صفحة`;
      toast(`تمت إضافة "${rec.name}"`, 'success');
      await refreshLibraryList(); await refreshLibrarySelect();

      // 💡 رسالة المبادرة الآلية بعد نصف ثانية من الحفظ
      setTimeout(() => {
        if (confirm(`تم استيراد الكتاب بنجاح! 🎊\n\nهل ترغب في تشغيل "الطيار الآلي 🚀" الآن ليقوم باكتشاف الفهرس واستخراج الدروس آلياً وبسرعة؟`)) {
          if (window.LibraryExtract && window.LibraryExtract.openTocReviewModal) {
            const defaultGrade = state.settings.grade || '';
            window.LibraryExtract.openTocReviewModal(newBookId, defaultGrade);
          } else {
            toast('عذراً، ملف الطيار الآلي غير متوفر', 'error');
          }
        }
      }, 500);

    } catch (err) { 
      status.textContent = 'تعذر الإضافة'; 
      toast('تعذر إضافة الكتاب', 'error'); 
    }
    finally { 
      if (objectUrl) URL.revokeObjectURL(objectUrl); 
      prog.hidden = true;
    }
    e.target.value = '';
  }

    async function refreshLibraryList() {
    const list = $('#libraryList'), empty = $('#libraryEmpty');
    try {
      state.booksCache = await dbGetAll(BOOKS_STORE);
      if (!state.booksCache.length) { list.innerHTML = ''; empty.hidden = false; return; }
      empty.hidden = true;

      // 💡 السحر هنا: تحويل حاوية الكتب إلى شبكة (Grid) لتكوين مربعات متراصة
      list.style.display = 'grid';
      list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      list.style.gap = '20px';

      list.innerHTML = state.booksCache.map(b => `
        <div class="book-item" style="border: 2px solid #E2E8F0; border-top: 6px solid #7C3AED; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; background: #ffffff; box-shadow: 0 6px 15px rgba(0,0,0,0.05); text-align: center;">
          
          <!-- الأيقونة -->
          <div style="font-size: 55px; margin-bottom: 12px; line-height: 1;">📙</div>
          
          <!-- معلومات الكتاب -->
          <div class="book-name" style="font-size: 1.25rem; font-weight: 900; color: #1E293B; margin-bottom: 8px; line-height: 1.4;">${esc(b.name)}</div>
          
          <!-- الشارات (عدد الصفحات، التاريخ، الفهرس) -->
          <div class="book-meta" style="font-size: 0.85rem; font-weight: bold; margin-bottom: 15px; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px;">
            <span style="background: #F1F5F9; color: #64748B; padding: 4px 8px; border-radius: 6px;">📄 ${b.pageCount} ص</span>
            <span style="background: #F1F5F9; color: #64748B; padding: 4px 8px; border-radius: 6px;">📅 ${new Date(b.addedAt).toLocaleDateString('ar')}</span>
            ${b.toc?.length ? `<span style="background: #ECFDF5; color: #059669; padding: 4px 8px; border-radius: 6px;">📑 ${b.toc.length} موضوع</span>` : ''}
          </div>

          <!-- أزرار التحكم مصفوفة بالأسفل بشكل أنيق -->
          <div style="display: flex; flex-direction: column; width: 100%; gap: 8px; border-top: 2px dashed #E2E8F0; padding-top: 15px; margin-top: auto;">
            ${b.toc?.length
              ? `<div style="display: flex; gap: 8px;">
                   <button class="book-autopilot-btn" data-id="${b.id}" title="استخراج متقدم" style="flex: 1; background: #EEF2FF; color: #4338CA; border: 2px solid #C7D2FE; padding: 10px 5px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">📥 استخراج</button>
                   <button class="book-toc-btn" data-id="${b.id}" data-act="view" title="الفهرس" style="flex: 1; background: #F0FDF4; color: #15803D; border: 2px solid #BBF7D0; padding: 10px 5px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">📑 الفهرس</button>
                 </div>
                 <button class="book-autopilot-btn" data-id="${b.id}" title="تحديث الفهرس" style="background: #FFFBEB; color: #B45309; border: 2px solid #FDE68A; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">🔄 تحديث الفهرس</button>`
              : `<button class="book-autopilot-btn" data-id="${b.id}" title="الطيار الآلي" style="background: #F5F3FF; color: #6D28D9; border: 2px solid #DDD6FE; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">🚀 الطيار الآلي للاستخراج</button>`
            }
            <div style="display: flex; gap: 8px;">
              <button class="book-read-btn" data-id="${b.id}" title="استعراض" style="flex: 2; background: #F8FAFC; color: #334155; border: 2px solid #E2E8F0; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">📖 تصفح</button>
              <button class="book-del" data-id="${b.id}" title="حذف" style="flex: 1; background: #FEF2F2; color: #DC2626; border: 2px solid #FECACA; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">🗑️ حذف</button>
            </div>
          </div>
          
        </div>`).join('');
        
      list.querySelectorAll('.book-read-btn').forEach(btn => btn.addEventListener('click', () => openBookReader(Number(btn.dataset.id))));
      
      list.querySelectorAll('.book-toc-btn[data-act="view"]').forEach(btn => btn.addEventListener('click', () => {
        openTocViewModal(Number(btn.dataset.id));
      }));

      list.querySelectorAll('.book-autopilot-btn').forEach(btn => btn.addEventListener('click', () => {
        if (window.LibraryExtract && window.LibraryExtract.openTocReviewModal) {
          const defaultGrade = state.settings.grade || '';
          window.LibraryExtract.openTocReviewModal(Number(btn.dataset.id), defaultGrade);
        } else {
          toast('عذراً، ملف الاستخراج المتقدم غير متوفر', 'error');
        }
      }));

      list.querySelectorAll('.book-del').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('حذف هذا الكتاب؟')) return;
        await dbDelete(BOOKS_STORE, Number(btn.dataset.id));
        toast('تم الحذف', 'success');
        await refreshLibraryList(); await refreshLibrarySelect();
      }));
    } catch (e) { empty.hidden = false; }
  }

    async function refreshLibrarySelect() {
    const sel = $('#libraryBookSelect'); if (!sel) return;
    
    // 💡 إجبار التطبيق على جلب البيانات الحديثة من قاعدة البيانات مباشرة 
    // لتجنب عرض النسخة القديمة من الكتاب (التي كانت قبل استخراج الفهرس)
    const books = await dbGetAll(BOOKS_STORE); 
    state.booksCache = books;
    
    // 💡 إضافة توضيح صريح بجانب اسم الكتاب لتعرف فوراً ما إذا كان يمتلك فهرساً
    sel.innerHTML = '<option value="">— اختر كتاباً —</option>' +
      books.map(b => `<option value="${b.id}">${esc(b.name)} (${b.toc?.length ? '📑 يوجد فهرس ' + b.toc.length + ' موضوع' : 'بدون فهرس'})</option>`).join('');
      
    renderLibraryToc();
  }

  function renderLibraryToc() {
    const tocWrap = $('#libTocWrap'), tocList = $('#libTocList'), tocHint = $('#libTocHint');
    const bookId = parseInt($('#libraryBookSelect').value);
    const book = state.booksCache.find(b => b.id === bookId);
    if (!book) { tocWrap.hidden = true; tocHint.hidden = true; return; }
    if (!book.toc?.length) { tocWrap.hidden = true; tocHint.hidden = false; return; }
    tocHint.hidden = true; tocWrap.hidden = false;
    tocList.innerHTML = book.toc.map((t, i) => `
      <div class="toc-item" data-from="${t.page}" data-to="${t.endPage}" data-title="${esc(t.title)}">
        <span class="toc-item-title">${esc(t.title)}</span>
        <span class="toc-item-pages">ص ${t.page}–${t.endPage}</span>
      </div>`).join('');
  }
  async function onExtractFromLib() {
    const bookId = parseInt($('#libraryBookSelect').value);
    if (!bookId) { toast('اختر كتاباً أولاً', 'error'); return; }
    const from = parseInt($('#libPageFrom').value) || 1;
    const to   = parseInt($('#libPageTo').value)   || 5;
    try {
      const book = await dbGet(BOOKS_STORE, bookId);
      if (!book) { toast('لم يُعثر على الكتاب', 'error'); return; }
      await extractPdfRange(book.data, from, to, 'lib');
    } catch (e) { toast('تعذر فتح الكتاب', 'error'); }
  }

  /* ─── [FEATURE: UNIT KNOWLEDGE BANK] ─── */
  async function saveExtractedContentToBank() {
    const title = $('#fTitle').value.trim();
    if (!title) {
      toast('الرجاء إدخال عنوان الدرس أو الوحدة أولاً', 'error');
      return;
    }

    const content = getContentText();
    if (!content) {
      toast('لا يوجد نص لحفظه. استخرج النص من الكتاب أولاً', 'error');
      return;
    }

    const meta = gatherMeta(); // استخدام دالة جمع البيانات الموجودة مسبقاً

    const record = {
      title: title,
      subject: meta.subject,
      grade: meta.grade,
      section: meta.section,
      content: content,
      sourceType: meta.sourceType,
      savedAt: Date.now()
    };

    showOverlay('جاري الحفظ في دروس واختبارات...');
    try {
      await dbAdd(EXTRACTS_STORE, record);
      hideOverlay();
      toast('تم حفظ الدرس في "دروس واختبارات" بنجاح 📚', 'success');
    } catch (e) {
      hideOverlay();
      toast('تعذر حفظ الدرس', 'error');
    }
  }

  /* ─── Meta ─── */
  function gatherMeta() {
    const resourceBoxes = document.querySelectorAll('.resource-chk:checked');
    const availableResources = Array.from(resourceBoxes).map(el => el.value);
    return {
      school:       $('#fSchool').value.trim()   || state.settings.school       || '',
      teacher:      $('#fTeacher').value.trim()  || state.settings.teacher      || '',
      directorate:  state.settings.directorate  || '',
      subject:      $('#fSubject').value.trim()  || state.settings.subject      || '',
      grade:        $('#fGrade').value.trim(),
      section:      $('#fSection').value.trim(),
      date:         $('#fDate').value,
      period:       $('#fPeriod').value.trim(),
      title:        $('#fTitle').value.trim(),
      language:     state.language,
      sourceType:   state.sourceType,
      availableResources
    };
  }
  function getContentText() {
    const src = state.sourceType;
    if (src === 'text')    return $('#pastedText').value.trim();
    if (src === 'images')  return $('#imagesExtractedText').value.trim();
    if (src === 'pdf')     return $('#pdfExtractedText').value.trim();
    if (src === 'library') return $('#libExtractedText').value.trim();
    return '';
  }

  /* ─── [FEATURE: KNOWLEDGE BANK UI] ─── */

  // 1. دالة تحميل وعرض محتويات "دروس واختبارات"
  let bankRecordsCache = [];
  function populateBankFilters() {
    const gradeSel = $('#bankGradeFilter'), subjSel = $('#bankSubjectFilter');
    if (!gradeSel || !subjSel) return;
    const grades = [...new Set(bankRecordsCache.map(r => (r.grade||'').trim()).filter(Boolean))].sort();
    const subjects = [...new Set(bankRecordsCache.map(r => (r.subject||'').trim()).filter(Boolean))].sort();
    const keepG = gradeSel.value, keepS = subjSel.value;
    gradeSel.innerHTML = '<option value="">كل الصفوف</option>' + grades.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    subjSel.innerHTML  = '<option value="">كل المواد</option>'  + subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    gradeSel.value = grades.includes(keepG) ? keepG : '';
    subjSel.value  = subjects.includes(keepS) ? keepS : '';
  }
  function renderBankList() {
    const bankList = $('#bankList');
    const bankEmpty = $('#bankEmpty');
    if (!bankList) return;
    const gFilter = $('#bankGradeFilter')?.value || '';
    const sFilter = $('#bankSubjectFilter')?.value || '';
    let records = bankRecordsCache.slice();
    if (gFilter) records = records.filter(r => (r.grade||'') === gFilter);
    if (sFilter) records = records.filter(r => (r.subject||'') === sFilter);

    bankList.innerHTML = '';
    if (!records.length) { bankEmpty.hidden = false; return; }
    bankEmpty.hidden = true;

    records.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'bank-item';

      item.innerHTML = `
        <input type="checkbox" class="bank-chk bank-item-chk" value="${rec.id}">
        <div class="bank-item-info" data-open-id="${rec.id}">
          <h4 class="bank-item-title">${esc(rec.title || 'بدون عنوان')}</h4>
          <span class="bank-item-meta">${esc(rec.subject || '')} ${rec.subject && rec.grade ? '-' : ''} ${esc(rec.grade || '')} · ${new Date(rec.savedAt).toLocaleDateString('ar-EG')}</span>
        </div>
        <div class="bank-item-actions">
          <!-- 💡 الزر الجديد الواضح -->
          <button type="button" class="bank-item-btn bank-item-prep" data-prep-id="${rec.id}" style="background:#10B981; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:900; font-size:13px; font-family:inherit; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">🚀 تحضير الدرس</button>
          
          <button type="button" class="bank-item-btn bank-item-view" data-open-id="${rec.id}" title="عرض / تعديل">👁️</button>
          <button type="button" class="bank-item-btn bank-item-delete" title="حذف">🗑️</button>
        </div>
      `;
      item.querySelector('.bank-item-delete').addEventListener('click', () => deleteBankItem(rec.id));
      bankList.appendChild(item);
    });
  }
  async function loadKnowledgeBank() {
    const bankList = $('#bankList');
    const bankEmpty = $('#bankEmpty');
    if (!bankList) return;

    bankList.innerHTML = '';

    try {
      const records = await dbGetAll(EXTRACTS_STORE); // جلب كل الدروس المحفوظة
      // الأحدث أولاً (بحسب وقت الحفظ)
      bankRecordsCache = records.slice().sort((a,b) => (b.savedAt||0)-(a.savedAt||0));
      populateBankFilters();
      renderBankList();
    } catch(e) {
      console.error('خطأ في تحميل قائمة الدروس:', e);
    }
  }

  // 2. دالة حذف درس
  async function deleteBankItem(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    await dbDelete(EXTRACTS_STORE, id);
    toast('تم الحذف بنجاح', 'success');
    loadKnowledgeBank(); // إعادة تحميل القائمة
  }

  // 3. نافذة عرض/تعديل الدرس + تحضير خطة منه
  let bankModalRecord = null; // السجل المفتوح حالياً في النافذة

  async function openBankLessonModal(id) {
    const rec = await dbGet(EXTRACTS_STORE, id);
    if (!rec) { toast('تعذر العثور على الدرس', 'error'); return; }
    bankModalRecord = rec;
    setBankModalEditing(false);
    $('#bankEditTitle').value   = rec.title   || '';
    $('#bankEditSubject').value = rec.subject || '';
    $('#bankEditGrade').value   = rec.grade   || '';
    $('#bankEditContent').value = rec.content || '';
    $('#bankModalTitle').textContent = '📄 ' + (rec.title || 'عرض الدرس');
    $('#bankLessonModal').classList.add('is-active');
  }
  function closeBankLessonModal() {
    $('#bankLessonModal').classList.remove('is-active');
    bankModalRecord = null;
  }
  function setBankModalEditing(editing) {
    ['#bankEditTitle', '#bankEditSubject', '#bankEditGrade', '#bankEditContent'].forEach(sel => {
      $(sel).disabled = !editing;
    });
    $('#btnBankToggleEdit').hidden = editing;
    $('#btnBankSaveEdit').hidden = !editing;
  }
  async function saveBankLessonEdit() {
    if (!bankModalRecord) return;
    const title = $('#bankEditTitle').value.trim();
    const content = $('#bankEditContent').value.trim();
    if (!title || !content) { toast('العنوان والنص مطلوبان', 'error'); return; }
    bankModalRecord.title   = title;
    bankModalRecord.subject = $('#bankEditSubject').value.trim();
    bankModalRecord.grade   = $('#bankEditGrade').value.trim();
    bankModalRecord.content = content;
    try {
      await dbPut(EXTRACTS_STORE, bankModalRecord);
      toast('تم حفظ التعديل ✓', 'success');
      setBankModalEditing(false);
      $('#bankModalTitle').textContent = '📄 ' + title;
      loadKnowledgeBank();
    } catch (e) {
      toast('تعذر حفظ التعديل', 'error');
    }
  }
    function useBankLessonAsPlan() {
    if (!bankModalRecord) return;
    resetNewForm();
    $('#fTitle').value   = bankModalRecord.title   || '';
    $('#fSubject').value = bankModalRecord.subject || state.settings.subject || '';
    $('#fGrade').value   = bankModalRecord.grade   || '';
    $('#pastedText').value = bankModalRecord.content || '';
    state.sourceType = 'text';
    $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === 'text'));
    ['title','text','images','pdf','library'].forEach(s => { $('#panel-'+s).hidden = s !== 'text'; });
    closeBankLessonModal();
    navigate('new');
    
    // 👈 السطر الجديد: فتح جميع النوافذ وإظهار المحتوى
    expandPreparationAccordions();
    
    toast('تم تجهيز نص الدرس — راجع البيانات واضغط توليد الخطة', 'success');
  }

async function onGenerateBankSummary() {
    const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
    if (checkedBoxes.length === 0) { toast('الرجاء تحديد درس واحد على الأقل لإنشاء الملخص', 'error'); return; }
    const apiKey = $('#sApiKey').value.trim();
    if (!apiKey) { toast('مفتاح API غير موجود. الرجاء إضافته في الإعدادات.', 'error'); return; }

    showOverlay('جاري قراءة الدروس وبناء مستند الملخص الشامل (مع الخرائط الذهنية)...');
    try {
      const allRecords = await dbGetAll(EXTRACTS_STORE);
      const selectedIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
      const selectedLessons = allRecords.filter(rec => selectedIds.includes(rec.id));

      let combinedText = ''; let combinedTitles = [];
      selectedLessons.forEach((lesson, index) => {
        combinedText += `\n\n--- Lesson/الدرس ${index + 1}: ${lesson.title} ---\n${lesson.content}`;
        if (lesson.title) combinedTitles.push(lesson.title);
      });

      const englishChars = (combinedText.match(/[a-zA-Z]/g) || []).length;
      const arabicChars = (combinedText.match(/[\u0600-\u06FF]/g) || []).length;
      const isEnglish = englishChars > arabicChars;

      const mainTitle = (isEnglish ? "Comprehensive Summary: " : "الملخص الشامل: ") + combinedTitles.join(' + ');

            const prompt = isEnglish ? `
You are an expert English-as-a-Foreign-Language (EFL) teacher preparing a HIGHLY COMPREHENSIVE and beautifully formatted "Study Guide" for Yemeni students.

Reference Texts:
${combinedText}

STEP 1 — Content Analysis:
Extract EVERY grammar rule, new vocabulary word, phrase, and concept. DO NOT summarize too briefly.

STEP 2 — Write the summary using these strict output rules:
1. Use ONLY semantic HTML (no <html>, <head>, or <body> tags).
2. FORMATTING: Use <h2> for main lesson titles, <h3> for sub-sections.
3. ⚠️ **MIND MAP RULE (Mandatory):** At the VERY BEGINNING of each lesson summary, include a mind map. Output its data as JSON strictly inside this exact tag:
   <div class="mindmap-data" style="display:none;">{"root":"Lesson Title", "branches":[{"title":"Branch 1","children":[{"title":"Sub-point"}]}]}</div>
4. LESSON-TYPE HANDLING:
   (A) PURE GRAMMAR lesson: Explain the rule TWICE: first IN ENGLISH, then IN ARABIC. Give 4 to 5 English example sentences, each followed directly by its Arabic translation. (NO vocabulary table here).
   (B) READING/FACTUAL lesson: Put a VOCABULARY HTML <table> immediately after the mind map with 5 columns (English Word | English Meaning | الترجمة العربية | Example Sentence | ترجمة المثال). Then extract main ideas with Arabic translations.
5. DO NOT include any self-assessment, quizzes, or exercises.
6. Do not write any markdown formatting (\`\`\`html) outside HTML tags.
7. PRINT FORMATTING (A4): Inject this <style> block at the beginning: 
   h2 { font-size: 16pt; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 20px; } 
   h3 { font-size: 14pt; color: #059669; margin-top: 15px; } 
   p, li, td, th, blockquote { font-size: 12pt; color: #000000; line-height: 1.1; margin-bottom: 2em; } 
   table { width: 100%; border-collapse: collapse; margin-bottom: 2em; } 
   th, td { border: 1px solid #94a3b8; padding: 6px; text-align: left; }
${mathRulesBlock(true)}
      ` : `
أنت خبير تربوي محترف. بناءً على النصوص التالية، قم بإنشاء "ملخص شامل ومفصل جداً" يغني الطالب تماماً عن العودة للكتاب المدرسي.

النصوص المرجعية:
${combinedText}

الخطوة الأولى — التحليل الشامل:
اقرأ النصوص بدقة واستخرج *كل* فكرة، تعريف، تعليل، خطوة، معلومة ومثال. يُمنع الاختصار المخل.
⚠️ **قاعدة صارمة للمحتوى:** التزم بالنصوص المرجعية فقط! يُمنع منعاً باتاً اختراع أو إضافة معادلات رياضية أو مسائل من خارج النص (إذا كان النص الأصلي يحتوي على مسائل أو قوانين، فقم بشرحها، وإلا فتجاهل الأمر تماماً).

الخطوة الثانية — شروط التنسيق والمخرجات:
1. صغ الملخص بتنسيق HTML الدلالي فقط (بدون أوسمة <html> أو <body>).
2. ⚠️ **قاعدة الخريطة الذهنية (إجبارية لكل درس):** في بداية كل درس، يجب وضع خريطة ذهنية. اكتب بيانات الخريطة كـ JSON حصراً داخل هذا الوسم الدقيق:
   <div class="mindmap-data" style="display:none;">{"root":"عنوان الدرس", "branches":[{"title":"الفرع الأول","children":[{"title":"نقطة فرعية"}]}]}</div>
3. استخدم العناوين <h2> للدروس، و <h3> للفرعية.
4. استخدم الجداول <table> للمفردات والمقارنات.
5. لا تكتب أي تمارين أو أسئلة في نهاية الملخص نهائياً.
6. لا تختصر توفيراً للمساحة، يجب أن يكون شاملاً.
7. لا تكتب علامات Markdown (\`\`\`html) خارج الكود.
8. تنسيق الطباعة الصارم: ضع كود CSS التالي في بداية المخرجات داخل وسم <style>:
   h2 { font-size: 16pt; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 20px; }
   h3 { font-size: 14pt; color: #059669; margin-top: 15px; }
   p, li, td, th, blockquote { font-size: 12pt; color: #000000; line-height: 1.1; margin-bottom: 2em; }
   table { width: 100%; border-collapse: collapse; margin-bottom: 2em; }
   th, td { border: 1px solid #94a3b8; padding: 6px; text-align: right; }
${mathRulesBlock(false)}
      `;
      const model = $('#sDefaultModel').value || 'gemini-3.5-flash';
      const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      const res = await fetch(url, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال');
      
      const responseText = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      let cleanHTML = responseText.replace(/```html/gi, '').replace(/```/g, '').trim();

      // 💡 محرك تحويل JSON الخرائط الذهنية إلى رسمات SVG ودمجها داخل الملخص
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanHTML;
      const mmNodes = tempDiv.querySelectorAll('.mindmap-data');
      for (const node of mmNodes) {
          try {
              let jsonText = node.textContent.trim();
              jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
              const mmJson = JSON.parse(jsonText);
              const mermaidText = buildMermaidFromMindmap(mmJson);
              const svgText = await renderMermaidSVG(mermaidText);
              
              const svgWrapper = document.createElement('div');
              svgWrapper.style.cssText = 'display:flex; justify-content:center; align-items:center; margin: 25px 0; background: #ffffff; padding: 15px; border: 1.5px solid #e2e8f0; border-radius: 12px;';
              svgWrapper.innerHTML = svgText;
              
              const svgEl = svgWrapper.querySelector('svg');
              if (svgEl) {
                  svgEl.removeAttribute('width'); svgEl.removeAttribute('height');
                  svgEl.style.width = '100%'; svgEl.style.maxHeight = '400px';
              }
              node.parentNode.replaceChild(svgWrapper, node);
          } catch (e) {
              console.error('فشل رسم الخريطة المدمجة', e);
              node.remove();
          }
      }
      cleanHTML = tempDiv.innerHTML;

      const newRecord = {
        kind: 'quiz', isDoc: true, title: mainTitle,
        subject: selectedLessons[0]?.subject || state.settings.subject || '',
        grade: selectedLessons[0]?.grade || '', language: isEnglish ? 'en' : 'ar',
        docHtml: cleanHTML, createdAt: Date.now(), updatedAt: Date.now()
      };
      newRecord.id = await dbAdd(LESSONS_STORE, newRecord);

      hideOverlay();
      toast(isEnglish ? 'Summary generated and saved!' : 'تم بناء الملخص وحفظه ✓', 'success');
      state.currentRecord = newRecord; state.phoneViewMode = false;
      navigate('result'); renderResult(); refreshArchiveList();

    } catch (e) {
      hideOverlay(); toast('حدث خطأ: ' + e.message, 'error');
    }
  }
  $('#btnGenBankSummary')?.addEventListener('click', onGenerateBankSummary);

  /* ─── [FEATURE: COMPREHENSIVE EXAM] ─── */
    // --- 1. زر الاختبار الداخلي (الحالي) ---
  $('#btnGenBankQuiz')?.addEventListener('click', () => {
    state.examGenerationTarget = 'internal'; // توجيه داخلي
    const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
    if (checkedBoxes.length === 0) {
      toast('الرجاء تحديد درس واحد على الأقل لإنشاء الاختبار', 'error');
      return;
    }
    if (!$('#sApiKey').value.trim()) {
      toast('مفتاح API غير موجود. الرجاء إضافته في الإعدادات.', 'error');
      return;
    }
    $('#examSectionField').style.display = 'none';
    $('#examSettingsModal').classList.add('is-active');
  }); // <-- انتبه: هنا تم إغلاق الدالة الأولى بنجاح

  // --- 2. زر الاختبار الرسمي (الجديد) ---
  $('#btnGenOfficialExam')?.addEventListener('click', () => {
    state.examGenerationTarget = 'official'; // توجيه لتطبيق الاختبارات
    const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
    if (checkedBoxes.length === 0) {
      toast('الرجاء تحديد درس واحد على الأقل لإنشاء الاختبار', 'error');
      return;
    }
    if (!$('#sApiKey').value.trim()) {
      toast('مفتاح API غير موجود. الرجاء إضافته في الإعدادات.', 'error');
      return;
    }
    $('#examSectionField').style.display = 'none';
    $('#examSettingsModal').classList.add('is-active');
  });

  $('#btnCloseExamSettings')?.addEventListener('click', () => $('#examSettingsModal').classList.remove('is-active'));
  $('#examSettingsModal')?.addEventListener('click', e => { if (e.target === $('#examSettingsModal')) $('#examSettingsModal').classList.remove('is-active'); });

  // --- 3. زر الاختبار الإلكتروني (الجديد - متوافق مع نظام SHTTPS) ---
  $('#btnGenElectronicExam')?.addEventListener('click', () => {
    state.examGenerationTarget = 'electronic';
    const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
    if (checkedBoxes.length === 0) {
      toast('الرجاء تحديد درس واحد على الأقل لإنشاء الاختبار', 'error');
      return;
    }
    if (!$('#sApiKey').value.trim()) {
      toast('مفتاح API غير موجود. الرجاء إضافته في الإعدادات.', 'error');
      return;
    }
    $('#examSectionField').style.display = 'block';
    $('#examSettingsModal').classList.add('is-active');
  });
  // --- 4. زر الاختبار الشفوي (يفتح نافذة الإعدادات) ---
  $('#btnGenBankOralExam')?.addEventListener('click', () => {
    state.examGenerationTarget = 'oral'; 
    const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
    if (checkedBoxes.length === 0) {
      toast('الرجاء تحديد درس واحد على الأقل لإنشاء الاختبار', 'error');
      return;
    }
    if (!$('#sApiKey').value.trim()) {
      toast('مفتاح API غير موجود. الرجاء إضافته في الإعدادات.', 'error');
      return;
    }
    $('#examSectionField').style.display = 'none'; 
    $('#examSettingsModal').classList.add('is-active'); 
  });

  const EXAM_TYPE_LABELS_AR = { mcq:'اختيار من متعدد', tf:'صح / خطأ', blank:'أكمل الفراغ', match:'مطابقة (توصيل)', essay:'مقالي قصير' };
  const EXAM_TYPE_LABELS_EN = { mcq:'Multiple Choice', tf:'True / False', blank:'Fill in the Blank', match:'Matching', essay:'Short Essay' };

    $('#btnConfirmExamGen')?.addEventListener('click', async () => {
    // 💡 التعديل الفولاذي: حصر البحث داخل نافذة الاختبار فقط لمنع التداخل مع نافذة الواجبات
    const examModal = $('#examSettingsModal');
    const typeSettings = $$('.examtype-chk', examModal).filter(c => c.checked).map(c => {
      // نأخذ النوع إما من الصندوق نفسه أو من الحاوية الخاصة به
      const type = c.dataset.type || c.closest('.examtype-row')?.dataset.type;
      // نبحث عن حقل العدد داخل نفس الحاوية لتجنب التداخل
      const row = c.closest('.examtype-row');
      const countInp = row ? $('.examtype-count', row) : $(`.examtype-count[data-type="${type}"]`, examModal);
      
      return { type, count: Math.max(1, parseInt(countInp?.value) || 1) };
    }).filter(t => t.type); // استبعاد أي قيم فارغة تجنباً للتجمّد

    if (!typeSettings.length) { toast('اختر نوعاً واحداً على الأقل من الأسئلة', 'error'); return; }
    const difficulty = $('#examDifficulty').value;

    $('#examSettingsModal').classList.remove('is-active');

    const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
    const apiKey = $('#sApiKey').value.trim();
    if (checkedBoxes.length === 0 || !apiKey) return;

    showOverlay('جاري إعداد ورقة الاختبار الشاملة...');
    try {
      const allRecords = await dbGetAll(EXTRACTS_STORE);
      const selectedIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
      const selectedLessons = allRecords.filter(rec => selectedIds.includes(rec.id));

      let combinedText = '';
      let combinedTitles = [];
      selectedLessons.forEach((lesson, index) => {
        combinedText += `\n\n--- Lesson/الدرس ${index + 1}: ${lesson.title} ---\n${lesson.content}`;
        if (lesson.title) combinedTitles.push(lesson.title);
      });

      const englishChars = (combinedText.match(/[a-zA-Z]/g) || []).length;
      const arabicChars = (combinedText.match(/[\u0600-\u06FF]/g) || []).length;
      const isEnglish = englishChars > arabicChars;

                          // مسار الاختبار الرسمي (ExamiGen) - يستدعي النافذة المدمجة من ملف exam-builder مباشرة
      if (state.examGenerationTarget === 'official') {
          hideOverlay(); 
          if (window.ExamBuilder && typeof window.ExamBuilder.openOptionsAndGenerate === 'function') {
              window.ExamBuilder.openOptionsAndGenerate(selectedLessons, typeSettings, difficulty, isEnglish);
          } else {
              toast('⚠️ ملف التوليد (exam-builder.js) مفقود أو لم يكتمل تحميله!', 'error');
          }
          return; 
      }



      
      // مسار الاختبار الإلكتروني (متوافق مع نظام SHTTPS)

      // مسار الاختبار الإلكتروني (متوافق مع نظام SHTTPS)
      if (state.examGenerationTarget === 'electronic') {
          hideOverlay();
          generateElectronicExam(selectedLessons, typeSettings, difficulty, isEnglish);
          return;
      }
      
      // مسار الاختبار الشفوي 
      if (state.examGenerationTarget === 'oral') {
          hideOverlay();
          generateOralExamJSON(selectedLessons, typeSettings, difficulty, isEnglish);
          return;
      }

      const mainTitle = (isEnglish ? "Comprehensive Exam: " : "اختبار شامل: ") + combinedTitles.join(' + ');
      const typeLabels = isEnglish ? EXAM_TYPE_LABELS_EN : EXAM_TYPE_LABELS_AR;
      const typesListText = typeSettings.map(t => `- ${typeLabels[t.type]}: ${t.count} ${isEnglish ? 'questions' : 'سؤال'}`).join('\n');

      const prompt = buildExamPrompt(combinedText, typesListText, difficulty, isEnglish);

      const model = $('#sDefaultModel').value || 'gemini-3.5-flash';
      const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال بالذكاء الاصطناعي');

      const responseText = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      const cleanHTML = responseText.replace(/```html/gi, '').replace(/```/g, '').trim();

      const meta = {
        school: state.settings.school || '', teacher: state.settings.teacher || '',
        subject: selectedLessons[0]?.subject || state.settings.subject || '',
        grade: selectedLessons[0]?.grade || '', date: new Date().toLocaleDateString(isEnglish?'en-GB':'ar-EG'),
        difficulty
      };
      const headerHtml = buildExamHeaderHtml(mainTitle, meta, isEnglish);

      const newRecord = {
        kind: 'exam',
        isDoc: true,
        title: mainTitle,
        subject: meta.subject,
        grade: meta.grade,
        language: isEnglish ? 'en' : 'ar',
        docHtml: headerHtml + cleanHTML,
        createdAt: Date.now(), updatedAt: Date.now()
      };
      newRecord.id = await dbAdd(LESSONS_STORE, newRecord);

      hideOverlay();
      toast(isEnglish ? 'Exam generated and saved to archive!' : 'تم بناء الاختبار وحفظه في الأرشيف ✓', 'success');

      state.currentRecord = newRecord; state.phoneViewMode = false;
      navigate('result'); renderResult();
      refreshArchiveList();

    } catch (e) {
      hideOverlay();
      console.error(e);
      toast('حدث خطأ: ' + e.message, 'error');
    }
  });


  async function generateElectronicExam(selectedLessons, typeSettings, difficulty, isEnglish) {
    showOverlay('جاري إعداد الاختبار الإلكتروني...');
    try {
      let combinedText = selectedLessons.map((l, i) => `--- Lesson ${i+1}: ${l.title} ---\n${l.content}`).join('\n\n');

            // مخطط JSON يفرض على الذكاء الاصطناعي تحديد الإجابة الصحيحة لكل سؤال (ضروري للتصحيح التلقائي)
      const ELECTRONIC_EXAM_SCHEMA = { type: "object", properties: {}, required: [] };
      const requestedTypes = typeSettings.map(t => t.type);

      if (requestedTypes.includes('mcq')) {
        ELECTRONIC_EXAM_SCHEMA.properties.mcq = { type: "array", items: { type: "object",
          properties: { q: {type:"string"}, options: {type:"array", items:{type:"string"}}, correctIndex: {type:"integer"} },
          required: ["q","options","correctIndex"] } };
        ELECTRONIC_EXAM_SCHEMA.required.push("mcq");
      }
      if (requestedTypes.includes('tf')) {
        ELECTRONIC_EXAM_SCHEMA.properties.tf = { type: "array", items: { type: "object",
          properties: { statement: {type:"string"}, correct: {type:"boolean"} },
          required: ["statement","correct"] } };
        ELECTRONIC_EXAM_SCHEMA.required.push("tf");
      }
      if (requestedTypes.includes('blank')) {
        ELECTRONIC_EXAM_SCHEMA.properties.blank = { type: "array", items: { type: "object",
          properties: { sentence: {type:"string"}, answer: {type:"string"} },
          required: ["sentence","answer"] } };
        ELECTRONIC_EXAM_SCHEMA.required.push("blank");
      }
      if (requestedTypes.includes('match')) {
        ELECTRONIC_EXAM_SCHEMA.properties.match = { type: "array", items: { type: "object",
          properties: { left: {type:"string"}, right: {type:"string"} },
          required: ["left","right"] } };
        ELECTRONIC_EXAM_SCHEMA.required.push("match");
      }
      if (requestedTypes.includes('essay')) {
        ELECTRONIC_EXAM_SCHEMA.properties.essay = { type: "array", items: { type: "string" } };
        ELECTRONIC_EXAM_SCHEMA.required.push("essay");
      }
      if (requestedTypes.includes('reading')) {
        ELECTRONIC_EXAM_SCHEMA.properties.reading = { type: "array", items: { type: "object", properties: { passage: { type: "string" }, questions: { type: "array", items: { type: "object", properties: { q: { type: "string" }, type: { type: "string" }, options: { type: "array", items: { type: "string" } }, a: { type: "string" } }, required: ["q", "type", "options", "a"] } } }, required: ["passage", "questions"] } };
        ELECTRONIC_EXAM_SCHEMA.required.push("reading");
      }


      const typeLabels = isEnglish ? EXAM_TYPE_LABELS_EN : EXAM_TYPE_LABELS_AR;
      const typesListText = typeSettings.map(t => `- ${typeLabels[t.type]}: ${t.count} ${isEnglish?'questions':'سؤال'}`).join('\n');

            const sysMsg = `You are a strict data formatter. Return ONLY valid JSON matching the schema. NO markdown, NO text outside JSON. Every MCQ must have EXACTLY 4 options with correctIndex being the zero-based index of the right one. Distribute correctIndex values evenly across 0,1,2,3 - do not always put the answer in the same position.`;
      
      // التوجيهات الصارمة لمحتوى وشكل الأسئلة (للغتين مع التركيز على الإنجليزي)
      const contentGuidance = isEnglish ? `
Content Coverage & Question Style Guidelines:
1. Question Length: Keep ALL questions VERY SHORT, concise, and direct. Avoid long or wordy sentences.
2. Content Priority: Focus heavily on testing Grammar rules, Vocabulary usage, and core scientific/important concepts.
3. Contextual Testing: Test grammar and vocabulary through short, practical context sentences (e.g., choosing the correct verb tense or vocabulary word).
4. Fill-in-the-blank: You MUST replace the target missing word with dots '........'. NEVER include the actual answer in the question text.
${mathRulesBlock(true)}
` : `
توجيهات المحتوى وشكل الأسئلة:
1. اجعل جميع الأسئلة قصيرة جداً ومباشرة وموجزة، وتجنب الجمل الطويلة.
2. ركز بقوة على المفاهيم العلمية والهامة، والقواعد الأساسية.
3. في أسئلة إكمال الفراغ: استبدل الكلمة المطلوبة بنقاط '........' ولا تكتب الإجابة داخل السؤال أبداً.
${mathRulesBlock(false)}
`;

      const prompt = `
Create exam questions based ONLY on the provided reference texts.
Difficulty: ${difficulty}. Language: ${isEnglish ? 'English' : 'Arabic'}.
${contentGuidance}
Required questions:
${typesListText}
Reference Texts:
${combinedText}
      `;

      const apiKey = $('#sApiKey').value.trim();
      const model = $('#sDefaultModel').value || 'gemini-3.5-flash';
      const examJson = await callGemini(model, sysMsg, prompt, ELECTRONIC_EXAM_SCHEMA);

      const meta = {
        school: state.settings.school || '',
        teacher: state.settings.teacher || '',
        subject: selectedLessons[0]?.subject || state.settings.subject || '',
        grade: selectedLessons[0]?.grade || '',
        section: $('#examSectionInput').value.trim() || '',
        directorate: state.settings.directorate || ''
      };

      const examFileNameBase = sanitizeFilename('اختبار-الكتروني-' + (selectedLessons[0]?.title || meta.subject));
      const htmlOutput = buildElectronicExamHtml(examJson, meta, examFileNameBase + '.html', isEnglish);

      const blob = new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
      downloadBlob(blob, examFileNameBase + '.html');

      hideOverlay();
      toast('تم توليد الاختبار الإلكتروني! انقله لمجلد exams في جهاز الخادم.', 'success');

    } catch (e) {
      hideOverlay();
      console.error(e);
      toast('حدث خطأ أثناء التوليد: ' + e.message, 'error');
    }
  }
  
    async function generateOralExamJSON(selectedLessons, typeSettings, difficulty, isEnglish) {
    showOverlay('جاري صياغة أسئلة الاختبار الشفوي المخصصة...');
    try {
      let combinedText = selectedLessons.map((l, i) => `--- Lesson ${i+1}: ${l.title} ---\n${l.content}`).join('\n\n');
      const apiKey = $('#sApiKey').value.trim();

          const ORAL_EXAM_SCHEMA = { type: "object", properties: {}, required: [] };
      const requestedTypes = typeSettings.map(t => t.type);

      if (requestedTypes.includes('mcq')) {
        ORAL_EXAM_SCHEMA.properties.mcq = { type: "array", items: { type: "object", properties: { q: {type:"string"}, options: {type:"array", items:{type:"string"}}, correctIndex: {type:"integer"} }, required: ["q","options","correctIndex"] } };
        ORAL_EXAM_SCHEMA.required.push("mcq");
      }
      if (requestedTypes.includes('tf')) {
        ORAL_EXAM_SCHEMA.properties.tf = { type: "array", items: { type: "object", properties: { statement: {type:"string"}, correct: {type:"boolean"} }, required: ["statement","correct"] } };
        ORAL_EXAM_SCHEMA.required.push("tf");
      }
      if (requestedTypes.includes('blank')) {
        ORAL_EXAM_SCHEMA.properties.blank = { type: "array", items: { type: "object", properties: { sentence: {type:"string"}, answer: {type:"string"} }, required: ["sentence","answer"] } };
        ORAL_EXAM_SCHEMA.required.push("blank");
      }
      if (requestedTypes.includes('essay')) {
        ORAL_EXAM_SCHEMA.properties.essay = { type: "array", items: { type: "string" } };
        ORAL_EXAM_SCHEMA.required.push("essay");
      }

      if (requestedTypes.includes('reading')) {
        ORAL_EXAM_SCHEMA.properties.reading = { type: "array", items: { type: "object", properties: { passage: { type: "string" }, questions: { type: "array", items: { type: "object", properties: { q: { type: "string" }, type: { type: "string" }, options: { type: "array", items: { type: "string" } }, a: { type: "string" } }, required: ["q", "type", "options", "a"] } } }, required: ["passage", "questions"] } };
        ORAL_EXAM_SCHEMA.required.push("reading");
      }

      const typeLabels = isEnglish ? EXAM_TYPE_LABELS_EN : EXAM_TYPE_LABELS_AR;
      const typesListText = typeSettings.map(t => `- ${typeLabels[t.type]}: ${t.count} ${isEnglish?'questions':'سؤال'}`).join('\n');

            const sysMsg = `You are a strict data formatter. Return ONLY valid JSON matching the schema. NO markdown.`;
      
      // 💡 القيود الصارمة المضافة لجعل الأسئلة قصيرة جداً ومباشرة وخالية من التعقيد
      const oralGuidance = isEnglish ? `
Strict Content & Question Style Guidelines for Oral Exams:
1. Length & Simplicity: Questions MUST be extremely short (maximum 8 to 12 words). Use basic, everyday English suitable for a beginner ESL student to answer verbally in 3 seconds. DO NOT use long passages or complex scenarios.
2. Core Concepts ONLY: Test ONLY the most prominent definitions, main grammar rules, and obvious facts. DO NOT ask about obscure details, minor notes, or vague points.
3. Clear Options: If generating MCQ, the options must be very short (1-3 words) and clearly distinct from each other.
4. Conversational: Get straight to the point without wordy introductory phrases.
      ` : `
توجيهات صارمة لمحتوى وأسلوب الاختبار الشفوي:
1. القصر والوضوح: يجب أن تكون الأسئلة قصيرة جداً جداً ومباشرة (من 5 إلى 12 كلمة كحد أقصى) لتناسب الإلقاء الشفوي السريع أمام الطالب. لا تستخدم سيناريوهات طويلة أو معقدة أبداً.
2. التركيز على الأساسيات (منع الغموض): اسأل فقط عن المفاهيم الكبرى، التعريفات الواضحة، والأفكار المركزية. يُمنع منعاً باتاً السؤال عن تفاصيل هامشية، أرقام دقيقة، استنتاجات معقدة، أو أسطر مخفية في الدرس.
3. خيارات واضحة وسريعة: في أسئلة الاختيار من متعدد، يجب أن تكون الخيارات قصيرة جداً (كلمة أو كلمتين) ومتميزة بوضوح عن بعضها.
4. الإجابة السريعة البديهية: صغ السؤال بحيث يستطيع الطالب فهمه من السمع فقط، والإجابة عليه في 3 ثوانٍ.
      `;

      const prompt = `
Create oral exam questions to be asked verbally in class, based ONLY on the provided reference texts.
Difficulty: ${difficulty}. Language: ${isEnglish ? 'English' : 'Arabic'}.
${oralGuidance}
For 'blank' questions, replace the missing word with '........'.
Required questions:
${typesListText}

Reference Texts:
${combinedText}
      `;

      const model = $('#sDefaultModel').value || 'gemini-3.5-flash';
      let res = await callGemini(model, sysMsg, prompt, ORAL_EXAM_SCHEMA);

      function ensureMathShortcodes(obj) {
          if (typeof obj === 'string') {
              return obj.replace(/(?:sqrt|جذر)\s*\(([^)]+)\)/gi, (m, val) => `[root:${val.trim()}]`);
          }
          if (Array.isArray(obj)) return obj.map(ensureMathShortcodes);
          if (obj !== null && typeof obj === 'object') {
              for (let key in obj) { obj[key] = ensureMathShortcodes(obj[key]); }
          }
          return obj;
      }
      res = ensureMathShortcodes(res);

      // 🌟 الحفظ الدائم في قاعدة البيانات بدلاً من الذاكرة المؤقتة 🌟
            // 🌟 الحفظ الدائم في قاعدة البيانات بدلاً من الذاكرة المؤقتة 🌟
      const mainTitle = (isEnglish ? "Oral Exam: " : "اختبار شفوي: ") + selectedLessons.map(l => l.title).join(' + ');
      const newRecord = {
        kind: 'oral',
        title: mainTitle,
        subject: selectedLessons[0]?.subject || state.settings.subject || '',
        grade: selectedLessons[0]?.grade || '',
        language: isEnglish ? 'en' : 'ar',
        oralData: res, // نحفظ الأسئلة هنا كبيانات صلبة
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // 💡 التعديل هنا: التقطنا رقم المعرّف (ID) الخاص بالاختبار لحظة حفظه
      const insertedId = await dbAdd(LESSONS_STORE, newRecord);

      hideOverlay();
      toast('تم الحفظ! جاري فتح منصة الاختبارات الشفوية...', 'success');
      
      // 💡 التعديل هنا: أرسلنا رقم الـ ID في الرابط لكي تعرف الشاشة أي اختبار تفتح
      window.location.href = 'oralexam.html?id=' + insertedId;

    } catch (e) {
      hideOverlay();
      console.error(e);
      toast('حدث خطأ أثناء التوليد: ' + e.message, 'error');
    }
  }


  function buildExamHeaderHtml(title, meta, isEnglish) {
    const dir = isEnglish ? 'ltr' : 'rtl';
    const rows = isEnglish
      ? [['School', meta.school], ['Subject', meta.subject], ['Grade', meta.grade], ['Date', meta.date], ['Student Name', '_______________'], ['Time', '_______________'], ['Score', '_______________']]
      : [['المدرسة', meta.school], ['المادة', meta.subject], ['الصف', meta.grade], ['التاريخ', meta.date], ['اسم الطالب', '_______________'], ['الزمن', '_______________'], ['الدرجة', '_______________']];
    return `
      <div class="exam-header" dir="${dir}" style="border:2px solid #7C3AED; border-radius:10px; padding:16px; margin-bottom:24px;">
        <table style="width:100%; border-collapse:collapse; font-size:0.95em;">
          ${rows.map((r,i) => i % 2 === 0 ? `<tr><td style="padding:6px 4px; font-weight:800; width:15%;">${esc(r[0])}:</td><td style="padding:6px 4px; width:35%;">${esc(r[1])}</td>` : `<td style="padding:6px 4px; font-weight:800; width:15%;">${esc(r[0])}:</td><td style="padding:6px 4px; width:35%;">${esc(r[1])}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  function buildExamPrompt(combinedText, typesListText, difficulty, isEnglish) {
    if (isEnglish) {
      return `
You are an expert English-as-a-Foreign-Language (EFL) teacher preparing a comprehensive written exam for Yemeni secondary students who are learning English as a second language, based on the following unit texts (which may include more than one lesson).

Reference Texts:
${combinedText}

Required question types and counts:
${typesListText}

Difficulty level: ${difficulty}
${mathRulesBlock(true)}
Content Coverage & Priority (analyze before writing):
- Identify the exam-worthy content in this priority order: 1) Grammar rules/structures explicitly taught, 2) Vocabulary and phrases that actually appear in the texts, 3) Concepts and definitions explicitly explained, 4) minor supporting details last.
- Distribute questions proportionally across ALL lessons/sections provided — do not cluster all questions on one lesson while ignoring others.
- Vary the cognitive level across questions (simple recall, comprehension, and applying a rule/word in a new short example) rather than only literal recall from the text.
- Do not repeat the same fact or word tested in more than one question.
- Phrase every question in short, simple, direct English suitable for a beginner/intermediate EFL learner — avoid advanced vocabulary or complex grammar in the question itself, even when testing an advanced point.

Strict Output Rules:
1. Output ONLY semantic HTML fragments (no <html>, <head>, or <body> tags), starting directly with the first section.
2. Group questions by type under an <h2> section heading for each type used (e.g. "Section One: Multiple Choice").
3. For Multiple Choice and True/False questions, use EXACTLY this structure for each question (True/False options are simply "True" and "False"):
   <div class="mcq-card" data-answer="0">
     <p class="mcq-q">1. Question text?</p>
     <div class="mcq-options">
       <button type="button" class="mcq-opt" data-idx="0">Option A</button>
       <button type="button" class="mcq-opt" data-idx="1">Option B</button>
     </div>
     <p class="mcq-exp" style="display:none;">Brief explanation of the correct answer</p>
   </div>
   data-answer must match the correct option's data-idx.
4. For Fill-in-the-Blank questions, use EXACTLY this structure:
   <div class="cloze-card">
     <p class="cloze-q">1. Sentence with a ______ blank to complete.</p>
     <button type="button" class="cloze-reveal-btn">Show Answer</button>
     <p class="cloze-ans" style="display:none;">correct word/phrase</p>
   </div>
5. For Matching questions, use EXACTLY this structure (equal number of items in both columns, column B shuffled so it does not match column A order):
   <div class="match-card">
     <div class="match-cols">
       <ul class="match-colA"><li data-key="1">Item 1</li><li data-key="2">Item 2</li></ul>
       <ul class="match-colB"><li data-key="2">Match for item 2</li><li data-key="1">Match for item 1</li></ul>
     </div>
     <button type="button" class="match-reveal-btn">Show Correct Matches</button>
     <div class="match-ans" style="display:none;">1 → Match for item 1, 2 → Match for item 2</div>
   </div>
6. For Short Essay questions, keep them simple and guided (a short, focused prompt rather than an open-ended free-writing task, since these students are EFL beginners/intermediate), listed plainly (no answer) under their section using <ol><li>Question text</li></ol>. Then AFTER all other sections, add ONE final section:
   <div class="essay-answer-key" style="page-break-before:always;">
     <h2>Essay Answer Key (For Teacher Use)</h2>
     <ol><li><strong>Question text</strong><br>Model answer.</li></ol>
   </div>
   listing every essay question with a concise model answer, in the same order as they appeared.
7. Number questions sequentially within each section starting from 1.
8. Do not write any markdown formatting (\`\`\`html) or any text outside the HTML tags.
${mathRulesBlock(true)}
      `;
    }
    return `
أنت معلم خبير تُعدّ ورقة اختبار تحريري شاملة للطلاب في المرحلة الثانوية اليمنية، بناءً على النصوص التالية.

النصوص المرجعية:
${combinedText}

أنواع الأسئلة والأعداد المطلوبة:
${typesListText}

مستوى الصعوبة: ${difficulty}
${mathRulesBlock(false)}
توجيه تحليل المحتوى (نفّذه قبل الكتابة):
- اقرأ كل النصوص المرجعية أعلاه (وقد تضم أكثر من درس)، وحدد أهم النقاط التي تستحق أن تُسأل فعلاً في كل درس.
- وزّع الأسئلة بشكل متناسب على كل الدروس/الأقسام المُرفقة — لا تُركّز كل الأسئلة على درس واحد وتُهمل الباقي.
- نوّع المستوى المعرفي للأسئلة (تذكر، فهم، تطبيق) بدل الاقتصار على الاسترجاع الحرفي للنص فقط.
- لا تكرر نفس المعلومة أو الحقيقة في أكثر من سؤال واحد.

الشروط الصارمة للمخرجات:
1. أخرج فقط أجزاء HTML دلالية (بدون أوسمة <html> أو <head> أو <body>)، ابدأ مباشرة بالقسم الأول.
2. اجمع الأسئلة حسب النوع تحت عنوان قسم <h2> لكل نوع مستخدم (مثال: "السؤال الأول: اختر الإجابة الصحيحة").
3. لأسئلة الاختيار من متعدد وصح/خطأ استخدم هذا الهيكل بالضبط لكل سؤال (خيارات صح/خطأ تكون فقط "صح" و"خطأ"):
   <div class="mcq-card" data-answer="1">
     <p class="mcq-q">1. نص السؤال؟</p>
     <div class="mcq-options">
       <button type="button" class="mcq-opt" data-idx="0">الخيار الأول</button>
       <button type="button" class="mcq-opt" data-idx="1">الخيار الثاني</button>
     </div>
     <p class="mcq-exp" style="display:none;">شرح موجز للإجابة الصحيحة</p>
   </div>
   يجب أن يطابق data-answer رقم data-idx للإجابة الصحيحة.
4. لأسئلة أكمل الفراغ استخدم هذا الهيكل بالضبط:
   <div class="cloze-card">
     <p class="cloze-q">1. جملة فيها فراغ ______ ليكمله الطالب.</p>
     <button type="button" class="cloze-reveal-btn">إظهار الإجابة</button>
     <p class="cloze-ans" style="display:none;">الكلمة أو العبارة الصحيحة</p>
   </div>
5. لأسئلة المطابقة استخدم هذا الهيكل بالضبط (عدد متساوٍ من العناصر في العمودين، مع خلط ترتيب العمود الثاني):
   <div class="match-card">
     <div class="match-cols">
       <ul class="match-colA"><li data-key="1">العنصر 1</li><li data-key="2">العنصر 2</li></ul>
       <ul class="match-colB"><li data-key="2">مطابقة العنصر 2</li><li data-key="1">مطابقة العنصر 1</li></ul>
     </div>
     <button type="button" class="match-reveal-btn">إظهار الحل الصحيح</button>
     <div class="match-ans" style="display:none;">1 ← مطابقة العنصر 1، 2 ← مطابقة العنصر 2</div>
   </div>
6. لأسئلة المقالي القصير، اسردها بلا إجابة تحت قسمها باستخدام <ol><li>نص السؤال</li></ol>. ثم بعد كل الأقسام الأخرى أضف قسماً أخيراً واحداً فقط:
   <div class="essay-answer-key" style="page-break-before:always;">
     <h2>نموذج إجابة الأسئلة المقالية (لاستخدام المعلم)</h2>
     <ol><li><strong>نص السؤال</strong><br>الإجابة النموذجية.</li></ol>
   </div>
   يسرد كل سؤال مقالي مع إجابة نموذجية موجزة، بنفس ترتيب ظهوره.
7. رقّم الأسئلة تسلسلياً داخل كل قسم بدءاً من 1.
8. لا تكتب أي علامات Markdown (\`\`\`html) أو أي نص خارج وسوم HTML.
${mathRulesBlock(false)}
      `;
  }

  /* ─── Gemini Schemas ─── */
  function stageObj() {
    return { type:'object', properties:{ teacherRole:{type:'string'}, ssRole:{type:'string'}, time:{type:'string'} }, required:['teacherRole','ssRole','time'] };
  }

  // مصدر واحد لأسماء مراحل الخطة العربية.
  // يجب أن تستخدمه الـSchema والـPrompt والـRenderer معاً حتى لا يحدث اختلاف بينها.
  const ARABIC_STEPS = [
    'التمهيد',
    'عرض الدرس',
    'التدريب الموجّه',
    'التدريب المستقل',
    'التقويم والختام'
  ];

  const ARABIC_SCHEMA = {
    type:'object',
    properties:{
      rows:{
        type:'array',
        minItems:5,
        maxItems:5,
        items:{
          type:'object',
          properties:{
            stepLabel:{ type:'string', enum:ARABIC_STEPS },
            time:{ type:'string' },
            objectives:{
              type:'array',
              items:{
                type:'object',
                properties:{
                  text:{type:'string'},
                  domain:{type:'string',enum:['معرفي','مهاري','وجداني']},
                  level:{type:'string',enum:['تذكر','فهم','تطبيق','تحليل','تقويم','إبداع']}
                },
                required:['text','domain','level']
              }
            },
            teacherRole:{type:'array',items:{type:'string'}},
            studentRole:{type:'array',items:{type:'string'}},
            assessment:{type:'array',items:{type:'string'}}
          },
          required:['stepLabel','time','objectives','teacherRole','studentRole','assessment']
        }
      },
      homework:{type:'string'},
      enrichment:{type:'string'}
    },
    required:['rows','homework','enrichment']
  };

 // ============================================================================
// 👨‍🎓 محرك المعلم التفاعلي (Interactive Tutor Module)
// ============================================================================

/* ─── مخطط المعلم التفاعلي ─── */
const TUTOR_SCHEMA = {
  type: 'object',
  properties: {
    intro: { type: 'string' },
    dialogue: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          speaker: { type: 'string', enum: ['tutor', 'student'] },
          text: { type: 'string' }
        },
        required: ['speaker', 'text']
      }
    },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          definition: { type: 'string' }
        },
        required: ['term', 'definition']
      }
    },
    faqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          a: { type: 'string' }
        },
        required: ['q', 'a']
      }
    },
    formativeQuiz: {
      type: 'array',
      minItems: 5,
      maxItems: 10,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          qTranslation: { type: 'string' },
          options: {
            type: 'array',
            minItems: 2,
            maxItems: 2,
            items: { type: 'string' }
          },
          correctIndex: { type: 'integer', minimum: 0, maximum: 1 },
                   hint: { type: 'string' },
          successMsg: { type: 'string' }
        },
        required: ['question', 'qTranslation', 'options', 'correctIndex', 'hint', 'successMsg']

      }
    }
  },
  required: ['intro', 'dialogue', 'flashcards', 'faqs', 'formativeQuiz']
};

/* ─── بناء تعليمات المعلم التفاعلي (البرومبت) ─── */
function buildTutorSystem(lang) {
  const isEn = lang === 'en';

  const basePrompt = `
أنت معلم ثانوي خبير، ومهمتك تحويل الدرس المرفق إلى "معلم تفاعلي"
يعلّم الطالب الدرس كاملاً، وليس مجرد تلخيصه.

⚠️ القاعدة الأساسية:
قبل كتابة الإجابة، اقرأ الدرس كاملاً وحلله داخلياً، وحدد جميع أجزائه وأفكاره الرئيسية والفرعية.
ثم تأكد أن الشرح يغطي جميع المعلومات المهمة الموجودة في الدرس.

لا تختصر الدرس اختصاراً يضيع المعلومات.
لا تتجاهل أي جزء مهم.
لا تضف معلومات غير موجودة في الدرس إلا إذا كانت مجرد توضيح تربوي بسيط ولا تغيّر محتوى الدرس.

يجب أن يكون الشرح مناسباً لطالب في المرحلة الثانوية، وبأسلوب واضح وتدريجي وحواري.
`;

  const englishPrompt = isEn ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ منهجية خاصة بمادة اللغة الإنجليزية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

هذا درس لغة إنجليزية EFL.
الهدف هو تعليم الطالب اللغة الموجودة في الدرس، وليس مجرد شرح موضوع الدرس بالعربية.

يجب أن تغطي، حسب ما يوجد فعلاً في الدرس:

1. READING / TEXT
- لا تتجاهل النصوص الإنجليزية.
- اشرح النص جزءاً جزءاً.
- اذكر الجمل أو العبارات الإنجليزية المهمة.
- وضح معناها بالعربية.
- اشرح الفكرة الرئيسية والتفاصيل المهمة.
- وضح الشخصيات والأحداث والأسباب والنتائج عند وجودها.

2. VOCABULARY
- استخرج الكلمات الجديدة والمهمة والمركزية في الدرس.
- اشرح معناها بالعربية.
- وضح معناها حسب السياق.
- اذكر synonym أو antonym إذا كان موجوداً أو مناسباً من محتوى الدرس.
- لا تقتصر على عدد قليل من الكلمات إذا كان الدرس يحتوي على مفردات مهمة أكثر.

3. GRAMMAR
إذا كان الدرس يحتوي على قاعدة نحوية:
- اشرح استخدام القاعدة.
- اشرح تركيبها Form.
- الجملة المثبتة Affirmative إذا كانت مناسبة.
- النفي Negative إذا كانت مناسبة.
- السؤال Questions إذا كان مناسباً.
- الكلمات الدالة Signal words إذا كانت موجودة ومفيدة.
- الحالات والاستثناءات المهمة.
- الأخطاء الشائعة.
- قدم عدة أمثلة واضحة بالإنجليزية مع ترجمتها العربية.
- لا تترك أي قاعدة موجودة في الدرس دون شرح.

4. LANGUAGE FUNCTIONS
إذا احتوى الدرس على وظائف لغوية أو تعبيرات:
- اشرح معناها.
- متى تستخدم.
- قدم أمثلة من الدرس أو أمثلة مشابهة.

5. COMPREHENSION
بعد شرح أجزاء الدرس، اختبر فهم الطالب:
- الفكرة الرئيسية.
- التفاصيل.
- من؟ ماذا؟ أين؟ متى؟ لماذا؟ كيف؟
- السبب والنتيجة.
- معنى الكلمات من السياق.
- الاستنتاج عندما يكون مناسباً.

⚠️ لا تحول الدرس إلى ملخص عربي قصير.
علّم الطالب محتوى الدرس الإنجليزي فعلياً.
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ منهجية المواد الأخرى
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

علّم جميع المعلومات المهمة الموجودة في الدرس حسب طبيعة المادة.

غطِّ عند وجودها:
- التعريفات والمصطلحات.
- الحقائق والمعلومات.
- القوانين والقواعد.
- الأسباب والنتائج.
- المقارنات والفروق.
- الأمثلة.
- الخطوات والمراحل.
- العلاقات بين الأفكار.
- النقاط التي قد يخطئ فيها الطالب.
- التفاصيل التي يمكن أن تأتي في الاختبار.

لا تكرر نفس الفكرة كثيراً، ولا تخترع معلومات غير موجودة في الدرس.
`;

  const quizPrompt = isEn ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ الاختبار
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

أنشئ من 5 إلى 10 أسئلة فقط حسب حجم الدرس:
- درس صغير: حوالي 5 أسئلة.
- درس متوسط: 6 إلى 8 أسئلة.
- درس كبير وشامل: 9 إلى 10 أسئلة.
- الحد الأقصى المطلق 10 أسئلة.

يجب أن تغطي الأسئلة أجزاء مختلفة من الدرس، ولا تكرر نفس المعلومة.

في اللغة الإنجليزية وزّع الأسئلة، حسب محتوى الدرس، بين:
- Reading comprehension
- Main idea
- Details
- Vocabulary meaning
- Synonyms / Antonyms
- Vocabulary in context
- Grammar
- Grammar application
- Language functions
- Inference / application

لا تستخدم نوعاً غير موجود أو غير مناسب للدرس.

السؤال يكون باللغة الإنجليزية.
ضع ترجمته العربية في qTranslation.

كل سؤال يحتوي على خيارين فقط.
لا تستخدم ثلاثة خيارات.

correctIndex يجب أن يكون:
0 أو 1 فقط.

وزّع الإجابات الصحيحة بين الخيار الأول والثاني، ولا تجعلها دائماً في نفس المكان.

hint:
تلميح بالعربية يساعد الطالب على التفكير دون كشف الإجابة مباشرة.

successMsg:
رسالة قصيرة بالعربية تشرح للطالب لماذا إجابته صحيحة.
` : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ الاختبار
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

أنشئ من 5 إلى 10 أسئلة فقط حسب حجم الدرس:
- درس صغير: حوالي 5 أسئلة.
- درس متوسط: 6 إلى 8 أسئلة.
- درس كبير وشامل: 9 إلى 10 أسئلة.
- الحد الأقصى 10 أسئلة.

يجب أن تغطي الأسئلة أجزاء مختلفة من الدرس، ولا تكرر نفس المعلومة.

اجعل الأسئلة متنوعة، حسب طبيعة المادة:
- تذكر المعلومات.
- الفهم.
- التطبيق.
- التعليل.
- المقارنة.
- السبب والنتيجة.
- التفاصيل.
- التمييز بين المفاهيم.
- القواعد والقوانين.
- الاستنتاج عندما يكون مناسباً.

لا تستخدم نوعاً غير موجود أو غير مناسب للدرس.

السؤال باللغة العربية.
qTranslation يجب أن يكون "".

كل سؤال يحتوي على خيارين فقط.
لا تستخدم ثلاثة خيارات.

correctIndex يجب أن يكون:
0 أو 1 فقط.

وزّع الإجابات الصحيحة بين الخيار الأول والثاني، ولا تجعلها دائماً في نفس المكان.

hint:
تلميح ذكي بالعربية يساعد الطالب دون كشف الإجابة مباشرة.

successMsg:
رسالة قصيرة بالعربية تشرح لماذا الإجابة صحيحة.
`;

  return basePrompt + englishPrompt + quizPrompt + `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ طريقة بناء المحتوى
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"intro":
ترحيب قصير ومحفز.

"dialogue":
أنشئ حواراً تعليمياً حقيقياً بين tutor و student.
يجب أن يكون الحوار هو الجزء الرئيسي من التعليم.

اجعل tutor يشرح، ثم يسأل أو يتحقق من فهم الطالب، ثم ينتقل إلى النقطة التالية.

⚠️ مهم جداً:
لا تجعل dialogue قصيراً.
طول الشرح يجب أن يتناسب مع حجم الدرس.
الدرس الطويل يحتاج شرحاً طويلاً يغطي جميع أجزائه.

"flashcards":
استخرج أهم الكلمات والمصطلحات من الدرس.
اجعل العدد مناسباً لحجم الدرس، ولا تلتزم بعدد ثابت إذا كان ذلك سيؤدي إلى حذف كلمات مهمة.
يمكن أن تكون من 8 إلى 15 بطاقة عند الحاجة.

"faqs":
أنشئ من 5 إلى 10 أسئلة شائعة قد يسألها الطالب حول الدرس، مع إجابات واضحة.

"formativeQuiz":
أنشئ 5 إلى 10 أسئلة فقط، وفق التعليمات السابقة.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ فحص نهائي قبل إخراج JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

قبل إرسال الإجابة، تحقق داخلياً من الآتي:

1. هل غطيت جميع أجزاء الدرس المهمة؟
2. هل شرحت الأفكار الرئيسية والفرعية؟
3. هل شرحت القواعد والمصطلحات والأمثلة الموجودة؟
4. هل تجاهلت أي جزء مهم من النص؟
5. هل الأسئلة تغطي أجزاء مختلفة من الدرس؟
6. هل عدد الأسئلة بين 5 و10؟
7. هل لكل سؤال خياران فقط؟
8. هل correctIndex يساوي 0 أو 1؟
9. هل لا توجد معلومات مختلقة؟
10. هل الإجابة النهائية JSON فقط؟

أخرج JSON صالحاً فقط، بدون Markdown أو شرح خارج JSON.
`;
}

/* ─── قالب HTML للملف التفاعلي الذي سيصدر للطالب ─── */
function buildInteractiveTutorHtml(tutorData, title, meta, appFont) {
  const jsonString = JSON.stringify(tutorData);
  const teacherName = meta.teacher ? `أ. ${meta.teacher}` : '';
  const subjectName = meta.subject || '';
  const gradeName = meta.grade || '';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>معلمك التفاعلي - \${esc(title)}</title>
    <style>
        @font-face { font-family: 'AlMohanad'; src: url('fonts/AlMohanad.ttf') format('truetype'); }
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Amiri:wght@400;700&display=swap');
        
        body { font-family: ${appFont}, 'Cairo', sans-serif; background: #e2e8f0; margin: 0; padding: 10px; color: #1e293b; padding-bottom: 80px; }
        * { box-sizing: border-box; }
        
        .main-wrapper { background: #f8fafc; border: 4px double #4f46e5; border-radius: 20px; overflow: hidden; min-height: 90vh; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        
        .header { background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; padding: 25px 20px 15px; text-align: center; border-bottom: 3px solid #312e81; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; text-shadow: 1px 1px 2px rgba(0,0,0,0.3); }
        .header p.lesson-title { margin: 8px 0 0; font-size: 16px; font-weight: bold; color: #fef08a; }
        
        .meta-bar { display: flex; justify-content: space-around; background: #312e81; color: #e2e8f0; padding: 8px; font-size: 12px; font-weight: bold; border-bottom-left-radius: 15px; border-bottom-right-radius: 15px; margin-bottom: 10px; }
        
        .bottom-nav { position: fixed; bottom: 0; left: 0; width: 100%; background: white; box-shadow: 0 -4px 15px rgba(0,0,0,0.1); display: flex; justify-content: space-around; padding: 10px 5px; z-index: 1000; border-top: 3px solid #4f46e5; border-top-left-radius: 20px; border-top-right-radius: 20px; }
        .nav-item { flex: 1; text-align: center; background: none; border: none; color: #64748b; font-family: inherit; font-size: 13px; font-weight: bold; cursor: pointer; padding: 8px 0; border-radius: 12px; transition: 0.3s; }
        .nav-item.active { color: #ffffff; background: #4f46e5; box-shadow: 0 4px 10px rgba(79,70,229,0.3); }
        .nav-icon { display: block; font-size: 22px; margin-bottom: 4px; }
        
        .tab-content { display: none; padding: 15px; animation: fadeIn 0.4s ease; }
        .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        
        .chat-bubble { max-width: 90%; padding: 14px 18px; border-radius: 18px; margin-bottom: 18px; font-size: 16px; line-height: 1.8; position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .chat-tutor { background: #e0e7ff; color: #1e3a8a; border-bottom-right-radius: 4px; margin-right: 0; margin-left: auto; border: 1.5px solid #c7d2fe; border-right: 4px solid #4f46e5; }
        .chat-student { background: #ffffff; color: #334155; border-bottom-left-radius: 4px; margin-left: 0; margin-right: auto; border: 1.5px solid #e2e8f0; border-left: 4px solid #94a3b8; }
        .speaker-name { font-size: 12px; font-weight: 900; margin-bottom: 6px; opacity: 0.8; color: #db2777; }
        
        .flashcard { background: white; border: 2px solid #cbd5e1; border-right: 6px solid #db2777; border-radius: 15px; padding: 25px; text-align: center; margin-bottom: 15px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .fc-term { font-size: 20px; font-weight: 900; color: #1e293b; direction: ltr; display: inline-block; }
        .fc-def { display: none; font-size: 16px; color: #0f766e; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #cbd5e1; font-weight: bold; }
        .fc-hint { font-size: 12px; color: #64748b; margin-top: 12px; background: #f1f5f9; display: inline-block; padding: 4px 10px; border-radius: 20px; }
        
        .quiz-card { background: white; border-radius: 15px; padding: 20px; margin-bottom: 20px; border: 2px solid #e2e8f0; border-top: 5px solid #059669; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .quiz-q { font-size: 18px; font-weight: 900; margin-top: 0; margin-bottom: 10px; color: #0f172a; direction: ltr; text-align: left; }
        .btn-translate { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; font-family: inherit; cursor: pointer; margin-bottom: 15px; display: inline-flex; align-items: center; gap: 4px; }
        .quiz-q-ar { display: none; color: #059669; font-size: 15px; font-weight: bold; margin-bottom: 15px; background: #ecfdf5; padding: 8px; border-radius: 8px; border-right: 3px solid #10b981; }
        
        .quiz-opt { display: block; width: 100%; text-align: left; direction: ltr; padding: 14px 15px; margin-bottom: 10px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 15px; font-weight: bold; color: #334155; cursor: pointer; transition: 0.2s; }
        .quiz-opt.correct { background: #dcfce7; border-color: #22c55e; color: #166534; pointer-events: none; }
        .quiz-opt.wrong { background: #fee2e2; border-color: #ef4444; color: #991b1b; pointer-events: none; }
        
        .feedback-box { display: none; margin-top: 15px; padding: 15px; border-radius: 10px; font-size: 15px; font-weight: bold; line-height: 1.6; }
        .feedback-hint { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; border-right: 5px solid #f59e0b; }
        .feedback-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-right: 5px solid #22c55e; }
        
        .faq-item { background: white; border-radius: 12px; margin-bottom: 12px; border: 2px solid #e2e8f0; border-right: 5px solid #ea580c; }
        .faq-q { padding: 15px; font-weight: 900; color: #1e293b; background: #f8fafc; margin: 0; cursor: pointer; border-radius: 10px; font-size: 15px; }
        .faq-a { padding: 15px; color: #334155; font-size: 15px; line-height: 1.8; border-top: 1px solid #e2e8f0; display: none; font-weight: bold; }
        
        .tts-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background-color: #dbeafe; color: #1d4ed8; border: 2px solid #93c5fd; cursor: pointer; font-size: 16px; margin: 0 8px; vertical-align: middle; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .tts-btn:active { transform: scale(0.9); background-color: #bfdbfe; }
    </style>
</head>
<body>

<div class="main-wrapper">
    <div class="header">
        <h1>👨‍🏫 معلمك التفاعلي</h1>
        <p class="lesson-title">${esc(title)}</p>
    </div>
    <div class="meta-bar">
        <span>🏫 ${esc(gradeName)}</span>
        <span>📚 ${esc(subjectName)}</span>
        <span>${esc(teacherName)}</span>
    </div>

    <div id="tab-learn" class="tab-content active"></div>
    <div id="tab-flashcards" class="tab-content"><h3 style="margin-top:0; color:#db2777; text-align:center;">اضغط على البطاقة لقلبها</h3></div>
    <div id="tab-quiz" class="tab-content"><h3 style="margin-top:0; color:#059669; text-align:center;">اختبر فهمك خطوة بخطوة</h3></div>
    <div id="tab-faq" class="tab-content"><h3 style="margin-top:0; color:#ea580c; text-align:center;">أسئلة شائعة وإجاباتها</h3></div>
</div>

<div class="bottom-nav">
    <button class="nav-item active" onclick="switchTab('learn', this)"><span class="nav-icon">💬</span>الشرح</button>
    <button class="nav-item" onclick="switchTab('flashcards', this)"><span class="nav-icon">🗂️</span>المصطلحات</button>
    <button class="nav-item" onclick="switchTab('quiz', this)"><span class="nav-icon">🎯</span>التقييم</button>
    <button class="nav-item" onclick="switchTab('faq', this)"><span class="nav-icon">💡</span>أسئلة شائعة</button>
</div>

<script>
    const tutorData = ${jsonString};

    function renderAll() {
        let learnHtml = \`<div style="text-align:center; margin-bottom:20px; font-weight:900; font-size:16px; color:#059669; background:#ecfdf5; padding:15px; border-radius:15px; border:2px dashed #34d399;">✨ \${tutorData.intro}</div>\`;
        tutorData.dialogue.forEach(d => {
            const isTutor = d.speaker === 'tutor';
            learnHtml += \`<div class="chat-bubble \${isTutor ? 'chat-tutor' : 'chat-student'}"><div class="speaker-name">\${isTutor ? '👨‍🏫 الأستاذ' : '👤 أنت'}</div><span class="tts-content">\${d.text}</span></div>\`;
        });
        document.getElementById('tab-learn').innerHTML = learnHtml;

        let fcHtml = document.getElementById('tab-flashcards').innerHTML;
        tutorData.flashcards.forEach(fc => {
            fcHtml += \`<div class="flashcard" onclick="this.querySelector('.fc-def').style.display='block'; this.querySelector('.fc-hint').style.display='none';"><div class="fc-term tts-content">\${fc.term}</div><div class="fc-hint">👆 اضغط لرؤية الترجمة والشرح</div><div class="fc-def tts-content">\${fc.definition}</div></div>\`;
        });
        document.getElementById('tab-flashcards').innerHTML = fcHtml;

        let qzHtml = document.getElementById('tab-quiz').innerHTML;
        tutorData.formativeQuiz.forEach((q, qIndex) => {
            let opts = '';
            q.options.forEach((opt, optIndex) => {
                opts += \`<button class="quiz-opt tts-content" onclick="checkAnswer(this, \${optIndex}, \${q.correctIndex}, \${qIndex})">\${opt}</button>\`;
            });
            
            let transBtnHtml = q.qTranslation ? \`<button class="btn-translate" onclick="this.nextElementSibling.style.display='block'; this.style.display='none';">👁️ عجزت عن فهم السؤال؟ (ترجمة)</button><p class="quiz-q-ar">\${q.qTranslation}</p>\` : '';

            qzHtml += \`<div class="quiz-card" id="quiz-\${qIndex}">
                <p class="quiz-q tts-content">\${qIndex + 1}. \${q.question}</p>
                \${transBtnHtml}
                <div class="options-container">\${opts}</div>
                <div class="feedback-box feedback-hint" id="hint-\${qIndex}">💡 <b>تلميح من الأستاذ:</b> <span>\${q.hint}</span></div>
                <div class="feedback-box feedback-success" id="success-\${qIndex}">✅ <b>أحسنت!</b> <span>\${q.successMsg}</span></div>
            </div>\`;
        });
        document.getElementById('tab-quiz').innerHTML = qzHtml;

        let faqHtml = document.getElementById('tab-faq').innerHTML;
        tutorData.faqs.forEach(faq => {
            faqHtml += \`<div class="faq-item"><p class="faq-q tts-content" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'block' ? 'none' : 'block'">❓ \${faq.q}</p><div class="faq-a tts-content">\${faq.a}</div></div>\`;
        });
        document.getElementById('tab-faq').innerHTML = faqHtml;
        
        injectTTSButtons();
    }

    function switchTab(tabId, btn) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
        btn.classList.add('active');
        window.scrollTo(0, 0);
    }

    function checkAnswer(btn, selectedIdx, correctIdx, qIndex) {
        const card = document.getElementById(\`quiz-\${qIndex}\`);
        const hintBox = document.getElementById(\`hint-\${qIndex}\`);
        const successBox = document.getElementById(\`success-\${qIndex}\`);
        
        if (selectedIdx !== correctIdx) {
            btn.classList.add('wrong');
            hintBox.style.display = 'block';
            successBox.style.display = 'none';
        } else {
            card.querySelectorAll('.quiz-opt').forEach(b => b.style.pointerEvents = 'none');
            btn.classList.add('correct');
            hintBox.style.display = 'none';
            successBox.style.display = 'block';
        }
    }

    window.playTTS = function(text, event) {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        setTimeout(function() {
            window.currentUtterance = new SpeechSynthesisUtterance(text);
            window.currentUtterance.lang = 'en-US';
            window.currentUtterance.rate = 0.85;
            window.speechSynthesis.speak(window.currentUtterance);
        }, 100);
    };

    window.injectTTSButtons = function() {
        document.querySelectorAll('.tts-content').forEach(function(el) {
            var text = el.innerText || el.textContent;
            var hasEnglish = /[a-zA-Z]{3,}/.test(text);
            if (hasEnglish && !el.querySelector('.tts-btn')) {
                var btn = document.createElement('button');
                btn.className = 'tts-btn';
                btn.innerHTML = '🔊';
                var engText = text.replace(/[^a-zA-Z0-9\\s.,?!'"]/g, '').trim();
                btn.onclick = function(e) { window.playTTS(engText || text, e); };
                
                if(el.tagName === 'DIV' || el.tagName === 'P') {
                    el.appendChild(btn);
                } else {
                    el.parentNode.insertBefore(btn, el.nextSibling);
                }
            }
        });
    };

    window.onload = renderAll;
<\/script>
</body>
</html>`;
}

/* ─── دالة التوليد المربوطة بالزر ─── */
async function onGenerateInteractiveTutor() {
  const checkedBoxes = document.querySelectorAll('.bank-chk:checked');
  if (checkedBoxes.length === 0) { toast('الرجاء تحديد درس واحد من البنك', 'error'); return; }
  if (checkedBoxes.length > 1) { toast('يرجى تحديد درس واحد فقط للمعلم التفاعلي', 'error'); return; }
  
  if (!state.settings.apiKey) { toast('مفتاح API غير موجود. الرجاء إضافته في الإعدادات.', 'error'); return; }

  showOverlay('جاري تجهيز وتقمص دور المعلم التفاعلي...');
  try {
    const recordId = parseInt(checkedBoxes[0].value);
    const rec = await dbGet(EXTRACTS_STORE, recordId);
    if (!rec) throw new Error('الدرس غير موجود');

    const meta = gatherMeta();
    const content = rec.content;
    const lang = state.settings.defaultLang || 'ar';
    
    // جلب الخط المطبق حالياً في التطبيق
    const appFont = document.documentElement.style.getPropertyValue('--font-doc') || "'Cairo', sans-serif";
    
    const primary = state.settings.defaultModel || 'gemini-3.5-flash';
    const result = await callWithFallback(primary, buildTutorSystem(lang), buildUser(meta, content, lang), TUTOR_SCHEMA);
    
    const tutorData = result.data;
    const htmlContent = buildInteractiveTutorHtml(tutorData, rec.title, meta, appFont);
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, sanitizeFilename('المعلم_التفاعلي_' + rec.title) + '.html');
    
    hideOverlay();
    toast('🎉 تم توليد المعلم التفاعلي بنجاح! شارك الملف مع طلابك.', 'success');
    
    checkedBoxes[0].checked = false;

  } catch (e) {
    hideOverlay();
    handleGenError(e);
  }
}

  const QUIZ_SCHEMA = {
    type:'object',
    properties:{
      mindmap:{ type:'object', properties:{
        branches:{ type:'array', items:{ type:'object', properties:{
          title:{type:'string'},
          points:{type:'array', items:{type:'string'}}
        }, required:['title','points'] } }
      }, required:['branches'] },
      questions:{ type:'array', items:{ type:'object', properties:{
        q:{type:'string'},
        options:{type:'array', items:{type:'string'}},
                correctIndex:{type:'integer'},
        explanation:{type:'string'}
      }, required:['q','options','correctIndex','explanation'] } }

    }, required:['mindmap','questions']
  };
  function buildQuizSystem(lang) {
    if (lang === 'ar') return [
      'أنت معلم خبير تُعِدّ مادتين من محتوى الدرس المُقدَّم: خريطة ذهنية، واختبار تفاعلي شامل.',
      mathRulesBlock(false).trim(),
      '',
      'الخريطة الذهنية (mindmap):',
      '1. غطِّ الدرس كاملاً بعدد الفروع الذي يحتاجه فعلاً (لا تُقيَّد بعدد ثابت) — كل فكرة رئيسية في الدرس يجب أن يكون لها فرع خاص بها.',
      '2. تحت كل فرع، نقاط فرعية قصيرة تغطي كل تفاصيل تلك الفكرة (تعريف، مثال، خطوة، أو أي تفصيل مهم ذُكر في المحتوى) — لا تُسقط تفاصيل لمجرد الإيجاز.',
      '',
      'الاختبار (questions):',
      '1. من 8 إلى 12 سؤال اختيار من متعدد (4 خيارات لكل سؤال)، تغطي محتوى الدرس كاملاً بشمول لا سطحية (تعريفات، فهم، تطبيق).',
      '2. correctIndex هو رقم فهرس الإجابة الصحيحة في مصفوفة options (يبدأ من 0).',
      '3. أضف شرحاً مختصراً (explanation) لكل سؤال يوضّح سبب صحة الإجابة.',
      '4. لا تكرر نفس السؤال أو المعنى بصياغات مختلفة.',
      '',
      'أعد JSON فقط. لا نص خارج JSON.'
    ].join('\n');

    return [
      'You are an expert teacher preparing two study aids from the provided lesson content: a mind map, and a comprehensive interactive quiz.',
      mathRulesBlock(true).trim(),
      '',
      'Mind map:',
      '1. Cover the entire lesson with as many branches as it actually needs (do not force a fixed count) — every main idea in the lesson must get its own branch.',
      '2. Under each branch, short sub-points covering every detail of that idea (definitions, examples, steps, or any important detail mentioned in the content) — do not drop details for brevity, if the subject is in English sentences or phrases must be written in English with translation into Arabic under every sentence or phrases',
      '',
      'Quiz:',
      '1. 8 to 12 multiple-choice questions (4 options each), thoroughly covering the lesson content (definitions, comprehension, application) — not superficial.',
      '2. For English lessons, include dedicated vocabulary and grammar questions where the content includes them and must write Arabic translation for every question.',
      '3. correctIndex is the zero-based index of the correct answer in the options array.',
      '4. Add a short "explanation" for each question clarifying why the answer is correct.',
      '5. Do not repeat the same question or meaning in different wording.',
      '',
      'Return JSON only. No text outside JSON.'
    ].join('\n');
  }

  const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
  const TTS_VOICE = 'Kore';
  const AUDIO_SCRIPT_SCHEMA = {
    type:'object', properties:{ script:{type:'string'} }, required:['script']
  };
  const BOARD_SECTION_SCHEMA = {
    type:'object', properties:{
      title:{type:'string'},
      items:{type:'array', items:{type:'string'}},
      tableHeaders:{type:'array', items:{type:'string'}},
      tableRows:{type:'array', items:{type:'array', items:{type:'string'}}}
    }, required:['title']
  };
  const BOARD_SCHEMA = {
    type:'object', properties:{
      sections:{ type:'array', items: BOARD_SECTION_SCHEMA }
    }, required:['sections']
  };

  /* ─── الخريطة الذهنية (Mermaid) ─── */
  // 💡 دعم شجري عميق حتى 4 مستويات (أحفاد)
  const MINDMAP_L4_SCHEMA = { type:'object', properties:{ title:{type:'string'} }, required:['title'] };
  const MINDMAP_L3_SCHEMA = { type:'object', properties:{ title:{type:'string'}, children:{type:'array', items:MINDMAP_L4_SCHEMA} }, required:['title'] };
  const MINDMAP_L2_SCHEMA = { type:'object', properties:{ title:{type:'string'}, children:{type:'array', items:MINDMAP_L3_SCHEMA} }, required:['title'] };
  const MINDMAP_BRANCH_SCHEMA = { type:'object', properties:{ title:{type:'string'}, children:{type:'array', items:MINDMAP_L2_SCHEMA} }, required:['title'] };
  const MINDMAP_SCHEMA = {
    type:'object', properties:{
      root:{type:'string'},
      branches:{ type:'array', items:MINDMAP_BRANCH_SCHEMA }
    }, required:['root','branches']
  };

    function buildMindmapSystem(lang) {
    if (lang === 'ar') return [
      'أنت خبير في تحليل المحتوى التعليمي وتلخيصه بصريًا في خريطة ذهنية واضحة ومترابطة.',
      'مهمتك: افحص محتوى الدرس، واستخرج منه المحاور الرئيسية وتفرعاتها حتى 4 مستويات من التفصيل.',
      '',
      'قواعد البناء:',
      '1. "root": عنوان الدرس نفسه (مختصر).',
      '2. "branches": المحاور الرئيسية الكبرى للدرس.',
      '3. "children": يمكنك التفرع بداخل كل محور إلى أبناء، ثم أحفاد، وحتى 4 مستويات عمق لتغطية التفاصيل المهمة والتقسيمات الدقيقة.',
      '4. يجب أن يكون عنوان كل عقدة عبارة قصيرة جدًا وواضحة (٢ إلى ٥ كلمات كحد أقصى).',
      '5. حافظ على نفس لغة المحتوى تمامًا في العناوين.',
      '6. أعد النتيجة كـ JSON فقط حسب المخطط المطلوب — بلا أي نص خارج JSON.'
    ].join('\n');
    return [
      'You are an expert at analyzing educational content and summarizing it into a deep, structured mind map.',
      'Task: examine the lesson content and extract its main themes and branches up to 4 levels of depth.',
      '',
      'Rules:',
      '1. "root": the lesson title (short).',
      '2. "branches": the main themes of the lesson.',
      '3. "children": you can nest sub-points up to 4 levels deep to capture important details and classifications.',
      '4. Every node title must be a very short phrase (2 to 5 words max).',
      '5. Return JSON only, per the required schema — no text outside JSON.'
    ].join('\n');
  }

  const PPTX_SLIDE_SCHEMA = {
    type:'object', properties:{
      title:{type:'string'},
      bullets:{type:'array', items:{type:'string'}},
      tableHeaders:{type:'array', items:{type:'string'}},
      tableRows:{type:'array', items:{type:'array', items:{type:'string'}}},
      notes:{type:'string'}
    }, required:['title']
  };
  const PPTX_SCHEMA = {
    type:'object', properties:{
      slides:{ type:'array', items: PPTX_SLIDE_SCHEMA }
    }, required:['slides']
  };
  const ENGLISH_PPP_SCHEMA = {
    type:'object', properties:{
      strategies:{type:'array',items:{type:'string'}},
      resources: {type:'array',items:{type:'string'}},
      aims:      {type:'array',items:{type:'string'}},
      warmUp:        stageObj(), presentation: stageObj(),
      practice:      stageObj(), production:   stageObj(), consolidation: stageObj(),
      homeAssignment:{type:'string'}, evaluation:{type:'array',items:{type:'string'}}
    }, required:['aims','warmUp','presentation','practice','production','consolidation','homeAssignment','evaluation']
  };

  /* ─── Prompts — عملية، من المحتوى، لغة بسيطة ─── */
  function buildSystem(lang) {
    if (lang === 'ar') return [
      'أنت معلم خبير تُعدّ خطط دروس يومية احترافية لمعلمي المدارس اليمنية.',
      '',
      'المهمة:',
      'أنشئ خطة درس عملية ومفصلة اعتماداً على محتوى الدرس وبيانات الحصة المقدمة.',
      '',
      'القواعد الأساسية:',
      '1. اعتمد على محتوى الدرس المقدم مباشرة، واستخرج منه الأمثلة والأفكار والمهارات ذات الصلة.',
      '2. صغ أهدافاً سلوكية قابلة للملاحظة والقياس، واربِطها مباشرة بمحتوى الدرس.',
      '3. يجب أن تحتوي الخطة على المراحل الخمس بالترتيب نفسه تماماً: التمهيد، عرض الدرس، التدريب الموجّه، التدريب المستقل، التقويم والختام.',
      '4. لا تغيّر أسماء المراحل ولا تضف مرحلة سادسة ولا تحذف أي مرحلة.',
      '5. في كل مرحلة: اكتب الزمن، والأهداف المناسبة، ودور المعلم بالتفصيل، ودور الطالب بالتفصيل، والتقويم أو المهمة المناسبة.',
      '6. دور المعلم يجب أن يكون عملياً: ماذا يقول، ماذا يسأل، ماذا يكتب على السبورة، كيف يشرح، وكيف ينتقل إلى الخطوة التالية.',
      '7. دور الطالب يجب أن يكون عملياً: ماذا يقرأ، ماذا يكتب، ماذا يناقش، ماذا يحل، وما الناتج المتوقع منه.',
      '8. التقويم يجب أن يكون سؤالاً أو مهمة جاهزة للتطبيق داخل الصف ومرتبطة بالمرحلة ومحتوى الدرس.',
      '9. استخدم لغة عربية واضحة وبسيطة ومناسبة للصف الدراسي، وتجنب المصطلحات التربوية غير الضرورية.',
      '10. إذا كانت وسائل تعليمية متاحة مذكورة في بيانات الحصة، استخدمها فعلياً في خطوات المعلم. لا تفترض توفر أي وسيلة غير مذكورة.',
      '11. ضع واجباً منزلياً واحداً محدداً ومرتبطاً مباشرة بالدرس.',
      '12. ضع نشاطاً إثرائياً مناسباً ومرتبطاً بمحتوى الدرس.',
      '13. لا تختصر التفاصيل المهمة من أجل تقليل طول الخطة.',
      '',
      'ترتيب المراحل الإلزامي:',
      ...ARABIC_STEPS.map((step, i) => `${i + 1}. ${step}`),
      '',
      'الإخراج:',
      'أعد JSON فقط وفق ARABIC_SCHEMA.',
      'يجب أن تكون rows خمسة عناصر بالضبط، عنصر واحد لكل مرحلة وبالترتيب المحدد أعلاه.',
      'لا تكتب أي نص خارج JSON.'
    ].join('\n');

    return [
      'You are an experienced English teacher writing lesson plans for Yemeni secondary school teachers.',
      '',
      'Rules:',
      '1. Build everything directly from the provided content — use real examples from it.',
      '2. Aims: "Students will be able to [specific skill from lesson content]."',
      '3. Teacher role: Write **detailed, step-by-step** actions for every stage (warm-up, presentation, practice, production, consolidation) — exactly what the teacher writes on the board, exactly what they ask, how they explain, when they move to the next point.',
      '4. Student role: With the same level of detail, write exactly what students DO at every stage: what they read, what they write, who they discuss with, what output is expected from them.',
      '5. Evaluation: Write a ready-to-use question or task, e.g. "Ask: Who can explain...?"',
      '6. Home assignment: One clear task tied directly to the lesson.',
      '7. Use simple, clear, practical language. Avoid complex teaching jargon.',
      '8. Keep the plan detailed yet suitable to fit one A4 page — do not cut important detail just to save space.',
      '9. If available resources are listed, tie teacher steps to them explicitly (e.g. "Show the picture on the screen" only if a screen is available), and never assume a resource that was not listed.',
      '',
      'Return JSON only. No text outside JSON.'
    ].join('\n');
  }

  function buildAudioScriptSystem(lang) {
    if (lang === 'ar') return [
      'أنت معلم خبير ومذيع محتوى تعليمي، تكتب نص درس صوتي (سكربت) يُقرأ بصوت عالٍ لمدة 7 دقائق تقريباً.',
      '',
      'القواعد الأساسية:',
      '1. اكتب نصاً متصلاً ومشوّقاً بأسلوب حديث/حواري مباشر للطالب، وليس نصاً أكاديمياً جافاً.',
      '2. ابدأ بمقدمة قصيرة تجذب الانتباه (سؤال أو موقف)، ثم اشرح الأفكار الرئيسية بالترتيب المنطقي مع أمثلة من المحتوى، ثم اختم بخلاصة سريعة.',
      '3. استخدم جملاً قصيرة وواضحة تصلح للنطق الصوتي، وتجنّب الرموز أو القوائم أو أي تنسيق كتابي (لا عناوين، لا نجوم، لا رموز).',
      '4. الطول المستهدف: بين 750 و850 كلمة تقريباً (يقابل حوالي 5 دقائق قراءة بصوت طبيعي).',
      '5. اعتمد على محتوى الدرس المُقدَّم فعلياً ولا تختلق معلومات غير موجودة فيه.',
      '',
      'أعد النص كاملاً داخل الحقل script فقط، بدون أي تعليق خارج JSON.'
    ].join('\n');

    return [
      'You are an expert teacher and educational content narrator, writing an audio lesson script meant to be read aloud for about 7 minutes.',
      '',
      'Rules:',
      '1. Write a single flowing, engaging script in a warm conversational tone directly addressing the student — not a dry academic text.',
      '2. Start with a short attention-grabbing hook (a question or scenario), explain the main ideas in logical order with real examples from the content, then close with a quick recap.',
      '3. Use short, clear sentences suitable for speech synthesis. No headers, bullet points, symbols, or markdown formatting of any kind.',
      '4. Target length: 750 to 850 words (roughly 5 minutes at a natural speaking pace).',
      '5. Base everything strictly on the provided lesson content — do not invent facts not present in it.',
      '',
      'Return the full text only inside the "script" field, no text outside JSON.'
    ].join('\n');
  }

  function buildBoardSystem(lang) {
    if (lang === 'ar') return [
      'أنت معلم خبير تكتب على سبورة الصف ملخصاً شاملاً وافياً للدرس بالكامل، لا نقاطاً مبتورة سطحية.',
      '',
      'القواعد الأساسية:',
      '1. نظّم الملخص إلى أقسام مرقّمة (بالعدد الذي يحتاجه الدرس فعلاً، لا تُقيَّد بعدد ثابت)، كل قسم بعنوان واضح يغطي فكرة رئيسية كاملة من الدرس.',
      '2. غطِّ كل تعريف ومفهوم وقاعدة وخطوة موجودة في المحتوى المُقدَّم — لا تختصر أو تُسقط أفكاراً مهمة لمجرد الإيجاز، فالهدف ملخص شامل واف يغني الطالب عن الرجوع للمصدر الأصلي.',
      '3. كل قسم إمّا: (أ) قائمة نقاط واضحة ومكتملة المعنى (وليست شديدة الاختصار)، أو (ب) جدول عندما يكون المحتوى مقارنة طبيعية بين شيئين (تعريف/سبب/أمثلة، أو مقارنة بين مصطلحين).',
      '4. اذكر أمثلة حقيقية من المحتوى المُقدَّم نفسه في كل قسم مناسب.',
      '5. استخدم لغة واضحة تناسب مستوى الطلاب، لكن دون التضحية بالشمول والدقة العلمية.',
      '6. ' + mathRulesBlock(false).trim().replace(/\n/g, ' '),
      '',
      'أعد JSON فقط. لا نص خارج JSON.'
    ].join('\n');

    return [
      'You are an expert teacher writing a comprehensive, thorough whiteboard summary of the entire lesson — not a shallow, truncated outline.',
      '',
      'Rules:',
      '1. Organize the summary into numbered sections (as many as the lesson actually needs — do not force a fixed count), each with a clear title covering one complete main idea from the lesson.',
      '2. Cover every definition, concept, rule, and step present in the provided content — do not drop important ideas for the sake of brevity. The goal is a thorough summary that can stand in for the original source.',
      '3. Each section is EITHER: (a) a list of clear, fully-formed bullet points (not overly terse fragments), OR (b) a table when the content is naturally a comparison (definition/cause/examples, or comparing two terms).',
      '4. Include a dedicated "Vocabulary" section: every important new word or phrase from the lesson content, each with its Arabic translation, as a table with two columns (Word/Phrase — Translation), English sentences or phrases must be written in English with translation into Arabic under every sentence.',
      '5. If the lesson content includes any grammar rule, structure, or pattern, include a dedicated "Grammar" section explaining the rule clearly with at least one real example sentence from the content (or a natural example if none is given), using a bullet list or a short table (Structure — Example) as fits best.',
      '6. Use clear language appropriate for students, without sacrificing thoroughness or accuracy.',
      '7. ' + mathRulesBlock(true).trim().replace(/\n/g, ' '),
      '',
      'Return JSON only. No text outside JSON.'
    ].join('\n');
  }

  /* ─── تكييف محتوى السبورة لشرائح عرض تقديمي (PPTX) ─── */
  function buildPptxSystem(lang) {
    if (lang === 'ar') return [
      'أنت خبير تصميم عروض تقديمية (PowerPoint) تعليمية لطلاب المدارس.',
      'مهمتك: تحويل محتوى سبورة درسية (أقسام، كل قسم له عنوان ونقاط وربما جدول) إلى شرائح عرض واضحة تُقرأ بسهولة من آخر الفصل.',
      '',
      'قواعد إلزامية:',
      '1. حوّل كل نقطة إلى عبارة قصيرة جدًا (من ٣ إلى ٨ كلمات) بدل الجملة الكاملة — نفس الفكرة لكن بأقل كلمات ممكنة، بلا حذف للمعنى الجوهري.',
      '2. لا تُضِف أي معلومة غير موجودة في المصدر، ولا تحذف فكرة أو نقطة مهمة وردت فيه.',
      '3. الحد الأقصى ٦ نقاط في كل شريحة. لو القسم يحتوي أكثر من ٦ نقاط، قسّمه على أكثر من شريحة بنفس العنوان (أضف " (تابع)" لعنوان الشريحة الثانية وما بعدها من نفس القسم).',
      '4. لو القسم يحوي جدولاً، أبقه في شريحة مستقلة بنفس الأعمدة والصفوف تقريبًا، لكن اختصر نص أي خلية طويلة.',
      '5. لكل شريحة، اكتب أيضًا حقل "notes" يحتوي على الشرح الكامل الموسّع لنفس نقاط هذه الشريحة تحديدًا — فقرة متصلة بأسلوب المعلم الشارح شفهيًا للطلاب (٤ إلى ٨ جمل)، تفصّل كل نقطة من نقاط الشريحة بأمثلة وتوضيح كامل من المحتوى الأصلي، لتكون بمثابة "ملاحظات المتحدث" التي يقرأها المعلم أثناء العرض دون أن تظهر على الشريحة نفسها.',
      '6. حافظ تمامًا على نفس لغة المحتوى المُدخل.',
      '7. أعد النتيجة كـ JSON فقط حسب المخطط المطلوب — بلا أي نص خارج JSON.'
    ].join('\n');
    return [
      'You are an expert instructional presentation (PowerPoint) designer for school students.',
      'Task: convert a lesson whiteboard (sections, each with a title, bullet items, and possibly a table) into clear slides that are easy to read from the back of a classroom.',
      '',
      'Mandatory rules:',
      '1. Turn every point into a very short phrase (3 to 8 words) instead of a full sentence — same idea, fewest words possible, without losing the core meaning.',
      '2. Never add information not present in the source, and never drop an important point that appeared in it.',
      '3. Maximum 6 bullets per slide. If a section has more than 6, split it across multiple slides with the same title (append " (cont.)" to the title from the second slide of that section onward).',
      '4. If a section has a table, keep it on its own slide with roughly the same columns and rows, but shorten any long cell text.',
      '5. For every slide, also write a "notes" field containing the full expanded explanation of that exact slide\'s points — a flowing paragraph in the teacher\'s spoken voice (4 to 8 sentences), unpacking each bullet with detail and examples drawn from the original content, meant to be read as speaker notes during the presentation without appearing on the slide itself.',
      '6. Keep the exact same language as the input content.',
      '7. Return the result as JSON only, per the required schema — no text outside JSON.'
    ].join('\n');
  }
  function buildPptxUser(sections, title, lang) {
    const header = lang === 'ar'
      ? `عنوان الدرس: ${title || ''}\nحوّل أقسام السبورة التالية إلى شرائح عرض تقديمي الآن، كـ JSON فقط:\n`
      : `Lesson title: ${title || ''}\nConvert the following whiteboard sections into presentation slides now, as JSON only:\n`;
    return header + JSON.stringify(sections);
  }

  function buildUser(meta, contentText, lang) {
    if (lang !== 'ar') {
      const lines = [
        'Lesson info:',
        `- Subject: ${meta.subject || 'English'}`,
        `- Grade: ${meta.grade || 'Not specified'}${meta.section ? ' / Section: ' + meta.section : ''}`,
        `- Lesson title: ${meta.title || 'Not specified'}`,
        `- Period: ${meta.period || 'Not specified'}`
      ];
      if (Array.isArray(meta.availableResources) && meta.availableResources.length) {
        lines.push(`- Teaching resources actually available: ${meta.availableResources.join(', ')} — only use these in the teacher steps, do not assume any other resource is available.`);
      }
      lines.push(contentText
        ? '\nLesson content:\n' + contentText
        : '\nNo content — use the title only.');
      lines.push('\nGenerate the plan now as JSON only.');
      return lines.join('\n');
    }

    const lines = [
      'أنشئ خطة درس يومية مدرسية احترافية.',
      '',
      'بيانات الحصة:',
      `- المادة: ${meta.subject || 'غير محددة'}`,
      `- الصف: ${meta.grade || 'غير محدد'}${meta.section ? ' / الشعبة: ' + meta.section : ''}`,
      `- عنوان الدرس: ${meta.title || 'غير محدد'}`,
      `- الحصة: ${meta.period || 'غير محددة'}`
    ];

    if (Array.isArray(meta.availableResources) && meta.availableResources.length) {
      lines.push(
        '- الوسائل التعليمية المتاحة فعلياً للمعلم: ' + meta.availableResources.join('، '),
        '- استخدم هذه الوسائل فقط في خطوات المعلم، ولا تفترض توفر أي وسيلة أخرى.'
      );
    } else {
      lines.push('- لا توجد وسائل تعليمية محددة في بيانات الحصة؛ لا تفترض توفر وسيلة إضافية.');
    }

    lines.push(
      '',
      'محتوى الدرس:',
      contentText && contentText.trim()
        ? contentText.trim()
        : 'لا يوجد محتوى نصي إضافي؛ اعتمد على عنوان الدرس والبيانات المتاحة.',
      '',
      'تذكير إلزامي: أنشئ المراحل الخمس بالترتيب التالي دون تغيير:',
      ...ARABIC_STEPS.map((step, i) => `${i + 1}. ${step}`),
      '',
      'أعد JSON فقط.'
    );

    return lines.join('\n');
  }

  /* ─── Gemini API ─── */
  async function callGemini(model, sysText, userText, schema) {
    const key = state.settings.apiKey;
    if (!key) { const e = new Error('NO_KEY'); e.code = 'NO_KEY'; throw e; }
    const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(key)}`;
    const genCfg = { temperature: schema ? 0.5 : 0.3, responseMimeType: 'application/json' };
    if (schema) genCfg.responseSchema = schema;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{role:'user',parts:[{text:userText}]}], systemInstruction:{parts:[{text:sysText}]}, generationConfig:genCfg })
      });
    } catch (e) { const err = new Error('NETWORK'); err.code = 'NETWORK'; throw err; }
    if (!res.ok) {
      const c = (res.status===403||res.status===400)?'BAD_KEY':res.status===429?'RATE_LIMIT':res.status>=500?'SERVER':'HTTP_'+res.status;
      const e = new Error(c); e.code = c; throw e;
    }
    const json = await res.json();
    const raw  = (json.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
    if (!raw) { const e = new Error('EMPTY'); e.code = 'EMPTY'; throw e; }
    try { return JSON.parse(raw.replace(/^```json\s*/i,'').replace(/^```/,'').replace(/```\s*$/,'')); }
    catch (e2) { const e = new Error('BAD_JSON'); e.code = 'BAD_JSON'; throw e; }
  }
  async function callWithFallback(primary, sysText, userText, schema) {
    try { const d = await callGemini(primary, sysText, userText, schema); return { data:d, model:primary }; }
    catch (e0) {
      if (['NO_KEY','BAD_KEY','NETWORK'].includes(e0.code)) throw e0;
      const idx = FALLBACK_CHAIN.indexOf(primary);
      const cands = idx===-1 ? [...FALLBACK_CHAIN] : [...FALLBACK_CHAIN.slice(idx+1), ...FALLBACK_CHAIN.slice(0,idx)];
      let last = e0;
      for (const m of cands) {
        if (m === primary) continue;
        try { showOverlay(`جاري المحاولة بنموذج بديل...\n${m}`); const d = await callGemini(m, sysText, userText, schema); return {data:d, model:m}; }
        catch (en) { if (['NO_KEY','BAD_KEY','NETWORK'].includes(en.code)) throw en; last = en; }
      }
      throw last;
    }
  }
  function handleGenError(err) {
    const msgs = { NO_KEY:'أدخل مفتاح API من الإعدادات.', BAD_KEY:'مفتاح API غير صحيح.', RATE_LIMIT:'تجاوز حد الطلبات، انتظر دقيقة.', SERVER:'خطأ في السيرفر.', NETWORK:'لا يوجد اتصال بالإنترنت.', EMPTY:'لا توجد استجابة.', BAD_JSON:'تعذر فهم الاستجابة.' };
    toast(msgs[err?.code] || 'خطأ غير متوقع.', 'error');
  }

  /* ─── Text-to-Speech — الدرس الصوتي ─── */
  async function generateSpeechChunk(text, model) {
    const key = state.settings.apiKey;
    if (!key) { const e = new Error('NO_KEY'); e.code = 'NO_KEY'; throw e; }
    const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } }
      }
    };
    let res;
    try { res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); }
    catch (e) { const err = new Error('NETWORK'); err.code = 'NETWORK'; throw err; }
    if (!res.ok) {
      const c = (res.status===403||res.status===400)?'BAD_KEY':res.status===429?'RATE_LIMIT':res.status>=500?'SERVER':'HTTP_'+res.status;
      const e = new Error(c); e.code = c; throw e;
    }
    const json = await res.json();
    const part = (json.candidates?.[0]?.content?.parts || []).find(p => p.inlineData?.data);
    if (!part) { const e = new Error('EMPTY'); e.code = 'EMPTY'; throw e; }
    return part.inlineData.data; // base64 PCM خام
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  // إعادة محاولة تلقائية للجزء الفاشل فقط (وليس الدرس كاملاً) — أكثر ضماناً
  async function generateSpeechChunkWithRetry(text, model, tries, onWait) {
    let lastErr;
    for (let i = 0; i < tries; i++) {
      try { return await generateSpeechChunk(text, model); }
      catch (e) {
        lastErr = e;
        if (['NO_KEY','BAD_KEY'].includes(e.code)) throw e;
        if (i < tries - 1 && e.code === 'RATE_LIMIT') { onWait?.(); await wait(20000); }
      }
    }
    throw lastErr;
  }
  // تقسيم السكربت لثلاثة أجزاء منطقية (يحافظ على جودة الصوت حسب توصية Google للنصوص الطويلة)
  function splitScriptIntoChunks(script, parts) {
    const pieces = script.split(/([.!؟?]+\s+)/);
    const sentences = [];
    for (let i = 0; i < pieces.length; i += 2) {
      const s = (pieces[i] || '') + (pieces[i+1] || '');
      if (s.trim()) sentences.push(s);
    }
    if (!sentences.length) return [script];
    const target = Math.ceil(script.length / parts);
    const chunks = []; let cur = '';
    for (const s of sentences) {
      if (cur.length && cur.length + s.length > target) { chunks.push(cur.trim()); cur = ''; }
      cur += s;
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks;
  }
  function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function concatBytes(arrays) {
    const total = arrays.reduce((s,a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) { out.set(a, offset); offset += a.length; }
    return out;
  }
  // تغليف بيانات PCM الخام (24kHz / 16-bit / أحادي — مخرجات Gemini TTS) بترويسة WAV قياسية
  function pcmToWavBlob(pcmBytes, sampleRate, channels, bitDepth) {
    const bytesPerSample = bitDepth / 8, blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign, dataSize = pcmBytes.length;
    const buffer = new ArrayBuffer(44 + dataSize), view = new DataView(buffer);
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off+i, str.charCodeAt(i)); };
    writeStr(0,'RIFF'); view.setUint32(4, 36+dataSize, true); writeStr(8,'WAVE');
    writeStr(12,'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, channels, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true); view.setUint16(34, bitDepth, true);
    writeStr(36,'data'); view.setUint32(40, dataSize, true);
    new Uint8Array(buffer, 44).set(pcmBytes);
    return new Blob([buffer], { type:'audio/wav' });
  }
  async function synthesizeScriptToWav(script, onProgress, onWait) {
    const chunks = splitScriptIntoChunks(script, 3);
    const pcmParts = [];
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.(i+1, chunks.length);
      const b64 = await generateSpeechChunkWithRetry(chunks[i], TTS_MODEL, 2, onWait);
      pcmParts.push(base64ToBytes(b64));
    }
    return pcmToWavBlob(concatBytes(pcmParts), 24000, 1, 16);
  }
  // ضغط WAV الخام إلى صيغة مضغوطة فعلياً (Opus/AAC حسب دعم الجهاز) عبر تشغيله وتسجيله داخلياً
  // بدون أي مكتبة خارجية — يقلّل الحجم من ~13 ميجا إلى ~1-1.5 ميجا لنفس المدة تقريباً
  // تحميل مكتبة ترميز MP3 خفيفة (~30 كيلوبايت) عند الحاجة فقط — مرة واحدة لكل جلسة
  let lamejsLoading = null;
  function loadLamejs() {
    if (window.lamejs) return Promise.resolve(window.lamejs);
    if (lamejsLoading) return lamejsLoading;
    lamejsLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js';
      s.onload = () => window.lamejs ? resolve(window.lamejs) : reject(new Error('lamejs_missing'));
      s.onerror = () => reject(new Error('lamejs_load_fail'));
      document.head.appendChild(s);
    });
    return lamejsLoading;
  }
  // ترميز PCM خام إلى MP3 حقيقي عبر مكتابة ترميز فعلية — يستغرق ثوانٍ معدودة
  // بغض النظر عن طول الصوت (بخلاف طريقة "التشغيل والتسجيل بالزمن الحقيقي" السابقة)
  async function compressAudioBlob(wavBlob) {
    try {
      const lamejs = await loadLamejs();
      const arrayBuf = await wavBlob.arrayBuffer();
      // بيانات PCM الخام تبدأ بعد ترويسة WAV القياسية (44 بايت) — 16-بت / أحادي / 24kHz
      const samples = new Int16Array(arrayBuf, 44);
      const encoder = new lamejs.Mp3Encoder(1, 24000, 96);
      const mp3Chunks = [];
      const blockSize = 1152;
      for (let i = 0; i < samples.length; i += blockSize) {
        const chunk = samples.subarray(i, i + blockSize);
        const mp3buf = encoder.encodeBuffer(chunk);
        if (mp3buf.length) mp3Chunks.push(mp3buf);
      }
      const endBuf = encoder.flush();
      if (endBuf.length) mp3Chunks.push(endBuf);
      return { blob: new Blob(mp3Chunks, { type:'audio/mpeg' }), mime:'audio/mpeg' };
    } catch (e) {
      return { blob: wavBlob, mime: 'audio/wav' }; // رجوع آمن للأصل عند تعذّر الترميز
    }
  }

  /* ─── Generation ─── */
  async function onGenerate() {
    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الدرس', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    const content = getContentText(), lang = state.language;
    const schema  = lang === 'ar' ? ARABIC_SCHEMA : ENGLISH_PPP_SCHEMA;
    const primary = state.settings.defaultModel || 'gemini-3.5-flash';
    showOverlay('جاري إعداد الخطة...');
    let result;
    try { result = await callWithFallback(primary, buildSystem(lang), buildUser(meta, content, lang), schema); }
    catch (e) { hideOverlay(); handleGenError(e); return; }
    const rec = {
      title:meta.title, subject:meta.subject, grade:meta.grade, section:meta.section,
      school:meta.school, teacher:meta.teacher, directorate:meta.directorate,
      period:meta.period, date:meta.date,
      language:lang, sourceType:meta.sourceType, extractedText:content,
      planData:result.data, editedHtml:null, translatedData:null, showTranslation:false,
      model:result.model, createdAt:Date.now(), updatedAt:Date.now()
    };
    try { rec.id = await dbAdd(LESSONS_STORE, rec); } catch (e) {}
    hideOverlay();
    state.currentRecord = rec;
    navigate('result');
    renderResult();
    toast('تم إعداد الخطة بنجاح ✓', 'success');
  }

  async function onGenerateBoard() {
    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الدرس', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    const content = getContentText(), lang = state.language;
    const primary = state.settings.defaultModel || 'gemini-3.5-flash';
    showOverlay('جاري إعداد السبورة...');
    let result;
    try { result = await callWithFallback(primary, buildBoardSystem(lang), buildUser(meta, content, lang), BOARD_SCHEMA); }
    catch (e) { hideOverlay(); handleGenError(e); return; }
    const rec = {
      kind:'board', boardTheme:'green',
      title:meta.title, subject:meta.subject, grade:meta.grade, section:meta.section,
      school:meta.school, teacher:meta.teacher, directorate:meta.directorate,
      period:meta.period, date:meta.date,
      language:lang, sourceType:meta.sourceType, extractedText:content,
      planData:result.data, editedHtml:null, translatedData:null, showTranslation:false,
      model:result.model, createdAt:Date.now(), updatedAt:Date.now()
    };
    try { rec.id = await dbAdd(LESSONS_STORE, rec); } catch (e) {}
    hideOverlay();
    state.currentRecord = rec;
    navigate('result');
    renderResult();
    toast('تم إعداد السبورة بنجاح ✓', 'success');
  }

  async function onGenerateAudio() {
    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الدرس', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    const content = getContentText(), lang = state.language;
    const textModel = state.settings.defaultModel || 'gemini-3.5-flash';
    showOverlay('جاري كتابة نص الدرس الصوتي...');
    let script;
    try {
      const sres = await callWithFallback(textModel, buildAudioScriptSystem(lang), buildUser(meta, content, lang), AUDIO_SCRIPT_SCHEMA);
      script = (sres.data.script || '').trim();
      if (!script) throw Object.assign(new Error('EMPTY'), { code:'EMPTY' });
    } catch (e) { hideOverlay(); handleGenError(e); return; }

    const rec = {
      kind:'audio',
      title:meta.title, subject:meta.subject, grade:meta.grade, section:meta.section,
      school:meta.school, teacher:meta.teacher, directorate:meta.directorate,
      period:meta.period, date:meta.date,
      language:lang, sourceType:meta.sourceType, extractedText:content,
      script, scriptModel:textModel,
      geminiBlob:null, geminiMime:null, recordedBlob:null, recordedMime:null,
      createdAt:Date.now(), updatedAt:Date.now()
    };
    try { rec.id = await dbAdd(LESSONS_STORE, rec); } catch (e) {}
    hideOverlay();
    state.currentRecord = rec;
    navigate('result');
    renderResult();
    toast('تم إعداد نص الدرس الصوتي ✓ — اختر الآن طريقة توليد الصوت', 'success');
  }
  // توليد صوت Gemini كخطوة اختيارية منفصلة تماماً — فشلها لا يعطّل بقية الخيارات
  async function onGenerateGeminiAudio() {
    const rec = state.currentRecord;
    if (!rec || rec.kind !== 'audio') return;
    if (!state.settings.apiKey) { toast('أدخل مفتاح API أولاً', 'error'); return; }
    showOverlay('جاري توليد الصوت...');
    try {
      const wav = await synthesizeScriptToWav(rec.script,
        (i, total) => showOverlay(`جاري توليد الصوت — الجزء ${i} من ${total}...`),
        () => showOverlay('تجاوزت الحد المسموح مؤقتاً — جاري الانتظار قبل إعادة المحاولة...'));
      showOverlay('جاري ضغط الملف الصوتي لأصغر حجم...');
      const { blob, mime } = await compressAudioBlob(wav);
      rec.geminiBlob = blob; rec.geminiMime = mime; rec.model = TTS_MODEL;
      rec.updatedAt = Date.now();
      try { await dbPut(LESSONS_STORE, rec); } catch (e) {}
      hideOverlay(); renderResult(); toast('تم توليد الصوت ✓', 'success');
    } catch (e) {
      hideOverlay();
      if (e.code === 'BAD_KEY') toast('مفتاحك لا يدعم خدمة تحويل النص لصوت في Gemini، أو المفتاح غير صحيح', 'error');
      else handleGenError(e);
    }
  }

  async function onGenerateQuiz() {
    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الدرس', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    const content = getContentText(), lang = state.language;
    const primary = state.settings.defaultModel || 'gemini-3.5-flash';
    showOverlay('جاري إعداد الملخص التفاعلي...');
    let result;
    try { result = await callWithFallback(primary, buildQuizSystem(lang), buildUser(meta, content, lang), QUIZ_SCHEMA); }
    catch (e) { hideOverlay(); handleGenError(e); return; }

    // فرض توزيع عشوائي حقيقي لمكان الإجابة الصحيحة بكل سؤال
    if (result.data && Array.isArray(result.data.questions)) {
      result.data.questions = result.data.questions.map(q => {
        const correctText = q.options[q.correctIndex];
        const shuffled = shuffleArrayFisherYates(q.options);
        return { ...q, options: shuffled, correctIndex: shuffled.indexOf(correctText) };
      });
    }
    const rec = {
      kind:'quiz',
      title:meta.title, subject:meta.subject, grade:meta.grade, section:meta.section,
      school:meta.school, teacher:meta.teacher, directorate:meta.directorate,
      period:meta.period, date:meta.date,
      language:lang, sourceType:meta.sourceType, extractedText:content,
      quizData:result.data, editedHtml:null, translatedData:null, showTranslation:false,
      model:result.model, createdAt:Date.now(), updatedAt:Date.now()
    };
    try { rec.id = await dbAdd(LESSONS_STORE, rec); } catch (e) {}
    hideOverlay();
    state.currentRecord = rec;
    navigate('result');
    renderResult();
    toast('تم إعداد الملخص التفاعلي بنجاح ✓', 'success');
  }
    // 💡 دالة توليد "ربط الدرس بالواقع" (برومبت المعلم الأصلي + التنسيق الفاخر)
  window.generateRealWorldConnection = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الدرس أو الوحدة أولاً', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    
    const content = getContentText();
    if (!content.trim()) { toast('الرجاء استخراج أو إدخال نص الدرس أولاً', 'error'); return; }

    showOverlay('جاري استكشاف الروابط الواقعية وتنسيق المستند... 🌍');

    // 💡 تم استخدام البرومبت الأصلي الخاص بك حرفياً مع إضافة ### للعناوين ليتم تلوينها
    const prompt = `أنت خبير تربوي ملهم ومصمم مناهج محترف، وخبير في ربط الدروس في المنهج الدراسي اليمني بالواقع. قم بتحليل النص أو الموضوع التالي، واستنتج من محتواه المادة الدراسية والمرحلة العمرية التقريبية للطلاب. 

بناءً على استنتاجك، اكتب 'إثراء لربط الدرس بالواقع' بهدف إثارة شغف الطلاب والإجابة على سؤال (لماذا ندرس هذا؟ وما علاقته بالواقع وما تطبيقاته العملية).

يجب أن يكون الإخراج منسقاً بالهيكل التالي فقط:

### 🪝 تمهيد
اذكر موقف حياتي مألوف أو قصة قصيرة جداً تلامس واقع الطالب واهتماماته في هذه المرحلة لها علاقة بمحتوى الدرس مراعيا الفئة العمرية حسب الصف الدراسي.

### 💡 التطبيق المباشر
أين وكيف نستخدم هذه القاعدة أو المعلومة في الحياة اليومية، التكنولوجيا، أو الطبيعة من حولنا او الجانب الديني او الاجتماعي او الاقتصادي أو السياسي او اللغوي او غيره ...؟
👨‍🚀 اذا كان الدرس اسلامي ديني اربطه بدين الاسلام وعقيدته واخلاقه وبالله.
👨‍🚀 واذا كان علميا متعلق بمخلوقات الله اربطه بالله والتفكر في خلقه وإظهار إعجاز وإبداع الله في الكون والخلق والتشريع.
👨‍🚀 إذا كان رياضيات استخدم أقصى درجات البحث عن علاقته بالواقع واين يطبق وكيف وبلغة سهلة وواضحة.

### 👨‍🚀 مهن المستقبل
إن كان يوجد وظائف أو مهن تعتمد بشكل أساسي على فهم هذا الدرس اذكرها بشكل واضح.

### 🎬 نشاط واقعي
نشاط عملي سريع وممتع، أو سؤال تفكيري يطلبه المعلم من الطلاب لتطبيقه بأنفسهم متعلق بمحتوى الدرس.

الموضوع / النص الأساسي:
${content}`;

    try {
      const model = state.settings.defaultModel || 'gemini-3.5-flash';
      const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(state.settings.apiKey)}`;
      
      const res = await fetch(url, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 } 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال بالذكاء الاصطناعي');

      const responseText = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      
      let parsedContent = responseText.replace(/```html/gi, '').replace(/```/g, '').trim();
      if (typeof marked !== 'undefined') {
          parsedContent = marked.parse(parsedContent);
      } else {
          parsedContent = parsedContent.replace(/### (.*?)\n/g, '<h3>$1</h3>\n');
          parsedContent = parsedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          parsedContent = parsedContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
          parsedContent = '<p>' + parsedContent + '</p>';
      }

      // 🎨 التنسيق اللوني الفاخر
      const styledHtml = `
      <style>
          .real-world-body { direction: rtl; line-height: 1.9; font-family: inherit; }
          
          .real-world-body h3 { 
              color: #ffffff; 
              background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); 
              padding: 12px 20px; 
              border-radius: 10px; 
              font-size: 1.45em; 
              font-weight: 900; 
              margin-top: 35px; 
              margin-bottom: 18px; 
              display: block;
              box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
              border-right: 6px solid #fbbf24; 
          }
          
          .real-world-body p { 
              font-size: 1.15em; 
              margin-bottom: 18px; 
              text-align: justify; 
              color: #1e293b; 
              padding-right: 10px;
          }
          
          .real-world-body strong { 
              color: #059669; 
              background: #ecfdf5; 
              padding: 3px 8px; 
              border-radius: 6px; 
              font-weight: 900;
          }
          
          .real-world-body ul { padding-right: 25px; margin-bottom: 15px; }
          .real-world-body li { margin-bottom: 12px; font-size: 1.1em; color: #334155; }
      </style>
      <div class="real-world-body">
          ${parsedContent}
      </div>
      <div style="margin-top: 40px; text-align: center; padding-top: 15px; border-top: 2px dashed #cbd5e1; color: #64748b; font-size: 14px; font-weight: bold;">
          ✨ تم التوليد بواسطة المساعد الذكي - تطبيق الذكي
      </div>
      `;

      const rec = {
        kind: 'quiz', 
        isDoc: true, 
        title: `إثراء (واقع): ${meta.title}`,
        subject: meta.subject, grade: meta.grade, section: meta.section,
        language: state.language, sourceType: meta.sourceType, extractedText: content,
        docHtml: styledHtml,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      rec.id = await dbAdd(LESSONS_STORE, rec);
      state.currentRecord = rec;
      
      hideOverlay();
      navigate('result');
      renderResult();
      
      toast('تم تنسيق وتوليد الإثراء بنجاح! ✨', 'success');

    } catch (err) {
      hideOverlay();
      console.error("Error generating Real World Connection:", err);
      toast('خطأ: ' + (err.message || 'تعذر الاتصال بالذكاء الاصطناعي'), 'error');
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 💡 دالة توليد "الموجه الشخصي" (استراتيجيات التدريس وتقويم الذكي)
  // ══════════════════════════════════════════════════════════════
  window.generateTeachingMentor = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const meta = typeof gatherMeta === 'function' ? gatherMeta() : {};
    if (!meta.title) { 
        if(typeof toast === 'function') toast('الرجاء إدخال عنوان الدرس أو الوحدة أولاً', 'error'); 
        return; 
    }
    
    // التحقق من مفتاح API
    const apiKey = typeof getApiKey === 'function' ? getApiKey() : (state?.settings?.apiKey || '');
    if (!apiKey) { 
        if(typeof toast === 'function') toast('الرجاء إدخال مفتاح API', 'error'); 
        return; 
    }
    
    const content = typeof getContentText === 'function' ? getContentText() : '';
    if (!content.trim()) { 
        if(typeof toast === 'function') toast('الرجاء استخراج أو إدخال نص الدرس أولاً', 'error'); 
        return; 
    }

    if(typeof showOverlay === 'function') showOverlay('جاري تحليل الدرس وتجهيز الاستراتيجيات وأدوات الذكي... 👨‍🏫');

    // 💡 البرومبت الهندسي الذي يربط الاستراتيجيات بأدوات تطبيق الذكي وتقنيات الأوفلاين
    const prompt = `أنت خبير وموجه تربوي متخصص في استراتيجيات تدريس المناهج اليمنية وأساليب التقويم الناجحة والفاعلة.
قم بتحليل النص المستخرج من هذا الدرس، وبناءً على المادة (${meta.subject || 'غير محددة'}) والصف الدراسي (${meta.grade || 'غير محدد'})، اختر أفضل استراتيجيات التدريس وأساليب التقويم المناسبة له.

شروط هامة جداً للتوجيه:
1. البيئة والوسائل: وازن بين الاستراتيجيات التي تلائم الفصول العادية، والاستراتيجيات التقنية الحديثة. تذكر أن الطلاب في المرحلة الثانوية يمتلكون هواتف ذكية ويمكن الاستفادة منها في التعلم.
2. اللغة الإنجليزية: إذا كانت المادة "اللغة الإنجليزية"، اكتب الشرح والتطبيق باللغة العربية لتسهيل الفهم على المعلم، مع كتابة المصطلحات الخاصة بالاستراتيجية بالإنجليزية بين قوسين. واحرص أن يكون التطبيق مناسباً لطلاب يدرسون الإنجليزية كلغة ثانية (ESL).
3. ربط ذكي وعملي بأدوات تطبيق (الذكي):
أنت تعلم أن المعلم يستخدم هذا التطبيق المصمم لبيئة المدارس (بدون الحاجة لإنترنت للطلاب). التطبيق يمتلك الأدوات الحصرية التالية:
- (السبورة والعروض التقديمية 🖥️): تحويل محتوى السبورة إلى عرض تقديمي من داخل التطبيق.
- (الملخص التفاعلي 📑): ملخص مقروء يتبعه أسئلة تقويمية، يُرسل لهواتف الطلاب.
- (الاختبار الشامل 📝): اختبار إلكتروني ذكي يقدم تغذية راجعة فورية للطالب (يوضح الإجابة الصحيحة وسببها).
- (الدرس الصوتي 🎧): ملف صوتي يلخص  الدرس ويظهر على شكل فيديو ويكتب في الشاشة مع القراءة.
- (الإثراء والربط بالواقع 🌍): تطبيقات عملية للدرس من الحياة اليومية.
 - (الخرائط الذهنية🌍): خرائط ذهنية ينشئها تطبيق الذكي ويمكن ارسالها او عرضها للطلاب.
- (الملخص الشامل 🌍): ملخص منسق بشكل جميل يمكن ارساله للطلاب او طباعته.
- (تقويم الدرس او الوحدة 🌍): يقوم تطبيق الذكي بحل تقويم الدرس او الوحدة بشكل منسق ورائع ويمكن للمعلم مشاركته لطلابه.
تعليمات صارمة: عند اقتراحك لاستراتيجيات التدريس أو أساليب التقويم، يجب أن توظف هذه الأدوات المحددة، واشرح للمعلم كيف يرسلها لطلابه (مثلاً: اذكر صراحة إرسال الاختبار أو الملخص التفاعلي عبر البلوتوث أو الشبكة المحلية Wi-Fi)، وكيف يستفيد من ميزة التغذية الراجعة الفورية أو العروض التقديمية.

يجب أن يكون الإخراج منسقاً بالهيكل التالي فقط (استخدم ### للرئيسي و - للفرعي):

### 🛠️ استراتيجيات التدريس
اذكر استراتيجيتين كحد أقصى (إحداهما تقليدية فعالة والأخرى تدمج التقنية باستخدام أدوات التطبيق). لكل استراتيجية:
- **اسم الاستراتيجية:**
- **فكرتها ببساطة:** (شرح مبسط جداً في سطرين).
- **خطوات التطبيق:** (اشرح للمعلم خطوة بخطوة كيف ينفذها على محتوى هذا الدرس تحديداً داخل الفصل).
- 🚀 **تلميح تطبيق الذكي:** (اربطها صراحة بإحدى أدوات التطبيق المذكورة أعلاه واشرح كيفية توظيفها وإرسالها).

### 🎯 أساليب التقويم
اذكر أسلوبين تقويم فاعلين لختام الحصة أو قياس الفهم. لكل أسلوب:
- **اسم الأسلوب:**
- **فكرته ببساطة:**
- **تطبيقه على الدرس:** (أعطِ المعلم السؤال الفعلي أو النشاط الذي سيطلبه من الطلاب لقياس فهمهم لهذا الدرس).
- 🚀 **تلميح تطبيق الذكي:** (اربطها صراحة بأداة الاختبار الشامل أو الملخص التفاعلي، واذكر إرسالها الى هواتف الطلاب  وميزة التغذية الراجعة الفورية).

النص / الدرس المستهدف:
${content}`;

    try {
      let aiModel = 'gemini-3.5-flash';
      try {
        const storedSettings = localStorage.getItem('haael_settings_v2');
        if (storedSettings && storedSettings.trim().startsWith('{')) { 
            aiModel = JSON.parse(storedSettings).defaultModel || aiModel; 
        }
      } catch(e) {}
      
      const GEMINI_BASE_URL = typeof GEMINI_BASE !== 'undefined' ? GEMINI_BASE : 'https://generativelanguage.googleapis.com/v1beta/models/';
      const url = `${GEMINI_BASE_URL}${aiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      const res = await fetch(url, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 } 
        })
      });
      
      let data;
      try { data = await res.json(); } catch(e) { throw new Error('تنسيق رد غير صالح من الخادم.'); }
      
      if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال بالذكاء الاصطناعي');

      const responseText = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      
      // معالجة الماركدوان البسيطة
      let parsedContent = responseText.replace(/```(?:html|markdown)?/gi, '').trim();
      if (typeof marked !== 'undefined') {
          parsedContent = marked.parse(parsedContent);
      } else {
          parsedContent = parsedContent.replace(/### (.*?)\n/g, '<h3>$1</h3>\n');
          parsedContent = parsedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          parsedContent = parsedContent.replace(/- (.*?)\n/g, '<li>$1</li>\n');
          parsedContent = parsedContent.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
          parsedContent = parsedContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
          if(!parsedContent.startsWith('<')) parsedContent = '<p>' + parsedContent + '</p>';
      }

      // 🎨 التنسيق اللوني الاحترافي للموجه الشخصي
      const styledHtml = `
      <style>
          .mentor-body { direction: rtl; line-height: 1.9; font-family: 'Cairo', 'Amiri-Bold', sans-serif; background: #fafaf9; padding: 20px; border-radius: 12px;}
          
          .mentor-body h3 { 
              color: #ffffff; 
              background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); 
              padding: 12px 20px; 
              border-radius: 10px; 
              font-size: 1.45em; 
              font-weight: 900; 
              margin-top: 35px; 
              margin-bottom: 20px; 
              display: block;
              box-shadow: 0 4px 10px rgba(20, 184, 166, 0.2);
              border-right: 6px solid #fbbf24; 
          }
          
          .mentor-body p { 
              font-size: 1.15em; 
              margin-bottom: 18px; 
              text-align: justify; 
              color: #1e293b; 
              padding-right: 10px;
          }
          
          .mentor-body strong { 
              color: #be185d; 
              background: #fdf2f8; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-weight: 900;
          }
          
          .mentor-body ul { padding-right: 20px; margin-bottom: 20px; }
          .mentor-body li { margin-bottom: 14px; font-size: 1.1em; color: #334155; line-height: 1.8; }
          
          /* تمييز تلميحات تطبيق الذكي بوضوح شديد */
          .mentor-body li:has(strong:contains("تلميح تطبيق الذكي")) {
              background-color: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-right: 5px solid #16a34a;
              padding: 15px;
              border-radius: 8px;
              color: #166534;
              list-style: none;
              margin-top: 15px;
              margin-right: -20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }
          .mentor-body li:has(strong:contains("تلميح تطبيق الذكي")) strong {
              background: transparent;
              color: #15803d;
              font-size: 1.1em;
          }
      </style>
      <div class="mentor-body">
          ${parsedContent}
      </div>
      <div style="margin-top: 40px; text-align: center; padding-top: 15px; border-top: 2px dashed #cbd5e1; color: #64748b; font-size: 14px; font-weight: bold;">
          👨‍🏫 تم إعداد هذا التوجيه بواسطة المساعد الذكي - تطبيق الذكي (Offline-First Ready)
      </div>
      `;

      const rec = {
        kind: 'quiz', // يُحفظ هنا ليكون قابلاً للعرض والطباعة في الأرشيف
        isDoc: true, 
        title: `موجه شخصي: ${meta.title || 'درس'}`,
        subject: meta.subject, grade: meta.grade, section: meta.section,
        language: typeof state !== 'undefined' ? state.language : 'ar', 
        sourceType: meta.sourceType, 
        extractedText: content,
        docHtml: styledHtml,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      const STORE_NAME = typeof LESSONS_STORE !== 'undefined' ? LESSONS_STORE : 'lessons';
      if (typeof dbAdd === 'function') {
          rec.id = await dbAdd(STORE_NAME, rec);
          if (typeof state !== 'undefined') state.currentRecord = rec;
      }
      
      if(typeof hideOverlay === 'function') hideOverlay();
      
      if (typeof HaelActions !== 'undefined' && HaelActions.openArchiveRecord && rec.id) {
          await HaelActions.openArchiveRecord(rec.id);
      } else if (typeof navigate === 'function') {
          navigate('result');
          if(typeof renderResult === 'function') renderResult();
      }
      
      if(typeof toast === 'function') toast('تم إعداد التوجيهات والاستراتيجيات بنجاح! 👨‍🏫', 'success');

    } catch (err) {
      if(typeof hideOverlay === 'function') hideOverlay();
      console.error("Error generating Teaching Mentor:", err);
      if(typeof toast === 'function') toast('خطأ: ' + (err.message || 'تعذر الاتصال بالذكاء الاصطناعي'), 'error');
    }
  };

    /* ─── حل تقويم الوحدة (مسار جديد) ─── */
  async function onGenerateAnswers() {
    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الوحدة أو الدرس', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    const content = getContentText();
    if (!content.trim()) { toast('الرجاء استخراج أسئلة التقويم أولاً', 'error'); return; }
    const isEnglish = state.language === 'en';

    showOverlay('جاري قراءة الأسئلة وإعداد نموذج الإجابة النموذجي...');

    const prompt = isEnglish ? `
    You are an expert textbook author. The following text contains the "Unit Evaluation/Review Questions".
    Your task is to create a comprehensive "Answer Key" document.

    Questions Text:
    ${content}

    Strict Rules:
    1. For every question, write the original question clearly in bold (<h3 style="color:#1e293b; margin-top:20px; font-size:1.2em;">), and wrap the corresponding answer EXACTLY in this HTML code:
       <div style="color:#0284c7; font-weight:bold; padding:12px 15px; background-color:#f0f9ff; border-radius:8px; border-left:4px solid #0284c7; margin-bottom:25px; font-size:1.05em; line-height:1.8;">[Your Answer Here]</div>
    2. For Multiple Choice: State the question and put ONLY the correct choice clearly inside the answer box.
    3. For Matching: Present the solved matches clearly inside the answer box (e.g., in a table or as full connected sentences).
    4. For "Draw" questions: Write the question, then put this note in the answer box: "[Instruction: Refer to the textbook diagrams for drawing]".
    5. Output ONLY semantic HTML (no <html> or <body>). Use <h2> for main question headers (e.g., Question 1).
    6. Do NOT wrap the HTML in markdown (\`\`\`html).
    ${mathRulesBlock(true)}
    ` : `
    أنت خبير تربوي ومؤلف مناهج. النص التالي يحتوي على "أسئلة تقويم الوحدة" مستخرجة من الكتاب المدرسي.
    مهمتك هي إنشاء "نموذج إجابة" كامل ومنسق وجاهز للطباعة للطلاب.

    نص الأسئلة:
    ${content}

    قواعد صارمة جداً للتنسيق والمحتوى:
    1. اكتب نص السؤال الأصلي كما هو بخط بارز (<h3 style="color:#1e293b; margin-top:20px; font-size:1.2em;">)، وضع الإجابة النموذجية الدقيقة تحته مباشرة مغلفة حصراً بهذا الكود البرمجي ليتم تلوينها:
       <div style="color:#0284c7; font-weight:bold; padding:12px 15px; background-color:#f0f9ff; border-radius:8px; border-right:4px solid #0284c7; margin-bottom:25px; font-size:1.05em; line-height:1.8;">[اكتب الإجابة النموذجية هنا]</div>
    2. لأسئلة (اختر الإجابة): اكتب السؤال واذكر الخيار الصحيح فقط بوضوح داخل مربع الإجابة.
    3. لأسئلة (المطابقة/صل): قم بحل المطابقة واعرضها كجمل متصلة صحيحة أو جدول محلول داخل مربع الإجابة.
    4. لأسئلة (التعليل/قارن/اشرح): قدم إجابة علمية دقيقة ووافية داخل مربع الإجابة بأسلوب أكاديمي يناسب طلاب المرحلة الثانوية.
    5. لأسئلة (ارسم): اكتب السؤال، واكتب تحته في مربع الإجابة هذه الملاحظة: [توجيه: يُترك هذا السؤال للرسم العملي بالاعتماد على الأشكال التوضيحية في الكتاب المدرسي].
    6. المخرجات: أخرج النتيجة بصيغة HTML دلالي فقط (بدون <html> أو <body>). استخدم <h2> لعنوان السؤال الرئيسي (مثل: السؤال الأول).
    7. لا تكتب أي علامات Markdown (مثل \`\`\`html) أو أي نص خارج كود HTML.
    ${mathRulesBlock(false)}
    `;

    try {
      const model = state.settings.defaultModel || 'gemini-3.5-flash';
      const url = `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(state.settings.apiKey)}`;
      
      const res = await fetch(url, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 } // حرارة منخفضة جداً لضمان دقة الإجابات العلمية
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال بالذكاء الاصطناعي');

      const responseText = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      const cleanHTML = responseText.replace(/```html/gi, '').replace(/```/g, '').trim();

      const rec = {
        kind: 'answers',
        isDoc: true, 
        title: meta.title || 'حل تقويم الوحدة',
        subject: meta.subject, grade: meta.grade, section: meta.section,
        language: state.language, sourceType: meta.sourceType, extractedText: content,
        docHtml: cleanHTML,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      rec.id = await dbAdd(LESSONS_STORE, rec);
      state.currentRecord = rec;
      hideOverlay();
      navigate('result');
      renderResult();
      toast('تم إعداد نموذج الإجابة بنجاح ✓', 'success');

    } catch (e) {
      hideOverlay();
      console.error(e);
      toast('حدث خطأ أثناء التوليد: ' + e.message, 'error');
    }
  }

  function renderMindmapHtml(mindmap, rootTitle, isAr) {
    const branches = mindmap?.branches || [];
    const branchesHtml = branches.map(b => `
      <div class="mindmap-branch">
        <h5>${esc(b.title || '')}</h5>
        <ul>${(b.points || []).map(p => {
          let pointText = esc(p);
          // فصل النص الإنجليزي عن الترجمة لتلوينه بذكاء (يدعم الفاصل / أو -)
          if (pointText.includes(' / ')) {
              const parts = pointText.split(' / ');
              pointText = `${parts[0]} <span class="trans-sep">/</span> <span class="trans-text" dir="rtl">${parts[1]}</span>`;
          } else if (pointText.includes(' - ')) {
              const parts = pointText.split(' - ');
              pointText = `${parts[0]} <span class="trans-sep">-</span> <span class="trans-text" dir="rtl">${parts[1]}</span>`;
          }
          return `<li>${pointText}</li>`;
        }).join('')}</ul>
      </div>`).join('');
    return `<div class="mindmap-root">${esc(rootTitle || '')}</div><div class="mindmap-branches">${branchesHtml}</div>`;
  }

  function renderQuizPreview(rec) {
    const isAr = rec.language !== 'en';
    const d = (rec.showTranslation && rec.translatedData) ? rec.translatedData : rec.quizData;
    const gradeLine = [rec.subject, rec.grade, rec.section].filter(Boolean).map(esc).join(' — ');
    const qCount = d.questions?.length || 0;
    const questionsHtml = (d.questions || []).map((q, i) => `
      <div class="quiz-q-preview">
        <p>${i+1}. ${esc(q.q || '')}</p>
        ${(q.options || []).map((op, oi) => `<div class="qopt${oi===q.correctIndex?' correct':''}">${oi===q.correctIndex?'✓ ':'○ '}${esc(op)}</div>`).join('')}
      </div>`).join('');
    return `
    <div class="quiz-card" dir="${isAr ? 'rtl' : 'ltr'}">
      <div class="quiz-card-head">
        <span class="audio-icon">📝</span>
        <div><h2>${esc(rec.title) || ''}</h2><p>${gradeLine}</p></div>
      </div>
      <div class="quiz-section-title">🧠 ${isAr?'الخريطة الذهنية':'Mind map'}</div>
      ${renderMindmapHtml(d.mindmap, rec.title, isAr)}
      <div class="quiz-section-title">❓ ${isAr?'أسئلة الاختبار':'Quiz questions'}</div>
      <span class="quiz-count-badge">${qCount} ${isAr?'سؤال':'questions'}</span>
      ${questionsHtml}
    </div>`;
  }
  // بناء ملف HTML واحد قائم بذاته (خريطة ذهنية + اختبار تفاعلي مُصحَّح تلقائياً) — يُشارَك مع الطلاب مباشرة
  function buildQuizContentBlock(d, title, subjectLine, isAr, blockId) {
    const mindmapHtml = renderMindmapHtml(d.mindmap, title, isAr);
    const questionsHtml = (d.questions || []).map((q, i) => `
      <div class="q-block" data-correct="${q.correctIndex}">
        <p class="q-text">${i+1}. ${esc(q.q || '')}</p>
        <div class="q-options">
          ${(q.options || []).map((op, oi) => `<button type="button" class="q-opt" data-idx="${oi}">${esc(op)}</button>`).join('')}
        </div>
        <p class="q-explain" hidden>${esc(q.explanation || '')}</p>
      </div>`).join('');
    return `
    <div class="lang-block" id="${blockId}" dir="${isAr ? 'rtl' : 'ltr'}">
      <div class="section-title">🧠 ${isAr?'الخريطة الذهنية':'Mind map'}</div>
      ${mindmapHtml}
      <div class="section-title">❓ ${isAr?'الاختبار':'Quiz'}</div>
      <div class="quizForm">${questionsHtml}</div>
      <button type="button" class="btn-check">${isAr?'تصحيح الإجابات':'Check answers'}</button>
      <div class="result-box"><h2 class="result-text"></h2></div>
    </div>`;
  }
    function buildStandaloneQuizHtml(rec) {
    const isAr = rec.language !== 'en';
    const original = rec.quizData;
    const translated = rec.translatedData; 
    const subjectLine = [rec.subject, rec.grade].filter(Boolean).map(esc).join(' — ');
    const primaryBlock = buildQuizContentBlock(original, rec.title, subjectLine, isAr, 'blockPrimary');
    const hasToggle = !isAr && translated; 
    const secondaryBlock = hasToggle ? buildQuizContentBlock(translated, rec.title, subjectLine, true, 'blockArabic') : '';
    return `<!DOCTYPE html>
<html lang="${isAr?'ar':'en'}" dir="${isAr?'rtl':'ltr'}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(rec.title || '')}</title>
<style>
  body{font-family:'Tahoma',sans-serif;background:#F4F2FB;margin:0;padding:16px;color:#1f2a33}
  .wrap{max-width:640px;margin:0 auto}
  .head{background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;border-radius:16px;padding:18px;text-align:center;margin-bottom:16px}
  .head h1{font-size:19px;margin-bottom:4px}
  .head p{font-size:13px;opacity:.9}
  .btn-toggle-lang{display:block;width:100%;height:44px;border:2px solid #7C3AED;border-radius:12px;background:#fff;color:#7C3AED;font-weight:900;font-size:14px;margin-bottom:16px}
  .section-title{font-size:15px;font-weight:900;color:#5B21B6;margin:18px 0 10px}
  .mindmap-root{background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;border-radius:14px;padding:14px;text-align:center;font-weight:900;font-size:16px;margin-bottom:12px}
  .mindmap-branches{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:480px){.mindmap-branches{grid-template-columns:1fr}}
  .mindmap-branch{background:#fff;border:1.5px solid #E4E0F5;border-radius:12px;padding:10px 12px}
  .mindmap-branch h5{font-size:15px;font-weight:900;color:#dc2626;margin-bottom:8px;border-bottom:1.5px dashed #fca5a5;padding-bottom:5px;}
  .trans-text{color:#059669;font-weight:800;font-size:0.95em;} 
  .trans-sep{color:#cbd5e1;margin:0 4px;}
  .mindmap-branch ul{list-style:none;padding:0;margin:0}
  .mindmap-branch li{line-height:1.85;position:relative;color:#1e293b;font-size:14px;margin-bottom:6px;}
  [dir="rtl"] .mindmap-branch li{padding-right:12px} [dir="ltr"] .mindmap-branch li{padding-left:12px}
  .mindmap-branch li::before{content:"•";position:absolute;color:#7C3AED}
  [dir="rtl"] .mindmap-branch li::before{right:0} [dir="ltr"] .mindmap-branch li::before{left:0}
  .q-block{background:#fff;border:1px solid #E4E0F5;border-radius:14px;padding:14px;margin-bottom:12px}
  .q-text{font-weight:800;font-size:14.5px;margin-bottom:10px}
  .q-options{display:flex;flex-direction:column;gap:8px}
  [dir="rtl"] .q-opt{text-align:right} [dir="ltr"] .q-opt{text-align:left}
  .q-opt{padding:10px 12px;border-radius:10px;border:1.5px solid #E4E0F5;background:#F9F8FD;font-size:13.5px;cursor:pointer;width:100%;font-family:inherit}
  .q-opt.correct{background:#DCFCE7;border-color:#16A34A;font-weight:900}
  .q-opt.wrong{background:#FEE2E2;border-color:#DC2626}
  .q-explain{font-size:12.5px;color:#5b6773;margin-top:8px;background:#F4F2FB;border-radius:8px;padding:8px 10px}
  .btn-check{width:100%;height:50px;border:none;border-radius:14px;background:#7C3AED;color:#fff;font-weight:900;font-size:15px;margin-top:8px}
  .result-box{display:none;text-align:center;background:#fff;border-radius:16px;padding:20px;margin-top:16px;border:2px solid #7C3AED}
  .result-box h2{font-size:24px;color:#5B21B6}
  .lang-block[hidden]{display:none}
  .q-opt:hover { background: #F4F2FB; border-color: #7C3AED; }
  .q-opt.picked { background: #FEF3C7; border-color: #F59E0B; color: #1E1B4B; font-weight: 900; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2); }
  .q-opt { transition: all 0.2s ease-in-out; }
  .math-frac-wrapper { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: -6px 5px; direction: rtl; unicode-bidi: isolate; font-size: 0.85em; }
  .math-frac-num { position: relative; top: 1px; padding: 0 3px; line-height: 0.85; }
  .math-frac-den { border-top: 1.5px solid #7C3AED; margin-top: 2px; padding: 0 3px; line-height: 0.85; }
  .math-root-wrapper { display: inline-flex; direction: rtl; align-items: stretch; vertical-align: middle; margin: 0 6px 0 9px; unicode-bidi: isolate; }
  .math-root-tick { flex-shrink: 0; align-self: stretch; aspect-ratio: 2 / 3; min-width: 11px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 30'%3E%3Cpath d='M1 0 L13 28 L18 19' stroke='%23000' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E"); background-size: 100% 100%; background-repeat: no-repeat; }
  .math-root-body { border-top: 1.6px solid #7C3AED; padding: 2px 4px 0 4px; line-height: 1.2; }
  .math-power-wrapper { display: inline-flex; align-items: baseline; direction: rtl; margin: 0 4px; unicode-bidi: isolate; }
  .math-power-base { font-size: 1.1em; min-width: 15px; padding: 0 1px; }
  .math-power-sup { font-size: 0.8em; transform: translateY(-0.6em); min-width: 10px; margin-right: 1px; padding: 0 1px; white-space: nowrap; }
  /* 🔊 تنسيقات زر النطق */
  .tts-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background-color: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; cursor: pointer; font-size: 14px; margin: 0 8px; transition: all 0.2s ease; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .tts-btn:active { transform: scale(0.9); background-color: #7dd3fc; }
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>${esc(rec.title || '')}</h1><p>${subjectLine}</p></div>
  ${hasToggle ? `<button type="button" class="btn-toggle-lang" id="btnToggleLang">🌐 عرض بالعربية / Show in Arabic</button>` : ''}
  ${primaryBlock}
  ${secondaryBlock}
</div>
<script>
// 🔊 محرك النطق للطلاب (مدمج بشكل آمن داخل الـ script)
window.playTTS = function(text, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!('speechSynthesis' in window)) { alert('جهازك لا يدعم النطق الصوتي'); return; }
    
    window.speechSynthesis.cancel();
    
    // 💡 حل مشكلة هواتف الأندرويد: تأخير بسيط لمنع تداخل أمر الإلغاء مع أمر النطق
    setTimeout(function() {
        // 💡 حفظ الكائن في متغير عام (window) يمنع الهاتف من إيقاف النطق فجأة لتوفير الذاكرة
        window.currentUtterance = new SpeechSynthesisUtterance(text);
        window.currentUtterance.lang = 'en-US';
        window.currentUtterance.rate = 0.85;
        
        var voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            var localVoice = voices.find(function(v) { return v.lang.startsWith('en') && v.localService === true; });
            if (!localVoice) localVoice = voices.find(function(v) { return v.lang.startsWith('en'); });
            if (localVoice) window.currentUtterance.voice = localVoice;
        }
        
        window.speechSynthesis.speak(window.currentUtterance);
        
        // صدمة تنشيط لتفادي سبات المتصفح عند فصل الشبكة
        var keepAlive = setInterval(function() {
            if (!window.speechSynthesis.speaking) clearInterval(keepAlive);
            else window.speechSynthesis.resume();
        }, 10000);
    }, 100); // 100 ملي ثانية كافية لحل مشكلة الكتم
};

if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
    }
}

window.injectTTSButtons = function() {
    // 💡 حل المشكلة الأولى: إيقاف عمل الناطق تماماً إذا كان المستند ليس باللغة الإنجليزية
    if (document.documentElement.lang !== 'en') return;

    var tagsToScan = ['p', 'li', 'h3', 'h4', 'h5', 'td', 'th'];
    tagsToScan.forEach(function(tag) {
        document.querySelectorAll(tag).forEach(function(el) {
            if (el.querySelector('.tts-btn')) return;
            var text = el.textContent.trim();
            var hasEnglishLetters = /[a-zA-Z]{2,}/.test(text);
            if (text.length > 2 && hasEnglishLetters) {
                var cleanTextForSpeech = text.replace(/'/g, "").replace(/"/g, "").replace(/\\\`/g, "");
                var btn = document.createElement('button');
                btn.className = 'tts-btn';
                btn.innerHTML = '🔊';
                btn.onclick = function(e) { window.playTTS(cleanTextForSpeech, e); };
                el.style.direction = 'ltr';
                el.style.textAlign = 'left';
                el.prepend(btn); 
            }
        });
    });
};

// تفعيل إضافة الأزرار
injectTTSButtons();



function wireBlock(block){
  block.querySelectorAll('.q-block').forEach(function(qb){
    qb.querySelectorAll('.q-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        qb.querySelectorAll('.q-opt').forEach(function(b){ b.classList.remove('picked'); });
        btn.classList.add('picked');
        qb.dataset.picked = btn.dataset.idx;
      });
    });
  });
  var checkBtn = block.querySelector('.btn-check');
  checkBtn.addEventListener('click', function(){
    var blocks = block.querySelectorAll('.q-block'), correct = 0;
    blocks.forEach(function(qb){
      var picked = qb.dataset.picked, correctIdx = qb.dataset.correct;
      qb.querySelectorAll('.q-opt').forEach(function(btn){
        btn.disabled = true;
        if (btn.dataset.idx === correctIdx) btn.classList.add('correct');
        else if (btn.dataset.idx === picked) btn.classList.add('wrong');
      });
      if (picked === correctIdx) correct++;
      var ex = qb.querySelector('.q-explain');
      if (ex && ex.textContent.trim()) ex.hidden = false;
    });
    var rb = block.querySelector('.result-box');
    rb.style.display = 'block';
    block.querySelector('.result-text').textContent = correct + ' / ' + blocks.length;
    rb.scrollIntoView({behavior:'smooth'});
    checkBtn.disabled = true;
  });
}
document.querySelectorAll('.lang-block').forEach(wireBlock);
${hasToggle ? `
document.getElementById('btnToggleLang').addEventListener('click', function(){
  var ar = document.getElementById('blockArabic'), en = document.getElementById('blockPrimary');
  var showingAr = !ar.hidden;
  ar.hidden = showingAr; en.hidden = !showingAr;
  this.textContent = showingAr ? '🌐 عرض بالعربية / Show in Arabic' : '🌐 English / عرض بالإنجليزية';
});
document.getElementById('blockArabic').hidden = true;
` : ''}
</` + `script>
</body>
</html>`;
  }

  /* ─── Arabic Renderer ─── */
  function listHtml(items) {
    if (!items?.length) return '<span class="cell-empty">—</span>';
    return '<ul class="cell-list">' + items.map(t => `<li>${esc(t)}</li>`).join('') + '</ul>';
  }
  function domStack(objs, field) {
    if (!objs?.length) return '<span class="cell-empty">—</span>';
    return '<div class="domain-level-stack">' + objs.map(o => `<span>${esc(o[field]||'')}</span>`).join('') + '</div>';
  }
  function objList(objs) {
    if (!objs?.length) return '<span class="cell-empty">—</span>';
    return '<ul class="cell-list">' + objs.map(o => `<li>${esc(o.text||'')}</li>`).join('') + '</ul>';
  }
  function renderArabic(data, meta) {
    // نفس قائمة المراحل المستخدمة في الـSchema والـPrompt.
    const STEPS = ARABIC_STEPS;
    const rowMap = {}; (data.rows||[]).forEach(r => { rowMap[r.stepLabel] = r; });
    const bodyRows = STEPS.map(step => {
      const r = rowMap[step] || {time:'',objectives:[],teacherRole:[],studentRole:[],assessment:[]};
      return `<tr>
        <td class="step-cell">${esc(step)}</td>
        <td class="col-obj">${objList(r.objectives)}</td>
        <td>${domStack(r.objectives,'domain')}</td>
        <td>${domStack(r.objectives,'level')}</td>
        <td>${esc(r.time||'')}</td>
        <td class="col-teacher">${listHtml(r.teacherRole)}</td>
        <td class="col-student">${listHtml(r.studentRole)}</td>
        <td class="col-assess">${listHtml(r.assessment)}</td>
      </tr>`;
    }).join('');
    const dir  = meta.directorate || state.settings.directorate || '';
    const dirLine = dir ? `مديرية: ${esc(dir)}` : `مديرية <span class="blank-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>`;
    return `
<style>.plan-doc, .plan-doc *, .plan-table th, .plan-table td { font-family: var(--font-doc, 'Cairo', sans-serif) !important; font-size: var(--fz) !important; }</style>
    <div class="plan-doc">
      <div class="plan-letterhead">
        <div class="lh-right">إدارة التوجيه التربوي<br>${dirLine}</div>
        <div class="lh-center"><span class="plan-mainTitle">الخطة الدرسية اليومية</span></div>
        <div class="lh-left">وزارة التربية والتعليم والبحث العلمي<br>مكتب التربية بمحافظة <span class="blank-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
      </div>
      <table class="plan-table plan-meta-table">
        <tr>
          <td class="meta-label">الصف</td><td class="meta-value">${esc(meta.grade)||'&nbsp;'}</td>
          <td class="meta-label">الشعبة</td><td class="meta-value">${esc(meta.section)||'&nbsp;'}</td>
          <td class="meta-label">المادة</td><td class="meta-value">${esc(meta.subject)||'&nbsp;'}</td>
          <td class="meta-label">الدرس</td><td class="meta-value">${esc(meta.title)||'&nbsp;'}</td>
          <td class="meta-label">الحصة</td><td class="meta-value">${esc(meta.period)||'&nbsp;'}</td>
          <td class="meta-label">التاريخ</td><td class="meta-value">${esc(formatDate(meta.date))||'&nbsp;'}</td>
        </tr>
      </table>
      <table class="plan-table plan-main-table">
        <thead><tr>
          <th class="col-step vertical-text">الخطوات</th>
          <th class="col-obj">الأهداف السلوكية</th>
          <th class="col-domain vertical-text">المجال</th>
          <th class="col-level vertical-text">المستوى</th>
          <th class="col-time vertical-text">الزمن</th>
          <th class="col-teacher">دور المعلم</th>
          <th class="col-student">دور المتعلم</th>
          <th class="col-assess">التقويم</th>
        </tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <table class="plan-table plan-footer-table">
        <tr><td class="footer-label">النشاط المنزلي / الواجب</td><td>${esc(data.homework||'—')}</td></tr>
        <tr><td class="footer-label">نشاط إثرائي</td><td>${esc(data.enrichment||'—')}</td></tr>
      </table>
      <p class="plan-doc-footnote">المعلم: ${esc(meta.teacher)||'—'} · المدرسة: ${esc(meta.school)||'—'}</p>
    </div>`;
  }

  /* ─── English PPP Renderer — with ministry header ─── */
  function renderPPP(data, meta) {
    const stratBadges = (data.strategies||[]).map(s=>`<span class="badge badge-s">📌 ${esc(s)}</span>`).join('');
    const resBadges   = (data.resources  ||[]).map(r=>`<span class="badge badge-r">📦 ${esc(r)}</span>`).join('');
    const aimItems    = (data.aims       ||[]).map(a=>`<li>${esc(a)}</li>`).join('');
    const stages = [
      {key:'warmUp',        cls:'stage-warmup', icon:'☀️',  label:'Warm up'},
      {key:'presentation',  cls:'stage-pres',   icon:'📊', label:'Presentation'},
      {key:'practice',      cls:'stage-prac',   icon:'✏️',  label:'Practice'},
      {key:'production',    cls:'stage-prod',   icon:'🎬', label:'Production'},
      {key:'consolidation', cls:'stage-cons',   icon:'🧩', label:'Consolidation'}
    ];
    const stageRows = stages.map(st => {
      const d = data[st.key] || {teacherRole:'',ssRole:'',time:''};
      return `<tr class="${st.cls}">
        <td><div class="stage-lbl">${st.icon} ${st.label}</div></td>
        <td dir="ltr">${esc(d.teacherRole||'')}</td>
        <td dir="ltr">${esc(d.ssRole||'')}</td>
        <td class="col-time">${esc(d.time||'')}</td>
      </tr>`;
    }).join('');
    const evalTags = (data.evaluation||[]).map(e=>`<span class="ppp-eval-tag">${esc(e)}</span>`).join('');
    const dir = meta.directorate || state.settings.directorate || '';
    return `
    <div class="plan-ppp" dir="ltr">
      <div class="ppp-header"><h2>📚 LESSON PLAN ✨</h2></div>
      <div class="ppp-ministry">
        <div style="text-align:center;font-size:11px;line-height:1.8">
          Ministry of Education &amp; Scientific Research<br>
          Directorate: <span style="border-bottom:1px solid #333;display:inline-block;min-width:80px">${esc(dir)||'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</span>
        </div>
        <div class="min-center">Daily Lesson Plan</div>
        <div style="text-align:center;font-size:11px;line-height:1.8">
          School: ${esc(meta.school)||'............................'}<br>
          Teacher: ${esc(meta.teacher)||'............................'}
        </div>
      </div>
      <div class="ppp-meta">
        <span><b>Topic:</b> ${esc(meta.title)}</span>
        <span><b>Grade:</b> ${esc(meta.grade)}${meta.section?' / '+esc(meta.section):''}</span>
        <span><b>Date:</b> ${esc(formatDate(meta.date))}</span>
        <span><b>Period:</b> ${esc(meta.period)||'—'}</span>
      </div>
      <div class="ppp-info-row">
        <div class="ppp-info-cell orange"><b>Period</b><span>${esc(meta.period)||'—'}</span></div>
        <div class="ppp-info-cell blue"><b>Subject</b><span>${esc(meta.subject)||'—'}</span></div>
        <div class="ppp-info-cell green"><b>Teacher</b><span>${esc(meta.teacher)||'—'}</span></div>
        <div class="ppp-info-cell red"><b>School</b><span>${esc(meta.school)||'—'}</span></div>
      </div>
      ${(stratBadges||resBadges)?`<div class="ppp-badges">${stratBadges}${resBadges}</div>`:''}
      <div class="ppp-aims">
        <div class="ppp-aims-hdr">🎯 AIMS: <i>BY the end of the lesson, students will be able to:</i></div>
        <div class="ppp-aims-body"><ul>${aimItems}</ul></div>
      </div>
      <table class="ppp-table">
        <thead><tr>
          <th class="col-stage">Stage</th>
          <th>👩‍🏫 Teacher's role</th>
          <th>👥 Students' role</th>
          <th class="col-time">⏰ Time</th>
        </tr></thead>
        <tbody>${stageRows}</tbody>
      </table>
      <div class="ppp-footer">
        <div class="ppp-hw"><div class="ppp-hw-lbl">🏠 Home assignment</div><p>${esc(data.homeAssignment||'—')}</p></div>
        <div class="ppp-eval"><div class="ppp-eval-lbl">✅ Evaluation</div><div class="ppp-eval-tags">${evalTags||'—'}</div></div>
      </div>
      <div class="ppp-footnote">Subject: ${esc(meta.subject)||'—'} · Grade: ${esc(meta.grade)||'—'}</div>
    </div>`;
  }

  /* ─── Audio Player Renderer — الدرس الصوتي ─── */
  function renderAudioPlayer(rec) {
    const isAr = rec.language !== 'en';
    const gradeLine = [rec.subject, rec.grade, rec.section].filter(Boolean).map(esc).join(' — ');

    // 1) صوت Gemini
    let geminiSection;
    if (rec.geminiBlob) {
      if (rec._geminiUrl) { try { URL.revokeObjectURL(rec._geminiUrl); } catch (e) {} }
      rec._geminiUrl = URL.createObjectURL(rec.geminiBlob);
      geminiSection = `<audio controls preload="metadata" src="${rec._geminiUrl}" class="audio-player"></audio>
        <div class="audio-actions">
          <button class="toolbtn-sm btn-dl-gemini">⬇️ ${isAr?'تنزيل':'Download'}</button>
          <button class="toolbtn-sm btn-video-gemini" style="border-color:#7C3AED;color:#7C3AED;">🎬 ${isAr?'تصدير فيديو':'Export video'}</button>
          <button class="toolbtn-sm btn-gen-gemini-audio">🔄 ${isAr?'إعادة توليد':'Regenerate'}</button>
        </div>`;
    } else {
      geminiSection = `<button class="btn-audio-action btn-gen-gemini-audio">🤖 ${isAr?'توليد الصوت بالذكاء الاصطناعي':'Generate AI voice'}</button>
        <p class="audio-hint">${isAr?'يحتاج مفتاح API يدعم خدمة تحويل النص لصوت في Gemini':'Requires an API key that supports Gemini text-to-speech'}</p>`;
    }

    // 2) تسجيل الأستاذ
    let recordSection;
    if (state.recordingActive) {
      recordSection = `<div class="rec-live"><span class="rec-dot"></span> ${isAr?'جاري التسجيل':'Recording'}... <span id="recordTimer">00:00</span></div>
        <button class="btn-audio-action btn-danger-outline btn-rec-stop">⏹️ ${isAr?'إيقاف':'Stop'}</button>`;
    } else if (state.pendingRecording) {
      const url = URL.createObjectURL(state.pendingRecording.blob);
      recordSection = `<audio controls preload="metadata" src="${url}" class="audio-player"></audio>
        <div class="audio-actions">
          <button class="toolbtn-sm btn-rec-save">✅ ${isAr?'حفظ التسجيل':'Save recording'}</button>
          <button class="toolbtn-sm btn-rec-discard">🗑️ ${isAr?'إعادة التسجيل':'Discard & retry'}</button>
        </div>`;
    } else if (rec.recordedBlob) {
      if (rec._recUrl) { try { URL.revokeObjectURL(rec._recUrl); } catch (e) {} }
      rec._recUrl = URL.createObjectURL(rec.recordedBlob);
      recordSection = `<audio controls preload="metadata" src="${rec._recUrl}" class="audio-player"></audio>
        <div class="audio-actions">
          <button class="toolbtn-sm btn-dl-recorded">⬇️ ${isAr?'تنزيل':'Download'}</button>
          <button class="toolbtn-sm btn-video-recorded" style="border-color:#7C3AED;color:#7C3AED;">🎬 ${isAr?'تصدير فيديو':'Export video'}</button>
          <button class="toolbtn-sm btn-rec-start">🎙️ ${isAr?'إعادة التسجيل':'Re-record'}</button>
        </div>`;
    } else {
      recordSection = `<button class="btn-audio-action btn-rec-start">🎙️ ${isAr?'ابدأ التسجيل بصوتك':'Start recording your voice'}</button>
        <p class="audio-hint">${isAr?'اقرأ النص أعلاه بصوتك أثناء التسجيل':'Read the script above aloud while recording'}</p>`;
    }

    return `
    <div class="audio-card" dir="${isAr ? 'rtl' : 'ltr'}">
      <div class="audio-card-head">
        <span class="audio-icon">🎧</span>
        <div><h2>${esc(rec.title) || ''}</h2><p>${gradeLine}</p></div>
      </div>

      <div class="audio-script-block" id="audioScriptBlock">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3>${isAr ? '📄 نص الدرس الصوتي' : '📄 Audio lesson script'}</h3>
          <div style="display: flex; gap: 8px;">
            <button class="toolbtn-sm btn-edit-script" style="width: auto; padding: 0 10px;">✏️ ${isAr ? 'تعديل' : 'Edit'}</button>
            <button class="toolbtn-sm btn-play-typewriter" style="width: auto; padding: 0 12px; border-color: #7C3AED; color: #7C3AED;">⌨️ ${isAr ? 'تشغيل العرض' : 'Play Animation'}</button>
            <button class="toolbtn-sm btn-fullscreen-tw" style="width: auto; padding: 0 10px;">⛶ ${isAr ? 'ملء الشاشة' : 'Fullscreen'}</button>
          </div>
        </div>

        <div class="typewriter-board" id="twBoard">
          <div class="board-symbols">🔴 🟡 🟢 💡</div>
          <div class="tw-text" id="twText">${esc(rec.script || '')}</div>
        </div>
      </div>


      <div class="audio-source-block">
        <h4>🤖 ${isAr?'صوت Gemini':'Gemini voice'}</h4>
        ${geminiSection}
      </div>
      <div class="audio-source-block">
        <h4>🎙️ ${isAr?'تسجيل صوتك':'Record your voice'}</h4>
        ${recordSection}
      </div>
    </div>`;
  }

  /* ─── تصدير الدرس الصوتي كفيديو جاهز (نص متحرك + الصوت الأصلي، بدون إنترنت) ─── */
  function bestVideoMime() {
    const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    return candidates.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported?.(m)) || 'video/webm';
  }
  // يلف النص عربيًا/إنجليزيًا داخل الكانفس ويرجع عدد الأسطر التي رسمها
  function wrapAndDrawCanvasText(ctx, text, cx, topY, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    // نعرض فقط آخر عدد أسطر يسمح بها الارتفاع، كأن السبورة "تتمرّر" تلقائيًا مع الحديث
    const visible = lines.slice(-maxLines);
    visible.forEach((l, i) => ctx.fillText(l, cx, topY + i * lineHeight));
    return visible.length;
  }

  async function exportAudioAsVideo(sourceBlob, titleText, scriptText, isAr) {
    if (!sourceBlob) { toast(isAr ? 'لا يوجد ملف صوتي لتصديره' : 'No audio file to export', 'error'); return; }
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      toast(isAr ? 'المتصفح الحالي لا يدعم تصدير الفيديو' : 'This browser does not support video export', 'error');
      return;
    }

    const audioUrl = URL.createObjectURL(sourceBlob);
    const audioEl = new Audio();
    audioEl.src = audioUrl;
    audioEl.preload = 'auto';

    await new Promise((resolve, reject) => {
      audioEl.addEventListener('loadedmetadata', resolve, { once: true });
      audioEl.addEventListener('error', () => reject(new Error('audio_load_fail')), { once: true });
    }).catch(() => { toast(isAr ? 'تعذر قراءة الملف الصوتي' : 'Could not read the audio file', 'error'); });

    if (!audioEl.duration || isNaN(audioEl.duration) || !isFinite(audioEl.duration)) {
      toast(isAr ? 'تعذر تحديد مدة الصوت' : 'Could not determine audio duration', 'error');
      URL.revokeObjectURL(audioUrl);
      return;
    }

    showOverlay(isAr ? 'جاري تجهيز الفيديو... 0%' : 'Preparing video... 0%');

    // --- إعداد الكانفس (لوحة الفيديو المرسومة) — دقة 450p تكفي تماماً لمحتوى نصي وتقلل الحجم كثيراً ---
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 450;
    const ctx = canvas.getContext('2d');
    const words = (scriptText || '').replace(/\s+/g, ' ').trim();
    const dir = isAr ? 'rtl' : 'ltr';

    // --- توجيه الصوت إلى مسار قابل للتسجيل عبر Web Audio API ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const sourceNode = audioCtx.createMediaElementSource(audioEl);
    const destNode = audioCtx.createMediaStreamDestination();
    sourceNode.connect(destNode);
    sourceNode.connect(audioCtx.destination); // ليسمع المعلم التقدّم أثناء التصدير

    const videoStream = canvas.captureStream(12); // 12fps كافٍ تماماً لمحتوى شبه ثابت (نص يتكشف تدريجياً)، ويقلل حجم الملف كثيراً دون التأثير على الوضوح
    const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...destNode.stream.getAudioTracks()]);

    const mimeType = bestVideoMime();
    // بت‌ريت ديناميكي: مع دقة 450p (أقل من ثلث بكسلات 720p)، نستهدف حجماً أصغر مع وضوح جيد.
    const TARGET_TOTAL_MB = 12;
    const AUDIO_BPS = 96000; // جودة صوت جيدة بحجم صغير
    const durationSec = Math.max(audioEl.duration || 60, 1);
    const targetTotalBits = TARGET_TOTAL_MB * 8 * 1024 * 1024;
    let videoBitsPerSecond = Math.floor((targetTotalBits - AUDIO_BPS * durationSec) / durationSec);
    videoBitsPerSecond = Math.max(100000, Math.min(videoBitsPerSecond, 500000)); // حدود دنيا/عليا مناسبة لدقة 450p
    const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond, audioBitsPerSecond: AUDIO_BPS });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };

    let rafId = null;
    function drawFrame() {
      const progress = Math.max(0, Math.min(audioEl.currentTime / audioEl.duration, 1));

      // خلفية متدرجة أنيقة
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#4c1d95');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

      // العنوان
      ctx.direction = dir;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#facc15';
      ctx.font = "bold 26px 'CairoEB', 'Tajawal', sans-serif";
      ctx.fillText(titleText || (isAr ? 'الدرس الصوتي' : 'Audio Lesson'), canvas.width / 2, 56);

      // لوحة النص المتحرك (بما يوازي مكان الوصول في الصوت)
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(50, 88, canvas.width - 100, 269);
      ctx.strokeStyle = 'rgba(250,204,21,0.4)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(50, 88, canvas.width - 100, 269);

      ctx.fillStyle = '#f8fafc';
      ctx.font = "19px 'Tajawal', 'CairoEB', sans-serif";
      const visibleChars = Math.round(progress * words.length);
      const shownText = words.slice(0, visibleChars);
      ctx.save();
      ctx.beginPath(); ctx.rect(50, 88, canvas.width - 100, 269); ctx.clip();
      wrapAndDrawCanvasText(ctx, shownText, canvas.width / 2, 119, canvas.width - 138, 29, 8);
      ctx.restore();

      // شريط تقدّم أسفل الفيديو
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(50, 388, canvas.width - 100, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(50, 388, (canvas.width - 100) * progress, 6);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = "13px 'Tajawal', sans-serif";
      const mm = String(Math.floor(audioEl.currentTime / 60)).padStart(2, '0');
      const ss = String(Math.floor(audioEl.currentTime % 60)).padStart(2, '0');
      const dmm = String(Math.floor(audioEl.duration / 60)).padStart(2, '0');
      const dss = String(Math.floor(audioEl.duration % 60)).padStart(2, '0');
      ctx.fillText(`${mm}:${ss} / ${dmm}:${dss}`, canvas.width / 2, 413);

      showOverlay((isAr ? 'جاري تجهيز الفيديو... ' : 'Preparing video... ') + Math.round(progress * 100) + '%');

      if (!audioEl.ended && progress < 1) rafId = requestAnimationFrame(drawFrame);
    }

    const finalize = () => new Promise(resolve => {
      recorder.onstop = () => {
        const outMime = mimeType.split(';')[0];
        const videoBlob = new Blob(chunks, { type: outMime });
        const ext = outMime.includes('mp4') ? '.mp4' : '.webm';
        downloadBlob(videoBlob, sanitizeFilename(titleText || 'درس-صوتي') + ext);
        resolve();
      };
      recorder.stop();
    });

    recorder.start(500);
    drawFrame();
    try { await audioEl.play(); } catch (e) { /* تشغيل تلقائي قد يحتاج تفاعل، لكن الزر نفسه يُعتبر تفاعلاً */ }

    await new Promise(resolve => {
      audioEl.addEventListener('ended', resolve, { once: true });
    });

    if (rafId) cancelAnimationFrame(rafId);
    await finalize();

    hideOverlay();
    toast(isAr ? '✅ تم تصدير الفيديو بنجاح' : '✅ Video exported successfully', 'success');

    try { sourceNode.disconnect(); } catch (e) {}
    try { audioCtx.close(); } catch (e) {}
    URL.revokeObjectURL(audioUrl);
  }

  /* ─── تسجيل صوت الأستاذ عبر الميكروفون ─── */
  let mediaRecorder = null, recordedChunks = [], recordStream = null, recordTimerInt = null, recordStartTs = 0;
  function bestAudioMime() {
    const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
    return candidates.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported?.(m)) || '';
  }
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast('التسجيل الصوتي غير مدعوم في هذا المتصفح', 'error'); return;
    }
    try { recordStream = await navigator.mediaDevices.getUserMedia({ audio:true }); }
    catch (e) { toast('تعذر الوصول للميكروفون — تحقق من إذن التطبيق للميكروفون', 'error'); return; }
    recordedChunks = [];
    const mime = bestAudioMime();
    mediaRecorder = new MediaRecorder(recordStream, mime ? { mimeType: mime } : undefined);
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      recordStream.getTracks().forEach(t => t.stop());
      const outMime = mediaRecorder.mimeType || mime || 'audio/webm';
      state.pendingRecording = { blob: new Blob(recordedChunks, { type: outMime }), mime: outMime };
      renderResult();
    };
    mediaRecorder.start();
    recordStartTs = Date.now();
    state.recordingActive = true;
    renderResult();
    recordTimerInt = setInterval(() => {
      const el = $('#recordTimer'); if (!el) return;
      const s = Math.floor((Date.now() - recordStartTs) / 1000);
      el.textContent = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
    }, 500);
  }
  function stopRecording() {
    clearInterval(recordTimerInt);
    state.recordingActive = false;
    try { mediaRecorder?.stop(); } catch (e) {}
  }
  function discardRecording() { state.pendingRecording = null; renderResult(); }
  async function saveRecording() {
    const rec = state.currentRecord;
    if (!rec || !state.pendingRecording) return;
    rec.recordedBlob = state.pendingRecording.blob; rec.recordedMime = state.pendingRecording.mime;
    rec.updatedAt = Date.now();
    try { await dbPut(LESSONS_STORE, rec); } catch (e) {}
    state.pendingRecording = null;
    renderResult(); toast('تم حفظ تسجيلك ✓', 'success');
  }

  /* ─── Whiteboard Renderer — سبورة الدرس (شكل سبورة صف حقيقية) ─── */
  function renderBoard(data, meta) {
    const lang = meta.language || 'ar';
    const isAr = lang === 'ar';
    const theme = ['green','wood','white'].includes(meta.boardTheme) ? meta.boardTheme : 'green';
    const ICONS = ['📌','🧠','📊','🔬','⚙️','🧩','🧪','📚'];
    const CHALK = ['chalk-yellow','chalk-cyan','chalk-pink','chalk-green'];
    const sections = data.sections || [];
    const sectionsHtml = sections.map((s, i) => {
      const icon = ICONS[i % ICONS.length];
      const colorCls = CHALK[i % CHALK.length];
      let body = '';
      if (s.tableHeaders?.length && s.tableRows?.length) {
        body += `<table class="board-table">
          <thead><tr>${s.tableHeaders.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${s.tableRows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
      }
      if (s.items?.length) {
        body += `<ul class="board-list">${s.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
      }
      if (!body) body = `<p class="cell-empty">${isAr ? '—' : '—'}</p>`;
      return `<div class="board-section">
        <h3 class="board-section-title ${colorCls}"><span class="board-section-num">${i+1}.</span> ${icon} ${esc(s.title || '')}</h3>
        ${body}
      </div>`;
    }).join('');
    const gradeLine = [meta.subject, meta.grade, meta.section].filter(Boolean).map(esc).join(' — ');
    return `
    <div class="plan-board board-theme-${theme}" dir="${isAr ? 'rtl' : 'ltr'}">
      <div class="board-frame">
        <div class="board-toprow">
          <span>${esc(meta.school) || ''}</span>
          <span>${isAr ? 'الأستاذ' : 'Teacher'}${meta.teacher ? '/' + esc(meta.teacher) : ''}</span>
        </div>
        <h2 class="board-maintitle">${isAr ? 'ملخص درس' : 'Lesson Summary'}: ${esc(meta.title) || ''}</h2>
        <div class="board-subrow">${gradeLine}${meta.date ? ' — ' + esc(formatDate(meta.date)) : ''}</div>
        <div class="board-sections">${sectionsHtml}</div>
      </div>
      <div class="board-tray">
        <span class="tray-eraser"></span>
        <span class="tray-chalk c1"></span><span class="tray-chalk c2"></span>
        <span class="tray-chalk c3"></span><span class="tray-chalk c4"></span>
      </div>
    </div>`;
  }

  /* ─── الخريطة الذهنية — التوليد والرسم عبر Mermaid ─── */
  async function onGenerateMindmap() {
    const meta = gatherMeta();
    if (!meta.title) { toast('الرجاء إدخال عنوان الدرس', 'error'); return; }
    if (!state.settings.apiKey) { toast('الرجاء إدخال مفتاح API', 'error'); navigate('settings'); populateSettingsForm(); return; }
    const content = getContentText(), lang = state.language;
    const primary = state.settings.defaultModel || 'gemini-3.5-flash';
    showOverlay('جاري إعداد الخريطة الذهنية...');
    let result;
    try { result = await callWithFallback(primary, buildMindmapSystem(lang), buildUser(meta, content, lang), MINDMAP_SCHEMA); }
    catch (e) { hideOverlay(); handleGenError(e); return; }
    const rec = {
      kind:'mindmap',
      title:meta.title, subject:meta.subject, grade:meta.grade, section:meta.section,
      school:meta.school, teacher:meta.teacher, directorate:meta.directorate,
      period:meta.period, date:meta.date,
      language:lang, sourceType:meta.sourceType, extractedText:content,
      mindmapData:result.data, editedHtml:null,
      model:result.model, createdAt:Date.now(), updatedAt:Date.now()
    };
    try { rec.id = await dbAdd(LESSONS_STORE, rec); } catch (e) {}
    hideOverlay();
    state.currentRecord = rec;
    navigate('result');
    renderResult();
    toast('تم إعداد الخريطة الذهنية بنجاح ✓', 'success');
  }

  function sanitizeMermaidText(s) {
    // Mermaid يفهم النص بين علامتي اقتباس مزدوجتين؛ نزيل أي علامات قد تكسر التركيب ونمنع الأسطر المتعددة
    return String(s || '').replace(/"/g, '\u201C').replace(/[\n\r]+/g, ' ').replace(/#/g, '').trim().slice(0, 140) || '—';
  }
  function buildMermaidFromMindmap(tree) {
    // 💡 استخدام الاتجاه الأفقي (LR) دائماً لأنه الأفضل والأكثر ترتيباً للخرائط العميقة (4 مستويات)
    const lines = ['flowchart LR'];
    const classAssign = [];
    
    lines.push(`  root["${sanitizeMermaidText(tree?.root)}"]`);
    classAssign.push('class root rootNode');

    // دالة تكرارية لرسم الفروع والأحفاد تلقائياً أياً كان عمقها
    function traverseBranches(nodes, parentId, level) {
      (nodes || []).forEach((n, i) => {
        const nId = `${parentId}_${i}`;
        lines.push(`  ${nId}["${sanitizeMermaidText(n.title)}"]`);
        lines.push(`  ${parentId} --> ${nId}`);
        
        // تعيين الكلاسات حسب العمق لتصغير الحجم تدريجياً
        if (level === 1) classAssign.push(`class ${nId} branchNode`);
        else if (level === 2) classAssign.push(`class ${nId} subNode`);
        else classAssign.push(`class ${nId} leafNode`);

        if (n.children && n.children.length > 0) {
          traverseBranches(n.children, nId, level + 1);
        }
      });
    }

    traverseBranches(tree?.branches || [], 'root', 1);

    // 💡 تنسيقات مضغوطة جداً للخرائط    // 💡 تنسيقات شديدة الانضغاط مع إجبار الخط ليكون عريضاً (Bold)
    lines.push('  classDef rootNode fill:#0F766E,color:#ffffff,stroke:#0F766E,stroke-width:1.5px,rx:4,ry:4,padding:4px,font-weight:900;');
    lines.push('  classDef branchNode fill:#CCFBF1,color:#134E4A,stroke:#0F766E,stroke-width:1px,rx:3,ry:3,padding:3px,font-weight:bold;');
    lines.push('  classDef subNode fill:#F0FDFA,color:#134E4A,stroke:#5EEAD4,stroke-width:1px,rx:2,ry:2,padding:2px,font-weight:bold;');
    lines.push('  classDef leafNode fill:#ffffff,color:#334155,stroke:#CBD5E1,stroke-width:1px,rx:2,ry:2,padding:2px,font-weight:bold;');

    
    // 💡 خطوط ربط رفيعة جداً لعدم أخذ مساحة
    lines.push('  linkStyle default stroke:#0F766E,stroke-width:1px;');
    lines.push(...classAssign);
    
    return lines.join('\n');
  }

    async function renderMermaidSVG(mermaidText) {
    if (typeof mermaid === 'undefined') { const e = new Error('MERMAID_MISSING'); throw e; }
    const mmFontFamily = "'Amiri', 'Amiri-Bold', 'Cairo', sans-serif";
    
    // 💡 التعديل هنا: إضافة htmlLabels: false لمنع استخدام العناصر المحظورة أثناء التصدير
    mermaid.initialize({
      startOnLoad:false, theme:'base', securityLevel:'loose', 
      htmlLabels: false, 
      // 💡 ضغط رهيب للمسافات الأفقية (rankSpacing) والعمودية (nodeSpacing) بين المربعات
      flowchart:{ htmlLabels: false, curve:'basis', nodeSpacing: 6, rankSpacing: 15 }, 
      themeVariables:{ fontFamily:mmFontFamily, fontSize:'12px' }
    });

    
    const renderId = 'mmd_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    
    const result = mermaid.render(renderId, mermaidText);
    let svg;
    if (result && typeof result.then === 'function') { svg = (await result).svg; }
    else {
      svg = await new Promise((resolve, reject) => {
        try { mermaid.render(renderId, mermaidText, s => resolve(s)); } catch (e) { reject(e); }
      });
    }
    // تثبيت الخط والوزن الغامق مباشرة على عناصر النص
    svg = svg.replace(/<svg /, `<svg style="font-family:${mmFontFamily};" `)
             .replace(/<style>/, `<style>
             .node text, .node tspan, .nodeLabel, foreignObject div, foreignObject span { font-family:${mmFontFamily} !important; font-weight:bold !important; font-size:12px !important; line-height: 1.2 !important; }
             .rootNode text, .rootNode tspan, .rootNode .nodeLabel, .rootNode foreignObject div, .rootNode foreignObject span { font-size:14px !important; font-weight:900 !important; }
             `);
             
    return svg;
  }
  function renderMindmapView(rec) {
    const isAr = rec.language !== 'en';
    const gradeLine = [rec.subject, rec.grade, rec.section].filter(Boolean).map(esc).join(' — ');
    return `
    <div class="plan-mindmap" dir="${isAr ? 'rtl' : 'ltr'}">
      <div class="mindmap-header">
        <h2>${esc(rec.title) || ''}</h2>
        ${gradeLine ? `<div class="mindmap-sub">${gradeLine}</div>` : ''}
      </div>
      <div class="mindmap-canvas" id="mindmapCanvas">
        <div class="mindmap-loading">⏳ ${isAr ? 'جارٍ رسم الخريطة الذهنية...' : 'Drawing mind map...'}</div>
      </div>
    </div>`;
  }

    async function mountMindmapSvg(rec) {
    const canvas = $('#mindmapCanvas');
    if (!canvas || !rec?.mindmapData) return;
    const isAr = rec.language !== 'en';
    try {
      const mermaidText = buildMermaidFromMindmap(rec.mindmapData);
      const svg = await renderMermaidSVG(mermaidText);
      canvas.innerHTML = svg;
      const svgEl = canvas.querySelector('svg');
      if (svgEl) {
        svgEl.removeAttribute('width'); 
        svgEl.removeAttribute('height');
        
        // 💡 إجبار الخريطة على الانكماش التلقائي والظهور كاملة دون خروج أطرافها
        svgEl.style.width = '100%'; 
        svgEl.style.height = '100%'; 
        svgEl.style.maxHeight = '65vh'; // ألا تتجاوز 65% من طول شاشة الهاتف لتظهر كاملة
        svgEl.style.objectFit = 'contain'; // سر الاحتواء وعدم القص
        svgEl.style.background = '#ffffff';
        
        // الحفاظ على النسبة والتناسب لـ SVG
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // تفعيل خصائص اللمس للتكبير والتحريك في حال أراد الطالب تقريب جزء معين
        svgEl.style.touchAction = 'pan-x pan-y pinch-zoom';
      }
    } catch (e) {
      const missing = typeof mermaid === 'undefined';
      canvas.innerHTML = `<div class="mindmap-error">⚠️ ${isAr ? 'تعذر رسم الخريطة الذهنية' : 'Could not draw the mind map'}${missing ? (isAr ? ' (مكتبة الرسم غير موجودة)' : ' (drawing library missing)') : ''}</div>`;
    }
  }

  // يحوّل SVG المرسوم إلى صورة PNG حقيقية بخلفية بيضاء (بدل الاعتماد على html2canvas غير الموثوق مع SVG)
  function svgToPngCanvas(svgEl, scale) {
    return new Promise((resolve, reject) => {
      try {
        const clone = svgEl.cloneNode(true);
        const bbox = svgEl.getBoundingClientRect();
        const w = Math.max(200, Math.ceil(bbox.width) || 900);
        const h = Math.max(150, Math.ceil(bbox.height) || 600);
        clone.setAttribute('width', w);
        clone.setAttribute('height', h);
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
        bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%');
        bg.setAttribute('fill', '#ffffff');
        clone.insertBefore(bg, clone.firstChild);
        const svgData = new XMLSerializer().serializeToString(clone);
        const svgBlob = new Blob([svgData], { type:'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = w * scale; canvas.height = h * scale;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas);
        };
        img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
      } catch (e) { reject(e); }
    });
  }

  async function exportMindmapAsImage() {
    const svgEl = document.querySelector('#mindmapCanvas svg');
    if (!svgEl) { toast('الخريطة غير جاهزة بعد', 'error'); return; }
    showOverlay('جاري إنشاء الصورة...');
    try {
      const canvas = await svgToPngCanvas(svgEl, 2.5);
      canvas.toBlob(blob => {
        hideOverlay();
        if (!blob) { toast('فشل التصدير', 'error'); return; }
        downloadBlob(blob, sanitizeFilename(state.currentRecord?.title) + '-خريطة-ذهنية.png');
        toast('تم تصدير الصورة ✓', 'success');
      }, 'image/png');
    } catch (e) { hideOverlay(); toast('تعذر تصدير الصورة', 'error'); }
  }

  async function exportMindmapAsPdf() {
    const svgEl = document.querySelector('#mindmapCanvas svg');
    if (!svgEl) { toast('الخريطة غير جاهزة بعد', 'error'); return; }
    if (typeof html2pdf === 'undefined') { toast('تعذر تحميل مكوّن PDF', 'error'); return; }
    showOverlay('جاري إنشاء PDF...');
    try {
      const canvas = await svgToPngCanvas(svgEl, 2.5);
      const mmPerPx = 25.4 / 96;
      const wMM = (canvas.width / 2.5) * mmPerPx, hMM = (canvas.height / 2.5) * mmPerPx;
      const orientation = wMM >= hMM ? 'landscape' : 'portrait';
      const holder = document.createElement('div');
      Object.assign(holder.style, { position:'fixed', left:'-99999px', top:'0', width:wMM + 'mm', height:hMM + 'mm', background:'#ffffff' });
      const imgTag = document.createElement('img');
      imgTag.src = canvas.toDataURL('image/jpeg', 0.97);
      Object.assign(imgTag.style, { width:'100%', height:'100%', display:'block' });
      holder.appendChild(imgTag);
      document.body.appendChild(holder);
      const filename = sanitizeFilename(state.currentRecord?.title) + '-خريطة-ذهنية.pdf';
      const opts = { margin:0, filename, image:{ type:'jpeg', quality:0.97 }, html2canvas:{ scale:2, backgroundColor:'#ffffff' }, jsPDF:{ unit:'mm', format:[wMM, hMM], orientation } };
      const blob = await html2pdf().set(opts).from(holder).toPdf().output('blob');
      document.body.removeChild(holder);
      downloadBlob(blob, filename);
      hideOverlay(); toast('تم تصدير PDF ✓', 'success');
    } catch (e) { hideOverlay(); toast('تعذر التصدير', 'error'); }
  }

  /* ─── توليد عرض تقديمي (PPTX) من السبورة ─── */
  const PPTX_SLIDE_PX = { w: 1280, h: 720 }; // يطابق نسبة 13.333×7.5 إنش (16:9) بدقة 96dpi
  const PPTX_TRANSITION_XML = {
    fade: '<p:transition spd="med"><p:fade/></p:transition>',
    push: '<p:transition spd="med"><p:push dir="l"/></p:transition>',
    wipe: '<p:transition spd="med"><p:wipe dir="u"/></p:transition>',
    cut:  '<p:transition spd="fast"><p:cut/></p:transition>'
  };
  const PPTX_TRANSITION_KEYS = ['fade','push','wipe','cut'];
  // ألوان نصية مناسبة لكل ثيم (فاتحة على خلفية داكنة، داكنة على خلفية فاتحة) + لون صلب احتياطي لو تعذّر التقاط صورة الخلفية
  const PPTX_THEME_STYLES = {
    green:    { bg:'1C3D2B', title:'FFE066', text:'F3F1E9', sub:'FFE27A' },
    wood:     { bg:'6B4A28', title:'FFD54A', text:'FFF8EA', sub:'FFE6B3' },
    white:    { bg:'FFFFFF', title:'1D4ED8', text:'22303C', sub:'2563EB' },
    navy:     { bg:'0E1830', title:'FDE68A', text:'EEF1F7', sub:'7DD3FC' },
    graphite: { bg:'2A2E34', title:'FFD54A', text:'F2F3F5', sub:'FFD54A' },
    paper:    { bg:'FBF5E9', title:'92400E', text:'4A3B22', sub:'B45309' }
  };

  function openPptxSettingsModal() {
    const rec = state.currentRecord;
    if (!rec || rec.kind !== 'board') return;
    if (typeof PptxGenJS === 'undefined' || typeof JSZip === 'undefined') {
      toast('ملفات العرض التقديمي غير مُثبَّتة (pptxgen.min.js / jszip.min.js) — راجع تعليمات التثبيت', 'error');
      return;
    }
    $('#pptxBackground').value = ['green','wood','white','navy','graphite','paper'].includes(rec.boardTheme) ? rec.boardTheme : 'green';
    $('#pptxSettingsModal').classList.add('is-active');
  }

  // يلتقط خلفية ثيم معيّن (فارغة من أي نص) كصورة، لاستخدامها خلفية موحّدة لكل شرائح العرض
  async function captureThemeBackground(theme) {
    const container = document.createElement('div');
    Object.assign(container.style, {
      position:'fixed', left:'-9999px', top:'0', zIndex:'-1',
      width:PPTX_SLIDE_PX.w+'px', height:PPTX_SLIDE_PX.h+'px', overflow:'hidden'
    });
    container.innerHTML = `<div class="plan-board board-theme-${theme} pptx-bg-capture"><div class="board-frame"></div></div>`;
    document.body.appendChild(container);
    // نضمن اكتمال الرسم (تخطيط + خطوط) قبل الالتقاط
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    let canvas;
    try {
      canvas = await html2canvas(container, {
        scale:1, useCORS:true, allowTaint:true, width:PPTX_SLIDE_PX.w, height:PPTX_SLIDE_PX.h
      });
      return canvas.toDataURL('image/png').replace(/^data:/, ''); // pptxgenjs يتوقع "mime;base64,..." بدون بادئة "data:"
    } catch (e) {
      console.error('[pptx] فشل التقاط خلفية الثيم', theme, e);
      throw e;
    } finally {
      document.body.removeChild(container);
    }
  }

  // يبني ملف PPTX فعليًا من الشرائح المُكيَّفة
  async function buildPptxFile(rec, slides, opts) {
    const { fontSize, bgImageData, bgTheme, lang } = opts;
    const isAr = lang !== 'en';
    const align = isAr ? 'right' : 'left';
    const fontFace = 'Arial';
    const titleFont = Math.min(70, fontSize + 14);
    const theme = PPTX_THEME_STYLES[bgTheme] || PPTX_THEME_STYLES.green;
    // لو تعذّر التقاط صورة الخلفية، نستخدم لون صلب مطابق للثيم بدل إيقاف الميزة كاملة
    const bgProp = bgImageData ? { data: bgImageData } : { color: theme.bg };
    const accentColor = theme.sub;
    const barX = isAr ? 12.1 : 0.6; // الشريط الزخرفي يوضع بجانب العنوان حسب اتجاه اللغة

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name:'LESSON_16x9', width:13.333, height:7.5 });
    pptx.layout = 'LESSON_16x9';
    pptx.rtlMode = isAr;
    pptx.title = rec.title || (isAr ? 'عرض تقديمي' : 'Presentation');

    const slideNumberProps = { x:12.7, y:7.05, w:0.5, h:0.35, fontSize:11, color:theme.text, align:'center' };

    // شريحة العنوان الرئيسية (تشبه ترويسة السبورة)
    const cover = pptx.addSlide();
    cover.background = bgProp;
    cover.addShape('rect', { x:0, y:3.55, w:13.333, h:0.06, fill:{ color:accentColor } });
    cover.addText(rec.title || '', {
      x:0.5, y:2.5, w:12.33, h:1.0, align:'center', fontSize:Math.min(70, titleFont + 6),
      bold:true, color:theme.title, fontFace, rtlMode:isAr
    });
    const subLine = [rec.subject, rec.grade, rec.section].filter(Boolean).join(' — ');
    if (subLine) cover.addText(subLine, {
      x:0.5, y:3.75, w:12.33, h:0.6, align:'center', fontSize:24, color:theme.sub, fontFace, rtlMode:isAr
    });
    const footLine = [rec.school, rec.teacher ? (isAr ? 'أ/' + rec.teacher : rec.teacher) : ''].filter(Boolean).join(' — ');
    if (footLine) cover.addText(footLine, {
      x:0.5, y:6.6, w:12.33, h:0.5, align:'center', fontSize:16, color:theme.text, fontFace, rtlMode:isAr
    });

    // شريحة "محاور الدرس" — فهرس تلقائي من عناوين الشرائح (بلا تكرار "تابع")
    const agendaTitles = [];
    slides.forEach(s => {
      const base = (s.title || '').replace(/\s*\((تابع|cont\.)\)\s*$/i, '').trim();
      if (base && !agendaTitles.includes(base)) agendaTitles.push(base);
    });
    if (agendaTitles.length > 1) {
      const agendaSlide = pptx.addSlide();
      agendaSlide.background = bgProp;
      agendaSlide.addText(isAr ? 'محاور الدرس' : 'Lesson Outline', {
        x:0.6, y:0.5, w:12.1, h:1.0, align, fontSize:titleFont, bold:true, color:theme.title, fontFace, rtlMode:isAr
      });
      agendaSlide.addShape('rect', { x:barX - (isAr?0:0), y:1.5, w:isAr?0.06:0.06, h:5.2, fill:{ color:accentColor } });
      const agendaRuns = agendaTitles.map(t => ({ text:t, options:{ bullet:{ code:'2022' }, breakLine:true } }));
      agendaSlide.addText(agendaRuns, {
        x:0.9, y:1.7, w:11.5, h:5.0, align, fontSize:Math.max(24, fontSize - 4), color:theme.text, fontFace,
        valign:'top', rtlMode:isAr, lineSpacingMultiple:1.6
      });
      agendaSlide.slideNumber = slideNumberProps;
    }

    slides.forEach((s, idx) => {
      const slide = pptx.addSlide();
      slide.background = bgProp;
      slide.addText(s.title || '', {
        x:0.6, y:0.35, w:12.1, h:1.0, align, fontSize:titleFont, bold:true, color:theme.title, fontFace, rtlMode:isAr
      });
      // شريط زخرفي أسفل العنوان مباشرة لفصل بصري أوضح بين العنوان والمحتوى
      slide.addShape('rect', { x:0.6, y:1.32, w: s.tableHeaders?.length ? 12.1 : 3.2, h:0.05, fill:{ color:accentColor } });

      if (s.tableHeaders?.length && s.tableRows?.length) {
        const rows = [
          s.tableHeaders.map(h => ({ text:h, options:{ bold:true, color:'FFFFFF', fill:{ color:accentColor || '333333' }, fontFace } }))
        ].concat(s.tableRows.map((r, ri) => r.map(c => ({
          text:c, options:{ color:'2b2b2b', fill:{ color: ri % 2 === 0 ? 'FFFFFF' : 'F3F3F3' } }
        }))));
        slide.addTable(rows, {
          x:0.6, y:1.55, w:12.1, h:5.3, fontSize:Math.max(18, fontSize - 8), fontFace,
          align, rtlMode:isAr, valign:'middle', fill:{ color:'FFFFFF' },
          border:{ type:'solid', color:'CCCCCC', pt:1 }
        });
      } else if (s.bullets?.length) {
        const textRuns = s.bullets.map(b => ({ text:b, options:{ bullet:{ code:'2022' }, breakLine:true } }));
        slide.addText(textRuns, {
          x:0.6, y:1.55, w:12.1, h:5.3, align, fontSize, color:theme.text, fontFace,
          valign:'top', rtlMode:isAr, lineSpacingMultiple:1.3
        });
      }

      // شريحة "تابع" من نفس القسم — أضف مؤشر ترقيم صغير أسفل الشريحة لسياق أوضح للطالب
      if (agendaTitles.length > 1) {
        slide.addText(`${idx + 1} / ${slides.length}`, {
          x:0.6, y:7.05, w:2.0, h:0.35, align:isAr?'right':'left', fontSize:11, color:theme.text, fontFace, rtlMode:isAr
        });
      }

      // ملاحظات المتحدث — الشرح الكامل الموسّع لنفس محتوى الشريحة، يقرأها المعلم أثناء العرض
      if (s.notes) slide.addNotes(s.notes);

      slide.slideNumber = slideNumberProps;
    });

    // شريحة ختامية بسيطة
    const closing = pptx.addSlide();
    closing.background = bgProp;
    closing.addShape('rect', { x:0, y:3.55, w:13.333, h:0.06, fill:{ color:accentColor } });
    closing.addText(isAr ? 'شكرًا لكم' : 'Thank You', {
      x:0.5, y:2.9, w:12.33, h:1.2, align:'center', fontSize:Math.min(60, titleFont), bold:true, color:theme.title, fontFace, rtlMode:isAr
    });
    if (footLine) closing.addText(footLine, {
      x:0.5, y:3.75, w:12.33, h:0.5, align:'center', fontSize:16, color:theme.text, fontFace, rtlMode:isAr
    });

    return await pptx.write({ outputType:'blob' });
  }

  // يفتح ملف PPTX الناتج كأرشيف ZIP ويحقن انتقال حقيقي (XML قياسي) في كل شريحة
  async function injectTransitions(pptxBlob, transitionKey, slideCount) {
    const zip = await JSZip.loadAsync(pptxBlob);
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => parseInt(a.match(/slide(\d+)\.xml/)[1]) - parseInt(b.match(/slide(\d+)\.xml/)[1]));

    for (const name of slideFiles) {
      let xml = await zip.file(name).async('string');
      const key = transitionKey === 'random'
        ? PPTX_TRANSITION_KEYS[Math.floor(Math.random() * PPTX_TRANSITION_KEYS.length)]
        : (PPTX_TRANSITION_XML[transitionKey] ? transitionKey : 'fade');
      const frag = PPTX_TRANSITION_XML[key] || PPTX_TRANSITION_XML.fade;
      if (xml.includes('</p:clrMapOvr>')) xml = xml.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + frag);
      else if (xml.includes('</p:cSld>')) xml = xml.replace('</p:cSld>', '</p:cSld>' + frag);
      zip.file(name, xml);
    }
    return await zip.generateAsync({
      type:'blob',
      mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
  }

  async function onGeneratePptx() {
    const rec = state.currentRecord;
    if (!rec || rec.kind !== 'board') return;
    if (typeof PptxGenJS === 'undefined' || typeof JSZip === 'undefined') {
      toast('ملفات العرض التقديمي غير مُثبَّتة (pptxgen.min.js / jszip.min.js)', 'error');
      return;
    }
    if (!state.settings.apiKey) { toast('أدخل مفتاح API أولاً', 'error'); return; }

    const fontSize   = parseInt($('#pptxFontSize').value) || 36;
    const bgTheme    = $('#pptxBackground').value || 'green';
    const transition = $('#pptxTransition').value || 'fade';
    $('#pptxSettingsModal').classList.remove('is-active');

    const d = (rec.showTranslation && rec.translatedData) ? rec.translatedData : rec.planData;
    const sections = d?.sections || [];
    if (!sections.length) { toast('لا يوجد محتوى في السبورة', 'error'); return; }
    const lang = rec.language || 'ar';

    showOverlay('جاري إعادة صياغة المحتوى للعرض...');
    const primary = state.settings.defaultModel || 'gemini-3.5-flash';
    let result;
    try { result = await callWithFallback(primary, buildPptxSystem(lang), buildPptxUser(sections, rec.title, lang), PPTX_SCHEMA); }
    catch (e) { hideOverlay(); handleGenError(e); return; }
    const slides = result.data?.slides || [];
    if (!slides.length) { hideOverlay(); toast('تعذر إعداد محتوى العرض', 'error'); return; }

    showOverlay('جاري تجهيز خلفية الشرائح...');
    // لو فشل التقاط صورة الخلفية (مثلاً بيئة بلا دعم كامل لـ html2canvas)، نكمل بلون صلب بديل بدل إيقاف الميزة
    let bgImageData = null;
    try { bgImageData = await captureThemeBackground(bgTheme); }
    catch (e) { toast('تعذّر التقاط صورة الخلفية بدقة — سيُستخدم لون خلفية بديل', 'error'); }

    showOverlay('جاري بناء ملف PowerPoint...');
    try {
      const pptxBlob = await buildPptxFile(rec, slides, { fontSize, bgImageData, bgTheme, lang });
      const finalBlob = await injectTransitions(pptxBlob, transition, slides.length);

      downloadBlob(finalBlob, sanitizeFilename(rec.title) + '.pptx');
      hideOverlay();
      toast('تم توليد العرض التقديمي ✓', 'success');
    } catch (e) {
      hideOverlay();
      console.error('[pptx] فشل بناء/تجميع ملف PowerPoint', e);
      toast('تعذر إنشاء ملف PowerPoint', 'error');
    }
  }

  /* ─── Translation — ترجمة حقول بعينها فقط ─── */
  async function translatePlan() {
    const rec = state.currentRecord;
    if (!rec || rec.language !== 'en' || rec.isDoc) return;
    // تبديل ذهاباً وإياباً إذا كانت الترجمة موجودة
    if (rec.translatedData) {
      rec.showTranslation = !rec.showTranslation;
      renderResult();
      toast(rec.showTranslation ? 'عرض الترجمة العربية' : 'عرض الأصل الإنجليزي', 'success');
      return;
    }
    if (!state.settings.apiKey) { toast('أدخل مفتاح API أولاً', 'error'); return; }
    const isBoard = rec.kind === 'board';
    const isQuiz = rec.kind === 'quiz';
    showOverlay(isQuiz ? 'جاري ترجمة الملخص التفاعلي إلى العربية...' : isBoard ? 'جاري ترجمة السبورة إلى العربية...' : 'جاري ترجمة الخطة إلى العربية...');
    try {
      // نُرسل الحقول القابلة للترجمة فقط — أصغر وأموثوق
      const d = isQuiz ? rec.quizData : rec.planData;
      const toTranslate = isQuiz
        ? { mindmap: d.mindmap, questions: d.questions }
        : isBoard
        ? { sections: d.sections }
        : {
            aims: d.aims,
            warmUp: d.warmUp, presentation: d.presentation,
            practice: d.practice, production: d.production, consolidation: d.consolidation,
            homeAssignment: d.homeAssignment, evaluation: d.evaluation,
            strategies: d.strategies, resources: d.resources
          };
      const sysText = isQuiz
        ? 'Translate every string value in this JSON from English to Arabic (فصحى سهلة), including question text, options, and explanations. Do NOT change "correctIndex" numeric values or JSON keys. Return valid JSON only.'
        : 'Translate every string value in this JSON from English to Arabic (فصحى سهلة). Keep all JSON keys exactly as-is. Return valid JSON only.';
      const url = `${GEMINI_BASE}${state.settings.defaultModel||'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(state.settings.apiKey)}`;
      const res = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          contents:[{role:'user',parts:[{text:JSON.stringify(toTranslate)}]}],
          systemInstruction:{parts:[{text:sysText}]},
          generationConfig:{temperature:0.2, responseMimeType:'application/json'}
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `خطأ ${res.status}`);
      const raw = (json.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      const translated = JSON.parse(raw.replace(/^```json\s*/i,'').replace(/^```/,'').replace(/```\s*$/,''));
      rec.translatedData = Object.assign({}, d, translated);
      rec.showTranslation = true;
      if (rec.id) { rec.updatedAt = Date.now(); try { await dbPut(LESSONS_STORE, rec); } catch(e){} }
      hideOverlay(); renderResult();
      toast('تمت الترجمة — اضغط مجدداً للتبديل', 'success');
    } catch (err) {
      hideOverlay();
      toast('تعذرت الترجمة: ' + (err.message || 'خطأ'), 'error');
    }
  }

  /* ─── Freeform Document Rendering (bank summaries + exams) ─── */
    /* ─── Freeform Document Rendering (bank summaries + exams) ─── */
  function docInteractiveStyles(isEnglish) {
    const align = isEnglish ? 'left' : 'right';
    return `
      <style>
        /* التنسيقات العامة للطباعة لتوفير الحبر وجعل الصفحة نظيفة */
        @media print {
          body { background: #fff !important; }
          .doc-wrapper { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 10px !important; max-width: 100% !important; }
        }

        /* تنسيق العناوين (ملونة، بخط أكبر، وتنسيق فاخر) */
        .document-content h2 { 
            color: #0284c7; 
            font-size: 1.8em; 
            border-bottom: 3px double #0284c7; 
            padding-bottom: 8px; 
            margin-top: 35px; 
            margin-bottom: 20px;
            font-weight: 900;
        }
        .document-content h3 { 
            color: #059669; 
            font-size: 1.4em; 
            margin-top: 25px; 
            margin-bottom: 15px;
            border-right: ${isEnglish ? 'none' : '4px solid #059669'};
            border-left: ${isEnglish ? '4px solid #059669' : 'none'};
            padding: 5px 12px;
            font-weight: 800;
            background: #ecfdf5;
            display: inline-block;
            border-radius: 4px;
        }

        /* تأثير التسطير الاحترافي (كدفتر الملاحظات) */
        .document-content p, .document-content li {
            line-height: 2.2em;
            border-bottom: 1.5px dotted #94a3b8; /* خط التسطير */
            margin-bottom: 10px;
            padding-bottom: 4px;
            font-size: 1.1em;
            color: #1e293b;
        }
        .document-content ul, .document-content ol { margin-bottom: 20px; }
        
        /* إخفاء التسطير داخل الجداول والبطاقات التفاعلية لتجنب التشويه */
        .document-content table p, .document-content table li,
        .mcq-card p, .cloze-card p, .match-card p,
        .mcq-card li, .cloze-card li, .match-card li {
            border-bottom: none;
        }

        /* تنسيق الاقتباسات (للملاحظات والقواعد الهامة) */
        .document-content blockquote {
            border: 1px solid #fcd34d;
            border-right: ${isEnglish ? 'none' : '5px solid #f59e0b'};
            border-left: ${isEnglish ? '5px solid #f59e0b' : 'none'};
            padding: 15px;
            background-color: #fffbeb;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            color: #92400e;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        /* الجداول بشكل احترافي ومنظم للطباعة */
        table { border-collapse: collapse; width: 100%; margin: 25px 0; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        th { background: #f1f5f9; color: #0f172a; font-weight: 900; border: 2px solid #94a3b8; padding: 12px; text-align: center; font-size: 1.1em; }
        td { border: 1px solid #cbd5e1; padding: 12px; text-align: ${align}; }

        /* البطاقات التفاعلية (أسئلة التقييم الذاتي) */
        .mcq-card, .cloze-card, .match-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
        .mcq-q, .cloze-q { font-weight: 900; margin-bottom: 16px; font-size: 1.2em; color: #0f172a; }
        .mcq-options { display: flex; flex-direction: column; gap: 10px; }
        .mcq-opt { text-align: ${align}; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; transition: 0.2s; font-family: inherit; font-size: 1.05em; font-weight: bold; color: #334155; }
        .mcq-opt:hover:not(:disabled) { border-color: #8b5cf6; background: #f5f3ff; color: #6d28d9; }
        .mcq-opt.correct { background: #dcfce7; border-color: #16a34a; color: #166534; }
        .mcq-opt.wrong { background: #fee2e2; border-color: #dc2626; color: #991b1b; }
        .mcq-opt:disabled { cursor: default; }
        .mcq-exp, .cloze-ans, .match-ans { margin-top: 15px; padding: 15px; background: #e0f2fe; border-radius: 8px; font-size: 1em; color: #0369a1; line-height: 1.8; border: 1px solid #bae6fd; font-weight: bold; }
        .cloze-reveal-btn, .match-reveal-btn { padding: 10px 16px; border: 2px solid #8b5cf6; border-radius: 8px; background: white; color: #8b5cf6; font-weight: 900; cursor: pointer; font-family: inherit; }
        .cloze-reveal-btn:hover, .match-reveal-btn:hover { background: #8b5cf6; color: white; }
        .match-cols { display: flex; gap: 20px; margin-bottom: 14px; }
        .match-colA, .match-colB { flex: 1; list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .match-colA li, .match-colB li { padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; background: white; font-weight: bold; }
        .essay-answer-key { margin-top: 30px; border-top: 3px dashed #8b5cf6; padding-top: 20px; }
      </style>
    `;
  }

  function renderDocDocument(rec) {
    const isEnglish = rec.language === 'en';
    const dir = isEnglish ? 'ltr' : 'rtl';
    const align = isEnglish ? 'left' : 'right';
    const font = isEnglish ? "'Segoe UI', Tahoma, sans-serif" : "'Cairo', 'AlMohannad', sans-serif";
    return docInteractiveStyles(isEnglish) + `
      <div class="doc-wrapper" dir="${dir}" style="background: white; color: black; padding: 40px; margin: 20px auto; max-width: 850px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 12px; font-family: ${font}; text-align: ${align};">
        <h1 style="text-align: center; color: #4c1d95; margin-bottom: 30px; border-bottom: 4px solid #7c3aed; padding-bottom: 15px; font-size: 2.2em; font-weight: 900;">${esc(rec.title)}</h1>
        <div class="document-content">
                    ${parseMathHTML(rec.docHtml)}

        </div>
      </div>
    `;
  }

  function bindDocInteractions(wrap) {
    wrap.onclick = function(e) {
      if (state.editMode) return;
      if (e.target.classList.contains('mcq-opt')) {
        const btn = e.target;
        const card = btn.closest('.mcq-card');
        if (!card || card.dataset.answered === 'true') return;
        const correctIdx = card.dataset.answer;
        const clickedIdx = btn.dataset.idx;
        const explanation = card.querySelector('.mcq-exp');
        card.dataset.answered = 'true';
        card.querySelectorAll('.mcq-opt').forEach(opt => {
          opt.disabled = true;
          if (opt.dataset.idx === correctIdx) opt.classList.add('correct');
          else if (opt.dataset.idx === clickedIdx) opt.classList.add('wrong');
        });
        if (explanation) explanation.style.display = 'block';
        return;
      }
      if (e.target.classList.contains('cloze-reveal-btn')) {
        const card = e.target.closest('.cloze-card');
        const ans = card?.querySelector('.cloze-ans');
        if (ans) { ans.style.display = 'block'; e.target.disabled = true; }
        return;
      }
      if (e.target.classList.contains('match-reveal-btn')) {
        const card = e.target.closest('.match-card');
        const ans = card?.querySelector('.match-ans');
        if (ans) { ans.style.display = 'block'; e.target.disabled = true; }
        return;
      }
    };
  }

  /* ─── Result View ─── */
  function renderResult() {
    const rec = state.currentRecord; if (!rec) return;
    const d = (rec.showTranslation && rec.translatedData) ? rec.translatedData : rec.planData;
    const wrap = $('#planOutputWrap');
    const isAudio = rec.kind === 'audio';
    const isDoc = !!rec.isDoc;
    const isQuizInteractive = rec.kind === 'quiz' && !isDoc;
    const isMindmap = rec.kind === 'mindmap';
    if (isAudio) wrap.innerHTML = renderAudioPlayer(rec);
    else if (isDoc) { wrap.innerHTML = rec.editedHtml || renderDocDocument(rec); bindDocInteractions(wrap); }
    else if (isQuizInteractive) wrap.innerHTML = renderQuizPreview(rec);
    else if (isMindmap) { wrap.innerHTML = renderMindmapView(rec); mountMindmapSvg(rec); }
    else if (rec.editedHtml) wrap.innerHTML = rec.editedHtml;
    else if (rec.kind === 'board') wrap.innerHTML = renderBoard(d, rec);
    else wrap.innerHTML = rec.language === 'ar' ? renderArabic(d, rec) : renderPPP(d, rec);
    setEditMode(false);
    updateSaveBtnState();
    updateTranslateBtn();
    updatePhoneViewBtn();
    $('#appbarTitle').textContent = isAudio ? 'الدرس الصوتي'
      : rec.kind === 'exam' ? 'اختبار شامل'
      : (isDoc && rec.kind === 'quiz') ? 'ملخص شامل'
      : isQuizInteractive ? 'ملخص تفاعلي'
      : isMindmap ? 'خريطة ذهنية'
      : rec.kind === 'answers' ? 'حل تقويم الوحدة'
      : rec.kind === 'board' ? 'سبورة الدرس' : 'الخطة الدرسية';
    $('#btnPrint').hidden = isAudio || isQuizInteractive;
    $('#btnExportPdf').hidden = isAudio || isQuizInteractive;
    $('#btnExportImg').hidden = isAudio || isQuizInteractive;
    $('#btnGeneratePptx').hidden = rec.kind !== 'board';
    $('#btnExportWord').hidden = isAudio || isMindmap;
    $('#btnExportTxt').hidden = isAudio || isMindmap;
    $('#btnPhoneView').hidden = isAudio || isQuizInteractive || isMindmap;
    $('#btnEdit').hidden = isAudio || isQuizInteractive || isMindmap;
    $('#btnRegenerate').hidden = isAudio || isDoc;
    const themeBar = $('#boardThemeBar');
    if (rec.kind === 'board') {
      themeBar.hidden = false;
      const activeTheme = rec.boardTheme || 'green';
      $$('.seg-btn', $('#boardThemeSegment')).forEach(b => b.classList.toggle('active', b.dataset.theme === activeTheme));
} else {
      themeBar.hidden = true;
    }
// إضافة شرط: الناطق الصوتي يعمل فقط للاختبارات الشاملة (exam) والملخصات (quiz) وبشرط أن يكون الدرس إنجليزي (en)
if (rec.language === 'en' && (rec.kind === 'exam' || rec.kind === 'quiz' || rec.isDoc)) {
    if (typeof window.injectTTSButtons === 'function') {
        window.injectTTSButtons('#planOutputWrap');
    }
}
}

  function onBoardThemeChange(theme) {
    const rec = state.currentRecord; if (!rec) return;
    rec.boardTheme = theme; rec.updatedAt = Date.now();
    try { dbPut(LESSONS_STORE, rec); } catch (e) {}
    renderResult();
  }
  function updateSaveBtnState() {
    const btn = $('#btnSaveArchive');
    const saved = !!(state.currentRecord?.id);
    btn.textContent = saved ? '✅ محفوظة' : '💾 حفظ';
    btn.classList.toggle('toolbtn-primary', saved);
  }
  function updateTranslateBtn() {
    const btn = $('#btnTranslate'); if (!btn) return;
    btn.hidden = state.currentRecord?.language !== 'en' || state.currentRecord?.kind === 'audio' || state.currentRecord?.kind === 'mindmap' || !!state.currentRecord?.isDoc;
    if (!btn.hidden) btn.textContent = state.currentRecord?.showTranslation ? '🌐 الأصل' : '🌐 ترجمة';
  }
  function updatePhoneViewBtn() {
    const btn = $('#btnPhoneView'); if (!btn) return;
    btn.textContent = state.phoneViewMode ? '🖥 عرض عادي' : '📱 عرض الهاتف';
  }
  async function onSaveArchive() {
    if (state.currentRecord?.id) { toast('محفوظة بالفعل ✓', 'success'); return; }
    try { state.currentRecord.id = await dbAdd(LESSONS_STORE, state.currentRecord); updateSaveBtnState(); toast('تم الحفظ ✓', 'success'); }
    catch (e) { toast('خطأ في الحفظ', 'error'); }
  }

  /* ─── Phone View — تصغير الخطة لتناسب شاشة الهاتف ─── */
  function togglePhoneView() {
    state.phoneViewMode = !state.phoneViewMode;
    const wrap = $('#planOutputWrap');
    const inner = wrap?.firstElementChild;
    if (!inner) return;
    if (state.phoneViewMode) {
      const availW = wrap.clientWidth || window.innerWidth;
      const contentW = inner.scrollWidth || inner.offsetWidth;
      const scale = Math.min(1, (availW - 24) / contentW);
      inner.style.transform = `scale(${scale})`;
      inner.style.transformOrigin = 'top right';
      inner.style.marginBottom = ((inner.offsetHeight * scale) - inner.offsetHeight) + 'px';
    } else {
      inner.style.transform = '';
      inner.style.transformOrigin = '';
      inner.style.marginBottom = '';
    }
    updatePhoneViewBtn();
  }

  /* ─── Archive ─── */
  async function refreshArchiveList() {
    try {
      const all = await dbGetAll(LESSONS_STORE);
      all.sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0));
      state.archiveCache = all;
      populateArchiveFilters();
      onArchiveSearch();
    } catch (e) { renderArchiveList([]); }
  }
  function populateArchiveFilters() {
    const gradeSel = $('#archiveGradeFilter'), subjSel = $('#archiveSubjectFilter');
    const grades = [...new Set(state.archiveCache.map(r => (r.grade||'').trim()).filter(Boolean))].sort();
    const subjects = [...new Set(state.archiveCache.map(r => (r.subject||'').trim()).filter(Boolean))].sort();
    const keepG = state.archiveGrade, keepS = state.archiveSubject;
    gradeSel.innerHTML = '<option value="">كل الصفوف</option>' + grades.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
    subjSel.innerHTML  = '<option value="">كل المواد</option>'  + subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    gradeSel.value = grades.includes(keepG) ? keepG : '';
    subjSel.value  = subjects.includes(keepS) ? keepS : '';
    state.archiveGrade = gradeSel.value; state.archiveSubject = subjSel.value;
  }
  
      function renderArchiveList(recs) {
    const list = $('#archiveList'), empty = $('#archiveEmpty');
    if (!recs?.length) { list.innerHTML = ''; empty.hidden = false; renderSelectToolbar([]); return; }
    empty.hidden = true;
    
    // 💡 إضافة 'mindmap' لقائمة الأنواع المدعومة للتحديد
    const allowedKinds = ['plan', 'board', 'quiz', 'exam', 'answers', 'mindmap'];
    const selecting = state.selectionMode && allowedKinds.includes(state.archiveKind);
    
    list.innerHTML = recs.map(r => {
      const meta = [r.subject, r.grade, formatDate(r.date)].filter(Boolean).map(esc).join(' · ');
      const kindIcon = r.kind === 'board' ? '🖍️' : r.kind === 'audio' ? '🎧' : r.kind === 'exam' ? '🧪' : r.kind === 'quiz' ? '📝' : r.kind === 'mindmap' ? '🧠' : '📋';
      const checked = state.selectedIds.has(r.id);
      return `<div class="archive-item${checked?' selected':''}" data-id="${r.id}" style="position:relative;">
      ${selecting ? `<input type="checkbox" class="archive-item-check" ${checked?'checked':''}>` : ''}
      <div class="archive-item-main">
        <strong>${esc(r.title)||'بدون عنوان'}</strong>
        <span>${meta}</span>
      </div>
      <span class="archive-item-badge">${kindIcon} ${r.language==='ar'?'AR':'EN'}</span>
      
      <!-- 💡 زر الحذف الفردي الجديد (يظهر فقط في الوضع العادي وليس أثناء التحديد المتعدد) -->
      ${!selecting ? `<button class="btn-del-archive" data-del-id="${r.id}" style="position:absolute; top:12px; left:12px; background:#fee2e2; color:#dc2626; border:none; border-radius:8px; padding:6px 10px; font-size:14px; cursor:pointer; z-index:2; font-weight:bold;" title="حذف السجل">🗑️ حذف</button>` : ''}
    </div>`;
    }).join('');
    renderSelectToolbar(recs);
  }

  function currentFilteredRecs() {
    const q = $('#archiveSearch').value.trim().toLowerCase();
    let recs = state.archiveCache.filter(r => (r.kind||'plan') === state.archiveKind);
    if (state.archiveGrade)   recs = recs.filter(r => (r.grade||'')   === state.archiveGrade);
    if (state.archiveSubject) recs = recs.filter(r => (r.subject||'') === state.archiveSubject);
    if (q) recs = recs.filter(r =>
      (r.title||'').toLowerCase().includes(q)||(r.subject||'').toLowerCase().includes(q)||(r.grade||'').toLowerCase().includes(q)
    );
    return recs;
  }
  function onArchiveKindChange(kind) {
    state.archiveKind = kind;
    state.selectionMode = false; state.selectedIds.clear();
    onArchiveSearch();
  }
  function onArchiveFilterChange() {
    state.archiveGrade = $('#archiveGradeFilter').value;
    state.archiveSubject = $('#archiveSubjectFilter').value;
    onArchiveSearch();
  }
  function onArchiveSearch() {
    renderArchiveList(currentFilteredRecs());
  }

  /* ─── Archive Multi-select & Bulk PDF Export ─── */
      function renderSelectToolbar(visibleRecs) {
    const bar = $('#archSelectToolbar');
    // 💡 إضافة 'mindmap' للأنواع المدعومة لظهور شريط التصدير
    const allowedKinds = ['plan', 'board', 'quiz', 'exam', 'answers', 'mindmap'];
    if (!allowedKinds.includes(state.archiveKind)) { 
        bar.hidden = true; bar.innerHTML = ''; 
        return; 
    }
    
    bar.hidden = false;
    if (!state.selectionMode) {
      bar.innerHTML = `<button class="btn-sm" id="btnToggleSelect">☑️ تحديد للتصدير</button>`;
      $('#btnToggleSelect').addEventListener('click', () => { state.selectionMode = true; onArchiveSearch(); });
      return;
    }
    const count = state.selectedIds.size;
    bar.innerHTML = `
      <button class="btn-sm" id="btnSelectAll">تحديد الكل</button>
      <span class="arch-select-count">${count} محددة</span>
      <button class="btn-primary btn-sm" id="btnExportSelected">📄 تصدير PDF</button>
      <!-- 💡 زر الحذف الجماعي الجديد -->
      <button class="btn-danger btn-sm" id="btnDeleteSelected" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:8px; font-weight:bold; cursor:pointer;">🗑️ حذف المحدد</button>
      <button class="btn-sm" id="btnCancelSelect">إلغاء</button>`;
      
    $('#btnSelectAll').addEventListener('click', () => {
      const allSelected = visibleRecs.every(r => state.selectedIds.has(r.id));
      visibleRecs.forEach(r => allSelected ? state.selectedIds.delete(r.id) : state.selectedIds.add(r.id));
      onArchiveSearch();
    });
    $('#btnExportSelected').addEventListener('click', exportSelectedPlansPdf);
    $('#btnDeleteSelected').addEventListener('click', deleteSelectedArchiveItems); // ربط دالة الحذف الجماعي
    $('#btnCancelSelect').addEventListener('click', () => { state.selectionMode = false; state.selectedIds.clear();
onArchiveSearch(); });
}

    async function exportSelectedPlansPdf() {
    const ids = [...state.selectedIds];
    const allowedKinds = ['plan', 'board', 'quiz', 'exam', 'answers', 'mindmap'];
    const recs = ids.map(id => state.archiveCache.find(r => r.id === id)).filter(r => r && allowedKinds.includes(r.kind || 'plan'));
    
    if (!recs.length) { toast('اختر عنصراً واحداً على الأقل للتصدير', 'error'); return; }
    if (typeof html2pdf === 'undefined') { toast('تعذر تحميل مكتبة PDF', 'error'); return; }
    recs.sort((a,b) => (a.date||'').localeCompare(b.date||'') || (a.title||'').localeCompare(b.title||''));

    const isAllDocs = recs.every(r => r.isDoc);

        if (isAllDocs) {
        // =========================================================================================
        // 📄 مسار المستندات الحرة (الملخص الشامل والاختبارات) - عمودي
        // =========================================================================================
        const holder = document.createElement('div');
        Object.assign(holder.style, { position:'fixed', left:'0', top:'0', zIndex:'-9999', width: '794px', background:'#fff', direction:'rtl' });
        document.body.appendChild(holder);

        const elements = [];
        
        const preventCutCss = `<style>
          /* 1. الحل النهائي للقص: إعادة العناصر ككتل صلبة (Block) لحماية الأسطر من الانشطار */
          p, li, h1, h2, h3, h4, h5, h6, blockquote, .mcq-card, .cloze-card, .match-card { 
              page-break-inside: avoid !important; 
              break-inside: avoid !important; 
              display: block !important; 
          }
          table, tr, td, th {
              page-break-inside: avoid !important; 
              break-inside: avoid !important; 
          }
          
          /* 2. ضبط المساحة الفارغة: استخدام حشوة متوازنة لتوسيط النص وإلغاء الفراغ الأيمن */
          .doc-wrapper { 
              margin: 0 !important; 
              max-width: 100% !important; 
              width: 100% !important; 
              box-shadow: none !important; 
              padding: 10px 15px !important; /* 💡 الحشوة المتوازنة هنا */
              box-sizing: border-box !important;
          }
          
          /* 3. تقارب السطور العادية */
          .doc-wrapper p, .doc-wrapper li, .doc-wrapper span {
              line-height: 1.25 !important;
              margin-top: 0 !important;
              margin-bottom: 5px !important;
          }
          
          /* 4. تقارب العناوين بشدة */
          .doc-wrapper h1, .doc-wrapper h2, .doc-wrapper h3, .doc-wrapper h4, .doc-wrapper h5, .doc-wrapper h6 {
              line-height: 1.4 !important;
              margin-top: 12px !important;
              margin-bottom: 5px !important;
              padding: 0 !important;
          }
        </style>`;

        try {
            for (let i = 0; i < recs.length; i++) {
                const rec = recs[i];
                showOverlay(`جاري تجهيز المستندات... (${i+1}/${recs.length})`);
                const el = document.createElement('div');
                el.style.background = '#fff';
                el.style.width = '100%';
                el.style.padding = '0'; 
                
                el.innerHTML = preventCutCss + renderDocDocument(rec);

                const docWrapper = el.querySelector('.doc-wrapper');
                if (docWrapper) {
                    docWrapper.style.maxWidth = '100%';
                    docWrapper.style.width = '100%';
                    docWrapper.style.margin = '0';
                    docWrapper.style.boxShadow = 'none';
                }

                fixUnderlinesForExport(el);
                holder.appendChild(el);
                elements.push(el);
            }

            await new Promise(r => setTimeout(r, 300));

            const opt = {
                margin: 12,
                image: { type:'jpeg', quality:0.98 },
                html2canvas: { scale:2, useCORS:true, backgroundColor:'#ffffff', windowWidth: 794, width: 794 }, 
                jsPDF: { unit:'mm', format:'a4', orientation:'portrait' }, 
                // 💡 الدرع الفولاذي ضد قص الأسطر: إجبار المكتبة صراحةً بالاسم على عدم شطر هذه العناصر
                pagebreak: { mode: ['css', 'legacy'], avoid: ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'tr', 'blockquote', '.mcq-card', '.cloze-card', '.match-card'] } 
            };
            
            showOverlay(`جاري تجميع الـ PDF... (1/${elements.length})`);
            let worker = html2pdf().set(opt).from(elements[0]).toPdf();
            for (let i = 1; i < elements.length; i++) {
                const idx = i;
                worker = worker.get('pdf').then(pdf => {
                    showOverlay(`جاري تجميع الـ PDF... (${idx+1}/${elements.length})`);
                    pdf.addPage();
                }).from(elements[idx]).toContainer().toCanvas().toPdf();
            }
            
            await worker.get('pdf').then(pdf => { 
                const totalPages = pdf.internal.getNumberOfPages();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setDrawColor(30, 58, 138); 
                    pdf.setLineWidth(0.6);
                    pdf.rect(6, 6, pageWidth - 12, pageHeight - 12); 
                    pdf.setLineWidth(0.2);
                    pdf.rect(7, 7, pageWidth - 14, pageHeight - 14); 
                    pdf.setFontSize(10);
                    pdf.setTextColor(80);
                    pdf.text(i + ' / ' + totalPages, pageWidth / 2, pageHeight - 8, { align: 'center' }); 
                }
                pdf.save(sanitizeFilename('مستندات_مجمّعة') + '.pdf'); 
            });
            
            toast(`تم تصدير ${recs.length} مستند ✓`, 'success');
            state.selectionMode = false; state.selectedIds.clear(); onArchiveSearch();
        } catch (e) {
            toast('تعذر التصدير', 'error');
        } finally {
            if(holder.parentNode) document.body.removeChild(holder);
            hideOverlay();
        }
        return; 
    }


    // =========================================================================================
    // 🗓️ مسار تصدير الخطط الدرسية، السبورات، والخرائط (أفقي Landscape)
    // =========================================================================================
    const holder = document.createElement('div');
    // إضافة عرض 1122 بيكسل لضمان تناسق التنسيق للسبورات والخرائط قبل التصوير
    Object.assign(holder.style, { position:'fixed', left:'-9999px', top:'0', width: '1122px', direction: 'rtl', background: '#fff' });
    document.body.appendChild(holder);
    
    const elements = [];
    
    try {
        for (let i = 0; i < recs.length; i++) {
            const rec = recs[i];
            showOverlay(`جاري تجهيز ${rec.title || 'الملف'}... (${i+1}/${recs.length})`);
            const d = (rec.showTranslation && rec.translatedData) ? rec.translatedData : (rec.planData || rec.quizData || rec.mindmapData);
            
            // 💡 الحل العبقري: تصوير السبورات والخرائط الذهنية كصورة أولاً لتناسب صفحة واحدة تماماً
            if (rec.kind === 'mindmap' || rec.kind === 'board') {
                const tempDiv = document.createElement('div');
                Object.assign(tempDiv.style, { position:'fixed', left:'-9999px', top:'0', width: '1122px', background:'#fff', direction:'rtl', padding: '15px' });
                
                if (rec.kind === 'mindmap') {
                    const mermaidText = buildMermaidFromMindmap(rec.mindmapData);
                    const svgText = await renderMermaidSVG(mermaidText);
                    const titleHtml = `<div style="text-align:center; padding:15px; margin-bottom:10px;"><h2 style="color:#7C3AED; font-family:'Cairo', sans-serif;">${esc(rec.title)}</h2></div>`;
                    tempDiv.innerHTML = titleHtml + `<div style="display:flex; justify-content:center; align-items:center; background:#ffffff; width:100%; min-height:500px;">${svgText}</div>`;
                    document.body.appendChild(tempDiv);
                    
                    const svgEl = tempDiv.querySelector('svg');
                    if (svgEl) {
                        svgEl.removeAttribute('width'); svgEl.removeAttribute('height');
                        svgEl.style.width = '100%'; svgEl.style.maxHeight = '550px';
                        svgEl.style.background = '#ffffff';
                    }
                } else {
                    tempDiv.innerHTML = renderBoard(d, rec);
                    document.body.appendChild(tempDiv);
                }
                
                // إعطاء المتصفح وقت كاف للرسم قبل الالتقاط
                await new Promise(r => setTimeout(r, 300)); 
                const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                document.body.removeChild(tempDiv);
                
                const el = document.createElement('div');
                // 💡 190mm ارتفاع يضمن احتواء الصورة في صفحة A4 أفقي دون أن تنقسم أبداً!
                el.innerHTML = `<div style="width:100%; height:190mm; display:flex; justify-content:center; align-items:center; page-break-inside: avoid;"><img src="${imgData}" style="max-width:100%; max-height:100%; object-fit:contain;"></div>`;
                el.style.background = '#fff';
                holder.appendChild(el);
                elements.push(el);
                
            } else {
                // مسار خطط الدروس الطبيعي (لا مساس به)
                let html = '';
                if (rec.editedHtml) {
                    html = rec.editedHtml;
                } else if (rec.isDoc) {
                    html = renderDocDocument(rec);
                } else {
                    html = rec.language === 'ar' ? renderArabic(d, rec) : renderPPP(d, rec);
                }
                const el = document.createElement('div');
                el.style.background = '#fff';
                el.innerHTML = html;
                fixUnderlinesForExport(el);
                holder.appendChild(el);
                elements.push(el);
            }
        }

        const opt = {
          margin: 6,
          image: { type:'jpeg', quality:0.95 },
          html2canvas: { scale:2, useCORS:true, backgroundColor:'#ffffff' },
          jsPDF: { unit:'mm', format:'a4', orientation:'landscape' }
        };
        
        showOverlay(`جاري تجميع الـ PDF... (1/${elements.length})`);
        let worker = html2pdf().set(opt).from(elements[0]).toPdf();
        for (let i = 1; i < elements.length; i++) {
          const idx = i;
          worker = worker.get('pdf').then(pdf => {
            showOverlay(`جاري تجميع الـ PDF... (${idx+1}/${elements.length})`);
            pdf.addPage();
          }).from(elements[idx]).toContainer().toCanvas().toPdf();
        }
        await worker.get('pdf').then(pdf => { pdf.save(sanitizeFilename('مستندات_مجمّعة') + '.pdf'); });
        toast(`تم تصدير ${recs.length} عنصر ✓`, 'success');
        state.selectionMode = false; state.selectedIds.clear(); onArchiveSearch();
        
    } catch (e) {
        toast('تعذر التصدير', 'error');
        console.error(e);
    } finally {
        if(holder.parentNode) document.body.removeChild(holder);
        hideOverlay();
    }
  }


  async function openArchiveItem(id) {
    try {
      const rec = await dbGet(LESSONS_STORE, id); if (!rec) return;
      state.currentRecord = rec; state.phoneViewMode = false;
      navigate('result'); renderResult();
    } catch (e) { toast('تعذر الفتح', 'error'); }
  }
  async function duplicateRecord() {
    if (!state.currentRecord) return;
    const copy = Object.assign({}, state.currentRecord);
    delete copy.id; copy.title = (copy.title||'') + ' (نسخة)';
    copy.createdAt = copy.updatedAt = Date.now();
    try { copy.id = await dbAdd(LESSONS_STORE, copy); state.currentRecord = copy; renderResult(); toast('تم النسخ ✓', 'success'); }
    catch (e) { toast('خطأ', 'error'); }
  }
  async function regenerateRecord() {
    const rec = state.currentRecord;
    if (!rec || !state.settings.apiKey) { toast('أدخل مفتاح API أولاً', 'error'); return; }
    if (rec.isDoc) { toast('لا يمكن إعادة التوليد لهذا النوع من المستندات — أنشئ نسخة جديدة من "دروس واختبارات"', 'error'); return; }
    if (rec.kind === 'audio') {
      if (!confirm('سيتم كتابة نص جديد للدرس الصوتي، وحذف أي أصوات مولَّدة أو مسجَّلة سابقاً لأنها لن تطابق النص الجديد. متابعة؟')) return;
      showOverlay('جاري كتابة نص الدرس الصوتي...');
      try {
        const textModel = rec.scriptModel || state.settings.defaultModel || 'gemini-3.5-flash';
        const sres = await callWithFallback(textModel, buildAudioScriptSystem(rec.language), buildUser(rec, rec.extractedText, rec.language), AUDIO_SCRIPT_SCHEMA);
        const script = (sres.data.script || '').trim();
        if (!script) throw Object.assign(new Error('EMPTY'), { code:'EMPTY' });
        rec.script = script; rec.scriptModel = textModel;
        rec.geminiBlob = null; rec.geminiMime = null;
        rec.recordedBlob = null; rec.recordedMime = null;
        rec.updatedAt = Date.now();
        try { await dbPut(LESSONS_STORE, rec); } catch (e) {}
        hideOverlay(); renderResult(); toast('تم توليد نص جديد ✓', 'success');
      } catch (e) { hideOverlay(); handleGenError(e); }
      return;
    }
    const isBoard = rec.kind === 'board';
    const isQuiz = rec.kind === 'quiz';
    if (rec.kind === 'mindmap') {
      if (!confirm('سيتم استبدال الخريطة الذهنية بنسخة جديدة. متابعة؟')) return;
      showOverlay('جاري إعادة التوليد...');
      try {
        const res = await callWithFallback(
          rec.model || state.settings.defaultModel,
          buildMindmapSystem(rec.language),
          buildUser(rec, rec.extractedText, rec.language),
          MINDMAP_SCHEMA
        );
        rec.mindmapData = res.data; rec.editedHtml = null; rec.updatedAt = Date.now();
        try { await dbPut(LESSONS_STORE, rec); } catch (e) {}
        hideOverlay(); renderResult(); toast('تم التوليد ✓', 'success');
      } catch (e) { hideOverlay(); handleGenError(e); }
      return;
    }
    if (isQuiz) {
      if (!confirm('سيتم استبدال الملخص التفاعلي بنسخة جديدة. متابعة؟')) return;
      showOverlay('جاري إعادة التوليد...');
      try {
        const res = await callWithFallback(
          rec.model || state.settings.defaultModel,
          buildQuizSystem(rec.language),
          buildUser(rec, rec.extractedText, rec.language),
          QUIZ_SCHEMA
        );
        rec.quizData = res.data; rec.editedHtml = null; rec.translatedData = null;
        rec.showTranslation = false; rec.updatedAt = Date.now();
        try { await dbPut(LESSONS_STORE, rec); } catch (e) {}
        hideOverlay(); renderResult(); toast('تم التوليد ✓', 'success');
      } catch (e) { hideOverlay(); handleGenError(e); }
      return;
    }
    if (!confirm(isBoard ? 'سيتم استبدال السبورة بسبورة جديدة. متابعة؟' : 'سيتم استبدال الخطة بخطة جديدة. متابعة؟')) return;
    showOverlay('جاري إعادة التوليد...');
    try {
      const res = isBoard
        ? await callWithFallback(
            rec.model || state.settings.defaultModel,
            buildBoardSystem(rec.language),
            buildUser(rec, rec.extractedText, rec.language),
            BOARD_SCHEMA
          )
        : await callWithFallback(
            rec.model || state.settings.defaultModel,
            buildSystem(rec.language),
            buildUser(rec, rec.extractedText, rec.language),
            rec.language==='ar' ? ARABIC_SCHEMA : ENGLISH_PPP_SCHEMA
          );
      rec.planData = res.data; rec.editedHtml = null; rec.translatedData = null;
      rec.showTranslation = false; rec.updatedAt = Date.now();
      try { await dbPut(LESSONS_STORE, rec); } catch (e) {}
      hideOverlay(); renderResult(); toast('تم التوليد ✓', 'success');
    } catch (e) { hideOverlay(); handleGenError(e); }
  }
  async function deleteRecord() {
    if (!state.currentRecord?.id) return;
    if (!confirm('حذف هذه الخطة نهائياً؟')) return;
    try { await dbDelete(LESSONS_STORE, state.currentRecord.id); state.currentRecord = null; goBack(); refreshArchiveList(); }
    catch (e) { toast('خطأ في الحذف', 'error'); }
  }
// 💡 دالة الحذف الفردي المباشر من قائمة الأرشيف
  async function deleteArchiveItemDirect(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) return;
    try {
      await dbDelete(LESSONS_STORE, id);
      toast('تم الحذف بنجاح ✓', 'success');
      refreshArchiveList();
    } catch (e) {
      toast('خطأ في الحذف', 'error');
    }
  }

  // 💡 دالة الحذف الجماعي للملفات المحددة
  async function deleteSelectedArchiveItems() {
    if (state.selectedIds.size === 0) {
      toast('لم يتم تحديد أي عنصر', 'error');
      return;
    }
    if (!confirm(`⚠️ تحذير: هل أنت متأكد من حذف ${state.selectedIds.size} عنصر نهائياً؟`)) return;
    
    showOverlay('جاري الحذف...');
    try {
      for (let id of state.selectedIds) {
        await dbDelete(LESSONS_STORE, id);
      }
      state.selectionMode = false;
      state.selectedIds.clear();
      await refreshArchiveList();
      hideOverlay();
      toast('تم حذف العناصر المحددة بنجاح ✓', 'success');
    } catch (e) {
      hideOverlay();
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  }
  /* ─── Edit Mode ─── */
  function setEditMode(on) {
    state.editMode = on; $('#editModeBar').hidden = !on;
    const isDoc = !!state.currentRecord?.isDoc;
    if (isDoc) {
      // للمستندات الحرة (اختبار/ملخص) نجعل المحتوى بالكامل قابلاً للتعديل والحذف مباشرة
      const container = $('#planOutputWrap .document-content');
      if (container) container.setAttribute('contenteditable', on ? 'true' : 'false');
      if (!on && container) container.removeAttribute('contenteditable');
    } else {
      $$('#planOutputWrap td, #planOutputWrap p, #planOutputWrap li, #planOutputWrap h2, #planOutputWrap h3').forEach(el =>
        on ? el.setAttribute('contenteditable','true') : el.removeAttribute('contenteditable')
      );
    }
  }
  function toggleEditMode() { if (state.currentRecord) setEditMode(!state.editMode); }
  async function saveEdits() {
    const rec = state.currentRecord; if (!rec) return;
    $$('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    rec.editedHtml = $('#planOutputWrap').innerHTML;
    rec.updatedAt = Date.now(); setEditMode(false);
    if (rec.id) { try { await dbPut(LESSONS_STORE, rec); toast('تم حفظ التعديل ✓', 'success'); } catch(e){} }
    else { try { rec.id = await dbAdd(LESSONS_STORE, rec); updateSaveBtnState(); toast('تم الحفظ ✓', 'success'); } catch(e){} }
  }
  function cancelEdit() { setEditMode(false); renderResult(); }

  /* ─── Capture & Export ─── */
  async function captureElement(target) {
    const W = target.scrollWidth, H = target.scrollHeight;
    const container = document.createElement('div');
    Object.assign(container.style, {
      position:'fixed', left:'-9999px', top:'0',
      width:W+'px', height:H+'px', background:'#fff', zIndex:'-1'
    });
    // reset any phone-view transform on the clone
    const clone = target.cloneNode(true);
    const inner = clone.firstElementChild;
    if (inner) { inner.style.transform=''; inner.style.transformOrigin=''; inner.style.marginBottom=''; }
    fixUnderlinesForExport(clone);
    container.appendChild(clone);
    document.body.appendChild(container);
    let canvas;
    try {
      canvas = await html2canvas(container, { scale:2, useCORS:true, backgroundColor:'#ffffff', width:W, height:H });
    } finally { document.body.removeChild(container); }
    return canvas;
  }
  function printPlan() { try { window.print(); } catch (e) { exportPdf(); } }
  
        async function exportPdf() {
    if (state.currentRecord?.kind === 'mindmap') return exportMindmapAsPdf();
    const rec = state.currentRecord;
    if (!rec) { toast('لا يوجد محتوى', 'error'); return; }
    if (typeof html2pdf === 'undefined') { toast('تعذر تحميل مكتبة PDF', 'error'); return; }
    
    showOverlay('جاري إنشاء PDF...');
    let holder = null;
    try {
      const filename = sanitizeFilename(rec.title) + '.pdf';
      // 💡 السبورات فقط تكون عرضية، والباقي (الملخصات والخطط) عمودية Portrait
      const isBoard = rec.kind === 'board';
      const orientation = isBoard ? 'landscape' : 'portrait';
      const targetWidth = isBoard ? '1122px' : '794px'; 

      holder = document.createElement('div');
      Object.assign(holder.style, { position: 'absolute', left: '-99999px', top: '0', width: targetWidth });

      const d = (rec.showTranslation && rec.translatedData) ? rec.translatedData : (rec.planData || rec.quizData || rec.mindmapData);
      let html = '';
      
      if (rec.editedHtml) { html = rec.editedHtml; } 
      else if (rec.isDoc) { html = renderDocDocument(rec); } 
      else if (isBoard) { html = renderBoard(d, rec); } 
      else { html = rec.language === 'ar' ? renderArabic(d, rec) : renderPPP(d, rec); }

      const el = document.createElement('div');
      el.style.background = '#fff';
      
      const preventCutCss = `<style>p, li, tr, th, td, h2, h3, h4, blockquote, table, .board-section, .mcq-card, .cloze-card, .match-card { page-break-inside: avoid !important; break-inside: avoid !important; }</style>`;
      el.innerHTML = preventCutCss + html;
      
      if (typeof fixUnderlinesForExport === 'function') fixUnderlinesForExport(el);
      
      holder.appendChild(el); document.body.appendChild(holder);

      const opt = {
        margin: 12, // 💡 الهامش 1.2 سم من كل الجهات
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: isBoard ? 1122 : 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: orientation },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      let worker = html2pdf().set(opt).from(el).toPdf();
      
      await worker.get('pdf').then(pdf => {
          const totalPages = pdf.internal.getNumberOfPages();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          for (let i = 1; i <= totalPages; i++) {
              pdf.setPage(i);
              // 💡 الإطار يبدأ من 6 ملم (نصف الهامش) ليظهر بشكل متناسق جداً
              pdf.setDrawColor(30, 58, 138); 
              pdf.setLineWidth(0.6);
              pdf.rect(6, 6, pageWidth - 12, pageHeight - 12);
              pdf.setLineWidth(0.2);
              pdf.rect(7, 7, pageWidth - 14, pageHeight - 14);
              pdf.setFontSize(10);
              pdf.setTextColor(80);
              pdf.text(i + ' / ' + totalPages, pageWidth / 2, pageHeight - 8, { align: 'center' });
          }
      });

      const blob = await worker.output('blob');
      document.body.removeChild(holder); downloadBlob(blob, filename);
      hideOverlay(); toast('تم تصدير PDF بنجاح ✓', 'success');
    } catch (e) {
      if (holder && holder.parentNode) document.body.removeChild(holder);
      hideOverlay(); toast('تعذر التصدير', 'error'); 
    }
  }
  async function exportText() {
    const target = $('#planOutputWrap');
    if (!target?.firstElementChild) { toast('لا يوجد محتوى', 'error'); return; }
    const rec = state.currentRecord;
    const title = rec?.title || 'مستند';
    try {
      const text = target.innerText || target.textContent || '';
      const blob = new Blob([text], { type:'text/plain;charset=utf-8' });
      downloadBlob(blob, sanitizeFilename(title) + '.txt');
      toast('تم تصدير الملف النصي ✓', 'success');
    } catch (e) { toast('تعذر تصدير النص', 'error'); }
  }
  async function exportWord() {
    const target = $('#planOutputWrap');
    if (!target?.firstElementChild) { toast('لا يوجد محتوى', 'error'); return; }
    const rec = state.currentRecord;
    const isEnglish = rec?.language === 'en';
    const dir = isEnglish ? 'ltr' : 'rtl';
    const title = rec?.title || 'مستند';
    try {
      const html = `<!DOCTYPE html><html dir="${dir}" lang="${isEnglish?'en':'ar'}"><head><meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  body { font-family:'Calibri','Arial',sans-serif; direction:${dir}; line-height:1.8; }
  table { border-collapse:collapse; width:100%; }
  td, th { border:1px solid #999; padding:6px 10px; }
  h1, h2, h3 { color:#4B2E83; }
  .mcq-opt.correct { background:#DCFCE7; }
  .mcq-opt.wrong { background:#FEE2E2; }
  .cloze-reveal-btn, .match-reveal-btn { display:none; }
  .cloze-ans, .match-ans, .mcq-exp { display:block !important; }
</style></head><body>${target.innerHTML}</body></html>`;
      const blob = new Blob(['\ufeff', html], { type:'application/msword' });
      downloadBlob(blob, sanitizeFilename(title) + '.doc');
      toast('تم تصدير ملف Word ✓', 'success');
    } catch (e) { toast('تعذر تصدير Word', 'error'); }
  }
  async function exportImage() {
    if (state.currentRecord?.kind === 'mindmap') return exportMindmapAsImage();
    const target = $('#planOutputWrap');
    if (!target?.firstElementChild) { toast('لا يوجد محتوى', 'error'); return; }
    showOverlay('جاري إنشاء الصورة...');
    try {
      const canvas = await captureElement(target);
      canvas.toBlob(blob => {
        hideOverlay();
        if (!blob) { toast('فشل', 'error'); return; }
        downloadBlob(blob, sanitizeFilename(state.currentRecord?.title)+'.png');
        toast('تم تصدير الصورة ✓', 'success');
      }, 'image/png');
    } catch (e) { hideOverlay(); toast('تعذر التصدير', 'error'); }
  }
    function buildStandaloneDocHtml(rec) {
    const isEnglish = rec.language === 'en';
    const dir = isEnglish ? 'ltr' : 'rtl';
    return `<!DOCTYPE html><html dir="${dir}" lang="${isEnglish?'en':'ar'}"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(rec.title)}</title>
<style>
  /* 🔊 تنسيقات زر النطق المحقونة في المستند */
  .tts-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background-color: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; cursor: pointer; font-size: 14px; margin: 0 8px; transition: all 0.2s ease; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .tts-btn:active { transform: scale(0.9); background-color: #7dd3fc; }
</style>
</head><body style="margin:0;background:#f3f1fa;">
${renderDocDocument(rec)}
<script>
document.body.addEventListener('click', function(e){
  if (e.target.classList.contains('mcq-opt')) {
    var btn=e.target, card=btn.closest('.mcq-card');
    if (!card || card.dataset.answered==='true') return;
    var correctIdx=card.dataset.answer, clickedIdx=btn.dataset.idx, exp=card.querySelector('.mcq-exp');
    card.dataset.answered='true';
    card.querySelectorAll('.mcq-opt').forEach(function(opt){
      opt.disabled=true;
      if (opt.dataset.idx===correctIdx) opt.classList.add('correct');
      else if (opt.dataset.idx===clickedIdx) opt.classList.add('wrong');
    });
    if (exp) exp.style.display='block';
  } else if (e.target.classList.contains('cloze-reveal-btn')) {
    var c=e.target.closest('.cloze-card'), a=c&&c.querySelector('.cloze-ans');
    if (a){ a.style.display='block'; e.target.disabled=true; }
  } else if (e.target.classList.contains('match-reveal-btn')) {
    var c2=e.target.closest('.match-card'), a2=c2&&c2.querySelector('.match-ans');
    if (a2){ a2.style.display='block'; e.target.disabled=true; }
  }
});
// 🔊 محرك النطق للطلاب (مدمج بشكل آمن داخل الـ script)
window.playTTS = function(text, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!('speechSynthesis' in window)) { alert('جهازك لا يدعم النطق الصوتي'); return; }
    
    window.speechSynthesis.cancel();
    
    setTimeout(function() {
        window.currentUtterance = new SpeechSynthesisUtterance(text);
        window.currentUtterance.lang = 'en-US';
        window.currentUtterance.rate = 0.85;
        
        var voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            var localVoice = voices.find(function(v) { return v.lang.startsWith('en') && v.localService === true; });
            if (!localVoice) localVoice = voices.find(function(v) { return v.lang.startsWith('en'); });
            if (localVoice) window.currentUtterance.voice = localVoice;
        }
        
        window.speechSynthesis.speak(window.currentUtterance);
        
        var keepAlive = setInterval(function() {
            if (!window.speechSynthesis.speaking) clearInterval(keepAlive);
            else window.speechSynthesis.resume();
        }, 10000);
    }, 100);
}; // تم إضافة قوس الإغلاق هنا

// 🌟 استنفار أصوات الجهاز مبكراً بمجرد فتح الملف
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
    }
}

window.injectTTSButtons = function() {
    // 💡 السطر الجديد: يوقف عمل الميكروفون تماماً إذا لم يكن الملف باللغة الإنجليزية
    if (document.documentElement.lang !== 'en') return;

    var tagsToScan = ['p', 'li', 'h3', 'h4', 'h5', 'td', 'th'];
    tagsToScan.forEach(function(tag) {
        document.querySelectorAll(tag).forEach(function(el) {
            if (el.querySelector('.tts-btn')) return;
            var text = el.textContent.trim();
            var hasEnglishLetters = /[a-zA-Z]{2,}/.test(text);
            if (text.length > 2 && hasEnglishLetters) {
                var cleanTextForSpeech = text.replace(/'/g, "").replace(/"/g, "").replace(/\\\`/g, "");
                var btn = document.createElement('button');
                btn.className = 'tts-btn';
                btn.innerHTML = '🔊';
                btn.onclick = function(e) { window.playTTS(cleanTextForSpeech, e); };
                el.style.direction = 'ltr';
                el.style.textAlign = 'left';
                el.prepend(btn); 
            }
        });
    });
};
injectTTSButtons(); 
</` + `script>
</body></html>`;
  }

  async function sharePlan() {
    const rec = state.currentRecord;
    if (rec?.isDoc) {
      const html = buildStandaloneDocHtml(rec);
      const blob = new Blob([html], { type:'text/html' });
      const fn = sanitizeFilename(rec.title) + '.html';
      const file = new File([blob], fn, { type:'text/html' });
      if (navigator.canShare?.({ files:[file] })) {
        try { await navigator.share({ files:[file], title: rec.title || 'مستند' }); }
        catch (e) { if (e.name !== 'AbortError') downloadBlob(blob, fn); }
      } else { downloadBlob(blob, fn); toast('تم التحميل ✓ — شاركه كملف HTML مستقل', 'success'); }
      return;
    }
    if (rec?.kind === 'quiz') {
      if (rec.language === 'en' && !rec.translatedData) {
        toast('لم تُترجم بعد — سيُصدَّر بالإنجليزي فقط. اضغط 🌐 ترجمة أولاً لإضافة خيار العربية للطلاب', 'error');
      }
      const html = buildStandaloneQuizHtml(rec);
      const blob = new Blob([html], { type:'text/html' });
      const fn = sanitizeFilename(rec.title) + '.html';
      const file = new File([blob], fn, { type:'text/html' });
      if (navigator.canShare?.({ files:[file] })) {
        try { await navigator.share({ files:[file], title: rec.title || 'ملخص تفاعلي' }); }
        catch (e) { if (e.name !== 'AbortError') downloadBlob(blob, fn); }
      } else { downloadBlob(blob, fn); toast('تم التحميل ✓ — شاركه مع الطلاب', 'success'); }
      return;
    }
    if (rec?.kind === 'audio') {
      const blob = rec.geminiBlob || rec.recordedBlob;
      if (!blob) { toast('لا يوجد ملف صوتي بعد — وَلِّد صوتاً أولاً', 'error'); return; }
      const ext = blob.type?.includes('mp4') ? 'm4a' : blob.type?.includes('wav') ? 'wav' : blob.type?.includes('mpeg') ? 'mp3' : 'webm';
      const fn = sanitizeFilename(rec.title) + '.' + ext;
      const file = new File([blob], fn, { type: blob.type || 'audio/webm' });
      if (navigator.canShare?.({ files:[file] })) {
        try { await navigator.share({ files:[file], title: rec.title || 'الدرس الصوتي' }); }
        catch (e) { if (e.name !== 'AbortError') downloadBlob(blob, fn); }
      } else { downloadBlob(blob, fn); toast('تم التحميل ✓', 'success'); }
      return;
    }
    const target = $('#planOutputWrap');
    if (!target?.firstElementChild) { toast('لا يوجد محتوى', 'error'); return; }
    showOverlay('جاري التجهيز...');
    try {
      const canvas = await captureElement(target);
      canvas.toBlob(async blob => {
        hideOverlay();
        if (!blob) return;
        const fn = sanitizeFilename(state.currentRecord?.title)+'.png';
        const file = new File([blob], fn, {type:'image/png'});
        if (navigator.canShare?.({files:[file]})) {
          try { await navigator.share({files:[file], title: state.currentRecord?.title||'خطة الدرس'}); }
          catch (e) { if (e.name !== 'AbortError') downloadBlob(blob, fn); }
        } else { downloadBlob(blob, fn); toast('تم التحميل ✓', 'success'); }
      }, 'image/png');
    } catch (e) { hideOverlay(); toast('تعذرت المشاركة', 'error'); }
  }

  /* ─── Backup ─── */
  async function exportBackup() {
    showOverlay('تجهيز النسخة الاحتياطية...');
    try {
      const lessons = await dbGetAll(LESSONS_STORE);
      const extracts = await dbGetAll(EXTRACTS_STORE);
      // فهارس الكتب فقط (بدون ملف PDF الخام الثقيل — حقل data)
      const booksRaw = await dbGetAll(BOOKS_STORE);
      const books = booksRaw.map(b => ({ name:b.name, pageCount:b.pageCount, addedAt:b.addedAt, toc:b.toc || [] }));
      const blob = new Blob([JSON.stringify({version:'2.4', exportedAt:new Date().toISOString(), settings:state.settings, lessons, extracts, books}, null, 2)], {type:'application/json'});
      downloadBlob(blob, 'haael-backup-'+new Date().toISOString().slice(0,10)+'.json');
      
      // 💡 تصفير عداد النسخ الاحتياطي الذكي بعد التصدير بنجاح
      localStorage.setItem('haael_unbacked_count', '0'); 
      
      hideOverlay(); toast(`تم تصدير ${lessons.length} خطة و ${extracts.length} درس مستخرج و ${books.length} فهرس كتاب ✓`, 'success');
    } catch (e) { hideOverlay(); toast('تعذر التصدير', 'error'); }
  }

    async function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.lessons)) throw new Error('ملف غير صالح');
        const extractsCount = Array.isArray(data.extracts) ? data.extracts.length : 0;
        const booksCount = Array.isArray(data.books) ? data.books.length : 0;
        
        if (!confirm(`استيراد ${data.lessons.length} خطة و ${extractsCount} درس مستخرج و ${booksCount} فهرس كتاب؟\nملاحظة: فهارس الكتب تُستورد كمرجع نصي فقط.`)) { 
            e.target.value=''; 
            return; 
        }
        
        showOverlay('جاري الاستيراد دفعة واحدة (عملية سريعة)...');
        let count = 0, extractCount = 0, bookCount = 0;
        
        // 💡 الحل السحري: الحقن الجماعي في معاملة واحدة (Bulk Transaction) يمنع الهواتف من قطع الاتصال
        const db = await openDB();
        const storesToOpen = [];
        if (data.lessons.length > 0) storesToOpen.push(LESSONS_STORE);
        if (extractsCount > 0) storesToOpen.push(EXTRACTS_STORE);
        if (booksCount > 0) storesToOpen.push(BOOKS_STORE);

        if (storesToOpen.length > 0) {
            const tx = db.transaction(storesToOpen, 'readwrite');
            
            if (data.lessons.length > 0) {
                const lStore = tx.objectStore(LESSONS_STORE);
                for (const l of data.lessons) { 
                    const c = Object.assign({}, l); 
                    delete c.id; 
                    lStore.add(c); 
                    count++; 
                }
            }
            if (extractsCount > 0) {
                const eStore = tx.objectStore(EXTRACTS_STORE);
                for (const ex of data.extracts) { 
                    const c = Object.assign({}, ex); 
                    delete c.id; 
                    eStore.add(c); 
                    extractCount++; 
                }
            }
            if (booksCount > 0) {
                const bStore = tx.objectStore(BOOKS_STORE);
                for (const bk of data.books) { 
                    const c = Object.assign({}, bk); 
                    delete c.id; 
                    bStore.add(c); 
                    bookCount++; 
                }
            }
            
            // انتظار اكتمال الحقن الجماعي بالكامل
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
        }

        if (data.settings) { 
            Object.assign(state.settings, data.settings); 
            saveSettings(); 
            populateSettingsForm(); 
        }
        
        hideOverlay(); 
        await refreshArchiveList();
        toast(`تم استيراد ${count} خطة و ${extractCount} درس و ${bookCount} فهرس بنجاح ✓`, 'success');
        
      } catch (err) { 
        hideOverlay(); 
        console.error(err);
        toast('تعذر الاستيراد: ' + (err.message || 'المساحة ممتلئة أو الهاتف يمنع العملية'), 'error'); 
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }


  /* ─── Reset Form ─── */
  function resetNewForm() {
    $('#fSchool').value  = state.settings.school   || '';
    $('#fTeacher').value = state.settings.teacher  || '';
    $('#fSubject').value = state.settings.subject  || '';
    $('#fGrade').value = ''; $('#fSection').value = '';
    $('#fDate').value    = new Date().toISOString().slice(0,10);
    $('#fPeriod').value  = ''; $('#fTitle').value = '';
    document.querySelectorAll('.resource-chk').forEach(el => el.checked = false);
    $('#pastedText').value = '';
        $('#btnRetryImages').hidden = true;
    $('#btnRetryPdf').hidden = true;
    $('#imagesExtractedText').value = ''; $('#imageTextWrap').hidden = true;
    $('#imageThumbs').innerHTML = ''; $('#ocrProgress').hidden = true; $('#imageInput').value = '';
    $('#pdfExtractedText').value = ''; $('#pdfTextWrap').hidden = true;
    $('#pdfFileName').hidden = true; $('#pdfProgress').hidden = true; $('#pdfInput').value = '';
    $('#libExtractedText').value = ''; $('#libTextWrap').hidden = true; $('#libProgress').hidden = true;
    const defLang = state.settings.defaultLang || 'ar';
    state.language = defLang;
    $$('.seg-btn', $('#langSegment')).forEach(b => b.classList.toggle('active', b.dataset.lang === defLang));
    state.sourceType = 'title';
    $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === 'title'));
    ['title','text','images','pdf','library'].forEach(s => { $('#panel-'+s).hidden = s !== 'title'; });
    // إغلاق كل أقسام الأكورديون عند فتح شاشة تحضير جديدة، ليبدأ المعلم بشاشة نظيفة
        // إغلاق كل أقسام الأكورديون بذكاء وأمان (مضاد للانهيار)
    $$('.acc-item', $('#newAccordion')).forEach(it => {
      it.classList.remove('is-open');
      const panel = $('.acc-panel', it);
      if (panel) panel.hidden = true;
    });

    // 💡 التعديل: تحديث قائمة المكتبة المنسدلة فور فتح نافذة التحضير الجديد
    refreshLibrarySelect();
  }

  /* ─── PWA ─── */
  let _installPrompt = null;
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); _installPrompt = e; showInstallBanner();
    });
    window.addEventListener('appinstalled', () => { hideInstallBanner(); toast('تم تثبيت التطبيق 🎉', 'success'); });
  }
  function showInstallBanner() {
    if ($('#installBanner')) return;
    const b = document.createElement('div'); b.id = 'installBanner';
    b.innerHTML = `<style>#installBanner{position:fixed;bottom:0;left:0;right:0;z-index:300;background:var(--ink);color:#fff;display:flex;align-items:center;gap:12px;padding:12px 14px;border-top:3px solid var(--primary);flex-wrap:wrap}#installBanner strong{display:block;font-size:15px}#installBanner span{font-size:12px;opacity:.8}.ib-yes{padding:8px 16px;border-radius:8px;background:var(--primary);color:#fff;font-weight:900;font-size:14px;border:none;cursor:pointer}.ib-no{padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.12);color:#fff;font-size:13px;border:none;cursor:pointer}</style>
      <div style="flex:1"><strong>📲 ثبّت التطبيق</strong><span>يعمل بدون إنترنت على شاشتك الرئيسية</span></div>
      <button class="ib-yes" id="btnInstallYes">تثبيت</button>
      <button class="ib-no"  id="btnInstallNo">لاحقاً</button>`;
    document.body.appendChild(b);
    $('#btnInstallYes').onclick = async () => { if (_installPrompt) { _installPrompt.prompt(); const {outcome} = await _installPrompt.userChoice; if (outcome==='accepted') hideInstallBanner(); _installPrompt=null; } };
    $('#btnInstallNo').onclick  = () => hideInstallBanner();
  }
  function hideInstallBanner() { const b=$('#installBanner'); if(b) b.hidden=true; }

  /* ─── Typewriter Animation Logic (With Audio Sync) ─── */
  function toggleTwFullscreen(btn) {
    const block = $('#audioScriptBlock');
    if (!block) return;
    const isAr = state.currentRecord?.language !== 'en';
    const on = block.classList.toggle('tw-fullscreen');
    btn.innerHTML = on ? `✕ ${isAr ? 'إغلاق' : 'Close'}` : `⛶ ${isAr ? 'ملء الشاشة' : 'Fullscreen'}`;
    document.body.style.overflow = on ? 'hidden' : '';
  }
  // يحلل الملف الصوتي فعليًا (خارج نطاق التشغيل الحي) ليحدد فترات الكلام مقابل فترات الصمت/التوقف،
  // بدل افتراض أن الحروف تُنطق بمعدل ثابت طوال الزمن — لأن علامات الترقيم والفواصل تُنتج صمتًا حقيقيًا
  // يجعل التقدّم الخطي (الزمن الكلي ÷ عدد الحروف) يسبق الصوت أثناء أي توقف.
  async function analyzeSpeechTiming(blob) {
    const arrBuf = await blob.arrayBuffer();
    const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
    let audioBuffer;
    try { audioBuffer = await tmpCtx.decodeAudioData(arrBuf); }
    finally { try { tmpCtx.close(); } catch (e) {} }

    const data = audioBuffer.getChannelData(0); // القناة الأولى كافية لتقدير مواضع الصمت
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = Math.max(1, Math.round(sampleRate * 0.03)); // نافذة تحليل ٣٠ مللي ثانية
    const windows = Math.ceil(data.length / windowSize);
    const rms = new Float32Array(windows);
    let maxRms = 0;
    for (let w = 0; w < windows; w++) {
      const start = w * windowSize, end = Math.min(start + windowSize, data.length);
      let sum = 0;
      for (let i = start; i < end; i++) sum += data[i] * data[i];
      const val = Math.sqrt(sum / (end - start || 1));
      rms[w] = val;
      if (val > maxRms) maxRms = val;
    }
    const threshold = maxRms * 0.08; // عتبة تكيّفية بسيطة لتمييز الكلام عن الصمت
    const windowDur = windowSize / sampleRate;
    const cumulative = new Float32Array(windows);
    let acc = 0;
    for (let w = 0; w < windows; w++) { if (rms[w] > threshold) acc += windowDur; cumulative[w] = acc; }

    return {
      totalSpeakingTime: acc || audioBuffer.duration || 1,
      spokenTimeAt(t) {
        const idx = Math.min(windows - 1, Math.max(0, Math.floor(t / windowDur)));
        return cumulative[idx];
      }
    };
  }

  function stopTypewriterAnimation() {
    if (window.twInterval) { clearInterval(window.twInterval); window.twInterval = null; }
    if (window.twRAF) { cancelAnimationFrame(window.twRAF); window.twRAF = null; }
    if (window.twAudioEl) {
      window.twAudioEl.removeEventListener('seeked', window.twOnSeek || (()=>{}));
      window.twAudioEl = null;
    }
  }

  async function startTypewriterAnimation() {
    const textEl = $('#twText');
    const board = $('#twBoard');
    if (!textEl || !board) return;

    const rawText = textEl.dataset.originalText || textEl.textContent || textEl.innerText;
    if (!textEl.dataset.originalText) textEl.dataset.originalText = rawText;
    if (!rawText.trim()) return;

    stopTypewriterAnimation();

    const chars = rawText.split('');
    const audioEl = $('.audio-player');

    textEl.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    textEl.appendChild(cursor);

    // يرسم الحروف حتى الفهرس المطلوب دفعة واحدة (يدعم التقدّم والتراجع لو أعاد المستخدم الصوت للخلف)
    let shownCount = 0;
    function renderUpTo(targetIndex) {
      targetIndex = Math.max(0, Math.min(targetIndex, chars.length));
      if (targetIndex === shownCount) return;
      if (targetIndex > shownCount) {
        const frag = document.createDocumentFragment();
        for (let k = shownCount; k < targetIndex; k++) frag.appendChild(document.createTextNode(chars[k]));
        textEl.insertBefore(frag, cursor);
      } else {
        // تراجع: أعد بناء النص المعروض حتى الفهرس الجديد فقط
        textEl.innerHTML = '';
        textEl.appendChild(document.createTextNode(chars.slice(0, targetIndex).join('')));
        textEl.appendChild(cursor);
      }
      shownCount = targetIndex;
      board.scrollTop = board.scrollHeight;
    }

    if (audioEl && !isNaN(audioEl.duration) && audioEl.duration > 0) {
      window.twAudioEl = audioEl;

      // 1. نحاول تحليل الصوت فعليًا لمعرفة فترات الكلام الحقيقية (الأدق) — نربط تقدّم الكتابة
      // بـ"زمن الكلام الفعلي المنقضي" بدل الزمن الكلي، فيتجمّد النص أثناء أي صمت أو وقفة حقيقية.
      let timing = null;
      try {
        const srcBlob = await fetch(audioEl.src).then(r => r.blob());
        timing = await analyzeSpeechTiming(srcBlob);
      } catch (e) { timing = null; }

      audioEl.currentTime = 0;
      audioEl.play();

      const tick = () => {
        let progress;
        if (timing) {
          progress = Math.max(0, Math.min(timing.spokenTimeAt(audioEl.currentTime) / timing.totalSpeakingTime, 1));
        } else {
          // احتياط: لو تعذّر تحليل الصوت (تنسيق غير مدعوم مثلاً)، نستخدم النسبة الزمنية الخطية كما كانت
          progress = Math.max(0, Math.min(audioEl.currentTime / audioEl.duration, 1));
        }
        renderUpTo(Math.round(progress * chars.length));
        if (progress >= 1 || audioEl.ended) {
          cursor.style.display = 'none';
          window.twRAF = null;
          return;
        }
        window.twRAF = requestAnimationFrame(tick);
      };
      window.twRAF = requestAnimationFrame(tick);

      // لو أوقف المستخدم الصوت أو انتهى، أوقف الحلقة بأمان
      audioEl.addEventListener('ended', () => { cursor.style.display = 'none'; if (window.twRAF) { cancelAnimationFrame(window.twRAF); window.twRAF = null; } }, { once: true });
      return;
    }

    // 2. لا يوجد صوت: كتابة بسرعة ثابتة افتراضية (كما كانت سابقًا)
    const typingSpeed = 35;
    let i = 0;
    window.twInterval = setInterval(() => {
      if (i >= chars.length) {
        clearInterval(window.twInterval);
        window.twInterval = null;
        cursor.style.display = 'none';
        return;
      }
      renderUpTo(i + 1);
      i++;
    }, typingSpeed);
  }

// ══════════════════════════════════════════════════════════════
  // 🚀 دوال التحضير السريع من بنك الدروس
  // ══════════════════════════════════════════════════════════════
  let activePrepBankId = null;

  window.openBankPrepModal = async function(id) {
     const rec = await dbGet(EXTRACTS_STORE, id);
     if (!rec) { toast('تعذر العثور على الدرس', 'error'); return; }
     activePrepBankId = id;
     $('#bankPrepModalTitle').textContent = '🚀 تحضير: ' + (rec.title || 'درس');
     $('#bankPrepModal').classList.add('is-active');
  };

  window.triggerBankPrep = async function(action) {
     if (!activePrepBankId) return;
     const rec = await dbGet(EXTRACTS_STORE, activePrepBankId);
     if (!rec) return;

     $('#bankPrepModal').classList.remove('is-active');

     // تجهيز نموذج "تحضير جديد" بالخفاء ببيانات هذا الدرس
     resetNewForm();
     $('#fTitle').value   = rec.title   || '';
     $('#fSubject').value = rec.subject || state.settings.subject || '';
     $('#fGrade').value   = rec.grade   || '';
     $('#pastedText').value = rec.content || '';
     state.sourceType = 'text';
     $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === 'text'));
     ['title','text','images','pdf','library'].forEach(s => { $('#panel-'+s).hidden = s !== 'text'; });
     
     // محاكاة النقر على زر التوليد المطلوب بعد تهيئة البيانات
     setTimeout(() => {
         if (action === 'plan') $('#btnGenerate').click();
         else if (action === 'realworld') { if (window.generateRealWorldConnection) window.generateRealWorldConnection(); }
         else if (action === 'mentor') { if (window.generateTeachingMentor) window.generateTeachingMentor(); }
         else if (action === 'board') $('#btnGenerateBoard').click();
         else if (action === 'audio') $('#btnGenerateAudio').click();
         else if (action === 'quiz') $('#btnGenerateQuiz').click();
         else if (action === 'mindmap') $('#btnGenerateMindmap').click();
         else if (action === 'answers') { if ($('#btnGenerateAnswers')) $('#btnGenerateAnswers').click(); }
     }, 150);
  };

  window.openBankLessonEditFromPrep = function() {
     $('#bankPrepModal').classList.remove('is-active');
     if (activePrepBankId) openBankLessonModal(activePrepBankId);
  };
  
  // ══════════════════════════════════════════════════════════════
  // 🔍 محرك البحث الشامل (Global Search Engine)
  // ══════════════════════════════════════════════════════════════
  
  async function openGlobalSearch() {
      const modal = $('#globalSearchModal');
      const input = $('#globalSearchInput');
      const resultsDiv = $('#globalSearchResults');
      
      input.value = '';
      resultsDiv.innerHTML = '<div style="text-align: center; color: #94A3B8; font-weight: bold; margin-top: 50px; font-size: 1.2rem;">🔍 اكتب كلمة للبحث في جميع أقسام الذكي...</div>';
      modal.classList.add('is-active');
      
      // تأخير بسيط لضمان فتح النافذة ثم التركيز على مربع النص تلقائياً ليظهر الكيبورد
      setTimeout(() => input.focus(), 100);
  }

  async function performGlobalSearch() {
      const query = $('#globalSearchInput').value.trim();
      const resultsDiv = $('#globalSearchResults');
      
      if (!query) {
          resultsDiv.innerHTML = '<div style="text-align: center; color: #94A3B8; font-weight: bold; margin-top: 50px; font-size: 1.2rem;">🔍 اكتب كلمة للبحث...</div>';
          return;
      }

      resultsDiv.innerHTML = '<div style="text-align: center; color: #64748B; font-weight: bold; margin-top: 20px;">⏳ جاري البحث...</div>';

      try {
          // جلب البيانات من جميع الأقسام في نفس اللحظة!
          const [lessons, extracts, books] = await Promise.all([
              dbGetAll(LESSONS_STORE),
              dbGetAll(EXTRACTS_STORE),
              dbGetAll(BOOKS_STORE)
          ]);

          let html = '';
          let totalResults = 0;

          // 1. البحث في الأرشيف (الخطط والسبورات والاختبارات)
          const matchedLessons = fuzzyRank(query, lessons, r => r.title + ' ' + (r.subject||'')).slice(0, 5);
          if (matchedLessons.length > 0) {
              html += `<h4 style="color: #7C3AED; margin: 0 0 10px 0; font-size: 1.1rem; border-bottom: 2px dashed #E2E8F0; padding-bottom: 5px;">📁 نتائج الأرشيف</h4>`;
              matchedLessons.forEach(m => {
                  const r = m.item;
                  const icon = r.kind === 'board' ? '🖍️' : r.kind === 'audio' ? '🎧' : r.kind === 'exam' ? '🧪' : r.kind === 'quiz' ? '📝' : r.kind === 'mindmap' ? '🧠' : '📋';
                  html += `
                  <div onclick="executeGlobalResult('archive', ${r.id})" style="background: white; border: 1px solid #CBD5E1; padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                      <span style="font-size: 1.5rem;">${icon}</span>
                      <div>
                          <div style="font-weight: bold; color: #1E293B; font-size: 1.1rem;">${esc(r.title)}</div>
                          <div style="font-size: 0.85rem; color: #64748B;">${esc(r.subject || 'عام')} | ${esc(r.grade || 'عام')}</div>
                      </div>
                  </div>`;
              });
              totalResults += matchedLessons.length;
          }

          // 2. البحث في بنك الدروس
          const matchedExtracts = fuzzyRank(query, extracts, r => r.title + ' ' + (r.subject||'')).slice(0, 5);
          if (matchedExtracts.length > 0) {
              html += `<h4 style="color: #059669; margin: 15px 0 10px 0; font-size: 1.1rem; border-bottom: 2px dashed #E2E8F0; padding-bottom: 5px;">📝 نتائج بنك الدروس</h4>`;
              matchedExtracts.forEach(m => {
                  const r = m.item;
                  html += `
                  <div onclick="executeGlobalResult('bank', ${r.id})" style="background: white; border: 1px solid #CBD5E1; padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                      <span style="font-size: 1.5rem;">📑</span>
                      <div>
                          <div style="font-weight: bold; color: #1E293B; font-size: 1.1rem;">${esc(r.title)}</div>
                          <div style="font-size: 0.85rem; color: #64748B;">درس مستخرج | ${esc(r.subject || '')}</div>
                      </div>
                  </div>`;
              });
              totalResults += matchedExtracts.length;
          }

          // 3. البحث في المكتبة
          const matchedBooks = fuzzyRank(query, books, b => b.name).slice(0, 5);
          if (matchedBooks.length > 0) {
              html += `<h4 style="color: #D97706; margin: 15px 0 10px 0; font-size: 1.1rem; border-bottom: 2px dashed #E2E8F0; padding-bottom: 5px;">📚 نتائج المكتبة</h4>`;
              matchedBooks.forEach(m => {
                  const b = m.item;
                  html += `
                  <div onclick="executeGlobalResult('library', ${b.id})" style="background: white; border: 1px solid #CBD5E1; padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                      <span style="font-size: 1.5rem;">📖</span>
                      <div>
                          <div style="font-weight: bold; color: #1E293B; font-size: 1.1rem;">${esc(b.name)}</div>
                          <div style="font-size: 0.85rem; color: #64748B;">كتاب إلكتروني | ${b.pageCount} صفحة</div>
                      </div>
                  </div>`;
              });
              totalResults += matchedBooks.length;
          }

          if (totalResults === 0) {
              resultsDiv.innerHTML = '<div style="text-align: center; color: #EF4444; font-weight: bold; margin-top: 50px; font-size: 1.2rem;">❌ لم يتم العثور على أي نتائج مطابقة.</div>';
          } else {
              resultsDiv.innerHTML = html;
          }

      } catch (err) {
          console.error(err);
          resultsDiv.innerHTML = '<div style="text-align: center; color: #EF4444; font-weight: bold; margin-top: 50px;">حدث خطأ أثناء البحث.</div>';
      }
  }

  // دالة توجيه الضغطة على النتيجة إلى مكانها الصحيح
  window.executeGlobalResult = async function(type, id) {
      $('#globalSearchModal').classList.remove('is-active');
      
      if (type === 'archive') {
          openArchiveItem(id);
      } else if (type === 'bank') {
          navigate('bank');
          await loadKnowledgeBank();
          openBankLessonModal(id);
      } else if (type === 'library') {
          navigate('library');
          openBookReader(id);
      }
  };

  // ══════════════════════════════════════════════════════════════
  // 📊 محرك الإحصائيات الشاملة للتطبيق (App Statistics) - المطور
  // ══════════════════════════════════════════════════════════════
  
  window.openAppStatistics = async function() {
      showOverlay('جاري جمع وتحليل الإحصائيات...');
      try {
          // جلب جميع البيانات من قاعدة البيانات دفعة واحدة وحفظها في متغيرات عامة للفلترة
          const [lessons, extracts, books] = await Promise.all([
              dbGetAll(LESSONS_STORE),
              dbGetAll(EXTRACTS_STORE),
              dbGetAll(BOOKS_STORE)
          ]);
          
          window._rawStatsLessons = lessons;
          window._rawStatsExtracts = extracts;
          window._rawStatsBooks = books;

          // استخراج الصفوف والمواد الفريدة لإنشاء قوائم الفلترة
          const allGrades = [...new Set([...lessons, ...extracts].map(r => (r.grade || '').trim()).filter(Boolean))].sort();
          const allSubjects = [...new Set([...lessons, ...extracts].map(r => (r.subject || '').trim()).filter(Boolean))].sort();

          // بناء هيكل النافذة مع قوائم الفلترة العلوية
          let filterHtml = `
          <div style="display: flex; gap: 10px; margin-bottom: 15px; background: #f1f5f9; padding: 12px; border-radius: 12px; border: 1px solid #cbd5e1;">
              <select id="statsGradeFilter" onchange="updateAppStatsView()" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #94a3b8; font-family: inherit; font-weight: bold; color: #334155; outline: none;">
                  <option value="">🏫 جميع الصفوف</option>
                  ${allGrades.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
              <select id="statsSubjectFilter" onchange="updateAppStatsView()" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #94a3b8; font-family: inherit; font-weight: bold; color: #334155; outline: none;">
                  <option value="">📚 جميع المواد</option>
                  ${allSubjects.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
          </div>
          <div id="statsResultsContainer"></div>
          `;

          // حقن هيكل الفلاتر
          document.getElementById('appStatsContent').innerHTML = filterHtml;
          
          // تشغيل دالة العرض الافتراضية
          window.updateAppStatsView();

          hideOverlay();
          document.getElementById('appStatsModal').classList.add('is-active');

      } catch (err) {
          console.error(err);
          hideOverlay();
          toast('تعذر حساب الإحصائيات، تأكد من البيانات.', 'error');
      }
  };

  // دالة تحديث الأرقام والرسوم بناءً على الفلاتر
  window.updateAppStatsView = function() {
      const gradeFilter = document.getElementById('statsGradeFilter').value;
      const subjectFilter = document.getElementById('statsSubjectFilter').value;

      // فلترة البيانات
      let filteredLessons = window._rawStatsLessons || [];
      let filteredExtracts = window._rawStatsExtracts || [];

      if (gradeFilter) {
          filteredLessons = filteredLessons.filter(r => (r.grade || '').trim() === gradeFilter);
          filteredExtracts = filteredExtracts.filter(r => (r.grade || '').trim() === gradeFilter);
      }
      if (subjectFilter) {
          filteredLessons = filteredLessons.filter(r => (r.subject || '').trim() === subjectFilter);
          filteredExtracts = filteredExtracts.filter(r => (r.subject || '').trim() === subjectFilter);
      }

      // كائنات لتخزين العدادات
      let stats = { plan: 0, board: 0, audio: 0, quiz: 0, exam: 0, mindmap: 0, answers: 0 };
      let subjectCount = {};

      filteredLessons.forEach(l => {
          const kind = l.kind || 'plan';
          if (stats[kind] !== undefined) stats[kind]++;
          else stats[kind] = 1;

          const subj = (l.subject || 'عام').trim();
          subjectCount[subj] = (subjectCount[subj] || 0) + 1;
      });

      // ترتيب المواد تنازلياً حسب الأكثر تحضيراً
      const sortedSubjects = Object.entries(subjectCount).sort((a, b) => b[1] - a[1]);

      let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 25px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #7c3aed; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">📋</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.plan}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">خطة درسية</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #f59e0b; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">🖍️</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.board}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">سبورة</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #10b981; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">📝</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.quiz}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">ملخص</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #ef4444; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">🧪</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.exam}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">اختبار</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #06b6d4; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">🧠</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.mindmap}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">خريطة</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #ec4899; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">🎧</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.audio}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">صوتي</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-bottom: 4px solid #db2777; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 1.8rem;">💡</div>
              <div style="font-size: 1.3rem; font-weight: 900; color: #1e293b; margin: 3px 0;">${stats.answers || 0}</div>
              <div style="font-size: 0.8rem; color: #64748b; font-weight: bold;">إجابة تقويم</div>
          </div>
      </div>

      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
          <div style="flex: 1; background: #e0f2fe; border: 1px solid #bae6fd; padding: 15px; border-radius: 10px; text-align: center;">
              <span style="font-size: 1.8rem; display: block;">📑</span>
              <div style="font-size: 1.3rem; font-weight: 900; color: #0369a1;">${filteredExtracts.length}</div>
              <div style="font-size: 0.85rem; color: #0284c7; font-weight: bold;">دروس في البنك</div>
          </div>
          <div style="flex: 1; background: #fef3c7; border: 1px solid #fde68a; padding: 15px; border-radius: 10px; text-align: center; opacity: ${gradeFilter || subjectFilter ? '0.5' : '1'};">
              <span style="font-size: 1.8rem; display: block;">📚</span>
              <div style="font-size: 1.3rem; font-weight: 900; color: #b45309;">${window._rawStatsBooks ? window._rawStatsBooks.length : 0}</div>
              <div style="font-size: 0.85rem; color: #d97706; font-weight: bold;">كتب بالمكتبة (عام)</div>
          </div>
      </div>

      <h3 style="color: #4c1d95; font-size: 1.1rem; border-bottom: 2px dashed #cbd5e1; padding-bottom: 5px; margin-bottom: 15px; font-weight: 900;">
        📊 ${subjectFilter ? 'الإنجاز في المادة المحددة' : 'أكثر المواد التي قمت بتحضيرها'}
      </h3>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px;">
      `;

      // رسم بياني مبني بالـ CSS
      if (sortedSubjects.length === 0) {
          html += `<p style="text-align:center; color:#94a3b8; font-weight:bold; margin:0;">لا توجد بيانات مطابقة للفلتر.</p>`;
      } else {
          const maxSubjCount = sortedSubjects[0][1];
          sortedSubjects.forEach(s => {
              const width = Math.max(8, (s[1] / maxSubjCount) * 100);
              html += `
              <div style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 900; color: #334155; margin-bottom: 4px;">
                      <span>${s[0]}</span>
                      <span>${s[1]} إنجاز</span>
                  </div>
                  <div style="background: #f1f5f9; height: 10px; border-radius: 5px; overflow: hidden;">
                      <div style="background: linear-gradient(90deg, #7c3aed, #a855f7); width: ${width}%; height: 100%; border-radius: 5px; transition: width 0.5s ease;"></div>
                  </div>
              </div>
              `;
          });
      }

      html += `</div>`;

      document.getElementById('statsResultsContainer').innerHTML = html;
  };

  // ══════════════════════════════════════════════════════════════
  // 🧹 محرك تنظيف الملفات المكررة (مع ميزة اختيار النسخة المفضلة)
  // ══════════════════════════════════════════════════════════════
  window.openDuplicatesManager = async function() {
    showOverlay('جاري فحص الملفات المكررة...');
    try {
      const db = await openDB();

      const books = await new Promise((resolve) => {
        try {
          const tx = db.transaction(BOOKS_STORE, 'readonly');
          const store = tx.objectStore(BOOKS_STORE);
          const list = [];
          const req = store.openCursor();
          req.onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
              list.push({ id: cursor.value.id, name: cursor.value.name, addedAt: cursor.value.addedAt });
              cursor.continue();
            } else {
              resolve(list);
            }
          };
          req.onerror = () => resolve([]);
        } catch(err) {
          resolve([]);
        }
      });

      const extracts = await dbGetAll(EXTRACTS_STORE);
      const lessons = await dbGetAll(LESSONS_STORE);

      // دالة مساعدة لمعرفة أحدث تاريخ للملف
      const getItemTime = item => item.updatedAt || item.savedAt || item.addedAt || item.createdAt || 0;

      // 1. تجميع وترتيب الكتب (الأحدث أولاً)
      const bookGroups = {};
      books.forEach(b => {
        const key = (b.name || '').trim().toLowerCase();
        if (!key) return;
        if (!bookGroups[key]) bookGroups[key] = [];
        bookGroups[key].push(b);
      });
      const duplicateBooks = Object.values(bookGroups)
        .filter(g => g.length > 1)
        .map(g => g.sort((a, b) => getItemTime(b) - getItemTime(a)));

      // 2. تجميع وترتيب دروس البنك (الأحدث أولاً)
      const extractGroups = {};
      extracts.forEach(e => {
        const key = ((e.title || '').trim() + '|' + (e.subject || '').trim()).toLowerCase();
        if (!key) return;
        if (!extractGroups[key]) extractGroups[key] = [];
        extractGroups[key].push(e);
      });
      const duplicateExtracts = Object.values(extractGroups)
        .filter(g => g.length > 1)
        .map(g => g.sort((a, b) => getItemTime(b) - getItemTime(a)));

      // 3. تجميع وترتيب ملفات الأرشيف (الأحدث أولاً)
      const lessonGroups = {};
      lessons.forEach(l => {
        const key = ((l.title || '').trim() + '|' + (l.kind || 'plan')).toLowerCase();
        if (!key) return;
        if (!lessonGroups[key]) lessonGroups[key] = [];
        lessonGroups[key].push(l);
      });
      const duplicateLessons = Object.values(lessonGroups)
        .filter(g => g.length > 1)
        .map(g => g.sort((a, b) => getItemTime(b) - getItemTime(a)));

      hideOverlay();

      if (duplicateBooks.length === 0 && duplicateExtracts.length === 0 && duplicateLessons.length === 0) {
        toast('تطبيقك نظيف! لا توجد أي ملفات مكررة.', 'success');
        return;
      }

      const oldModal = document.getElementById('dupModalBg');
      if (oldModal) oldModal.remove();

      const modalHtml = `
        <div id="dupModalBg" class="modal-bg is-active" style="z-index:9999;">
          <div class="modal-card" style="max-height: 85vh; overflow-y: auto; width: 90%; max-width: 480px;">
            <div class="modal-hdr" style="justify-content: center; position: relative; border-bottom: 2px dashed #e2e8f0;">
              <h2 style="color: #4f46e5; margin: 0; font-size: 20px;">🧹 تنظيف الملفات المكررة</h2>
              <button type="button" class="modal-close" style="position: absolute; left: 0; top: -5px;" onclick="document.getElementById('dupModalBg').remove()">✕</button>
            </div>
            <div class="modal-body" style="padding: 15px;">
              <p style="margin-bottom: 15px; font-size: 13px; color: #475569; font-weight: bold; text-align: center; line-height: 1.6; background: #eef2ff; padding: 10px; border-radius: 8px;">
                💡 تم ترتيب النسخ بحيث تظهر <b>الأحدث</b> أولاً.<br>
                اختر الدائرة أمام <span style="color:#059669;">النسخة التي تريد الإبقاء عليها</span>، وسيتم حذف الباقي تلقائياً.
              </p>
              <div id="dupListContainer"></div>
              <button id="btnDeleteSelectedDups" class="btn-primary" style="width: 100%; margin-top: 20px; background-color: #ef4444; padding: 12px; font-size: 16px; border-radius: 12px; font-weight: 900; border: none; cursor: pointer;">🗑️ حذف النسخ الزائدة</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const listContainer = document.getElementById('dupListContainer');
      let listHtml = '';

      let groupCounter = 0;
      const buildGroupHtml = (groups, type, title, color, icon) => {
        if (groups.length === 0) return '';
        let html = '<h4 style="color: ' + color + '; margin-bottom: 10px; font-size: 15px; margin-top: 15px;">' + title + '</h4>';
        
        groups.forEach(group => {
          groupCounter++;
          const groupRadioName = 'keep_group_' + groupCounter;
          const dispTitle = type === 'book' ? group[0].name : group[0].title;

          html += '<div class="dup-group-box" data-type="' + type + '" style="background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 12px; margin-bottom: 12px; border-radius: 10px;">';
          html += '<div style="font-weight: 900; font-size: 14px; color: #1e293b; margin-bottom: 8px;">' + icon + ' ' + esc(dispTitle) + '</div>';
          
          group.forEach((item, index) => {
            const isSelectedToKeep = index === 0; // تلقائياً يتم تفضيل الأحدث
            const dateVal = getItemTime(item);
            const dateLabel = dateVal ? new Date(dateVal).toLocaleDateString('ar-EG') + ' ' + new Date(dateVal).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) : 'بدون تاريخ';
            
            html += `
              <label style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; font-size: 13px; color: #334155; background: ${isSelectedToKeep ? '#ecfdf5' : '#ffffff'}; border: 1px solid ${isSelectedToKeep ? '#a7f3d0' : '#cbd5e1'}; padding: 8px 10px; border-radius: 6px; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="radio" name="${groupRadioName}" class="keep-radio" data-id="${item.id}" value="${item.id}" ${isSelectedToKeep ? 'checked' : ''} style="transform: scale(1.2);">
                  <span>نسخة ${index + 1} (${dateLabel})</span>
                </div>
                <span class="keep-badge" style="font-size: 11px; font-weight: bold; color: ${isSelectedToKeep ? '#059669' : '#dc2626'};">
                  ${isSelectedToKeep ? '✓ إبقاء' : '✕ حذف'}
                </span>
              </label>
            `;
          });
          html += '</div>';
        });
        return html;
      };

      listHtml += buildGroupHtml(duplicateBooks, 'book', '📚 الكتب والمكتبة', '#D97706', '📖');
      listHtml += buildGroupHtml(duplicateExtracts, 'extract', '📝 دروس واختبارات (البنك)', '#059669', '📑');
      listHtml += buildGroupHtml(duplicateLessons, 'lesson', '📁 الأرشيف (الخطط والسبورات)', '#7C3AED', '📋');

      listContainer.innerHTML = listHtml;

      // تفاعل بصري فوري عند تغيير النسخة المفضلة:
      listContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('keep-radio')) {
          const groupBox = e.target.closest('.dup-group-box');
          groupBox.querySelectorAll('label').forEach(lbl => {
            const radio = lbl.querySelector('.keep-radio');
            const badge = lbl.querySelector('.keep-badge');
            if (radio.checked) {
              lbl.style.background = '#ecfdf5';
              lbl.style.borderColor = '#a7f3d0';
              badge.textContent = '✓ إبقاء';
              badge.style.color = '#059669';
            } else {
              lbl.style.background = '#ffffff';
              lbl.style.borderColor = '#cbd5e1';
              badge.textContent = '✕ حذف';
              badge.style.color = '#dc2626';
            }
          });
        }
      });

      // زر تنفيذ حذف النسخ الزائدة:
      document.getElementById('btnDeleteSelectedDups').addEventListener('click', async () => {
        const groupBoxes = document.querySelectorAll('.dup-group-box');
        const toDelete = { book: [], extract: [], lesson: [] };
        let deleteTotalCount = 0;

        groupBoxes.forEach(box => {
          const type = box.dataset.type;
          const radios = box.querySelectorAll('.keep-radio');
          radios.forEach(r => {
            // أي نسخة لم يتم اختيارها للإبقاء تُرسل لقائمة الحذف
            if (!r.checked) {
              toDelete[type].push(Number(r.dataset.id));
              deleteTotalCount++;
            }
          });
        });

        if (deleteTotalCount === 0) {
          toast('لا توجد ملفات محددة للحذف', 'error');
          return;
        }

        if (!confirm(`هل أنت متأكد من حذف ${deleteTotalCount} نسخة زائدة؟ ستبقى لك النسخ التي اخترتها فقط.`)) return;

        showOverlay('جاري الحذف والتنظيف السريع...');

        try {
          const transDb = await openDB();
          const storesToOpen = [];
          if (toDelete.book.length) storesToOpen.push(BOOKS_STORE);
          if (toDelete.extract.length) storesToOpen.push(EXTRACTS_STORE);
          if (toDelete.lesson.length) storesToOpen.push(LESSONS_STORE);

          if (storesToOpen.length > 0) {
            const tx = transDb.transaction(storesToOpen, 'readwrite');
            toDelete.book.forEach(id => tx.objectStore(BOOKS_STORE).delete(id));
            toDelete.extract.forEach(id => tx.objectStore(EXTRACTS_STORE).delete(id));
            toDelete.lesson.forEach(id => tx.objectStore(LESSONS_STORE).delete(id));

            await new Promise((resolve, reject) => {
              tx.oncomplete = resolve;
              tx.onerror = () => reject(tx.error);
            });
          }

          document.getElementById('dupModalBg').remove();

          if (toDelete.book.length) {
            if (typeof refreshLibraryList === 'function') await refreshLibraryList();
            if (typeof refreshLibrarySelect === 'function') await refreshLibrarySelect();
          }
          if (toDelete.extract.length && typeof loadKnowledgeBank === 'function') {
            await loadKnowledgeBank();
          }
          if (toDelete.lesson.length && typeof refreshArchiveList === 'function') {
            await refreshArchiveList();
          }

          hideOverlay();
          toast(`تم تنظيف ${deleteTotalCount} ملف مكرر بنجاح! ✨`, 'success');

        } catch (delErr) {
          hideOverlay();
          console.error(delErr);
          toast('حدث خطأ أثناء الحذف', 'error');
        }
      });

    } catch (err) {
      hideOverlay();
      console.error(err);
      toast('حدث خطأ أثناء فحص الملفات', 'error');
    }
  };

  /* ═══ INIT ═══ */
  function init() {
    loadSettings();
    populateSettingsForm();
    resetNewForm();
            // ربط محرك البحث الشامل
    $('#btnGlobalSearch')?.addEventListener('click', openGlobalSearch);
    $('#globalSearchInput')?.addEventListener('input', performGlobalSearch);
    applyFontScale(state.fontScale);
    try { applyTheme(localStorage.getItem('haael_theme')||'purple'); $('#themeSelect').value = localStorage.getItem('haael_theme')||'purple'; } catch(e){}
    // إجبار التطبيق على استخدام خط المهند كخيار أولي إذا لم يقم المعلم بتغييره
try { const f = localStorage.getItem('haael_font') || "'AlMohanad', serif"; applyFont(f); $('#fontFamilySelect').value=f; } catch(e){}


    $('#btnBack').addEventListener('click', handleBackAction);

    // أكورديون شاشة "تحضير جديد" — قسم واحد فقط يبقى مفتوحاً بنفس الوقت
    $('#newAccordion')?.addEventListener('click', e => {
      const head = e.target.closest('.acc-head'); if (!head) return;
      const item = head.closest('.acc-item');
      const panel = $('.acc-panel', item);
      const wasOpen = item.classList.contains('is-open');
      $$('.acc-item', $('#newAccordion')).forEach(it => {
        it.classList.remove('is-open');
        $('.acc-panel', it).hidden = true;
      });
      if (!wasOpen) { item.classList.add('is-open'); panel.hidden = false; }
    });

    // زر الرجوع الفعلي بجهاز أندرويد (Cordova) — بدونه يكون التنقل غامضاً لأن هذا
    // الزر لا يرتبط بأي منطق داخل التطبيق. الأولوية: إغلاق أي نافذة/عارض مفتوح، ثم
    // الرجوع خطوة بالتنقل، وأخيراً تأكيد الخروج إن كنا بالشاشة الرئيسية بلا شيء مفتوح
    document.addEventListener('deviceready', function () {
      document.addEventListener('backbutton', function (e) {
        e.preventDefault();
        if (closeTopmostOverlay()) return;
        if (state.viewStack.length > 1) { goBack(); return; }
        if (navigator.app && navigator.app.exitApp) {
          if (confirm('هل تريد الخروج من تطبيق الذكي؟')) navigator.app.exitApp();
        }
      }, false);
    }, false);
    $$('.tile').forEach(t => t.addEventListener('click', () => {
      const d = t.dataset.nav;
      if (d === 'help') { $('#helpModal').classList.add('is-active'); return; }
      navigate(d);
      if (d==='new')      resetNewForm();
      if (d==='archive')  refreshArchiveList();
      if (d==='library')  { refreshLibraryList(); refreshLibrarySelect(); }
      if (d==='settings') populateSettingsForm();
    }));

    $('#helpAccordion').addEventListener('click', e => {
      const head = e.target.closest('.help-head'); if (!head) return;
      const panel = head.nextElementSibling;
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      head.classList.toggle('is-open', !isOpen);
    });

        $('#btnHelp')?.addEventListener('click', () => $('#helpModal').classList.add('is-active'));
    $('#btnCloseHelp')?.addEventListener('click', () => $('#helpModal').classList.remove('is-active'));
    $('#helpModal')?.addEventListener('click', e => { if (e.target===$('#helpModal')) $('#helpModal').classList.remove('is-active'); });

    $('#btnFontMinus').addEventListener('click', () => applyFontScale(state.fontScale - 0.1));
    $('#btnFontPlus').addEventListener('click',  () => applyFontScale(state.fontScale + 0.1));
    $('#fontFamilySelect').addEventListener('change', e => applyFont(e.target.value));
    $('#themeSelect').addEventListener('change', e => applyTheme(e.target.value));

    wireSegmented('langSegment',   'lang',   onLanguageChange);
    wireSegmented('sourceSegment', 'source', onSourceChange);
    wireSegmented('archiveKindSegment', 'kind', onArchiveKindChange);
    wireSegmented('boardThemeSegment', 'theme', onBoardThemeChange);

    $('#btnPickImages').addEventListener('click', handleImagePick);
    $('#imageInput').addEventListener('change', handleImagesChange);
    $('#btnPickPdf').addEventListener('click', handlePdfPick);
    $('#pdfInput').addEventListener('change', handlePdfChange);
        // --- أزرار إعادة المحاولة ---
    $('#btnRetryImages').addEventListener('click', () => {
      const inp = $('#imageInput');
      if (inp.files && inp.files.length) handleImagesChange({ target: inp });
      else toast('الرجاء اختيار صور أولاً', 'error');
    });

    $('#btnRetryPdf').addEventListener('click', () => {
      const inp = $('#pdfInput');
      if (inp.files && inp.files.length) handlePdfChange({ target: inp });
      else toast('الرجاء اختيار ملف أولاً', 'error');
    });
    // ----------------------------
    $('#btnExtractFromLib').addEventListener('click', onExtractFromLib);
    $('#libraryBookSelect').addEventListener('change', renderLibraryToc);
    $('#libTocList').addEventListener('click', e => {
      const item = e.target.closest('.toc-item');
      if (!item) return;
      $('#libPageFrom').value = item.dataset.from;
      $('#libPageTo').value = item.dataset.to;
      if (item.dataset.title) $('#fTitle').value = item.dataset.title;
      onExtractFromLib();
    });
    $('#btnCloseTocRange').addEventListener('click', () => $('#tocRangeModal').classList.remove('is-active'));
    $('#tocRangeModal').addEventListener('click', e => { if (e.target === $('#tocRangeModal')) $('#tocRangeModal').classList.remove('is-active'); });
    $('#btnConfirmTocRange').addEventListener('click', () => {
      const bookId = Number($('#tocRangeModal').dataset.bookId);
      const from = parseInt($('#tocRangeFrom').value) || 1;
      const to = parseInt($('#tocRangeTo').value) || from;
      const offset = parseInt($('#tocOffsetPages')?.value) || 0;
      runTocExtraction(bookId, from, to, offset);
    });
    $('#btnCloseTocView').addEventListener('click', () => $('#tocViewModal').classList.remove('is-active'));
    $('#tocViewModal').addEventListener('click', e => { if (e.target === $('#tocViewModal')) $('#tocViewModal').classList.remove('is-active'); });
    $('#tocViewList').addEventListener('click', e => {
      const item = e.target.closest('.toc-item');
      if (!item) return;
      jumpToLibraryTopic(Number(item.dataset.book), Number(item.dataset.from), Number(item.dataset.to), item.dataset.title);
    });
    $('#btnUploadBook').addEventListener('click', () => $('#bookInput').click());
    $('#bookInput').addEventListener('change', handleBookUpload);

    $('#btnGenerate').addEventListener('click', onGenerate);
    $('#btnGenerateBoard').addEventListener('click', onGenerateBoard);
    $('#btnGenerateAudio').addEventListener('click', onGenerateAudio);
    $('#btnGenerateQuiz').addEventListener('click', onGenerateQuiz);
    $('#btnGenerateMindmap').addEventListener('click', onGenerateMindmap);
    $('#btnGenerateAnswers')?.addEventListener('click', onGenerateAnswers);

    $('#btnSaveArchive').addEventListener('click', onSaveArchive);
    $('#btnPrint').addEventListener('click', printPlan);
    $('#btnExportPdf').addEventListener('click', exportPdf);
    $('#btnExportWord').addEventListener('click', exportWord);
    $('#btnExportTxt').addEventListener('click', exportText);
    $('#btnExportImg').addEventListener('click', exportImage);
    $('#btnGeneratePptx').addEventListener('click', openPptxSettingsModal);
    $('#btnClosePptxSettings').addEventListener('click', () => $('#pptxSettingsModal').classList.remove('is-active'));
    $('#pptxSettingsModal').addEventListener('click', e => { if (e.target === $('#pptxSettingsModal')) $('#pptxSettingsModal').classList.remove('is-active'); });
    $('#btnConfirmPptxGen').addEventListener('click', onGeneratePptx);

    $('#btnCloseReader').addEventListener('click', closeBookReader);
    $('#btnReaderPrev').addEventListener('click', readerPrev);
    $('#btnReaderNext').addEventListener('click', readerNext);
    $('#btnReaderPrev2').addEventListener('click', readerPrev);
    $('#btnReaderNext2').addEventListener('click', readerNext);
    $('#readerPageInput').addEventListener('change', e => renderReaderPage(parseInt(e.target.value) || 1));
    const readerWrap = $('#bookReaderCanvasWrap');
    readerWrap.addEventListener('touchstart', onReaderTouchStart, { passive:true });
    readerWrap.addEventListener('touchend', onReaderTouchEnd, { passive:true });

    $('#bankGradeFilter').addEventListener('change', renderBankList);
    $('#bankSubjectFilter').addEventListener('change', renderBankList);
    $('#btnShare').addEventListener('click', sharePlan);
    $('#btnTranslate').addEventListener('click', translatePlan);
    $('#btnPhoneView').addEventListener('click', togglePhoneView);
    $('#btnEdit').addEventListener('click', toggleEditMode);
    $('#btnDuplicate').addEventListener('click', duplicateRecord);
    $('#btnRegenerate').addEventListener('click', regenerateRecord);
    $('#btnDeleteRecord').addEventListener('click', deleteRecord);
    $('#btnSaveEdit').addEventListener('click', saveEdits);
    $('#btnCancelEdit').addEventListener('click', cancelEdit);
    $('#btnSaveToBank')?.addEventListener('click', saveExtractedContentToBank);
    // مراقبة الضغط على زر "دروس واختبارات" في الشاشة الرئيسية
    document.querySelector('[data-nav="bank"]')?.addEventListener('click', () => {
      loadKnowledgeBank();
    });
    // فتح نافذة عرض/تعديل الدرس عند الضغط على عنوانه أو زر العين
    // فتح نافذة التحضير السريع أو نافذة التعديل عند الضغط
    $('#bankList')?.addEventListener('click', e => {
      // إذا ضغط على زر "تحضير الدرس"
      const prepBtn = e.target.closest('.bank-item-prep');
      if (prepBtn) {
        if (typeof openBankPrepModal === 'function') openBankPrepModal(parseInt(prepBtn.dataset.prepId));
        return;
      }
      // إذا ضغط على زر العين أو عنوان الدرس
      const trigger = e.target.closest('[data-open-id]');
      if (!trigger) return;
      openBankLessonModal(parseInt(trigger.dataset.openId));
    });
    $('#btnCloseBankModal')?.addEventListener('click', closeBankLessonModal);
    $('#bankLessonModal')?.addEventListener('click', e => { if (e.target === $('#bankLessonModal')) closeBankLessonModal(); });
    $('#btnBankToggleEdit')?.addEventListener('click', () => setBankModalEditing(true));
    $('#btnBankSaveEdit')?.addEventListener('click', saveBankLessonEdit);
    $('#btnBankUseAsPlan')?.addEventListener('click', useBankLessonAsPlan);
    // زر "أرشيف الاختبارات" — بوابة دخول يدوية لتطبيق الاختبارات (بدون بيانات مولّدة)
    // زر "أرشيف الاختبارات" — بوابة دخول يدوية لتطبيق الاختبارات (بدون بيانات مولّدة)
    $('#btnOpenExamArchive')?.addEventListener('click', () => {
      window.location.href = EXAM_APP_FILE;
    });
    $('#btnGenTutor')?.addEventListener('click', onGenerateInteractiveTutor);

    $('#archiveSearch').addEventListener('input', onArchiveSearch);
    $('#archiveGradeFilter').addEventListener('change', onArchiveFilterChange);
    $('#archiveSubjectFilter').addEventListener('change', onArchiveFilterChange);
            $('#archiveList').addEventListener('click', e => {
      // 💡 التقاط زر الحذف الفردي أولاً لمنع فتح البطاقة بالخطأ
      const delBtn = e.target.closest('.btn-del-archive');
      if (delBtn) {
        e.stopPropagation();
        deleteArchiveItemDirect(Number(delBtn.dataset.delId));
        return;
      }

      const item = e.target.closest('.archive-item');
      if (!item) return;
      const id = Number(item.dataset.id);
      const allowedKinds = ['plan', 'board', 'quiz', 'exam', 'answers', 'mindmap'];
      
      if (state.selectionMode && allowedKinds.includes(state.archiveKind)) {
        if (state.selectedIds.has(id)) state.selectedIds.delete(id); else state.selectedIds.add(id);
        onArchiveSearch();
      } else {
        openArchiveItem(id);
      }
    });
    $('#view-result').addEventListener('click', e => {
   if (e.target.closest('.btn-play-typewriter')) return startTypewriterAnimation();
   if (e.target.closest('.btn-fullscreen-tw')) return toggleTwFullscreen(e.target.closest('.btn-fullscreen-tw'));
       // برمجة زر تعديل نص الدرس الصوتي
      if (e.target.closest('.btn-edit-script')) {
        const btn = e.target.closest('.btn-edit-script');
        const textEl = $('#twText');
        const isAr = state.currentRecord?.language !== 'en';
        
        // إذا كان النص في وضع التعديل (سنقوم بالحفظ الآن)
        if (textEl.isContentEditable) {
          textEl.contentEditable = 'false';
          btn.innerHTML = `✏️ ${isAr ? 'تعديل' : 'Edit'}`;
          textEl.style.outline = 'none';
          textEl.style.background = 'transparent';
          
          // تحديث النص المحفوظ في قاعدة البيانات وفي ذاكرة الآلة الكاتبة
          const newText = textEl.innerText.trim();
          if (state.currentRecord) {
            state.currentRecord.script = newText;
            textEl.dataset.originalText = newText; // مهم جداً لكي تكتب الآلة الكاتبة النص الجديد
            state.currentRecord.updatedAt = Date.now();
            try { dbPut(LESSONS_STORE, state.currentRecord); toast('تم حفظ النص ✓', 'success'); } catch(err){}
          }
        } else {
          // الدخول في وضع التعديل
          textEl.contentEditable = 'true';
          btn.innerHTML = `💾 ${isAr ? 'حفظ' : 'Save'}`;
          textEl.style.outline = '2px dashed #f59e0b';
          textEl.style.background = 'rgba(255, 255, 255, 0.05)';
          textEl.focus(); // وضع المؤشر داخل النص تلقائياً
        }
        return;
      }

      const rec = state.currentRecord;
      if (e.target.closest('.btn-gen-gemini-audio')) return onGenerateGeminiAudio();
      if (e.target.closest('.btn-rec-start')) return startRecording();
      if (e.target.closest('.btn-rec-stop')) return stopRecording();
      if (e.target.closest('.btn-rec-save')) return saveRecording();
      if (e.target.closest('.btn-rec-discard')) return discardRecording();
      if (e.target.closest('.btn-dl-gemini') && rec?.geminiBlob) return downloadBlob(rec.geminiBlob, sanitizeFilename(rec.title) + (rec.geminiMime?.includes('mp4') ? '.m4a' : '.mp3'));
      if (e.target.closest('.btn-dl-recorded') && rec?.recordedBlob) return downloadBlob(rec.recordedBlob, sanitizeFilename(rec.title) + '-تسجيلي' + (rec.recordedMime?.includes('mp4') ? '.m4a' : '.webm'));
      if (e.target.closest('.btn-video-gemini') && rec?.geminiBlob) return exportAudioAsVideo(rec.geminiBlob, rec.title, rec.script, rec.language !== 'en');
      if (e.target.closest('.btn-video-recorded') && rec?.recordedBlob) return exportAudioAsVideo(rec.recordedBlob, rec.title, rec.script, rec.language !== 'en');
    });

    $('#btnToggleKeyVisible').addEventListener('click', () => {
      const inp = $('#sApiKey'), btn = $('#btnToggleKeyVisible');
      inp.type = inp.type==='password' ? 'text' : 'password';
      btn.textContent = inp.type==='password' ? 'إظهار' : 'إخفاء';
    });
    $('#btnSaveSettings').addEventListener('click', onSaveSettings);
    $('#btnExportBackup').addEventListener('click', exportBackup);
    $('#btnImportBackup').addEventListener('click', () => $('#backupInput').click());
    $('#backupInput').addEventListener('change', importBackup);
    $('#btnClearArchive').addEventListener('click', async () => {
      if (!confirm('مسح جميع الخطط نهائياً؟')) return;
      try { await dbClearAll(LESSONS_STORE); toast('تم المسح ✓', 'success'); refreshArchiveList(); } catch(e){}
    });
    $('#btnClearBank')?.addEventListener('click', async () => {
      if (!confirm('⚠️ تحذير: هل أنت متأكد من مسح جميع الدروس والاختبارات المحفوظة نهائياً؟')) return;
      try { 
        await dbClearAll(EXTRACTS_STORE); 
        toast('تم مسح جميع الدروس بنجاح ✓', 'success'); 
        loadKnowledgeBank(); // تحديث القائمة فوراً لتصبح فارغة
      } catch(e){
        toast('تعذر مسح الدروس', 'error');
      }
    });
    $('#btnClearLibrary').addEventListener('click', async () => {
      if (!confirm('مسح جميع الكتب نهائياً؟')) return;
      try { await dbClearAll(BOOKS_STORE); state.booksCache=[]; toast('تم المسح ✓', 'success'); refreshLibraryList(); refreshLibrarySelect(); } catch(e){}
    });
    
        registerSW();

        // ==========================================================
    // المستقبل الذكي للتحضير الآلي من جدول الحصص (تحديث الفهرس)
    // ==========================================================
    const urlParams = new URLSearchParams(window.location.search);

    // 🌟 التقاط الأمر القادم من منصة الاختبارات الشفوية 🌟
    if (urlParams.get('auto_prep') === '3') {
      navigate('bank');
      loadKnowledgeBank();
      window.history.replaceState({}, document.title, window.location.pathname);
      return; 
    }

    if (urlParams.get('auto_prep') === '1' || urlParams.get('auto_prep') === '2') {
      const bId = parseInt(urlParams.get('bookId'));
      
      let startPage, endPage;
      // ... (بقية الكود القديم الخاص بك كما هو) ...

      if (urlParams.get('auto_prep') === '2') {
          // جلب النطاق المحدد بدقة من الفهرس أو الاختيار اليدوي
          startPage = parseInt(urlParams.get('from')) || 1;
          endPage = parseInt(urlParams.get('to')) || startPage;
      } else {
          startPage = parseInt(urlParams.get('page')) || 1;
          endPage = startPage + 2;
          localStorage.setItem('hael_progress_' + bId, endPage + 1);
      }
      
      // توجيه الواجهة
      navigate('new');
      $('#fSubject').value = urlParams.get('subject') || '';
      $('#fGrade').value = urlParams.get('grade') || '';
      
      // تغيير تبويب المصدر إلى المكتبة
      onSourceChange('library');
      $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === 'library'));
      
      // 💡 الحل السحري: فتح قسم (الأكورديون) برمجياً لكي يظهر النص أمامك
      const libPanel = $('#panel-library');
      if (libPanel) {
          const accItem = libPanel.closest('.acc-item');
          if (accItem) {
              accItem.classList.add('is-open');
              const innerPanel = accItem.querySelector('.acc-panel');
              if (innerPanel) innerPanel.hidden = false;
          }
      }
      
      // تأخير بسيط لضمان تحميل المكتبة
      setTimeout(async () => {
        await refreshLibrarySelect();
        $('#libraryBookSelect').value = bId;
        $('#libPageFrom').value = startPage;
        $('#libPageTo').value = endPage;
        
        toast(`جاري استخراج الصفحات المحددة...`, 'success');
        
        // تشغيل زر الاستخراج تلقائياً
        $('#btnExtractFromLib').click();
        
        // 💡 التمرير التلقائي للشاشة للأسفل لرؤية شريط التقدم والنص
        setTimeout(() => {
             window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 300);
        
        // تنظيف الرابط لتجنب تكرار الأمر عند التحديث
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 600);
      return; // إيقاف إظهار شاشة home
    }

    showView('home');
  }

  /* ─── مطابقة مرنة للعناوين العربية (Fuzzy Matching) — يُستخدم في كل بحث/فتح عبر المساعد ─── */
  function normalizeArabicForMatch(s) {
    return String(s || '')
      .replace(/[\u064B-\u065F\u0670]/g, '')   // إزالة التشكيل
      .replace(/[إأآا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\bال/g, '')                     // حذف "ال" التعريف من أي كلمة
      .replace(/[^\u0600-\u06FF0-9a-zA-Z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function fuzzyTitleScore(query, target) {
    const nq = normalizeArabicForMatch(query), nt = normalizeArabicForMatch(target);
    if (!nq || !nt) return 0;
    if (nt === nq) return 1;
    if (nt.includes(nq) || nq.includes(nt)) return 0.9;
    const qWords = nq.split(' ').filter(w => w.length > 1);
    if (!qWords.length) return 0;
    const tWords = nt.split(' ').filter(w => w.length > 1);
    let matchCount = 0;
    qWords.forEach(w => { if (tWords.some(tw => tw.includes(w) || w.includes(tw))) matchCount++; });
    return matchCount / qWords.length;
  }
  // يرجع أفضل المرشحين مرتبين تنازلياً {item, score}
  function fuzzyRank(query, items, getTitle) {
    return items
      .map(item => ({ item, score: fuzzyTitleScore(query, getTitle(item)) }))
      .filter(x => x.score > 0.3)
      .sort((a, b) => b.score - a.score);
  }
  // يرجع مطابقة واحدة واضحة، أو null إن كانت النتائج غامضة (عدة مرشحين متقاربين) أو معدومة
  function fuzzyFindOne(query, items, getTitle) {
    const ranked = fuzzyRank(query, items, getTitle);
    if (!ranked.length) return { item: null, ambiguous: false, candidates: [] };
    if (ranked.length === 1 || ranked[0].score - ranked[1].score >= 0.25 || ranked[0].score >= 0.9) {
      return { item: ranked[0].item, ambiguous: false, candidates: [] };
    }
    return { item: null, ambiguous: true, candidates: ranked.slice(0, 4).map(r => getTitle(r.item)) };
  }

  /* ═══════════════════════════════════════════
     CORE BRIDGE — جسر منخفض المستوى لملف library-extract.js
     (معالجة الكتب: فهرسة، استخراج نصوص، كاش دائم)
     مختلف عن HaelActions: هذا يزوّد وحدة معالجة كاملة بلبنات
     بناء (DB, PDF, OCR)، بينما HaelActions يزوّد الذكاء
     الاصطناعي بأوامر جاهزة التنفيذ عالية المستوى.
     ═══════════════════════════════════════════ */
  /* ═══════════════════════════════════════════
     CORE BRIDGE — جسر منخفض المستوى 
     ═══════════════════════════════════════════ */
  window.HaelCore = {
    dbGet, dbPut, dbAdd, dbGetAll,
    BOOKS_STORE, EXTRACTS_STORE,
    ensurePdfJs,
    ocrPdfPageToText,
    getApiKey: () => state.settings.apiKey || '',
    saveApiKeyDirect: (key) => {
      state.settings.apiKey = String(key || '').trim();
      saveSettings();
      const field = document.getElementById('sApiKey');
      if (field) field.value = state.settings.apiKey;
    },
    toast, showOverlay, hideOverlay,
    navigate,
    refreshLibraryList,
    fuzzyFindOne, fuzzyRank, fuzzyTitleScore, normalizeArabicForMatch,
    
    // 💡 الإضافات الجديدة لتغذية ملف الاختبارات الخارجي:
    callGemini: callGemini,
    shuffleArray: shuffleArrayFisherYates,
    getSettings: () => state.settings,
    mathRules: mathRulesBlock
  };
  /* ═══════════════════════════════════════════
     AI ASSISTANT BRIDGE — جسر المساعد الذكي
     يُستهلك من ملف assistant.js المنفصل فقط.
     كل الدوال هنا "أغلفة" تنادي المنطق الأصلي
     الموجود أعلاه (onGenerate, openArchiveItem...)
     بدون تكرار أي منطق أعمال.
     ═══════════════════════════════════════════ */
  function assistantGetContext() {
    const view = state.viewStack[state.viewStack.length - 1];
    const rec = state.currentRecord;
    return {
      view,
      viewLabel: VIEW_TITLES[view] || view,
      hasApiKey: !!state.settings.apiKey,
      currentRecord: rec ? {
        title: rec.title || '', subject: rec.subject || '', grade: rec.grade || '',
        kind: rec.kind || 'plan', language: rec.language || 'ar'
      } : null
    };
  }

  function assistantNavigate(view) {
    if (!VIEW_TITLES[view]) return { ok: false, reason: 'unknown_view' };
    navigate(view);
    if (view === 'archive') refreshArchiveList();
    if (view === 'library') refreshLibraryList();
    if (view === 'bank') loadKnowledgeBank();
    return { ok: true, view };
  }

  async function assistantCreateLessonPlan(p) {
    p = p || {};
    if (!p.title) return { ok: false, reason: 'missing_title' };
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    navigate('new');
    resetNewForm();
    $('#fTitle').value = p.title;
    if (p.subject) $('#fSubject').value = p.subject;
    if (p.grade)   $('#fGrade').value   = p.grade;
    if (p.section) $('#fSection').value = p.section;
    if (p.school)  $('#fSchool').value  = p.school;
    if (p.teacher) $('#fTeacher').value = p.teacher;
    if (p.period)  $('#fPeriod').value  = p.period;
    if (p.date)    $('#fDate').value    = p.date;
    if (p.language === 'ar' || p.language === 'en') {
      state.language = p.language;
      $$('.seg-btn', $('#langSegment')).forEach(b => b.classList.toggle('active', b.dataset.lang === p.language));
    }
    await onGenerate();
    if (!state.currentRecord) return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title };
  }

  function assistantSearchBank(query) {
    const q = (query || '').trim().toLowerCase();
    const list = q ? bankRecordsCache.filter(r => (r.title || '').toLowerCase().includes(q)) : bankRecordsCache.slice(0, 10);
    return list.map(r => ({ id: r.id, title: r.title, subject: r.subject, grade: r.grade }));
  }

  async function assistantOpenBankLesson(idOrTitle) {
    await loadKnowledgeBank();
    let rec = null;
    if (typeof idOrTitle === 'number') rec = bankRecordsCache.find(r => r.id === idOrTitle);
    else {
      const m = fuzzyFindOne(idOrTitle, bankRecordsCache, r => r.title);
      if (m.ambiguous) return { ok: false, reason: 'ambiguous', candidates: m.candidates };
      rec = m.item;
    }
    if (!rec) return { ok: false, reason: 'not_found' };
    navigate('bank');
    openBankLessonModal(rec.id);
    return { ok: true, id: rec.id, title: rec.title };
  }

  async function assistantSearchArchive(query) {
    await refreshArchiveList();
    const q = (query || '').trim();
    const list = q ? fuzzyRank(q, state.archiveCache, r => r.title).map(x => x.item) : state.archiveCache.slice(0, 10);
    return list.slice(0, 10).map(r => ({ id: r.id, title: r.title, subject: r.subject, grade: r.grade, kind: r.kind || 'plan' }));
  }

  async function assistantOpenArchiveRecord(idOrTitle) {
    await refreshArchiveList();
    let rec = null;
    if (typeof idOrTitle === 'number') rec = state.archiveCache.find(r => r.id === idOrTitle);
    else {
      const m = fuzzyFindOne(idOrTitle, state.archiveCache, r => r.title);
      if (m.ambiguous) return { ok: false, reason: 'ambiguous', candidates: m.candidates };
      rec = m.item;
    }
    if (!rec) return { ok: false, reason: 'not_found' };
    await openArchiveItem(rec.id);  return { ok: true, id: rec.id, title: rec.title };
  }

  async function assistantSearchLibrary(query) {
    await refreshLibraryList();
    const q = (query || '').trim();
    const list = q ? fuzzyRank(q, state.booksCache, b => b.name).map(x => x.item) : state.booksCache.slice(0, 10);
    return list.slice(0, 10).map(b => ({ id: b.id, title: b.name }));
  }

  async function assistantOpenLibraryBook(idOrTitle) {
    await refreshLibraryList();
    let book = null;
    if (typeof idOrTitle === 'number') book = state.booksCache.find(b => b.id === idOrTitle);
    else {
      const m = fuzzyFindOne(idOrTitle, state.booksCache, b => b.name);
      if (m.ambiguous) return { ok: false, reason: 'ambiguous', candidates: m.candidates };
      book = m.item;
    }
    if (!book) return { ok: false, reason: 'not_found' };
    navigate('library');
    await openBookReader(book.id);
    return { ok: true, id: book.id, title: book.name };
  }

  async function assistantGenerateBankSummary(p) {
    p = p || {};
    if (!state.settings.apiKey) return { ok: false, reason: 'no_api_key' };
    await loadKnowledgeBank();
    const titles = Array.isArray(p.lessonTitles) ? p.lessonTitles : (p.lessonTitle ? [p.lessonTitle] : []);
    if (!titles.length) return { ok: false, reason: 'missing_titles' };
    const matched = [];
    const notFound = [];
    const ambiguous = [];
    titles.forEach(t => {
      const m = fuzzyFindOne(t, bankRecordsCache, r => r.title);
      if (m.item) { if (!matched.find(x => x.id === m.item.id)) matched.push(m.item); }
      else if (m.ambiguous) ambiguous.push({ requested: t, candidates: m.candidates });
      else notFound.push(t);
    });

    // نفس منطق الحفظ التلقائي المستخدم في توليد الاختبار: لو الدرس المفتوح حالياً يطابق عنواناً غير موجود، احفظه أولاً
    if (notFound.length && state.currentRecord && state.currentRecord.title) {
      const rec = state.currentRecord;
      const stillMissing = [];
      let didAdd = false;
      for (const t of notFound) {
        if (fuzzyTitleScore(t, rec.title) >= 0.5) {
          try {
            const newRec = {
              title: rec.title, subject: rec.subject || '', grade: rec.grade || '',
              section: rec.section || '', content: rec.extractedText || '',
              sourceType: rec.sourceType || 'title', savedAt: Date.now()
            };
            newRec.id = await dbAdd(EXTRACTS_STORE, newRec);
            matched.push(newRec);
            didAdd = true;
          } catch (e) { stillMissing.push(t); }
        } else stillMissing.push(t);
      }
      if (didAdd) await loadKnowledgeBank();
    }

    if (!matched.length) {
      if (ambiguous.length) return { ok: false, reason: 'ambiguous', candidates: ambiguous[0].candidates };
      return { ok: false, reason: 'lessons_not_found' };
    }

    navigate('bank');
    renderBankList();
    matched.forEach(rec => {
      const cb = document.querySelector(`.bank-chk[value="${rec.id}"]`);
      if (cb) cb.checked = true;
    });

    await onGenerateBankSummary();
    if (!state.currentRecord) return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title, lessonsCount: matched.length };
  }

  function assistantOpenExamArchive() {
    window.location.href = EXAM_APP_FILE;
    return { ok: true };
  }

  async function assistantGenerateExamFromBank(p) {
    p = p || {};
    if (!state.settings.apiKey) return { ok: false, reason: 'no_api_key' };
    await loadKnowledgeBank();
    const titles = Array.isArray(p.lessonTitles) ? p.lessonTitles : (p.lessonTitle ? [p.lessonTitle] : []);
    if (!titles.length) return { ok: false, reason: 'missing_titles' };
    const matched = [];
    const notFound = [];
    const ambiguous = [];
    titles.forEach(t => {
      const m = fuzzyFindOne(t, bankRecordsCache, r => r.title);
      if (m.item) { if (!matched.find(x => x.id === m.item.id)) matched.push(m.item); }
      else if (m.ambiguous) ambiguous.push({ requested: t, candidates: m.candidates });
      else notFound.push(t);
    });

    // حفظ تلقائي: إن كانت هناك خطة درس مفتوحة حالياً تطابق أحد العناوين غير الموجودة في دروس واختبارات، احفظها هناك أولاً
    if (notFound.length && state.currentRecord && state.currentRecord.title) {
      const rec = state.currentRecord;
      const stillMissing = [];
      let didAdd = false;
      for (const t of notFound) {
        if (fuzzyTitleScore(t, rec.title) >= 0.5) {
          try {
            const newRec = {
              title: rec.title, subject: rec.subject || '', grade: rec.grade || '',
              section: rec.section || '', content: rec.extractedText || '',
              sourceType: rec.sourceType || 'title', savedAt: Date.now()
            };
            newRec.id = await dbAdd(EXTRACTS_STORE, newRec);
            matched.push(newRec);
            didAdd = true;
          } catch (e) { stillMissing.push(t); }
        } else stillMissing.push(t);
      }
      if (didAdd) await loadKnowledgeBank(); // تحديث الكاش ليشمل السجل الجديد قبل رسم القائمة
    }

    if (!matched.length) {
      if (ambiguous.length) return { ok: false, reason: 'ambiguous', candidates: ambiguous[0].candidates };
      return { ok: false, reason: 'lessons_not_found' };
    }

    navigate('bank');
    renderBankList();
    matched.forEach(rec => {
      const cb = document.querySelector(`.bank-chk[value="${rec.id}"]`);
      if (cb) cb.checked = true;
    });

    const target = p.examType === 'official' ? 'official' : (p.examType === 'electronic' ? 'electronic' : 'internal');
    state.examGenerationTarget = target;
    $('#examSectionField').style.display = target === 'electronic' ? 'block' : 'none';
    $('#examSettingsModal').classList.add('is-active');

    const types = (Array.isArray(p.questionTypes) && p.questionTypes.length) ? p.questionTypes : [{ type: 'mcq', count: 5 }];
    $$('.examtype-chk').forEach(chk => {
      const match = types.find(t => t.type === chk.dataset.type);
      chk.checked = !!match;
      const countInp = $(`.examtype-count[data-type="${chk.dataset.type}"]`);
      if (match && countInp) countInp.value = match.count || 5;
    });
    if (p.difficulty) $('#examDifficulty').value = p.difficulty;

    $('#btnConfirmExamGen').click();
    return { ok: true, matchedTitles: matched.map(m => m.title), examType: target };
  }

  function assistantGetApiConfig() {
    return {
      apiKey: state.settings.apiKey || '',
      model: state.settings.defaultModel || 'gemini-3.5-flash',
      geminiBase: GEMINI_BASE
    };
  }

  async function assistantCreateLessonFromLibrary(p) {
    p = p || {};
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }

    await refreshLibraryList();
    let book = null, bookAmbiguous = null;
    if (p.bookTitle) {
      const m = fuzzyFindOne(p.bookTitle, state.booksCache, b => b.name);
      if (m.ambiguous) bookAmbiguous = m.candidates;
      book = m.item;
    } else if (state.booksCache.length === 1) {
      book = state.booksCache[0];
    }
    if (!book) {
      if (bookAmbiguous) return { ok: false, reason: 'ambiguous', candidates: bookAmbiguous };
      return { ok: false, reason: state.booksCache.length ? 'book_not_found' : 'no_books' };
    }

    // جلب السجل الكامل (يحتوي على الفهرس toc إن وُجد)
    const fullBook = await dbGet(BOOKS_STORE, book.id);
    if (!fullBook) return { ok: false, reason: 'book_not_found' };

    let fromPage = null, toPage = null, resolvedTopicTitle = '';
    if (p.topicTitle) {
      if (!fullBook.toc || !fullBook.toc.length) {
        return { ok: false, reason: 'no_toc', bookTitle: fullBook.name };
      }
      const m = fuzzyFindOne(p.topicTitle, fullBook.toc, t => t.title);
      if (m.ambiguous) return { ok: false, reason: 'ambiguous', candidates: m.candidates, bookTitle: fullBook.name };
      const entry = m.item;
      if (!entry) return { ok: false, reason: 'topic_not_found', bookTitle: fullBook.name };
      fromPage = entry.page; toPage = entry.endPage; resolvedTopicTitle = entry.title;
    } else if (p.pageFrom) {
      fromPage = parseInt(p.pageFrom) || 1;
      toPage = parseInt(p.pageTo) || fromPage + 4;
    } else {
      return { ok: false, reason: 'missing_topic_or_pages' };
    }

    navigate('new');
    resetNewForm();
    $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === 'library'));
    onSourceChange('library');
    await refreshLibrarySelect();
    $('#libraryBookSelect').value = String(fullBook.id);
    renderLibraryToc();
    $('#libPageFrom').value = fromPage;
    $('#libPageTo').value = toPage;
    await onExtractFromLib();

    const title = p.lessonTitle || resolvedTopicTitle || (fullBook.name || '');
    $('#fTitle').value = title;
    if (p.subject) $('#fSubject').value = p.subject;
    if (p.grade)   $('#fGrade').value   = p.grade;
    if (p.section) $('#fSection').value = p.section;
    if (p.language === 'ar' || p.language === 'en') {
      state.language = p.language;
      $$('.seg-btn', $('#langSegment')).forEach(b => b.classList.toggle('active', b.dataset.lang === p.language));
    }

    await onGenerate();
    if (!state.currentRecord) return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title, fromPage, toPage, bookTitle: fullBook.name };
  }

  async function assistantExtractLibraryToc(p) {
    p = p || {};
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    if (!p.fromPage) return { ok: false, reason: 'missing_toc_page' };

    await refreshLibraryList();
    let book = null, bookAmbiguous = null;
    if (p.bookTitle) {
      const m = fuzzyFindOne(p.bookTitle, state.booksCache, b => b.name);
      if (m.ambiguous) bookAmbiguous = m.candidates;
      book = m.item;
    } else if (state.booksCache.length === 1) {
      book = state.booksCache[0];
    }
    if (!book) {
      if (bookAmbiguous) return { ok: false, reason: 'ambiguous', candidates: bookAmbiguous };
      return { ok: false, reason: state.booksCache.length ? 'book_not_found' : 'no_books' };
    }

    navigate('library');
    const fromPage = parseInt(p.fromPage) || 2;
    const toPage = parseInt(p.toPage) || fromPage;
    const offset = parseInt(p.offsetPages) || 0;
    await runTocExtraction(book.id, fromPage, toPage, offset);
    await refreshLibraryList();
    const updated = state.booksCache.find(b => b.id === book.id);
    const tocCount = updated && updated.toc ? updated.toc.length : 0;
    if (!tocCount) return { ok: false, reason: 'empty-result', bookTitle: book.name };
    return { ok: true, bookTitle: book.name, tocCount, fromPage, toPage };
  }

  async function assistantExtractBookRangeToBank(p) {
    p = p || {};
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    if (!p.fromPage) return { ok: false, reason: 'missing_page_range' };
    navigate('library');
    return await window.LibraryExtract.extractManualRange(p.bookTitle, p.fromPage, p.toPage, p.customName, p.grade);
  }

  async function assistantReviewAndExtractToc(p) {
    p = p || {};
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    navigate('library');
    return await window.LibraryExtract.openTocReviewModal(p.bookTitle, p.grade);
  }

  // مزامنة نموذج "تحضير جديد" مع بيانات سجل مفتوح (خطة/سبورة...) — يُستخدم قبل أي توليد إضافي (اختبار/سبورة/خريطة) على نفس المحتوى
  function assistantSyncFormFromRecord(rec) {
    navigate('new');
    $('#fTitle').value   = rec.title || '';
    $('#fSubject').value = rec.subject || '';
    $('#fGrade').value   = rec.grade || '';
    $('#fSection').value = rec.section || '';
    if (rec.language === 'ar' || rec.language === 'en') {
      state.language = rec.language;
      $$('.seg-btn', $('#langSegment')).forEach(b => b.classList.toggle('active', b.dataset.lang === rec.language));
    }
    const src = rec.sourceType || 'title';
    onSourceChange(src);
    $$('.seg-btn', $('#sourceSegment')).forEach(b => b.classList.toggle('active', b.dataset.source === src));
    const fieldMap = { text: '#pastedText', images: '#imagesExtractedText', pdf: '#pdfExtractedText', library: '#libExtractedText' };
    if (fieldMap[src] && rec.extractedText) $(fieldMap[src]).value = rec.extractedText;
  }

  async function assistantGenerateQuizFromCurrentPlan() {
    const rec = state.currentRecord;
    if (!rec || !rec.title) return { ok: false, reason: 'no_open_plan' };
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    assistantSyncFormFromRecord(rec);
    await onGenerateQuiz();
    if (!state.currentRecord || state.currentRecord.kind !== 'quiz') return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title };
  }

  async function assistantGenerateBoard() {
    const rec = state.currentRecord;
    if (!rec || !rec.title) return { ok: false, reason: 'no_open_plan' };
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    assistantSyncFormFromRecord(rec);
    await onGenerateBoard();
    if (!state.currentRecord || state.currentRecord.kind !== 'board') return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title };
  }

  async function assistantGenerateMindmap() {
    const rec = state.currentRecord;
    if (!rec || !rec.title) return { ok: false, reason: 'no_open_plan' };
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    assistantSyncFormFromRecord(rec);
    await onGenerateMindmap();
    if (!state.currentRecord || state.currentRecord.kind !== 'mindmap') return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title };
  }

  async function assistantGeneratePptx() {
    const rec = state.currentRecord;
    if (!rec || rec.kind !== 'board') return { ok: false, reason: 'no_open_board' };
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    if (typeof PptxGenJS === 'undefined' || typeof JSZip === 'undefined') return { ok: false, reason: 'pptx_libs_missing' };
    await onGeneratePptx();
    return { ok: true, title: rec.title };
  }

  async function assistantGenerateAudio() {
    const rec = state.currentRecord;
    if (!rec || !rec.title) return { ok: false, reason: 'no_open_plan' };
    if (!state.settings.apiKey) { navigate('settings'); populateSettingsForm(); return { ok: false, reason: 'no_api_key' }; }
    assistantSyncFormFromRecord(rec);
    await onGenerateAudio();
    if (!state.currentRecord || state.currentRecord.kind !== 'audio') return { ok: false, reason: 'generation_failed' };
    return { ok: true, id: state.currentRecord.id, title: state.currentRecord.title };
  }

  async function assistantSynthesizeAudio() {
    const rec = state.currentRecord;
    if (!rec || rec.kind !== 'audio') return { ok: false, reason: 'no_open_audio' };
    if (!state.settings.apiKey) return { ok: false, reason: 'no_api_key' };
    await onGenerateGeminiAudio();
    if (!state.currentRecord || !state.currentRecord.geminiBlob) return { ok: false, reason: 'synthesis_failed' };
    return { ok: true, title: state.currentRecord.title };
  }

  // ملاحظة: هذه العملية تسجّل الصوت كاملاً بالوقت الفعلي (قد تستغرق دقائق بطول الصوت نفسه)،
  // لذا يجب إغلاق نافذة المساعد قبل استدعائها ليظهر شريط التقدّم الحقيقي (طبقته أسفل نافذة المساعد).
  // الإغلاق مسؤولية طبقة assistant.js قبل استدعاء هذه الأداة تحديداً.
  async function assistantExportAudioAsVideo() {
    const rec = state.currentRecord;
    if (!rec || rec.kind !== 'audio') return { ok: false, reason: 'no_open_audio' };
    if (!rec.geminiBlob) return { ok: false, reason: 'no_synthesized_audio' };
    await exportAudioAsVideo(rec.geminiBlob, rec.title, rec.script, rec.language !== 'en');
    return { ok: true, title: rec.title };
  }

    // --- دوال فتح النوافذ الجديدة للمساعد ---
  function assistantOpenSchedule() {
    window.location.href = 'schedule.html';
    return { ok: true, view: 'schedule' };
  }

  function assistantOpenPlatform() {
    window.location.href = 'platform.html';
    return { ok: true, view: 'platform' };
  }

  function assistantOpenGrades() {
    window.location.href = 'grades.html';
    return { ok: true, view: 'grades' };
  }

  // --- تحديث جسر المساعد (HaelActions) ---
  window.HaelActions = {
    getContext:          assistantGetContext,
    getApiConfig:        assistantGetApiConfig,
    createLessonFromLibrary: assistantCreateLessonFromLibrary,
    extractLibraryToc:    assistantExtractLibraryToc,
    extractBookRangeToBank: assistantExtractBookRangeToBank,
    reviewAndExtractToc:    assistantReviewAndExtractToc,
    generateQuizFromCurrentPlan: assistantGenerateQuizFromCurrentPlan,
    generateBoard:        assistantGenerateBoard,
    generateMindmap:      assistantGenerateMindmap,
    generatePptxFromBoard: assistantGeneratePptx,
    generateBankSummary: assistantGenerateBankSummary,
    openExamArchive:      assistantOpenExamArchive,
    openSchedule:         assistantOpenSchedule,    // 👈 جديد
    openPlatform:         assistantOpenPlatform,    // 👈 جديد
    openGrades:           assistantOpenGrades,      // 👈 جديد
    generateAudio:         assistantGenerateAudio,
    synthesizeAudio:       assistantSynthesizeAudio,
    exportAudioAsVideo:    assistantExportAudioAsVideo,
    navigateTo:          assistantNavigate,
    goBack:              goBack,
    createLessonPlan:    assistantCreateLessonPlan,
    searchBank:          assistantSearchBank,
    openBankLesson:      assistantOpenBankLesson,
    searchArchive:       assistantSearchArchive,
    openArchiveRecord:   assistantOpenArchiveRecord,
    searchLibrary:       assistantSearchLibrary,
    openLibraryBook:     assistantOpenLibraryBook,
    generateExamFromBank: assistantGenerateExamFromBank
  };

  document.addEventListener('DOMContentLoaded', init);
    // 🌟 تصدير واجهة HaelCore لملف exam-builder وبقية الأدوات 🌟
  window.HaelCore = {
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,
    toast: toast,
    getSettings: () => state.settings,
    callGemini: callGemini,
    shuffleArray: shuffleArrayFisherYates
  };

})();

// ══════════════════════════════════════════════════════════════
  // 🔊 محرك النطق الصوتي للملخصات الإنجليزية (Offline TTS)
  // ══════════════════════════════════════════════════════════════
  window.playTTS = function(text, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation(); 
    }
    
    if (!('speechSynthesis' in window)) {
        if (typeof window.HaelCore !== 'undefined' && window.HaelCore.toast) {
            window.HaelCore.toast('عذراً، متصفحك أو جهازك لا يدعم ميزة النطق.', 'error');
        } else {
            alert('عذراً، جهازك لا يدعم ميزة النطق.');
        }
        return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    utterance.rate = 0.85;    
    utterance.pitch = 1.0;    

    // 🌟 إجبار جهاز المعلم على استخدام الصوت المحلي أيضاً
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        let localVoice = voices.find(v => v.lang.startsWith('en') && v.localService === true);
        if (!localVoice) localVoice = voices.find(v => v.lang.startsWith('en'));
        if (localVoice) utterance.voice = localVoice;
    }
    
    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 50);
  };

  // تهيئة مبكرة لأصوات النظام
  if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = window.speechSynthesis.getVoices;
      }
  }
  // ══════════════════════════════════════════════════════════════
  // 🤖 دالة الحقن الذكي لأزرار النطق (Smart TTS Injector)
  // ══════════════════════════════════════════════════════════════
  window.injectTTSButtons = function(containerSelector) {
    // 1. تحديد المكان الذي سنبحث فيه (مثلاً: شاشة عرض النتيجة)
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // 2. العناصر التي تحتوي عادة على نصوص قابلة للقراءة
    const tagsToScan = ['p', 'li', 'h3', 'h4', 'h5', 'td', 'th'];
    
    // 3. مسح العناصر وحقن الأزرار
    tagsToScan.forEach(tag => {
        const elements = container.querySelectorAll(tag);
        
        elements.forEach(el => {
            // تجاهل العنصر إذا كان يحتوي مسبقاً على زر نطق (لمنع التكرار)
            if (el.querySelector('.tts-btn')) return;

            // استخراج النص النظيف من العنصر
            const text = el.textContent.trim();
            
            // شرط ذكي: التحقق من وجود أحرف إنجليزية (لكي لا ننطق التعليمات العربية بالإنجليزية)
            const hasEnglishLetters = /[a-zA-Z]{2,}/.test(text);
            
            if (text.length > 2 && hasEnglishLetters) {
                // تنظيف النص من علامات الاقتباس لتجنب أخطاء برمجية أثناء النطق
                const cleanTextForSpeech = text.replace(/'/g, "").replace(/"/g, "").replace(/`/g, "");
                
                // إنشاء الزر برمجياً
                const btn = document.createElement('button');
                btn.className = 'tts-btn';
                btn.innerHTML = '🔊';
                btn.title = 'استمع للنطق';
                
                // ربط الزر بدالة النطق التي أضفناها سابقاً
                btn.onclick = function(e) {
                    window.playTTS(cleanTextForSpeech, e);
                };

                // جعل اتجاه العنصر LTR لضمان ظهور الزر على اليسار بشكل صحيح
                el.style.direction = 'ltr';
                el.style.textAlign = 'left';
                
                // إضافة الزر في بداية الجملة
                el.prepend(btn); 
            }
        });
    });
  };
