/* ═══════════════════════════════════════════════════════
   electroexam.js — محرك بناء الاختبار الإلكتروني المستقل
   ═══════════════════════════════════════════════════════ */

window.buildElectronicExamHtml = function(examJson, meta, examFileName, isEnglish) {
    // دالة محلية لحماية النصوص (لتجنب الاعتماد على core.js)
    const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    const mcq = (examJson.mcq || []).map(item => ({
      q: item.q, options: item.options, correctText: item.options[item.correctIndex], exp: ''
    }));
    const tf = (examJson.tf || []).map(item => ({
      q: item.statement + (isEnglish ? ' (True or False)' : ' (صح أم خطأ)'),
      options: isEnglish ? ['False','True'] : ['خطأ','صح'],
      correctText: item.correct ? (isEnglish?'True':'صح') : (isEnglish?'False':'خطأ'),
      exp: ''
    }));
    const blankItems = examJson.blank || [];
    const matchItems = examJson.match || [];
    const essayItems = examJson.essay || [];

    const rawQuestionsJs = JSON.stringify([...tf, ...mcq]);
    const blankJs = JSON.stringify(blankItems);
    const matchJs = JSON.stringify(matchItems);
    const essayJs = JSON.stringify(essayItems);
    const tfCount = tf.length;

    const L = isEnglish ? {
      title: 'Electronic Exam', tfHeader: 'Section One: True / False', mcqHeader: 'Section Two: Multiple Choice',
      blankHeader: 'Section Three: Fill in the Blank', matchHeader: 'Section Four: Matching', essayHeader: 'Section Five: Short Essay',
      school:'School', subject:'Subject', grade:'Grade', section:'Section', name:'Student Name',
      seatNumber: 'Seat Number', enterId: 'Enter Seat Number', idRequired: 'Seat number is required!',
      enterName:'Enter your full name', enterBtn:'Enter Exam', submitBtn:'✅ Submit Exam', submitted:'✅ Exam submitted',
      showAns:'Show Answer', waitPermission:'This exam is not active right now.', expired:'⏱️ Time is up.',
      alreadyDone:'You already submitted this exam.'
    } : {
      title: 'اختبار إلكتروني', tfHeader: 'السؤال الأول: صح أم خطأ', mcqHeader: 'السؤال الثاني: اختر الإجابة الصحيحة',
      blankHeader: 'السؤال الثالث: أكمل الفراغ', matchHeader: 'السؤال الرابع: وصّل', essayHeader: 'السؤال الخامس: مقالي',
      school:'المدرسة', subject:'المادة', grade:'الصف', section:'الشعبة', name:'اسم الطالب',
      seatNumber: 'رقم الجلوس', enterId: 'أدخل رقم الجلوس', idRequired: 'رقم الجلوس مطلوب!',
      enterName:'اكتب اسمك الكامل', enterBtn:'دخول للاختبار', submitBtn:'✅ إنهاء وتسليم الاختبار', submitted:'✅ تم تسليم الاختبار',
      showAns:'إظهار الإجابة', waitPermission:'هذا الاختبار غير مفعّل حاليًا من قبل المعلم.', expired:'⏱️ انتهى وقت هذا الاختبار.',
      alreadyDone:'لقد سبق لك الإجابة على هذا الاختبار برقم الجلوس هذا.'
    };

    return '<!DOCTYPE html>\n<html lang="' + (isEnglish?'en':'ar') + '" dir="' + (isEnglish?'ltr':'rtl') + '">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + esc(L.title) + '</title>\n<style>\n' +
`* { box-sizing:border-box; }
body { margin:0; background:#f3f1fa; font-family:'Segoe UI',Tahoma,sans-serif; }
.timer-bar { position:sticky; top:0; z-index:100; background:#1e3c72; color:#fff; padding:12px; text-align:center; font-weight:900; font-size:16px; }
.timer-bar.urgent { background:#dc2626; animation:pulse 1s infinite; }
@keyframes pulse { 0%{opacity:1} 50%{opacity:0.75} 100%{opacity:1} }
.name-gate { max-width:400px; margin:60px auto; background:#fff; padding:30px; border-radius:16px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
.name-gate input { width:100%; padding:14px; border:1.5px solid #ccc; border-radius:10px; margin-bottom:14px; font-size:15px; text-align:center; }
.name-gate button { width:100%; padding:14px; background:#16a34a; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:15px; cursor:pointer;}
.exam-header-box { border:2px solid #7C3AED; border-radius:10px; padding:14px; margin-bottom:20px; font-size:0.92em; }
.exam-header-box table { width:100%; border-collapse:collapse; }
.exam-header-box td { padding:6px 4px; }
.document-content h2 { color:#0284c7; font-size:1.4em; border-bottom:3px double #0284c7; padding-bottom:8px; margin-top:26px; margin-bottom:16px; font-weight:900; }
.mcq-card, .cloze-card, .match-card, .essay-card { background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:16px; }
.mcq-q, .cloze-q { font-weight:900; margin-bottom:12px; font-size:1.1em; color:#0f172a; }
.mcq-options { display:flex; flex-direction:column; gap:9px; }
.mcq-opt { padding:11px 15px; border:2px solid #cbd5e1; border-radius:8px; background:white; cursor:pointer; font-family:inherit; font-size:1em; font-weight:bold; color:#334155; }
.mcq-opt.selected { border-color:#2a5298; background:#eef2ff; color:#1e3c72; }
.cloze-reveal-btn { padding:10px 16px; border:2px solid #8b5cf6; border-radius:8px; background:white; color:#8b5cf6; font-weight:900; cursor:pointer; }
.cloze-ans { margin-top:12px; padding:12px; background:#e0f2fe; border-radius:8px; color:#0369a1; font-weight:bold; display:none; }
.match-pair { display:flex; justify-content:space-between; padding:8px 0; font-weight:700; }
.essay-textarea { width:100%; min-height:80px; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-family:inherit; font-size:0.95em; }
.submit-zone { max-width:850px; margin:20px auto; text-align:center; padding:0 20px; }
.submit-btn { width:100%; padding:18px; background:#16a34a; color:#fff; border:none; border-radius:12px; font-size:17px; font-weight:900; cursor:pointer; }
.result-box { max-width:500px; margin:60px auto; background:#fff; padding:30px; border-radius:16px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
.result-score { font-size:40px; font-weight:900; color:#16a34a; margin:14px 0; }
</style>
</head>
<body>
<script src="/pin-check.js"></script>
<script src="/presence.js"></script>

<div id="nameGateScreen" class="name-gate" style="display:none;">
    <h2 style="color:#1e3c72; margin-top: 0;">📝 ` + esc(L.enterName) + `</h2>
    <input type="number" id="manualIdInput" placeholder="` + esc(L.enterId) + `" style="font-weight:bold; letter-spacing:2px; font-size:18px;">
    <input type="text" id="manualNameInput" placeholder="` + esc(L.enterName) + `">
    <button id="btnEnterExam" onclick="confirmManualName()">` + esc(L.enterBtn) + `</button>
</div>

<div id="examScreen" style="display:none;">
    <div class="timer-bar" id="timerBar">⏳ --:--</div>
    <div class="doc-wrapper" dir="` + (isEnglish?'ltr':'rtl') + `" style="background:white; padding:26px 18px; margin:16px auto; max-width:850px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <h1 style="text-align:center; color:#4c1d95; font-size:1.4em; margin-bottom:16px;">` + esc(L.title) + `</h1>
        <div class="exam-header-box">
            <table>
                <tr><td style="font-weight:800; width:15%;">` + esc(L.school) + `:</td><td style="width:35%;">` + esc(meta.school) + `</td><td style="font-weight:800; width:15%;">` + esc(L.subject) + `:</td><td style="width:35%;">` + esc(meta.subject) + `</td></tr>
                <tr><td style="font-weight:800;">` + esc(L.grade) + `:</td><td>` + esc(meta.grade) + `</td><td style="font-weight:800;">` + esc(L.section) + `:</td><td>` + esc(meta.section) + `</td></tr>
                <tr><td style="font-weight:800;">` + esc(L.seatNumber) + `:</td><td id="studentIdLabel" style="font-weight:bold; color:#d97706;"></td><td style="font-weight:800;">` + esc(L.name) + `:</td><td id="studentLabel"></td></tr>
            </table>
        </div>
        <div class="document-content" id="questionsContainer"></div>
    </div>
    <div class="submit-zone" id="submitZone">
        <button class="submit-btn" onclick="submitExam()">` + esc(L.submitBtn) + `</button>
    </div>
</div>

<div id="resultScreen" class="result-box" style="display:none;">
    <h2>` + esc(L.submitted) + `</h2>
    <div class="result-score" id="finalScoreText"></div>
    <p id="uploadStatus" style="font-size:13.5px;line-height:1.7;"></p>
</div>

<script>
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const rawGraded = ` + rawQuestionsJs + `;
const tfCount = ` + tfCount + `;
const rawTf = shuffleArray(rawGraded.slice(0, tfCount));
const rawMcq = shuffleArray(rawGraded.slice(tfCount));
const blankItems = ` + blankJs + `;
const matchItems = ` + matchJs + `;
const essayItems = ` + essayJs + `;

function buildShuffled(rq) {
    const shuffledOpts = shuffleArray(rq.options);
    const answerIdx = shuffledOpts.indexOf(rq.correctText);
    return { q: rq.q, opts: shuffledOpts, answer: answerIdx, exp: rq.exp || '' };
}
const questions = [...rawTf.map(buildShuffled), ...rawMcq.map(buildShuffled)];

let selectedAnswers = {};
let studentName = "";
let studentId = ""; 
let deadline = 0;
let examFileName = "` + examFileName + `";
let timerInterval = null;
let submitted = false;

function getUrlParam(name) { return new URLSearchParams(window.location.search).get(name); }

function showBlockScreen(message) {
    document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="background:#fff;border-radius:16px;padding:30px;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.1);"><div style="font-size:40px;margin-bottom:14px;">🚫</div><p style="font-weight:800;font-size:15px;color:#dc2626;line-height:1.8;">' + message + '</p></div></div>';
}

window.startTeacherPreview = function() {
    document.getElementById("nameGateScreen").style.display = "none";
    document.getElementById("examScreen").style.display = "block";
    
    document.getElementById("timerBar").textContent = "👀 وضع المعاينة للمعلم (لا يتم حفظ النتيجة)";
    document.getElementById("timerBar").style.background = "#dc2626";
    document.getElementById("submitZone").style.display = "none";
    document.getElementById("studentLabel").textContent = "معاينة المعلم";
    document.getElementById("studentIdLabel").textContent = "---";
    
    renderQuestions();
    
    setTimeout(() => {
        document.querySelectorAll(".mcq-card").forEach(card => {
            const qIndex = parseInt(card.dataset.qindex);
            const correctIdx = questions[qIndex].answer;
            const btns = card.querySelectorAll(".mcq-opt");
            if(btns[correctIdx]) {
                btns[correctIdx].style.backgroundColor = "#dcfce7";
                btns[correctIdx].style.borderColor = "#16a34a";
                btns[correctIdx].innerHTML += " ✅ (صحيح)";
            }
        });
        document.querySelectorAll(".cloze-reveal-btn").forEach(btn => btn.click());
        document.querySelectorAll(".match-reveal-btn").forEach(btn => btn.click());
    }, 100);
};

async function init() {
    examFileName = window.location.pathname.split("/").pop();
    
    if (window.location.protocol === 'file:') {
        document.getElementById("nameGateScreen").innerHTML = '<h2 style="color:#dc2626; margin-top:0;">👀 وضع المعاينة (للمعلم)</h2><p style="margin-bottom:20px; font-weight:bold; color:#475569; line-height:1.6;">الاختبار الفعلي للطلاب يحتاج لرفعه على السيرفر المحلي ليعمل بشكل سليم.<br><br>هل تريد معاينة الأسئلة والإجابات الصحيحة الآن؟</p><button onclick="startTeacherPreview()" style="background:#dc2626;">معاينة الأسئلة والإجابات</button>';
        document.getElementById("nameGateScreen").style.display = "block";
        return;
    }

    let control;
    try {
        const res = await fetch("/control.json?t=" + Date.now(), { cache: "no-store" });
        control = res.ok ? await res.json() : null;
    } catch (e) { control = null; }

    if (!control || !control.enabled || control.examFile !== examFileName) {
        showBlockScreen("` + esc(L.waitPermission) + `");
        return;
    }
    const serverDeadline = control.startedAt + control.durationMinutes * 60000;
    if (Date.now() >= serverDeadline) { showBlockScreen("` + esc(L.expired) + `"); return; }
    deadline = serverDeadline;

    const urlStudent = getUrlParam("student");
    const urlId = getUrlParam("studentId");
    
    if (urlStudent && urlId) {
        studentName = decodeURIComponent(urlStudent);
        studentId = decodeURIComponent(urlId);
        
        const dup = await checkDuplicateOnServer(studentId);
        if (dup) { showBlockScreen("` + esc(L.alreadyDone) + `"); return; }
        startExam();
    } else {
        document.getElementById("nameGateScreen").style.display = "block";
    }
}

async function checkDuplicateOnServer(sid) {
    try {
        const listRes = await fetch("/api/file/list?path=" + encodeURIComponent("/results/") + "&sort=default&sort-reversed=false&search=", { cache: "no-store" });
        const items = await listRes.json();
        const files = items.filter(f => !f.directory && f.name.endsWith(".json"));
        for (const f of files) {
            try {
                const r = await fetch("/results/" + encodeURIComponent(f.name), { cache: "no-store" });
                const data = await r.json();
                if (data.examFile === examFileName && String(data.studentId) === String(sid)) return true;
            } catch (e) {}
        }
        return false;
    } catch (e) { return false; }
}

async function confirmManualName() {
    const name = document.getElementById("manualNameInput").value.trim();
    const sid = document.getElementById("manualIdInput").value.trim();
    
    if (!sid) { alert("` + esc(L.idRequired) + `"); return; }
    if (!name) { alert("` + esc(L.enterName) + `"); return; }
    
    const dup = await checkDuplicateOnServer(sid);
    if (dup) { showBlockScreen("` + esc(L.alreadyDone) + `"); return; }
    
    studentName = name;
    studentId = sid;
    document.getElementById("nameGateScreen").style.display = "none";
    startExam();
}

function startExam() {
    window.__presenceLabel = studentName + " (" + studentId + ") (exam)";
    document.getElementById("examScreen").style.display = "block";
    
    document.getElementById("studentLabel").textContent = studentName;
    document.getElementById("studentIdLabel").textContent = studentId; 
    
    renderQuestions();
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function renderQuestions() {
    const tfQ = questions.slice(0, tfCount);
    const mcqQ = questions.slice(tfCount);
    let html = "";
    if (tfQ.length) { html += "<h2>` + esc(L.tfHeader) + `</h2>" + tfQ.map((q,idx)=>renderCard(q,idx,idx+1)).join(""); }
    if (mcqQ.length) { html += "<h2>` + esc(L.mcqHeader) + `</h2>" + mcqQ.map((q,idx)=>renderCard(q,idx+tfCount,idx+1)).join(""); }
    if (blankItems.length) {
        html += "<h2>` + esc(L.blankHeader) + `</h2>" + blankItems.map((b,i)=>
            '<div class="cloze-card"><p class="cloze-q">'+(i+1)+'. '+escJs(b.sentence)+'</p><button type="button" class="cloze-reveal-btn" onclick="this.nextElementSibling.style.display=\\'block\\';this.disabled=true;">` + esc(L.showAns) + `</button><p class="cloze-ans">'+escJs(b.answer)+'</p></div>'
        ).join("");
    }
    if (matchItems.length) {
        html += "<h2>` + esc(L.matchHeader) + `</h2><div class='match-card'>" + shuffleArray(matchItems).map(m =>
            '<div class="match-pair"><span>'+escJs(m.left)+'</span><span style="color:#8b5cf6;">↔</span><span>'+escJs(m.right)+'</span></div>'
        ).join("") + "</div>";
    }
    if (essayItems.length) {
        html += "<h2>` + esc(L.essayHeader) + `</h2>" + essayItems.map((e,i)=>
            '<div class="essay-card"><p class="mcq-q">'+(i+1)+'. '+escJs(e)+'</p><textarea class="essay-textarea" data-eidx="'+i+'"></textarea></div>'
        ).join("");
    }
    document.getElementById("questionsContainer").innerHTML = html;
}

function escJs(s) {
  var raw = String(s == null ? '' : s);
  var temp = document.createElement('div');
  temp.innerHTML = raw;
  (function clean(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function(child) {
      if (child.nodeType === 1) {
        var cls = child.className || '';
        var isMathTag = child.tagName === 'SPAN' && /^math-(frac|root|power)-/.test(cls);
        if (!isMathTag) child.parentNode.replaceChild(document.createTextNode(child.textContent), child);
        else clean(child);
      }
    });
  })(temp);
  return temp.innerHTML;
}

function renderCard(q, absoluteIndex, displayNumber) {
    return '<div class="mcq-card" data-qindex="'+absoluteIndex+'"><p class="mcq-q">'+displayNumber+'. '+escJs(q.q)+'</p><div class="mcq-options">' +
        q.opts.map((opt,idx)=>'<button type="button" class="mcq-opt" onclick="selectAnswer('+absoluteIndex+','+idx+',this)">'+escJs(opt)+'</button>').join("") +
        '</div></div>';
}

function selectAnswer(qIndex, optIndex, btn) {
    if (submitted) return;
    selectedAnswers[qIndex] = optIndex;
    const card = btn.closest(".mcq-card");
    card.querySelectorAll(".mcq-opt").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
}

function updateTimer() {
    const remaining = deadline - Date.now();
    const bar = document.getElementById("timerBar");
    if (remaining <= 0) { bar.textContent = "` + esc(L.expired) + `"; clearInterval(timerInterval); submitExam(); return; }
    const mins = Math.floor(remaining/60000), secs = Math.floor((remaining%60000)/1000);
    bar.textContent = "⏳ " + mins + ":" + secs.toString().padStart(2,"0");
    if (remaining < 60000) bar.classList.add("urgent");
}

async function submitExam() {
    if (submitted) return;
    submitted = true;
    clearInterval(timerInterval);
    let score = 0;
    questions.forEach((q,i) => { if (selectedAnswers[i] === q.answer) score++; });
    const total = questions.length;

    const essayAnswers = Array.from(document.querySelectorAll(".essay-textarea")).map(t => t.value);

    const resultData = { 
        name: studentName, 
        studentId: studentId, 
        className: "` + esc(meta.grade) + ` ` + esc(meta.section) + `".trim(), 
        score, 
        total, 
        examFile: examFileName, 
        timestamp: Date.now(), 
        essayAnswers 
    };

    try {
        let cleanTitle = examFileName.replace('.html', '');
        window.parent.postMessage({ 
            action: 'save_grade', 
            title: cleanTitle, 
            subject: "` + esc(meta.subject) + `", 
            score: score, 
            full_mark: total,
            studentId: studentId 
        }, '*');
    } catch(e) { console.log("تعذر الإرسال للمنصة"); }

    let uploadOk = false, errorDetail = "";
    try {
        const blob = new Blob([JSON.stringify(resultData)], { type: "application/json" });
        const formData = new FormData();
        const safeFileName = String(studentId).replace(/[^0-9a-zA-Z]/g, "") + "_" + Date.now() + ".json";
        formData.append("files[]", blob, safeFileName);
        const res = await fetch("/api/file/upload?path=" + encodeURIComponent("/results/"), { method: "PUT", body: formData });
        uploadOk = res.ok;
        if (!res.ok) errorDetail = "code: " + res.status;
    } catch (err) { errorDetail = err.message; }

    document.getElementById("examScreen").style.display = "none";
    document.getElementById("resultScreen").style.display = "block";
    document.getElementById("finalScoreText").textContent = score + " / " + total;
    const statusEl = document.getElementById("uploadStatus");
    if (uploadOk) {
        statusEl.textContent = "✅";
        localStorage.setItem("submitted_" + examFileName, "true");
    } else {
        statusEl.innerHTML = "⚠️ " + errorDetail;
    }
}

init();
</script>
</body>
</html>`;
};

