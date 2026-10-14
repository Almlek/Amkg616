/* ═══════════════════════════════════════════
   الذكي v3.0 — cloud.js (وحدة السحابة والمجتمع)
   مكون مستقل (Standalone Component)
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // 1. مفاتيح الربط مع Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyC5_4pBbdy-PzJSAyT57_qaMMUY95-BQyk",
    authDomain: "society-alhayel.firebaseapp.com",
    databaseURL: "https://society-alhayel-default-rtdb.firebaseio.com",
    projectId: "society-alhayel",
    storageBucket: "society-alhayel.firebasestorage.app",
    messagingSenderId: "838592542998",
    appId: "1:838592542998:web:582a928540fd1aa7923837"
  };

  let dbCloud;

   window.addEventListener('DOMContentLoaded', () => {
    try {
      // 🌟 حل التعارض: فتح اتصال منفصل باسم مخصص (SocietyCloud) لعدم التضارب مع بيانات الطلاب 🌟
      let societyApp;
      if (firebase.apps.some(app => app.name === "SocietyCloud")) {
          societyApp = firebase.app("SocietyCloud");
      } else {
          societyApp = firebase.initializeApp(firebaseConfig, "SocietyCloud");
      }
      dbCloud = societyApp.firestore();
      console.log("☁️ تم الاتصال بسحابة الذكي بنجاح");
    } catch(e) { console.error("Firebase Init Error:", e); }

    injectCloudModals();
  });


  // قوائم الخيارات الموحدة
  const gradesOptions = `
    <option value="">اختر الصف...</option>
    <optgroup label="المرحلة الأساسية">
      <option value="الأول الأساسي">الأول الأساسي</option><option value="الثاني الأساسي">الثاني الأساسي</option>
      <option value="الثالث الأساسي">الثالث الأساسي</option><option value="الرابع الأساسي">الرابع الأساسي</option>
      <option value="الخامس الأساسي">الخامس الأساسي</option><option value="السادس الأساسي">السادس الأساسي</option>
      <option value="السابع الأساسي">السابع الأساسي</option><option value="الثامن الأساسي">الثامن الأساسي</option>
      <option value="التاسع الأساسي">التاسع الأساسي</option>
    </optgroup>
    <optgroup label="المرحلة الثانوية">
      <option value="أول ثانوي">أول ثانوي</option><option value="ثاني ثانوي - علمي">ثاني ثانوي - علمي</option>
      <option value="ثاني ثانوي - أدبي">ثاني ثانوي - أدبي</option><option value="ثالث ثانوي - علمي">ثالث ثانوي - علمي</option>
      <option value="ثالث ثانوي - أدبي">ثالث ثانوي - أدبي</option>
    </optgroup>
    <option value="أخرى">أخرى...</option>
  `;

  const subjectsOptions = `
    <option value="">اختر المادة...</option>
    <option value="القرآن الكريم">القرآن الكريم</option><option value="التربية الإسلامية">التربية الإسلامية</option>
    <option value="اللغة العربية">اللغة العربية</option><option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
    <option value="الرياضيات">الرياضيات</option><option value="العلوم">العلوم</option>
    <option value="الفيزياء">الفيزياء</option><option value="الكيمياء">الكيمياء</option>
    <option value="الأحياء">الأحياء</option><option value="التأريخ">التأريخ</option>
    <option value="الجغرافيا">الجغرافيا</option><option value="التربية الوطنية">التربية الوطنية</option>
    <option value="الحاسوب">الحاسوب</option>
    <option value="أخرى">أخرى...</option>
  `;

  const semesterOptions = `
    <option value="">اختر الفصل الدراسي...</option>
    <option value="الفصل الأول">الفصل الدراسي الأول</option>
    <option value="الفصل الثاني">الفصل الدراسي الثاني</option>
  `;

  function injectCloudModals() {
    // === نافذة البحث والتنزيل الجماعي ===
    if (!document.getElementById('cloudModal')) {
      const searchModalHtml = `
      <div class="modal-bg" id="cloudModal">
        <div class="modal-card" style="max-width: 600px; padding: 20px; text-align: center; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-bottom: 5px; font-size: 22px; font-weight: 900;">☁️ مجتمع الذكي السحابي</h2>
          <p style="color: #64748b; font-size: 13px; font-weight: bold; margin-bottom: 15px;">استعرض الدروس المتاحة حسب المادة والصف أو ابحث يدوياً</p>
          
          <!-- 📊 الإحصائيات السريعة -->
          <div style="text-align: right; margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 900; color: #475569;">📊 الدروس المتوفرة في السحابة حالياً (اضغط للتصفح السريع):</span>
          </div>
          <div id="cloudStatsContainer" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; max-height: 120px; overflow-y: auto; padding: 10px; background: #f8fafc; border-radius: 12px; border: 1.5px dashed #cbd5e1; min-height: 48px; align-items: center; justify-content: center;">
            <span style="color: #94a3b8; font-size: 13px; font-weight: bold;">جاري قراءة إحصائيات السحابة...</span>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom: 15px;">
            <div style="flex:1; min-width:150px;">
              <select id="cloudGradeSelect" onchange="toggleCustomInput(this, 'cloudGradeCustom')" style="width:100%; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold; color:#334155;">${gradesOptions}</select>
              <input type="text" id="cloudGradeCustom" placeholder="اكتب الصف هنا..." style="display:none; width:100%; margin-top:5px; padding:10px; border-radius:8px; border:2px solid #0ea5e9; font-family:inherit; box-sizing:border-box;">
            </div>
            
            <div style="flex:1; min-width:150px;">
              <select id="cloudSubjectSelect" onchange="toggleCustomInput(this, 'cloudSubjectCustom')" style="width:100%; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold; color:#334155;">${subjectsOptions}</select>
              <input type="text" id="cloudSubjectCustom" placeholder="اكتب المادة هنا..." style="display:none; width:100%; margin-top:5px; padding:10px; border-radius:8px; border:2px solid #0ea5e9; font-family:inherit; box-sizing:border-box;">
            </div>

            <div style="flex:1; min-width:100%;">
              <select id="cloudSemesterSelect" style="width:100%; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold; color:#334155;">${semesterOptions}</select>
            </div>
          </div>
          
          <button class="btn-primary" onclick="searchCloudExtracts()" style="width:100%; margin-bottom:15px; background:#0ea5e9; box-shadow:0 4px 10px rgba(14, 165, 233, 0.3); border:none; padding:12px; border-radius:8px; color:white; font-weight:bold; cursor:pointer;">🔍 بحث مخصص في السحابة</button>
          
          <div id="cloudResults" style="max-height: 320px; overflow-y: auto; text-align: right; background: #ffffff; border-radius: 12px; padding: 10px; border: 1.5px solid #e2e8f0;">
            <div style="text-align:center; padding:20px; color:#94a3b8; font-weight:bold;">اختر مادة وصفاً أو اضغط على إحدى البطاقات أعلاه</div>
          </div>
          
          <button class="btn-sm" onclick="document.getElementById('cloudModal').classList.remove('is-active')" style="margin-top:15px; width:100%; background:#e2e8f0; color:#475569; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">إغلاق</button>
        </div>
      </div>`;
      const div1 = document.createElement('div'); div1.innerHTML = searchModalHtml;
      document.body.appendChild(div1.firstElementChild);
    }

    // === نافذة تأكيد الرفع للسحابة (محدثة للرفع الجماعي) ===
    if (!document.getElementById('cloudUploadModal')) {
      const uploadModalHtml = `
      <div class="modal-bg" id="cloudUploadModal">
        <div class="modal-card" style="max-width: 500px; padding: 20px; text-align: center; border-radius: 16px;">
          <h2 style="color: #10b981; margin-bottom: 5px; font-size: 21px; font-weight: 900;">📤 مشاركة الدروس للسحابة</h2>
          <p style="color: #64748b; font-size: 13px; font-weight: bold; margin-bottom: 20px;">يرجى تصنيف الدروس بدقة لكي يجدها زملاؤك المعلمون بسهولة</p>
          
          <input type="hidden" id="upLocalIds"> <!-- حقل للرفع الجماعي -->
          
          <div id="upBulkStatus" style="background:#e0f2fe; color:#0369a1; padding:10px; border-radius:8px; font-weight:bold; margin-bottom:15px; font-size:14px;">
            جاري التحضير...
          </div>

          <div id="upTitleRow" style="display:none;">
            <input type="text" id="upTitle" placeholder="عنوان الدرس..." style="width:100%; margin-bottom:10px; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold; box-sizing:border-box;">
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom: 15px;">
            <div>
              <select id="upGradeSelect" onchange="toggleCustomInput(this, 'upGradeCustom')" style="width:100%; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold;">${gradesOptions}</select>
              <input type="text" id="upGradeCustom" placeholder="اكتب الصف هنا..." style="display:none; width:100%; margin-top:5px; padding:10px; border-radius:8px; border:2px solid #10b981; font-family:inherit; box-sizing:border-box;">
            </div>
            
            <div>
              <select id="upSubjectSelect" onchange="toggleCustomInput(this, 'upSubjectCustom')" style="width:100%; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold;">${subjectsOptions}</select>
              <input type="text" id="upSubjectCustom" placeholder="اكتب المادة هنا..." style="display:none; width:100%; margin-top:5px; padding:10px; border-radius:8px; border:2px solid #10b981; font-family:inherit; box-sizing:border-box;">
            </div>

            <div>
              <select id="upSemesterSelect" style="width:100%; padding:10px; border-radius:8px; border:2px solid #cbd5e1; font-family:inherit; font-weight:bold;">${semesterOptions}</select>
            </div>
          </div>
          
          <button class="btn-primary" onclick="confirmUploadToCloud()" style="width:100%; margin-bottom:10px; background:#10b981; border:none; padding:12px; border-radius:8px; color:white; font-weight:bold; cursor:pointer;">🚀 اعتماد ورفع للسحابة</button>
          <button class="btn-sm" onclick="document.getElementById('cloudUploadModal').classList.remove('is-active')" style="width:100%; background:#e2e8f0; color:#475569; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer;">إلغاء</button>
        </div>
      </div>`;
      const div2 = document.createElement('div'); div2.innerHTML = uploadModalHtml;
      document.body.appendChild(div2.firstElementChild);
    }
  }

  // 3. دالة إظهار/إخفاء الحقول المخصصة
  window.toggleCustomInput = function(selectEl, customInputId) {
    const customInput = document.getElementById(customInputId);
    if (selectEl.value === 'أخرى') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
      customInput.value = '';
    }
  };

  function getFinalValue(selectId, customId) {
    const sel = document.getElementById(selectId).value;
    if (sel === 'أخرى') return document.getElementById(customId).value.trim();
    return sel;
  }

  // 4. فتح نافذة السحابة وجلب إحصائيات الدروس المتوفرة
  window.openCloudModal = async function() {
    document.getElementById('cloudModal').classList.add('is-active');
    
    const resultsDiv = document.getElementById('cloudResults');
    if (resultsDiv) resultsDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8; font-weight:bold;">اختر مادة وصفاً أو اضغط على إحدى البطاقات أعلاه لبدء البحث</div>';

    const statsContainer = document.getElementById('cloudStatsContainer');
    if (!statsContainer) return;
    
    if (!dbCloud) {
      statsContainer.innerHTML = '<span style="color:#ef4444; font-size:12px; font-weight:bold;">السحابة غير متصلة حالياً</span>';
      return;
    }

    statsContainer.innerHTML = '<span style="color:#0ea5e9; font-size:12px; font-weight:bold;">⏳ جاري جلب الإحصائيات...</span>';

    try {
      const statsDoc = await dbCloud.collection('cloud_stats').doc('summary').get();
      if (!statsDoc.exists || !statsDoc.data() || Object.keys(statsDoc.data()).length === 0) {
        statsContainer.innerHTML = '<span style="color:#64748b; font-size:12px; font-weight:bold;">لا توجد دروس مسجلة في الإحصائيات حتى الآن.</span>';
        return;
      }

      const data = statsDoc.data();
      let badgesHtml = '';

      // البيانات محفوظة بصيغة: "الصف___المادة___الفصل": العدد
      for (const [key, count] of Object.entries(data)) {
        if (count > 0) {
          const parts = key.split('___');
          if (parts.length === 3) {
            const [grade, subject, semester] = parts;
            badgesHtml += `
              <button type="button" onclick="quickCloudFilter('${window.haaelEsc(grade)}', '${window.haaelEsc(subject)}', '${window.haaelEsc(semester)}')" style="background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3; padding:5px 10px; border-radius:18px; font-weight:bold; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:0.2s; font-family:inherit;">
                <span>📚 ${window.haaelEsc(subject)} (${window.haaelEsc(grade)})</span>
                <span style="background:#4f46e5; color:white; border-radius:10px; padding:1px 6px; font-size:11px;">${count}</span>
              </button>
            `;
          }
        }
      }

      statsContainer.innerHTML = badgesHtml || '<span style="color:#64748b; font-size:12px; font-weight:bold;">لا توجد دروس مرفوعة حالياً.</span>';
    } catch(err) {
      console.error("Cloud stats load error:", err);
      statsContainer.innerHTML = '<span style="color:#94a3b8; font-size:12px;">استخدم البحث اليدوي أدناه.</span>';
    }
  };

  // دالة النقر على بطاقة إحصائية للتعبئة والبحث التلقائي
  window.quickCloudFilter = function(grade, subject, semester) {
    const gSelect = document.getElementById('cloudGradeSelect');
    const sSelect = document.getElementById('cloudSubjectSelect');
    const semSelect = document.getElementById('cloudSemesterSelect');

    if (gSelect) {
      if (Array.from(gSelect.options).some(o => o.value === grade)) { gSelect.value = grade; toggleCustomInput(gSelect, 'cloudGradeCustom'); }
      else { gSelect.value = 'أخرى'; toggleCustomInput(gSelect, 'cloudGradeCustom'); document.getElementById('cloudGradeCustom').value = grade; }
    }

    if (sSelect) {
      if (Array.from(sSelect.options).some(o => o.value === subject)) { sSelect.value = subject; toggleCustomInput(sSelect, 'cloudSubjectCustom'); }
      else { sSelect.value = 'أخرى'; toggleCustomInput(sSelect, 'cloudSubjectCustom'); document.getElementById('cloudSubjectCustom').value = subject; }
    }

    if (semSelect && semester) semSelect.value = semester;

    window.searchCloudExtracts();
  };

  // 5. دالة البحث في السحابة (مع التنزيل الجماعي)
  window.searchCloudExtracts = async function() {
    if(!dbCloud) { window.haaelToast('السحابة غير متصلة حالياً', 'error'); return; }
    
    const grade = getFinalValue('cloudGradeSelect', 'cloudGradeCustom');
    const subject = getFinalValue('cloudSubjectSelect', 'cloudSubjectCustom');
    const semester = document.getElementById('cloudSemesterSelect').value;

    if(!grade || !subject || !semester) { 
      window.haaelToast('يرجى تحديد (الصف، المادة، والفصل الدراسي)', 'error'); 
      return; 
    }

    const resultsDiv = document.getElementById('cloudResults');
    resultsDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#0ea5e9; font-weight:bold;">⏳ جاري البحث في السحابة...</div>';

    try {
      const snapshot = await dbCloud.collection('shared_extracts')
        .where('grade', '==', grade)
        .where('subject', '==', subject)
        .where('semester', '==', semester)
        .limit(50)
        .get();

      if(snapshot.empty) {
        resultsDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444; font-weight:bold;">لا توجد دروس متطابقة في السحابة حالياً. كن أول من يشارك درساً!</div>';
        return;
      }

      window.tempCloudData = [];
      snapshot.forEach(doc => { window.tempCloudData.push({ id: doc.id, ...doc.data() }); });

      window.tempCloudData.sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
        return timeB - timeA; 
      });

      // شريط التحديد المتعدد
      let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#e0f2fe; padding:10px; border-radius:8px; margin-bottom:12px; border:1px solid #bae6fd;">
        <label style="display:flex; align-items:center; gap:8px; font-weight:bold; color:#0369a1; cursor:pointer;">
          <input type="checkbox" id="chkAllCloud" onchange="toggleAllCloudExtracts(this)" style="width:16px; height:16px;">
          تحديد الكل
        </label>
        <button onclick="downloadSelectedCloudExtracts()" style="background:#0284c7; color:white; border:none; padding:6px 15px; border-radius:6px; font-weight:bold; cursor:pointer;">📥 تنزيل المحدد</button>
      </div>`;

      window.tempCloudData.forEach(data => {
        html += `
        <label style="display:flex; align-items:flex-start; gap:10px; background:white; border:1px solid #cbd5e1; padding:12px; border-radius:8px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.02); cursor:pointer; transition:0.2s;">
          <input type="checkbox" class="cloud-item-chk" value="${data.id}" style="width:18px; height:18px; margin-top:2px;">
          <div style="flex:1;">
            <div style="font-weight:900; color:#1e293b; font-size:15px;">📄 ${window.haaelEsc(data.title)}</div>
            <div style="font-size:11.5px; color:#64748b; margin-top:5px; font-weight:bold;">
              رفع بواسطة: أ. ${window.haaelEsc(data.uploader)} | ${window.haaelEsc(data.school || 'مدرسة غير محددة')}
            </div>
          </div>
        </label>`;
      });
      
      resultsDiv.innerHTML = html;
    } catch(e) {
      console.error(e);
      resultsDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444; font-weight:bold;">حدث خطأ. تأكد من أن معلومات البحث مطابقة.</div>';
    }
  };

  // 6. دوال التنزيل الجماعي
  window.toggleAllCloudExtracts = function(sourceCheckbox) {
    document.querySelectorAll('.cloud-item-chk').forEach(chk => {
      chk.checked = sourceCheckbox.checked;
    });
  };

  window.downloadSelectedCloudExtracts = async function() {
    const checkedBoxes = Array.from(document.querySelectorAll('.cloud-item-chk:checked'));
    if (checkedBoxes.length === 0) {
      window.haaelToast('يرجى تحديد درس واحد على الأقل للتنزيل', 'error');
      return;
    }

    window.haaelShowOverlay(`جاري تنزيل ${checkedBoxes.length} دروس...`);
    let downloadedCount = 0;
    let skippedCount = 0;

    try {
      const existing = await window.haaelDbGetAll(window.haaelExtractsStore);

      for (const chk of checkedBoxes) {
        const docData = window.tempCloudData.find(d => d.id === chk.value);
        if (!docData) continue;

        // منع التكرار
        const matched = existing.find(r => r.title === docData.title && r.grade === docData.grade && r.subject === docData.subject);
        if (matched) { skippedCount++; continue; }

        await window.haaelDbAdd(window.haaelExtractsStore, {
          title: docData.title,
          subject: docData.subject,
          grade: docData.grade,
          semester: docData.semester,
          content: docData.content,
          sourceType: 'cloud',
          savedAt: Date.now()
        });
        downloadedCount++;
      }

      window.haaelHideOverlay();
      if (downloadedCount > 0) {
        window.haaelToast(`تمت إضافة ${downloadedCount} درس بنجاح 📚`, 'success');
        if (typeof window.loadKnowledgeBank === 'function') window.loadKnowledgeBank();
      }
      if (skippedCount > 0) {
        window.haaelToast(`تم تخطي ${skippedCount} درس (موجودة مسبقاً)`, 'error');
      }

    } catch(e) {
      window.haaelHideOverlay();
      window.haaelToast('خطأ أثناء الحفظ في هاتفك', 'error');
    }
  };

  // 7. التهيئة للرفع الجماعي
  // تستقبل مصفوفة من أرقام الـ IDs للدروس المحددة في بنك الدروس
  window.prepareBulkUploadToCloud = async function(localIdsArray) {
    if(!dbCloud) { window.haaelToast('السحابة غير متصلة حالياً', 'error'); return; }
    if(!localIdsArray || localIdsArray.length === 0) { window.haaelToast('لم يتم تحديد أي دروس للرفع', 'error'); return; }

    document.getElementById('upLocalIds').value = JSON.stringify(localIdsArray);
    
    const count = localIdsArray.length;
    document.getElementById('upBulkStatus').innerHTML = `سيتم رفع <strong>${count}</strong> درس دفعة واحدة. حدد المادة والصف لها جميعاً.`;

    if (count === 1) {
        // رفع مفرد: نظهر حقل العنوان ونجلب البيانات القديمة
        document.getElementById('upTitleRow').style.display = 'block';
        const rec = await window.haaelDbGet(window.haaelExtractsStore, localIdsArray[0]);
        if(rec) {
            document.getElementById('upTitle').value = rec.title || '';
            setDropdownOrCustom('upGradeSelect', 'upGradeCustom', rec.grade);
            setDropdownOrCustom('upSubjectSelect', 'upSubjectCustom', rec.subject);
            if (rec.semester) document.getElementById('upSemesterSelect').value = rec.semester;
        }
    } else {
        // رفع جماعي: نخفي حقل العنوان (سيأخذ عنوان كل درس داخلياً)
        document.getElementById('upTitleRow').style.display = 'none';
        document.getElementById('upTitle').value = '';
    }

    document.getElementById('cloudUploadModal').classList.add('is-active');
  };

  function setDropdownOrCustom(selectId, customId, value) {
    if (!value) return;
    const sel = document.getElementById(selectId);
    if (Array.from(sel.options).some(o => o.value === value)) {
        sel.value = value;
    } else {
        sel.value = 'أخرى';
        window.toggleCustomInput(sel, customId);
        document.getElementById(customId).value = value;
    }
  }

  // 8. الرفع النهائي للسحابة (يدعم الرفع المفرد والجماعي وتحديث الإحصائيات)
  window.confirmUploadToCloud = async function() {
    const rawIds = document.getElementById('upLocalIds').value;
    if (!rawIds) return;
    const ids = JSON.parse(rawIds);

    const grade = getFinalValue('upGradeSelect', 'upGradeCustom');
    const subject = getFinalValue('upSubjectSelect', 'upSubjectCustom');
    const semester = document.getElementById('upSemesterSelect').value;

    if(!grade || !subject || !semester) {
      window.haaelToast('⚠️ يرجى تعبئة جميع الحقول (الصف، المادة، الفصل)', 'error');
      return;
    }

    const manualTitle = document.getElementById('upTitle').value.trim();
    if (ids.length === 1 && !manualTitle) {
      window.haaelToast('⚠️ يرجى تعبئة عنوان الدرس', 'error');
      return;
    }

    document.getElementById('cloudUploadModal').classList.remove('is-active');
    window.haaelShowOverlay(`جاري الرفع... (0 / ${ids.length})`);

    try {
      const batch = dbCloud.batch();
      let uploadCount = 0;

      for (let i = 0; i < ids.length; i++) {
        const rec = await window.haaelDbGet(window.haaelExtractsStore, ids[i]);
        if (!rec) continue;

        const titleToUse = ids.length === 1 ? manualTitle : rec.title;
        
        // منع التكرار السحابي
        const existCheck = await dbCloud.collection('shared_extracts')
          .where('grade', '==', grade)
          .where('subject', '==', subject)
          .where('semester', '==', semester)
          .where('title', '==', titleToUse)
          .get();

        if (existCheck.empty) {
            const docRef = dbCloud.collection('shared_extracts').doc();
            batch.set(docRef, {
                title: titleToUse,
                subject: subject,
                grade: grade,
                semester: semester,
                content: rec.content,
                uploader: window.haaelState.settings.teacher || 'فاعل خير',
                school: window.haaelState.settings.school || '',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            uploadCount++;
        }
        window.haaelShowOverlay(`جاري الرفع... (${i+1} / ${ids.length})`);
      }

      if (uploadCount > 0) {
          // تحديث الإحصائيات (العداد السحابي) بطريقة آمنة
          const statKey = `${grade}___${subject}___${semester}`;
          const statsRef = dbCloud.collection('cloud_stats').doc('summary');
          batch.set(statsRef, {
              [statKey]: firebase.firestore.FieldValue.increment(uploadCount)
          }, { merge: true });

          await batch.commit();
          window.haaelHideOverlay();
          window.haaelToast(`تم رفع ${uploadCount} دروس بنجاح! مجتمع الذكي يشكرك 🚀`, 'success');
      } else {
          window.haaelHideOverlay();
          window.haaelToast('جميع هذه الدروس متوفرة مسبقاً في السحابة!', 'success');
      }
      
    } catch(e) {
      window.haaelHideOverlay();
      console.error(e);
      window.haaelToast('خطأ في الاتصال بالسحابة', 'error');
    }
  };

})();

