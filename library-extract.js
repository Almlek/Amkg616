/* ═══════════════════════════════════════════════════════
   library-extract.js — معالجة كتب المكتبة والطيار الآلي (إصدار القراءة البصرية المباشرة ص2-ص9)
   ═══════════════════════════════════════════════════════ */
   (function () {
    'use strict';
    function core() { return window.HaelCore; }
  
    /* ───────────────────────── كاش دائم لكل صفحة ───────────────────────── */
    function getCachedPage(book, pageNum) {
      return book.pageCache && book.pageCache[pageNum] ? book.pageCache[pageNum] : null;
    }
    async function setCachedPage(book, pageNum, text) {
      book.pageCache = book.pageCache || {};
      book.pageCache[pageNum] = text || '';
      try { await core().dbPut(core().BOOKS_STORE, book); } catch (e) {}
    }
  
    async function loadPdfDoc(book) {
    await core().ensurePdfJs();
    
    // 1. معالجة حالة النسخة الاحتياطية (الفهرس بدون ملف)
    if (!book.data) {
        throw new Error('هذا الكتاب مستورد من نسخة احتياطية (فهرس فقط). يرجى حذفه وإعادة رفع ملف الـ PDF الأصلي لتتمكن من استخراج الدروس منه.');
    }

    // 2. الفحص الذكي والشامل للتأكد من نوع الملف (يحل مشكلة الهواتف المتمردة)
    const isBlob = book.data instanceof Blob || (book.data && typeof book.data.size === 'number' && typeof book.data.slice === 'function');
    
    if (isBlob) {
      const url = URL.createObjectURL(book.data);
      const pdf = await pdfjsLib.getDocument(url).promise;
      return { pdf, revoke: () => URL.revokeObjectURL(url) };
    }
    
    // 3. طريقة القراءة كـ ArrayBuffer (الطريقة البديلة)
    const pdf = await pdfjsLib.getDocument({ data: book.data }).promise;
    return { pdf, revoke: () => {} };
  }
    async function extractRangeWithCache(book, fromPage, toPage, onProgress) {
      const { pdf, revoke } = await loadPdfDoc(book);
      try {
        const total = Math.min(toPage, pdf.numPages);
        let combined = '';
        let ocrCount = 0;
        for (let p = fromPage; p <= total; p++) {
          let text = getCachedPage(book, p);
          let fromCache = !!text;
          if (!fromCache) {
            if (ocrCount > 0) await new Promise(r => setTimeout(r, 3500));
            if (onProgress) onProgress({ page: p, from: fromPage, to: total, status: 'ocr' });
            try { text = await core().ocrPdfPageToText(pdf, p); } catch (e) { text = ''; }
            await setCachedPage(book, p, text);
            ocrCount++;
          } else if (onProgress) {
            onProgress({ page: p, from: fromPage, to: total, status: 'cached' });
          }
          combined += (text || '') + '\n\n';
        }
        return combined.trim();
      } finally { revoke(); }
    }
  
    /* ───────────────────────── الذكاء الآلي: القراءة المباشرة من ص2 إلى 9 ───────────────────────── */
    async function autoDetectTocAndOffset(pdf, onProgress) {
      let tocPage = -1;
      let offset = 0;
  
      const maxScan = Math.min(9, pdf.numPages); // كحد أقصى الصفحة 9
      
      // 1. مسح الصفحات كصور بالذكاء الاصطناعي مباشرة للبحث عن الفهرس
      for (let i = 2; i <= maxScan; i++) {
        if (onProgress) onProgress(`يقرأ الصفحة ${i} بالذكاء الاصطناعي للبحث عن الفهرس...`);
        
        let text = '';
        try {
          if (i > 2) await new Promise(r => setTimeout(r, 3500)); // تأخير الأمان لجوجل بين الصفحات
          text = await core().ocrPdfPageToText(pdf, i);
        } catch(e) {
          continue; // في حال فشل قراءة صفحة معينة، نستمر للتي تليها
        }
        
        const lowerText = text.toLowerCase();
        // التحقق من الكلمات المفتاحية باللغتين
        if (lowerText.includes('فهرس') || lowerText.includes('محتويات') || lowerText.includes('content') || lowerText.includes('contents')) {
          tocPage = i;
          if (onProgress) onProgress(`✅ وجدنا الفهرس في الصفحة ${i}!`);
          break; // نتوقف عن البحث بمجرد إيجاده
        }
      }
  
      // 2. حساب الإزاحة (البحث عن أول رقم مطبوع لمعايرة الصفحات)
      if (tocPage !== -1) {
        if (onProgress) onProgress(`جاري معايرة أرقام الصفحات وحساب الإزاحة...`);
        await new Promise(r => setTimeout(r, 3500)); // تأخير قبل الطلب التالي
        try {
          // نقرأ الصفحة التي تلي الفهرس مباشرة (غالباً تحتوي على أول رقم مطبوع للكتاب)
          const checkPage = Math.min(tocPage + 1, pdf.numPages);
          const textNext = await core().ocrPdfPageToText(pdf, checkPage);
          
          // تحويل الأرقام العربية (١، ٢..) إلى إنجليزية لتسهيل استخراجها برمجياً
          let engText = textNext.replace(/[١٢٣٤٥٦٧٨٩٠]/g, function(d) {
             return d.charCodeAt(0) - 1632;
          });
          
          // استخراج جميع الأرقام من الصفحة
          const numbersStr = engText.match(/\b\d+\b/g);
          
          if (numbersStr && numbersStr.length > 0) {
              // نبحث عن أرقام صغيرة منطقية (أكبر من 0 وأصغر أو تساوي 25)
              const validNumbers = numbersStr.map(Number).filter(n => n > 0 && n <= 25);
              if (validNumbers.length > 0) {
                  // أصغر رقم في الصفحة غالباً هو رقمها المطبوع بالأسفل
                  const printedPageNum = Math.min(...validNumbers);
                  offset = checkPage - printedPageNum;
                  if (onProgress) onProgress(`✅ تم حساب الإزاحة بنجاح: ${offset} صفحات`);
              }
          }
        } catch (e) {
            // في حال فشل حساب الإزاحة، نتابع الاستخراج بدون إزاحة (0)
        }
      }
  
      return { tocPage, offset };
    }
  
    async function extractTocAuto(book, tocPageNum, offsetPages) {
      const { pdf, revoke } = await loadPdfDoc(book);
      try {
        const parts = [];
        // نأخذ صورة للصفحة المستهدفة للفهرس والتي تليها
        for (let i = tocPageNum; i <= Math.min(tocPageNum + 1, pdf.numPages); i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;
            const b64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
            canvas.width = canvas.height = 0;
        }
  
        parts.push({ text: 'أنت مساعد ذكي. هذه صور لفهرس كتاب. استخرج عناوين المواضيع وأرقام صفحاتها. أعد مصفوفة JSON فقط بالشكل التالي: [{"title":"اسم الموضوع", "page": رقم_الصفحة}]. لا تكتب أي نص خارج مصفوفة JSON أبداً.' });
  
        const apiKey = core().getApiKey();
        let aiModel = 'gemini-3.5-flash';
        try {
            const st = localStorage.getItem('haael_settings_v2');
            if (st) aiModel = JSON.parse(st).defaultModel || aiModel;
        } catch(e) {}

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        const res = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'مشكلة في الاتصال بمزود الذكاء الاصطناعي');

        const raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
        let list;
        try {
            list = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/^```/,'').trim());
        } catch(e) {
            const match = raw.match(/\[[\s\S]*\]/);
            if (match) list = JSON.parse(match[0]);
            else throw new Error("الذكاء الاصطناعي لم يجد فهرساً في هذه الصفحة.");
        }
        
        // تطبيق معادلة الإزاحة الآلية
        const finalToc = list.map((item, i) => {
            const actualStart = parseInt(item.page) + offsetPages;
            const nextItem = list[i+1];
            const actualEnd = nextItem ? (parseInt(nextItem.page) + offsetPages - 1) : actualStart + 3;
            return { title: item.title, page: actualStart, endPage: actualEnd };
        }).filter(x => x.title && x.page > 0);
  
        return finalToc;
      } finally { revoke(); }
    }
  
    /* ───────────────────────── واجهة الاستخراج والمراجعة الدفعية ───────────────────────── */
    let stylesInjected = false;
    function injectStyles() {
      if (stylesInjected) return;
      stylesInjected = true;
      const css = `
      .lex-row{display:flex;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid #eee;font-size:13px}
      .lex-row.lex-dim{opacity:.55}
      .lex-row input[type=text]{flex:1;border:1px solid #eee;border-radius:8px;padding:6px 8px;font-size:13px;font-family:inherit;background:#FAF5FF;color:#1E1B4B}
      .lex-row input[type=number]{width:56px;border:1px solid #eee;border-radius:8px;padding:6px 4px;font-size:13px;text-align:center;background:#FAF5FF;color:#1E1B4B}
      .lex-badge{font-size:11px;padding:2px 7px;border-radius:20px;white-space:nowrap;font-weight:700}
      .lex-badge.dup{background:#FEF3C7;color:#92400E}
      .lex-status{font-size:13.5px;color:#6b7280;padding:6px 4px;min-height:18px; line-height: 1.6;}
      .lex-actions{display:flex;gap:8px;padding:12px 4px 4px;border-top:1px solid #eee;margin-top:8px}
      .lex-btn{flex:1;padding:11px;border-radius:10px;border:none;font-weight:800;font-size:14px;cursor:pointer}
      .lex-btn.primary{background:#7C3AED;color:#fff}
      .lex-btn.ghost{background:#EDE9FE;color:#6D28D9}
      .lex-field{margin-bottom:10px}
      .lex-field label{display:block;font-size:12.5px;font-weight:700;color:#6b7280;margin-bottom:4px}
      .lex-field input{width:100%;border:1px solid #eee;border-radius:8px;padding:9px 10px;font-size:14px;background:#FAF5FF;color:#1E1B4B}
      .lex-progressbar{height:8px;border-radius:4px;background:#eee;overflow:hidden;margin:8px 0}
      .lex-progressbar > div{height:100%;background:#7C3AED;width:0%;transition:width .25s}
      `.trim();
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  
    function buildModalShell(titleText) {
      injectStyles();
      const bg = document.createElement('div');
      bg.className = 'modal-bg is-active';
      bg.innerHTML = `
        <div class="modal-card">
          <div class="modal-hdr">
            <strong>${titleText}</strong>
            <button class="modal-close" type="button">✕</button>
          </div>
          <div class="modal-body"></div>
        </div>`;
      document.body.appendChild(bg);
      const destroy = () => bg.remove();
      bg.querySelector('.modal-close').addEventListener('click', destroy);
      return { bg, body: bg.querySelector('.modal-body'), destroy };
    }
  
    async function openTocReviewModal(bookId, grade) {
      const book = await core().dbGetAll(core().BOOKS_STORE).then(books => books.find(b => b.id === bookId));
      if (!book) { core().toast('الكتاب غير موجود', 'error'); return; }
  
      const { bg, body, destroy } = buildModalShell('🚀 الاستخراج الذكي الشامل');
      
      // إذا لم يكن الفهرس مستخرجاً
      if (!book.toc || !book.toc.length) {
          body.innerHTML = `<div class="lex-status" style="text-align:center; padding: 30px 10px;">
              <div style="font-size: 40px; margin-bottom: 15px;">🤖</div>
              <strong style="color:#7C3AED; font-size:16px;">جاري فحص الكتاب وقراءته بالذكاء الاصطناعي...</strong>
              <p id="autoPilotDesc" style="margin-top:10px; font-weight:bold; color:#d97706;">نبدأ من الصفحة 2</p>
          </div>`;
          
          let tocPage = -1;
          let offset = 0;
          const descEl = body.querySelector('#autoPilotDesc');

          try {
              const { pdf, revoke } = await loadPdfDoc(book);
              
              // استدعاء دالة الطيار الآلي الجديدة التي تقرأ الصفحات بالـ OCR
              const detectInfo = await autoDetectTocAndOffset(pdf, (msg) => {
                  if(descEl) descEl.textContent = msg;
              });
              revoke();

              tocPage = detectInfo.tocPage;
              offset = detectInfo.offset;

              // إذا لم يجد الفهرس من ص2 إلى ص9، نطلب المساعدة اليدوية بهدوء كحل احتياطي
              if (tocPage === -1) {
                  body.innerHTML = `
                  <div class="lex-status" style="text-align:center; padding: 20px 10px;">
                      <div style="font-size: 40px; margin-bottom: 10px;">📸</div>
                      <strong style="color:#d97706; font-size:16px;">لم نعثر على الفهرس في أول 9 صفحات</strong>
                      <p style="margin-top:5px; margin-bottom: 15px;">ربما يكون الفهرس في صفحة أعمق. أرجو تحديده يدوياً.</p>
                      <div class="lex-field" style="text-align:right;"><label>رقم صفحة الفهرس (حسب المتصفح):</label><input type="number" id="manualTocPage" value="10" min="1"></div>
                      <div class="lex-field" style="text-align:right;"><label>الإزاحة (الصفحات الفائتة قبل صفحة 1 المطبوعة):</label><input type="number" id="manualOffset" value="0" min="0"></div>
                      <button class="lex-btn primary" id="btnContinueAuto" style="width:100%; margin-top:10px;">متابعة الاستخراج الآلي 🚀</button>
                  </div>`;

                  await new Promise(resolve => {
                      body.querySelector('#btnContinueAuto').addEventListener('click', () => {
                          tocPage = parseInt(body.querySelector('#manualTocPage').value) || 2;
                          offset = parseInt(body.querySelector('#manualOffset').value) || 0;
                          resolve();
                      });
                  });
              }

              body.innerHTML = `<div class="lex-status" style="text-align:center; padding: 30px 10px;">
                  <strong style="color:#10b981; font-size:16px;">جاري تجهيز وبناء الفهرس من الصورة...</strong>
              </div>`;
              
              // إرسال صفحة الفهرس لاستخراج جدول الدروس
              const newToc = await extractTocAuto(book, tocPage, offset);
              book.toc = newToc;
              await core().dbPut(core().BOOKS_STORE, book);
          } catch(e) {
              destroy(); core().toast('خطأ: ' + e.message, 'error'); return;
          }
      }
  
      // رسم الفهرس للمراجعة النهائية
      const bankItems = await core().dbGetAll(core().EXTRACTS_STORE);
      const dupChecks = book.toc.map(t => !!core().fuzzyFindOne(t.title, bankItems, r => r.title).item);
  
      const rowsHtml = book.toc.map((t, i) => `
        <div class="lex-row ${dupChecks[i] ? 'lex-dim' : ''}">
          <input type="checkbox" class="lexRowChk" ${dupChecks[i] ? '' : 'checked'}>
          <input type="text" class="lexRowTitle" value="${(t.title || '').replace(/"/g, '&quot;')}">
          <input type="number" class="lexRowFrom" value="${t.page}" min="1">
          <input type="number" class="lexRowTo" value="${t.endPage || t.page}" min="1">
          ${dupChecks[i] ? '<span class="lex-badge dup">بالمكتبة</span>' : ''}
        </div>`).join('');
  
      body.innerHTML = `
        <div class="lex-status"><strong>📖 ${book.name}</strong><br>تم ضبط الإزاحة آلياً. الدروس المحددة سيتم استخراجها وحفظها في "دروس واختبارات" بالترتيب.</div>
        <div class="lex-field"><label>الصف (يُحفظ مع الدروس)</label><input type="text" id="lexGradeInput" value="${(grade || '')}"></div>
        <div id="lexRowsWrap" style="max-height: 250px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px;">${rowsHtml}</div>
        <div class="lex-progressbar" id="lexProgWrap" style="display:none"><div id="lexProgFill"></div></div>
        <div class="lex-status" id="lexStatusText" style="font-weight:bold; color:#7C3AED;"></div>
        <div class="lex-actions">
          <button class="lex-btn ghost" id="lexCancelBtn" type="button">إلغاء</button>
          <button class="lex-btn primary" id="lexConfirmBtn" type="button">🚀 بدء الاستخراج الشامل</button>
        </div>`;
  
      let stopRequested = false;
      body.querySelector('#lexCancelBtn').addEventListener('click', () => {
        if (body.querySelector('#lexConfirmBtn').disabled) { stopRequested = true; return; }
        destroy();
      });
  
      body.querySelector('#lexConfirmBtn').addEventListener('click', async () => {
        const gradeVal = body.querySelector('#lexGradeInput').value.trim();
        const rows = Array.from(body.querySelectorAll('.lex-row')).filter(r => r.querySelector('.lexRowChk').checked);
        
        if (!rows.length) { core().toast('حدد درساً واحداً على الأقل', 'error'); return; }
  
        body.querySelector('#lexConfirmBtn').disabled = true; 
        body.querySelector('#lexCancelBtn').textContent = 'إيقاف الاستخراج';
        
        const progFill = body.querySelector('#lexProgFill');
        const statusText = body.querySelector('#lexStatusText');
        body.querySelector('#lexProgWrap').style.display = 'block';
  
        let savedCount = 0;
  
        for (let i = 0; i < rows.length; i++) {
          if (stopRequested) break;
          const row = rows[i];
          const title = row.querySelector('.lexRowTitle').value.trim();
          const from = parseInt(row.querySelector('.lexRowFrom').value) || 1;
          const to = parseInt(row.querySelector('.lexRowTo').value) || from;
  
          statusText.textContent = `جاري استخراج: ${title} (${i + 1}/${rows.length})...`;
          progFill.style.width = Math.round((i / rows.length) * 100) + '%';
  
          try {
            const content = await extractRangeWithCache(book, from, to, (p) => {
              statusText.textContent = `${title} — يقرأ ص ${p.page} ${p.status === 'cached' ? '(من الذاكرة)' : '(ذكاء اصطناعي)'}`;
            });
            if (content) {
                await core().dbAdd(core().EXTRACTS_STORE, {
                    title, grade: gradeVal, content, bookName: book.name, sourceType: 'library', savedAt: Date.now()
                });
                savedCount++;
            }
          } catch (e) {}
        }
  
        progFill.style.width = '100%';
        statusText.textContent = `✅ اكتملت المهمة: تم حفظ ${savedCount} درس.`;
        core().toast(`تم حفظ ${savedCount} درس في البنك بنجاح`, 'success');
        
        setTimeout(() => { destroy(); core().refreshLibraryList(); }, 2000);
      });
    }
  
    window.LibraryExtract = { openTocReviewModal };
  })();

