/* ═══════════════════════════════════════════
   ملف نظام الواجبات المنزلية (Homework System)
   إعداد: دفتر التحضير الذكي - الإصدار 5.0
   المميزات: دعم ثنائي اللغة، توليد شامل للمنهج، توافق مع جميع الأشهر والمواد، ورابط افتراضي
   ═══════════════════════════════════════════ */

/* ── دالة الفتح المباشرة لضمان الاستجابة ── */
window.openHomeworkModal = function() {
    // التحقق من تحديد درس واحد على الأقل
    const selectedItems = document.querySelectorAll('.bank-item-chk:checked');
    if (selectedItems.length === 0) {
        if (window.HaelCore && typeof window.HaelCore.toast === 'function') {
            window.HaelCore.toast('⚠️ يرجى تحديد درس واحد على الأقل من القائمة لإنشاء الواجب', 'error');
        } else if (typeof showToast === 'function') {
            showToast('⚠️ يرجى تحديد درس واحد على الأقل من القائمة لإنشاء الواجب', 'error');
        } else {
            alert('⚠️ يرجى تحديد درس واحد على الأقل لإنشاء الواجب');
        }
        return;
    }
    
    // إظهار النافذة المنبثقة
    const modal = document.getElementById('hwSettingsModal');
    if (modal) {
        modal.classList.add('is-active');
    }
};

