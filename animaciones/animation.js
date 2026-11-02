  (function () {
            // ── Redirección de los botones de la escena interactiva ──
            document.querySelector('.btn-luna').addEventListener('click', () => {
                document.querySelector('.carousel-section').scrollIntoView({ behavior: 'smooth' });
            });
            
            document.querySelector('.btn-personaje').addEventListener('click', () => {
                document.querySelector('.intro-grid').scrollIntoView({ behavior: 'smooth' });
            });
            
            
            document.querySelector('.btn-arbol').addEventListener('click', () => {
                document.querySelector('.raices-section').scrollIntoView({ behavior: 'smooth' });
            });

            document.querySelector('.btn-tumba').addEventListener('click', () => {
                document.querySelector('.gif-section').scrollIntoView({ behavior: 'smooth' });
            });

            // ── Texto flotante al pasar el cursor por los botones de la escena ──
            const tip = document.getElementById('escenaTip');
            function ocultarTip() { tip.classList.remove('visible'); }
            function mostrarTip(texto, x, y) {
                tip.textContent = texto;
                const w = tip.offsetWidth, h = tip.offsetHeight;
                const abajo = y - 22 - h < 8;                                   // sin espacio arriba: se muestra debajo
                const izq = Math.max(w / 2 + 8, Math.min(window.innerWidth - w / 2 - 8, x));
                tip.classList.toggle('abajo', abajo);
                tip.style.left = izq + 'px';
                tip.style.top  = (abajo ? y + 22 : y - 14) + 'px';
                tip.classList.add('visible');
            }
            document.querySelectorAll('.escena button[data-label]').forEach((b) => {
                const etiqueta = b.dataset.label;
                b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') mostrarTip(etiqueta, e.clientX, e.clientY); });
                b.addEventListener('pointermove',  (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') mostrarTip(etiqueta, e.clientX, e.clientY); });
                b.addEventListener('pointerleave', ocultarTip);
                b.addEventListener('click', ocultarTip);
                // Teclado: se muestra sobre el botón al enfocarlo con Tab
                b.addEventListener('focus', () => {
                    if (!b.matches(':focus-visible')) return;
                    const r = b.getBoundingClientRect();
                    mostrarTip(etiqueta, r.left + r.width / 2, r.top + r.height / 2);
                });
                b.addEventListener('blur', ocultarTip);
            });
            window.addEventListener('scroll', ocultarTip, { passive: true });

            // ── Lightbox ──
            const overlay   = document.getElementById('lightboxOverlay');
            const overlayImg = document.getElementById('lightboxImg');
            const closeBtn  = document.getElementById('lightboxClose');
            const lightboxBox    = document.getElementById('lightboxBox');
            const lightboxInfo   = document.getElementById('lightboxInfo');
            const lightboxTitulo = document.getElementById('lightboxTitulo');
            const lightboxDesc   = document.getElementById('lightboxDesc');

            // horizontal = título y explicación debajo · vertical = al lado
            function setOrientacion(horizontal) {
                lightboxBox.classList.toggle('horizontal', horizontal);
            }

            function openLightbox(img) {
                const card   = img.closest('.board-item');
                const capEl  = card.querySelector('.board-item-caption');
                const descEl = card.querySelector('.board-item-desc');
                const titulo = capEl  ? capEl.textContent.trim()  : img.alt;
                const desc   = descEl ? descEl.textContent.trim() : '';

                lightboxTitulo.textContent = titulo;
                lightboxDesc.textContent   = desc;
                lightboxDesc.hidden = !desc;
                lightboxInfo.hidden = !titulo && !desc;

                // La orientación se toma de data-orientacion en la tarjeta;
                // si no la tiene, se detecta sola por las medidas de la imagen.
                const forzada = card.dataset.orientacion;
                overlayImg.onload = null;
                if (forzada) {
                    setOrientacion(forzada === 'horizontal');
                } else if (img.naturalWidth) {
                    setOrientacion(img.naturalWidth > img.naturalHeight);
                } else {
                    overlayImg.onload = () => setOrientacion(overlayImg.naturalWidth > overlayImg.naturalHeight);
                }

                overlayImg.src = img.src;
                overlayImg.alt = img.alt;
                overlay.classList.add('active');
            }

            // ── Pantalla arrastrable ──
            const board = document.getElementById('board');
            const hint  = document.getElementById('boardHint');
            const items = Array.from(board.querySelectorAll('.board-item'));
            let zTop = 10;

            function layoutItems() {
                const bw = board.clientWidth, bh = board.clientHeight;
                const iw = items[0].offsetWidth, ih = items[0].offsetHeight;
                const cols = Math.max(2, Math.floor(bw / (iw * 0.85)));
                const rows = Math.ceil(items.length / cols);
                const stepX = cols > 1 ? (bw - iw - 24) / (cols - 1) : 0;
                const stepY = rows > 1 ? (bh - ih - 56) / (rows - 1) : 0;
                items.forEach((it, i) => {
                    const c = i % cols, r = Math.floor(i / cols);
                    const jx = (Math.random() - 0.5) * 24, jy = (Math.random() - 0.5) * 20;
                    it.style.left = Math.max(0, Math.min(bw - iw, 12 + c * stepX + jx)) + 'px';
                    it.style.top  = Math.max(0, Math.min(bh - ih, 40 + r * stepY + jy)) + 'px';
                    it.style.setProperty('--rot', ((Math.random() - 0.5) * 10).toFixed(1) + 'deg');
                    it.style.zIndex = ++zTop;
                });
            }
            layoutItems();

            // Firma del tamaño de tarjeta + orientación: si cambia (girar el celular/tablet o
            // cruzar un breakpoint) se reacomodan las tarjetas; si solo cambia el alto
            // (barra del navegador móvil) se conservan donde el usuario las dejó.
            const firma = () => items[0].offsetWidth + (window.innerWidth > window.innerHeight ? 'L' : 'P');
            let ultimaFirma = firma();

            window.addEventListener('resize', () => {
                const bw = board.clientWidth, bh = board.clientHeight;
                const f = firma();
                if (f !== ultimaFirma) { ultimaFirma = f; layoutItems(); return; }
                items.forEach(it => {
                    it.style.left = Math.max(0, Math.min(bw - it.offsetWidth,  parseFloat(it.style.left))) + 'px';
                    it.style.top  = Math.max(0, Math.min(bh - it.offsetHeight, parseFloat(it.style.top)))  + 'px';
                });
            });

            items.forEach((it) => {
                let startX, startY, origL, origT, moved = false, active = false;

                it.addEventListener('pointerdown', (e) => {
                    if (e.button !== undefined && e.button !== 0) return;
                    active = true; moved = false;
                    startX = e.clientX; startY = e.clientY;
                    origL = parseFloat(it.style.left) || 0;
                    origT = parseFloat(it.style.top)  || 0;
                    it.style.zIndex = ++zTop;
                    it.setPointerCapture(e.pointerId);
                });

                it.addEventListener('pointermove', (e) => {
                    if (!active) return;
                    const dx = e.clientX - startX, dy = e.clientY - startY;
                    if (!moved && Math.hypot(dx, dy) > 5) {
                        moved = true;
                        it.classList.add('dragging');
                        if (hint) hint.classList.add('hidden');
                    }
                    if (moved) {
                        const maxL = board.clientWidth  - it.offsetWidth;
                        const maxT = board.clientHeight - it.offsetHeight;
                        it.style.left = Math.max(0, Math.min(maxL, origL + dx)) + 'px';
                        it.style.top  = Math.max(0, Math.min(maxT, origT + dy)) + 'px';
                    }
                });

                const finish = (e) => {
                    if (!active) return;
                    active = false;
                    it.classList.remove('dragging');
                    if (it.hasPointerCapture && it.hasPointerCapture(e.pointerId)) it.releasePointerCapture(e.pointerId);
                    // Si casi no se movió, se considera un click: abrir pantallazo
                    if (!moved && e.type === 'pointerup') openLightbox(it.querySelector('img'));
                };
                it.addEventListener('pointerup', finish);
                it.addEventListener('pointercancel', finish);
            });


            function closeLightbox() {
                overlay.classList.remove('active');
                overlayImg.src = '';
            }

            overlay.addEventListener('click', closeLightbox);
            // Clic sobre la imagen o el texto no cierra; solo fuera de ellos, la × o Esc
            lightboxBox.addEventListener('click', (e) => e.stopPropagation());
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeLightbox();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeLightbox();
            });
        })();

        // ── Reinicia la animación del perfil cada vez que entra en pantalla ──
        (function () {
            const introImg = document.getElementById('introAnim');
            if (!introImg) return;
            const originalSrc = introImg.getAttribute('src');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        introImg.src = '';
                        requestAnimationFrame(() => {
                            introImg.src = originalSrc + '?t=' + Date.now();
                        });
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(introImg.closest('.intro-grid'));
        })();

        // ── Ease-in de las inspiraciones: entra al verse y se reinicia al alejarse ──
        (function () {
            const filas = document.querySelectorAll('.inspiracion');
            if (!filas.length) return;

            // Se observa la fila (que no se mueve), no sus hijos animados, para evitar parpadeos
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.intersectionRatio >= 0.2) {
                        entry.target.classList.add('visible');
                    } else {
                        // al salir de la pantalla (subiendo o bajando) se reinicia
                        entry.target.classList.remove('visible');
                    }
                });
            }, { threshold: [0, 0.2] });

            filas.forEach((f) => observer.observe(f));
        })();