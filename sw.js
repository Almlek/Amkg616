/* ═══════════════════════════════════════════
   الهائل v7.1— sw.js (Ultimate Offline & Sync)
 ═══════════════════════════════════════════ */

const CACHE = 'haael-v7.1';

const SHELL = [
  '/', 
  'index-2.html',
  'exams.html',
'localforage.min.js',
  'schedule.html',
  'grades.html',
 'aicorrector.html',
  'grades_style.css',
  'grades_app.js',
  'semester-plan.js',
  'xlsx.bundle.js',
  'platform.html',       
  'pdf-reader.html',     
  'zoom-pan.js',         
  'styles.css',
  'core.js',
  'manifest.json',
'exam-builder.js',
  'logo.png',
  'html2canvas.min.js',
  'html2pdf.bundle.min.js',
  'mermaid.min.js',
  'assistant.js',
 'oralexam.html',
'homework.js',
'exam_solver.html',
 'evaluation.js',
  'clap.mp3',
  'wrong.mp3',
  'electroexam.js',
  'library-extract.js',
  'onboarding.js',
  'pdf.min.js',
  'pptxgen.min.js',
  'jszip.min.js',
  'pdf.worker.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/apikey-step1.jpg',
  'assets/apikey-step2.jpg',
  'assets/apikey-step3.jpg',
        'fonts/AlMohanad.ttf',
  'fonts/Amiri-Bold.woff',
  'fonts/Cairo-Bold.woff',
  'fonts/Cairo-Regular.ttf',
  'fonts/Cairo-ExtraBold.woff',
  'fonts/NotoNaskhArabic-Regular.ttf',
  'fonts/ASC-Almass.ttf',
  'fonts/Harf-Fannan.ttf',
  'fonts/Hesham%20Normal.ttf',
  'fonts/Lifta-Black.otf.ttf',
  'fonts/Mohammad-Head.ttf',
  'fonts/ScheherazadeNew-Medium.ttf',
  'fonts/TRADBD.ttf',
  'fonts/AdobeNaskh-Medium.otf.ttf',
  'fonts/Almudid.ttf',
  'fonts/Alyamama-Regular.ttf',
  'fonts/XITSMath-Regular.otf'
];

// 1. التثبيت الآمن (يتخطى أي ملف مفقود بدون انهيار)
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      for (const url of SHELL) {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) await cache.put(url, res);
        } catch (err) {} // يتجاهل الأخطاء بصمت ويكمل الباقي
      }
    })
  );
});

// 2. التفعيل ومسح مخلفات الإصدارات القديمة
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

// 3. الجلب الخارق (يضمن العمل أوفلاين 100% ويحدث بصمت)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    // ignoreSearch: true يتجاهل أي إضافات على الرابط لكي يجد الملف دائماً في الكاش
    caches.match(e.request, { ignoreSearch: true }).then(cachedResponse => {
      
      // نطلب الملف من الإنترنت لتحديث الكاش في الخلفية
      const networkFetch = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          caches.open(CACHE).then(cache => cache.put(e.request, networkResponse.clone()));
        }
        return networkResponse;
      });

      // إذا وجدنا الملف في الكاش (أوفلاين)، نعرضه فوراً ولا ننتظر الإنترنت!
      if (cachedResponse) {
        networkFetch.catch(() => {}); // نكتم خطأ الإنترنت في الخلفية لكي لا يتشنج التطبيق
        return cachedResponse;
      }

      // إذا لم يكن في الكاش، ننتظر الإنترنت...
      return networkFetch.catch(() => {
        // إذا فشل الإنترنت (لأننا أوفلاين)، نتدخل للإنقاذ:
        // إذا كان المستخدم يطلب صفحة، نفتح له الصفحة الرئيسية من الكاش بدلاً من صفحة الخطأ
        if (e.request.mode === 'navigate' || e.request.headers.get('accept').includes('text/html')) {
          return caches.match('index-2.html', { ignoreSearch: true });
        }
        // وإلا نعيد استجابة وهمية آمنة تمنع المتصفح من الانهيار
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

