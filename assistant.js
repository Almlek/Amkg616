/* ═══════════════════════════════════════════════════════
   assistant.js — المساعد الذكي لتطبيق "الذكي"
   ملف مستقل تماماً عن core.js (لا يُثقله ولا يكرر منطقه).
   يعتمد على:
     - window.HaelActions  (مُعرَّف في نهاية core.js): جسر الأوامر
     - Gemini API (function calling) لفهم الطلب الحر وتنفيذه
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────── نظام التذكير (بديل القفل) ───────────────────────
     مبني على إظهار رسالة دعم راقية مرة واحدة كل 15 يوم، والتطبيق مجاني بالكامل دائماً. */
  const REMINDER_DAYS = 15;
  const LS_LAST_REMINDER = 'hael_assist_last_reminder';
  
  const PAY_INFO = {
    name: 'الأستاذ عبدالملك عبدالرحمنالغيلي',
    bank: '. (إم فلوس)',
    account: '.616',
    whatsapp: 'https://wa.me/qr/3W6L7SIKSTZKN1'
  };

  function shouldShowReminder() {
    let last = localStorage.getItem(LS_LAST_REMINDER);
    if (!last) return true; // إظهارها في أول مرة
    const elapsedDays = (Date.now() - Number(last)) / 86400000;
    return elapsedDays >= REMINDER_DAYS;
  }

  function markReminderShown() {
    localStorage.setItem(LS_LAST_REMINDER, String(Date.now()));
  }

  /* ───────────────────────── وصف التطبيق الكامل للمساعد ───────────────────────── */
  const APP_KNOWLEDGE = `
أنت "المساعد الذكي" المدمج داخل تطبيق "الذكي" — منظومة تعليمية متكاملة ودفتر تحضير ذكي للمعلمين، يعمل بدون إنترنت (PWA)، ويستخدم Gemini API لتوليد المحتوى.
مهمتك: تبسيط كل شيء، وتنفيذ ما يُطلب منك مباشرة، ومساعدة المعلم في إدارة المنظومة.

أقسام التطبيق وإمبراطورية المعلم الرقمية:
1) "تحضير جديد" (new): لإنشاء خطة درس بصيغة PPP بالعربية أو الإنجليزية. المصادر: عنوان، نص، صور (OCR)، PDF، أو المكتبة. يمكن توليد: سبورة تفاعلية (board)، درس صوتي (TTS)، عرض PowerPoint، خريطة ذهنية، واختبار تفاعلي.
2) "المكتبة" (library): لإدارة كتب PDF واستخراج الفهارس والنصوص.
3) "دروس واختبارات" (bank): مستودع الدروس المحفوظة لإنشاء اختبارات شاملة بأنواع (داخلي، رسمي، إلكتروني).
4) "الأرشيف" (archive): كل الخطط والمستندات المحفوظة سابقاً.
5) "جدول الحصص" (schedule): لعرض جدول المعلم الأسبوعي، وربط الحصص بالكتب للتحضير الآلي المباشر.
6) "مُحرّر الاختبارات" (exams): بيئة مستقلة لإنشاء وتعديل نماذج الاختبارات الرسمية يدوياً وتصديرها.
7) "المنصة المدرسية" (platform): واجهة التحكم الخاصة بالمعلم لبث الاختبارات الإلكترونية للطلاب عبر الشبكة المحلية (Server).
8) "سجل الدرجات والحضور" (grades): نظام احترافي لتسجيل حضور الطلاب ورصد درجاتهم وتصديرها بصيغة Excel.
9) "الإعدادات" (settings): لإدارة مفتاح Gemini API والبيانات الافتراضية.
10) "الخطة الفصلية" (semesterPlan): لإنشاء خطة منهجية موزعة على أسابيع الفصل الدراسي.
11) "الاختبارات الشفوية" (oralExam): قرعة عشوائية وتقييم مباشر للأداء الشفوي للطلاب.
12) "حل نماذج الاختبارات" (examSolver): أداة متقدمة لاستخراج النماذج الوزارية وحلها مع خطوات الشرح التفصيلية (للرياضيات والمواد الأخرى).

قواعد عملك:
- إذا كان الطلب تنفيذياً (حضّر، أنشئ، افتح الجدول، اعرض المنصة، انتقل...) استخدم الأداة (function) المناسبة.
- إذا كان الطلب معرفياً (اشرح لي كيف أستخدم المنصة، ما وظيفة سجل الدرجات...) أجب نصياً مباشرة معتمداً على معرفتك بالمنظومة أعلاه.
- لفتح التطبيقات المستقلة، استخدم الأدوات (openSchedule, openPlatform, openGrades, openExamArchive, openSemesterPlan, openOralExam, openExamSolver).
- طلبات الاختبار: الاختبارات 3 أنواع (داخلي، رسمي official، إلكتروني electronic). 
- إذا طلب المعلم دمج أو تلخيص عدة دروس، استخدم (generateBankSummary).
- ردودك دائماً بالعربية الفصحى المبسطة، مختصرة، وبأسلوب ودود ومباشر يليق بمخاطبة معلم.
- فسّر أسباب الأخطاء بعبارات بسيطة واقترح الحل المناسب.
`.trim();

  /* ───────────────────────── تعريف الأدوات (Function Declarations) ───────────────────────── */
  const TOOLS = [
    {
      name: 'navigateTo',
      description: 'الانتقال إلى شاشة معينة داخل التطبيق الأساسي (الرئيسية، التحضير، المكتبة، البنك، الأرشيف، الإعدادات).',
      parameters: {
        type: 'OBJECT',
        properties: {
          view: { type: 'STRING', enum: ['home', 'new', 'library', 'bank', 'archive', 'settings', 'help'] }
        },
        required: ['view']
      }
    },
    {
      name: 'openSchedule',
      description: 'فتح نافذة "جدول الحصص والتحضير الآلي". تنقل الصفحة بالكامل وتُغلق المساعد.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'openPlatform',
      description: 'فتح "المنصة المدرسية" (سيرفر بث الاختبارات للطلاب). تنقل الصفحة بالكامل وتُغلق المساعد.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'openGrades',
      description: 'فتح "سجل الدرجات والحضور" (سجل الإكسل). تنقل الصفحة بالكامل وتُغلق المساعد.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'openExamArchive',
      description: 'فتح "مُحرّر الاختبارات" (شاشة إنشاء وتعديل الاختبارات الرسمية يدوياً). تنقل الصفحة بالكامل.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'openSemesterPlan',
      description: 'فتح نافذة "الخطة الفصلية" لإنشاء خطة منهجية للأسابيع.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'openOralExam',
      description: 'فتح منصة "الاختبارات الشفوية". تنقل الصفحة بالكامل وتغلق المساعد.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'openExamSolver',
      description: 'فتح أداة "حل نماذج الاختبارات" للنماذج الوزارية. تنقل الصفحة بالكامل وتغلق المساعد.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'createLessonPlan',
      description: 'تحضير/إنشاء خطة درس جديدة بصيغة PPP انطلاقاً من عنوان.',
      parameters: {
        type: 'OBJECT',
        properties: {
          title:    { type: 'STRING' },
          subject:  { type: 'STRING' },
          grade:    { type: 'STRING' },
          section:  { type: 'STRING' },
          language: { type: 'STRING', enum: ['ar', 'en'] }
        },
        required: ['title']
      }
    },
    {
      name: 'createLessonFromLibrary',
      description: 'تحضير درس من كتاب في المكتبة (عبر عنوان الفهرس أو نطاق الصفحات).',
      parameters: {
        type: 'OBJECT',
        properties: {
          bookTitle:   { type: 'STRING' },
          topicTitle:  { type: 'STRING' },
          pageFrom:    { type: 'NUMBER' },
          pageTo:      { type: 'NUMBER' },
          lessonTitle: { type: 'STRING' },
          subject:     { type: 'STRING' },
          grade:       { type: 'STRING' },
          section:     { type: 'STRING' },
          language:    { type: 'STRING', enum: ['ar', 'en'] }
        },
        required: []
      }
    },
    {
      name: 'generateQuizFromCurrentPlan',
      description: 'توليد ملخص واختبار تفاعلي عام من خطة الدرس المفتوحة حالياً.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'generateBoard',
      description: 'توليد سبورة تفاعلية من خطة الدرس المفتوحة حالياً.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'generateMindmap',
      description: 'توليد خريطة ذهنية من خطة الدرس المفتوحة حالياً.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'generatePptxFromBoard',
      description: 'توليد عرض بوربوينت من السبورة التفاعلية المفتوحة حالياً.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'generateBankSummary',
      description: 'توليد ملخص شامل يدمج عدة دروس محفوظة.',
      parameters: {
        type: 'OBJECT',
        properties: { lessonTitles: { type: 'ARRAY', items: { type: 'STRING' } } },
        required: ['lessonTitles']
      }
    },
    {
      name: 'generateAudio',
      description: 'إعداد نص السكربت لدرس صوتي.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'synthesizeAudio',
      description: 'توليد الصوت الفعلي (TTS) للدرس الصوتي المفتوح.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'exportAudioAsVideo',
      description: 'تصدير الدرس الصوتي كملف فيديو.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'searchBank',
      description: 'البحث في دروس واختبارات المحفوظة.',
      parameters: { type: 'OBJECT', properties: { query: { type: 'STRING' } }, required: ['query'] }
    },
    {
      name: 'openBankLesson',
      description: 'فتح درس محدد من دروس واختبارات.',
      parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' } }, required: ['title'] }
    },
    {
      name: 'searchArchive',
      description: 'البحث في أرشيف الخطط والمستندات.',
      parameters: { type: 'OBJECT', properties: { query: { type: 'STRING' } }, required: ['query'] }
    },
    {
      name: 'openArchiveRecord',
      description: 'فتح خطة أو مستند محدد من الأرشيف.',
      parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' } }, required: ['title'] }
    },
    {
      name: 'searchLibrary',
      description: 'البحث عن كتاب في المكتبة.',
      parameters: { type: 'OBJECT', properties: { query: { type: 'STRING' } }, required: ['query'] }
    },
    {
      name: 'openLibraryBook',
      description: 'فتح كتاب محدد من المكتبة.',
      parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' } }, required: ['title'] }
    },
    {
      name: 'extractLibraryToc',
      description: 'استخراج فهرس من كتاب في المكتبة.',
      parameters: {
        type: 'OBJECT',
        properties: {
          bookTitle:    { type: 'STRING' },
          fromPage:     { type: 'NUMBER' },
          toPage:       { type: 'NUMBER' },
          offsetPages:  { type: 'NUMBER' }
        },
        required: ['fromPage']
      }
    },
    {
      name: 'extractBookRangeToBank',
      description: 'استخراج نص خام من صفحات كتاب وحفظه في دروس واختبارات مباشرة.',
      parameters: {
        type: 'OBJECT',
        properties: {
          bookTitle:  { type: 'STRING' },
          fromPage:   { type: 'NUMBER' },
          toPage:     { type: 'NUMBER' },
          customName: { type: 'STRING' },
          grade:      { type: 'STRING' }
        },
        required: ['fromPage', 'toPage']
      }
    },
    {
      name: 'reviewAndExtractToc',
      description: 'مراجعة فهرس الكتاب واستخراج دروسه دفعة واحدة.',
      parameters: {
        type: 'OBJECT',
        properties: {
          bookTitle: { type: 'STRING' },
          grade:     { type: 'STRING' }
        },
        required: []
      }
    },
    {
      name: 'generateExamFromBank',
      description: 'توليد اختبار (داخلي، رسمي، إلكتروني) من درس أو أكثر.',
      parameters: {
        type: 'OBJECT',
        properties: {
          lessonTitles: { type: 'ARRAY', items: { type: 'STRING' } },
          examType: { type: 'STRING', enum: ['internal', 'official', 'electronic'] },
          difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] },
          questionTypes: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                type: { type: 'STRING', enum: ['mcq', 'tf', 'blank', 'match', 'essay'] },
                count: { type: 'NUMBER' }
              }
            }
          }
        },
        required: ['lessonTitles']
      }
    }
  ];

  /* ───────────────────────── الحالة الداخلية ───────────────────────── */
  let history = [];        
  let turnBoundaries = []; 
  const MAX_TURNS_KEPT = 8; 
  let panelOpen = false;
  let sending = false;
  let built = false;

  function ha() { return window.HaelActions || null; }

  /* ───────────────────────── بناء الواجهة ───────────────────────── */
  function injectStyles() {
    const css = `
    #hassOverlay{position:fixed;inset:0;background:rgba(20,10,40,.35);z-index:9990;opacity:0;pointer-events:none;transition:opacity .25s}
    #hassOverlay.open{opacity:1;pointer-events:auto}
    #hassPanel{position:fixed;left:0;right:0;bottom:var(--hass-kb-offset,0px);z-index:9991;background:var(--surface,#fff);
      border-radius:20px 20px 0 0;box-shadow:0 -6px 30px rgba(0,0,0,.25);
      max-height:82vh;display:flex;flex-direction:column;transform:translateY(105%);
      transition:transform .28s cubic-bezier(.2,.8,.2,1);font-family:var(--font-ui,'CairoEB',sans-serif)}
    #hassPanel.open{transform:translateY(0)}

    @media (min-width: 860px) {
      #hassPanel{
        left:auto; right:0; top:0; bottom:var(--hass-kb-offset,0px);
        width:420px; max-height:none; height:auto;
        border-radius:0; box-shadow:-8px 0 30px rgba(0,0,0,.22);
        transform:translateX(105%);
      }
      #hassPanel.open{transform:translateX(0)}
      .hass-head{border-radius:0}
    }
    .hass-head{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1.5px solid var(--line,#eee);
      background:linear-gradient(160deg,var(--primary,#7C3AED) 0%,var(--primary-2,#6D28D9) 100%);border-radius:20px 20px 0 0;color:#fff}
    .hass-head-title{font-weight:800;font-size:15px;flex:1}
    .hass-head-sub{font-size:11px;opacity:.85;font-weight:600}
    .hass-close{background:rgba(255,255,255,.18);border:none;color:#fff;width:30px;height:30px;border-radius:9px;font-size:16px;cursor:pointer}
    .hass-body{flex:1;overflow-y:auto;padding:12px 12px 6px;display:flex;flex-direction:column;gap:8px;background:var(--paper,#FAF5FF)}
    .hass-msg{max-width:86%;padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word}
    .hass-msg.user{align-self:flex-end;background:var(--primary,#7C3AED);color:#fff;border-bottom-left-radius:4px}
    .hass-msg.bot{align-self:flex-start;background:var(--surface,#fff);color:var(--ink,#1E1B4B);border:1.5px solid var(--line,#eee);border-bottom-right-radius:4px}
    .hass-msg.sys{align-self:center;background:var(--primary-soft,#EDE9FE);color:var(--primary-2,#6D28D9);font-size:12px;border-radius:10px;text-align:center}
    .hass-msg.tool{align-self:flex-start;background:var(--gold-soft,#FEF3C7);color:#92400E;font-size:12px;border-radius:10px}
    .hass-typing{align-self:flex-start;display:flex;gap:4px;padding:10px 12px}
    .hass-typing span{width:6px;height:6px;border-radius:50%;background:var(--primary,#7C3AED);opacity:.5;animation:hassBlink 1s infinite}
    .hass-typing span:nth-child(2){animation-delay:.2s}.hass-typing span:nth-child(3){animation-delay:.4s}
    @keyframes hassBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}
    .hass-chips{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;border-top:1px solid var(--line,#eee);background:var(--surface,#fff)}
    .hass-chip{white-space:nowrap;background:var(--primary-soft,#EDE9FE);color:var(--primary-2,#6D28D9);border:none;
      border-radius:20px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
    .hass-inputrow{display:flex;gap:8px;padding:10px 12px;border-top:1.5px solid var(--line,#eee);background:var(--surface,#fff);
      border-radius:0 0 0 0;padding-bottom:calc(10px + env(safe-area-inset-bottom))}
    .hass-input{flex:1;border:1.5px solid var(--line,#eee);border-radius:12px;padding:10px 12px;font-size:14px;
      font-family:inherit;resize:none;max-height:90px;background:var(--paper,#FAF5FF);color:var(--ink,#1E1B4B)}
    .hass-input:focus{outline:none;border-color:var(--primary,#7C3AED)}
    .hass-send{background:var(--primary,#7C3AED);color:#fff;border:none;border-radius:12px;width:44px;font-size:17px;cursor:pointer;flex-shrink:0}
    .hass-send:disabled{opacity:.5}
    .hass-mic{background:var(--primary-soft,#EDE9FE);color:var(--primary-2,#6D28D9);border:none;border-radius:12px;width:44px;font-size:17px;cursor:pointer;flex-shrink:0;transition:background .15s,color .15s}
    .hass-mic.listening{background:#DC2626;color:#fff;animation:hassMicPulse 1.1s infinite}
    @keyframes hassMicPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}
    
    .hass-lock{padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;flex:1}
    .hass-lock-box{background:var(--paper,#FAF5FF);border:1.5px solid var(--line,#eee);border-radius:12px;padding:15px;display:flex;flex-direction:column;gap:10px}
    .hass-lock-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13.5px}
    .hass-lock-row b{font-weight:900;color:var(--ink,#1E1B4B)}
    .hass-copy-btn{background:var(--primary-soft,#EDE9FE);color:var(--primary-2,#6D28D9);border:none;border-radius:8px;padding:8px 10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;flex-shrink:0}
    .hass-wa-btn{display:block;text-align:center;background:#25D366;color:#fff;text-decoration:none;padding:12px;border-radius:10px;font-weight:800;font-size:14.5px; box-shadow:0 4px 6px rgba(37,211,102,0.2);}
    `.trim();
    const style = document.createElement('style');
    style.id = 'hassStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildPanel() {
    const overlay = document.createElement('div');
    overlay.id = 'hassOverlay';
    const panel = document.createElement('div');
    panel.id = 'hassPanel';
    panel.innerHTML = `
      <div class="hass-head">
        <div>
          <div class="hass-head-title">🤖 المساعد الذكي</div>
          <div class="hass-head-sub" id="hassContextLabel">جاهز للمساعدة</div>
        </div>
        <button class="hass-close" id="hassReset" type="button" title="مسح المحادثة">🔄</button>
        <button class="hass-close" id="hassClose" type="button">✕</button>
      </div>
      <div id="hassChatArea" style="display:flex;flex-direction:column;flex:1;min-height:0">
        <div class="hass-body" id="hassBody"></div>
        <div class="hass-chips" id="hassChips"></div>
        <div class="hass-inputrow">
          <textarea class="hass-input" id="hassInput" rows="1" placeholder="اكتب طلبك هنا... مثال: افتح لي جدول الحصص"></textarea>
          <button class="hass-mic" id="hassMic" type="button" title="إدخال صوتي">🎤</button>
          <button class="hass-send" id="hassSend" type="button">➤</button>
        </div>
      </div>
      <div id="hassLock" class="hass-lock" style="display:none"></div>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    overlay.addEventListener('click', closePanel);
    document.getElementById('hassClose').addEventListener('click', closePanel);
    document.getElementById('hassReset').addEventListener('click', resetConversation);
    document.getElementById('hassSend').addEventListener('click', handleSend);
    const input = document.getElementById('hassInput');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(90, input.scrollHeight) + 'px';
    });
    setupVoiceInput();
  }

  function renderReminderScreen() {
    const lock = document.getElementById('hassLock');
    const waLink = PAY_INFO.whatsapp;
    lock.innerHTML = `
      <div style="text-align:center; font-size:45px; margin-bottom:5px;">🤝</div>
      <h3 style="text-align:center; color:var(--primary-2,#6D28D9); font-size:18px;">رسالة من مطور التطبيق</h3>
      <p style="font-size:14.5px; font-weight:bold; line-height:1.8; text-align:justify; color:#1E293B; margin-bottom:10px;">
        زميلك بذل جهوداً كبيرة لأكثر من ألف ساعة عمل وأنفق مالاً، فإذا كان لديك سعة فلا تبخل أن تساعده بما تجود به نفسك.. وإلا فالتطبيق والمساعد مجاني بالكامل.
      </p>
      <div class="hass-lock-box">
        <div class="hass-lock-row"><span>البنك/المحفظة</span><b>${PAY_INFO.bank}</b></div>
        <div class="hass-lock-row"><span>رقم الحساب</span><b id="hassAccNoText">${PAY_INFO.account}</b></div>
        <div class="hass-lock-row"><span>باسم</span><b>${PAY_INFO.name}</b></div>
        <button class="hass-copy-btn" id="hassCopyAccNo" type="button">📋 نسخ رقم الحساب</button>
      </div>
      <a class="hass-wa-btn" href="${waLink}" target="_blank" rel="noopener">💬 تواصل عبر واتساب</a>
      <button id="hassContinueBtn" type="button" style="margin-top:10px; background:#10B981; color:#fff; border:none; border-radius:12px; padding:14px; font-weight:900; font-size:15px; cursor:pointer; width:100%; font-family:inherit; box-shadow:0 4px 6px rgba(16, 185, 129, 0.2); transition:0.2s;">استمرار لاستخدام المساعد (مجاناً) 🚀</button>
    `;
    
    lock.querySelector('#hassCopyAccNo').addEventListener('click', () => copyToClipboard(PAY_INFO.account, 'hassCopyAccNo'));
    
    lock.querySelector('#hassContinueBtn').addEventListener('click', () => {
      markReminderShown();
      showChatArea();
      if (!history.length) showWelcome();
      setTimeout(() => document.getElementById('hassInput')?.focus(), 300);
    });
  }

  function copyToClipboard(text, btnId) {
    const done = () => {
      const btn = document.getElementById(btnId);
      if (btn) { const orig = btn.textContent; btn.textContent = '✓ تم النسخ'; setTimeout(() => btn.textContent = orig, 1500); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  }

  function showChatArea() {
    document.getElementById('hassChatArea').style.display = 'flex';
    document.getElementById('hassLock').style.display = 'none';
  }
  function showLockArea() {
    document.getElementById('hassChatArea').style.display = 'none';
    document.getElementById('hassLock').style.display = 'flex';
  }


  /* ───────────────────────── الإدخال الصوتي ───────────────────────── */
  let recognizer = null;
  let listening = false;

  function setupVoiceInput() {
    const micBtn = document.getElementById('hassMic');
    if (!micBtn) return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      micBtn.style.opacity = '.4';
      micBtn.addEventListener('click', () => {
        addMsg('sys', 'الإدخال الصوتي غير مدعوم على هذا الجهاز/التطبيق حالياً. جرّبه من متصفح Chrome مباشرة إن أمكن.');
      });
      return;
    }
    recognizer = new SpeechRecognitionCtor();
    recognizer.lang = 'ar-SA';
    recognizer.continuous = true;     
    recognizer.interimResults = true; 
    recognizer.maxAlternatives = 1;

    let finalTranscript = '';
    let baseInputValue = '';
    let intentionalStop = false;

    recognizer.onstart = () => {
      listening = true; micBtn.classList.add('listening'); micBtn.textContent = '⏺️';
      finalTranscript = '';
      const input = document.getElementById('hassInput');
      baseInputValue = input ? input.value : '';
    };

    recognizer.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += transcript + ' ';
        else interim += transcript;
      }
      const input = document.getElementById('hassInput');
      if (input) {
        const sep = baseInputValue && !/\s$/.test(baseInputValue) ? ' ' : '';
        input.value = baseInputValue + sep + finalTranscript + interim;
        input.dispatchEvent(new Event('input'));
      }
    };

    recognizer.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'audio-capture' || e.error === 'service-not-allowed') {
        intentionalStop = true; 
        addMsg('sys', 'تعذّر الوصول للميكروفون. تأكد من صلاحية الميكروفون للتطبيق من إعدادات الجهاز.');
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        addMsg('sys', 'حدث خلل مؤقت بالتعرف الصوتي، يُعاد المحاولة تلقائياً...');
      }
    };

    recognizer.onend = () => {
      const wasListening = listening;
      listening = false; micBtn.classList.remove('listening'); micBtn.textContent = '🎤';
      if (wasListening && !intentionalStop) {
        try { recognizer.start(); listening = true; micBtn.classList.add('listening'); micBtn.textContent = '⏺️'; }
        catch (e) { }
      }
      intentionalStop = false;
    };

    micBtn.addEventListener('click', () => {
      if (listening) { intentionalStop = true; recognizer.stop(); return; }
      intentionalStop = false;
      try { recognizer.start(); }
      catch (e) { addMsg('sys', 'تعذّر تشغيل الميكروفون.'); }
    });
  }

  /* ───────────────────────── معالجة شريط Safari السفلي ولوحة المفاتيح (iPad/iOS) ───────────────────────── */
  function setupViewportFix() {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    function update() {
      const offset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      document.documentElement.style.setProperty('--hass-kb-offset', offset + 'px');
    }
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
  }

  function ensureBuilt() {
    if (built) return;
    injectStyles();
    buildPanel();
    setupViewportFix();
    built = true;
  }

  /* ───────────────────────── فتح/إغلاق ───────────────────────── */
  function openPanel() {
    ensureBuilt();
    panelOpen = true;
    document.getElementById('hassOverlay').classList.add('open');
    document.getElementById('hassPanel').classList.add('open');

    // 💡 التحقق من مرور 15 يوم لعرض رسالة التذكير الراقية (والتطبيق مجاني بالكامل)
    if (shouldShowReminder()) {
      renderReminderScreen();
      showLockArea();
      return;
    }
    
    showChatArea();
    updateContextLabel();
    if (!history.length) showWelcome();
    setTimeout(() => document.getElementById('hassInput')?.focus(), 300);
  }
  
  function trimHistoryToLastTurns(maxTurns) {
    if (turnBoundaries.length <= maxTurns) return;
    const cutIndex = turnBoundaries[turnBoundaries.length - maxTurns];
    if (cutIndex <= 0) return;
    history = history.slice(cutIndex);
    turnBoundaries = turnBoundaries.slice(-maxTurns).map(i => i - cutIndex);
  }

  function resetConversation() {
    history = [];
    turnBoundaries = [];
    const body = document.getElementById('hassBody');
    if (body) body.innerHTML = '';
    showWelcome();
  }

  function closePanel() {
    panelOpen = false;
    document.getElementById('hassOverlay')?.classList.remove('open');
    document.getElementById('hassPanel')?.classList.remove('open');
  }

  function updateContextLabel() {
    const api = ha();
    if (!api) return;
    const ctx = api.getContext();
    const label = document.getElementById('hassContextLabel');
    if (!label) return;
    
    if (!ctx.hasApiKey) { label.innerHTML = '⚠️ لم يتم إضافة مفتاح API بعد'; return; }
    label.innerHTML = (ctx.currentRecord
      ? `الشاشة: ${ctx.viewLabel || ctx.view} — مفتوح: ${ctx.currentRecord.title}`
      : `الشاشة الحالية: ${ctx.viewLabel || ctx.view}`);
  }

  function showWelcome() {
    addMsg('sys', 'مرحباً بك 👋 أنا المساعد الذكي داخل تطبيق الذكي. اطلب مني أي شيء: تحضير درس، فتح حل النماذج، أو حتى شرح ميزات التطبيق.');
    renderChips(defaultChipsForContext());
  }

  function defaultChipsForContext() {
    const api = ha();
    const ctx = api ? api.getContext() : { view: 'home' };
    const common = ['افتح حل النماذج', 'افتح جدول الحصص', 'اشرح لي أقسام التطبيق'];
    switch (ctx.view) {
      case 'new':
        return ['حضّر لي درساً عن ...', 'كيف أرفع صوراً للنص؟', ...common];
      case 'result':
        return ['اشرح لي هذه الخطة', 'أنشئ اختبار من هذا الدرس', 'كيف أصدرها Word؟'];
      case 'bank':
        return ['ابحث عن درس بعنوان ...', 'أنشئ اختبار من درس معين', ...common];
      case 'archive':
        return ['ابحث في الأرشيف عن ...', ...common];
      case 'library':
        return ['ابحث عن كتاب باسم ...', ...common];
      case 'settings':
        return ['كيف أحصل على مفتاح Gemini؟', ...common];
      default:
        return ['افتح الخطة الفصلية', 'افتح الأرشيف', 'ابحث في دروس واختبارات', ...common];
    }
  }

  function renderChips(list) {
    const box = document.getElementById('hassChips');
    if (!box) return;
    box.innerHTML = '';
    list.forEach(text => {
      const b = document.createElement('button');
      b.className = 'hass-chip'; b.type = 'button'; b.textContent = text;
      b.addEventListener('click', () => {
        const input = document.getElementById('hassInput');
        input.value = text.endsWith('...') ? text.replace('...', '') : text;
        input.focus();
      });
      box.appendChild(b);
    });
  }

  function addMsg(kind, text) {
    const body = document.getElementById('hassBody');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'hass-msg ' + kind;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function showTyping() {
    const body = document.getElementById('hassBody');
    const div = document.createElement('div');
    div.className = 'hass-typing'; div.id = 'hassTyping';
    div.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping() { document.getElementById('hassTyping')?.remove(); }

  /* ───────────────────────── الاتصال بـ Gemini ───────────────────────── */
  async function callGeminiTurn(contents, apiCfg) {
    const url = `${apiCfg.geminiBase}${apiCfg.model}:generateContent?key=${encodeURIComponent(apiCfg.apiKey)}`;
    const contextCtx = ha().getContext();
    const contextLine = `\n\nالسياق الحالي داخل التطبيق الآن:\n- الشاشة المفتوحة: ${contextCtx.viewLabel || contextCtx.view}\n- مفتاح API متوفر: ${contextCtx.hasApiKey ? 'نعم' : 'لا'}\n- السجل المفتوح حالياً: ${contextCtx.currentRecord ? `"${contextCtx.currentRecord.title}" (${contextCtx.currentRecord.kind}، مادة ${contextCtx.currentRecord.subject || '-'}، صف ${contextCtx.currentRecord.grade || '-'})` : 'لا يوجد'}`;

    const body = {
      system_instruction: { parts: [{ text: APP_KNOWLEDGE + contextLine }] },
      contents,
      tools: [{ function_declarations: TOOLS }],
      generationConfig: { temperature: 0.3 }
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'تعذّر الاتصال بالذكاء الاصطناعي');
    const cand = data.candidates && data.candidates[0];
    if (!cand) throw new Error('لم يصل رد من النموذج');
    return cand.content;
  }

  const TOOL_LABELS = {
    navigateTo: 'الانتقال إلى الشاشة المطلوبة',
    createLessonPlan: 'تحضير خطة الدرس',
    createLessonFromLibrary: 'تحضير الدرس من كتاب المكتبة',
    generateQuizFromCurrentPlan: 'توليد اختبار تفاعلي عام من الدرس المفتوح',
    generateBoard: 'توليد السبورة التفاعلية',
    generateMindmap: 'توليد الخريطة الذهنية',
    generatePptxFromBoard: 'توليد عرض بوربوينت من السبورة',
    searchBank: 'البحث في دروس واختبارات',
    openBankLesson: 'فتح الدرس من دروس واختبارات',
    searchArchive: 'البحث في الأرشيف',
    openArchiveRecord: 'فتح السجل من الأرشيف',
    searchLibrary: 'البحث في المكتبة',
    openLibraryBook: 'فتح الكتاب من المكتبة',
    extractLibraryToc: 'استخراج فهرس الكتاب',
    extractBookRangeToBank: 'استخراج نطاق صفحات وحفظه',
    reviewAndExtractToc: 'مراجعة الفهرس واستخراج الدروس',
    generateExamFromBank: 'توليد الاختبار',
    generateBankSummary: 'توليد الملخص الشامل',
    openExamArchive: 'فتح مُحرّر الاختبارات',
    openSchedule: 'فتح جدول الحصص',
    openPlatform: 'فتح المنصة المدرسية',
    openGrades: 'فتح سجل الدرجات والحضور',
    openSemesterPlan: 'فتح الخطة الفصلية',
    openOralExam: 'فتح الاختبارات الشفوية',
    openExamSolver: 'فتح أداة حل النماذج',
    generateAudio: 'إعداد نص الدرس الصوتي',
    synthesizeAudio: 'توليد الصوت الفعلي',
    exportAudioAsVideo: 'تصدير الفيديو'
  };

  const REVEAL_ON_SUCCESS = new Set([
    'createLessonPlan', 'createLessonFromLibrary', 'generateQuizFromCurrentPlan',
    'generateBoard', 'generateMindmap', 'openBankLesson', 'openArchiveRecord',
    'openLibraryBook', 'generateExamFromBank', 'extractLibraryToc',
    'generateBankSummary', 'generateAudio', 'synthesizeAudio'
  ]);

  const CLOSE_BEFORE_EXEC = new Set([
    'exportAudioAsVideo', 'openExamArchive', 'extractBookRangeToBank', 
    'reviewAndExtractToc', 'openSchedule', 'openPlatform', 'openGrades',
    'openSemesterPlan', 'openOralExam', 'openExamSolver'
  ]);

  function wrapToolResponse(result) {
    if (Array.isArray(result)) return { results: result };
    if (result && typeof result === 'object') return result;
    return { value: result };
  }

  async function executeTool(name, args) {
    // معالجة فتح الروابط الخارجية مباشرة بعيداً عن core.js
    if (name === 'openExamSolver') { window.location.href = 'exam_solver.html'; return { ok: true, value: 'تم الانتقال' }; }
    if (name === 'openOralExam') { window.location.href = 'oralexam.html'; return { ok: true, value: 'تم الانتقال' }; }
    if (name === 'openSemesterPlan') {
      if (typeof window.openSemesterPlanModal === 'function') {
        window.openSemesterPlanModal();
        return { ok: true, value: 'تم فتح الخطة الفصلية' };
      }
      return { ok: false, reason: 'الميزة غير محملة حالياً' };
    }

    const api = ha();
    if (!api || typeof api[name] !== 'function') return { ok: false, reason: 'tool_not_found' };
    try { return await api[name](normalizeArgs(name, args)); }
    catch (e) { return { ok: false, reason: e.message || 'error' }; }
  }

  function normalizeArgs(name, args) {
    args = args || {};
    if (name === 'openBankLesson' || name === 'openArchiveRecord' || name === 'openLibraryBook') return args.title;
    if (name === 'searchBank' || name === 'searchArchive' || name === 'searchLibrary') return args.query;
    if (name === 'navigateTo') return args.view;
    return args;
  }

  /* ───────────────────────── إرسال رسالة كاملة (مع حلقة تنفيذ الأدوات) ───────────────────────── */
  async function handleSend() {
    if (sending) return;
    const input = document.getElementById('hassInput');
    const text = (input.value || '').trim();
    if (!text) return;
    const api = ha();
    if (!api) { addMsg('sys', 'تعذّر الاتصال بمنطق التطبيق. أعد تحميل الصفحة.'); return; }

    const ctx = api.getContext();
    if (!ctx.hasApiKey) {
      addMsg('sys', 'لم يتم إضافة مفتاح Gemini API بعد. سأنقلك إلى الإعدادات لإضافته أولاً.');
      api.navigateTo('settings');
      closePanel();
      return;
    }

    input.value = ''; input.style.height = 'auto';
    addMsg('user', text);
    const historyLenBeforeTurn = history.length;
    turnBoundaries.push(historyLenBeforeTurn);
    history.push({ role: 'user', parts: [{ text }] });

    sending = true;
    document.getElementById('hassSend').disabled = true;
    showTyping();

    try {
      const apiCfg = api.getApiConfig();
      let loops = 0;
      let shouldReveal = false;
      let content = await callGeminiTurn(history, apiCfg);

      while (loops < 8) {
        loops++;
        history.push(Object.assign({ role: 'model' }, content));

        const parts = content.parts || [];
        const fnCalls = parts.filter(p => p.functionCall);
        const textPart = parts.filter(p => p.text).map(p => p.text).join('').trim();

        if (fnCalls.length) {
          hideTyping();
          for (const fc of fnCalls) {
            const fname = fc.functionCall.name;
            const fargs = fc.functionCall.args || {};
            addMsg('tool', `🔧 ${TOOL_LABELS[fname] || fname}...`);
            if (fname === 'generateExamFromBank' && fargs.examType === 'official') {
              addMsg('sys', '⚠️ سيتم الآن توليد الاختبار الرسمي، وستنتقل الصفحة تلقائياً لفتحه في ملف الاختبارات — ستُغلق نافذة المساعد عند الانتقال، وهذا أمر طبيعي.');
            }
            if (fname === 'openSchedule' || fname === 'openPlatform' || fname === 'openGrades' || fname === 'openExamArchive' || fname === 'openExamSolver' || fname === 'openOralExam') {
              addMsg('sys', '⚠️ سيتم الآن الانتقال لفتح الشاشة المطلوبة — ستُغلق نافذة المساعد، وهذا أمر طبيعي.');
            }
            if (fname === 'exportAudioAsVideo') {
              addMsg('sys', '⚠️ تصدير الفيديو تسجيل حقيقي بالوقت الفعلي يستغرق مدة تعادل طول الصوت (قد تكون دقائق). سيُغلق المساعد الآن ليظهر شريط التقدّم الحقيقي على الشاشة — لا تُغلق التطبيق حتى ينتهي.');
            }
            if (fname === 'extractBookRangeToBank') {
              addMsg('sys', '⚠️ سيظهر الآن نافذة لتأكيد اسم الدرس، ثم يبدأ الاستخراج (قد يستغرق دقيقة أو أكثر حسب عدد الصفحات وهل استُخرجت من قبل). سيُغلق المساعد الآن ليظهر التقدّم الحقيقي.');
            }
            if (fname === 'reviewAndExtractToc') {
              addMsg('sys', '⚠️ سيظهر الآن جدول فهرس الكتاب كاملاً لمراجعتك وتصحيحه، ثم استخراج كل موضوع مُفعّل تلقائياً (قد يستغرق عدة دقائق حسب عدد الدروس والصفحات). سيُغلق المساعد الآن — راجع الفهرس على الشاشة ثم اضغط "ابدأ الاستخراج" هناك.');
            }
            if (CLOSE_BEFORE_EXEC.has(fname)) closePanel();
            const result = await executeTool(fname, fargs);
            if (result && result.ok && REVEAL_ON_SUCCESS.has(fname)) shouldReveal = true;
            updateContextLabel();
            history.push({ role: 'function', parts: [{ functionResponse: { name: fname, response: wrapToolResponse(result) } }] });
          }
          showTyping();
          content = await callGeminiTurn(history, apiCfg);
          continue;
        }

        hideTyping();
        if (textPart) addMsg('bot', textPart);
        break;
      }

      if (shouldReveal) {
        addMsg('sys', '👁️ سيتم إغلاق المساعد الآن لعرض النتيجة كاملة...');
        setTimeout(closePanel, 1100);
      }
      trimHistoryToLastTurns(MAX_TURNS_KEPT);
    } catch (e) {
      hideTyping();
      addMsg('sys', 'حدث خطأ: ' + (e.message || 'غير معروف') + ' — تم تجاهل هذه المحاولة من سجل المحادثة، أعد المحاولة.');
      history.length = historyLenBeforeTurn; 
      turnBoundaries.pop(); 
    } finally {
      sending = false;
      document.getElementById('hassSend').disabled = false;
      renderChips(defaultChipsForContext());
    }
  }

  /* ───────────────────────── الربط بزر appbar ───────────────────────── */
  function wireButton() {
    const btn = document.getElementById('btnAssistant');
    if (!btn) return;
    btn.addEventListener('click', () => { panelOpen ? closePanel() : openPanel(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButton);
  } else {
    wireButton();
  }
})();