/* ── دالة توليد ملف الواجب المنزلي ── */
window.generateHomeworkFile = async function() {
    const core = window.HaelCore || window;
    
    const maxScore = document.getElementById('hwMaxScore').value || 5;
    const targetMonth = document.getElementById('hwTargetMonth').value;
    let subject = document.getElementById('hwSubject').value;
    
    // 💡 توحيد صارم لأسماء المواد (بما فيها الاجتماعيات) لتتطابق مع دفتر الدرجات 100%
    const subjectMap = {
        "اللغة الإنجليزية": "لغة إنجليزية",
        "القرآن الكريم": "قرآن كريم",
        "التربية الإسلامية": "تربية إسلامية",
        "اللغة العربية": "لغة عربية",
        "الرياضيات": "رياضيات",
        "الفيزياء": "فيزياء",
        "الكيمياء": "كيمياء",
        "الأحياء": "أحياء",
        "التاريخ": "تاريخ",
        "الجغرافيا": "جغرافيا",
        "الاجتماعيات": "اجتماعيات",
        "المجتمع والوطنية": "وطنية",
        "الحاسوب": "حاسوب"
    };
    if (subjectMap[subject]) {
        subject = subjectMap[subject]; 
    }

    const difficulty = document.getElementById('hwDifficulty').value;
    const countMcq = document.getElementById('hwChkMcq').checked ? parseInt(document.getElementById('hwCountMcq').value) || 0 : 0;
    const countTf = document.getElementById('hwChkTf').checked ? parseInt(document.getElementById('hwCountTf').value) || 0 : 0;

    if (countMcq + countTf === 0) {
        if(core.toast) core.toast('⚠️ يرجى اختيار نوع واحد من الأسئلة على الأقل', 'error');
        else alert('⚠️ يرجى اختيار نوع واحد من الأسئلة على الأقل');
        return;
    }

    const apiKey = document.getElementById('sApiKey') ? document.getElementById('sApiKey').value : '';
    if (!apiKey) {
        if(core.toast) core.toast('⚠️ يرجى إدخال مفتاح Gemini API في الإعدادات أولاً', 'error');
        else alert('⚠️ يرجى إدخال مفتاح API أولاً');
        return;
    }

    let combinedText = '';
    const selectedCheckboxes = document.querySelectorAll('.bank-item-chk:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

    if(core.showOverlay) core.showOverlay('جاري جلب نصوص الدروس من قاعدة البيانات...');

    try {
        // 🌟 السطر السحري الجديد: اتصال مباشر ومستقل بقاعدة البيانات لسحب النصوص 🌟
        const getLessonsData = () => new Promise((resolve, reject) => {
            const request = indexedDB.open('haaelDB_v2'); // الاتصال بقاعدة بيانات التطبيق
            request.onsuccess = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('extracts')) { resolve([]); return; }
                const tx = db.transaction('extracts', 'readonly');
                const store = tx.objectStore('extracts'); // مخزن بنك الدروس
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            };
            request.onerror = () => reject(request.error);
        });

        // جلب البيانات وتصفيتها بناءً على الاختيار
        const allRecords = await getLessonsData();
        const selectedLessons = allRecords.filter(rec => selectedIds.includes(rec.id));
        
        selectedLessons.forEach(lesson => {
            if (lesson && lesson.content) {
                combinedText += lesson.content + '\n\n';
            }
        });

        if (!combinedText.trim()) {
            if(core.hideOverlay) core.hideOverlay();
            if(core.toast) core.toast('⚠️ تعذر قراءة النصوص! تأكد أن الدرس يحتوي على نص', 'error');
            else alert('⚠️ تعذر قراءة النصوص!');
            return;
        }

        document.getElementById('hwSettingsModal').classList.remove('is-active');
        if(core.showOverlay) core.showOverlay('جاري بناء الواجب الشامل (قد يستغرق بضع ثوان)...');

        // دعم اللغة الإنجليزية في أمر التوليد
        const isEnglish = subject.includes('إنجليز') || subject.toLowerCase().includes('english');
        const promptLangInstructions = isEnglish 
            ? "MUST BE IN ENGLISH. All questions, options, and answers must be written in English. True/False answers must be strictly 'True' or 'False'."
            : "يجب أن تكون الأسئلة والخيارات باللغة العربية. إجابات الصح والخطأ يجب أن تكون 'صح' أو 'خطأ'.";
        const tfCorrectFormat = isEnglish ? "True" : "صح";

        // أمر التوليد الشامل
        const promptText = `
أنت خبير تربوي ومصمم اختبارات. بناءً على النص التعليمي الشامل التالي، قم بتوليد أسئلة واجب منزلي شاملة ومتنوعة تغطي جميع أجزاء ومواضيع النص بالتساوي.
المواصفات المطلوبة:
- عدد أسئلة الاختيار من متعدد (MCQ): ${countMcq}
- عدد أسئلة الصح والخطأ (TF): ${countTf}
- مستوى الصعوبة: ${difficulty}
- لغة الأسئلة: ${promptLangInstructions}

يجب أن يكون المخرج النهائي بصيغة مصفوفة JSON فقط، بدون أي نصوص أو مقدمات أخرى، وبنظام المفاتيح التالي:
[
  { "type": "mcq", "q": "نص السؤال هنا", "options": ["خيار1", "خيار2", "خيار3", "خيار4"], "answer": "الخيار الصحيح هنا" },
  { "type": "tf", "q": "نص السؤال هنا", "answer": "${tfCorrectFormat}" }
]

النص التعليمي الشامل:
${combinedText}
        `;

        const model = document.getElementById('sDefaultModel') ? document.getElementById('sDefaultModel').value : 'gemini-1.5-flash';
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!response.ok) throw new Error('فشل الاتصال بالذكاء الاصطناعي.');
        
        const data = await response.json();
        let aiText = data.candidates[0].content.parts[0].text;
        
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const questionsJson = JSON.parse(aiText);

        const htmlFileContent = buildStudentHTMLTemplate(questionsJson, maxScore, targetMonth, subject, isEnglish);

        const blob = new Blob([htmlFileContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `واجب_${subject.replace(/\s+/g, '_')}_${targetMonth}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if(core.hideOverlay) core.hideOverlay();
        if(core.toast) core.toast('✅ تم توليد الواجب الشامل بنجاح!', 'success');
        else alert('✅ تم التوليد بنجاح!');

    } catch (error) {
        if(core.hideOverlay) core.hideOverlay();
        if(core.toast) core.toast('❌ حدث خطأ: ' + error.message, 'error');
        else alert('خطأ: ' + error.message);
        console.error(error);
    }
};


/* ── دالة بناء قالب HTML الخاص بالطالب (بواجهة ثنائية اللغة) ── */
function buildStudentHTMLTemplate(questions, maxScore, month, subject, isEnglish) {
    const safeQuestionsJSON = JSON.stringify(questions)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e');
    
    const uniqueHomeworkId = "HW_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    
    // إعدادات اللغة للواجهة
    const dir = isEnglish ? 'ltr' : 'rtl';
    const lang = isEnglish ? 'en' : 'ar';
    const align = isEnglish ? 'left' : 'right';
    
    const UI = isEnglish ? {
        title: `Homework: ${subject}`,
        monthTxt: `Month: ${month}`,
        name: "Full Name:",
        namePh: "Enter your full name here",
        idLabel: "Seat Number / Student ID:",
        idPh: "Enter your number here",
        startBtn: "Start Homework",
        quizTitle: "Answer all questions",
        submitBtn: "Submit and Save Result",
        successTitle: "Homework Graded Successfully!",
        scoreTxt: "Your score is:",
        outOf: "out of",
        saveNote: "Your result is saved. Enter teacher's IP and click send.",
        ipLabel: "Teacher's IP Address:",
        sendBtn: "📤 Send Result to Teacher Now",
        footer: "Prepared by Mr. Hael Saeed - Smart Prep Notebook",
        doneTitle: "Homework already completed",
        welcomeBack: "Welcome back",
        alertEmpty: "Please enter your name and seat number.",
        alertNoQ: "No questions in this homework!",
        alertIncomplete: "You haven't answered all questions. Are you sure you want to submit?",
        optTrue: "True",
        optFalse: "False",
        noData: "No saved result to send.",
        reqIp: "Please enter teacher's IP first.",
        sending: "Sending to teacher's network...",
        sentOk: "✅ Sent successfully! You can close this page.",
        sentFailServer: "⚠️ Connected but server rejected the file (Code: ",
        sentFailNet: "❌ Connection failed! Make sure you are connected to the school network."
    } : {
        title: `واجب منزلي: ${subject}`,
        monthTxt: `شهر ${month}`,
        name: "الاسم الرباعي:",
        namePh: "اكتب اسمك الكامل هنا",
        idLabel: "رقم الجلوس / رقم الطالب:",
        idPh: "اكتب رقمك هنا",
        startBtn: "بدء الواجب",
        quizTitle: "أجب عن جميع الأسئلة",
        submitBtn: "تسليم وحفظ النتيجة",
        successTitle: "تم تصحيح الواجب بنجاح!",
        scoreTxt: "درجتك هي:",
        outOf: "من",
        saveNote: "تم حفظ نتيجتك، تأكد من رقم الـ IP الخاص بالمعلم ثم اضغط إرسال.",
        ipLabel: "عنوان IP الخاص بالمعلم:",
        sendBtn: "📤 إرسال النتيجة للمعلم الآن",
        footer: "إعداد / الأستاذ هايل سعيد - دفتر التحضير الذكي",
        doneTitle: "تم إنجاز هذا الواجب مسبقاً",
        welcomeBack: "أهلاً بك مجدداً يا",
        alertEmpty: "يرجى كتابة الاسم ورقم الجلوس للمتابعة.",
        alertNoQ: "لا توجد أسئلة في هذا الواجب!",
        alertIncomplete: "لم تقم بالإجابة على جميع الأسئلة. هل أنت متأكد من رغبتك في التسليم؟",
        optTrue: "صح",
        optFalse: "خطأ",
        noData: "لا توجد نتيجة محفوظة لإرسالها.",
        reqIp: "يرجى كتابة رقم IP الخاص بالمعلم أولاً",
        sending: "جاري الإرسال لشبكة المعلم...",
        sentOk: "✅ تم الإرسال بنجاح! راجع المعلم للتأكد.",
        sentFailServer: "⚠️ الخادم متصل ولكنه رفض الملف (الرمز: ",
        sentFailNet: "❌ فشل الاتصال! تأكد من أنك متصل بشبكة المعلم (Wi-Fi)."
    };
    
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${UI.title}</title>
<style>
    :root { --primary: #10B981; --primary-dark: #059669; --bg: #f8fafc; --card: #ffffff; --text: #1e293b; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px 10px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background: var(--card); border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; }
    .header h1 { color: var(--primary-dark); font-size: 22px; margin: 0 0 8px; }
    .header p { color: #64748B; font-size: 14px; margin: 0; font-weight: bold; }
    .field { margin-bottom: 16px; text-align: ${align}; }
    .field label { display: block; font-weight: bold; margin-bottom: 6px; font-size: 14px; }
    .field input { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 15px; box-sizing: border-box; text-align: ${align}; }
    .field input:focus { border-color: var(--primary); outline: none; }
    .question { background: #f1f5f9; padding: 16px; border-radius: 12px; margin-bottom: 16px; text-align: ${align}; }
    .question h3 { margin: 0 0 12px; font-size: 16px; color: #0f172a; }
    .option { display: block; padding: 10px 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; text-align: ${align}; }
    .option:hover { background: #e0f2fe; }
    input[type="radio"] { margin: 0 8px; transform: scale(1.2); }
    .btn { display: block; width: 100%; padding: 14px; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: 0.2s; }
    .btn:hover { background: var(--primary-dark); }
    .result-box { display: none; text-align: center; background: #dcfce7; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; margin-top: 20px; }
    .result-box h2 { color: #15803d; margin: 0 0 10px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>

<div class="container" id="loginScreen">
    <div class="header">
        <h1>${UI.title}</h1>
        <p>${UI.monthTxt}</p>
    </div>
    <div class="field">
        <label>${UI.name}</label>
        <input type="text" id="studentName" placeholder="${UI.namePh}">
    </div>
    <div class="field">
        <label>${UI.idLabel}</label>
        <input type="number" id="studentId" placeholder="${UI.idPh}">
    </div>
    <button class="btn" onclick="startHomework()">${UI.startBtn}</button>
</div>

<div class="container" id="quizScreen" style="display:none;">
    <div class="header">
        <h1 id="quizTitle">${UI.quizTitle}</h1>
    </div>
    <div id="questionsContainer"></div>
    <button class="btn" id="btnSubmit" onclick="submitHomework()">${UI.submitBtn}</button>
    
    <div id="resultScreen" class="result-box">
        <h2 id="resultTitle">${UI.successTitle}</h2>
        <p>${UI.scoreTxt} <strong id="scoreDisplay" style="font-size:24px;"></strong> ${UI.outOf} ${maxScore}</p>
        <p style="color:#64748b; font-size:13px; margin-bottom:15px;">${UI.saveNote}</p>
        
        <div class="field" style="margin-top: 15px;">
            <label>${UI.ipLabel}</label>
            <input type="text" id="serverIp" value="http://10.124.196.30:8080/" dir="ltr" style="text-align:center; border-color:#2563EB;">
        </div>

       <button id="realSendBtn" class="btn" style="background:#2563EB; margin-top:5px;" onclick="sendResultToServer()">${UI.sendBtn}</button>

        <p id="sendMsg" style="margin-top:10px; font-weight:bold;"></p>
    </div>
</div>

<div class="footer">
    ${UI.footer}
</div>

<script>
    const questions = ${safeQuestionsJSON};
    const maxScore = ${maxScore};
    const subject = "${subject}";
    const month = "${month}";
    const HOMEWORK_ID = "${uniqueHomeworkId}";
    let finalCalculatedScore = 0;

    window.onload = function() {
        const savedStudentId = localStorage.getItem(HOMEWORK_ID);
        if (savedStudentId) {
            const savedDataStr = localStorage.getItem('hw_result_' + savedStudentId);
            if (savedDataStr) {
                try {
                    const savedData = JSON.parse(savedDataStr);
                    document.getElementById('studentId').value = savedData.student_id;
                    document.getElementById('studentName').value = savedData.student_name;
                    
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('quizScreen').style.display = 'block';
                    document.getElementById('questionsContainer').style.display = 'none';
                    document.getElementById('btnSubmit').style.display = 'none';
                    
                    document.getElementById('scoreDisplay').innerText = savedData.score;
                    document.getElementById('resultScreen').style.display = 'block';
                    
                    document.getElementById('quizTitle').innerText = "${UI.doneTitle}";
                    document.getElementById('quizTitle').style.color = "#16a34a";
                    document.getElementById('resultTitle').innerText = "${UI.welcomeBack} " + savedData.student_name.split(' ')[0];
                } catch(e) {}
            }
        }
    };

    function startHomework() {
        const name = document.getElementById('studentName').value.trim();
        const id = document.getElementById('studentId').value.trim();
        if(!name || !id) { alert("${UI.alertEmpty}"); return; }
        if (!questions || questions.length === 0) { alert("${UI.alertNoQ}"); return; }

        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('quizScreen').style.display = 'block';
        renderQuestions();
    }

    function renderQuestions() {
        const container = document.getElementById('questionsContainer');
        let html = '';
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qText = q.q ? String(q.q).replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'سؤال بدون نص';
            html += '<div class="question" id="q_' + i + '">';
            html += '<h3>' + (i + 1) + '. ' + qText + '</h3>';
            
            if (q.type === 'mcq') {
                const options = Array.isArray(q.options) ? q.options : [];
                const shuffledOptions = options.slice().sort(function() { return Math.random() - 0.5; });
                for (let j = 0; j < shuffledOptions.length; j++) {
                    const safeOpt = String(shuffledOptions[j]).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    html += '<label class="option"><input type="radio" name="ans_' + i + '" value="' + safeOpt + '"> ' + safeOpt + '</label>';
                }
            } else if (q.type === 'tf') {
                html += '<label class="option"><input type="radio" name="ans_' + i + '" value="${UI.optTrue}"> ${UI.optTrue}</label>';
                html += '<label class="option"><input type="radio" name="ans_' + i + '" value="${UI.optFalse}"> ${UI.optFalse}</label>';
            }
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function submitHomework() {
        let correctAnswers = 0;
        let answeredCount = 0;

        for (let i = 0; i < questions.length; i++) {
            const selected = document.querySelector('input[name="ans_' + i + '"]:checked');
            if (selected) {
                answeredCount++;
                if (selected.value.trim() === String(questions[i].answer).trim()) { correctAnswers++; }
            }
        }

        if (answeredCount < questions.length) {
            if(!confirm("${UI.alertIncomplete}")) return;
        }

        let rawScore = (correctAnswers / questions.length) * maxScore;
        finalCalculatedScore = Math.round(rawScore * 2) / 2;

        document.getElementById('scoreDisplay').innerText = finalCalculatedScore;
        document.getElementById('resultScreen').style.display = 'block';
        document.getElementById('questionsContainer').style.display = 'none';
        document.getElementById('btnSubmit').style.display = 'none';

        saveLocally();
    }

    function saveLocally() {
        const studentId = document.getElementById('studentId').value.trim();
        const resultObj = {
            type: "homework",
            student_id: studentId,
            student_name: document.getElementById('studentName').value.trim(),
            score: finalCalculatedScore,
            max_score: maxScore,
            month: month,
            subject: subject,
            timestamp: new Date().toLocaleString('ar-EG')
        };
        localStorage.setItem('hw_result_' + studentId, JSON.stringify(resultObj));
        localStorage.setItem(HOMEWORK_ID, studentId);
    }

    async function sendResultToServer() {
        const sendBtn = document.getElementById('realSendBtn');
        if (sendBtn && sendBtn.disabled) return; 

        const msg = document.getElementById('sendMsg');
        const studentId = document.getElementById('studentId').value.trim();
        const savedData = localStorage.getItem('hw_result_' + studentId);
        
        if(!savedData) {
            msg.style.color = "red"; msg.innerText = "${UI.noData}"; return;
        }

        let rawIp = document.getElementById('serverIp').value.trim();
        if(!rawIp) { alert("${UI.reqIp}"); return; }
        
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.6';
            sendBtn.innerText = "⏳ ${UI.sending}";
            sendBtn.style.cursor = 'not-allowed';
        }

        let cleanIp = rawIp.replace(/^https?:\\/\\//, '').split('/')[0].split(':')[0];
        const serverUrl = "http://" + cleanIp + ":8080/api/file/upload?path=" + encodeURIComponent("/Results/");
        
        msg.style.color = "blue";
        msg.innerText = "${UI.sending}";

        try {
            const safeFileName = "HW_" + String(studentId).replace(/[^0-9]/g, "") + "_" + Date.now() + ".json";
            
            const blob = new Blob([savedData], { type: "application/json" });
            const formData = new FormData();
            formData.append("files[]", blob, safeFileName);

            const res = await fetch(serverUrl, {
                method: "PUT",
                body: formData
            });

            if (res.ok) {
                msg.style.color = "green";
                msg.innerText = "${UI.sentOk}";
                if (sendBtn) { 
                    sendBtn.innerText = "✅ تم الإرسال بنجاح"; 
                    sendBtn.style.background = "#10B981";
                }
            } else {
                msg.style.color = "red";
                msg.innerText = "${UI.sentFailServer}" + res.status + ")";
                if (sendBtn) { 
                    sendBtn.disabled = false; 
                    sendBtn.style.opacity = '1'; 
                    sendBtn.innerText = "🔄 إعادة المحاولة"; 
                    sendBtn.style.cursor = 'pointer';
                }
            }
        } catch (err) {
            msg.style.color = "red";
            msg.innerText = "${UI.sentFailNet}";
            if (sendBtn) { 
                sendBtn.disabled = false; 
                sendBtn.style.opacity = '1'; 
                sendBtn.innerText = "🔄 إعادة المحاولة"; 
                sendBtn.style.cursor = 'pointer';
            }
            console.error(err);
        }
    }

</` + `script>
</body>
</html>`;
}

