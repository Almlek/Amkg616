/* ═══════════════════════════════════════════════════════
   evaluation.js — نظام التقييم الذاتي واستمارة الموجه التربوي الرسمية
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const EVAL_CRITERIA = [
      { domain: 'التخطيط', title: 'يضع الخطة الفصلية السنوية بحيث تخدم الموضوعات المقررة.', description: 'يهدف هذا المجال للتأكد من قدرتك على وضع خطة زمنية ومنهجية واضحة ومترابطة.', hint: 'استخدم أيقونة (🗓️ الخطة الفصلية) في التطبيق لإنشاء خطة منهجية.', indicators: ['يحدد أهداف الموضوعات بوضوح في الخطة السنوية أو الفصلية.','يربط الدروس بموضوعات المقرر وتسلسلها.','يوزع الزمن المخصص على موضوعات المقرر.','يحدد أنشطة مرتبطة بالموضوعات وتعزز فهمها.','يعدل الخطة عند الحاجة بما يتناسب مع تقدم المتعلمين.'] },
      { domain: 'التخطيط', title: 'أهداف التعلم والخطة الدرسية تخدم التعلم النشط.', description: 'يهدف للتأكد من أن خطتك اليومية تركز على الطالب وتتيح له المشاركة الفاعلة.', hint: 'استخدم زر (⚡ توليد الخطة).', indicators: ['يدرج في الخطة أنشطة تحفز التفكير.','يخطط لمواقف تتيح مشاركة المتعلمين.','يضمن الخطة فرصاً للتعلم الذاتي.','يحدد أنشطة تدعم التعلم التعاوني.','يضمن مهاماً تنمي استقلالية المتعلمين في التعلم.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يمهد للدرس بشكل مشوق.', description: 'جذب انتباه الطلاب من اللحظة الأولى وربط تفكيرهم بموضوع الدرس الجديد.', hint: 'استخدم زر (🌍 ربط الدرس بالواقع).', indicators: ['يستهل الدرس بسؤال مثير مرتبط بموضوعه.','يوظف قصة أو مثالاً واقعياً لجذب الانتباه.','يستخدم وسيطاً تعليمياً مناسباً لزيادة الاهتمام.','يقدم مدخلاً موجزاً يوضح الفكرة العامة للدرس.','يطرح موقفاً يثير فضول المتعلمين وتساؤلاتهم.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يلم بالمادة العلمية.', description: 'يقيس تمكنك من المحتوى العلمي، وتقديمك لشرح دقيق ومترابط.', hint: 'زر (📚 ملخص شامل) يولد لك مرجعاً علمياً دقيقاً.', indicators: ['يشرح المفاهيم الأساسية شرحاً واضحاً ومترابطاً.','يدعم المعلومات بمصادر أو شواهد مناسبة.','يقدم أمثلة توضيحية صحيحة.','ينوع أساليب الشرح بما يلائم طبيعة المحتوى.','يقدم معلومات دقيقة ويصحح الأخطاء العلمية.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يوظف مهارات الاتصال والتواصل.', description: 'التواصل الفعال والمتبادل بينك وبين الطلاب.', hint: 'منصة (🗣️ الاختبارات الشفوية) تضمن لك تواصلاً عادلاً.', indicators: ['يستخدم لغة واضحة تناسب مستوى المتعلمين.','يصغي إلى أسئلة المتعلمين وإجاباتهم باهتمام.','يقدم ملاحظات بناءة ومحددة.','يوظف الإيماءات وحركات الجسد بما يدعم التوضيح.','يحفز المتعلمين على التفاعل أثناء الدرس.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يربط موضوعات الدرس بخبرات المتعلمين.', description: 'ربط النظريات باحتياجات الطلاب وحياتهم اليومية.', hint: 'زر (🌍 ربط الدرس بالواقع) يوضح لك المهن المستقبلية.', indicators: ['يطرح أمثلة من الحياة اليومية للمتعلمين.','يربط موضوع الدرس باحتياجات المتعلمين المستقبلية.','يوظف تجارب المتعلمين في توضيح المفاهيم.','يطلب من المتعلمين تقديم أمثلة من واقعهم.','يبني التعلم الجديد على خبراتهم السابقة.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يستخدم طرائق تدرس قائمة على تفعيل دور المتعلمين.', description: 'اعتمادك على التعلم النشط، والمناقشات.', hint: 'اضغط (👨‍🏫 الموجه الشخصي) ليقترح عليك استراتيجيات.', indicators: ['ينظم مناقشات جماعية مرتبطة بموضوع الدرس.','يستخدم العصف الذهني في مواقف مناسبة.','يتيح للمتعلمين طرح الأسئلة ومناقشتها.','ينفذ أنشطة عملية أو ميدانية مناسبة.','يوجه المتعلمين إلى اكتشاف الإجابات بأنفسهم.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يحافظ على قواعد السلوك الصفي.', description: 'قدرتك على ضبط الفصل بحزم وعدل.', hint: 'استخدم شاشة (📊 الدرجات والحضور).', indicators: ['يوضح قواعد السلوك الصفي للمتعلمين.','يعالج المشكلات السلوكية بمرونة واتزان.','يطبق إجراءات الضبط التربوي بعدل ودون تمييز.','ينمي الانضباط الذاتي لدى المتعلمين.','يعزز السلوك الإيجابي عند ظهوره.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يستجيب لاحتياجات المتعلمين.', description: 'مراعاة الفروق الفردية وتقديم الدعم للطلاب.', hint: 'شارك (📝 الملخص التفاعلي) مع الطلاب.', indicators: ['يقدم دعماً فردياً للمتعلمين المتعثرين.','ينوع أساليب التدريس بما يناسب مستويات المتعلمين.','يستجيب لتساؤلات المتعلمين بوضوح وفي الوقت المناسب.','يتيح وقتاً أو مساندة إضافية لمن يحتاج.','يستخدم استراتيجيات تعلم متنوعة لتلبية الاحتياجات المختلفة.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يهيئ بيئة صفية ملائمة للدرس.', description: 'تنظيم الفصل مادياً ونفسياً.', hint: 'استخدم (🌐 المنصة المدرسية) لإنشاء بيئة إلكترونية.', indicators: ['ينظم البيئة الصفية بما يلائم تنفيذ الدرس.','يهيئ مصادر وأدوات التعلم المتاحة قبل استخدامها.','يتأكد، في حدود الإمكانات المتاحة، من ملاءمة الإضاءة والتهوية.','ينظم المقاعد بما يتيح تفاعل المتعلمين.','يعزز جواً من الأمان والراحة النفسية داخل الصف.'] },
      { domain: 'الأداء التدريسي المباشر للمعلم', title: 'يوظف تقنيات ووسائط التعلم بفعالية.', description: 'دمج التقنية بشكل سليم يخدم أهداف الدرس.', hint: 'استخدم زر التصدير إلى (📽️ عرض تقديمي PPTX).', indicators: ['يوظف تقنية حديثة مناسبة لهدف الدرس.','يعرض مادة مرئية تعليمية عند الحاجة.','يستخدم تطبيقاً تعليمياً تفاعلياً مناسباً للمحتوى.','يوظف وسائط سمعية أو بصرية لدعم الشرح.','يتيح مصادر تعلم إلكترونية مرتبطة بموضوع الدرس.'] },
      { domain: 'فاعلية أساليب التقويم', title: 'يقيم أعمال المتعلمين الصفية.', description: 'متابعة فهم الطلاب وتقويم استجاباتهم.', hint: 'قم بإطلاق (⚡ اختبار إلكتروني) للطلاب عبر المنصة المدرسية.', indicators: ['يقدم تغذية راجعة فورية على أعمال المتعلمين الصفية.','يقوّم الأنشطة الصفية أثناء تنفيذها.','يطرح أسئلة تفاعلية لقياس مستوى الفهم.','يستخدم أساليب تقويم تشجع المتعلمين على التحسن.','ينوع أساليب التقويم لتشمل الأنشطة والمشاركة.'] },
      { domain: 'فاعلية أساليب التقويم', title: 'يهتم بالواجبات المنزلية.', description: 'اختيار واجبات هادفة وتصحيحها بانتظام.', hint: 'زر (🏠 إنشاء واجب منزلي) يولد ملفاً تفاعلياً.', indicators: ['يحدد الواجب المنزلي بوضوح.','يقدم ملاحظات واضحة على الواجبات المنجزة.','يتابع إنجاز المتعلمين للواجبات بانتظام.','يختار واجبات تدعم المفاهيم المدروسة.','يمنح المتعلمين وقتاً مناسباً لإنجاز الواجب.'] },
      { domain: 'فاعلية أساليب التقويم', title: 'يوظف السجلات التربوية.', description: 'الاحتفاظ بسجلات دقيقة ومنظمة.', hint: 'تطبيق (📊 الدرجات والحضور) هو سجلك الإلكتروني الدقيق.', indicators: ['يسجل نتائج التقويم بانتظام.','يستخدم السجلات لمتابعة تقدم المتعلمين.','يحتفظ بسجل واضح لنتائج كل متعلم.','يتابع أداء المتعلمين دراسياً على مدار العام.','يستخرج من السجلات نقاط القوة ومواطن الضعف.'] },
      { domain: 'فاعلية أساليب التقويم', title: 'يعد اختبارات تحصيلية سليمة.', description: 'بناء اختبارات متوازنة تقيس مستويات التفكير.', hint: 'استخدم (🧪 إعداد اختبار شامل) من بنك الأسئلة.', indicators: ['يصوغ أسئلة تقيس مستويات معرفية متنوعة.','يكتب تعليمات الاختبار بوضوح ودون لبس.','ينوع بين الأسئلة المقالية والموضوعية بما يناسب الأهداف.','يغطي الاختبار أهداف المقرر ومحتواه المستهدف.','يحدد زمناً مناسباً للإجابة عن أسئلة الاختبار.'] },
      { domain: 'فاعلية أساليب التقويم', title: 'يوظف نتائج التقويم في تحسين وتطوير عمليتي التعليم والتعلم.', description: 'تحويل الدرجات إلى أفعال؛ عبر تعديل الشرح وتخصيص خطط للمتعثرين.', hint: 'استخدم أداة (📝 حل تقويم الوحدة) لتوليد إجابات نموذجية.', indicators: ['يعدل أساليب تدريسه في ضوء نتائج التقويم.','يضع خططاً علاجية للمتعلمين المتعثرين.','يكيف الأنشطة ومهام التعلم وفق النتائج.','يعرض نتائج التقويم في الاجتماعات المهنية لتبادل الخبرات.','يعزز جوانب القوة ويتابع أثر إجراءات التحسين.'] },
      { domain: 'تقييم مستوى الطلبة', title: 'يسير في المقرر الدراسي وفقاً للخطة.', description: 'التوازن في الشرح لتغطية المنهج في وقته المخصص.', hint: 'ربط (📅 جدول الحصص) بالمكتبة يجعلك تسير بانتظام.', indicators: ['ينفذ موضوعات المقرر وفق التوزيع الزمني للخطة.','يغطي موضوعات الخطة دون حذف غير مبرر.','يوازن بين عرض المحتوى والأنشطة ضمن الزمن المخطط.','يخصص فترات للمراجعة قبل الاختبارات.','يراجع مستوى الإنجاز ويعالج التأخر في تنفيذ الخطة.'] },
      { domain: 'تقييم مستوى الطلبة', title: 'المستوى التحصيلي للطلبة.', description: 'المتابعة المباشرة لمستوى الطالب وإرشاده لما يحسن أداءه.', hint: 'بطاقة الأداء في (سجل الدرجات) توضح المنحنى التحصيلي.', indicators: ['يتابع تحصيل المتعلمين من خلال نتائج الاختبارات الدورية.','يقدم ملاحظات موجهة لتحسين الأداء التحصيلي.','يشجع المتعلمين على مراجعة أدائهم بانتظام.','يحدد مواطن الضعف ويضع إجراءات لتحسينها.','يقدم إرشادات أو مهاماً إثرائية للمتعلمين المتفوقين.'] },
      { domain: 'الصفات الشخصية', title: 'يهتم بالمظهر وحسن الهندام.', description: 'أن يكون المعلم قدوة حسنة في المظهر العام.', hint: 'الاحترافية الرقمية تكمل احترافيتك الشخصية.', indicators: ['يلتزم بالزي المعتمد أو اللباس الملائم.','يحافظ على نظافة مظهره الشخصي.','يراعي القيم والضوابط المهنية في مظهره.','يظهر بمظهر لائق يعكس صورة إيجابية.','يحافظ على انضباط مظهره طوال الدوام المدرسي.'] },
      { domain: 'الصفات الشخصية', title: 'يحافظ على الدوام المدرسي.', description: 'الالتزام التام بالمواعيد والحصص لضمان سير العملية.', hint: 'شاشة (📅 جدول الحصص التفاعلي) ترتب أوقاتك وحصصك.', indicators: ['يحضر إلى المدرسة في الموعد المحدد.','يلتزم بالحضور الصباحي وفق النظام المدرسي.','يلتزم بمواعيد الحصص والمهام المدرسية.','لا يتغيب إلا بعذر معتمد.','يعوض الحصص الفائتة وفق الإجراءات المعتمدة.'] },
      { domain: 'الصفات الشخصية', title: 'يتقبل التوجيهات.', description: 'المرونة في تقبل النقد البناء والرغبة الدائمة في التطور.', hint: 'استخدامك لتطبيق الذكي هو دليل على انفتاحك للتطوير!', indicators: ['يظهر استعداداً للتعلم من خبرات الآخرين.','يتعامل مع الملاحظات والنقد المهني بإيجابية.','يطلب التوضيح أو المساندة عند الحاجة.','يطبق التوجيهات لتحسين أدائه.','يبادر إلى تطوير ممارساته في ضوء التوجيهات.'] }
  ];

  window.openSelfEvalModal = function() {
      const container = document.getElementById('evalCardsContainer');
      if (container.innerHTML.trim() === '') {
          let html = `
          <style>
              .eval-radio-group { display: flex; gap: 8px; justify-content: flex-end; align-items: center; background: #F8FAFC; padding: 10px; border-radius: 8px; border: 1px solid #E2E8F0; margin-top: 15px; flex-wrap: wrap; }
              .eval-radio-label { display: flex; align-items: center; gap: 5px; cursor: pointer; background: #ffffff; border: 1px solid #CBD5E1; padding: 6px 12px; border-radius: 6px; font-weight: bold; color: #475569; transition: 0.2s; font-size: 13.5px; }
              .eval-radio-label input[type="radio"] { accent-color: #7C3AED; width: 16px; height: 16px; cursor: pointer; }
              .eval-radio-label:hover { background: #F1F5F9; border-color: #7C3AED; }
              .eval-radio-group input[value="5"]:checked + span { color: #166534; }
              .eval-radio-group input[value="4"]:checked + span { color: #1E40AF; }
              .eval-radio-group input[value="3"]:checked + span { color: #92400E; }
              .eval-radio-group input[value="2"]:checked + span { color: #9A3412; }
              .eval-radio-group input[value="1"]:checked + span { color: #991B1B; }
          </style>
          `;

          EVAL_CRITERIA.forEach((crit, index) => {
              let indicatorsHtml = `<ul style="margin: 0; padding-right: 20px; color: #334155; font-size: 13.5px; line-height: 1.6;">`;
              crit.indicators.forEach((ind) => { indicatorsHtml += `<li style="margin-bottom: 5px;">${ind}</li>`; });
              indicatorsHtml += `</ul>`;

              let ratingHtml = `
              <div class="eval-radio-group">
                  <strong style="color: #1E293B; margin-left: auto;">حدد تقييمك للمعيار:</strong>
                  <label class="eval-radio-label" style="background:#FEE2E2; border-color:#FCA5A5;"><input type="radio" name="eval_score_${index}" value="1" onchange="calculateEvalScore()"> <span>1 (ضعيف جداً)</span></label>
                  <label class="eval-radio-label" style="background:#FFEDD5; border-color:#FCD34D;"><input type="radio" name="eval_score_${index}" value="2" onchange="calculateEvalScore()"> <span>2 (ضعيف)</span></label>
                  <label class="eval-radio-label" style="background:#FEF3C7; border-color:#FDE047;"><input type="radio" name="eval_score_${index}" value="3" onchange="calculateEvalScore()"> <span>3 (متوسط)</span></label>
                  <label class="eval-radio-label" style="background:#DBEAFE; border-color:#93C5FD;"><input type="radio" name="eval_score_${index}" value="4" onchange="calculateEvalScore()"> <span>4 (جيد جداً)</span></label>
                  <label class="eval-radio-label" style="background:#DCFCE7; border-color:#86EFAC;"><input type="radio" name="eval_score_${index}" value="5" onchange="calculateEvalScore()"> <span>5 (ممتاز)</span></label>
              </div>
              `;

              html += `
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                      <span style="background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 900;">المجال: ${crit.domain}</span>
                  </div>
                  <h4 style="margin: 0 0 12px 0; color: #1E293B; font-size: 16px; line-height: 1.5;">${index + 1}. ${crit.title}</h4>
                  <div style="background: #FFFBEB; border-right: 4px solid #F59E0B; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px;">
                      <p style="margin: 0; color: #92400E; font-size: 13px; line-height: 1.6;"><strong>💡 الهدف:</strong> ${crit.description}</p>
                  </div>
                  <div style="background: #ECFDF5; border-right: 4px solid #10B981; padding: 10px 12px; border-radius: 8px; margin-bottom: 15px;">
                      <p style="margin: 0; color: #065F46; font-size: 13px; font-weight: bold; line-height: 1.6;">🚀 دليلك في الذكي: ${crit.hint}</p>
                  </div>
                  <div style="background: #F8FAFC; padding: 10px 15px; border-radius: 8px; border: 1px solid #E2E8F0;">
                      <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #64748B;">مؤشرات المعيار (للاسترشاد):</p>
                      ${indicatorsHtml}
                      ${ratingHtml}
                  </div>
              </div>
              `;
          });
          container.innerHTML = html;
      }

      if (!document.getElementById('btnOpenSupervisorForm')) {
          const footerDiv = document.querySelector('#selfEvalModal > div > div:last-child');
          const exportBtnHtml = `
              <button id="btnOpenSupervisorForm" onclick="openSupervisorDataModal()" style="margin-top: 15px; width: 100%; background: #4C1D95; color: white; padding: 12px; border: none; border-radius: 8px; font-weight: 900; font-size: 15px; font-family: inherit; cursor: pointer; box-shadow: 0 4px 10px rgba(76, 29, 149, 0.3); transition: 0.2s;">
                  📄 عرض وتوليد الاستمارة الرسمية كملف
              </button>
          `;
          footerDiv.insertAdjacentHTML('beforeend', exportBtnHtml);
      }

      document.getElementById('selfEvalModal').classList.add('is-active');
      calculateEvalScore(); 
  };

  window.calculateEvalScore = function() {
      let totalScore = 0;
      const totalIndicators = 105; 

      EVAL_CRITERIA.forEach((crit, index) => {
          const selectedRadio = document.querySelector(`input[name="eval_score_${index}"]:checked`);
          if (selectedRadio) {
              totalScore += parseInt(selectedRadio.value);
          }
      });
      
      document.getElementById('evalScoreDisplay').textContent = totalScore;
      const totalDisplayEl = document.getElementById('evalScoreDisplay').nextElementSibling;
      if (totalDisplayEl) totalDisplayEl.textContent = ' / ' + totalIndicators;
      
      let feedback = '';
      const ft = document.getElementById('evalFeedbackText');
      const percentage = totalIndicators > 0 ? Math.round(totalScore / 1.05) : 0;

      if (percentage >= 90) { feedback = `التقدير النهائي: ممتاز (${percentage}%) 🌟`; ft.style.color = '#10B981'; }
      else if (percentage >= 80) { feedback = `التقدير النهائي: جيد جداً (${percentage}%) ✨`; ft.style.color = '#0284C7'; }
      else if (percentage >= 70) { feedback = `التقدير النهائي: جيد (${percentage}%) 👍`; ft.style.color = '#D97706'; }
      else if (percentage >= 50) { feedback = `التقدير النهائي: متوسط (${percentage}%) ⚠️`; ft.style.color = '#EA580C'; }
      else if (totalScore > 0) { feedback = `التقدير النهائي: ضعيف (${percentage}%) ❌`; ft.style.color = '#DC2626'; }
      else { feedback = 'قم باختيار الدرجة المناسبة من 1 إلى 5 لكل معيار.'; ft.style.color = '#64748B'; }
      ft.textContent = feedback;
  };

  // ══════════════════════════════════════════════════════════════
  // 🖨️ توليد استمارة الموجه كـ "مستند رسمي" متجاوب من صفحتين
  // ══════════════════════════════════════════════════════════════

  window.openSupervisorDataModal = function() {
      let sModal = document.getElementById('supervisorDataModal');
      
      if (!sModal) {
          sModal = document.createElement('div');
          sModal.id = 'supervisorDataModal';
          sModal.className = 'modal-bg';
          
          const currentTeacher = document.getElementById('fTeacher')?.value || '';
          const currentSubject = document.getElementById('fSubject')?.value || '';
          const currentGrade = document.getElementById('fGrade')?.value || '';
          const currentSchool = document.getElementById('fSchool')?.value || '';
          const currentTitle = document.getElementById('fTitle')?.value || '';
          const currentSection = document.getElementById('fSection')?.value || '';

          sModal.innerHTML = `
              <div class="modal-card" style="max-width: 600px; padding: 25px;">
                  <div class="modal-hdr" style="border-bottom: 2px dashed #7C3AED; padding-bottom: 15px; margin-bottom: 15px;">
                      <h2 style="color: #4C1D95; margin:0; font-size:18px;">📄 إكمال بيانات الاستمارة الرسمية</h2>
                      <button class="modal-close" onclick="document.getElementById('supervisorDataModal').classList.remove('is-active')">✕</button>
                  </div>
                  <div class="modal-body" style="max-height: 65vh; overflow-y: auto; padding-right: 5px;">
                      <p style="font-size:13.5px; color:#475569; margin-bottom:15px; font-weight:bold; background:#F1F5F9; padding:10px; border-radius:8px;">
                          💡 ملاحظة: يمكنك ترك أي حقل فارغاً، وسوف يُطبع كنقاط (..........) ليملأها الموجه بالقلم لاحقاً.
                      </p>
                      
                      <div class="grid-2">
                          <label class="field"><span>اسم المعلم/ة</span><input type="text" id="supTeacher" placeholder="................" value="${currentTeacher}"></label>
                          <label class="field"><span>المدرسة</span><input type="text" id="supSchool" placeholder="................" value="${currentSchool}"></label>
                          <label class="field"><span>المادة</span><input type="text" id="supSubject" placeholder="................" value="${currentSubject}"></label>
                          <label class="field"><span>موضوع الدرس</span><input type="text" id="supTitle" placeholder="................" value="${currentTitle}"></label>
                          <label class="field"><span>الصف</span><input type="text" id="supGrade" placeholder="................" value="${currentGrade}"></label>
                          <label class="field"><span>الشعبة</span><input type="text" id="supSection" placeholder="................" value="${currentSection}"></label>
                          <label class="field"><span>المؤهل الدراسي</span><input type="text" id="supQual" placeholder="................"></label>
                          <label class="field"><span>المحافظة</span><input type="text" id="supGov" placeholder="................"></label>
                          <label class="field"><span>المديرية</span><input type="text" id="supDir" placeholder="................"></label>
                          <label class="field"><span>الفترة</span><input type="text" id="supPeriod" placeholder="صباحي / مسائي"></label>
                          <label class="field"><span>الحالة الوظيفية</span><input type="text" id="supStatus" placeholder="أساسي / تعاقد"></label>
                          <label class="field"><span>عدد المتعلمين</span><input type="number" id="supCount" placeholder="0"></label>
                          <label class="field"><span>النصاب</span><input type="number" id="supQuota" placeholder="0"></label>
                      </div>
                      
                      <div class="grid-2" style="margin-top:10px;">
                          <label class="field"><span>النطاق الجغرافي</span>
                              <select id="supArea" class="form-sel"><option value="">......</option><option value="حضر">حضر</option><option value="ريف">ريف</option></select>
                          </label>
                          <label class="field"><span>نوع المعلم/ة</span>
                              <select id="supTeacherGender" class="form-sel"><option value="">......</option><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option></select>
                          </label>
                          <label class="field"><span>نوع الطلاب</span>
                              <select id="supStudentGender" class="form-sel"><option value="">......</option><option value="ذكور">ذكور</option><option value="إناث">إناث</option></select>
                          </label>
                      </div>
                      
                      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 15px 0;">
                      <label class="field"><span>اسم الموجه التربوي</span><input type="text" id="supName" placeholder=".........................................."></label>
                      
                      <button id="btnGenerateOfficialForm" class="btn-primary" style="width:100%; margin-top:20px; font-size:16px; padding:12px; border-radius:10px;">📝 حفظ وعرض الاستمارة</button>
                  </div>
              </div>
          `;
          document.body.appendChild(sModal);
          
          document.getElementById('btnGenerateOfficialForm').addEventListener('click', generateOfficialFormDocument);
      }
      
      const dirInput = document.getElementById('supDir');
      const savedDir = document.getElementById('sDirectorate')?.value;
      if (dirInput && !dirInput.value && savedDir) dirInput.value = savedDir;

      sModal.classList.add('is-active');
  };

  async function generateOfficialFormDocument() {
      const mainBtn = document.getElementById('btnGenerateOfficialForm');
      let btnOrigText = '';
      if (mainBtn) {
          btnOrigText = mainBtn.innerText;
          mainBtn.innerText = '⏳ جاري الحفظ...';
      }

      const getVal = (id, fallback) => {
          const el = document.getElementById(id);
          if (el && el.value.trim() !== '') return el.value.trim();
          return fallback;
      };

      const school = getVal('supSchool', '....................');
      const teacher = getVal('supTeacher', '....................');
      const subject = getVal('supSubject', '....................');
      const grade = getVal('supGrade', '....................');
      const section = getVal('supSection', '..........');
      const title = getVal('supTitle', '....................');
      
      let dateRaw = document.getElementById('fDate')?.value;
      let dateFormatted = dateRaw ? new Date(dateRaw).toLocaleDateString('ar-EG') : '..../..../202..';

      const gov = getVal('supGov', '....................');
      const dir = getVal('supDir', '....................');
      const period = getVal('supPeriod', '..........');
      const qual = getVal('supQual', '....................');
      const status = getVal('supStatus', '....................');
      const count = getVal('supCount', '..........');
      const quota = getVal('supQuota', '..........');
      
      const area = document.getElementById('supArea')?.value || '';
      const tGender = document.getElementById('supTeacherGender')?.value || '';
      const sGender = document.getElementById('supStudentGender')?.value || '';
      const supName = getVal('supName', '......................................');
      const directorName = '......................................';

      const chkArea1 = area === 'حضر' ? '✔' : ''; const chkArea2 = area === 'ريف' ? '✔' : '';
      const chkTGen1 = tGender === 'ذكر' ? '✔' : ''; const chkTGen2 = tGender === 'أنثى' ? '✔' : '';
      const chkSGen1 = sGender === 'ذكور' ? '✔' : ''; const chkSGen2 = sGender === 'إناث' ? '✔' : '';

      let totalScore = 0;
      let scores = [];
      EVAL_CRITERIA.forEach((crit, idx) => {
          let s = 0;
          const selected = document.querySelector(`input[name="eval_score_${idx}"]:checked`);
          if (selected) { s = parseInt(selected.value); }
          scores.push(s);
          totalScore += s;
      });

      const finalPercentage = Math.round(totalScore / 1.05);
      let finalRating = 'ضعيف';
      if (finalPercentage >= 90) finalRating = 'ممتاز';
      else if (finalPercentage >= 80) finalRating = 'جيد جداً';
      else if (finalPercentage >= 70) finalRating = 'جيد';
      else if (finalPercentage >= 50) finalRating = 'متوسط';

      // 🎨 CSS مصغر ومرن جداً ليمنع التشوه عند التصدير
      const cssStyles = `
      <style>
          .moe-wrapper { font-family: 'Times New Roman', Arial, serif; color: #000; direction: rtl; background: #fff; width: 100%; margin: 0 auto; font-size: 13px; }
          .moe-wrapper table { width: 100%; border-collapse: collapse; margin-bottom: 8px; color: #000; }
          .moe-wrapper th, .moe-wrapper td { border: 1px solid #000; padding: 4px; word-wrap: break-word; }
          .moe-bg-gray { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
          .moe-page-break { page-break-after: always; height: 10px; display: block; }
          @media print {
              .moe-wrapper { width: 100%; }
              body { background: white !important; }
              .moe-page-break { page-break-after: always; }
          }
      </style>
      `;

      // 💡 الحل الجذري للقطع: دمج المؤشرات في سطر واحد وربطها برمجياً بخلايا الجدول لتجنب الأخطاء
      const renderRow = (crit, idx, groupHtml = '') => {
          let s = scores[idx];
          let c1 = s===1?'✔':'', c2 = s===2?'✔':'', c3 = s===3?'✔':'', c4 = s===4?'✔':'', c5 = s===5?'✔':'';
          let inds = crit.indicators.map((ind, i) => `${i+1}. ${ind}`).join(' &nbsp; ');
          return `
              <tr style="page-break-inside: avoid;">
                  ${groupHtml}
                  <td style="text-align: center; color:#000;">${idx+1}</td>
                  <td style="text-align: right; font-weight: bold; color:#000;">${crit.title}</td>
                  <td style="text-align: right; font-size: 11.5px; line-height: 1.4; color:#000; text-align: justify;">${inds}</td>
                  <td style="font-weight: bold; text-align:center; color:#000;">${c1}</td>
                  <td style="font-weight: bold; text-align:center; color:#000;">${c2}</td>
                  <td style="font-weight: bold; text-align:center; color:#000;">${c3}</td>
                  <td style="font-weight: bold; text-align:center; color:#000;">${c4}</td>
                  <td style="font-weight: bold; text-align:center; color:#000;">${c5}</td>
              </tr>
          `;
      };

      // ــــــــــــــــــ الصفحة الأولى (التخطيط + الأداء التدريسي) ــــــــــــــــــ
      let page1 = `
      <div>
          <table style="border:none; margin-bottom:5px; font-weight:bold; font-size:12px; text-align:center;">
              <tr>
                  <td style="border:none; width:30%; text-align:right;">الجمهورية اليمنية<br>وزارة التربية والتعليم والبحث العلمي<br>قطاع المناهج وتخطيط التعليم<br>الإدارة العامة للتوجيه التربوي</td>
                  <td style="border:none; width:40%;"><span style="font-size:16px;">بسم الله الرحمن الرحيم</span><br><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Emblem_of_Yemen.svg/100px-Emblem_of_Yemen.svg.png" style="height:45px; margin-top:3px; filter:grayscale(100%); opacity:0.8;"></td>
                  <td style="border:none; width:30%; text-align:left;" dir="ltr">Republic of Yemen<br>Ministry of Education and Scientific Research<br>Curriculum and Educational Planning Sector<br>Educational Guidance Department</td>
              </tr>
          </table>
          <div style="border-top: 2px solid #000; margin-bottom:8px;"></div>
          <h2 style="text-align:center; font-size:18px; margin:0 0 10px 0; color:#000; font-weight:bold;">استمارة الزيارة الصفية (الموحدة)</h2>

          <table style="font-weight:bold; text-align:center;">
              <tr>
                  <td class="moe-bg-gray" style="width:10%;">المحافظة</td>
                  <td style="width:15%;">${gov}</td>
                  <td class="moe-bg-gray" style="width:10%;">المديرية</td>
                  <td style="width:15%;">${dir}</td>
                  <td class="moe-bg-gray" style="width:10%;">المدرسة</td>
                  <td style="width:16%;">${school}</td>
                  <td class="moe-bg-gray" style="width:6%;">الفترة</td>
                  <td style="width:8%;">${period}</td>
                  <td class="moe-bg-gray" style="width:10%;">حضر/ريف</td>
                  <td style="width:10%;">${chkArea1 ? 'حضر' : (chkArea2 ? 'ريف' : '')}</td>
              </tr>
          </table>
          <table style="font-weight:bold; text-align:center; border-top:none;">
              <tr>
                  <td class="moe-bg-gray" style="width:10%;">اسم المعلم</td>
                  <td style="width:25%;">${teacher}</td>
                  <td class="moe-bg-gray" style="width:10%;">المؤهل</td>
                  <td style="width:15%;">${qual}</td>
                  <td class="moe-bg-gray" style="width:10%;">الوظيفة</td>
                  <td style="width:15%;">${status}</td>
                  <td class="moe-bg-gray" style="width:5%;">النوع</td>
                  <td style="width:10%;">${chkTGen1 ? 'ذكر' : (chkTGen2 ? 'أنثى' : '')}</td>
              </tr>
          </table>
          <table style="font-weight:bold; text-align:center; border-top:none;">
              <tr>
                  <td class="moe-bg-gray" style="width:10%;">الصف</td>
                  <td style="width:25%;">${grade}</td>
                  <td class="moe-bg-gray" style="width:10%;">الشعبة</td>
                  <td style="width:15%;">${section}</td>
                  <td class="moe-bg-gray" style="width:10%;">المتعلمين</td>
                  <td style="width:15%;">${count}</td>
                  <td class="moe-bg-gray" style="width:5%;">النوع</td>
                  <td style="width:10%;">${chkSGen1 ? 'ذكور' : (chkSGen2 ? 'إناث' : '')}</td>
              </tr>
          </table>
          <table style="font-weight:bold; text-align:center; margin-bottom:12px; border-top:none;">
              <tr>
                  <td class="moe-bg-gray" style="width:10%;">تاريخ الزيارة</td>
                  <td style="width:20%;">${dateFormatted}</td>
                  <td class="moe-bg-gray" style="width:10%;">المادة</td>
                  <td style="width:15%;">${subject}</td>
                  <td class="moe-bg-gray" style="width:10%;">الموضوع</td>
                  <td style="width:25%;">${title}</td>
                  <td class="moe-bg-gray" style="width:5%;">النصاب</td>
                  <td style="width:5%;">${quota}</td>
              </tr>
          </table>

          <table>
              <thead>
                  <tr class="moe-bg-gray" style="text-align:center;">
                      <th style="width:6%;">المجال</th>
                      <th style="width:3%;">م</th>
                      <th style="width:18%;">المعايير</th>
                      <th style="width:58%;">المؤشرات</th>
                      <th style="width:3%;">1</th>
                      <th style="width:3%;">2</th>
                      <th style="width:3%;">3</th>
                      <th style="width:3%;">4</th>
                      <th style="width:3%;">5</th>
                  </tr>
              </thead>
              <tbody>
                  ${renderRow(EVAL_CRITERIA[0], 0, '<td rowspan="2" class="moe-bg-gray" style="text-align:center; font-weight:bold; writing-mode:vertical-rl; transform:rotate(180deg);">التخطيط</td>')}
                  ${renderRow(EVAL_CRITERIA[1], 1)}
                  <tr><td colspan="4" class="moe-bg-gray" style="text-align:center; font-weight:bold;">الإجمالي</td><td colspan="5" style="text-align:center; font-weight:bold;">${scores[0]+scores[1]}</td></tr>

                  ${renderRow(EVAL_CRITERIA[2], 2, '<td rowspan="9" class="moe-bg-gray" style="text-align:center; font-weight:bold; writing-mode:vertical-rl; transform:rotate(180deg);">الأداء التدريسي المباشر للمعلم</td>')}
                  ${renderRow(EVAL_CRITERIA[3], 3)}
                  ${renderRow(EVAL_CRITERIA[4], 4)}
                  ${renderRow(EVAL_CRITERIA[5], 5)}
                  ${renderRow(EVAL_CRITERIA[6], 6)}
                  ${renderRow(EVAL_CRITERIA[7], 7)}
                  ${renderRow(EVAL_CRITERIA[8], 8)}
                  ${renderRow(EVAL_CRITERIA[9], 9)}
                  ${renderRow(EVAL_CRITERIA[10], 10)}
                  <tr><td colspan="4" class="moe-bg-gray" style="text-align:center; font-weight:bold;">الإجمالي</td><td colspan="5" style="text-align:center; font-weight:bold;">${scores.slice(2,11).reduce((a,b)=>a+b,0)}</td></tr>
              </tbody>
          </table>
      </div>
      <div class="moe-page-break"></div>
      `;

      // ــــــــــــــــــ الصفحة الثانية (التقويم + الطلبة + الصفات) ــــــــــــــــــ
      let page2 = `
      <div>
          <table style="border:none; margin-bottom:5px; font-weight:bold; font-size:11px; text-align:center;">
              <tr>
                  <td style="border:none; width:30%; text-align:right;">Ministry of Education and Scientific Research<br>Curriculum and Educational Planning Sector<br>Governorate Education Office<br>Educational Guidance Department</td>
                  <td style="border:none; width:40%;"><span style="font-size:15px;">بسم الله الرحمن الرحيم</span><br><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Emblem_of_Yemen.svg/100px-Emblem_of_Yemen.svg.png" style="height:35px; margin-top:3px; filter:grayscale(100%); opacity:0.8;"></td>
                  <td style="border:none; width:30%; text-align:left;" dir="ltr">الجمهورية اليمنية<br>وزارة التربية والتعليم والبحث العلمي<br>قطاع المناهج وتخطيط التعليم<br>الإدارة العامة للتوجيه التربوي</td>
              </tr>
          </table>
          <div style="border-top: 2px solid #000; margin-bottom:8px;"></div>
          
          <table>
              <thead>
                  <tr class="moe-bg-gray" style="text-align:center;">
                      <th style="width:6%;">المجال</th>
                      <th style="width:3%;">م</th>
                      <th style="width:18%;">المعايير</th>
                      <th style="width:58%;">المؤشرات</th>
                      <th style="width:3%;">1</th>
                      <th style="width:3%;">2</th>
                      <th style="width:3%;">3</th>
                      <th style="width:3%;">4</th>
                      <th style="width:3%;">5</th>
                  </tr>
              </thead>
              <tbody>
                  ${renderRow(EVAL_CRITERIA[11], 11, '<td rowspan="5" class="moe-bg-gray" style="text-align:center; font-weight:bold; writing-mode:vertical-rl; transform:rotate(180deg);">فاعلية أساليب التقويم</td>')}
                  ${renderRow(EVAL_CRITERIA[12], 12)}
                  ${renderRow(EVAL_CRITERIA[13], 13)}
                  ${renderRow(EVAL_CRITERIA[14], 14)}
                  ${renderRow(EVAL_CRITERIA[15], 15)}
                  <tr><td colspan="4" class="moe-bg-gray" style="text-align:center; font-weight:bold;">الإجمالي</td><td colspan="5" style="text-align:center; font-weight:bold;">${scores.slice(11,16).reduce((a,b)=>a+b,0)}</td></tr>

                  ${renderRow(EVAL_CRITERIA[16], 16, '<td rowspan="2" class="moe-bg-gray" style="text-align:center; font-weight:bold; writing-mode:vertical-rl; transform:rotate(180deg);">تقييم مستوى الطلبة</td>')}
                  ${renderRow(EVAL_CRITERIA[17], 17)}
                  <tr><td colspan="4" class="moe-bg-gray" style="text-align:center; font-weight:bold;">الإجمالي</td><td colspan="5" style="text-align:center; font-weight:bold;">${scores.slice(16,18).reduce((a,b)=>a+b,0)}</td></tr>

                  ${renderRow(EVAL_CRITERIA[18], 18, '<td rowspan="3" class="moe-bg-gray" style="text-align:center; font-weight:bold; writing-mode:vertical-rl; transform:rotate(180deg);">الصفات الشخصية</td>')}
                  ${renderRow(EVAL_CRITERIA[19], 19)}
                  ${renderRow(EVAL_CRITERIA[20], 20)}
                  <tr><td colspan="4" class="moe-bg-gray" style="text-align:center; font-weight:bold;">الإجمالي</td><td colspan="5" style="text-align:center; font-weight:bold;">${scores.slice(18,21).reduce((a,b)=>a+b,0)}</td></tr>

                  <tr>
                      <td colspan="4" class="moe-bg-gray" style="text-align:center; font-weight:bold; font-size:14px;">الإجمالي الكلي</td>
                      <td colspan="5" style="text-align:center; font-weight:bold; font-size:14px;">${totalScore}</td>
                  </tr>
                  <tr>
                      <td colspan="9" class="moe-bg-gray" style="padding:6px; text-align:center; font-weight:bold; font-size:13px;">
                          إجمالي بنود الاستمارة : ( 105 ) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; التقدير : ( ${finalRating} )
                      </td>
                  </tr>
              </tbody>
          </table>

          <table style="font-size:13px; font-weight:bold; text-align:center; margin-top:12px;">
              <tr>
                  <td class="moe-bg-gray" style="width:50%;">جوانب التميز</td>
                  <td class="moe-bg-gray" style="width:50%;">نقاط تحتاج إلى تحسين</td>
              </tr>
              <tr>
                  <td style="padding:8px; height:70px; vertical-align:top; text-align:right; line-height:2;">
                      ...........................................................................................................<br>
                      ...........................................................................................................<br>
                      ...........................................................................................................
                  </td>
                  <td style="padding:8px; height:70px; vertical-align:top; text-align:right; line-height:2;">
                      ...........................................................................................................<br>
                      ...........................................................................................................<br>
                      ...........................................................................................................
                  </td>
              </tr>
              <tr>
                  <td style="padding:10px; height:60px; vertical-align:top;">
                      اسم الموجه التربوي / ${supName}<br><br>
                      التوقيع / ....................................
                  </td>
                  <td style="padding:10px; height:60px; vertical-align:top;">
                      اسم مدير المدرسة / ${directorName}<br><br>
                      التوقيع / ....................................
                  </td>
              </tr>
          </table>

          <div style="margin-top:10px; font-size:11px; font-weight:bold; line-height:1.5;">
              <ul style="margin:0; padding-right:15px; list-style-type: disc;">
                  <li>ملاحظة:</li>
                  <ul style="list-style-type: decimal; padding-right:20px; margin:2px 0;">
                      <li>معايير التميز التي حصلت على ( 4 أو 5 ) ، ومعايير التي تحتاج إلى تحسين الحاصلة على ( 1، 2، 3 ).</li>
                      <li>أقل من 50 ضعيف، من 50 إلى 69 متوسط، من 70 إلى 79 جيد، من 80 إلى 89 جيد جداً، من 90 إلى 100 ممتاز.</li>
                      <li>مجموع درجات التقويم النهائي للأداء: (105 يقسم على 1.05 = 100).</li>
                  </ul>
              </ul>
          </div>
      </div>
      `;

      try {
          const rec = {
              kind: 'quiz', 
              isDoc: true,
              title: 'استمارة تقييم موجه - ' + teacher.replace(/\./g, ''),
              subject: subject.replace(/\./g, ''),
              grade: grade.replace(/\./g, ''),
              language: 'ar',
              docHtml: '<div class="moe-wrapper">' + cssStyles + page1 + page2 + '</div>',
              createdAt: Date.now(),
              updatedAt: Date.now()
          };

          if (window.HaelCore && window.HaelCore.dbAdd) {
              const insertedId = await window.HaelCore.dbAdd('lessons', rec);
              document.getElementById('supervisorDataModal').classList.remove('is-active');
              document.getElementById('selfEvalModal').classList.remove('is-active');
              window.HaelCore.hideOverlay();
              window.HaelCore.toast('تم الحفظ! يتم الآن الفتح للطباعة...', 'success');
              
              const archiveBtn = document.querySelector('[data-nav="archive"]');
              if (archiveBtn) archiveBtn.click();
              
          } else {
              alert('عذراً، لم يتم العثور على دوال الحفظ. تأكد من تحميل التطبيق بالكامل.');
          }
      } catch (err) {
          alert('حدث خطأ أثناء الإنشاء.');
          console.error(err);
      } finally {
          if (mainBtn) mainBtn.innerText = btnOrigText;
      }
  };

})();
