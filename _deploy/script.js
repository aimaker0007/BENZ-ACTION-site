/* ============================================
   BENZ-ACTION — Main runtime
   i18n + language switch + components + behaviors
   Works over file:// (no fetch). Data comes from
   assets/i18n.js and assets/data.js (global objects).
   ============================================ */
(function () {
    "use strict";

    /* ---------- Language detection ---------- */
    var LANG = (document.documentElement.getAttribute("lang") || "fr").toLowerCase().indexOf("en") === 0 ? "en" : "fr";
    var DICT = (window.BENZ_I18N && window.BENZ_I18N[LANG]) || {};
    var BASE = document.body.getAttribute("data-base") || ""; // "" at root, "../" under /en/

    function t(key) {
        return Object.prototype.hasOwnProperty.call(DICT, key) ? DICT[key] : key;
    }
    function cap(item, field) {
        return item[field + "_" + LANG] || item[field + "_fr"] || "";
    }
    function reduceMotion() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    // Resolve a local asset path against BASE so it works on / and /en/ pages
    function media(path) {
        if (!path) return "";
        if (/^(https?:)?\/\//.test(path) || path.charAt(0) === "/") return path;
        return BASE + path;
    }

    /* ---------- Apply i18n to [data-i18n] nodes ---------- */
    function applyI18n(root) {
        (root || document).querySelectorAll("[data-i18n]").forEach(function (el) {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
        (root || document).querySelectorAll("[data-i18n-attr]").forEach(function (el) {
            // format: "attr:key,attr2:key2"
            el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
                var p = pair.split(":");
                if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
            });
        });
    }

    /* ---------- Language switcher ---------- */
    function currentRouteKey() {
        var path = location.pathname.replace(/\\/g, "/");
        var parts = path.split("/").filter(Boolean);
        var file = parts.length ? parts[parts.length - 1] : "index.html";
        if (!file || file.indexOf(".html") === -1) file = "index.html";
        // Are we under /en/ ?
        var inEn = parts.indexOf("en") !== -1 && LANG === "en";
        return inEn ? "en/" + file : file;
    }
    function targetHref() {
        var key = currentRouteKey();
        var map = window.BENZ_ROUTES || {};
        var target = map[key];
        if (!target) return null;
        if (LANG === "fr") {
            // going to EN: from root, target already like "en/xxx.html"
            return BASE + target;
        } else {
            // going to FR: target like "xxx.html"; we're under /en/, go up one
            return "../" + target;
        }
    }
    function setupLangSwitcher() {
        var btns = document.querySelectorAll("[data-lang-switch]");
        var href = targetHref();
        btns.forEach(function (btn) {
            if (href) btn.setAttribute("href", href);
            btn.addEventListener("click", function () {
                try { localStorage.setItem("benz_lang", LANG === "fr" ? "en" : "fr"); } catch (e) {}
            });
        });
        // persist current as preference on load
        try { localStorage.setItem("benz_lang", LANG); } catch (e) {}
    }

    /* ---------- Navbar behaviors ---------- */
    function setupNavbar() {
        var navbar = document.getElementById("navbar");
        if (navbar) {
            window.addEventListener("scroll", function () {
                if (window.pageYOffset > 60) navbar.classList.add("scrolled");
                else navbar.classList.remove("scrolled");
            });
        }
        var toggle = document.getElementById("navToggle");
        var links = document.getElementById("navLinks");
        if (toggle && links) {
            toggle.addEventListener("click", function () {
                var open = links.classList.toggle("active");
                toggle.classList.toggle("active", open);
                toggle.setAttribute("aria-expanded", open ? "true" : "false");
                document.body.style.overflow = open ? "hidden" : "";
            });
            links.querySelectorAll("a").forEach(function (a) {
                a.addEventListener("click", function () {
                    links.classList.remove("active");
                    toggle.classList.remove("active");
                    toggle.setAttribute("aria-expanded", "false");
                    document.body.style.overflow = "";
                });
            });
        }
    }

    /* ---------- Scroll entrance animations ---------- */
    function setupAos() {
        var els = document.querySelectorAll("[data-aos]");
        if (reduceMotion() || !("IntersectionObserver" in window)) {
            els.forEach(function (el) { el.classList.add("aos-animate"); });
            return;
        }
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var delay = parseInt(entry.target.getAttribute("data-aos-delay") || 0, 10);
                    setTimeout(function () { entry.target.classList.add("aos-animate"); }, delay);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
        els.forEach(function (el) { obs.observe(el); });
    }

    /* ---------- Animated counters ---------- */
    function setupCounters() {
        var counters = document.querySelectorAll(".stat-number");
        if (!counters.length) return;
        function run(el) {
            var target = parseInt(el.getAttribute("data-count"), 10) || 0;
            if (reduceMotion() || target === 0) { el.textContent = target; return; }
            var current = 0, step = target / (2000 / 16);
            var timer = setInterval(function () {
                current += step;
                if (current >= target) { el.textContent = target; clearInterval(timer); }
                else el.textContent = Math.floor(current);
            }, 16);
        }
        if (!("IntersectionObserver" in window)) { counters.forEach(run); return; }
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { run(entry.target); obs.unobserve(entry.target); }
            });
        }, { threshold: 0.5 });
        counters.forEach(function (el) { obs.observe(el); });
    }

    /* ---------- Hero particles ---------- */
    function setupParticles() {
        var box = document.getElementById("particles");
        if (!box || reduceMotion()) return;
        var style = document.createElement("style");
        style.textContent = "@keyframes benzFloat{0%,100%{transform:translateY(0) translateX(0);opacity:.4}25%{transform:translateY(-20px) translateX(10px);opacity:1}50%{transform:translateY(-10px) translateX(-10px);opacity:.6}75%{transform:translateY(-28px) translateX(6px);opacity:.85}}";
        document.head.appendChild(style);
        for (var i = 0; i < 28; i++) {
            var p = document.createElement("span");
            var s = Math.random() * 3 + 1;
            p.style.cssText = "position:absolute;border-radius:50%;background:rgba(225,6,0," + (Math.random() * 0.4 + 0.12) + ");width:" + s + "px;height:" + s + "px;left:" + (Math.random() * 100) + "%;top:" + (Math.random() * 100) + "%;animation:benzFloat " + (Math.random() * 6 + 4) + "s ease-in-out infinite;animation-delay:" + (Math.random() * 4) + "s";
            box.appendChild(p);
        }
    }

    /* ---------- Media placeholder helper ---------- */
    function placeholder(label) {
        return '<div class="media-placeholder"><span class="media-ph-mark">REVOLUTION</span>' +
               (label ? '<span class="media-ph-label">' + label + '</span>' : '') + '</div>';
    }

    /* ---------- Showreel player ---------- */
    function setupShowreel() {
        document.querySelectorAll("[data-showreel]").forEach(function (frame) {
            var youtube = frame.getAttribute("data-youtube") || "";
            var src = frame.getAttribute("data-src") || "";
            var poster = frame.getAttribute("data-poster") || "";

            // YouTube embed takes priority when provided
            if (youtube) {
                var logoSrc = (frame.getAttribute("data-logo")) || (BASE + "assets/logo.svg");
                frame.innerHTML =
                    '<button class="showreel__poster" type="button" aria-label="' + t("video.play") + '">' +
                        '<span class="showreel__poster-bg" aria-hidden="true"></span>' +
                        '<img class="showreel__poster-logo" src="' + logoSrc + '" alt="BENZ-ACTION Revolution">' +
                        '<span class="showreel__play" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
                    '</button>';
                var origin = (location.protocol === "http:" || location.protocol === "https:") ? "&origin=" + encodeURIComponent(location.origin) : "";
                frame.querySelector(".showreel__poster").addEventListener("click", function () {
                    var iframe = document.createElement("iframe");
                    iframe.className = "showreel__embed";
                    iframe.src = "https://www.youtube.com/embed/" + youtube + "?autoplay=1&rel=0&playsinline=1&modestbranding=1" + origin;
                    iframe.title = "BENZ-ACTION Showreel";
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                    iframe.setAttribute("allowfullscreen", "");
                    frame.innerHTML = "";
                    frame.appendChild(iframe);
                });
                // Always-working fallback link (in case embedding is disabled / error 153)
                if (!frame.nextElementSibling || !frame.nextElementSibling.classList.contains("showreel__yt")) {
                    var yt = document.createElement("a");
                    yt.className = "showreel__yt";
                    yt.href = "https://youtu.be/" + youtube;
                    yt.target = "_blank";
                    yt.rel = "noopener";
                    yt.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#ff0000" d="M23 7.5a3 3 0 00-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 001 7.5 31 31 0 00.6 12 31 31 0 001 16.5a3 3 0 002.1 2.1C5 19 12 19 12 19s7 0 8.9-.4a3 3 0 002.1-2.1A31 31 0 0023.4 12 31 31 0 0023 7.5z"/><path fill="#fff" d="M9.8 15.3l6-3.3-6-3.3z"/></svg>' +
                        '<span>' + (LANG === "en" ? "Watch on YouTube" : "Regarder sur YouTube") + '</span>';
                    frame.parentNode.insertBefore(yt, frame.nextSibling);
                }
                return;
            }

            if (!src) {
                frame.innerHTML = placeholder("") +
                    '<div class="showreel-fallback"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><p>' + t("showreel.unavailable") + '</p></div>';
                return;
            }
            // Local video: branded logo poster first, load+play the video on click
            var logoSrc2 = frame.getAttribute("data-logo") || (BASE + "assets/logo.svg");
            frame.innerHTML =
                '<button class="showreel__poster" type="button" aria-label="' + t("video.play") + '">' +
                    '<span class="showreel__poster-bg" aria-hidden="true"></span>' +
                    '<img class="showreel__poster-logo" src="' + logoSrc2 + '" alt="BENZ-ACTION Revolution">' +
                    '<span class="showreel__play" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
                '</button>';
            frame.querySelector(".showreel__poster").addEventListener("click", function () {
                var video = document.createElement("video");
                video.className = "showreel__video";
                video.src = media(src);
                video.setAttribute("playsinline", "");
                video.setAttribute("controls", "");
                video.muted = true;
                if (poster) video.poster = media(poster);
                video.addEventListener("error", function () {
                    frame.innerHTML = placeholder("") + '<div class="showreel-fallback"><p>' + t("showreel.unavailable") + '</p></div>';
                });
                frame.innerHTML = "";
                frame.appendChild(video);
                var pr = video.play();
                if (pr && pr.catch) { pr.catch(function () { video.controls = true; }); }
            });
        });
    }

    /* ---------- Gallery + filter ---------- */
    var STUNTS = ["automobile", "combat", "height", "pyrotechnics", "safety"];
    function setupGallery() {
        var host = document.querySelector("[data-gallery]");
        if (!host || !window.BENZ_GALLERY) return;
        var onlyVideo = host.getAttribute("data-gallery") === "video";
        var items = window.BENZ_GALLERY.filter(function (i) { return onlyVideo ? i.type === "video" : true; });
        var bar = document.querySelector("[data-gallery-filter]");
        var grid = document.createElement("div");
        grid.className = "media-grid";
        host.appendChild(grid);
        var empty = document.createElement("p");
        empty.className = "filter-empty"; empty.textContent = t("gallery.empty");
        empty.style.display = "none";
        host.appendChild(empty);

        function render(filter) {
            grid.innerHTML = "";
            var shown = 0;
            items.forEach(function (item) {
                if (filter !== "all" && item.stunt.indexOf(filter) === -1) return;
                shown++;
                var fig = document.createElement("figure");
                fig.className = "media-item" + (item.type === "video" ? " media-item--video" : "");
                var inner = item.src ? "" : placeholder("");
                var ytThumb = item.youtube ? "https://img.youtube.com/vi/" + item.youtube + "/hqdefault.jpg" : "";
                if (item.type === "photo" && item.src) {
                    inner = '<img src="' + media(item.src) + '" alt="' + cap(item, "caption") + '" loading="lazy" decoding="async">';
                } else if (item.type === "video" && item.youtube) {
                    inner = '<img src="' + ytThumb + '" alt="' + cap(item, "caption") + '" loading="lazy" decoding="async">';
                } else if (item.type === "video" && item.src) {
                    inner = '<video src="' + media(item.src) + '" poster="' + media(item.poster) + '" playsinline preload="metadata" controls></video>';
                }
                fig.innerHTML = inner +
                    (item.type === "video" ? '<button class="media-play" type="button" aria-label="' + t("video.play") + '"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' : "") +
                    '<figcaption>' + cap(item, "caption") + '</figcaption>';
                if (item.type === "video") {
                    fig.querySelector(".media-play").addEventListener("click", function () {
                        if (item.youtube) {
                            var ifr = document.createElement("iframe");
                            ifr.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
                            ifr.src = "https://www.youtube.com/embed/" + item.youtube + "?autoplay=1&rel=0&playsinline=1";
                            ifr.title = cap(item, "caption");
                            ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                            ifr.setAttribute("allowfullscreen", "");
                            fig.innerHTML = ""; fig.appendChild(ifr);
                        } else {
                            var v = fig.querySelector("video");
                            if (v && v.src) { if (v.paused) v.play(); else v.pause(); this.style.opacity = "0"; }
                        }
                    });
                }
                grid.appendChild(fig);
            });
            empty.style.display = shown ? "none" : "block";
        }

        if (bar) {
            // Only show categories that actually have items
            var present = {};
            items.forEach(function (it) { (it.stunt || []).forEach(function (s) { present[s] = true; }); });
            var cats = ["all"].concat(STUNTS.filter(function (s) { return present[s]; }));
            cats.forEach(function (c, idx) {
                var b = document.createElement("button");
                b.type = "button";
                b.className = "filter-chip" + (idx === 0 ? " active" : "");
                b.textContent = t("filter." + c);
                b.setAttribute("data-filter", c);
                b.addEventListener("click", function () {
                    bar.querySelectorAll(".filter-chip").forEach(function (x) { x.classList.remove("active"); });
                    b.classList.add("active");
                    render(c);
                });
                bar.appendChild(b);
            });
        }
        render("all");
    }

    /* ---------- Filmography + filter ---------- */
    var PRODS = ["feature", "series", "commercial", "musicvideo", "international"];
    function setupFilmography() {
        var host = document.querySelector("[data-filmography]");
        if (!host || !window.BENZ_FILMOGRAPHY) return;
        var bar = document.querySelector("[data-film-filter]");
        var grid = document.createElement("div");
        grid.className = "references-grid";
        host.appendChild(grid);

        function render(filter) {
            grid.innerHTML = "";
            window.BENZ_FILMOGRAPHY.forEach(function (c) {
                if (filter !== "all" && c.productionType !== filter) return;
                var art = document.createElement("article");
                art.className = "reference-card";
                var link = c.link ? '<a class="reference-link" href="' + c.link + '" target="_blank" rel="noopener">' + (LANG === "en" ? "View reference" : "Voir la référence") + '</a>' : "";
                var poster = c.poster
                    ? '<img src="' + media(c.poster) + '" alt="' + (LANG === "en" ? "Poster — " : "Affiche — ") + c.title + '" loading="lazy" decoding="async">'
                    : placeholder("");
                art.innerHTML =
                    '<div class="reference-poster">' + poster + '</div>' +
                    '<div class="reference-info">' +
                        '<span class="reference-type">' + t("prod." + c.productionType) + '</span>' +
                        '<h3>' + c.title + '</h3>' +
                        '<p>' + cap(c, "role") + '</p>' +
                        '<span class="reference-year">' + c.year + '</span>' + link +
                    '</div>';
                grid.appendChild(art);
            });
        }
        if (bar) {
            var present = {};
            window.BENZ_FILMOGRAPHY.forEach(function (c) { present[c.productionType] = true; });
            var cats = ["all"].concat(PRODS.filter(function (p) { return present[p]; }));
            cats.forEach(function (c, idx) {
                var b = document.createElement("button");
                b.type = "button";
                b.className = "filter-chip" + (idx === 0 ? " active" : "");
                b.textContent = c === "all" ? t("filter.all") : t("prod." + c);
                b.addEventListener("click", function () {
                    bar.querySelectorAll(".filter-chip").forEach(function (x) { x.classList.remove("active"); });
                    b.classList.add("active");
                    render(c);
                });
                bar.appendChild(b);
            });
        }
        render("all");

        // partner logos
        var logoHost = document.querySelector("[data-partners]");
        if (logoHost && window.BENZ_PARTNERS) {
            window.BENZ_PARTNERS.forEach(function (name) {
                var s = document.createElement("span");
                s.className = "partner-logo"; s.textContent = name;
                logoHost.appendChild(s);
            });
        }
    }

    /* ---------- Testimonials ---------- */
    function setupTestimonials() {
        var host = document.querySelector("[data-testimonials]");
        if (!host || !window.BENZ_TESTIMONIALS) return;
        window.BENZ_TESTIMONIALS.forEach(function (item) {
            var d = document.createElement("blockquote");
            d.className = "testimonial-card";
            d.innerHTML =
                '<svg class="quote-mark" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h4v6H7v4H3v-6c0-2.2 1.8-4 4-4zm10 0h4v6h-4v4h-4v-6c0-2.2 1.8-4 4-4z"/></svg>' +
                '<p>' + cap(item, "quote") + '</p>' +
                '<footer><strong>' + item.name + '</strong><span>' + cap(item, "role") + '</span></footer>';
            host.appendChild(d);
        });
    }

    /* ---------- Press kit ---------- */
    function setupPressKit() {
        document.querySelectorAll("[data-presskit]").forEach(function (btn) {
            var file = btn.getAttribute("data-presskit"); // path or empty
            btn.addEventListener("click", function (e) {
                if (!file) {
                    e.preventDefault();
                    showToast(t("presskit.preparing"));
                }
            });
        });
    }

    /* ---------- Contact form ---------- */
    function setupForm() {
        var form = document.getElementById("contactForm");
        if (!form) return;

        // preselect service from ?service=
        var params = new URLSearchParams(location.search);
        var svc = params.get("service");
        var sel = form.querySelector("#cascade-type");
        if (svc && sel) {
            Array.prototype.forEach.call(sel.options, function (o) { if (o.value === svc) o.selected = true; });
        }

        function setError(field, msg) {
            var grp = field.closest(".form-group");
            if (!grp) return;
            var e = grp.querySelector(".field-error");
            if (!e) { e = document.createElement("span"); e.className = "field-error"; grp.appendChild(e); }
            e.textContent = msg || "";
            field.setAttribute("aria-invalid", msg ? "true" : "false");
        }
        function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var ok = true, firstBad = null;
            form.querySelectorAll("[required]").forEach(function (f) {
                if (!f.value.trim()) {
                    setError(f, t("form.required")); ok = false; if (!firstBad) firstBad = f;
                } else if (f.type === "email" && !validEmail(f.value.trim())) {
                    setError(f, t("form.email")); ok = false; if (!firstBad) firstBad = f;
                } else setError(f, "");
            });
            if (!ok) { if (firstBad) firstBad.focus(); return; }

            var name = (form.querySelector("#name") || {}).value || "";
            var email = (form.querySelector("#email") || {}).value || "";
            var project = (form.querySelector("#project") || {}).value || "";
            var type = (form.querySelector("#cascade-type") || {}).value || "";
            var locationValue = (form.querySelector("#location") || {}).value || "";
            var dates = (form.querySelector("#dates") || {}).value || "";
            var description = (form.querySelector("#description") || {}).value || "";

            var subject = "Demande BENZ-ACTION" + (project ? " - " + project : "");
            var body = [
                "Nom / Name: " + name,
                "Email: " + email,
                "Projet / Project: " + project,
                "Type de cascade / Type of stunt: " + type,
                "Lieu de tournage / Shooting location: " + locationValue,
                "Dates: " + dates,
                "",
                "Descriptif technique / Technical description:",
                description,
                "",
                "Envoye depuis / Sent from: " + location.href
            ].join("\n");

            window.location.href = "mailto:contact@benzaction.com?subject=" +
                encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
            showToast(LANG === "en" ? "Your email app is opening. Please send the prepared message." : "Votre application mail va s'ouvrir. Envoyez le message prepare.");
        });
    }

    /* ---------- Toast ---------- */
    function showToast(msg) {
        var t0 = document.createElement("div");
        t0.className = "benz-toast";
        t0.textContent = msg;
        document.body.appendChild(t0);
        requestAnimationFrame(function () { t0.classList.add("show"); });
        setTimeout(function () { t0.classList.remove("show"); setTimeout(function () { t0.remove(); }, 400); }, 4200);
    }

    /* ---------- Smooth scroll for in-page anchors ---------- */
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener("click", function (e) {
                var id = this.getAttribute("href");
                if (id.length < 2) return;
                var target = document.querySelector(id);
                if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }
            });
        });
    }

    /* ---------- Active nav link ---------- */
    function setupActiveNav() {
        var page = document.body.getAttribute("data-page");
        if (!page) return;
        document.querySelectorAll("#navLinks a[data-nav]").forEach(function (a) {
            if (a.getAttribute("data-nav") === page) {
                a.classList.add("is-active");
                a.setAttribute("aria-current", "page");
            }
        });
    }

    /* ---------- Init ---------- */
    document.addEventListener("DOMContentLoaded", function () {
        applyI18n();
        setupLangSwitcher();
        setupNavbar();
        setupActiveNav();
        setupAos();
        setupCounters();
        setupParticles();
        setupShowreel();
        setupGallery();
        setupFilmography();
        setupTestimonials();
        setupPressKit();
        setupForm();
        setupSmoothScroll();
    });
})();
