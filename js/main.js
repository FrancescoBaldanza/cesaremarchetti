document.addEventListener('DOMContentLoaded', async () => {
  // Carica la bio da bio.txt e inietta paragrafi nella .bio
  const bioEl = document.querySelector('.bio');
  if (bioEl) {
    try {
      const res = await fetch('./bio.txt', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Impossibile caricare la bio');
      const text = await res.text();

      // Split su righe vuote => paragrafi
      const paragraphs = text
        .trim()
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

      bioEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    } catch (e) {
      console.error(e);
      bioEl.innerHTML = '<p>Biografia non disponibile al momento.</p>';
    }
  }

  // Qui puoi aggiungere eventuale logica per la galleria, se necessario
});

console.log("Benvenuto nel sito del Prof. Clarinetto 🎵");

// Effetto typewriter sul titolo
const title = document.querySelector(".title");
if (title) {
    let text = title.textContent;
    title.textContent = "";
    let i = 0;
    const speed = 100;

    function typeWriter() {
        if (i < text.length) {
            title.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        }
    }
    typeWriter();
}

// Galleria scorrevole: 4 immagini per volta, autoplay e frecce prev/next con pausa su hover e lightbox
(function initGallery() {
    const track = document.querySelector(".gallery-track");
    const viewport = document.querySelector(".gallery-viewport");
    const btnPrev = document.querySelector(".gallery-arrow.prev");
    const btnNext = document.querySelector(".gallery-arrow.next");
    if (!track || !viewport) return;

    const groupSize = 4;

    // Collezione iniziale e cloni per loop fluido
    const originalItems = Array.from(track.children);
    if (originalItems.length === 0) return;
    for (let i = 0; i < Math.min(groupSize, originalItems.length); i++) {
        const clone = originalItems[i].cloneNode(true);
        track.appendChild(clone);
    }

    let groupIndex = 0;
    const totalGroups = Math.ceil(originalItems.length / groupSize);

    // Dimensionamento preciso degli item sulla base della viewport
    function sizeItems() {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const vw = viewport.clientWidth;
        const itemW = (vw - gap * (groupSize - 1)) / groupSize;
        track.style.setProperty("--item-w", `${itemW}px`);
    }

    function getStepWidth() {
        return viewport.clientWidth; // scorro di una viewport per volta
    }

    function setTransform() {
        const shift = getStepWidth() * groupIndex;
        track.style.transform = `translateX(-${shift}px)`;
    }

    function snapWithoutTransition(fn) {
        const prev = track.style.transition;
        track.style.transition = "none";
        fn();
        void track.offsetHeight; // forza reflow
        track.style.transition = prev;
    }

    function nextGroup() {
        groupIndex++;
        setTransform();
        const reachedClone = groupIndex >= totalGroups;
        if (reachedClone) {
            const transitionMs = 600;
            setTimeout(() => {
                snapWithoutTransition(() => {
                    groupIndex = 0;
                    setTransform();
                });
            }, transitionMs + 50);
        }
    }

    function prevGroup() {
        if (groupIndex === 0) {
            snapWithoutTransition(() => {
                groupIndex = totalGroups - 1;
                setTransform();
            });
        } else {
            groupIndex--;
            setTransform();
        }
    }

    // Avvio: misuro e posiziono
    sizeItems();
    setTransform();

    // Autoplay controllato
    let timer = null;
    function startAuto() {
        if (timer) return;
        timer = setInterval(nextGroup, 3000);
    }
    function stopAuto() {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    }
    startAuto();

    // Resize: ricalcolo larghezze e riallineo senza salti
    window.addEventListener("resize", () => {
        snapWithoutTransition(() => {
            sizeItems();
            setTransform();
        });
    });

    // Pausa su hover su viewport e frecce
    viewport.addEventListener("mouseenter", stopAuto);
    viewport.addEventListener("mouseleave", startAuto);
    if (btnPrev) {
        btnPrev.addEventListener("mouseenter", stopAuto);
        btnPrev.addEventListener("mouseleave", startAuto);
        btnPrev.addEventListener("click", () => {
            stopAuto();
            prevGroup();
        });
    }
    if (btnNext) {
        btnNext.addEventListener("mouseenter", stopAuto);
        btnNext.addEventListener("mouseleave", startAuto);
        btnNext.addEventListener("click", () => {
            stopAuto();
            nextGroup();
        });
    }

    // Lightbox
    const lightbox = document.getElementById("lightbox");
    const lbImg = lightbox ? lightbox.querySelector(".lightbox-image") : null;
    const lbClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;

    function openLightbox(src, alt = "") {
        if (!lightbox || !lbImg) return;
        lbImg.src = src;
        lbImg.alt = alt;
        lightbox.classList.add("open");
        document.body.classList.add("no-scroll");
        stopAuto();
    }

    function closeLightbox() {
        if (!lightbox || !lbImg) return;
        lightbox.classList.remove("open");
        document.body.classList.remove("no-scroll");
        // riavvio l'autoplay quando si chiude
        startAuto();
        // opzionale: pulisco src per risparmiare memoria
        lbImg.removeAttribute("src");
        lbImg.removeAttribute("alt");
    }

    // Apri al click sulle immagini (delegato)
    track.addEventListener("click", (e) => {
        const target = e.target;
        if (target && target.classList && target.classList.contains("gallery-item")) {
            openLightbox(target.src, target.alt || "");
        }
    });

    // Chiudi al click sulla X o fuori dall'immagine
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lightbox) {
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }
    // Chiudi con ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeLightbox();
    });
})();