(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* шапка: линия после начала прокрутки */
  const top = document.querySelector(".top");
  const onScroll = () => top.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* заголовки по словам */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text
      .split(/\s+/)
      .map((w, i) => `<span class="wm" aria-hidden="true"><span class="wi" style="--i:${i}">${w}</span></span>`)
      .join(" ");
  });

  /* порядок появления текста у работ */
  document.querySelectorAll(".work__text").forEach((t) => {
    [...t.children].forEach((c, i) => c.style.setProperty("--i", i));
  });

  /* появления */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        e.target.querySelectorAll("[data-split]").forEach((h) => h.classList.add("is-in"));
        io.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
  document.querySelectorAll(".work, .contact, .sec-head").forEach((el) => io.observe(el));

  /* окна: сайт прокручивается внутри */
  const wins = [...document.querySelectorAll(".win")];
  const measure = (win) => {
    const view = win.querySelector(".win__view");
    const img = view.querySelector("img");
    const dist = Math.max(0, img.offsetHeight - view.clientHeight);
    win.style.setProperty("--dist", `${-dist}px`);
    win.style.setProperty("--dur", `${Math.max(3, dist / 260).toFixed(2)}s`);
    win.style.setProperty("--loop", `${Math.max(9, (dist / 180) * 2.4).toFixed(2)}s`);
  };
  wins.forEach((win) => {
    const img = win.querySelector("img");
    if (img.complete) measure(win);
    else img.addEventListener("load", () => measure(win), { once: true });
  });
  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => wins.forEach(measure), 150);
  });

  if (!reduce) {
    if (fine) {
      wins.forEach((win) => {
        win.addEventListener("pointerenter", () => { measure(win); win.classList.add("is-play"); });
        win.addEventListener("pointerleave", () => win.classList.remove("is-play"));
      });
    } else {
      /* на телефоне окна листают сами, пока видны */
      const loopIO = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.target.classList.toggle("is-loop", e.isIntersecting)),
        { threshold: 0.4 }
      );
      wins.forEach((w) => loopIO.observe(w));
    }
  }

  /* курсор «Открыть сайт» над окнами */
  const cursor = document.querySelector(".cursor");
  if (fine && cursor) {
    let x = -200, y = -200, cx = x, cy = y, raf = 0;
    const tick = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cursor.style.setProperty("--cx", `${cx}px`);
      cursor.style.setProperty("--cy", `${cy}px`);
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      if (reduce) { cx = x; cy = y; }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    wins.forEach((w) => {
      w.addEventListener("pointerenter", () => cursor.classList.add("is-on"));
      w.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    });
  }

  /* веер телефонов следует за курсором */
  const fan = document.querySelector("[data-fan]");
  const hero = document.querySelector(".hero");
  if (fan && fine && !reduce) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      fan.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      fan.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener("pointerleave", () => {
      fan.style.setProperty("--mx", 0);
      fan.style.setProperty("--my", 0);
    });
  }

  /* магнитная главная кнопка */
  if (fine && !reduce) {
    document.querySelectorAll("[data-magnet]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
      });
      b.addEventListener("pointerleave", () => (b.style.translate = ""));
    });
  }

  /* плавающее сообщение: появляется через несколько секунд, прячется у формы */
  const toast = document.querySelector("[data-toast]");
  const contact = document.getElementById("contact");
  if (toast) {
    let closed = false, ready = false, nearForm = false;
    try { closed = sessionStorage.getItem("toast-closed") === "1"; } catch (_) {}
    const sync = () => {
      const show = ready && !closed && !nearForm;
      if (show) toast.hidden = false;
      toast.classList.toggle("is-shown", show);
    };
    new IntersectionObserver((es) => { nearForm = es[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(contact);
    if (!closed) {
      setTimeout(() => {
        ready = true; sync();
        setTimeout(() => toast.classList.add("is-typed"), reduce ? 0 : 1600);
      }, 4000);
    }
    toast.querySelector(".toast__close").addEventListener("click", () => {
      closed = true; sync();
      try { sessionStorage.setItem("toast-closed", "1"); } catch (_) {}
    });
    toast.querySelector(".toast__card").addEventListener("click", () => {
      setTimeout(() => document.getElementById("f-name").focus({ preventScroll: true }), 700);
    });
  }

  /* заявка → Telegram */
  const form = document.getElementById("brief");
  const label = form.querySelector("[data-label]");
  const note = form.querySelector("[data-note]");
  const setLabel = (t) => {
    label.textContent = t;
    label.classList.remove("is-swap");
    void label.offsetWidth;
    label.classList.add("is-swap");
  };
  const check = (input) => {
    const field = input.closest(".field");
    const bad = !input.value.trim();
    field.classList.toggle("is-error", bad);
    if (bad) {
      field.classList.remove("is-shaking");
      void field.offsetWidth;
      field.classList.add("is-shaking");
    }
    return !bad;
  };
  form.querySelectorAll("input[required]").forEach((i) =>
    i.addEventListener("input", () => i.closest(".field").classList.remove("is-error"))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const biz = form.elements.biz;
    const okName = check(name);
    const okBiz = check(biz);
    if (!okName || !okBiz) {
      (okName ? biz : name).focus();
      return;
    }
    const needs = [...form.querySelectorAll('input[name="need"]:checked')].map((c) => c.value);
    const extra = form.elements.msg.value.trim();
    const lines = [
      `Здравствуйте, Полина! Меня зовут ${name.value.trim()}.`,
      `Чем занимаюсь: ${biz.value.trim()}.`,
    ];
    if (needs.length) lines.push(`Нужно: ${needs.join(", ")}.`);
    if (extra) lines.push(extra);
    const text = lines.join("\n");

    try { await navigator.clipboard.writeText(text); } catch (_) {}
    window.open(`https://t.me/pollykor?text=${encodeURIComponent(text)}`, "_blank", "noopener");

    setLabel("Открываю Telegram…");
    note.textContent = "Если чат не открылся, текст уже скопирован: вставьте его в сообщение @pollykor.";
    setTimeout(() => setLabel("Написать в Telegram"), 2600);
  });
})();
