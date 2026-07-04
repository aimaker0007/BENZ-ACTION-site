/* ============================================================
   BENZ-ACTION — Cinematic runtime
   Works over file:// and GitHub Pages. Content from assets/data.js.
   ============================================================ */
(function () {
  "use strict";

  var BASE = document.body.getAttribute("data-base") || "";
  var LANG = document.documentElement.lang === "fr" ? "fr" : "en";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE = window.matchMedia("(max-width: 880px)").matches;

  /* ---------- Navbar ---------- */
  var nav = document.querySelector(".nav");
  var burger = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");

  function onScrollNav() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 30);
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        burger.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var progress = document.querySelector(".progress");
  if (progress) {
    var onProg = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onProg, { passive: true });
    onProg();
  }

  /* ---------- Split hero title into chars ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var idx = 0;
    el.querySelectorAll(".line").forEach(function (line) {
      var cls = line.className.replace("line", "").trim();
      var text = line.textContent;
      line.textContent = "";
      text.split("").forEach(function (ch) {
        var s = document.createElement("span");
        s.className = "char";
        s.style.setProperty("--i", idx++);
        s.textContent = ch;
        line.appendChild(s);
      });
      if (cls) line.className = "line " + cls;
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        revealIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  function observeReveals(root) {
    (root || document).querySelectorAll("[data-reveal]").forEach(function (el) {
      revealIO.observe(el);
    });
  }

  /* ---------- Stats count-up ---------- */
  var statIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      statIO.unobserve(e.target);
      var el = e.target;
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (REDUCED || target === 0) { el.firstChild.nodeValue = target; return; }
      var t0 = null, dur = 1600;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.firstChild.nodeValue = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach(function (el) { statIO.observe(el); });

  /* ---------- Kinetic statement: light words as they pass ---------- */
  document.querySelectorAll("[data-statement]").forEach(function (block) {
    var p = block.querySelector("p");
    if (!p) return;
    var html = p.textContent.trim().split(/\s+/).map(function (w) {
      var red = w.charAt(0) === "*";
      if (red) w = w.slice(1);
      return '<span class="w' + (red ? " red" : "") + '">' + w + "</span>";
    }).join(" ");
    p.innerHTML = html;
    var words = p.querySelectorAll(".w");
    function update() {
      var r = block.getBoundingClientRect();
      var vh = window.innerHeight;
      var prog = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
      prog = Math.max(0, Math.min(1, prog));
      var lit = Math.floor(prog * words.length * 1.15);
      words.forEach(function (w, i) { w.classList.toggle("lit", i < lit); });
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  });

  /* ---------- Sticky showreel: scroll-driven scale + word swap ---------- */
  var reel = document.querySelector(".reel");
  if (reel) {
    var frame = reel.querySelector(".reel__frame");
    var video = reel.querySelector("video");
    var words = reel.querySelectorAll(".reel__word");
    var soundBtn = reel.querySelector(".reel__sound");
    var startScale = MOBILE ? 0.7 : 0.45;
    var ticking = false;

    function reelUpdate() {
      ticking = false;
      var r = reel.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 0;
      if (frame && !REDUCED) {
        // scale from startScale up to full-bleed
        var grow = Math.min(1, p / 0.55);
        var e = 1 - Math.pow(1 - grow, 3);
        var scale = startScale + (1 - startScale) * e;
        var full = Math.max(0, (p - 0.6) / 0.4); // beyond: expand to viewport
        var vw = window.innerWidth, fw = frame.offsetWidth;
        var extra = 1 + full * Math.max(0, vw / fw - 1);
        frame.style.transform = "scale(" + (scale * extra).toFixed(4) + ")";
        frame.style.borderRadius = full > 0.5 ? "0px" : "6px";
      }
      // word swap across progress
      if (words.length) {
        var seg = 1 / words.length;
        words.forEach(function (w, i) {
          var on = p >= i * seg && p < (i + 1) * seg + (i === words.length - 1 ? 1 : 0);
          w.classList.toggle("is-on", on && p > 0.02);
        });
      }
    }
    function onReelScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(reelUpdate); }
    }
    window.addEventListener("scroll", onReelScroll, { passive: true });
    window.addEventListener("resize", onReelScroll);
    reelUpdate();

    // Autoplay muted when visible; button to unmute
    if (video) {
      var vIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { video.play().catch(function () {}); }
          else { video.pause(); }
        });
      }, { threshold: 0.25 });
      vIO.observe(video);
      if (soundBtn) {
        soundBtn.addEventListener("click", function () {
          video.muted = !video.muted;
          if (!video.muted) video.play().catch(function () {});
          soundBtn.textContent = video.muted ? soundBtn.getAttribute("data-on") : soundBtn.getAttribute("data-off");
        });
      }
    }
  }

  /* ---------- Pseudo-3D tilt (pointer on desktop, idle sway on touch) ---------- */
  document.querySelectorAll(".tilt-wrap").forEach(function (wrap) {
    var card = wrap.querySelector(".tilt");
    if (!card || REDUCED) return;
    if (window.matchMedia("(hover: hover)").matches) {
      wrap.addEventListener("pointermove", function (ev) {
        var r = wrap.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform = "rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 10) + "deg) translateZ(0)";
      });
      wrap.addEventListener("pointerleave", function () {
        card.style.transform = "rotateY(0) rotateX(0)";
      });
    } else {
      // gentle scroll-linked sway on touch devices
      window.addEventListener("scroll", function () {
        var r = wrap.getBoundingClientRect();
        var c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        card.style.transform = "rotateY(" + (c * -8) + "deg) rotateX(" + (c * 4) + "deg)";
      }, { passive: true });
    }
  });

  /* ---------- Parallax (subtle) ---------- */
  if (!REDUCED && !MOBILE) {
    var pxEls = document.querySelectorAll("[data-parallax]");
    if (pxEls.length) {
      window.addEventListener("scroll", function () {
        requestAnimationFrame(function () {
          pxEls.forEach(function (el) {
            var sp = parseFloat(el.getAttribute("data-parallax")) || 0.15;
            var r = el.getBoundingClientRect();
            var off = (r.top + r.height / 2 - window.innerHeight / 2) * sp;
            el.style.transform = "translateY(" + off.toFixed(1) + "px)";
          });
        });
      }, { passive: true });
    }
  }

  /* ---------- Data renderers (from assets/data.js) ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function media(p) { return p ? BASE + p : ""; }

  // Filmography cards
  document.querySelectorAll("[data-filmography]").forEach(function (mount) {
    var limit = parseInt(mount.getAttribute("data-limit"), 10) || 0;
    var items = (window.BENZ_FILMOGRAPHY || []).slice();
    if (limit) items = items.slice(0, limit);
    var typeLabel = {
      feature: { en: "Feature film", fr: "Long-métrage" },
      series: { en: "Series", fr: "Série" },
      commercial: { en: "Commercial", fr: "Publicité" }
    };
    var html = '<div class="films">';
    items.forEach(function (f, i) {
      var role = LANG === "fr" ? f.role_fr : f.role_en;
      var tl = typeLabel[f.productionType];
      var kind = tl ? (LANG === "fr" ? tl.fr : tl.en) : "";
      var inner =
        (f.poster
          ? '<img src="' + esc(media(f.poster)) + '" alt="' + esc(f.title) + " (" + f.year + ') — poster" loading="lazy">'
          : '<div class="film__grad"></div>') +
        '<div class="film__grad"></div>' +
        '<div class="film__meta">' +
        '<span class="film__year">' + f.year + (kind ? " · " + esc(kind) : "") + "</span>" +
        '<h3 class="film__title">' + esc(f.title) + "</h3>" +
        '<p class="film__role">' + esc(role) + "</p>" +
        "</div>";
      html += f.link
        ? '<a class="film" href="' + esc(f.link) + '" target="_blank" rel="noopener" data-reveal style="--d:' + (i % 4) * 0.08 + 's">' + inner + "</a>"
        : '<article class="film" data-reveal style="--d:' + (i % 4) * 0.08 + 's">' + inner + "</article>";
    });
    html += "</div>";
    mount.innerHTML = html;
    observeReveals(mount);
  });

  // Partners marquee
  document.querySelectorAll("[data-partners]").forEach(function (mount) {
    var names = window.BENZ_PARTNERS || [];
    var spans = names.map(function (n) { return "<span>" + esc(n) + "</span>"; }).join("");
    mount.innerHTML = '<div class="partners__track">' + spans + spans + "</div>";
  });

  // Testimonials
  document.querySelectorAll("[data-testimonials]").forEach(function (mount) {
    var html = "";
    (window.BENZ_TESTIMONIALS || []).forEach(function (t, i) {
      var q = LANG === "fr" ? t.quote_fr : t.quote_en;
      var role = LANG === "fr" ? t.role_fr : t.role_en;
      html += '<article class="quote" data-reveal style="--d:' + i * 0.1 + 's"><p>' + esc(q) + "</p>" +
        "<footer><cite>" + esc(t.name) + "</cite><small>" + esc(role) + "</small></footer></article>";
    });
    mount.innerHTML = html;
    observeReveals(mount);
  });

  // Gallery (filterable)
  document.querySelectorAll("[data-gallery]").forEach(function (mount) {
    var withFilters = mount.getAttribute("data-filters") === "true";
    var limit = parseInt(mount.getAttribute("data-limit"), 10) || 0;
    var items = (window.BENZ_GALLERY || []).slice();
    if (limit) items = items.slice(0, limit);

    var cats = [
      { id: "all", en: "All", fr: "Tout" },
      { id: "automobile", en: "Automobile", fr: "Automobile" },
      { id: "combat", en: "Combat", fr: "Combat" },
      { id: "height", en: "Heights / Aerial", fr: "Hauteur / Voltige" },
      { id: "pyrotechnics", en: "Pyrotechnics", fr: "Pyrotechnie" },
      { id: "safety", en: "Safety", fr: "Sécurité" }
    ];

    var html = "";
    if (withFilters) {
      html += '<div class="gal-filters" role="group">';
      cats.forEach(function (c, i) {
        html += '<button type="button" data-filter="' + c.id + '"' + (i === 0 ? ' class="is-active"' : "") + ">" +
          esc(LANG === "fr" ? c.fr : c.en) + "</button>";
      });
      html += "</div>";
    }
    html += '<div class="gal-grid">';
    items.forEach(function (g, i) {
      var cap = LANG === "fr" ? g.caption_fr : g.caption_en;
      var stunts = (g.stunt || []).join(" ");
      html += '<figure class="gal-item" data-stunts="' + esc(stunts) + '" data-reveal style="--d:' + (i % 3) * 0.08 + 's">';
      if (g.type === "video" && g.src) {
        html += '<video controls playsinline preload="metadata"' +
          (g.poster ? ' poster="' + esc(media(g.poster)) + '"' : "") + ">" +
          '<source src="' + esc(media(g.src)) + '" type="video/mp4">' +
          '<p class="gal-fallback">' + (LANG === "fr" ? "Votre navigateur ne peut pas lire cette vidéo." : "Your browser cannot play this video.") + "</p>" +
          "</video>";
      } else if (g.src) {
        html += '<img src="' + esc(media(g.src)) + '" alt="' + esc(cap) + '" loading="lazy">';
      }
      html += "<figcaption>" + esc(cap) + "</figcaption></figure>";
    });
    html += "</div>";
    mount.innerHTML = html;
    observeReveals(mount);

    if (withFilters) {
      var buttons = mount.querySelectorAll("[data-filter]");
      var figures = mount.querySelectorAll(".gal-item");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          buttons.forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
          var f = btn.getAttribute("data-filter");
          figures.forEach(function (fig) {
            var show = f === "all" || (fig.getAttribute("data-stunts") || "").split(" ").indexOf(f) !== -1;
            fig.classList.toggle("is-hidden", !show);
            // pause hidden videos
            if (!show) { var v = fig.querySelector("video"); if (v) v.pause(); }
          });
        });
      });
    }
  });

  /* ---------- Contact form -> mailto ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      function val(id) { var el = form.querySelector("#" + id); return el ? el.value.trim() : ""; }
      var project = val("f-project") || (LANG === "fr" ? "Nouveau projet" : "New project");
      var L = LANG === "fr"
        ? { name: "Nom", email: "Email", project: "Projet", type: "Type de cascade", loc: "Lieu de tournage", dates: "Dates envisagées", desc: "Description technique" }
        : { name: "Name", email: "Email", project: "Project", type: "Type of stunt", loc: "Shooting location", dates: "Envisaged dates", desc: "Technical description" };
      var body =
        L.name + ": " + val("f-name") + "\n" +
        L.email + ": " + val("f-email") + "\n" +
        L.project + ": " + project + "\n" +
        L.type + ": " + val("f-type") + "\n" +
        L.loc + ": " + val("f-location") + "\n" +
        L.dates + ": " + val("f-dates") + "\n\n" +
        L.desc + ":\n" + val("f-desc");
      var subject = "BENZ-ACTION request - " + project;
      window.location.href = "mailto:contact@benzaction.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- Lazy-play looping ambient videos ---------- */
  document.querySelectorAll("video[data-ambient]").forEach(function (v) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) v.play().catch(function () {});
        else v.pause();
      });
    }, { threshold: 0.15 });
    io.observe(v);
  });

  /* ---------- Init reveals ---------- */
  observeReveals(document);
})();
