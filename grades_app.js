/* =====================================================
   المحرك البرمجي الشامل والنهائي - الأستاذ عبدالملك
   ===================================================== */
'use strict';

const DB_NAME = 'TeacherDashboardDB_V7';
const DB_VERSION = 7;
let db = null;
let currentClassId = null;

// ترتيب الأشهر حسب بداية العام الدراسي (مع إضافة الأشهر الهجرية)
const ARABIC_MONTHS_ORDER = ['سبتمبر','أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];

// ==========================================
// 1. تهيئة قاعدة البيانات والتشغيل الافتراضي
// ==========================================
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('BasicInfo')) d.createObjectStore('BasicInfo', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('Classes')) d.createObjectStore('Classes', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('Students')) d.createObjectStore('Students', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('Grades')) d.createObjectStore('Grades', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('AttendanceDaily')) d.createObjectStore('AttendanceDaily', { keyPath: 'id' });
      // 💡 مخزن جديد: يحفظ درجات كل طالب مرتبطة بالمادة والشهر معاً، ليصبح بالإمكان
      // بناء ترتيب دقيق للطلاب وتحليل تطور نتائجهم شهراً بعد شهر
      if (!d.objectStoreNames.contains('GradesRecords')) d.createObjectStore('GradesRecords', { keyPath: 'id' });
    };
    request.onsuccess = (e) => { db = e.target.result; resolve(); };
    request.onerror = (e) => reject(e.target.error);
  });
}

// نقل الدرجات القديمة (المرصودة قبل تفعيل ربط الشهر/المادة) إلى المخزن الجديد
// حتى لا يفقد الأستاذ أي بيانات مسبقة عند تحديث التطبيق لأول مرة
async function migrateOldGradesIfNeeded() {
  try {
    const oldGrades = await dbGetAll('Grades');
    const newGrades = await dbGetAll('GradesRecords');
    if (oldGrades.length > 0 && newGrades.length === 0) {
      const defaultSubject = document.getElementById('grades-filter-subject')?.value || 'لغة إنجليزية';
      const now = new Date();
      const gregorianToArabicMonth = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      const defaultMonth = gregorianToArabicMonth[now.getMonth()];
      for (const g of oldGrades) {
        const rec = {
          id: gradeRecordId(g.studentId, defaultSubject, defaultMonth),
          studentId: g.studentId,
          classId: g.classId,
          subject: defaultSubject,
          month: defaultMonth,
          att: g.att || 0, hw: g.hw || 0, oral: g.oral || 0, written: g.written || 0
        };
        await dbPut('GradesRecords', rec);
      }
    }
  } catch (err) {
    console.error("تعذر ترحيل الدرجات القديمة:", err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDB();
    await loadBasicInfoFromDB();
    await refreshClassesDropdowns();
    await migrateOldGradesIfNeeded();
    // تعيين تاريخ اليوم تلقائياً في حقل الحضور
    if (document.getElementById('attendance-date-input')) {
      document.getElementById('attendance-date-input').value = new Date().toISOString().split('T')[0];
    }
    showScreen('home');
  } catch (err) { 
    console.error("فشل في تهيئة النظام:", err); 
  }
});

// ==========================================
// 2. نظام التنقل بين الشاشات
// ==========================================
async function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');
  
  const homeBtn = document.getElementById('btn-home');
  if (homeBtn) homeBtn.classList.toggle('hidden', screenId === 'home');
  
  if (screenId === 'add-class') {
      renderClassesList();
  }
  if (screenId === 'grades-sheet') {
      await refreshClassesDropdowns(); // 💡 إجبار النظام على جلب الفصول قبل فتح الدفتر
      loadGradesSheet();
  }
  if (screenId === 'attendance-sheet') {
      await refreshClassesDropdowns(); // 💡 إجبار النظام على جلب الفصول قبل فتح الحضور
      loadAttendanceSheet();
  }
}

// ==========================================
// 3. إدارة الإعدادات العامة للمدرسة
// ==========================================
async function saveBasicInfo() {
  const school = document.getElementById('input-school').value.trim();
  const teacher = document.getElementById('input-teacher').value.trim();
  const year = document.getElementById('input-year').value.trim();
  const semester = document.getElementById('select-semester').value;
  
  await dbPut('BasicInfo', { id: 'main', school, teacher, year, semester });
  
  document.getElementById('view-school-name').textContent = school || "مدرسة حمير النموذجية";
  document.getElementById('view-school-meta').textContent = `العام الدراسي: ${year || '—'} | الفصل: ${semester}`;
  
  triggerSaveIndicator();
  showScreen('home');
}

async function loadBasicInfoFromDB() {
  const info = await dbGet('BasicInfo', 'main');
  if (info) {
    document.getElementById('input-school').value = info.school || '';
    document.getElementById('input-teacher').value = info.teacher || '';
    document.getElementById('input-year').value = info.year || '';
    document.getElementById('select-semester').value = info.semester || 'الأول';
    document.getElementById('view-school-name').textContent = info.school || "مدرسة حمير النموذجية";
    document.getElementById('view-school-meta').textContent = `العام الدراسي: ${info.year || '—'} | الفصل: ${info.semester}`;
  }
}

// ==========================================
// 4. إدارة الصفوف والطلاب (نسخة مصححة ومحدثة)
// ==========================================
async function createNewClass() {
  const nameInput = document.getElementById('class-name');
  if (!nameInput) return;
  
  const name = nameInput.value.trim();
  if (!name) { 
    alert("الرجاء كتابة اسم الصف الدراسي أولاً!"); 
    return; 
  }

  try {
    // 💡 فصل عملية قاعدة البيانات بالكامل، وإدارتها بوعود (Promises) لضمان استقرارها
    const newClassId = await new Promise((resolve, reject) => {
      const tx = db.transaction('Classes', 'readwrite');
      const store = tx.objectStore('Classes');
      
      // 💡 استخدام put بدلاً من add لمرونته العالية وعدم تصادمه مع أي قيود
      const request = store.put({ name: name, subject: "عام" });
      
      request.onsuccess = (e) => resolve(e.target.result);
      
      // التقاط الخطأ المباشر من الطلب
      request.onerror = (e) => reject(e.target.error);
      
      // 💡 التقاط حالات الإلغاء القسري من المتصفح (والتي تحدث غالباً بسبب اختناق الذاكرة)
      tx.onabort = (e) => reject(new Error("تم إلغاء العملية قسرياً من المتصفح (Transaction Aborted)."));
    });

    // 💡 تحديث الواجهة يتم فقط بعد التأكد من نجاح الحفظ وانغلاق المعاملة بأمان
    currentClassId = newClassId;
    nameInput.value = ''; 
    
    if (typeof refreshClassesDropdowns === 'function') await refreshClassesDropdowns();
    if (typeof renderClassesList === 'function') await renderClassesList();
    
    if (typeof openStudentManagement === 'function') {
      openStudentManagement(currentClassId, name);
    }
    
    if (typeof triggerSaveIndicator === 'function') triggerSaveIndicator();

  } catch (err) {
    console.error("التفاصيل الدقيقة لخطأ قاعدة البيانات:", err);
    
    // 💡 استخراج اسم الخطأ التقني الحقيقي لعرضه لك
    const errorReason = err.name || err.message || JSON.stringify(err) || "سبب غير معروف";
    
    alert(`عذراً، رفض متصفح الهاتف حفظ الصف!\n\nالسبب التقني من المتصفح: [ ${errorReason} ]\n\n(إذا كان السبب QuotaExceededError، فهذا يعني أن مساحة التخزين المخصصة للموقع ممتلئة بسبب ملفات الـ Offline).`);
  }
}

async function renderClassesList() {
  const container = document.getElementById('classes-list-container');
  const classes = await dbGetAll('Classes');
  container.innerHTML = classes.length === 0 ? '<p style="text-align:center; padding:10px;">لا توجد صفوف مضافة حالياً.</p>' : '';
  
  classes.forEach(c => {
    const row = document.createElement('div');
    row.className = 'class-row-item';
    row.innerHTML = `
      <span><strong>${c.name}</strong></span>
      <div>
        <button class="btn-xs" style="background-color: var(--primary-medium); margin-left:5px;" onclick="openStudentManagement(${c.id}, '${c.name}')">👨‍🎓 الطلاب</button>
        <button class="btn-delete" onclick="deleteClass(${c.id})">❌ حذف</button>
      </div>`;
    container.appendChild(row);
  });
}

function openStudentManagement(classId, className) {
  currentClassId = classId;
  document.getElementById('current-manage-class-title').textContent = className;
  document.getElementById('students-manage-card').classList.remove('hidden');
  renderStudentsManageTable();
}

async function addStudentManual() {
  const nameInput = document.getElementById('new-student-name');
  if (!nameInput.value.trim()) return;
  await dbPutStore('Students', { classId: currentClassId, name: nameInput.value.trim() });
  nameInput.value = '';
  renderStudentsManageTable();
  triggerSaveIndicator();
}

