/* ═══════════════════════════════════════════
   ExamiGen Pro - Exam Builder Module
   ملف التوليد المخصص للاختبارات الرسمية
   (ترقيم متصل للإجابات 1 ➡️ النهاية، مطابق للورقة الأصلية)
   ═══════════════════════════════════════════ */

window.ExamBuilder = (function() {
    const EXAM_TYPE_LABELS_AR = { mcq:'اختيار من متعدد', tf:'صح / خطأ', blank:'أكمل الفراغ', match:'مطابقة (توصيل)', essay:'مقالي قصير', reading:'قطعة فهم' };
    const EXAM_TYPE_LABELS_EN = { mcq:'Multiple Choice', tf:'True / False', blank:'Fill in the Blank', match:'Matching', essay:'Short Essay', reading:'Reading Comprehension' };
    const EXAM_APP_FILE = 'exams.html';

    function ensureMathShortcodes(obj) {
        if (typeof obj === 'string') { return obj.replace(/(?:sqrt|جذر)\s*\(([^)]+)\)/gi, function(match, val) { return `[root:${val.trim()}]`; }); }
        if (Array.isArray(obj)) return obj.map(ensureMathShortcodes);
        if (obj !== null && typeof obj === 'object') { for (let key in obj) { obj[key] = ensureMathShortcodes(obj[key]); } }
        return obj;
    }

    function generateDerivedModels(baseExam, modelCount, modelsType, core, isEnglish, originalTypeSettings) {
        const modelLettersAr = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']; const modelLettersEn = ['A', 'B', 'C', 'D', 'E', 'F']; const letters = isEnglish ? modelLettersEn : modelLettersAr;
        const count = Math.max(1, Math.min(modelCount || 1, 6)); const generatedModels = [];
        const isDistinct = (modelsType === 'distinct' && count > 1);

        for (let m = 0; m < count; m++) {
            const letter = letters[m]; const modelName = count > 1 ? (isEnglish ? `Model (${letter})` : `النموذج (${letter})`) : '';
            const currentExam = { title: baseExam.title || '' }; const answerKey = [];
            
            // 🌟 عداد الترقيم المتصل (من 1 إلى نهاية الاختبار) 🌟
            let globalQNum = 1;

            const getQuestionsSubset = (baseArray, typeStr, noShuffle = false) => {
                if (!baseArray || !baseArray.length) return [];
                if (isDistinct) {
                    const originalSetting = originalTypeSettings.find(t => t.type === typeStr);
                    const originalCount = originalSetting ? originalSetting.count : Math.floor(baseArray.length / count);
                    const startIdx = m * originalCount; const endIdx = startIdx + originalCount;
                    if (baseArray.length < endIdx) {
                        let subset = baseArray.slice(startIdx, baseArray.length);
                        if (subset.length < originalCount) { let needed = originalCount - subset.length; let extras = (noShuffle ? [...baseArray] : core.shuffleArray([...baseArray])).slice(0, needed); subset = subset.concat(extras); }
                        return subset;
                    }
                    return baseArray.slice(startIdx, endIdx);
                } else {
                    return (m === 0 || noShuffle) ? [...baseArray] : core.shuffleArray([...baseArray]);
                }
            };

            // الترتيب الصارم: 1. صح وخطأ
            if (Array.isArray(baseExam.tf) && baseExam.tf.length) {
                const rawTf = getQuestionsSubset(baseExam.tf, 'tf');
                currentExam.tf = rawTf.map((item) => {
                    let qText = typeof item === 'string' ? item : item.q; let aText = typeof item === 'string' ? '' : item.a;
                    answerKey.push({ section: isEnglish ? 'True / False' : 'صح / خطأ', qNum: globalQNum++, correctAnswer: aText, text: qText }); return qText;
                });
            }

            // الترتيب الصارم: 2. الاختيارات (ترقم 1-4)
            if (Array.isArray(baseExam.mcq) && baseExam.mcq.length) {
                const rawMcq = getQuestionsSubset(baseExam.mcq, 'mcq');
                currentExam.mcq = rawMcq.map((item) => {
                    const originalCorrectText = item.options[item.correctIndex];
                    const shuffledOptions = isDistinct ? core.shuffleArray([...item.options]) : ((m === 0) ? [...item.options] : core.shuffleArray([...item.options]));
                    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);
                    const optLettersEn = ['A', 'B', 'C', 'D'];
                    const optLetter = isEnglish ? optLettersEn[newCorrectIndex] : (newCorrectIndex + 1);
                    answerKey.push({ section: isEnglish ? 'Multiple Choice' : 'اختيار من متعدد', qNum: globalQNum++, correctAnswer: `(${optLetter}) ${originalCorrectText}`, text: item.q });
                    return { q: item.q, options: shuffledOptions, correctIndex: newCorrectIndex };
                });
            }

            // الترتيب الصارم: 3. الفراغات
            if (Array.isArray(baseExam.blank) && baseExam.blank.length) {
                const rawBlank = getQuestionsSubset(baseExam.blank, 'blank');
                currentExam.blank = rawBlank.map((item) => {
                    let qText = typeof item === 'string' ? item : item.q; let aText = typeof item === 'string' ? '' : item.a;
                    answerKey.push({ section: isEnglish ? 'Fill in the Blank' : 'أكمل الفراغ', qNum: globalQNum++, correctAnswer: aText, text: qText }); return qText;
                });
            }

            // الترتيب الصارم: 4. التوصيل
            if (Array.isArray(baseExam.match) && baseExam.match.length) {
                const rawMatch = getQuestionsSubset(baseExam.match, 'match');
                currentExam.match = rawMatch.map((item) => {
                    let qText = typeof item === 'string' ? item.split(/[-=]/)[0] : item.q; let aText = typeof item === 'string' ? item.split(/[-=]/)[1] : item.a;
                    answerKey.push({ section: isEnglish ? 'Matching' : 'المطابقة', qNum: globalQNum++, correctAnswer: aText, text: qText }); return `${qText} - ${aText}`; 
                });
            }

            // الترتيب الصارم: 5. قطعة الفهم (إجاباتها تُضاف بشكل متسلسل)
            if (Array.isArray(baseExam.reading) && baseExam.reading.length) {
                const rawReading = getQuestionsSubset(baseExam.reading, 'reading');
                currentExam.reading = rawReading.map(rBlock => {
                    let subQs = [...(rBlock.questions || [])]; if (m > 0 && !isDistinct) subQs = core.shuffleArray(subQs);
                    const finalSubQs = subQs.map(qItem => { 
                        let aText = qItem.a || '';
                        if (qItem.type === 'mcq' && Array.isArray(qItem.options)) { 
                            let shuffled = (m===0 && !isDistinct) ? [...qItem.options] : core.shuffleArray([...qItem.options]);
                            if (qItem.correctIndex !== undefined) {
                                let orig = qItem.options[qItem.correctIndex]; let nIdx = shuffled.indexOf(orig);
                                let l = isEnglish ? ['A','B','C','D'][nIdx] : (nIdx+1); aText = `(${l}) ${orig}`;
                            } else if (qItem.a) {
                                let nIdx = shuffled.indexOf(qItem.a);
                                if (nIdx !== -1) { let l = isEnglish ? ['A','B','C','D'][nIdx] : (nIdx+1); aText = `(${l}) ${qItem.a}`; }
                            }
                            answerKey.push({ section: isEnglish ? 'Reading' : 'قطعة الفهم', qNum: globalQNum++, correctAnswer: aText, text: qItem.q });
                            return { ...qItem, options: shuffled }; 
                        } 
                        answerKey.push({ section: isEnglish ? 'Reading' : 'قطعة الفهم', qNum: globalQNum++, correctAnswer: aText, text: qItem.q });
                        return qItem; 
                    });
                    return { passage: rBlock.passage, questions: finalSubQs };
                });
            }

            // الترتيب الصارم: 6. المقالي
            if (Array.isArray(baseExam.essay) && baseExam.essay.length) {
                const rawEssay = getQuestionsSubset(baseExam.essay, 'essay', true);
                currentExam.essay = rawEssay.map((item) => {
                    let qText = typeof item === 'string' ? item : item.q; let aText = typeof item === 'string' ? '' : item.a;
                    answerKey.push({ section: isEnglish ? 'Short Essay' : 'مقالي قصير', qNum: globalQNum++, correctAnswer: aText, text: qText }); return qText;
                });
            }

            generatedModels.push({ modelLetter: letter, modelName: modelName, examData: currentExam, answerKey: answerKey });
        }
        return generatedModels;
    }

      async function generateOfficialExamJSON(selectedLessons, typeSettings, difficulty, isEnglish, requestedModelsCount = 1, customInstructions = '', modelsType = 'shuffled', lessonDistribution = []) {
        const core = window.HaelCore;
        if (!core) return;

        core.showOverlay(requestedModelsCount > 1 ? 'جاري صياغة الأسئلة واشتقاق النماذج المتعددة...' : 'جاري صياغة الاختبار...');
        try {
            let combinedText = selectedLessons.map((l, i) => `--- Lesson ${i+1}: ${l.title} ---\n${l.content}`).join('\n\n');
            const settings = core.getSettings();
                       const OFFICIAL_EXAM_SCHEMA = { type: "object", properties: { title: { type: "string" } }, required: ["title"] };
            const requestedTypes = typeSettings.map(t => t.type);

            if (requestedTypes.includes('mcq')) { OFFICIAL_EXAM_SCHEMA.properties.mcq = { type: "array", items: { type: "object", properties: { q: { type: "string" }, options: { type: "array", items: { type: "string" } }, correctIndex: { type: "integer" } }, required: ["q", "options", "correctIndex"] } }; OFFICIAL_EXAM_SCHEMA.required.push("mcq"); }
            if (requestedTypes.includes('tf')) { OFFICIAL_EXAM_SCHEMA.properties.tf = { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } }; OFFICIAL_EXAM_SCHEMA.required.push("tf"); }
            if (requestedTypes.includes('blank')) { OFFICIAL_EXAM_SCHEMA.properties.blank = { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } }; OFFICIAL_EXAM_SCHEMA.required.push("blank"); }
            if (requestedTypes.includes('match')) { OFFICIAL_EXAM_SCHEMA.properties.match = { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } }; OFFICIAL_EXAM_SCHEMA.required.push("match"); }
            if (requestedTypes.includes('essay')) { OFFICIAL_EXAM_SCHEMA.properties.essay = { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } }; OFFICIAL_EXAM_SCHEMA.required.push("essay"); }
                       if (requestedTypes.includes('reading')) { OFFICIAL_EXAM_SCHEMA.properties.reading = { type: "array", items: { type: "object", properties: { passage: { type: "string" }, questions: { type: "array", items: { type: "object", properties: { q: { type: "string" }, type: { type: "string" }, options: { type: "array", items: { type: "string" } }, a: { type: "string" } }, required: ["q", "type", "options", "a"] } } }, required: ["passage", "questions"] } }; OFFICIAL_EXAM_SCHEMA.required.push("reading"); }



            let effectiveTypeSettings = typeSettings;
            if (modelsType === 'distinct' && requestedModelsCount > 1) {
                effectiveTypeSettings = typeSettings.map(t => ({ type: t.type, count: t.count * requestedModelsCount }));
            }

            const typeLabels = isEnglish ? EXAM_TYPE_LABELS_EN : EXAM_TYPE_LABELS_AR;
            const typesListText = effectiveTypeSettings.map(t => `- ${typeLabels[t.type]}: ${t.count} ${isEnglish ? 'questions' : 'سؤال'}`).join('\n');

            // 🌟 بناء القائمة الصارمة بناءً على أرقام المعلم 🌟
            let distributionCommands = "";
            if (lessonDistribution && lessonDistribution.length > 0) {
                let includedLessons = lessonDistribution.filter(l => l.count > 0).map((l, i) => `* From Lesson "${l.title}": Generate EXACTLY ${l.count} questions.`).join('\n');
                let zeroLessons = lessonDistribution.filter(l => l.count === 0).map(l => `"${l.title}"`).join(', ');
                
                distributionCommands = `⚠️ MANDATORY LESSON DISTRIBUTION ⚠️\nYou MUST strictly follow this exact question distribution per lesson. Do not deviate:\n${includedLessons}\n`;
                if (zeroLessons) {
                    distributionCommands += `* CRITICAL: Do NOT generate ANY questions from these lessons: ${zeroLessons}.\n`;
                }
            }

            const sysMsg = `You are a strict data formatter. Return ONLY valid JSON matching the schema. NO markdown.`;
            
            const teacherInstBlock = customInstructions ? (isEnglish ? `⚠️ TEACHER'S SPECIAL INSTRUCTIONS:\n${customInstructions}\nFollow these strictly.` : `⚠️ تعليمات خاصة من المعلم:\n${customInstructions}\nيجب أن تنفذ هذه التعليمات بدقة.`) : '';

            const distinctInstruction = (modelsType === 'distinct' && requestedModelsCount > 1) ? 
                (isEnglish ? `\n⚠️ CRITICAL: Generate EXACTLY the multiplied number of questions below to create ${requestedModelsCount} DISTINCT exams. DO NOT repeat questions.` 
                           : `\n⚠️ تنبيه حرج: يجب توليد أسئلة غير مكررة ومختلفة تماماً لتغطي العدد الكبير المطلوب أدناه، ليتم تقسيمها لنماذج مستقلة.`) : '';

            const contentGuidance = isEnglish ? `
Content Coverage, Priority & Answer Formatting:
1. STRICT DISTRIBUTION (CRITICAL): You MUST include at least one question from EVERY SINGLE LESSON provided in the Reference Texts. DO NOT ignore any lesson. If there are reading, rhetoric, or literature lessons, they must have questions generated for them just like grammar.
2. CONTENT FOCUS: Test the *APPLICATION* of grammar in context. For science/theory, focus strictly on core concepts, important facts, and main definitions related to lesson objectives and you must avoid asking about the rules but asking about the practical use, for examble : don't ask what are the uses of the past tense instead give a sentence in the past to choose the correct form of the verb.
3. QUESTION LENGTH (CRITICAL): Keep True/False statements very concise (maximum one short line). Multiple-choice options MUST be extremely short (1-4 words maximum).
4. DISTRACTORS: Wrong options in MCQ should be logical and based on common mistakes. Vary cognitive levels.
5. For TF, Blank, Match, and Essay: Return an object with 'q' for the question text and 'a' for the correct answer text.
6. MATCHING: Put the item in 'q' and its correct match in 'a'.
7. BLANK: Put '........' in 'q' where the word is missing, and put the missing word in 'a'.
8. READING QUESTIONS FORMAT: All sub-questions for the reading passage MUST be strictly Multiple Choice Questions (type: "mcq") with 4 short options. Do not use essay or true/false for the reading passage unless the teacher explicitly asks for it in the special instructions.
` : `
توجيهات المحتوى والحلول (هامة جداً وحرجة):
1. التوزيع الإجباري الشامل (قاعدة صارمة جداً): يجب أن يتضمن الاختبار أسئلة من **جميع الدروس المرفقة بلا استثناء**. يُمنع منعاً باتاً تجاهل أي درس! 
2. التركيز العلمي: ركز على المعلومات الهامة، المفاهيم المركزية، والتعريفات التي ترتبط بأهداف الدرس الأساسية.
3. طول الأسئلة (قاعدة صارمة): يجب أن تكون فقرات (صح/خطأ) قصيرة جداً (سطر واحد كحد أقصى). خيارات (الاختيار من متعدد) يجب أن تكون عبارات قصيرة جداً.
4. جودة الأسئلة: اجعل الخيارات الخاطئة (المشتتات) منطقية ومبنية على أخطاء شائعة للطلاب، ونوّع مستوى الأسئلة لتشمل (تذكر، فهم، تطبيق).
5. ركز في السؤال عن المفاهيم والنقاط الرئيسية الهامة وليس على النقاط الصغيرة والغامضة الا في حدود ٥% بحيث تكون الأسئلة الأولى من الأختبار تتميز بالسهولة. 
6. لأسئلة (صح/خطأ، أكمل الفراغ، المطابقة، المقالي): أعد كائناً يحتوي على 'q' لنص السؤال، و 'a' للإجابة الصحيحة.
7. أسئلة المطابقة: ضع الكلمة أو العبارة في 'q' وما يطابقها في 'a'.
8. أسئلة أكمل الفراغ: استبدل الكلمة المطلوبة بنقاط '........' في 'q'، وضع الكلمة الصحيحة في 'a'.
9. صيغة أسئلة القراءة: يجب أن تكون جميع الأسئلة الفرعية لقطعة القراءة من نوع الاختيار من متعدد (type: "mcq") حصراً وتحتوي على 4 خيارات قصيرة. لا تستخدم الأسئلة المقالية في القطعة إلا إذا طلب المعلم ذلك في التعليمات الخاصة.
10. قاعدة صارمة : في أسئلة الصح والخطأ يجب أن يكون عدد الأسئلة في الاختبار اسئلة الصح والخطأ متساويان ويجب وبصرامة توزيعها عشاوئيا، لا توزعها سؤال صح صح وسؤال أو اثنين صح واثنين خطأ وهكذا بنمط يستطيع الطالب تخمينه ولكن وزعها عشوائيا.
11. قاعدة صارمة : اسئلة الخيار من متعدد وزع الاجوبة الصحيحة  بين الخيارات بالتساوي وعشوائيا لا تضع مثلا كل الخيارات الصحيحة في الخيار الأول أو الثاني ولكن وزعها عشوائيا وبالتساوي بين الخيارات.
`;

            const officialMathBlock = `⚠️ MATH & SCIENCE RULES (CRITICAL):
- ARABIC MATH SYMBOLS (CRITICAL): For Arabic exams, you MUST TRANSLATE all mathematical symbols, variables, and functions to the standard Arabic math notation. THIS IS MANDATORY:
  * Variables: Use (س, ص, ع, ك, ل, م, ن, ر) instead of (x, y, z, k, l, m, n, r).
  * Trigonometry: Use (جا, جتا, ظا, ظتا, قا, قتا) instead of (sin, cos, tan, cot, sec, csc).
  * Limits: Use (نها) instead of (lim).
  * Complex Numbers: Use (ت) instead of (i), and write (أ + ب ت) instead of (a + bi).
  * Logarithms: Use (لو) instead of (log/ln).
  * Permutations (nPr): MUST use (ل) such as ل(ن, ر). NEVER output nPr.
  * Combinations (nCr): MUST use (ق) such as ق(ن, ر). NEVER output nCr.
  * Factorials (n!): Use (ن!) or write "مضروب ن". NEVER output English letters with factorials.
  STRICTLY FORBIDDEN to output ANY English math symbols (nPr, nCr, sin, cos, x, y, i, etc.) in Arabic exams.
  
  * Fractions: [frac:numerator,denominator]
  * Roots: [root:number]
  * Limits: [limit:condition,function]
  * Integrals: [int:function,lower,upper]
  * Powers (Math): [power:base,exponent]
  * Math Equations: [eq:equation] -> Wrap ALL standalone numbers, variables, and math formulas here. Example: [eq:جا(س)] or [eq:س + ٥ = ١٠] or [eq:ل(ن, ر)].
  * Chemistry Compounds: Write naturally! Examples: H2O, CO2, CaBr2. (DO NOT use shortcodes for atom counts).
  * Chemistry Ions & Isotopes: Use the ^ symbol for superscripts. Examples: Na^+, Cl^-, Cl^17.
  * Chemistry Equations: CRITICAL! Wrap ALL chemical reactions inside [chem: ... ] to force Left-to-Right layout. Example: [chem: Cl2 + 2NaOH ⟶ NaCl + NaClO + H2O]
${isEnglish ? '' : '- NUMBERS: Use Eastern Arabic Numerals (١, ٢, ٣...) EXCEPT in Chemistry formulas (MUST use English numbers 1, 2, 3).' }
- SYMBOLS: Use ⟶ for chemical reactions, ⇌ for reversible reactions, and ± ≠ ≤ ≥ ° π ∞ where relevant.`;

            const prompt = `
Create an exam based ONLY on the provided reference texts.
Difficulty: ${difficulty}. Language: ${isEnglish ? 'English' : 'Arabic'}.${distinctInstruction}
${teacherInstBlock}
${officialMathBlock}
${contentGuidance}

${distributionCommands}

Required Total Questions by Type:
${typesListText}

Reference Texts:
${combinedText}
`;

            const model = settings.defaultModel || 'gemini-3.5-flash';
            let rawExamData = await core.callGemini(model, sysMsg, prompt, OFFICIAL_EXAM_SCHEMA);
            rawExamData = ensureMathShortcodes(rawExamData);
            
            const models = generateDerivedModels(rawExamData, requestedModelsCount, modelsType, core, isEnglish, typeSettings);

            const payload = {
                subject: selectedLessons[0]?.subject || settings.subject || '',
                grade: selectedLessons[0]?.grade || '',
                date: new Date().toLocaleDateString(isEnglish ? 'en-GB' : 'ar-EG'),
                teacher: settings.teacher || '',
                school: settings.school || '',
                gov: settings.directorate || '',
                examData: models[0].examData, 
                models: models,
                modelsCount: models.length,
                isEnglish: isEnglish
            };

            localStorage.setItem('Pending_AI_Exam', JSON.stringify(payload));
            core.hideOverlay();
          core.toast(models.length > 1 ? `تم تجهيز (${models.length}) نماذج اختبار جاهزة مع مفاتيح الحل!` : `تم تجهيز الاختبار بنجاح!`, 'success');
            
            window.location.href = EXAM_APP_FILE;

        } catch (e) {
            core.hideOverlay();
            console.error(e);
            core.toast('حدث خطأ أثناء التوليد: ' + e.message, 'error');
        }
    }


       function openOptionsAndGenerate(selectedLessons, typeSettings, difficulty, isEnglish) {
        let modal = document.createElement('div');
        modal.className = 'modal-bg is-active';
        modal.id = 'officialExamOptionsModal';
        modal.style.zIndex = '9999';
        
        const isAr = !isEnglish;
        const titleText = isAr ? '⚙️ خيارات الاختبار الرسمي' : '⚙️ Official Exam Options';
        const modelLabel = isAr ? '🔢 عدد النماذج المطلوبة (1 إلى 6):' : '🔢 Requested Models Count (1 to 6):';
        const typeLabel = isAr ? 'نوع النماذج (في حال طلبت أكثر من نموذج):' : 'Models Type (if count > 1):';
        const instLabel = isAr ? '💡 طلبات خاصة للمعلم (اختياري):' : '💡 Teacher Special Instructions (Optional):';
        const instPlaceholder = isAr ? 'مثال: ركز على التعاريف، كثر من أسئلة القواعد...' : 'e.g. Focus on definitions, avoid complex grammar...';
        const btnText = isAr ? '🚀 توليد الاختبار الآن' : '🚀 Generate Exam Now';

        // حساب إجمالي الأسئلة المطلوبة لعمل توزيع مبدئي
        let totalRequestedQs = typeSettings.reduce((sum, t) => sum + parseInt(t.count), 0);
        let defaultPerLesson = Math.max(1, Math.floor(totalRequestedQs / selectedLessons.length));

        // بناء قائمة الدروس مع حقول الإدخال
        let lessonsHtml = `<div style="margin-top:15px; border:1.5px solid #cbd5e1; border-radius:8px; padding:10px; background:#f8fafc; max-height:180px; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label style="font-weight:900; font-size:13px; color:#0f172a; margin:0;">📊 توزيع الأسئلة على الدروس:</label>
                <span style="font-size:11px; background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:bold;">الإجمالي التقريبي: <span id="lbl-total-qs">${totalRequestedQs}</span></span>
            </div>`;
        
        selectedLessons.forEach((lesson, i) => {
            lessonsHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px;">
                <div style="font-size:12px; font-weight:bold; color:#1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 75%;" title="${lesson.title}">${i+1}. ${lesson.title}</div>
                <input type="number" class="lesson-q-count" data-index="${i}" value="${defaultPerLesson}" min="0" max="50" style="width: 50px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; font-weight: bold; outline:none;" onchange="updateTotalQsLabel()">
            </div>`;
        });
        lessonsHtml += `</div>`;

        modal.innerHTML = `
        <div class="modal-card" style="max-width: 480px; text-align: ${isAr ? 'right' : 'left'}; padding: 20px; border-radius: 16px;">
            <div class="modal-hdr" style="justify-content: center; position: relative; border-bottom: 2px dashed #e2e8f0; padding-bottom: 10px;">
                <h2 style="color: #4f46e5; margin: 0; font-size: 20px; font-weight: 900;">${titleText}</h2>
                <button class="modal-close" style="position: absolute; ${isAr ? 'left' : 'right'}: 0; top: -5px;" onclick="document.getElementById('officialExamOptionsModal').remove()">✕</button>
            </div>
            <div class="modal-body" style="padding-top: 15px;">
                
                <div style="display:flex; gap:10px;">
                    <label style="flex:1; display:block; font-weight:900; font-size:14px; color:#1e293b; margin-bottom:8px;">
                        ${modelLabel}
                        <input type="number" id="officialModelsCount" min="1" max="6" value="1" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-family:inherit; font-size:15px; font-weight:bold; margin-top:5px; outline:none; text-align:center;">
                    </label>
                </div>

                <label style="display:block; font-weight:900; font-size:14px; color:#1e293b; margin-top:10px; margin-bottom:8px;">
                    ${typeLabel}
                    <select id="officialModelsType" style="width:100%; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-family:inherit; font-size:14px; font-weight:bold; margin-top:5px; outline:none;">
                        <option value="shuffled" selected>${isAr ? '🔄 تبديل (نفس الأسئلة بترتيب وخيارات مختلفة)' : '🔄 Shuffled (Same questions, different order)'}</option>
                        <option value="distinct">${isAr ? '✨ نماذج حقيقية (أسئلة مختلفة تماماً لكل نموذج)' : '✨ Distinct (Completely different questions)'}</option>
                    </select>
                </label>
                
                ${lessonsHtml}
                
                <label style="display:block; font-weight:900; font-size:14px; color:#1e293b; margin-top:15px; margin-bottom:8px;">
                    ${instLabel}
                    <textarea id="officialCustomInstructions" placeholder="${instPlaceholder}" style="width:100%; height:60px; padding:10px; border-radius:8px; border:1.5px solid #cbd5e1; font-family:inherit; font-size:13px; margin-top:5px; outline:none; resize:none;" onfocus="this.style.borderColor='#4f46e5'" onblur="this.style.borderColor='#cbd5e1'"></textarea>
                </label>
                
                <button id="btnStartOfficialGen" class="btn-primary" style="width:100%; margin-top:15px; padding:12px; border-radius:12px; font-size:16px; font-weight:900; background:#10b981; border:none; color:white; cursor:pointer;">${btnText}</button>
            </div>
        </div>
        `;
        document.body.appendChild(modal);

        // دالة صغيرة لتحديث المجموع عند تغيير الأرقام
        window.updateTotalQsLabel = function() {
            let sum = 0;
            document.querySelectorAll('.lesson-q-count').forEach(inp => sum += (parseInt(inp.value)||0));
            let lbl = document.getElementById('lbl-total-qs');
            if(lbl) lbl.innerText = sum;
        };

        document.getElementById('btnStartOfficialGen').onclick = () => {
            let countInput = document.getElementById('officialModelsCount').value;
            let modelsType = document.getElementById('officialModelsType').value;
            let customInst = document.getElementById('officialCustomInstructions').value.trim();
            
            // تجميع توزيع الأسئلة من القائمة
            let lessonDistribution = [];
            document.querySelectorAll('.lesson-q-count').forEach(input => {
                let idx = parseInt(input.getAttribute('data-index'));
                let count = parseInt(input.value) || 0;
                lessonDistribution.push({ title: selectedLessons[idx].title, count: count });
            });
            
            countInput = countInput.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
            let requestedModelsCount = parseInt(countInput) || 1;
            requestedModelsCount = Math.max(1, Math.min(requestedModelsCount, 6));

            document.getElementById('officialExamOptionsModal').remove();
            // تمرير مصفوفة التوزيع الجديدة كمعامل أخير
            generateOfficialExamJSON(selectedLessons, typeSettings, difficulty, isEnglish, requestedModelsCount, customInst, modelsType, lessonDistribution);
        };
    }


    return { openOptionsAndGenerate };
})();

