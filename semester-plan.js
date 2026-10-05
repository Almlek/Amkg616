/* ═══════════════════════════════════════════
   الذكي v5.0 — semester-plan.js
   ميزة الخطة الفصلية (نظام الخوارزمية الفلكية لتوزيع الأشهر بدقة ومنع أخطاء الأندرويد)
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  const CLASS_QUOTAS = {
    "القرآن الكريم": { "1":5, "2":5, "3":5, "4":4, "5":4, "6":4, "7":3, "8":3, "9":3, "10":2, "11ع":2, "11أ":3, "12ع":2, "12أ":2 },
    "التربية الإسلامية": { "1":3, "2":3, "3":3, "4":4, "5":4, "6":4, "7":4, "8":4, "9":4, "10":4, "11ع":3, "11أ":4, "12ع":3, "12أ":4 },
    "اللغة العربية": { "1":10, "2":10, "3":10, "4":10, "5":9, "6":9, "7":6, "8":6, "9":6, "10":6, "11ع":6, "11أ":8, "12ع":6, "12أ":8 },
    "اللغة الإنجليزية": { "7":5, "8":5, "9":5, "10":5, "11ع":5, "11أ":6, "12ع":5, "12أ":6 },
    "الرياضيات": { "1":5, "2":5, "3":5, "4":6, "5":6, "6":6, "7":6, "8":6, "9":6, "10":5, "11ع":8, "12ع":8 },
    "العلوم": { "1":2, "2":2, "3":2, "4":3, "5":3, "6":3, "7":4, "8":4, "9":4 },
    "الاجتماعيات (أساسي)": { "4":5, "5":5, "6":5, "7":5, "8":5, "9":5 },
    "فيزياء": { "10":2, "11ع":4, "12ع":4 },
    "كيمياء": { "10":2, "11ع":3, "12ع":3 },
    "أحياء": { "10":3, "11ع":3, "12ع":3 },
    "تاريخ": { "7":2, "8":2, "9":2, "10":2, "11أ":3, "12أ":3 },
    "جغرافيا": { "7":2, "8":2, "9":2, "10":2, "11أ":3, "12أ":4 },
    "مجتمع يمني": { "10":1 },
    "علم اجتماع": { "11أ":2 },
    "مبادئ اقتصاد": { "11أ":2 },
    "علم نفس": { "12أ":2 },
    "فلسفة": { "12أ":2 },
    "منطق": { "12أ":2 }
  };

  const SEMESTER_PLAN_SCHEMA = {
    type: "object",
    properties: {
      months: {
        type: "array",
        items: {
          type: "object",
          properties: {
            monthName: { type: "string" },
            weeks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  weekNum: { type: "integer" },
                  daysCount: { type: "integer" },
                  classesCount: { type: "integer" },
                  topics: { type: "string" },
                  objectives: { type: "string" },
                  strategies: { type: "string" },
                  resources: { type: "string" },
                  activitiesIn: { type: "string" },
                  activitiesOut: { type: "string" },
                  assessment: { type: "string" }
                },
                required: ["weekNum", "daysCount", "classesCount", "topics", "objectives", "strategies", "resources", "activitiesIn", "activitiesOut", "assessment"]
              }
            }
          },
          required: ["monthName", "weeks"]
        }
      }
    },
    required: ["months"]
  };

  const escText = (s) => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // 🌟 الخوارزمية الفلكية الدقيقة للتحويل للهجري داخل التطبيق 🌟
  function getHijriDate(date) {
    let d = date.getDate();
    let m = date.getMonth() + 1;
    let y = date.getFullYear();
    let jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
             Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
             Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) + d - 32075;
    let l = jd - 1948440 + 10632;
    let n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let hm = Math.floor((24 * l) / 709);
    let hd = l - Math.floor((709 * hm) / 24);
    let hy = 30 * n + j - 30;
    return { year: hy, month: hm, day: hd };
  }

  const HIJRI_MONTHS = ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
  const GREGORIAN_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  function createSemesterModal() {
    let modal = document.getElementById('semesterPlanModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.id = 'semesterPlanModal';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 580px;">
        <div class="modal-hdr">
          <h2>📅 إعداد الخطة الفصلية (توزيع زمني دقيق)</h2>
          <button class="modal-close" onclick="document.getElementById('semesterPlanModal').classList.remove('is-active')">✕</button>
        </div>
        <div class="modal-body">
          <p class="hint" style="color:#d97706; font-weight:bold;">أدخل التواريخ بالميلادي وسيقوم المحرك بحساب الأشهر وتوزيعها بدقة تامة.</p>
          
          <div class="segmented" id="spSourceSegment" style="margin-bottom: 15px;">
            <button class="seg-btn active" data-source="library">المكتبة</button>
            <button class="seg-btn" data-source="text">نص يدوي</button>
            <button class="seg-btn" data-source="image">من صورة</button>
          </div>

          <div id="spPanelLibrary">
            <label class="field">
              <span>📚 المرجع (من المكتبة)</span>
              <select id="spBookSelect" class="form-sel">
                <option value="">— جاري تحميل الكتب —</option>
              </select>
            </label>
            <div id="spTocContainer" hidden style="margin-top: 10px;">
              <label class="field">
                <span>📋 حدد المواضيع (اختياري: أدخل عدد الحصص لكل موضوع)</span>
                <div id="spTocList" style="max-height: 220px; overflow-y: auto; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; background: #fff; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                </div>
              </label>
            </div>
          </div>

          <div id="spPanelText" hidden>
            <label class="field">
              <span>📝 قائمة المواضيع المقررة</span>
              <textarea id="spManualText" class="big-ta" rows="4" placeholder="اكتب أو الصق مواضيع المنهج هنا..."></textarea>
            </label>
          </div>

          <div id="spPanelImage" hidden>
            <button class="btn-sec" id="btnSpPickImage" style="width:100%; margin-bottom:10px;">📷 التقاط أو اختيار صورة الفهرس</button>
            <input type="file" id="spImageInput" accept="image/*" hidden>
            <div id="spImageProgress" class="prog-wrap" hidden>
              <div class="prog-bar"><div class="prog-fill" style="width:100%"></div></div>
              <span id="spImageStatus" class="prog-label">جاري استخراج المواضيع...</span>
            </div>
            <label class="field" id="spImageTextWrap" hidden>
              <span>✅ المواضيع المستخرجة (يمكنك التعديل عليها)</span>
              <textarea id="spImageText" class="big-ta" rows="4"></textarea>
            </label>
          </div>

          <hr style="border: 1px dashed #cbd5e1; margin: 15px 0;">

          <div class="grid-2">
            <label class="field">
              <span>المادة</span>
              <select id="spSubject" class="form-sel">
                <option value="">-- اختر المادة --</option>
                <option value="القرآن الكريم">القرآن الكريم</option>
                <option value="التربية الإسلامية">التربية الإسلامية</option>
                <option value="اللغة العربية">اللغة العربية</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                <option value="الرياضيات">الرياضيات</option>
                <option value="العلوم">العلوم</option>
                <option value="الاجتماعيات (أساسي)">الاجتماعيات (أساسي)</option>
                <option value="فيزياء">فيزياء</option>
                <option value="كيمياء">كيمياء</option>
                <option value="أحياء">أحياء</option>
                <option value="تاريخ">تاريخ</option>
                <option value="جغرافيا">جغرافيا</option>
                <option value="مجتمع يمني">مجتمع يمني</option>
                <option value="علم اجتماع">علم اجتماع</option>
                <option value="مبادئ اقتصاد">مبادئ اقتصاد</option>
                <option value="علم نفس">علم نفس</option>
                <option value="فلسفة">فلسفة</option>
                <option value="منطق">منطق</option>
              </select>
            </label>

            <label class="field">
              <span>الصف الدراسي</span>
              <select id="spGrade" class="form-sel">
                <option value="">-- اختر الصف --</option>
                <option value="1">الأول الأساسي</option>
                <option value="2">الثاني الأساسي</option>
                <option value="3">الثالث الأساسي</option>
                <option value="4">الرابع الأساسي</option>
                <option value="5">الخامس الأساسي</option>
                <option value="6">السادس الأساسي</option>
                <option value="7">السابع الأساسي</option>
                <option value="8">الثامن الأساسي</option>
                <option value="9">التاسع الأساسي</option>
                <option value="10">الأول الثانوي</option>
                <option value="11ع">الثاني الثانوي (علمي)</option>
                <option value="11أ">الثاني الثانوي (أدبي)</option>
                <option value="12ع">الثالث الثانوي (علمي)</option>
                <option value="12أ">الثالث الثانوي (أدبي)</option>
              </select>
            </label>
          </div>

          <div class="grid-2">
            <label class="field">
              <span>البداية (بالميلادي) 🗓️</span>
              <input type="date" id="spStartDate">
            </label>
            <label class="field">
              <span>النهاية (بالميلادي) 🗓️</span>
              <input type="date" id="spEndDate">
            </label>
            
            <label class="field">
              <span>شكل التقويم في العرض</span>
              <select id="spCalendarType" class="form-sel">
                <option value="هجري" selected>هجري (محرم، صفر..)</option>
                <option value="ميلادي">ميلادي (أغسطس، سبتمبر..)</option>
              </select>
            </label>

            <label class="field">
              <span>الفصل الدراسي</span>
              <select id="spSemester" class="form-sel">
                <option value="الأول" selected>الأول</option>
                <option value="الثاني">الثاني</option>
              </select>
            </label>

            <label class="field">
              <span>إجمالي الأسابيع (يحسب آلياً)</span>
              <input type="number" id="spTotalWeeks" value="" min="2" max="25" style="background:#f8fafc; font-weight:bold;">
            </label>
            <label class="field">
              <span>عدد الحصص أسبوعياً ⚖️</span>
              <input type="number" id="spClassesPerWeek" value="" placeholder="تلقائي..." style="background: #f0fdf4; border-color: #16a34a; font-weight: bold;">
            </label>
          </div>

          <button class="btn-primary btn-lg" id="btnGenerateSemesterPlan" style="margin-top: 15px;">⚡ توليد الخطة الفصلية</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('spSourceSegment').addEventListener('click', (e) => {
      if(e.target.classList.contains('seg-btn')) {
        document.querySelectorAll('#spSourceSegment .seg-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const src = e.target.dataset.source;
        document.getElementById('spPanelLibrary').hidden = src !== 'library';
        document.getElementById('spPanelText').hidden = src !== 'text';
        document.getElementById('spPanelImage').hidden = src !== 'image';
      }
    });

    document.getElementById('spBookSelect').addEventListener('change', async (e) => {
      const bookId = parseInt(e.target.value);
      const tocContainer = document.getElementById('spTocContainer');
      const tocList = document.getElementById('spTocList');
      
      if (!bookId) { tocContainer.hidden = true; return; }
      
      try {
        const book = await window.HaelCore.dbGet(window.HaelCore.BOOKS_STORE, bookId);
        if (book && book.toc && book.toc.length > 0) {
          tocList.innerHTML = book.toc.map((item, i) => `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
              <label style="display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;">
                <input type="checkbox" class="sp-toc-check" value="${i}" checked style="accent-color: #7C3AED; width: 16px; height: 16px;">
                <span style="font-size: 13.5px; color: #334155; font-weight: bold;">${escText(item.title)}</span>
              </label>
              <input type="number" class="sp-toc-classes form-sel" min="1" max="20" placeholder="حصص" title="عدد الحصص المقترحة (اختياري)" style="width: 65px; padding: 4px 8px; height: 32px; font-size: 13px; text-align: center; border-radius: 6px;">
            </div>
          `).join('');
          tocContainer.hidden = false;
        } else {
          tocContainer.hidden = true;
        }
      } catch(err) { tocContainer.hidden = true; }
    });

    document.getElementById('btnSpPickImage').addEventListener('click', () => document.getElementById('spImageInput').click());
    document.getElementById('spImageInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const apiKey = window.HaelCore.getApiKey();
      if(!apiKey) { window.HaelCore.toast('الرجاء إدخال مفتاح API في الإعدادات', 'error'); return; }
      
      const prog = document.getElementById('spImageProgress');
      const txtWrap = document.getElementById('spImageTextWrap');
      const txtInput = document.getElementById('spImageText');
      prog.hidden = false; txtWrap.hidden = true;
      document.getElementById('spImageStatus').textContent = 'جاري تحليل الصورة...';

      try {
        const reader = new FileReader();
        const b64Promise = new Promise(resolve => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        const b64 = await b64Promise;
        
        let aiModel = 'gemini-3.5-flash';
        try {
          const storedSettings = localStorage.getItem('haael_settings_v2');
          if (storedSettings && storedSettings.trim().startsWith('{')) { aiModel = JSON.parse(storedSettings).defaultModel || aiModel; }
        } catch(e) {}
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: b64 } }, { text: "استخرج النص كفهرس بدقة." }]}],
            generationConfig: { temperature: 0.1 }
          })
        });
        
        let data;
        try { data = await res.json(); } catch(err) { throw new Error("رد غير صالح"); }
        if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال');
        txtInput.value = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
        prog.hidden = true; txtWrap.hidden = false;
        window.HaelCore.toast('تم الاستخراج بنجاح ✓', 'success');
      } catch(err) {
        prog.hidden = true; window.HaelCore.toast('فشل الاستخراج: ' + err.message, 'error');
      }
    });

    const calcWeeks = () => {
        const sDate = document.getElementById('spStartDate').value;
        const eDate = document.getElementById('spEndDate').value;
        if (sDate && eDate) {
            const s = new Date(sDate);
            const e = new Date(eDate);
            if (e > s) {
                // استخدام Math.floor لتجاهل الأيام الزائدة وعدم احتسابها كأسبوع إضافي
                const diffDays = Math.floor((e - s) / (1000 * 60 * 60 * 24));
                const weeks = Math.floor(diffDays / 7);
                document.getElementById('spTotalWeeks').value = weeks;
            }
        }
    };
    document.getElementById('spStartDate').addEventListener('change', calcWeeks);
    document.getElementById('spEndDate').addEventListener('change', calcWeeks);

    const updateQuota = () => {
      const sub = document.getElementById('spSubject').value;
      const grd = document.getElementById('spGrade').value;
      const input = document.getElementById('spClassesPerWeek');
      if (sub && grd && CLASS_QUOTAS[sub] && CLASS_QUOTAS[sub][grd] !== undefined) {
          input.value = CLASS_QUOTAS[sub][grd];
      }
    };
    document.getElementById('spSubject').addEventListener('change', updateQuota);
    document.getElementById('spGrade').addEventListener('change', updateQuota);
    
    document.getElementById('btnGenerateSemesterPlan').addEventListener('click', generateSemesterPlan);
    return modal;
  }

  window.openSemesterPlanModal = async function() {
    const modal = createSemesterModal();
    try {
      const books = await window.HaelCore.dbGetAll(window.HaelCore.BOOKS_STORE);
      const sel = document.getElementById('spBookSelect');
      sel.innerHTML = '<option value="">— اختر كتاباً —</option>' + 
        books.map(b => `<option value="${b.id}">${b.name} (${b.toc?.length ? 'يوجد فهرس' : 'بدون فهرس'})</option>`).join('');
    } catch (e) {
      window.HaelCore.toast('تعذر تحميل المكتبة', 'error');
    }
    modal.classList.add('is-active');
  };

  async function generateSemesterPlan() {
    const startDate = document.getElementById('spStartDate').value;
    const endDate = document.getElementById('spEndDate').value;
    const calendarType = document.getElementById('spCalendarType').value;
    const semester = document.getElementById('spSemester').value;
    const totalWeeks = parseInt(document.getElementById('spTotalWeeks').value);
    const classesPerWeek = parseInt(document.getElementById('spClassesPerWeek').value);
    const subjectName = document.getElementById('spSubject').value || 'المادة المحددة';
    const grade = document.getElementById('spGrade').value;
    
    const apiKey = window.HaelCore.getApiKey();
    if (!apiKey) { window.HaelCore.toast('أدخل مفتاح API في الإعدادات', 'error'); return; }
    
    if (!startDate || !endDate || !totalWeeks || !classesPerWeek) { 
        window.HaelCore.toast('الرجاء تعبئة التواريخ والحقول', 'error'); 
        return; 
    }

    // 🌟 السحر البرمجي (جافاسكربت يخطو في التقويم أسبوعاً بأسبوع لبناء الهيكل بدقة 100%):
    const skeleton = { months: [] };
    let currentDate = new Date(startDate);
    let currentMonthGroup = null;
    
    for (let w = 1; w <= totalWeeks; w++) {
        let currentMonthName = "";
        if (calendarType === "هجري") {
            let hDate = getHijriDate(currentDate);
            // جلب السنة الهجرية وتحويلها لأرقام عربية (هندية)
            let yStr = String(hDate.year).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
            currentMonthName = HIJRI_MONTHS[hDate.month - 1] + " " + yStr;
        } else {
            // جلب السنة الميلادية وتحويلها لأرقام عربية (هندية)
            let yStr = String(currentDate.getFullYear()).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
            currentMonthName = GREGORIAN_MONTHS[currentDate.getMonth()] + " " + yStr;
        }
        let displayMonthName = currentMonthName;
        if (w === 1) displayMonthName = `${currentMonthName} (بدءاً من ${startDate})`;

        if (!currentMonthGroup || currentMonthGroup.baseName !== currentMonthName) {
            currentMonthGroup = { 
                baseName: currentMonthName, 
                monthName: displayMonthName, 
                weeks: [] 
            };
            skeleton.months.push(currentMonthGroup);
        }

        currentMonthGroup.weeks.push({
            weekNum: w,
            daysCount: 5,
            classesCount: classesPerWeek,
            topics: "[سيتم تعبئته آلياً]",
            objectives: "[سيتم تعبئته آلياً]",
            strategies: "[سيتم تعبئته آلياً]",
            resources: "[سيتم تعبئته آلياً]",
            activitiesIn: "[سيتم تعبئته آلياً]",
            activitiesOut: "[سيتم تعبئته آلياً]",
            assessment: "[سيتم تعبئته آلياً]"
        });

        // القفز الدقيق للأمام بمقدار 7 أيام
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    if (skeleton.months.length > 0) {
        let lastMonth = skeleton.months[skeleton.months.length - 1];
        if (lastMonth.weeks.length > 0 && !lastMonth.monthName.includes('إلى')) {
            lastMonth.monthName = `${lastMonth.baseName} (إلى ${endDate})`;
        }
    }

    const skeletonString = JSON.stringify(skeleton, null, 2);

    let tocText = '';
    let planTitle = `خطة فصلية: ${subjectName}`;
    const activeSource = document.querySelector('#spSourceSegment .active').dataset.source;

    if (activeSource === 'library') {
      const bookId = parseInt(document.getElementById('spBookSelect').value);
      if (!bookId) { window.HaelCore.toast('الرجاء اختيار كتاب من المكتبة', 'error'); return; }
      const book = await window.HaelCore.dbGet(window.HaelCore.BOOKS_STORE, bookId);
      if (!book || !book.toc || book.toc.length === 0) { window.HaelCore.toast('هذا الكتاب لا يمتلك فهرساً!', 'error'); return; }
      
      const selectedItems = [];
      document.querySelectorAll('.sp-toc-check:checked').forEach(chk => {
        const row = chk.closest('div');
        const title = row.querySelector('span').textContent;
        const classesInput = row.querySelector('.sp-toc-classes').value;
        let itemText = title;
        if (classesInput && parseInt(classesInput) > 0) {
          itemText += ` (يحتاج ${parseInt(classesInput)} حصص)`;
        }
        selectedItems.push(itemText);
      });
      
      if (selectedItems.length === 0) {
        window.HaelCore.toast('الرجاء تحديد موضوع واحد على الأقل من الفهرس', 'error'); return;
      }

      tocText = selectedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
      planTitle = `خطة فصلية: ${book.name}`;
    } else if (activeSource === 'text') {
      tocText = document.getElementById('spManualText').value.trim();
      if (!tocText) { window.HaelCore.toast('الرجاء إدخال قائمة المواضيع يدوياً', 'error'); return; }
    } else if (activeSource === 'image') {
      tocText = document.getElementById('spImageText').value.trim();
      if (!tocText) { window.HaelCore.toast('الرجاء التقاط الصورة واستخراج النص أولاً', 'error'); return; }
    }

    document.getElementById('semesterPlanModal').classList.remove('is-active');
    window.HaelCore.showOverlay('جاري دمج الدروس داخل الهيكل الزمني الدقيق...');

    let branchInstructions = "";
    if (subjectName === "اللغة العربية" && (grade.startsWith("10") || grade.startsWith("11") || grade.startsWith("12"))) {
        branchInstructions = `\n- ملاحظة (فروع المادة): تتكون من (نحو: حصتان)، (أدب ونصوص: حصتان)، (قراءة: حصة)، (تعبير: حصة). اكتب اسم الفرع قبل الدرس.`;
    } else if (subjectName === "الاجتماعيات (أساسي)") {
        branchInstructions = `\n- ملاحظة (فروع المادة): تتكون من (تاريخ: حصتان)، (جغرافيا: حصتان)، (وطنية: حصة). اكتب اسم الفرع قبل الدرس.`;
    } else if (subjectName === "التربية الإسلامية") {
        branchInstructions = `\n- ملاحظة (فروع المادة): تتكون من (حديث: حصة)، (فقه: حصة)، (سيرة: حصة)، (إيمان: حصة). اكتب اسم الفرع قبل الدرس.`;
    } else if (subjectName === "القرآن الكريم") {
        branchInstructions = `\n- ملاحظة (فروع المادة): تتكون من (حفظ وتفسير) و(تجويد). وزع النصيب الأكبر للحفظ والتفسير واكتب الفرع قبل الدرس.`;
    }

    const englishInstructions = subjectName === "اللغة الإنجليزية" 
        ? "\n- **تنبيه صارم جداً:** المادة إنجليزية، املأ كافة البيانات باللغة الإنجليزية حصراً.\n- في عمود (Assessment)، اذكر 3 أنواع مختلفة على الأقل."
        : "\n- في عمود أساليب القياس والتقويم، اذكر أكثر من أسلوب في كل أسبوع.";

    // 🌟 الـ Prompt: يجبر الذكاء الاصطناعي على الالتزام بالهيكل الزمني الدقيق المحسوب برمجياً 🌟
    const prompt = `أنت خبير وتوجيه تربوي يمني. 
مهمتك الوحيدة هي ملء بيانات الدروس داخل هذا الهيكل الجاهز (JSON) الذي قمت ببرمجته مسبقاً بناءً على قفزات زمنية أسبوعية دقيقة.
يمنع منعاً باتاً إضافة، حذف، أو تعديل أي شهر أو أسبوع من الهيكل. فقط استبدل الجملة "[سيتم تعبئته آلياً]" بالبيانات التعليمية المناسبة.

معلومات المادة:
- المادة: ${subjectName}
- الفهرس المطلوب توزيعه:
${tocText}

قواعد التعبئة:
1. وزّع الموضوعات الموجودة في الفهرس بشكل منطقي ومتوازن على الأسابيع المتاحة.${branchInstructions}
2. إذا كان الموضوع يحتوي على عبارة "(يحتاج X حصص)"، خذ ذلك بعين الاعتبار.
3. في الأسبوع الأخير من كل شهر، اختم المنهج بـ "مراجعة واختبار شهري وشفوي وواجبات".${englishInstructions}
4. الخطة يجب أن تغطي كل المواضيع المحددة.
5.الأسبوع الأخير من الفصل الدراسي يخصص للمراجعة واختبار الشهر واختبار شفوي وواجبات والتهيئة لاختبارات نهاية الفصل.
الهيكل الزمني الإلزامي (قم بإرجاع نفس هذا الـ JSON بعد تعبئته ولا تنقص أو تزد عليه أي أسبوع):
${skeletonString}`;

    try {
      let aiModel = 'gemini-3.5-flash';
      try {
        const storedSettings = localStorage.getItem('haael_settings_v2');
        if (storedSettings && storedSettings.trim().startsWith('{')) { aiModel = JSON.parse(storedSettings).defaultModel || aiModel; }
      } catch(e) {}

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      let res;
      try {
        res = await fetch(url, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: "You are a JSON formatter. Only return the completed JSON matching the provided skeleton exactly without adding or removing elements." }] },
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema: SEMESTER_PLAN_SCHEMA }
          })
        });
      } catch(netErr) { throw new Error("تعذر الاتصال بالخادم."); }
      
      let data;
      try { data = await res.json(); } catch(jsonErr) { throw new Error("تنسيق غير صالح من الخادم."); }
      if (!res.ok) throw new Error(data.error?.message || 'خطأ في الاتصال بالذكاء الاصطناعي');

      const responseText = (data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
      let cleanJsonText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      let planJson;
      
      try { planJson = JSON.parse(cleanJsonText); } 
      catch(parseErr) { throw new Error("تنسيق البيانات المرتجعة غير صالح أو غير مكتمل."); }

      const htmlOutput = renderSemesterTable(planJson, planTitle, semester, subjectName);
      const rec = {
        kind: 'plan', isDoc: true, title: planTitle, subject: subjectName, grade: grade, section: '',
        language: 'ar', sourceType: activeSource, extractedText: tocText, docHtml: htmlOutput,
        createdAt: Date.now(), updatedAt: Date.now()
      };

      rec.id = await window.HaelCore.dbAdd('lessons', rec); 
      window.HaelCore.hideOverlay();
      
      if (window.HaelActions && window.HaelActions.openArchiveRecord) {
          await window.HaelActions.openArchiveRecord(rec.id);
          window.HaelCore.toast('تم بناء الخطة الفصلية بنجاح! 📅', 'success');
      } else {
          window.HaelCore.toast('تم حفظ الخطة في الأرشيف بنجاح! افتحها من هناك.', 'success');
      }
    } catch (err) {
      window.HaelCore.hideOverlay();
      window.HaelCore.toast('حدث خطأ: ' + err.message, 'error');
    }
  }

  // 6. محرك رسم الجدول الوزاري (مع الترجمة وعكس الاتجاه للمادة الإنجليزية)
  function renderSemesterTable(planJson, bookName, semester, subjectName) {
    const getSet = key => {
      try { 
          const st = localStorage.getItem('haael_settings_v2');
          if(st && st.trim().startsWith('{')) return JSON.parse(st)[key] || '...........'; 
      } catch(e) {}
      return '...........';
    };
    
    const teacher = getSet('teacher');
    const school = getSet('school');
    const directorate = getSet('directorate');
    
    // 💡 الترجمة وتحديد الاتجاه (LTR/RTL) بناءً على المادة
    const isEnglish = subjectName === "اللغة الإنجليزية";
    const textDir = isEnglish ? "ltr" : "rtl";
    const textAlign = isEnglish ? "left" : "right";

    const t = {
        min: isEnglish ? "Ministry of Education and Scientific Research" : "وزارة التربية والتعليم والبحث العلمي",
        sec: isEnglish ? "Curricula & Supervision Sector" : "قطاع المناهج وتخطيط التعليم",
        dir: isEnglish ? "General Directorate of Educational Supervision" : "الإدارة العامة للتوجيه التربوي",
        gov: isEnglish ? "Education Office in Governorate: " : "مكتب التربية بمحافظة: ",
        dist: isEnglish ? "Education Office in District: " : "مكتب التربية بمديرية: ",
        title: isEnglish ? "Semester Study Plan" : "خطة دراسية للفصل الدراسي",
        subj: isEnglish ? "Subject: " : "لمادة: ",
        teacher: isEnglish ? "Teacher: " : "اسم المعلم / ة : ",
        school: isEnglish ? "School: " : "اسم المدرسة : ",
        month: isEnglish ? "Month" : "الشهر",
        week: isEnglish ? "Week" : "الأسبوع",
        days: isEnglish ? "Days" : "عدد الأيام",
        classes: isEnglish ? "Classes" : "عدد الحصص",
        topics: isEnglish ? "Topics (Syllabus)" : "المفردات الدراسية",
        obj: isEnglish ? "Objectives" : "الأهداف",
        strat: isEnglish ? "Teaching Strategies" : "استراتيجيات التدريس",
        res: isEnglish ? "Resources" : "الوسائل",
        act: isEnglish ? "Activities" : "الأنشطة",
        in: isEnglish ? "In-class" : "صفية",
        out: isEnglish ? "Out-class" : "لا صفية",
        assess: isEnglish ? "Assessment Methods" : "أساليب القياس والتقويم",
        logo: isEnglish ? "Republic Logo" : "شعار الجمهورية",
        semName: isEnglish ? (semester === "الأول" ? "First" : "Second") : semester
    };

    let fullHtml = `
    <style>
      .semester-page { direction: ${textDir}; font-family: 'Amiri', serif; background: #fff; padding: 20px; margin-bottom: 20px; page-break-after: always; }
      
      .semester-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 13px; font-weight: bold; color: #333; text-align: ${textAlign}; }
      .semester-header .center-part { text-align: center; }
      .semester-header h2 { margin: 5px 0; font-size: 18px; color: #1f2937; }
      .semester-header .dashed-line { border-bottom: 1px dashed #666; display: inline-block; min-width: 120px; text-align: center; }
      .semester-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; }
      .semester-table th, .semester-table td { border: 1px solid #64748b; padding: 8px; }
      .semester-table thead { background-color: #f1f5f9; }
      .semester-table th { font-weight: 900; color: #1e293b; font-family: 'Amiri', serif; font-size: 16px; }
      .col-month { background-color: #f59e0b; color: white; width: 40px; font-weight: 900; font-size: 16px; }
      .col-week { background-color: #ffedd5; width: 45px; font-weight: bold; }
      .col-numbers { background-color: #e0f2fe; width: 45px; }
      .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); margin: auto; }
      .eng-cell { text-align: ${textAlign} !important; direction: ${textDir} !important; }
    </style>
    `;

    planJson.months.forEach((month) => {
      let tbodyHtml = '';
      month.weeks.forEach((w, index) => {
        tbodyHtml += `<tr>`;
        if (index === 0) {
          tbodyHtml += `<td class="col-month" rowspan="${month.weeks.length}"><div class="vertical-text">${month.monthName}</div></td>`;
        }
        tbodyHtml += `
          <td class="col-week">${w.weekNum}</td>
          <td class="col-numbers">${w.daysCount}</td>
          <td class="col-numbers">${w.classesCount}</td>
          <td class="eng-cell" style="font-weight: bold; color: #0f172a;">${w.topics}</td>
          <td class="eng-cell" style="color: #334155;">${w.objectives}</td>
          <td class="eng-cell" style="color: #475569;">${w.strategies}</td>
          <td class="eng-cell" style="color: #475569;">${w.resources}</td>
          <td class="eng-cell" style="color: #475569;">${w.activitiesIn}</td>
          <td class="eng-cell" style="color: #475569;">${w.activitiesOut}</td>
          <td class="eng-cell" style="background-color: #e0f2fe; font-weight: bold; color: #0369a1;">${w.assessment}</td>
        </tr>`;
      });

      fullHtml += `
      <div class="semester-page">
        <div class="semester-header">
          <div style="line-height: 1.8;">${t.min}<br>${t.sec}<br>${t.dir}<br>${t.gov} <span class="dashed-line">............</span><br>${t.dist} <span class="dashed-line">${directorate}</span></div>
          <div class="center-part"><div style="width:60px; height:60px; border:2px solid #ccc; border-radius:50%; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; color:#999; font-size:10px;">${t.logo}</div><h2>${t.title} <span class="dashed-line">${t.semName}</span></h2><div>${t.subj} <span class="dashed-line" style="font-weight:900; color:#4f46e5;">${subjectName}</span></div></div>
          <div style="line-height: 2;">${t.teacher} <span class="dashed-line">${teacher}</span><br>${t.school} <span class="dashed-line">${school}</span></div>
        </div>
        <table class="semester-table">
          <thead>
            <tr><th rowspan="2" class="col-month"><div class="vertical-text">${t.month}</div></th><th rowspan="2" class="col-week"><div class="vertical-text">${t.week}</div></th><th rowspan="2" class="col-numbers"><div class="vertical-text">${t.days}</div></th><th rowspan="2" class="col-numbers"><div class="vertical-text">${t.classes}</div></th><th rowspan="2" style="width: 20%;">${t.topics}</th><th rowspan="2" style="width: 20%;">${t.obj}</th><th rowspan="2">${t.strat}</th><th rowspan="2">${t.res}</th><th colspan="2">${t.act}</th><th rowspan="2" style="background-color: #e0f2fe; width: 12%;">${t.assess}</th></tr>
            <tr><th>${t.in}</th><th>${t.out}</th></tr>
          </thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>`;
    });
    return fullHtml;
  }
})();