async function renderStudentsManageTable() {
  const tbody = document.getElementById('students-manage-tbody');
  tbody.innerHTML = '';
  const students = await getStudentsByClass(currentClassId);
  students.forEach((st, idx) => {
    const tr = document.createElement('tr');
    // إذا لم يكن له رقم جلوس مخصص، نعرض فراغاً ليكتبه المعلم
    const seatNum = st.seatNumber || ''; 
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>
        <input type="number" class="cell-input" style="width:80px; text-align:center; font-weight:bold; color:var(--primary-dark);" 
               value="${seatNum}" placeholder="-" 
               onchange="updateSeatNumber(${st.id}, this.value)" />
      </td>
      <td>${st.name}</td>
      <td><button class="btn-delete" onclick="deleteStudent(${st.id})">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// 💡 دالة لحفظ رقم الجلوس عند كتابته يدوياً
async function updateSeatNumber(studentId, newSeatNumber) {
  const st = await dbGet('Students', studentId);
  if (st) {
    st.seatNumber = newSeatNumber.trim();
    await dbPut('Students', st);
    triggerSaveIndicator();
  }
}

// 💡 دالة للترقيم الآلي بضغطة زر
async function autoGenerateSeatNumbers() {
  const startInput = document.getElementById('start-seat-number').value;
  let currentNum = parseInt(startInput);
  
  if (isNaN(currentNum)) {
    alert("الرجاء إدخال رقم بداية صحيح (مثال: 101 أو 1001).");
    return;
  }

  if (!confirm(`هل أنت متأكد من ترقيم طلاب هذا الصف تسلسلياً ابتداءً من الرقم (${currentNum})؟`)) return;

  const students = await getStudentsByClass(currentClassId);
  for (let st of students) {
    st.seatNumber = currentNum.toString();
    await dbPut('Students', st);
    currentNum++; // زيادة الرقم للطالب التالي
  }
  
  renderStudentsManageTable();
  alert("✅ تم تعيين أرقام الجلوس لجميع طلاب الصف بنجاح!");
  triggerSaveIndicator();
}

async function deleteStudent(id) { 
  if(confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
    await dbDelete('Students', id); 
    renderStudentsManageTable(); 
  }
}

async function deleteClass(id) { 
  if(confirm("عند حذف الصف سيتم حذف قائمة أسماء الطلاب المرتبطة به، هل تود الاستمرار؟")) {
    await dbDelete('Classes', id); 
    await refreshClassesDropdowns(); 
    renderClassesList(); 
    document.getElementById('students-manage-card').classList.add('hidden'); 
  }
}


// ==========================================
// دالة تحديث القوائم المنسدلة (تم تحصينها لمنع الفراغ)
// ==========================================
async function refreshClassesDropdowns() {
  const classes = await dbGetAll('Classes');
  
  let options = '';
  if (classes.length === 0) {
      options = '<option value="">لا توجد صفوف (أضف صفاً أولاً)</option>';
  } else {
      options = classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  const gradesSelect = document.getElementById('grades-filter-class');
  const attSelect = document.getElementById('attendance-filter-class');
  
  // 💡 تحديث القوائم مع الاحتفاظ باختيار المعلم السابق حتى لا تتغير فجأة
  if (gradesSelect) {
      const prevValue = gradesSelect.value;
      gradesSelect.innerHTML = options;
      if (prevValue && classes.find(c => c.id == prevValue)) gradesSelect.value = prevValue;
  }
  
  if (attSelect) {
      const prevValue = attSelect.value;
      attSelect.innerHTML = options;
      if (prevValue && classes.find(c => c.id == prevValue)) attSelect.value = prevValue;
  }
}
// ==========================================
// 5. شاشة رصد درجات الطلاب (النسخة الذكية والمستقرة للرصد)
// ==========================================
async function loadGradesSheet() {
  const { classId, subject, month } = getCurrentGradesContext();
  const tbody = document.getElementById('grades-sheet-tbody');
  if (!classId || !tbody) return;
  tbody.innerHTML = ''; 

  const ranked = await getRankedGrades(classId, subject, month);
  // نعرض الطلاب بترتيب دخولهم الأصلي في الجدول (رقم الجلوس) وليس بترتيب المجموع، لسهولة الرصد
  const rows = [...ranked].sort((a, b) => (a.student.seatNumber || a.student.id) - (b.student.seatNumber || b.student.id));

  rows.forEach(({ student: st, grade: g, total }, idx) => {
    const activeSeatNum = st.seatNumber || st.id; 

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold;">${idx + 1}</td>
      <td style="font-weight:900; color:#B71C1C;">${activeSeatNum}</td>
      <td style="text-align:right; font-weight:800;" class="sticky-side col-name">${st.name}</td>
      <td><input type="number" class="cell-input" min="0" max="20" value="${g.att || ''}" placeholder="0" onchange="validateAndSaveGrade('${st.id}', 'att', 20, this)" /></td>
      <td><input type="number" class="cell-input" min="0" max="20" value="${g.hw || ''}" placeholder="0" onchange="validateAndSaveGrade('${st.id}', 'hw', 20, this)" /></td>
      <td><input type="number" class="cell-input" min="0" max="20" value="${g.oral || ''}" placeholder="0" onchange="validateAndSaveGrade('${st.id}', 'oral', 20, this)" /></td>
      <td><input type="number" class="cell-input" min="0" max="40" value="${g.written || ''}" placeholder="0" onchange="validateAndSaveGrade('${st.id}', 'written', 40, this)" /></td>
      <td id="total-${st.id}" style="font-weight:900; color:var(--primary-dark); font-size:18px;">${total}</td>
      <!-- 💡 التغليف الآمن بالـ Single Quotes لمنع كسر الزر -->
      <td class="no-print"><button class="btn-xs" style="background-color: var(--primary-medium);" onclick="openStudentReport('${st.id}')">🏆 النتيجة</button></td>
    `;
    tbody.appendChild(tr);
  });
}


// دالة الفحص الآمنة: تعمل فقط بعد خروجك من الخانة والانتقال لغيرها
async function validateAndSaveGrade(studentIdParam, field, maxVal, inputElement) {
  let val = parseInt(inputElement.value);
  
  // 💡 الحل الجذري 1: إجبار تحويل معرف الطالب إلى رقم ليتطابق دائماً مع قاعدة البيانات
  const studentId = parseInt(studentIdParam);
  
  // إذا كانت الخانة فارغة نعتبرها صفراً
  if (inputElement.value.trim() === '') {
    val = 0;
  }

  // إذا أدخل المعلم رقماً أعلى من المسموح
  if (val > maxVal || val < 0) {
    inputElement.style.backgroundColor = '#FFCDD2'; // تلوين الخانة بالأحمر للتنبيه
    inputElement.style.borderColor = 'var(--danger)';
    
    alert(`تنبيه: الدرجة المدخلة أكبر من الحد الأقصى المسموح به (${maxVal})! تم إعادة تعيين الخانة لتصحيحها.`);
    
    inputElement.value = ''; // إفراغ الخانة لكي تكتب الرقم الصحيح بنفسك دون إجبار
    val = 0;
    
    setTimeout(() => {
      inputElement.style.backgroundColor = '';
      inputElement.style.borderColor = '';
    }, 1000);
  } else {
    inputElement.style.backgroundColor = '';
    inputElement.style.borderColor = '';
  }

  const { classId, subject, month } = getCurrentGradesContext();
  // 💡 تأكيد إضافي أثناء توليد المعرف
  const recId = gradeRecordId(studentId, subject, month);
  
  // 💡 الحل الجذري 2: التأكد من تخزين studentId و classId كأرقام دائماً
  let gradeRecord = await dbGet('GradesRecords', recId) || { id: recId, studentId: studentId, classId: parseInt(classId), subject, month, att: 0, hw: 0, oral: 0, written: 0 };
  
  gradeRecord[field] = val;
  await dbPut('GradesRecords', gradeRecord);
  
  // تحديث المجموع الفوري تلقائياً
  const total = (gradeRecord.att || 0) + (gradeRecord.hw || 0) + (gradeRecord.oral || 0) + (gradeRecord.written || 0);
  document.getElementById(`total-${studentId}`).textContent = total;
  
  triggerSaveIndicator();
}

// ==========================================
// 6. شاشة رصد الحضور والغياب والمواظبة
// ==========================================
async function loadAttendanceSheet() {
  const classId = parseInt(document.getElementById('attendance-filter-class').value);
  const month = document.getElementById('attendance-filter-month').value;
  const dateStr = document.getElementById('attendance-date-input').value;
  const tbody = document.getElementById('attendance-sheet-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!classId || !dateStr) return;
  
  const totalSessionsEl = document.getElementById('input-total-sessions');
  const totalLessons = totalSessionsEl && totalSessionsEl.value ? parseInt(totalSessionsEl.value) : 16;
  const students = await getStudentsByClass(classId);

  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    const dailyKey = `${classId}_${dateStr}_${st.id}`;
    const dailyRecord = await dbGet('AttendanceDaily', dailyKey) || { status: 'none' };
    const monthlyStats = await calculateMonthlyAttendance(classId, month, st.id);
    
    let attGrade = Math.round(((monthlyStats.present + monthlyStats.excused) / totalLessons) * 20);
    if (attGrade > 20) attGrade = 20;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td style="text-align:right; font-weight:800;">${st.name}</td>
      <td>
        <div style="display:flex; gap:5px; justify-content:center;">
          <button class="btn-att-toggle ${dailyRecord.status === 'present' ? 'active-present' : ''}" onclick="setDailyAttendance('${dailyKey}', 'present', '${month}', ${st.id}, this)">✓</button>
          <button class="btn-att-toggle ${dailyRecord.status === 'absent' ? 'active-absent' : ''}" onclick="setDailyAttendance('${dailyKey}', 'absent', '${month}', ${st.id}, this)">✗</button>
          <button class="btn-att-toggle ${dailyRecord.status === 'excused' ? 'active-excused' : ''}" onclick="setDailyAttendance('${dailyKey}', 'excused', '${month}', ${st.id}, this)">م</button>
        </div>
      </td>
      <td class="count-present">${monthlyStats.present}</td>
      <td class="count-absent">${monthlyStats.absent}</td>
      <td class="val-grade" style="font-weight:900; color:var(--primary-medium);">${attGrade}</td>`;
    tbody.appendChild(tr);
  }
}

async function setDailyAttendance(dailyKey, status, month, studentId, element) {
  const classId = parseInt(document.getElementById('attendance-filter-class').value);
  await dbPut('AttendanceDaily', { id: dailyKey, status, month, classId, studentId });
  
  const buttons = element.parentElement.querySelectorAll('.btn-att-toggle');
  buttons.forEach(btn => btn.classList.remove('active-present', 'active-absent', 'active-excused'));
  element.classList.add(`active-${status}`);
  
  await updateRowSummary(element.parentElement, classId, month, studentId);
  triggerSaveIndicator();
}

async function updateRowSummary(parentElement, classId, month, studentId) {
  const totalLessons = parseInt(document.getElementById('input-total-sessions')?.value) || 16;
  const stats = await calculateMonthlyAttendance(classId, month, studentId);
  let attGrade = Math.round(((stats.present + stats.excused) / totalLessons) * 20);
  if (attGrade > 20) attGrade = 20;
  
  const rowTr = parentElement.closest('tr');
  rowTr.querySelector('.count-present').textContent = stats.present;
  rowTr.querySelector('.count-absent').textContent = stats.absent;
  rowTr.querySelector('.val-grade').textContent = attGrade;
}

async function calculateMonthlyAttendance(classId, month, studentId) {
  const allDaily = await dbGetAll('AttendanceDaily');
  const filtered = allDaily.filter(r => r.classId === classId && r.month === month && r.studentId === studentId);
  let present = 0, absent = 0, excused = 0;
  filtered.forEach(r => { 
    if(r.status === 'present') present++; 
    if(r.status === 'absent') absent++; 
    if(r.status === 'excused') excused++; 
  });
  return { present, absent, excused };
}

function toggleAttendanceView() {
  const dailyArea = document.getElementById('printable-attendance-area');
  const monthlyArea = document.getElementById('monthly-attendance-area');
  if (dailyArea.classList.contains('hidden')) {
    dailyArea.classList.remove('hidden'); 
    monthlyArea.classList.add('hidden');
  } else {
    dailyArea.classList.add('hidden'); 
    monthlyArea.classList.remove('hidden');
    renderMonthlyAttendance();
  }
}

async function renderMonthlyAttendance() {
  const classId = parseInt(document.getElementById('attendance-filter-class').value);
  const month = document.getElementById('attendance-filter-month').value;
  const monthlyArea = document.getElementById('monthly-attendance-area');
  
  monthlyArea.innerHTML = `
    <div class="monthly-table-wrapper" style="overflow-x: auto; width: 100%;">
      <table class="app-table sheet-table-bordered" id="monthly-table" style="width: 100%;">
        <thead><tr id="monthly-header"></tr></thead>
        <tbody id="monthly-tbody"></tbody>
      </table>
    </div>`;
    
  const header = document.getElementById('monthly-header');
  const tbody = document.getElementById('monthly-tbody');
  header.innerHTML = '<th>م</th><th>اسم الطالب</th>';
  
  for(let i = 1; i <= 24; i++) header.innerHTML += `<th style="min-width:30px;">${i}</th>`;
  header.innerHTML += '<th>مجموع الحضور</th><th>الدرجة (20)</th>';
  
  const students = await getStudentsByClass(classId);
  const allDaily = await dbGetAll('AttendanceDaily');
  const totalSessions = parseInt(document.getElementById('input-total-sessions')?.value) || 16;
  
  students.forEach((st, idx) => {
    let trHtml = `<tr><td>${idx + 1}</td><td style="text-align:right; font-weight:800;">${st.name}</td>`;
    const records = allDaily.filter(r => r.studentId === st.id && r.month === month);
    let presentCount = 0;
    let excusedCount = 0;
    
    for(let d = 1; d <= 24; d++) {
      const rec = records.find(r => new Date(r.id.split('_')[1]).getDate() === d);
      let icon = '';
      if(rec) { 
        if(rec.status === 'present') { icon = '✓'; presentCount++; } 
        else if(rec.status === 'absent') { icon = '✗'; } 
        else if(rec.status === 'excused') { icon = 'م'; excusedCount++; } 
      }
      trHtml += `<td>${icon}</td>`;
    }
    
    let grade = Math.round(((presentCount + excusedCount) / totalSessions) * 20);
    if(grade > 20) grade = 20;
    
    trHtml += `<td style="color:var(--success); font-weight:bold;">${presentCount}</td><td style="font-weight:900;">${grade}</td></tr>`;
    tbody.innerHTML += trHtml;
  });
}

function buildDecoratedResultCardHtml({ studentName, subject, month, schoolName, teacherName, g, total, rank, totalStudents, classAverage, history }) {
  const remark = getResultRemark(total, rank, totalStudents);
  const toneColors = {
    gold:   { bg: 'linear-gradient(135deg,#FFD700,#B8860B)', text: '#4A3300' },
    silver: { bg: 'linear-gradient(135deg,#E0E0E0,#9E9E9E)', text: '#333333' },
    bronze: { bg: 'linear-gradient(135deg,#D7975B,#8C5A2B)', text: '#3A2205' },
    excellent: { bg: 'linear-gradient(135deg,#7C42C4,#3B1E63)', text: '#ffffff' },
    great:  { bg: 'linear-gradient(135deg,#5A2E99,#3B1E63)', text: '#ffffff' },
    good:   { bg: 'linear-gradient(135deg,#01579B,#013a66)', text: '#ffffff' },
    pass:   { bg: 'linear-gradient(135deg,#E65100,#a83b00)', text: '#ffffff' },
    warn:   { bg: 'linear-gradient(135deg,#B71C1C,#7a1212)', text: '#ffffff' }
  };
  const tone = toneColors[remark.tone] || toneColors.good;

  let historyHtml = '';
  if (history && history.length > 1) {
    const maxTotal = Math.max(...history.map(h => h.total), 100);
    historyHtml = `
      <div style="margin-top:14px;">
        <p style="font-weight:800; color:#3B1E63; font-size:13px; margin-bottom:6px;">📈 تطور النتيجة عبر الأشهر</p>
        <div style="display:flex; align-items:flex-end; gap:6px; height:80px; background:#F6F3FA; border-radius:8px; padding:8px;">
          ${history.map(h => `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
              <span style="font-size:10px; font-weight:800; color:#3B1E63;">${h.total}</span>
              <div style="width:100%; max-width:22px; background:${h.month === month ? '#B71C1C' : '#5A2E99'}; border-radius:4px 4px 0 0; height:${Math.max(6, (h.total / maxTotal) * 55)}px;"></div>
              <span style="font-size:9px; color:#2D3748; margin-top:3px;">${h.month}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  const diffFromAvg = total - classAverage;
  const diffText = diffFromAvg > 0 ? `أعلى من معدل الفصل بـ ${diffFromAvg} درجة` : (diffFromAvg < 0 ? `أقل من معدل الفصل بـ ${Math.abs(diffFromAvg)} درجة` : `مطابق تماماً لمعدل الفصل`);

  return `
    <div style="text-align:center; background:${tone.bg}; color:${tone.text}; border-radius:12px; padding:14px 10px; margin-bottom:14px; box-shadow:0 3px 10px rgba(0,0,0,0.15);">
      <div style="font-size:34px; line-height:1;">${remark.icon}</div>
      <h3 style="margin:6px 0 2px; font-weight:900; font-size:17px;">${studentName}</h3>
      <p style="margin:0; font-size:12px; font-weight:bold; opacity:0.9;">${schoolName} — مادة ${subject} — شهر ${month}</p>
      <p style="margin:2px 0 0; font-size:11px; font-weight:bold; opacity:0.85;">👨‍🏫 ${teacherName}</p>
      <div style="display:inline-block; margin-top:8px; background:rgba(255,255,255,0.25); padding:4px 14px; border-radius:20px; font-weight:900; font-size:13px;">
        الترتيب: ${rank} من ${totalStudents} — ${remark.label}
      </div>
    </div>

    <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:14px; text-align:center;">
      <thead>
        <tr style="background-color:#3B1E63; color:#ffffff;">
            <th style="border:2px solid #3B1E63; padding:6px; color:#ffffff !important;">المهارة الدراسيّة</th>
            <th style="border:2px solid #3B1E63; padding:6px; color:#ffffff !important;">الدرجة المكتسبة</th>
            <th style="border:2px solid #3B1E63; padding:6px; color:#ffffff !important;">الدرجة الكاملة</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border:2px solid #3B1E63; padding:6px;">المواظبة والسلوك</td><td style="border:2px solid #3B1E63; padding:6px; font-weight:bold;">${g.att || 0}</td><td style="border:2px solid #3B1E63; padding:6px;">20</td></tr>
        <tr><td style="border:2px solid #3B1E63; padding:6px;">الواجبات والالتزام</td><td style="border:2px solid #3B1E63; padding:6px; font-weight:bold;">${g.hw || 0}</td><td style="border:2px solid #3B1E63; padding:6px;">20</td></tr>
        <tr><td style="border:2px solid #3B1E63; padding:6px;">الأداء الشفهي والاستماع</td><td style="border:2px solid #3B1E63; padding:6px; font-weight:bold;">${g.oral || 0}</td><td style="border:2px solid #3B1E63; padding:6px;">20</td></tr>
        <tr><td style="border:2px solid #3B1E63; padding:6px;">الاختبار التحريري</td><td style="border:2px solid #3B1E63; padding:6px; font-weight:bold;">${g.written || 0}</td><td style="border:2px solid #3B1E63; padding:6px;">40</td></tr>
        <tr style="background-color:#EFE9F7; font-weight:900;"><td style="border:2px solid #3B1E63; padding:6px;">المجموع الكلي</td><td style="border:2px solid #3B1E63; padding:6px; font-size:18px; color:#B71C1C;">${total}</td><td style="border:2px solid #3B1E63; padding:6px;">100</td></tr>
      </tbody>
    </table>

    <div style="margin-top:10px; display:flex; gap:8px;">
      <div style="flex:1; background:#F6F3FA; border-radius:6px; padding:8px 10px; text-align:center;">
        <p style="margin:0; font-size:11px; font-weight:bold; color:#2D3748;">معدل الفصل العام</p>
        <p style="margin:2px 0 0; font-size:15px; font-weight:900; color:#3B1E63;">${classAverage}/100</p>
      </div>
      <div style="flex:1; background:#F6F3FA; border-radius:6px; padding:8px 10px; text-align:center;">
        <p style="margin:0; font-size:11px; font-weight:bold; color:#2D3748;">مقارنةً بالفصل</p>
        <p style="margin:2px 0 0; font-size:11px; font-weight:800; color:#3B1E63;">${diffText}</p>
      </div>
    </div>

    <div style="margin-top:12px; background:#F6F3FA; border-right:4px solid #5A2E99; border-radius:6px; padding:10px 12px;">
      <p style="margin:0; font-weight:bold; font-size:13px; color:#000000;">💬 كلمة للطالب/ولي الأمر:</p>
      <p style="margin:4px 0 0; font-size:13px; color:#2D3748; font-weight:600;">${remark.text}</p>
    </div>
    ${historyHtml}
  `;
}


async function getTeacherDisplayName() {
  const info = await dbGet('BasicInfo', 'main');
  return (info && info.teacher) ? info.teacher : (document.getElementById('input-teacher')?.value.trim() || 'المعلم');
}
// 💡 تعديل الدالة لتستقبل الـ ID كـ String آمن مع صائد أخطاء
async function openStudentReport(studentId) {
  try {
      const modal = document.getElementById('student-report-modal');
      const content = document.getElementById('single-student-card-content');
      const { classId, subject, month } = getCurrentGradesContext();

      const ranked = await getRankedGrades(classId, subject, month);
      
      // 💡 مطابقة ذكية للآي دي (تحويل الطرفين إلى نصوص لضمان المطابقة 100%)
      const row = ranked.find(r => String(r.student.id) === String(studentId));
      
      if (!row) {
          alert("تعذر العثور على بيانات هذا الطالب في قاعدة البيانات!");
          return;
      }

      const studentName = row.student.name; 
      const g = row.grade || { att: 0, hw: 0, oral: 0, written: 0 };
      const total = row.total || 0;
      const rank = row.rank || ranked.length;
      const totalStudents = ranked.length;
      const classAverage = totalStudents ? Math.round(ranked.reduce((s, r) => s + r.total, 0) / totalStudents) : 0;

      let schoolName = "مدرسة حمير النموذجية";
      const schoolEl = document.getElementById('view-school-name');
      if (schoolEl) schoolName = schoolEl.textContent;
      
      const teacherName = await getTeacherDisplayName();

      const allRecords = await dbGetAll('GradesRecords');
      const history = allRecords
        .filter(r => String(r.studentId) === String(studentId) && r.subject === subject)
        .map(r => ({ month: r.month, total: (parseInt(r.att)||0)+(parseInt(r.hw)||0)+(parseInt(r.oral)||0)+(parseInt(r.written)||0) }))
        .sort((a, b) => ARABIC_MONTHS_ORDER.indexOf(a.month) - ARABIC_MONTHS_ORDER.indexOf(b.month));

      content.innerHTML = buildDecoratedResultCardHtml({ studentName, subject, month, schoolName, teacherName, g, total, rank, totalStudents, classAverage, history });
      modal.classList.remove('hidden');
      
  } catch (error) {
      console.error("خطأ تقني في عرض النتيجة:", error);
      alert("حدث خطأ غير متوقع أثناء محاولة فتح البطاقة: " + error.message);
  }
}



function closeStudentModal() { 
  document.getElementById('student-report-modal').classList.add('hidden'); 
}

function copyStudentCardText() {
  const content = document.getElementById('single-student-card-content');
  const lines = content.innerText.split('\n').filter(l => l.trim() !== '');
  const formattedText = lines.join('\n');
  
  navigator.clipboard.writeText(formattedText).then(() => {
    alert("تم نسخ نص بطاقة الطالب بنجاح! يمكنك الآن لصقها في WhatsApp لإرسالها لولي الأمر.");
  }).catch(err => {
    alert("حدث خطأ أثناء النسخ، يرجى تحديد النص ونسخه يدوياً.");
  });
}

async function toggleGradesReport() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) { alert("الرجاء اختيار الصف الدراسي أولاً!"); return; }
  
  const ranked = await getRankedGrades(classId, subject, month);
  let totalStudents = ranked.length;
  if(totalStudents === 0) { alert("لا يوجد طلاب لحساب التقرير!"); return; }
  
  let totalSum = 0;
  let passCount = 0;
  
  // 1. مصفوفات التقرير الموحدة والذكية
  let missingIssuesList = []; // قائمة تدمج كل من له نواقص أو بدون درجة نهائياً
  let failingList = [];       // قائمة الراسبين
  let passingList = [];       // قائمة الناجحين مع مستوياتهم

  ranked.forEach(r => {
    const stName = r.student.name;
    const total = r.total;
    const g = r.grade || {};
    
    const att = parseInt(g.att) || 0;
    const hw = parseInt(g.hw) || 0;
    const oral = parseInt(g.oral) || 0;
    const written = parseInt(g.written) || 0;

    totalSum += total;

    // أ) تشخيص حالة النواقص في سطر واحد لكل طالب
    if (total === 0) {
       missingIssuesList.push({ name: stName, issue: 'بدون درجات نهائياً (لم يتم الرصد)' });
    } else {
       let missing = [];
       if (att === 0) missing.push('مواظبة');
       if (hw === 0) missing.push('واجبات');
       if (oral === 0) missing.push('شفوي');
       if (written === 0) missing.push('تحريري');
       
       if (missing.length > 0) {
           // يتم جمع النواقص وعرضها بجوار الاسم مباشرة
           missingIssuesList.push({ name: stName, issue: 'ينقصه: ' + missing.join(' + ') });
       }
       
       // ب) فرز النجاح والرسوب
       if (total < 50) {
           failingList.push({ name: stName, score: total });
       } else {
           passCount++;
           let level = '';
           let icon = '';
           if (total >= 90) { level = 'ممتاز'; icon = '🌟'; }
           else if (total >= 80) { level = 'جيد جداً'; icon = '👏'; }
           else if (total >= 65) { level = 'جيد'; icon = '👍'; }
           else { level = 'مقبول'; icon = '📘'; }
           
           passingList.push({ name: stName, score: total, level: level, icon: icon });
       }
    }
  });
  
  let average = Math.round(totalSum / totalStudents);
  let passRate = Math.round((passCount / totalStudents) * 100);
  const top = ranked.find(r => r.total > 0); 
  
  const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
  const classSelect = document.getElementById('grades-filter-class');
  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';

  // إخفاء الكارت القديم المزعج في حال كان مفتوحاً في الخلفية
  const oldCard = document.getElementById('grades-report-card');
  if(oldCard) oldCard.classList.add('hidden');

  // 2. بناء النافذة المنبثقة الشاملة
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:12px; box-sizing:border-box; direction:rtl; font-family:"Cairo",sans-serif;';

  let htmlContent = `
    <div style="width:100%; max-width:650px; max-height:92%; background:#fff; border-radius:14px; padding:14px; box-sizing:border-box; display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:8px; margin-bottom:8px;">
        <span style="font-weight:900; color:#3B1E63; font-size:15px;">📊 خلاصة التقرير التشخيصي</span>
        <button id="close-summary-report" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-weight:bold; cursor:pointer;">إغلاق</button>
      </div>

      <div id="summary-report-capture" style="overflow-y:auto; flex:1; background:#fff; padding:10px; border-radius:8px;">
        <div style="text-align:center; background:linear-gradient(135deg,#3B1E63,#5A2E99); color:#fff; padding:15px; border-radius:10px; margin-bottom:15px;">
            <h2 style="margin:0 0 5px; font-weight:900; font-size:20px;">${schoolName}</h2>
            <p style="margin:0; font-size:14px; font-weight:bold;">خلاصة درجات الفصل — ${className} — مادة ${subject}</p>
        </div>

        <div style="display:flex; justify-content:space-between; background:#F6F3FA; border:2px solid #E2CDFC; padding:10px; border-radius:8px; margin-bottom:15px; font-weight:bold; color:#3B1E63; font-size:14px;">
           <span>👥 الإجمالي: ${totalStudents} طالب</span>
           <span>📈 نسبة النجاح: <span style="color:#1B5E20;">${passRate}%</span></span>
           <span>🎯 معدل الفصل: ${average}/100</span>
        </div>
        
        ${top ? `<div style="text-align:center; background:#FFF8E1; border:2px solid #FFC107; padding:8px; border-radius:8px; margin-bottom:15px; font-weight:bold; color:#3E2723;">🥇 الأول على الفصل: <span style="color:#B71C1C; font-weight:900;">${top.student.name} (${top.total}/100)</span></div>` : ''}
  `;

  // 3. رسم جدول النواقص الموحد
  if (missingIssuesList.length > 0) {
      htmlContent += `
      <h4 style="color:#E65100; margin-bottom:8px; font-weight:900; font-size:15px;">⚠️ قائمة النواقص والملاحظات:</h4>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px; text-align:center; font-size:14px;">
        <thead>
          <tr style="background:#FFF3E0; color:#E65100;">
            <th style="border:2px solid #E65100; padding:6px; width:40px;">م</th>
            <th style="border:2px solid #E65100; padding:6px; text-align:right;">اسم الطالب</th>
            <th style="border:2px solid #E65100; padding:6px;">التشخيص (النواقص)</th>
          </tr>
        </thead>
        <tbody>
          ${missingIssuesList.map((st, i) => `
            <tr>
              <td style="border:2px solid #E65100; padding:6px; font-weight:bold;">${i+1}</td>
              <td style="border:2px solid #E65100; padding:6px; text-align:right; font-weight:bold;">${st.name}</td>
              <td style="border:2px solid #E65100; padding:6px; font-weight:bold; color:#D84315;">${st.issue}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      `;
  } else {
      htmlContent += `<div style="padding:10px; background:#E8F5E9; color:#1B5E20; text-align:center; font-weight:bold; border-radius:6px; margin-bottom:20px; border:2px solid #A5D6A7;">✅ سجل الدرجات مكتمل تماماً لجميع الطلاب، لا يوجد أي نواقص!</div>`;
  }

  // 4. رسم جدول الراسبين
  if (failingList.length > 0) {
       htmlContent += `
      <h4 style="color:#B71C1C; margin-bottom:8px; font-weight:900; font-size:15px;">🔴 الطلاب الذين يحتاجون متابعة (رسوب تحت 50):</h4>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px; text-align:center; font-size:14px;">
        <thead>
          <tr style="background:#FFEBEE; color:#B71C1C;">
            <th style="border:2px solid #B71C1C; padding:6px; width:40px;">م</th>
            <th style="border:2px solid #B71C1C; padding:6px; text-align:right;">اسم الطالب</th>
            <th style="border:2px solid #B71C1C; padding:6px; width:100px;">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${failingList.map((st, i) => `
            <tr>
              <td style="border:2px solid #B71C1C; padding:6px; font-weight:bold;">${i+1}</td>
              <td style="border:2px solid #B71C1C; padding:6px; text-align:right; font-weight:bold;">${st.name}</td>
              <td style="border:2px solid #B71C1C; padding:6px; font-weight:900;">${st.score}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      `;
  }

  // 5. رسم جدول الناجحين مع التقديرات
  if (passingList.length > 0) {
       htmlContent += `
      <h4 style="color:#1B5E20; margin-bottom:8px; font-weight:900; font-size:15px;">🟢 تصنيف مستويات الطلاب الناجحين:</h4>
      <table style="width:100%; border-collapse:collapse; margin-bottom:15px; text-align:center; font-size:14px;">
        <thead>
          <tr style="background:#E8F5E9; color:#1B5E20;">
            <th style="border:2px solid #1B5E20; padding:6px; width:40px;">م</th>
            <th style="border:2px solid #1B5E20; padding:6px; text-align:right;">اسم الطالب</th>
            <th style="border:2px solid #1B5E20; padding:6px; width:80px;">المجموع</th>
            <th style="border:2px solid #1B5E20; padding:6px; width:120px;">التقدير</th>
          </tr>
        </thead>
        <tbody>
          ${passingList.map((st, i) => `
            <tr>
              <td style="border:2px solid #1B5E20; padding:6px; font-weight:bold;">${i+1}</td>
              <td style="border:2px solid #1B5E20; padding:6px; text-align:right; font-weight:bold;">${st.name}</td>
              <td style="border:2px solid #1B5E20; padding:6px; font-weight:900;">${st.score}</td>
              <td style="border:2px solid #1B5E20; padding:6px; font-weight:bold;">${st.icon}${st.level}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      `;
  }

  htmlContent += `
        <div style="text-align:left; font-size:12px; font-weight:bold; color:#5A2E99; margin-top:10px;">
          📆 تاريخ استخراج الخلاصة: ${new Date().toLocaleDateString('ar-YE')}
        </div>
      </div>
      
      <div style="display:flex; gap:8px; margin-top:10px;">
        <button id="save-summary-img" style="flex:1; background:#5A2E99; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:15px;">📸 تصدير الخلاصة كصورة رسمية</button>
      </div>
    </div>
  `;

  modal.innerHTML = htmlContent;
  document.body.appendChild(modal);

  // إغلاق النافذة
  document.getElementById('close-summary-report').onclick = () => {
    if (modal.parentNode) document.body.removeChild(modal);
  };

  // 6. برمجة زر تصدير الخلاصة كصورة (بنفس الحيلة السحرية المانعة للقص)
  document.getElementById('save-summary-img').onclick = () => {
    const allChildren = document.body.children;
    const hiddenElements = [];
    for (let i = 0; i < allChildren.length; i++) {
      const el = allChildren[i];
      if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
        hiddenElements.push(el);
        el.style.display = 'none';
      }
    }

    const printWrapper = document.createElement('div');
    printWrapper.style.cssText = 'position:absolute; top:0; right:0; width:1000px; min-height:100vh; background:#ffffff; z-index:9999998; direction:rtl; font-family:"Cairo", sans-serif; padding:20px; box-sizing:border-box;';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
    loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
    loadingOverlay.innerHTML = `⏳ جاري التقاط صورة للتقرير التشخيصي بالكامل...<br><br>يرجى الانتظار.`;
    printWrapper.appendChild(loadingOverlay);

    const captureHtml = document.getElementById('summary-report-capture').innerHTML;
    const contentDiv = document.createElement('div');
    contentDiv.id = 'temp-image-capture-area';
    contentDiv.innerHTML = captureHtml;
    contentDiv.style.cssText = 'background:#ffffff; padding:20px; box-sizing:border-box; width:900px; margin:0 auto;';
    
    printWrapper.appendChild(contentDiv);
    document.body.appendChild(printWrapper);

    setTimeout(() => {
        window.scrollTo(0, 0);
        const targetArea = document.getElementById('temp-image-capture-area');
        html2canvas(targetArea, {
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1000
        }).then(canvas => {
          const imgDataUrl = canvas.toDataURL('image/png');
          document.body.removeChild(printWrapper);
          hiddenElements.forEach(el => el.style.display = '');

          const imgModal = document.createElement('div');
          imgModal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:15px;';
          imgModal.innerHTML = `
            <div style="width:100%; max-width:600px; background:#fff; border-radius:12px; padding:15px; box-sizing:border-box; display:flex; flex-direction:column; max-height:90%;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:10px; margin-bottom:10px;">
                <span style="font-family:'Cairo'; font-weight:bold; color:#3B1E63;">📸 صورة الخلاصة جاهزة</span>
                <button id="close-img-modal" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-family:'Cairo'; font-weight:bold; cursor:pointer;">إغلاق</button>
              </div>
              <div style="text-align:center; background:#EBF8FF; color:#2B6CB0; font-family:'Cairo'; font-size:12px; padding:6px; border-radius:6px; font-weight:bold; margin-bottom:10px;">
                💡 اضغط مطولاً على الصورة لحفظها بجهازك.
              </div>
              <div style="overflow-y:auto; flex:1; text-align:center; border:1px solid #E2E8F0; padding:5px; background:#f7fafc; border-radius:6px;">
                <img src="${imgDataUrl}" style="width:100%; height:auto; box-shadow:0 2px 5px rgba(0,0,0,0.15);" alt="صورة الخلاصة" />
              </div>
            </div>
          `;
          document.body.appendChild(imgModal);
          document.getElementById('close-img-modal').addEventListener('click', () => {
              if(imgModal.parentNode) document.body.removeChild(imgModal);
          });
        }).catch(err => {
          console.error(err);
          alert("تعذر استخراج الصورة.");
          document.body.removeChild(printWrapper);
          hiddenElements.forEach(el => el.style.display = '');
        });
    }, 1000);
  };
}


// دالة التصدير الحصرية لجداول التقارير إلى إكسل
function exportReportTable(tableId, reportName) {
    const table = document.getElementById(tableId);
    if (!table) {
        alert("لم يتم العثور على الجدول!");
        return;
    }
    
    // استخدام مكتبة XLSX المتوفرة في تطبيقك لتصدير الجدول فوراً
    const wb = XLSX.utils.table_to_book(table, { sheet: "التقرير" });
    XLSX.writeFile(wb, `تقرير_${reportName}.xlsx`);
}



async function exportGradesPDF() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) { alert("الرجاء اختيار الصف الدراسي أولاً!"); return; }

  const classSelect = document.getElementById('grades-filter-class');
  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';
  const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
  const schoolMeta = document.getElementById('view-school-meta')?.textContent || `مادة ${subject} — شهر ${month}`;

  const ranked = await getRankedGrades(classId, subject, month);
  const sortedRows = [...ranked].sort((a, b) => a.student.name.localeCompare(b.student.name, 'ar'));

  const allChildren = document.body.children;
  const hiddenElements = [];
  for (let i = 0; i < allChildren.length; i++) {
    const el = allChildren[i];
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
      hiddenElements.push(el);
      el.style.display = 'none';
    }
  }

  window.scrollTo(0, 0);

  const printWrapper = document.createElement('div');
  printWrapper.id = 'temp-pdf-wrapper';
  printWrapper.style.backgroundColor = '#ffffff';
  printWrapper.style.width = '1120px'; // زيادة العرض الكلي لمنع أي ضغط
  printWrapper.style.minHeight = '100vh';
  printWrapper.style.direction = 'rtl';
  printWrapper.style.fontFamily = "'Cairo', sans-serif";
  printWrapper.style.padding = '20px';
  printWrapper.style.boxSizing = 'border-box';

  const loadingOverlay = document.createElement('div');
  loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
  loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
  loadingOverlay.innerHTML = `⏳ جاري ضبط الكشف (منع انقسام الأسطر وتصحيح الحدود)...<br><br>يرجى الانتظار ثواني قليلة.`;
  printWrapper.appendChild(loadingOverlay);

  // تم تصغير العرض الداخلي إلى 1040px لترك مساحة واسعة للحدود الخارجية (لن يتم قص التسطير أبداً)
  let htmlContent = `
    <div style="padding:20px; width:1040px; margin:0 auto; background:#fff; box-sizing:border-box;">
      <div style="text-align:center; margin-bottom:15px; border-bottom:3px double #5A2E99; padding-bottom:10px;">
        <h2 style="color:#3B1E63; margin:0 0 5px 0; font-weight:900; font-size:22px;">${schoolName}</h2>
        <p style="margin:0 0 5px 0; font-weight:bold; font-size:14px; color:#2D3748;">${schoolMeta}</p>
        <span style="background-color:#5A2E99; color:#fff; display:inline-block; padding:5px 15px; border-radius:4px; margin-top:5px; font-size:14px; font-weight:bold;">
          كشف درجات الطلاب الشهري: ${className}
        </span>
      </div>
      
      <table style="width:100%; border-collapse:collapse; font-size:15px; text-align:center; margin-top:10px; box-sizing:border-box;">
        <thead>
          <tr style="background-color:#3B1E63; color:#ffffff; page-break-inside: avoid;">
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:50px; color:#ffffff !important;">م</th>
            <th style="border:2px solid #3B1E63; padding:10px 8px; text-align:right; width:300px; color:#ffffff !important;">اسم الطالب</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">المواظبة</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">الواجبات</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">الشفوي</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">التحريري</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:110px; background-color:#2D134D; color:#ffffff !important;">المجموع (100)</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:110px; background-color:#1B5E20; color:#ffffff !important;">المحصلة (20)</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedRows.forEach((row, idx) => {
    const st = row.student;
    const g = row.grade;
    const total100 = row.total;
    const final20 = Math.round(total100 / 5);
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#F9F6FC';

    // 💡 السر الأول: إضافة (page-break-inside: avoid) لمنع قسم الصف إلى نصفين
    htmlContent += `
      <tr style="background-color:${rowBg}; page-break-inside: avoid;">
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${idx + 1}</td>
        <td style="border:2px solid #3B1E63; padding:8px 8px; text-align:right; font-weight:800; color:#1A202C;">${st.name}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.att || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.hw || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.oral || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.written || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:900; color:#B71C1C; background-color:#F5EFFC; font-size:16px;">${total100}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:900; font-size:18px; color:#1B5E20; background-color:#E8F5E9;">${final20}</td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
      <div style="margin-top:20px; text-align:left; font-size:13px; font-weight:bold; color:#5A2E99; page-break-inside: avoid;">
        تاريخ استخراج الكشف: ${new Date().toLocaleDateString('ar-YE')}
      </div>
    </div>
  `;

  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = htmlContent;
  printWrapper.appendChild(contentDiv);
  document.body.appendChild(printWrapper);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `كشف_درجات_${className}_${subject}_${month}_أبجدي.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, scrollX: 0, windowWidth: 1120 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['css', 'legacy'] } // 💡 السر الثاني: تفعيل الوضع المزدوج لفصل الصفحات
  };

  setTimeout(() => {
    window.scrollTo(0, 0); 
    html2pdf().set(opt).from(printWrapper).save().then(() => {
      document.body.removeChild(printWrapper);
      hiddenElements.forEach(el => el.style.display = '');
    }).catch(err => {
      console.error(err);
      document.body.removeChild(printWrapper);
      hiddenElements.forEach(el => el.style.display = '');
      alert("تعذر إنشاء ملف الـ PDF.");
    });
  }, 1000);
}

// ==========================================
// 8. عمليات تصدير التقارير (نسخة مطورة لتصدير الحضور اليومي والشهري دون بتر)
// ==========================================
async function exportAttendancePDFReport() {
  const isMonthlyHidden = document.getElementById('monthly-attendance-area').classList.contains('hidden');
  const classSelect = document.getElementById('attendance-filter-class');
  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';
  const monthName = document.getElementById('attendance-filter-month').value;
  
  const schoolName = document.getElementById('view-school-name').textContent || 'مدرسة حمير النموذجية';
  const schoolMeta = document.getElementById('view-school-meta').textContent || '';

  if (!isMonthlyHidden) {
    const element = document.getElementById('printable-attendance-area');
    const opt = {
      margin: [12, 12, 12, 12],
      filename: `سجل_الحضور_اليومي_${className}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
    return;
  }

  const classId = parseInt(classSelect.value);
  if (!classId) {
    alert("الرجاء اختيار الصف الدراسي أولاً!");
    return;
  }

  const students = await getStudentsByClass(classId);
  const allDaily = await dbGetAll('AttendanceDaily');
  const totalSessions = parseInt(document.getElementById('input-total-sessions')?.value) || 16;

  const printContainer = document.createElement('div');
  printContainer.style.direction = 'rtl';
  printContainer.style.padding = '5px';
  printContainer.style.fontFamily = "'Cairo', sans-serif";

  let htmlContent = `
    <div style="text-align:center; margin-bottom:15px; border-bottom:3px double #5A2E99; padding-bottom:8px;">
      <h2 style="color:#3B1E63; margin:0 0 5px 0; font-weight:900;">${schoolName}</h2>
      <p style="margin:0 0 5px 0; font-weight:bold; font-size:12px; color:#2D3748;">${schoolMeta}</p>
      <h3 style="background-color:#5A2E99; color:#fff; display:inline-block; padding:5px 15px; border-radius:4px; margin:5px 0 0 0; font-size:15px;">
        سجل الحضور والغياب الشهري الشامل: ${className} | شهر: ${monthName}
      </h3>
    </div>
    
    <table style="width:100%; border-collapse:collapse; direction:rtl; font-size:11px; table-layout: fixed;">
      <thead>
        <tr style="background-color:#3B1E63; color:#ffffff; text-align:center;">
          <th style="border:1px solid #3B1E63; padding:6px 2px; width:25px;">م</th>
          <th style="border:1px solid #3B1E63; padding:6px 5px; text-align:right; width:130px;">اسم الطالب</th>
  `;
  
  for (let i = 1; i <= 24; i++) {
    htmlContent += `<th style="border:1px solid #3B1E63; padding:6px 1px; text-align:center; width:20px; font-size:10px;">${i}</th>`;
  }
  
  htmlContent += `
          <th style="border:1px solid #3B1E63; padding:6px 2px; text-align:center; width:45px; background-color:#1B5E20;">حضور</th>
          <th style="border:1px solid #3B1E63; padding:6px 2px; text-align:center; width:45px; background-color:#2D134D;">الدرجة<br><small>(20)</small></th>
        </tr>
      </thead>
      <tbody>
  `;

  students.forEach((st, idx) => {
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#F9F6FC';
    htmlContent += `<tr style="background-color:${rowBg}; text-align:center;">
      <td style="border:1px solid #3B1E63; padding:5px 2px; font-weight:bold;">${idx + 1}</td>
      <td style="border:1px solid #3B1E63; padding:5px 5px; text-align:right; font-weight:bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.name}</td>`;
    
    const records = allDaily.filter(r => r.studentId === st.id && r.month === monthName);
    let presentCount = 0;
    let excusedCount = 0;
    
    for (let d = 1; d <= 24; d++) {
      const rec = records.find(r => new Date(r.id.split('_')[1]).getDate() === d);
      let icon = '';
      let bgStyle = '';
      if (rec) { 
        if (rec.status === 'present') { icon = '✓'; presentCount++; bgStyle = 'color:#1B5E20; font-weight:bold;'; } 
        else if (rec.status === 'absent') { icon = '✗'; bgStyle = 'color:#B71C1C; font-weight:bold;'; } 
        else if (rec.status === 'excused') { icon = 'م'; excusedCount++; bgStyle = 'color:#E65100; font-weight:bold;'; } 
      }
      htmlContent += `<td style="border:1px solid #3B1E63; padding:5px 1px; font-size:10px; ${bgStyle}">${icon}</td>`;
    }
    
    let grade = Math.round(((presentCount + excusedCount) / totalSessions) * 20);
    if (grade > 20) grade = 20;
    
    htmlContent += `
      <td style="border:1px solid #3B1E63; padding:5px 2px; color:#1B5E20; font-weight:900;">${presentCount}</td>
      <td style="border:1px solid #3B1E63; padding:5px 2px; font-weight:900; background-color:#F5EFFC; color:#3B1E63;">${grade}</td>
    </tr>`;
  });

  htmlContent += `
      </tbody>
    </table>
    <div style="margin-top:15px; text-align:left; font-size:11px; font-weight:bold; color:#5A2E99; padding-left:10px;">
      تاريخ استخراج السجل: ${new Date().toLocaleDateString('ar-YE')}
    </div>
  `;

  printContainer.innerHTML = htmlContent;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `سجل_الحضور_الشهري_${className}_${monthName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2.5, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(printContainer).save();
}

// ==========================================
// 8. عمليات تصدير التقارير (نسخة مطورة لتصدير الإكسل بكامل البيانات)
// ==========================================
async function exportGradesExcel() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) {
    alert("الرجاء اختيار الصف الدراسي أولاً!");
    return;
  }

  const classSelect = document.getElementById('grades-filter-class');
  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';

  const ranked = await getRankedGrades(classId, subject, month);

  // بناء مصفوفة البيانات المتوافقة مع الإكسل
  let excelTextMatrix = "الترتيب\tاسم الطالب\tالمواظبة (20)\tالواجبات (20)\tالشفوي (20)\tالتحريري (40)\tالمجموع الكلي (100)\n";

  ranked.forEach(({ student: st, grade: g, total, rank }) => {
    const att = parseInt(g.att) || 0;
    const hw = parseInt(g.hw) || 0;
    const oral = parseInt(g.oral) || 0;
    const written = parseInt(g.written) || 0;

    excelTextMatrix += `${rank}\t${st.name}\t${att}\t${hw}\t${oral}\t${written}\t${total}\n`;
  });

  // الطريقة الافتراضية والتقليدية لنسخ النصوص داخل تطبيقات الأندرويد دون الحاجة لاتصال آمن HTTPS
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = excelTextMatrix;
  tempTextArea.style.position = 'fixed';
  tempTextArea.style.top = '0';
  tempTextArea.style.left = '0';
  tempTextArea.style.width = '10px';
  tempTextArea.style.height = '10px';
  tempTextArea.style.opacity = '0';
  
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  tempTextArea.setSelectionRange(0, 99999); // لضمان التحديد الكامل داخل الهواتف الذكية

  let isCopied = false;
  try {
    isCopied = document.execCommand('copy'); // الأمر المضمون أوفلاين بنسبة 100%
  } catch (err) {
    console.error("خطأ أثناء النسخ المحتجز:", err);
  }

  document.body.removeChild(tempTextArea);

  if (isCopied) {
    alert(`📋 تم نسخ كشف درجات (${className}) بالكامل بنجاح!\n\nاذهب الآن إلى تطبيق Excel أو جداول بيانات Google في هاتفك، وافتح ملفاً جديداً ثم اضغط "لصق" (Paste)، وستنزل كل الأسماء والدرجات مرتبة وموزعة تلقائياً في أعمدة وخلايا منفصلة وممتازة!`);
  } else {
    alert("عذراً، لم نتمكن من نسخ الجدول تلقائياً، يرجى مراجعة تحديث نظام الهاتف.");
  }
}
function exportAttendanceExcel() {
  const activeTable = document.getElementById('printable-attendance-area').classList.contains('hidden') ? 
                      document.getElementById('monthly-table') : document.querySelector('#printable-attendance-area table');
  if(!activeTable) return;
  const wb = XLSX.utils.table_to_book(activeTable, { sheet: "سجل الحضور" });
  XLSX.writeFile(wb, `سجل_الحضور_والغياب.xlsx`);
}

// ==========================================
// 9. استيراد الأسماء من ملف Excel (النسخة الذكية والنهائية)
// ==========================================
function triggerExcelImport() {
  document.getElementById('excel-file-input').click();
}

function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    let importedCount = 0;
    const excludedHeaders = ['اسم الطالب', 'الاسم', 'اسم', 'م', 'ت', 'الرقم', 'تسلسل', 'الترتيب', 'student name', 'name', 'no', 'id'];

    json.forEach(row => {
      if (row && row.length > 0) {
        let potentialName = '';
        
        for (let i = 0; i < row.length; i++) {
          if (row[i] && isNaN(row[i].toString().trim())) {
            potentialName = row[i].toString().trim();
            break; 
          }
        }
        
        if (potentialName !== '' && potentialName.length > 1) {
          const cleanName = potentialName.toLowerCase();
          const isHeader = excludedHeaders.includes(cleanName);
          
          if (!isHeader) {
            dbPutStore('Students', { classId: currentClassId, name: potentialName });
            importedCount++;
          }
        }
      }
    });
    
    alert(`تم استيراد ${importedCount} طالب بنجاح وبأمان إلى هذا الصف!`);
    event.target.value = '';
    
    renderStudentsManageTable();
    refreshClassesDropdowns();
  };
  reader.readAsArrayBuffer(file);
}

// ==========================================
// 10. الدوال المساعدة للتعامل مع الـ IndexedDB
// ==========================================
function dbGet(store, key) { return new Promise(res => db.transaction(store, 'readonly').objectStore(store).get(key).onsuccess = (e) => res(e.target.result)); }
function dbPut(store, data) { return new Promise(res => db.transaction(store, 'readwrite').objectStore(store).put(data).onsuccess = () => res()); }
function dbPutStore(store, data) { return new Promise(res => db.transaction(store, 'readwrite').objectStore(store).add(data).onsuccess = () => res()); }
function dbGetAll(store) { return new Promise(res => db.transaction(store, 'readonly').objectStore(store).getAll().onsuccess = (e) => res(e.target.result)); }
function dbDelete(store, key) { return new Promise(res => db.transaction(store, 'readwrite').objectStore(store).delete(key).onsuccess = () => res()); }
function getStudentsByClass(cid) { return new Promise(res => db.transaction('Students', 'readonly').objectStore('Students').getAll().onsuccess = (e) => res(e.target.result.filter(s => s.classId === cid))); }

// ==========================================
// 10.1 أدوات مساعدة لسياق المادة/الشهر ونظام الدرجات المرتبط بهما
// ==========================================
function gradeRecordId(studentId, subject, month) {
  return `${studentId}__${subject}__${month}`;
}

// يقرأ الصف + المادة (بما فيها المادة اليدوية) + الشهر المختارين حالياً من شريط أدوات الدرجات
function getCurrentGradesContext() {
  const classId = parseInt(document.getElementById('grades-filter-class')?.value) || null;
  const subjectSelect = document.getElementById('grades-filter-subject');
  let subject = subjectSelect ? subjectSelect.value : '';
  if (subject === 'custom') {
    subject = document.getElementById('grades-custom-subject')?.value.trim() || 'مادة مخصصة';
  }
  const month = document.getElementById('grades-filter-month')?.value || '';
  return { classId, subject, month };
}

// إظهار/إخفاء حقل إدخال المادة اليدوية، وإعادة تحميل الجدول المناسب (درجات أو حضور)
function handleSubjectChange(type) {
  const select = document.getElementById(`${type}-filter-subject`);
  const customInput = document.getElementById(`${type}-custom-subject`);
  if (select && customInput) {
    if (select.value === 'custom') {
      customInput.classList.remove('hidden');
    } else {
      customInput.classList.add('hidden');
    }
  }
  if (type === 'grades') loadGradesSheet();
  else if (type === 'attendance') loadAttendanceSheet();
}

// يجلب كل سجلات الدرجات لصف/مادة/شهر معيّن مرتبة تنازلياً حسب المجموع (الترتيب الفعلي)
// يجلب كل سجلات الدرجات لصف/مادة/شهر معيّن مرتبة تنازلياً حسب المجموع (الترتيب الفعلي)
async function getRankedGrades(classId, subject, month) {
  const students = await getStudentsByClass(classId);
  const allRecords = await dbGetAll('GradesRecords');
  const rows = students.map(st => {
    // 💡 التعديل هنا: تحويل الاثنين إلى نصوص أثناء المقارنة لضمان عدم حدوث أي خطأ في النوع (Type Mismatch)
    const g = allRecords.find(r => String(r.studentId) === String(st.id) && r.subject === subject && r.month === month) || { att: 0, hw: 0, oral: 0, written: 0 };
    const total = (parseInt(g.att) || 0) + (parseInt(g.hw) || 0) + (parseInt(g.oral) || 0) + (parseInt(g.written) || 0);
    return { student: st, grade: g, total };
  });
  rows.sort((a, b) => b.total - a.total);
  // احتساب الترتيب مع معالجة حالة التعادل (نفس الترتيب لنفس المجموع)
  let rank = 0, prevTotal = null;
  rows.forEach((row, idx) => {
    if (row.total !== prevTotal) { rank = idx + 1; prevTotal = row.total; }
    row.rank = rank;
  });
  return rows;
}

// يولّد عبارة تربوية مناسبة (تهنئة/تحفيز/عتاب لطيف) بحسب المجموع والترتيب
function getResultRemark(total, rank, totalStudents) {
  if (rank === 1) return { icon: '🥇', label: 'الأول على الفصل', text: 'مبارك! تفوق باهر يليق بجهدك المتواصل، واصل هذا التميز.', tone: 'gold' };
  if (rank === 2) return { icon: '🥈', label: 'الثاني على الفصل', text: 'أداء رائع ومشرّف، خطوة صغيرة تفصلك عن القمة فواصل الاجتهاد.', tone: 'silver' };
  if (rank === 3) return { icon: '🥉', label: 'الثالث على الفصل', text: 'نتيجة متميزة تستحق التقدير، استمر بنفس العزيمة.', tone: 'bronze' };
  if (total >= 90) return { icon: '🌟', label: 'ممتاز', text: 'مستوى ممتاز ومشرّف، بارك الله في جهدك واستمر.', tone: 'excellent' };
  if (total >= 80) return { icon: '👏', label: 'جيد جداً', text: 'نتيجة جيدة جداً، بقليل من الجهد الإضافي تصل للامتياز.', tone: 'great' };
  if (total >= 65) return { icon: '👍', label: 'جيد', text: 'مستوى جيد، ينقصك مزيد من المراجعة والمذاكرة لتحسّن نتيجتك أكثر.', tone: 'good' };
  if (total >= 50) return { icon: '📘', label: 'مقبول', text: 'نجحت، لكن نتيجتك بحاجة لجهد أكبر في المذاكرة والواجبات القادمة.', tone: 'pass' };
  return { icon: '⚠️', label: 'بحاجة إلى تحسّن', text: 'نتيجتك أقل من المطلوب، يجب الاهتمام بالمذاكرة والحضور والواجبات فوراً، ونحن على ثقة أنك قادر على التحسن.', tone: 'warn' };
}

function triggerSaveIndicator() { 
  const ind = document.getElementById('save-indicator'); 
  if(ind) {
    ind.classList.remove('hidden'); 
    setTimeout(() => ind.classList.add('hidden'), 1500); 
  }
}


// ==========================================
// دالة تحويل بطاقة الطالب الشهرية إلى// ==========================================
// دالة مطورة لحفظ البطاقة كصورة استناداً للمكتبة المحلية مباشرة
// ========================================
function exportStudentCardAsImage() {
  const element = document.getElementById('single-student-card-content');
  if (!element) {
    alert("خطأ: لم يتم العثور على محتوى بطاقة الطالب!");
    return;
  }

  // التحقق من أن مكتبة pdf متوفرة محلياً لأننا سنستخرج الصورة من ذاكرتها الداخلية
  if (typeof html2pdf === 'undefined') {
    alert("تنبيه: مكتبة html2pdf غير معرّفة محلياً في النظام.");
    return;
  }

  // استخدام نظام html2pdf الداخلي لإنشاء الصورة دون الحاجة لمتغير html2canvas الخارجي
  html2pdf().from(element).set({
    html2canvas: { 
      scale: 3,             // جودة ووضوح عالي جداً عند إرسالها بالواتساب
      useCORS: true, 
      backgroundColor: '#FFFFFF' // خلفية بيضاء ناصعة متناسقة مع التنسيق البنفسجي
    }
  }).toImg().then(function() {
    // اختراق سلسلة المعالجة واستخراج رابط الصورة الفعلي (Base64) من ذاكرة المكتبة
    const imgData = this.prop.img.src;
    
    // التقاط اسم الطالب لتسمية ملف الصورة باسمه تلقائياً
    const studentNameElement = element.querySelector('h3');
    const studentName = studentNameElement ? studentNameElement.textContent.trim() : 'طالب';

    // إنشاء رابط التنزيل السريع في جهازك
    const downloadLink = document.createElement('a');
    downloadLink.download = `بطاقة_درجات_${studentName}.png`;
    downloadLink.href = imgData;
    
    // تنفيذ أمر الحفظ الفوري
    downloadLink.click();
  }).catch(err => {
    console.error("خطأ أثناء استخراج الصورة المحمية:", err);
    alert("حدث خطأ غير متوقع أثناء معالجة الصورة، يرجى إعادة المحاولة.");
  });
}
// =====================================================
// نظام التحكم اليدوي الذكي بشريط الأدوات - الأستاذ عبدالملك
// =====================================================

function initGradesToolbarToggle() {
  const gradesScreen = document.getElementById('screen-grades-sheet');
  
  // 💡 التعديل الجذري: استهداف "صف الأزرار فقط" وترك قوائم التصفية والكشف
  const actionRow = document.querySelector('#grades-toolbar .action-row-grid'); 
  
  if (!gradesScreen || !actionRow) return;
  
  // منع تكرار إنشاء الزر عند إعادة تحميل الشاشة
  if (document.getElementById('fab-toolbar-toggle')) return;

  const fab = document.createElement('button');
  fab.type = 'button'; // 💡 أمان لمنع أي إعادة تحميل مفاجئ للصفحة
  fab.id = 'fab-toolbar-toggle';
  fab.innerHTML = '🔽 إخفاء الأزرار';
  fab.className = 'toolbar-toggle-fab';
  
  // وظيفة الزر عند النقر (تبديل سلس لإخفاء وإظهار الأزرار فقط)
  fab.onclick = function(e) {
    e.preventDefault();
    
    // 💡 استخدام الإخفاء المباشر (display: none) لضمان عدم تضرر أي عنصر آخر
    if (actionRow.style.display === 'none') {
      actionRow.style.display = ''; // إرجاع الأزرار للظهور الطبيعي
      fab.innerHTML = '🔽 إخفاء الأزرار';
      fab.style.backgroundColor = '#5A2E99'; // لونك البنفسجي المعتمد
    } else {
      actionRow.style.display = 'none'; // إخفاء الأزرار فقط
      fab.innerHTML = '🛠️ إظهار الأزرار';
      fab.style.backgroundColor = '#3B1E63'; // لون الإغلاق الداكن
    }
  };

  // إدراج الزر داخل شاشة الدرجات ليعمل فقط وحصرياً بداخلها
  gradesScreen.appendChild(fab);
}

// تشغيل التهيئة التلقائية للزر بعد تحميل الواجهة
setTimeout(initGradesToolbarToggle, 500);

async function exportGradesPDF() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) { alert("الرجاء اختيار الصف الدراسي أولاً!"); return; }

  const classSelect = document.getElementById('grades-filter-class');
  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';
  const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
  const schoolMeta = document.getElementById('view-school-meta')?.textContent || `مادة ${subject} — شهر ${month}`;

  const ranked = await getRankedGrades(classId, subject, month);
  const sortedRows = [...ranked].sort((a, b) => a.student.name.localeCompare(b.student.name, 'ar'));

  const allChildren = document.body.children;
  const hiddenElements = [];
  for (let i = 0; i < allChildren.length; i++) {
    const el = allChildren[i];
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
      hiddenElements.push(el);
      el.style.display = 'none';
    }
  }

  window.scrollTo(0, 0);

  const printWrapper = document.createElement('div');
  printWrapper.id = 'temp-pdf-wrapper';
  printWrapper.style.backgroundColor = '#ffffff';
  printWrapper.style.width = '1120px'; // زيادة العرض الكلي لمنع أي ضغط
  printWrapper.style.minHeight = '100vh';
  printWrapper.style.direction = 'rtl';
  printWrapper.style.fontFamily = "'Cairo', sans-serif";
  printWrapper.style.padding = '20px';
  printWrapper.style.boxSizing = 'border-box';

  const loadingOverlay = document.createElement('div');
  loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
  loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
  loadingOverlay.innerHTML = `⏳ جاري ضبط الكشف (منع انقسام الأسطر وتصحيح الحدود)...<br><br>يرجى الانتظار ثواني قليلة.`;
  printWrapper.appendChild(loadingOverlay);

  // تم تصغير العرض الداخلي إلى 1040px لترك مساحة واسعة للحدود الخارجية (لن يتم قص التسطير أبداً)
  let htmlContent = `
    <div style="padding:20px; width:1040px; margin:0 auto; background:#fff; box-sizing:border-box;">
      <div style="text-align:center; margin-bottom:15px; border-bottom:3px double #5A2E99; padding-bottom:10px;">
        <h2 style="color:#3B1E63; margin:0 0 5px 0; font-weight:900; font-size:22px;">${schoolName}</h2>
        <p style="margin:0 0 5px 0; font-weight:bold; font-size:14px; color:#2D3748;">${schoolMeta}</p>
        <span style="background-color:#5A2E99; color:#fff; display:inline-block; padding:5px 15px; border-radius:4px; margin-top:5px; font-size:14px; font-weight:bold;">
          كشف درجات الطلاب الشهري: ${className}
        </span>
      </div>
      
      <table style="width:100%; border-collapse:collapse; font-size:15px; text-align:center; margin-top:10px; box-sizing:border-box;">
        <thead>
          <tr style="background-color:#3B1E63; color:#ffffff; page-break-inside: avoid;">
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:50px; color:#ffffff !important;">م</th>
            <th style="border:2px solid #3B1E63; padding:10px 8px; text-align:right; width:300px; color:#ffffff !important;">اسم الطالب</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">المواظبة</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">الواجبات</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">الشفوي</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">التحريري</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:110px; background-color:#2D134D; color:#ffffff !important;">المجموع (100)</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:110px; background-color:#1B5E20; color:#ffffff !important;">المحصلة (20)</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedRows.forEach((row, idx) => {
    const st = row.student;
    const g = row.grade;
    const total100 = row.total;
    const final20 = Math.round(total100 / 5);
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#F9F6FC';

    // 💡 السر الأول: إضافة (page-break-inside: avoid) لمنع قسم الصف إلى نصفين
    htmlContent += `
      <tr style="background-color:${rowBg}; page-break-inside: avoid;">
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${idx + 1}</td>
        <td style="border:2px solid #3B1E63; padding:8px 8px; text-align:right; font-weight:800; color:#1A202C;">${st.name}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.att || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.hw || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.oral || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.written || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:900; color:#B71C1C; background-color:#F5EFFC; font-size:16px;">${total100}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:900; font-size:18px; color:#1B5E20; background-color:#E8F5E9;">${final20}</td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
      <div style="margin-top:20px; text-align:left; font-size:13px; font-weight:bold; color:#5A2E99; page-break-inside: avoid;">
        تاريخ استخراج الكشف: ${new Date().toLocaleDateString('ar-YE')}
      </div>
    </div>
  `;

  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = htmlContent;
  printWrapper.appendChild(contentDiv);
  document.body.appendChild(printWrapper);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `كشف_درجات_${className}_${subject}_${month}_أبجدي.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, scrollX: 0, windowWidth: 1120 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['css', 'legacy'] } // 💡 السر الثاني: تفعيل الوضع المزدوج لفصل الصفحات
  };

  setTimeout(() => {
    window.scrollTo(0, 0); 
    html2pdf().set(opt).from(printWrapper).save().then(() => {
      document.body.removeChild(printWrapper);
      hiddenElements.forEach(el => el.style.display = '');
    }).catch(err => {
      console.error(err);
      document.body.removeChild(printWrapper);
      hiddenElements.forEach(el => el.style.display = '');
      alert("تعذر إنشاء ملف الـ PDF.");
    });
  }, 1000);
}


function exportCurrentReportToImage() {
  // 1. جلب العنصر الأصلي المعروض على الشاشة
  const reportElement = document.getElementById('monthly-attendance-area'); 
  
  if (!reportElement || reportElement.classList.contains('hidden')) {
    alert("تنبيه: يرجى عرض كشف الشهر على الشاشة أولاً قبل الضغط على الزر!");
    return;
  }

  // 2. جلب البيانات الديناميكية من القوائم المنسدلة للترويسة
  const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
  
  // جلب اسم الصف المحدد حالياً
  const classSelect = document.getElementById('attendance-filter-class') || document.getElementById('grades-filter-class');
  const className = classSelect ? (classSelect.options[classSelect.selectedIndex]?.text || '---') : '---';
  
  // جلب اسم الشهر المحدد حالياً (تأكد من مطابقة الـ ID لـ قائمة الأشهر عندك إذا وجدت)
  const monthSelect = document.getElementById('attendance-filter-month');
  const monthName = monthSelect ? (monthSelect.options[monthSelect.selectedIndex]?.text || 'الشهر الحالي') : 'الشهر الحالي';

  // 3. إنشاء حاوية مؤقتة عريضة جداً في الخلفية (خارج نطاق الشاشة)
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = 'max-content'; // يتسع تلقائياً لعرض الجدول بالكامل
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.direction = 'rtl';
  tempContainer.style.padding = '30px'; // مساحة أمان بيضاء حول الكشف
  tempContainer.style.fontFamily = "'Cairo', sans-serif";

  // 4. بناء ترويسة رسمية فخمة ومطابقة للهوية البنفسجية للتطبيق
  const headerDiv = document.createElement('div');
  headerDiv.style.width = '100%';
  headerDiv.style.marginBottom = '25px';
  headerDiv.style.borderBottom = '4px double #3B1E63';
  headerDiv.style.paddingBottom = '15px';
  
  headerDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; direction: rtl;">
      <div style="text-align: right;">
        <h2 style="color:#3B1E63; margin:0 0 6px 0; font-weight:900; font-size:24px;">${schoolName}</h2>
        <p style="margin:0; font-weight:bold; font-size:15px; color:#4A5568;">📚 المادة: اللغة الإنجليزية</p>
      </div>
      <div style="text-align: left; padding-left: 10px;">
        <p style="margin:0 0 6px 0; font-weight:bold; font-size:15px; color:#4A5568;">👨‍🏫 معلم المادة: أ. عبدالملك سعيد صالح</p>
        <p style="margin:0; font-weight:bold; font-size:15px; color:#4A5568;">🏫 الصف الدراسي: ${className}</p>
      </div>
    </div>
    <div style="text-align: center;">
      <h3 style="background-color:#5A2E99; color:#ffffff; display:inline-block; padding:8px 30px; border-radius:6px; margin:5px 0 0 0; font-size:18px; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        📊 كشف حضور وغياب الطلاب التراكمي لـ (${monthName})
      </h3>
    </div>
  `;

  // 5. عمل استنساخ عميق (Deep Clone) للكشف الحالي
  const clone = reportElement.cloneNode(true);
  
  // تنظيف النسخة المستنسخة من قيود التمرير والاختفاء لتظهر مفرودة بالكامل
  clone.classList.remove('table-scroll', 'hidden');
  clone.style.width = '100%';
  clone.style.overflow = 'visible';

  // إزالة أي عناوين h4 داخلية قد تتكرر مع الترويسة الجديدة (اختياري لجعل المظهر أنظف)
  const oldH4 = clone.querySelector('h4');
  if (oldH4) oldH4.remove();

  const internalTables = clone.querySelectorAll('table');
  internalTables.forEach(tbl => {
    tbl.style.width = '100%';
    tbl.style.tableLayout = 'auto';
    tbl.style.overflow = 'visible';
  });

  // 6. دمج الترويسة ثم الجدول داخل الحاوية المؤقتة، ثم إضافتها لصفحة التطبيق
  tempContainer.appendChild(headerDiv);
  tempContainer.appendChild(clone);
  document.body.appendChild(tempContainer);

  // 7. التقاط الصورة الشاملة (الترويسة + الجدول الكامل يميناً ويساراً)
  html2canvas(tempContainer, {
    scale: 2, // جودة خارقة وواضحة جداً عند القراءة والتكبير على الموبايل
    useCORS: true,
    backgroundColor: '#ffffff',
    width: tempContainer.scrollWidth,
    height: tempContainer.scrollHeight
  }).then(canvas => {
    const imgDataUrl = canvas.toDataURL('image/png');

    // حذف الحاوية المستنسخة فوراً لتنظيف الذاكرة
    document.body.removeChild(tempContainer);

    // 8. عرض النافذة المنبثقة الجميلة بالصورة الرسمية المتكاملة
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.padding = '15px';

    modal.innerHTML = `
      <div style="width:100%; max-width:500px; background:#fff; border-radius:12px; padding:15px; box-sizing:border-box; display:flex; flex-direction:column; max-height:90%;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:10px; margin-bottom:10px;">
          <span style="font-family:'Cairo'; font-weight:bold; color:#3B1E63;">📜 كشف رسمي جاهز للمشاركة</span>
          <button id="close-current-report-modal" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-family:'Cairo'; font-weight:bold; cursor:pointer;">إغلاق</button>
        </div>
        
        <div style="text-align:center; background:#EBF8FF; color:#2B6CB0; font-family:'Cairo'; font-size:12px; padding:6px; border-radius:6px; font-weight:bold; margin-bottom:10px;">
          ✨ مذهل! تم توليد الكشف بترويسة رسمية كاملة يميناً ويساراً. اضغط مطولاً لحفظه.
        </div>

        <div style="overflow-y:auto; flex:1; text-align:center; border:1px solid #E2E8F0; padding:5px; background:#f7fafc; border-radius:6px;">
          <img src="${imgDataUrl}" style="width:100%; height:auto; box-shadow:0 2px 5px rgba(0,0,0,0.15);" alt="كشف الشهر الرسمي كاملاً" />
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-current-report-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

  }).catch(err => {
    console.error("خطأ في تصدير الكشف الرسمي:", err);
    alert("عذراً، حدث خطأ أثناء تصدير الكشف.");
    if (tempContainer.parentNode) document.body.removeChild(tempContainer);
  });
}


// =====================================================
async function markAllAttendance(statusType) {
    // 1. جلب البيانات الأساسية المحددة في الشاشة حالياً
    const classId = parseInt(document.getElementById('attendance-filter-class').value);
    const month = document.getElementById('attendance-filter-month').value;
    const dateStr = document.getElementById('attendance-date-input').value;
    
    if (!classId || !dateStr) {
        alert('تنبيه: الرجاء اختيار الصف الدراسي وتاريخ اليوم أولاً!');
        return;
    }

    const tbody = document.getElementById('attendance-sheet-tbody');
    if (!tbody || tbody.children.length === 0) {
        alert('تنبيه: لا يوجد طلاب في الكشف حالياً لرصدهم!');
        return;
    }

    // 2. رسالة تأكيد مخصصة ومحكمة للمعلم
    const confirmMsg = statusType === 'present' 
        ? 'هل أنت متأكد من رصد جميع طلاب هذا الصف (حاضر) ليومنا هذا؟' 
        : 'هل أنت متأكد من رصد جميع طلاب هذا الصف (غائب) ليومنا هذا؟';
        
    if (!confirm(confirmMsg)) return;

    try {
        // 3. جلب أسماء الطلاب المقيدين في هذا الصف
        const students = await getStudentsByClass(classId);
        
        // 4. فتح معاملة سريعة في قاعدة البيانات لـ "الحفظ الجماعي" الصامت والسريع
        const tx = db.transaction('AttendanceDaily', 'readwrite');
        const store = tx.objectStore('AttendanceDaily');
        
        students.forEach(st => {
            const dailyKey = `${classId}_${dateStr}_${st.id}`;
            store.put({ id: dailyKey, status: statusType, month, classId, studentId: st.id });
        });
        
        // 5. عند نجاح الحفظ في قاعدة البيانات، نقوم بتحديث الشاشة فوراً
        tx.oncomplete = async () => {
            // استدعاء محرك النظام الأصلي لإعادة بناء الجدول بالألوان والرموز والدرجات الشهرية الجديدة!
            await loadAttendanceSheet();
            
            // تشغيل إشعار تم الحفظ الأخضر العلوي
            if (typeof triggerSaveIndicator === 'function') {
                triggerSaveIndicator();
            }
        };
        
        tx.onerror = (e) => {
            console.error("خطأ أثناء الحفظ الجماعي للحضور:", e.target.error);
            alert("حدث خلل أثناء محاولة الحفظ الجماعي.");
        };

    } catch (error) {
        console.error("خلل غير متوقع:", error);
    }
}

// دالة تصدير البيانات (تنزيل ملف النسخة الاحتياطية)
async function exportBackup() {
  try {
    // 1. تجميع كل البيانات من قاعدة البيانات
    const backupData = {
      BasicInfo: await dbGetAll('BasicInfo'),
      Classes: await dbGetAll('Classes'),
      Students: await dbGetAll('Students'),
      Grades: await dbGetAll('Grades'),
      GradesRecords: await dbGetAll('GradesRecords'),
      AttendanceDaily: await dbGetAll('AttendanceDaily')
    };

    // 2. تحويلها إلى نص يمكن حفظه
    const dataStr = JSON.stringify(backupData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    // 3. تحديد اسم الملف مع تاريخ اليوم
    const date = new Date().toISOString().split('T')[0];
    const exportFileDefaultName = `نسخة_احتياطية_مدرسة_حمير_${date}.json`;

    // 4. إنشاء رابط وهمي وتنزيل الملف تلقائياً
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    alert("✅ تم تنزيل النسخة الاحتياطية بنجاح! احتفظ بالملف في مكان آمن.");
  } catch (error) {
    console.error("خطأ في النسخ الاحتياطي:", error);
    alert("❌ حدث خطأ أثناء إعداد النسخة الاحتياطية.");
  }
}

// دالة استيراد البيانات (استعادة النسخة الاحتياطية)
function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  // تحذير المعلم قبل مسح البيانات الحالية
  if (!confirm("⚠️ تحذير شديد: استعادة النسخة الاحتياطية ستقوم بحذف بياناتك الحالية واستبدالها ببيانات الملف. هل أنت متأكد من الاستمرار؟")) {
    event.target.value = ''; // تصفير الملف في حال الرفض
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // التأكد من أن الملف سليم ويخص تطبيقنا
      if (!importedData.Classes || !importedData.Students) {
        alert("❌ عذراً، هذا الملف غير صالح أو لا يتبع لدفتر المعلم.");
        return;
      }

      // دالة مساعدة لتهيئة الجدول وإدراج البيانات الجديدة
      const clearAndPopulate = (storeName, dataArray) => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          // مسح البيانات القديمة
          store.clear().onsuccess = () => {
            // إضافة البيانات الجديدة
            if (dataArray && dataArray.length > 0) {
              dataArray.forEach(item => store.add(item));
            }
          };
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      };

      // تطبيق المسح والاستبدال على كافة الجداول
      await clearAndPopulate('BasicInfo', importedData.BasicInfo);
      await clearAndPopulate('Classes', importedData.Classes);
      await clearAndPopulate('Students', importedData.Students);
      await clearAndPopulate('Grades', importedData.Grades);
      if (importedData.GradesRecords) await clearAndPopulate('GradesRecords', importedData.GradesRecords);
      await clearAndPopulate('AttendanceDaily', importedData.AttendanceDaily);

      alert("✅ تمت استعادة البيانات بنجاح! سيتم الآن إعادة تشغيل التطبيق لتحديث الشاشات.");
      
      // إعادة تحميل الصفحة لتطبيق البيانات الجديدة فوراً
      window.location.reload();

    } catch (error) {
      console.error("خطأ في الاستعادة:", error);
      alert("❌ حدث خطأ أثناء قراءة الملف، تأكد من أنه لم يتعرض للتلف.");
    }
  };
  
  // قراءة الملف كنص
  reader.readAsText(file);
}
// ==========================================
// 💡 محرك سحب الدرجات الآلي (بتقنية Iframe Bridge لتجاوز حظر السيرفر المجاني)
// ==========================================
async function importElectronicExam() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) {
    alert("الرجاء اختيار الصف الدراسي أولاً لكي نسحب درجات طلابه.");
    return;
  }

  // 1. جلب رابط السيرفر الذي يدخله المعلم (أو المحفوظ مسبقاً)
  const savedUrl = localStorage.getItem('app_server_ip') || 'http://10.';
  let serverUrl = prompt("أدخل رابط السيرفر المحلي (كما يظهر في تطبيق Simple HTTP Server):", savedUrl);
  if (!serverUrl) return;
  
  serverUrl = serverUrl.replace(/\/$/, '');
  localStorage.setItem('app_server_ip', serverUrl);

  // 2. إنشاء "الجاسوس" (إطار مخفي) يتصل بملف bridge.html داخل السيرفر
  const bridgeIframe = document.createElement('iframe');
  bridgeIframe.style.display = 'none';
  bridgeIframe.src = serverUrl + '/bridge.html';
  document.body.appendChild(bridgeIframe);

  // 3. إظهار رسالة تحميل للمعلم
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#3B1E63; color:white; padding:15px 25px; border-radius:8px; z-index:99999; font-weight:bold; font-family:"Cairo";';
  loadingMsg.textContent = "جاري الاتصال بالسيرفر وتجاوز الحماية...";
  document.body.appendChild(loadingMsg);

  // 4. بناء مستمع للرسائل القادمة من الجاسوس (bridge.html)
  const messageHandler = async (event) => {
    // نتأكد أن الرسالة تخص الدرجات
    if (event.data.action === 'results_error') {
      document.body.removeChild(loadingMsg);
      document.body.removeChild(bridgeIframe);
      window.removeEventListener('message', messageHandler);
      alert("❌ تعذر جلب الدرجات من السيرفر. تأكد من عمل السيرفر ومن وجود ملف bridge.html داخله.");
      return;
    }

    if (event.data.action === 'results_data') {
      const examResults = event.data.data; // هذه هي الدرجات التي جلبها الجاسوس!
      
      document.body.removeChild(loadingMsg);
      document.body.removeChild(bridgeIframe);
      window.removeEventListener('message', messageHandler);

      if (!examResults || examResults.length === 0) {
        alert("لا توجد أي نتائج اختبارات إلكترونية مسجلة في السيرفر حالياً.");
        return;
      }

      const uniqueExams = [...new Set(examResults.map(r => r.examFile))].filter(Boolean);
      
      // 5. نافذة اختيار الاختبار
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; justify-content:center; align-items:center; padding:15px; direction:rtl; font-family:"Cairo",sans-serif;';
      
      let selectHtml = `<select id="choose-exam-to-import" style="width:100%; padding:12px; border-radius:8px; border:2px solid #3B1E63; font-size:15px; font-weight:bold; margin-bottom:15px;">`;
      uniqueExams.forEach(e => selectHtml += `<option value="${e}">${e.replace('.html', '')}</option>`);
      selectHtml += `</select>`;
      
      modal.innerHTML = `
        <div style="background:#fff; padding:25px; border-radius:12px; width:100%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
          <h3 style="color:#3B1E63; margin-top:0; margin-bottom:15px; font-weight:900;">📥 سحب الدرجات آلياً</h3>
          <p style="color:#166534; font-size:14px; margin-bottom:15px; font-weight:bold;">✅ تم تجاوز الحماية بنجاح. اختر الاختبار المراد سحبه:</p>
          ${selectHtml}
          <button id="btn-confirm-import" style="background:#16a34a; color:#fff; border:none; padding:12px; width:100%; border-radius:8px; font-weight:bold; font-size:15px; margin-bottom:10px; cursor:pointer;">✅ سحب واعتماد الدرجات</button>
          <button id="btn-cancel-import" style="background:#dc2626; color:#fff; border:none; padding:12px; width:100%; border-radius:8px; font-weight:bold; font-size:15px; cursor:pointer;">❌ إلغاء</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('btn-cancel-import').onclick = () => document.body.removeChild(modal);
            document.getElementById('btn-confirm-import').onclick = async () => {
        const selectedExam = document.getElementById('choose-exam-to-import').value;
        document.body.removeChild(modal); 
        
        const students = await getStudentsByClass(classId);
        let importedCount = 0;
        
        for (const st of students) {
          // المطابقة برقم الجلوس
          const studentExams = examResults.filter(r => r.examFile === selectedExam && String(r.studentId) === String(st.seatNumber || st.id));
          
          if (studentExams.length > 0) {
            // 💡 الحل الصارم: ترتيب المحاولات زمنياً (الأقدم أولاً) لاعتماد المحاولة الأولى فقط
            // قلبنا عملية الطرح ليكون الترتيب تصاعدياً (من الأقدم للأحدث)
            studentExams.sort((a,b) => a.timestamp - b.timestamp); 
            
            const firstAttempt = studentExams[0]; // 👈 سحب المحاولة الأولى فقط وتجاهل الباقي
            
            // تحويل الدرجة لنسبة 40 (درجة التحريري)
            let scaledScore = Math.round((firstAttempt.score / firstAttempt.total) * 40);
            if (scaledScore > 40) scaledScore = 40; // الحد الأقصى
            
            const recId = gradeRecordId(st.id, subject, month);
            let gradeRecord = await dbGet('GradesRecords', recId) || { id: recId, studentId: st.id, classId, subject, month, att: 0, hw: 0, oral: 0, written: 0 };
            gradeRecord.written = scaledScore;
            await dbPut('GradesRecords', gradeRecord);
            importedCount++;
          }
        }
        
        alert(`🎉 تمت العملية بنجاح!\n\nتم سحب درجات ( ${importedCount} ) طالب بصرامة (تم اعتماد المحاولة الأولى فقط للمكررين) وتحويلها لنسبة (40) في الكشف.`);
        loadGradesSheet();
        triggerSaveIndicator();
      };
    }
  };

  // تفعيل المستمع للرسائل
  window.addEventListener('message', messageHandler);

  // 6. أمر الجاسوس ببدء العمل بعد تحميل الإطار
  bridgeIframe.onload = () => {
    bridgeIframe.contentWindow.postMessage({ action: 'fetch_results' }, '*');
  };

  // مهلة للإلغاء إذا لم يرد السيرفر (انتهى الوقت)
  setTimeout(() => {
    if (document.body.contains(loadingMsg)) {
      document.body.removeChild(loadingMsg);
      if (document.body.contains(bridgeIframe)) document.body.removeChild(bridgeIframe);
      window.removeEventListener('message', messageHandler);
      alert("⏱️ انتهى وقت الاتصال. تأكد أن تطبيق Simple HTTP Server يعمل وأن الرابط المدخل صحيح.");
    }
  }, 10000);
}

// ==========================================
// 💡 محرك سحب درجات الواجبات المنزلية (بالتطابق المرن الفولاذي)
// ==========================================
async function importHomeworkResults() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) {
    alert("الرجاء اختيار الصف الدراسي أولاً لكي نسحب واجبات طلابه.");
    return;
  }

  const savedUrl = localStorage.getItem('app_server_ip') || 'http://10.';
  let serverUrl = prompt("أدخل رابط السيرفر المحلي:", savedUrl);
  if (!serverUrl) return;
  
  serverUrl = serverUrl.replace(/\/$/, '');
  localStorage.setItem('app_server_ip', serverUrl);

  const bridgeIframe = document.createElement('iframe');
  bridgeIframe.style.display = 'none';
  bridgeIframe.src = serverUrl + '/bridge.html';
  document.body.appendChild(bridgeIframe);

  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#10B981; color:white; padding:15px 25px; border-radius:8px; z-index:99999; font-weight:bold; font-family:"Cairo";';
  loadingMsg.textContent = "جاري الاتصال بالسيرفر للبحث عن الواجبات...";
  document.body.appendChild(loadingMsg);

  const messageHandler = async (event) => {
    if (event.data.action === 'results_error') {
      document.body.removeChild(loadingMsg);
      document.body.removeChild(bridgeIframe);
      window.removeEventListener('message', messageHandler);
      alert("❌ تعذر جلب الواجبات من السيرفر. تأكد من عمل السيرفر.");
      return;
    }

    if (event.data.action === 'results_data') {
      const allResults = event.data.data;
      
      document.body.removeChild(loadingMsg);
      document.body.removeChild(bridgeIframe);
      window.removeEventListener('message', messageHandler);

      if (!allResults || allResults.length === 0) {
        alert("لا توجد أي نتائج مسجلة في السيرفر حالياً.");
        return;
      }

      // 💡 الدالة الفولاذية لتوحيد النصوص (للمادة والشهر فقط)
      const normalizeText = (text) => {
          return String(text || '')
              .replace(/ال/g, '')         
              .replace(/\s+/g, '')        
              .replace(/[أإآا]/g, 'ا')   
              .replace(/ة/g, 'ه')         
              .replace(/[يى]/g, 'ي')     
              .trim();
      };

      // تصفية الواجبات لتطابق المادة والشهر
      const homeworks = allResults.filter(r => {
          if (r.type !== 'homework') return false;
          const isMonthMatch = normalizeText(r.month) === normalizeText(month);
          const isSubjectMatch = normalizeText(r.subject) === normalizeText(subject);
          return isMonthMatch && isSubjectMatch;
      });

      if (homeworks.length === 0) {
        alert(`لا توجد واجبات محلولة لمادة (${subject}) في شهر (${month}).\n(تأكد من أن الطلاب أرسلوا الواجبات بنجاح)`);
        return;
      }

      const uniqueDates = [...new Set(homeworks.map(h => {
         return h.timestamp ? h.timestamp.split('،')[0].trim() : 'تاريخ غير معروف';
      }))].filter(Boolean);
      
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; justify-content:center; align-items:center; padding:15px; direction:rtl; font-family:"Cairo",sans-serif;';
      
      let selectHtml = `<select id="choose-hw-date" style="width:100%; padding:12px; border-radius:8px; border:2px solid #10B981; font-size:15px; font-weight:bold; margin-bottom:15px;">`;
      uniqueDates.forEach(d => selectHtml += `<option value="${d}">واجبات تاريخ: ${d}</option>`);
      selectHtml += `<option value="all">كل واجبات الشهر (تجميع)</option>`;
      selectHtml += `</select>`;

      let methodHtml = `<select id="hw-apply-method" style="width:100%; padding:12px; border-radius:8px; border:2px solid #3B1E63; font-size:15px; font-weight:bold; margin-bottom:15px;">
        <option value="add">➕ إضافة للدرجة الحالية (تراكمي)</option>
        <option value="replace">🔄 استبدال الدرجة الحالية</option>
      </select>`;
      
      modal.innerHTML = `
        <div style="background:#fff; padding:25px; border-radius:12px; width:100%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
          <h3 style="color:#10B981; margin-top:0; margin-bottom:15px; font-weight:900;">🏠 سحب الواجبات المنزلية</h3>
          <p style="color:#374151; font-size:14px; margin-bottom:10px; font-weight:bold;">تم العثور على (${homeworks.length}) واجب. اختر التاريخ:</p>
          ${selectHtml}
          <p style="color:#374151; font-size:14px; margin-bottom:10px; font-weight:bold;">طريقة الرصد في عمود الواجب (الحد الأقصى 20):</p>
          ${methodHtml}
          <button id="btn-confirm-hw" style="background:#10B981; color:#fff; border:none; padding:12px; width:100%; border-radius:8px; font-weight:bold; font-size:15px; margin-bottom:10px; cursor:pointer;">✅ سحب ورصد الواجبات</button>
          <button id="btn-cancel-hw" style="background:#dc2626; color:#fff; border:none; padding:12px; width:100%; border-radius:8px; font-weight:bold; font-size:15px; cursor:pointer;">❌ إلغاء</button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('btn-cancel-hw').onclick = () => document.body.removeChild(modal);
      
      document.getElementById('btn-confirm-hw').onclick = async () => {
        const selectedDate = document.getElementById('choose-hw-date').value;
        const applyMethod = document.getElementById('hw-apply-method').value;
        document.body.removeChild(modal); 
        
        const students = await getStudentsByClass(classId);
        let importedCount = 0;
        
        for (const st of students) {
          // 💡 1. الاعتماد على رقم الجلوس بصرامة، وتخطي من ليس لديه رقم جلوس
          const stSeat = String(st.seatNumber || '').trim();
          if (!stSeat) continue; 

          // 💡 2. مطابقة رقم جلوس الطالب في الدفتر مع "student_id" القادم من الملف
          let studentHws = homeworks.filter(r => String(r.student_id || '').trim() === stSeat);
          
          if (selectedDate !== 'all') {
             studentHws = studentHws.filter(r => r.timestamp && r.timestamp.includes(selectedDate));
          }
          
          // 💡 3. معالجة التكرار: في حال وجود أكثر من ملف للطالب، نأخذ الأول فقط
          if (studentHws.length > 0) {
            // الترتيب الزمني للاحتياط
            studentHws.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
            
            const firstAttempt = studentHws[0]; // 👈 نأخذ الملف الأول ونهمل الباقي!
            const sumScore = parseFloat(firstAttempt.score) || 0;

            const recId = gradeRecordId(st.id, subject, month);
            let gradeRecord = await dbGet('GradesRecords', recId) || { id: recId, studentId: st.id, classId, subject, month, att: 0, hw: 0, oral: 0, written: 0 };
            
            let currentHw = parseFloat(gradeRecord.hw) || 0;
            let newHw = 0;

            if (applyMethod === 'add') {
                newHw = currentHw + sumScore;
            } else {
                newHw = sumScore;
            }

            if (newHw > 20) newHw = 20; // الحد الأقصى
            
            gradeRecord.hw = Math.round(newHw);
            await dbPut('GradesRecords', gradeRecord);
            importedCount++;
          }
        }
        
        alert(`🎉 تمت العملية بنجاح!\n\nتم سحب ورصد واجبات ( ${importedCount} ) طالب بصرامة.\n(تم الاعتماد على رقم الجلوس فقط، وتم أخذ نسخة واحدة للمكررين).`);
        loadGradesSheet();
        triggerSaveIndicator();
      };
    }
  };

  window.addEventListener('message', messageHandler);

  bridgeIframe.onload = () => {
    bridgeIframe.contentWindow.postMessage({ action: 'fetch_results' }, '*');
  };

  setTimeout(() => {
    if (document.body.contains(loadingMsg)) {
      document.body.removeChild(loadingMsg);
      if (document.body.contains(bridgeIframe)) document.body.removeChild(bridgeIframe);
      window.removeEventListener('message', messageHandler);
      alert("⏱️ انتهى وقت الاتصال. تأكد أن السيرفر يعمل.");
    }
  }, 10000);
}


// 11. كشف النتائج الجماعي المزخرف (الترتيب + التهنئة + العتاب)
// ==========================================
function closeDynamicModal(modalEl) {
  if (modalEl && modalEl.parentNode) document.body.removeChild(modalEl);
}
async function openGroupResults() {
  const { classId, subject, month } = getCurrentGradesContext();
  if (!classId) { alert("الرجاء اختيار الصف الدراسي أولاً!"); return; }

  const ranked = await getRankedGrades(classId, subject, month);
  if (ranked.length === 0) { alert("لا يوجد طلاب في هذا الصف لعرض النتائج!"); return; }

  const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
  const teacherName = await getTeacherDisplayName();
  const classSelect = document.getElementById('grades-filter-class');
  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';
  const classAverage = Math.round(ranked.reduce((s, r) => s + r.total, 0) / ranked.length);
  const allRecords = await dbGetAll('GradesRecords');

  // بناء منصة التتويج
  const podiumOrder = [1, 0, 2];
  const top3 = ranked.slice(0, 3);
  const podiumHeights = ['70px', '95px', '55px'];
  const podiumMedals = ['🥈', '🥇', '🥉'];
  let podiumHtml = '';
  if (top3.length > 0) {
    podiumHtml = `<div style="display:flex; align-items:flex-end; justify-content:center; gap:8px; margin:16px 0 20px;">`;
    podiumOrder.forEach((origIdx, visualIdx) => {
      const entry = top3[origIdx];
      if (!entry) return;
      podiumHtml += `
        <div style="flex:1; max-width:120px; text-align:center;">
          <div style="font-size:26px;">${podiumMedals[visualIdx]}</div>
          <div style="font-weight:900; font-size:12px; color:#3B1E63; margin:2px 0; min-height:32px; overflow:hidden;">${entry.student.name}</div>
          <div style="font-weight:900; font-size:13px; color:#B71C1C;">${entry.total}</div>
          <div style="background:linear-gradient(180deg,#9B63E6,#3B1E63); height:${podiumHeights[visualIdx]}; border-radius:8px 8px 0 0; margin-top:4px;"></div>
        </div>`;
    });
    podiumHtml += `</div>`;
  }

  // بناء جدول النتائج مضافاً إليه مربعات التحديد للواجهة
  let rowsHtml = '';
  ranked.forEach(({ student: st, total, rank }, idx) => {
    const remark = getResultRemark(total, rank, ranked.length);
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#F9F6FC';
    rowsHtml += `
      <tr style="text-align:center; background-color:${rowBg};">
        <td class="checkbox-col" style="border:2px solid #3B1E63; padding:7px 4px;">
          <input type="checkbox" class="student-select-cb" value="${st.id}" style="transform:scale(1.4); cursor:pointer;">
        </td>
        <td style="border:2px solid #3B1E63; padding:7px 4px; font-weight:900;">${rank}</td>
        <td style="border:2px solid #3B1E63; padding:7px 8px; text-align:right; font-weight:800; color:#1A202C;">${st.name}</td>
        <td style="border:2px solid #3B1E63; padding:7px 4px; font-weight:900; color:#B71C1C;">${total}</td>
        <td style="border:2px solid #3B1E63; padding:7px 4px; font-size:12px; font-weight:bold;">${remark.icon} ${remark.label}</td>
      </tr>`;
  });

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:12px; box-sizing:border-box; direction:rtl; font-family:"Cairo",sans-serif;';

  modal.innerHTML = `
    <div style="width:100%; max-width:560px; max-height:92%; background:#fff; border-radius:14px; padding:14px; box-sizing:border-box; display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:8px; margin-bottom:8px;">
        <span style="font-weight:900; color:#3B1E63; font-size:15px;">📢 كشف النتائج (مع أداة البطاقات)</span>
        <button id="close-group-results" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-weight:bold; cursor:pointer;">إغلاق</button>
      </div>

      <div id="group-results-capture" style="overflow-y:auto; flex:1; background:#fff; padding:5px;">
        <div style="text-align:center; background:linear-gradient(135deg,#3B1E63,#5A2E99); color:#fff; padding:14px 10px; border-radius:12px;">
          <h2 style="margin:0 0 4px; font-weight:900; font-size:18px;">${schoolName}</h2>
          <p style="margin:0; font-size:12px; font-weight:bold; opacity:0.9;">كشف نتائج الطلاب — ${className} — مادة ${subject}</p>
        </div>

        ${podiumHtml}

        <div id="capture-hint" style="background:#EBF8FF; color:#01579B; padding:8px; border-radius:6px; margin-top:10px; font-size:12px; font-weight:bold; text-align:center; border:1px solid #BEE3F8;">
          💡 ضع (✅) للطلاب المراد طباعة بطاقاتهم الفردية عبر الزر الأخضر بالأسفل.
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-top:10px;">
          <thead>
            <tr style="background-color:#3B1E63; color:#fff;">
              <th class="checkbox-col" style="border:2px solid #3B1E63; padding:7px 4px; width:40px;">
                <input type="checkbox" id="selectAllStudents" style="transform:scale(1.4); cursor:pointer;" title="تحديد الكل">
              </th>
              <th style="border:2px solid #3B1E63; padding:7px 4px; color:#fff !important;">الترتيب</th>
              <th style="border:2px solid #3B1E63; padding:7px 8px; color:#fff !important;">اسم الطالب</th>
              <th style="border:2px solid #3B1E63; padding:7px 4px; color:#fff !important;">المجموع</th>
              <th style="border:2px solid #3B1E63; padding:7px 4px; color:#fff !important;">التقدير</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
        <button id="save-group-list-img" style="flex:1; min-width:45%; background:#5A2E99; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">📸 تصدير الكشف (صورة)</button>
        <button id="save-selected-pdf" style="flex:1; min-width:45%; background:#10B981; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">🖨️ بطاقات المحددين (PDF)</button>
        <button id="copy-group-results-text" style="flex:1; min-width:100%; background:#01579B; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">📋 نسخ النتائج كنص</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('close-group-results').onclick = () => closeDynamicModal(modal);

  // 1. تحديد الكل
  document.getElementById('selectAllStudents').onchange = function(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.student-select-cb').forEach(cb => cb.checked = isChecked);
  };

  // 2. 💡 الكود الجديد والفولاذي لتصدير الصورة بالكامل بدون بتر 💡
  document.getElementById('save-group-list-img').onclick = () => {
    
    // إخفاء التطبيق مؤقتاً
    const allChildren = document.body.children;
    const hiddenElements = [];
    for (let i = 0; i < allChildren.length; i++) {
      const el = allChildren[i];
      if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
        hiddenElements.push(el);
        el.style.display = 'none';
      }
    }

    // بناء حاوية التصوير مفرودة بالكامل
    const printWrapper = document.createElement('div');
    printWrapper.style.backgroundColor = '#ffffff';
    printWrapper.style.width = '1000px'; 
    printWrapper.style.minHeight = '100vh';
    printWrapper.style.direction = 'rtl';
    printWrapper.style.fontFamily = "'Cairo', sans-serif";
    printWrapper.style.padding = '20px';
    printWrapper.style.boxSizing = 'border-box';
    printWrapper.style.position = 'absolute';
    printWrapper.style.top = '0';
    printWrapper.style.right = '0';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
    loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
    loadingOverlay.innerHTML = `⏳ جاري التقاط الصورة الكاملة للكشف...<br><br>يرجى الانتظار ثواني قليلة.`;
    printWrapper.appendChild(loadingOverlay);

    // بناء الأسطر نظيفة من المربعات للصورة الرسمية
    let cleanRowsHtml = '';
    ranked.forEach(({ student: st, total, rank }, idx) => {
      const remark = getResultRemark(total, rank, ranked.length);
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#F9F6FC';
      cleanRowsHtml += `
        <tr style="text-align:center; background-color:${rowBg};">
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:900; font-size:16px;">${rank}</td>
          <td style="border:2px solid #3B1E63; padding:10px 8px; text-align:right; font-weight:900; font-size:16px; color:#1A202C;">${st.name}</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:900; font-size:18px; color:#B71C1C;">${total}</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-size:14px; font-weight:bold;">${remark.icon} ${remark.label}</td>
        </tr>`;
    });

    let htmlContent = `
      <div style="padding:20px; width:900px; margin:0 auto; background:#fff; box-sizing:border-box;" id="image-capture-area">
        <div style="text-align:center; background:linear-gradient(135deg,#3B1E63,#5A2E99); color:#fff; padding:20px 10px; border-radius:12px; margin-bottom: 20px;">
          <h2 style="margin:0 0 8px; font-weight:900; font-size:24px;">${schoolName}</h2>
          <p style="margin:0; font-size:16px; font-weight:bold; opacity:0.9;">كشف نتائج الطلاب — ${className} — مادة ${subject}</p>
        </div>

        ${podiumHtml}

        <table style="width:100%; border-collapse:collapse; margin-top:20px; box-sizing:border-box;">
          <thead>
            <tr style="background-color:#3B1E63; color:#fff;">
              <th style="border:2px solid #3B1E63; padding:12px 4px; width:80px; color:#fff !important; font-size:16px;">الترتيب</th>
              <th style="border:2px solid #3B1E63; padding:12px 8px; color:#fff !important; font-size:16px;">اسم الطالب</th>
              <th style="border:2px solid #3B1E63; padding:12px 4px; width:120px; color:#fff !important; font-size:16px;">المجموع</th>
              <th style="border:2px solid #3B1E63; padding:12px 4px; width:200px; color:#fff !important; font-size:16px;">التقدير</th>
            </tr>
          </thead>
          <tbody>${cleanRowsHtml}</tbody>
        </table>
        
        <div style="margin-top:25px; text-align:left; font-size:14px; color:#5A2E99; font-weight:bold;">
          📆 تاريخ الإصدار: ${new Date().toLocaleDateString('ar-YE')}
        </div>
      </div>
    `;

    printWrapper.innerHTML += htmlContent;
    document.body.appendChild(printWrapper);

    // أمر رفع الشاشة والتأخير للتصوير الدقيق
    setTimeout(() => {
      window.scrollTo(0, 0);
      const captureArea = document.getElementById('image-capture-area');
      html2canvas(captureArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0,
        windowWidth: 1000
      }).then(canvas => {
        const imgDataUrl = canvas.toDataURL('image/png');
        document.body.removeChild(printWrapper);
        hiddenElements.forEach(el => el.style.display = '');

        const imgModal = document.createElement('div');
        imgModal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:15px;';

        imgModal.innerHTML = `
          <div style="width:100%; max-width:600px; background:#fff; border-radius:12px; padding:15px; box-sizing:border-box; display:flex; flex-direction:column; max-height:90%;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:10px; margin-bottom:10px;">
              <span style="font-family:'Cairo'; font-weight:bold; color:#3B1E63;">📸 صورة الكشف المزخرف جاهزة</span>
              <button id="close-img-modal" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-family:'Cairo'; font-weight:bold; cursor:pointer;">إغلاق</button>
            </div>
            <div style="text-align:center; background:#EBF8FF; color:#2B6CB0; font-family:'Cairo'; font-size:12px; padding:6px; border-radius:6px; font-weight:bold; margin-bottom:10px;">
              💡 اضغط مطولاً على الصورة لحفظها، وهي الآن تضم كافة الطلاب.
            </div>
            <div style="overflow-y:auto; flex:1; text-align:center; border:1px solid #E2E8F0; padding:5px; background:#f7fafc; border-radius:6px;">
              <img src="${imgDataUrl}" style="width:100%; height:auto; box-shadow:0 2px 5px rgba(0,0,0,0.15);" alt="كشف النتائج" />
            </div>
          </div>
        `;

        document.body.appendChild(imgModal);
        document.getElementById('close-img-modal').addEventListener('click', () => document.body.removeChild(imgModal));

      }).catch(err => {
        document.body.removeChild(printWrapper);
        hiddenElements.forEach(el => el.style.display = '');
        alert("عذراً، حدث خطأ أثناء تصدير الصورة.");
      });
    }, 1000);
  };

  // 3. تصدير بطاقات المحددين (PDF)
  document.getElementById('save-selected-pdf').onclick = () => {
    const selectedCbs = document.querySelectorAll('.student-select-cb:checked');
    if (selectedCbs.length === 0) {
      alert("⚠️ الرجاء وضع إشارة (تحديد) أمام طالب واحد على الأقل لتصدير بطاقته.");
      return;
    }

    const selectedIds = Array.from(selectedCbs).map(cb => String(cb.value));
    const selectedStudents = ranked.filter(r => selectedIds.includes(String(r.student.id)));

    const allChildren = document.body.children;
    const hiddenElements = [];
    for (let i = 0; i < allChildren.length; i++) {
      const el = allChildren[i];
      if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
        hiddenElements.push(el);
        el.style.display = 'none';
      }
    }

    const printWrapper = document.createElement('div');
    printWrapper.id = 'temp-pdf-wrapper';
    printWrapper.style.backgroundColor = '#ffffff';
    printWrapper.style.width = '100%';
    printWrapper.style.minHeight = '100vh';
    printWrapper.style.direction = 'rtl';
    printWrapper.style.fontFamily = "'Cairo', sans-serif";
    printWrapper.style.padding = '10px';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
    loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
    loadingOverlay.innerHTML = `⏳ جاري معالجة وتصدير (${selectedStudents.length}) بطاقات بدقة عالية...<br><br>يرجى الانتظار ثواني قليلة وعدم إغلاق التطبيق.`;
    printWrapper.appendChild(loadingOverlay);

    selectedStudents.forEach(({ student: st, grade: g, total, rank }, index) => {
      const history = allRecords
        .filter(r => r.studentId === st.id && r.subject === subject)
        .map(r => ({ month: r.month, total: (r.att||0)+(r.hw||0)+(r.oral||0)+(r.written||0) }))
        .sort((a, b) => ARABIC_MONTHS_ORDER.indexOf(a.month) - ARABIC_MONTHS_ORDER.indexOf(b.month));

      const cardDiv = document.createElement('div');
      cardDiv.style.padding = '15px';
      cardDiv.style.backgroundColor = '#ffffff';
      
      if (index > 0) {
        cardDiv.style.pageBreakBefore = 'always';
      }
      
      cardDiv.innerHTML = buildDecoratedResultCardHtml({
        studentName: st.name, subject, month, schoolName, teacherName,
        g, total, rank, totalStudents: ranked.length, classAverage, history
      });
      printWrapper.appendChild(cardDiv);
    });

    document.body.appendChild(printWrapper);

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `بطاقات_${selectedStudents.length}_طلاب_${className}_${month}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'] }
    };

    setTimeout(() => {
      html2pdf().set(opt).from(printWrapper).save().then(() => {
        document.body.removeChild(printWrapper);
        hiddenElements.forEach(el => el.style.display = ''); 
      }).catch(err => {
        document.body.removeChild(printWrapper);
        hiddenElements.forEach(el => el.style.display = '');
        alert("تعذر التصدير. جرب تحديد عدد أقل من الطلاب.");
      });
    }, 1000); 
  };

  // 4. برمجة زر نسخ النص السريع
  document.getElementById('copy-group-results-text').onclick = () => {
    let text = `📢 نتائج ${className} — مادة ${subject} — شهر ${month}\n\n`;
    ranked.forEach(({ student: st, total, rank }) => {
      const remark = getResultRemark(total, rank, ranked.length);
      text += `${rank}. ${st.name} — ${total}/100 ${remark.icon} ${remark.label}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ تم نسخ الكشف كنص بنجاح، يمكنك لصقه وإرساله في واتساب.");
    }).catch(() => alert("تعذر النسخ، يرجى المحاولة يدوياً."));
  };
}

async function openMonthlyAnalysis() {
  try {
    const { classId, subject } = getCurrentGradesContext();
    if (!classId) { alert("الرجاء اختيار الصف الدراسي أولاً!"); return; }

    const students = await getStudentsByClass(classId);
    const allRecords = await dbGetAll('GradesRecords');
    
    // 💡 السر الأول: المطابقة الفولاذية بتحويل النوعين إلى نصوص لمنع الخطأ الصامت
    const classSubjectRecords = allRecords.filter(r => String(r.classId) === String(classId) && String(r.subject) === String(subject));

    const monthsPresent = ARABIC_MONTHS_ORDER.filter(m => classSubjectRecords.some(r => r.month === m));

    if (monthsPresent.length === 0) {
      alert("⚠️ لا توجد أي درجات مرصودة حتى الآن لهذه المادة لإجراء التحليل الشهري (يرجى رصد بعض الدرجات أولاً).");
      return;
    }

    const monthlyStats = monthsPresent.map(m => {
      const recs = classSubjectRecords.filter(r => r.month === m);
      const totals = students.map(st => {
        const g = recs.find(r => String(r.studentId) === String(st.id));
        if (!g) return null; // الطالب الذي ليس له درجة في هذا الشهر يتم تجاهله إحصائياً
        return { 
            name: st.name, 
            total: (parseInt(g.att)||0)+(parseInt(g.hw)||0)+(parseInt(g.oral)||0)+(parseInt(g.written)||0) 
        };
      }).filter(t => t !== null);

      const count = totals.length;
      const avg = count ? Math.round(totals.reduce((s, t) => s + t.total, 0) / count) : 0;
      const passCount = totals.filter(t => t.total >= 50).length;
      const passRate = count ? Math.round((passCount / count) * 100) : 0;
      
      // الترتيب لمعرفة الأول على الفصل هذا الشهر
      const sortedTotals = totals.slice().sort((a, b) => b.total - a.total);
      const top = sortedTotals[0];
      const weakCount = totals.filter(t => t.total < 50).length;
      
      return { month: m, avg, passRate, count, top, weakCount };
    });

    const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
    const classSelect = document.getElementById('grades-filter-class');
    const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';

    // بناء الأعمدة البيانية للتطور
    let barsHtml = `<div style="display:flex; align-items:flex-end; gap:12px; height:140px; background:#F6F3FA; border-radius:10px; padding:12px; overflow-x:auto;">`;
    monthlyStats.forEach(s => {
      barsHtml += `
        <div style="min-width:60px; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
          <span style="font-size:13px; font-weight:900; color:#3B1E63;">${s.avg}</span>
          <div style="width:34px; background:linear-gradient(180deg,#9B63E6,#3B1E63); border-radius:5px 5px 0 0; height:${Math.max(10, (s.avg / 100) * 100)}px;"></div>
          <span style="font-size:12px; color:#4A5568; margin-top:6px; font-weight:800;">${s.month}</span>
        </div>`;
    });
    barsHtml += `</div>`;

    // بناء جدول التحليل بالأرقام
    let rowsHtml = '';
    monthlyStats.forEach((s, idx) => {
      const prev = monthlyStats[idx - 1];
      let trend = '—';
      let trendColor = '#2D3748';
      if (prev) {
        if (s.avg > prev.avg) { trend = `▲ تحسّن (+${s.avg - prev.avg})`; trendColor = '#1B5E20'; } // أخضر
        else if (s.avg < prev.avg) { trend = `▼ تراجع (-${prev.avg - s.avg})`; trendColor = '#B71C1C'; } // أحمر
        else { trend = '⟶ ثابت'; }
      }
      rowsHtml += `
        <tr style="text-align:center; background-color: ${idx % 2 === 0 ? '#ffffff' : '#F9F6FC'};">
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:900; font-size:15px;">${s.month}</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:bold;">${s.count}</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:900; color:#3B1E63; font-size:18px;">${s.avg}</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:900; color:#1B5E20; font-size:15px;">${s.passRate}%</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-weight:900; color:#B71C1C; font-size:15px;">${s.weakCount}</td>
          <td style="border:2px solid #3B1E63; padding:10px 8px; text-align:right; font-weight:bold;">${s.top ? `🥇 ${s.top.name} <span style="color:#B71C1C; font-weight:900;">(${s.top.total})</span>` : '—'}</td>
          <td style="border:2px solid #3B1E63; padding:10px 4px; font-size:13px; font-weight:900; color:${trendColor};" dir="rtl">${trend}</td>
        </tr>`;
    });

    // إنشاء النافذة المنبثقة التفاعلية
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; display:flex; justify-content:center; align-items:center; padding:12px; box-sizing:border-box; direction:rtl; font-family:"Cairo",sans-serif;';

    modal.innerHTML = `
      <div style="width:100%; max-width:700px; max-height:95%; background:#fff; border-radius:14px; padding:15px; box-sizing:border-box; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:10px; margin-bottom:10px;">
          <span style="font-weight:900; color:#3B1E63; font-size:16px;">📈 تحليل وتطور النتائج الشهرية</span>
          <button id="close-monthly-analysis" style="background:#B71C1C; color:#fff; border:none; padding:6px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">إغلاق</button>
        </div>

        <div id="monthly-analysis-capture" style="overflow-y:auto; flex:1; background:#fff; padding:10px; border-radius:8px;">
          <div style="text-align:center; margin-bottom:15px; background:linear-gradient(135deg,#3B1E63,#5A2E99); color:#fff; padding:15px 10px; border-radius:12px;">
            <h3 style="margin:0 0 5px; font-weight:900; font-size:20px;">${schoolName}</h3>
            <p style="margin:0; font-size:14px; font-weight:bold; opacity:0.9;">التحليل الإحصائي لتطور الأداء — ${className} — مادة ${subject}</p>
          </div>

          ${barsHtml}

          <div style="margin-top:15px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <thead>
                <tr style="background-color:#3B1E63; color:#fff;">
                  <th style="border:2px solid #3B1E63; padding:10px 4px; color:#fff !important;">الشهر</th>
                  <th style="border:2px solid #3B1E63; padding:10px 4px; color:#fff !important;">المرصودين</th>
                  <th style="border:2px solid #3B1E63; padding:10px 4px; color:#fff !important;">المعدل العام</th>
                  <th style="border:2px solid #3B1E63; padding:10px 4px; color:#fff !important;">النجاح</th>
                  <th style="border:2px solid #3B1E63; padding:10px 4px; color:#fff !important;">دون 50</th>
                  <th style="border:2px solid #3B1E63; padding:10px 8px; color:#fff !important;">الأول على الفصل</th>
                  <th style="border:2px solid #3B1E63; padding:10px 4px; color:#fff !important;">مؤشر التطور</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
          <div style="margin-top:20px; text-align:left; font-size:13px; font-weight:bold; color:#5A2E99;">
              📆 تاريخ التحليل: ${new Date().toLocaleDateString('ar-YE')}
          </div>
        </div>

        <div style="display:flex; gap:8px; margin-top:15px;">
          <button id="save-monthly-analysis-img" style="flex:1; background:#10B981; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:900; cursor:pointer; font-size:15px;">📸 تصدير التحليل كصورة رسمية</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    document.getElementById('close-monthly-analysis').onclick = () => {
       if (modal.parentNode) document.body.removeChild(modal);
    };
    
    // 💡 السر الثاني: تصدير التحليل كصورة فولاذية لا تُقص ولا تفقد ألوانها
    document.getElementById('save-monthly-analysis-img').onclick = () => {
        // إخفاء الواجهة
        const allChildren = document.body.children;
        const hiddenElements = [];
        for (let i = 0; i < allChildren.length; i++) {
          const el = allChildren[i];
          if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
            hiddenElements.push(el);
            el.style.display = 'none';
          }
        }
        
        window.scrollTo(0, 0);

        const printWrapper = document.createElement('div');
        printWrapper.style.backgroundColor = '#ffffff';
        printWrapper.style.width = '1000px'; 
        printWrapper.style.minHeight = '100vh';
        printWrapper.style.direction = 'rtl';
        printWrapper.style.fontFamily = "'Cairo', sans-serif";
        printWrapper.style.padding = '20px';
        printWrapper.style.position = 'absolute';
        printWrapper.style.top = '0';
        printWrapper.style.right = '0';

        const loadingOverlay = document.createElement('div');
        loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
        loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
        loadingOverlay.innerHTML = `⏳ جاري التقاط صورة التحليل الإحصائي...<br><br>يرجى الانتظار ثواني قليلة.`;
        printWrapper.appendChild(loadingOverlay);

        // سحب محتوى الكشف الداخلي واستنساخه للطباعة
        const captureHtml = document.getElementById('monthly-analysis-capture').innerHTML;
        const contentDiv = document.createElement('div');
        contentDiv.id = 'temp-image-capture-area';
        contentDiv.innerHTML = captureHtml;
        contentDiv.style.background = '#ffffff';
        contentDiv.style.padding = '20px';
        contentDiv.style.boxSizing = 'border-box';
        contentDiv.style.width = '940px'; 
        contentDiv.style.margin = '0 auto';
        
        printWrapper.appendChild(contentDiv);
        document.body.appendChild(printWrapper);

        setTimeout(() => {
            window.scrollTo(0, 0);
            const targetArea = document.getElementById('temp-image-capture-area');
            html2canvas(targetArea, {
              scale: 2, 
              useCORS: true,
              backgroundColor: '#ffffff',
              scrollY: 0,
              scrollX: 0,
              windowWidth: 1000
            }).then(canvas => {
              const imgDataUrl = canvas.toDataURL('image/png');
              document.body.removeChild(printWrapper);
              hiddenElements.forEach(el => el.style.display = '');

              const imgModal = document.createElement('div');
              imgModal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:15px;';
              imgModal.innerHTML = `
                <div style="width:100%; max-width:600px; background:#fff; border-radius:12px; padding:15px; box-sizing:border-box; display:flex; flex-direction:column; max-height:90%;">
                  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:10px; margin-bottom:10px;">
                    <span style="font-family:'Cairo'; font-weight:bold; color:#3B1E63;">📸 صورة التحليل جاهزة</span>
                    <button id="close-img-modal" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-family:'Cairo'; font-weight:bold; cursor:pointer;">إغلاق</button>
                  </div>
                  <div style="text-align:center; background:#EBF8FF; color:#2B6CB0; font-family:'Cairo'; font-size:12px; padding:6px; border-radius:6px; font-weight:bold; margin-bottom:10px;">
                    💡 اضغط مطولاً على الصورة لحفظها بجهازك.
                  </div>
                  <div style="overflow-y:auto; flex:1; text-align:center; border:1px solid #E2E8F0; padding:5px; background:#f7fafc; border-radius:6px;">
                    <img src="${imgDataUrl}" style="width:100%; height:auto; box-shadow:0 2px 5px rgba(0,0,0,0.15);" alt="تحليل الإحصائيات" />
                  </div>
                </div>
              `;
              document.body.appendChild(imgModal);
              document.getElementById('close-img-modal').addEventListener('click', () => {
                  if(imgModal.parentNode) document.body.removeChild(imgModal);
              });
            }).catch(err => {
              console.error(err);
              alert("تعذر استخراج الصورة.");
              document.body.removeChild(printWrapper);
              hiddenElements.forEach(el => el.style.display = '');
            });
        }, 1000);
    };

  } catch (err) {
    console.error("خطأ في التحليل الشهري:", err);
    alert("حدث خطأ غير متوقع أثناء معالجة البيانات الإحصائية.");
  }
}

// =====================================================
// 🎯 نظام القوائم المنسدلة لإدارة الإجراءات بذكاء
// =====================================================

// دالة تشغيل إجراءات شاشة الدرجات
window.executeGradesAction = function(selectElement) {
    const action = selectElement.value;
    if (!action) return;

    switch(action) {
        case 'import_exams': importElectronicExam(); break;
        case 'import_hw': importHomeworkResults(); break;
        case 'report_summary': toggleGradesReport(); break;
        case 'monthly_analysis': openMonthlyAnalysis(); break;
        case 'group_results': openGroupResults(); break;
        case 'image': exportGradesToImage(); break;
        case 'pdf_month': exportGradesPDF('month'); break;
        case 'pdf_students': exportAllStudentsResultsPDF(); break;
        case 'pdf_all': exportGradesPDF('all'); break;
        case 'excel': exportGradesExcel(); break;
    }

    // إعادة القائمة لحالتها الافتراضية بعد تنفيذ الأمر
    selectElement.value = "";
};

// دالة تشغيل إجراءات شاشة الحضور والغياب
window.executeAttendanceAction = function(selectElement) {
    const action = selectElement.value;
    if (!action) return;

    switch(action) {
        case 'toggle_view': toggleAttendanceView(); break;
        case 'image_absence': exportCurrentReportToImage(); break;
        case 'pdf': exportAttendancePDFReport(); break;
        case 'excel': exportAttendanceExcel(); break;
    }

    // إعادة القائمة لحالتها الافتراضية بعد تنفيذ الأمر
    selectElement.value = "";
};
async function exportGradesToImage() {
  const classSelect = document.getElementById('grades-filter-class');
  const classId = classSelect ? parseInt(classSelect.value) : null;
  if (!classId) { alert("الرجاء اختيار الصف الدراسي أولاً!"); return; }

  const className = classSelect.options[classSelect.selectedIndex]?.text || 'الصف';
  const schoolName = document.getElementById('view-school-name')?.textContent || 'مدرسة حمير النموذجية';
  const schoolMeta = document.getElementById('view-school-meta')?.textContent || '';
  const { subject, month } = getCurrentGradesContext();

  const ranked = await getRankedGrades(classId, subject, month);
  if (!ranked || ranked.length === 0) { alert("لا يوجد طلاب مضافين في هذا الصف!"); return; }

  const sortedRows = [...ranked].sort((a, b) => a.student.name.localeCompare(b.student.name, 'ar'));

  const allChildren = document.body.children;
  const hiddenElements = [];
  for (let i = 0; i < allChildren.length; i++) {
    const el = allChildren[i];
    if (el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && el.style.display !== 'none') {
      hiddenElements.push(el);
      el.style.display = 'none';
    }
  }

  window.scrollTo(0, 0);

  const printWrapper = document.createElement('div');
  printWrapper.style.backgroundColor = '#ffffff';
  printWrapper.style.width = '1120px'; // مساحة أمان للحدود
  printWrapper.style.minHeight = '100vh';
  printWrapper.style.direction = 'rtl';
  printWrapper.style.fontFamily = "'Cairo', sans-serif";
  printWrapper.style.padding = '20px';
  printWrapper.style.boxSizing = 'border-box';

  const loadingOverlay = document.createElement('div');
  loadingOverlay.setAttribute('data-html2canvas-ignore', 'true');
  loadingOverlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(59,30,99,0.98); color:white; display:flex; justify-content:center; align-items:center; z-index:9999999; font-weight:bold; font-size:16px; font-family:"Cairo"; text-align:center; padding:20px;';
  loadingOverlay.innerHTML = `⏳ جاري التقاط صورة الكشف بأطراف آمنة...<br><br>يرجى الانتظار ثواني قليلة.`;
  printWrapper.appendChild(loadingOverlay);

  let htmlContent = `
    <div style="padding:20px; width:1040px; margin:0 auto; background:#fff; box-sizing:border-box;" id="image-capture-area">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 4px double #3B1E63; padding-bottom: 15px; direction: rtl;">
        <div style="text-align: right;">
          <h2 style="color:#3B1E63; margin:0 0 6px 0; font-weight:900; font-size:24px;">${schoolName}</h2>
          ${schoolMeta ? `<p style="margin:0 0 6px 0; font-weight:bold; font-size:14px; color:#4A5568;">${schoolMeta}</p>` : ''}
          <p style="margin:0; font-weight:bold; font-size:15px; color:#4A5568;">📚 المادة: ${subject}</p>
        </div>
        <div style="text-align: left; padding-left: 10px;">
          <p style="margin:0 0 6px 0; font-weight:bold; font-size:15px; color:#4A5568;">🗓️ الشهر: ${month}</p>
          <p style="margin:0; font-weight:bold; font-size:15px; color:#4A5568;">🏫 الصف الدراسي: ${className}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="background-color:#5A2E99; color:#ffffff; display:inline-block; padding:8px 30px; border-radius:6px; margin:0; font-size:18px; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          📝 كشف درجات الطلاب الشهري الإجمالي (مرتب أبجدياً)
        </h3>
      </div>
      
      <table style="width:100%; border-collapse:collapse; direction:rtl; font-size:15px; background-color:#ffffff; box-sizing:border-box;">
        <thead>
          <tr style="background-color:#3B1E63; color:#ffffff; text-align:center;">
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:50px; color:#ffffff !important;">م</th>
            <th style="border:2px solid #3B1E63; padding:10px 8px; text-align:right; width:300px; color:#ffffff !important;">اسم الطالب</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">المواظبة</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">الواجبات</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">الشفوي</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:90px; color:#ffffff !important;">التحريري</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:110px; background-color:#2D134D; color:#ffffff !important;">المجموع (100)</th>
            <th style="border:2px solid #3B1E63; padding:10px 4px; width:110px; background-color:#1B5E20; color:#ffffff !important;">المحصلة (20)</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedRows.forEach((row, idx) => {
    const st = row.student;
    const g = row.grade;
    const total100 = row.total;
    const final20 = Math.round(total100 / 5);
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#F9F6FC';

    htmlContent += `
      <tr style="background-color:${rowBg}; text-align:center;">
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${idx + 1}</td>
        <td style="border:2px solid #3B1E63; padding:8px 8px; text-align:right; font-weight:800; font-size:15px; color:#1A202C;">${st.name}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.att || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.hw || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.oral || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:bold;">${g.written || 0}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:900; color:#B71C1C; background-color:#F5EFFC; font-size:16px;">${total100}</td>
        <td style="border:2px solid #3B1E63; padding:8px 4px; font-weight:900; font-size:18px; color:#1B5E20; background-color:#E8F5E9;">${final20}</td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
      <div style="margin-top:25px; text-align:left; font-size:13px; font-weight:bold; color:#5A2E99; padding-left:10px;">
        📆 تاريخ إصدار الكشف: ${new Date().toLocaleDateString('ar-YE')}
      </div>
    </div>
  `;

  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = htmlContent;
  printWrapper.appendChild(contentDiv);
  document.body.appendChild(printWrapper);

  setTimeout(() => {
    window.scrollTo(0, 0);
    const captureArea = document.getElementById('image-capture-area');
    html2canvas(captureArea, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1120
    }).then(canvas => {
      const imgDataUrl = canvas.toDataURL('image/png');
      document.body.removeChild(printWrapper);
      hiddenElements.forEach(el => el.style.display = '');

      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:15px;';

      modal.innerHTML = `
        <div style="width:100%; max-width:600px; background:#fff; border-radius:12px; padding:15px; box-sizing:border-box; display:flex; flex-direction:column; max-height:90%;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #3B1E63; padding-bottom:10px; margin-bottom:10px;">
            <span style="font-family:'Cairo'; font-weight:bold; color:#3B1E63;">📸 صورة الكشف جاهزة</span>
            <button id="close-img-modal" style="background:#B71C1C; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-family:'Cairo'; font-weight:bold; cursor:pointer;">إغلاق</button>
          </div>
          <div style="text-align:center; background:#EBF8FF; color:#2B6CB0; font-family:'Cairo'; font-size:12px; padding:6px; border-radius:6px; font-weight:bold; margin-bottom:10px;">
            💡 اضغط مطولاً على الصورة لحفظها.
          </div>
          <div style="overflow-y:auto; flex:1; text-align:center; border:1px solid #E2E8F0; padding:5px; background:#f7fafc; border-radius:6px;">
            <img src="${imgDataUrl}" style="width:100%; height:auto; box-shadow:0 2px 5px rgba(0,0,0,0.15);" alt="كشف الدرجات" />
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.getElementById('close-img-modal').addEventListener('click', () => document.body.removeChild(modal));

    }).catch(err => {
      console.error("خطأ:", err);
      alert("عذراً، حدث خطأ أثناء إعداد الصورة.");
      document.body.removeChild(printWrapper);
      hiddenElements.forEach(el => el.style.display = '');
    });
  }, 1000);
}
