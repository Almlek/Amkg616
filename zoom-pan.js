/*!
 * zoom-pan.js — أداة تكبير/تصغير وسحب للصور وصفحات PDF
 * منصة الهائل المدرسية — لا تعتمد على أي مكتبة خارجية (تعمل بدون إنترنت)
 * تدعم: التكبير بإصبعين (Pinch)، النقر المزدوج، السحب (Pan)، أزرار +/-، وسحب أفقي للتنقل بين الصفحات
 */
function createZoomPan(container, content, options) {
    options = options || {};
    var minScale = options.minScale || 1;
    var maxScale = options.maxScale || 5;
    var doubleTapScale = options.doubleTapScale || 2.5;
    var onSwipeLeft = options.onSwipeLeft || null;
    var onSwipeRight = options.onSwipeRight || null;

    var scale = 1, originX = 0, originY = 0;
    var pointers = {};
    var pointerOrder = [];
    var isPanning = false, panMoved = 0;
    var panStartX = 0, panStartY = 0, panOriginStartX = 0, panOriginStartY = 0;
    var pinchStartDist = 0, pinchStartScale = 1;
    var lastTapTime = 0, lastTapX = 0, lastTapY = 0;

    content.style.transformOrigin = '0 0';
    content.style.touchAction = 'none';
    container.style.touchAction = 'none';
    container.style.overflow = 'hidden';
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

    function apply(smooth) {
        content.style.transition = smooth ? 'transform 0.2s ease-out' : 'none';
        content.style.transform = 'translate(' + originX + 'px,' + originY + 'px) scale(' + scale + ')';
    }

    function clamp() {
        var cw = container.clientWidth, ch = container.clientHeight;
        var cwid = content.offsetWidth * scale, chei = content.offsetHeight * scale;
        if (cwid <= cw) originX = (cw - cwid) / 2;
        else originX = Math.min(0, Math.max(cw - cwid, originX));
        if (chei <= ch) originY = (ch - chei) / 2;
        else originY = Math.min(0, Math.max(ch - chei, originY));
    }

    function zoomAt(px, py, newScale, smooth) {
        newScale = Math.min(maxScale, Math.max(minScale, newScale));
        var contentX = (px - originX) / scale;
        var contentY = (py - originY) / scale;
        originX = px - contentX * newScale;
        originY = py - contentY * newScale;
        scale = newScale;
        clamp();
        apply(smooth !== false);
    }

    function getRect() { return container.getBoundingClientRect(); }
    function pointerList() { return pointerOrder.map(function (id) { return pointers[id]; }); }
    function dist(p1, p2) { return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)); }
    function mid(p1, p2) { return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; }

    function onPointerDown(e) {
        if (container.setPointerCapture) { try { container.setPointerCapture(e.pointerId); } catch (err) {} }
        var rect = getRect();
        pointers[e.pointerId] = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (pointerOrder.indexOf(e.pointerId) === -1) pointerOrder.push(e.pointerId);

        if (pointerOrder.length === 1) {
            isPanning = true; panMoved = 0;
            panStartX = pointers[e.pointerId].x; panStartY = pointers[e.pointerId].y;
            panOriginStartX = originX; panOriginStartY = originY;
        } else if (pointerOrder.length === 2) {
            isPanning = false;
            var pts = pointerList();
            pinchStartDist = dist(pts[0], pts[1]);
            pinchStartScale = scale;
        }
    }

    function onPointerMove(e) {
        if (!pointers[e.pointerId]) return;
        var rect = getRect();
        pointers[e.pointerId] = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        if (pointerOrder.length === 1 && isPanning) {
            var p = pointers[e.pointerId];
            var dx = p.x - panStartX, dy = p.y - panStartY;
            panMoved = Math.max(panMoved, Math.sqrt(dx * dx + dy * dy));
            originX = panOriginStartX + dx;
            originY = panOriginStartY + dy;
            clamp();
            apply(false);
        } else if (pointerOrder.length === 2) {
            var pts = pointerList();
            var d = dist(pts[0], pts[1]);
            var m = mid(pts[0], pts[1]);
            if (pinchStartDist > 0) zoomAt(m.x, m.y, pinchStartScale * (d / pinchStartDist), false);
        }
    }

    function onPointerUp(e) {
        var wasSingle = pointerOrder.length === 1;
        var released = pointers[e.pointerId];
        delete pointers[e.pointerId];
        pointerOrder = pointerOrder.filter(function (id) { return id !== e.pointerId; });

        if (wasSingle && released) {
            if (panMoved < 10) {
                // نقرة — تحقق من النقر المزدوج
                var now = Date.now();
                var closeTap = Math.abs(released.x - lastTapX) < 40 && Math.abs(released.y - lastTapY) < 40;
                if (now - lastTapTime < 320 && closeTap) {
                    var target = scale > (minScale + 0.4) ? minScale : doubleTapScale;
                    zoomAt(released.x, released.y, target, true);
                    lastTapTime = 0;
                } else {
                    lastTapTime = now; lastTapX = released.x; lastTapY = released.y;
                }
            } else if (scale <= minScale + 0.02) {
                // سحب أفقي واضح وليس هناك تكبير حالياً => تقليب صفحة
                var totalDX = released.x - panStartX, totalDY = released.y - panStartY;
                if (Math.abs(totalDX) > 70 && Math.abs(totalDX) > Math.abs(totalDY) * 1.8) {
                    if (totalDX < 0 && onSwipeLeft) onSwipeLeft();
                    else if (totalDX > 0 && onSwipeRight) onSwipeRight();
                }
            }
        }

        if (pointerOrder.length === 1) {
            var id = pointerOrder[0];
            isPanning = true; panMoved = 0;
            panStartX = pointers[id].x; panStartY = pointers[id].y;
            panOriginStartX = originX; panOriginStartY = originY;
        } else {
            isPanning = false;
        }
    }

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('pointerleave', function (e) { if (pointers[e.pointerId]) onPointerUp(e); });

    container.addEventListener('wheel', function (e) {
        e.preventDefault();
        var rect = getRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, scale * (e.deltaY < 0 ? 1.15 : 0.87), false);
    }, { passive: false });

    function reset() { scale = 1; originX = 0; originY = 0; clamp(); apply(true); }
    function zoomIn() { var r = getRect(); zoomAt(r.width / 2, r.height / 2, scale * 1.4, true); }
    function zoomOut() { var r = getRect(); zoomAt(r.width / 2, r.height / 2, scale / 1.4, true); }
    function refresh() { clamp(); apply(false); }
    function destroy() {
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerup', onPointerUp);
        container.removeEventListener('pointercancel', onPointerUp);
    }

    reset();

    return { reset: reset, zoomIn: zoomIn, zoomOut: zoomOut, refresh: refresh, destroy: destroy, getScale: function () { return scale; } };
}
