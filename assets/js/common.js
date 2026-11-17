/* =========================================================================
   common.js — Thành phần giao diện dùng chung cho hai trang bài học.
   (Phần tính toán nằm trong calc.js; tệp này chỉ lo hiển thị và tương tác.)
   ========================================================================= */
(function () {
  'use strict';
  const Lab = (window.Lab = {});
  Lab.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Lab.$ = (s, r = document) => r.querySelector(s);
  Lab.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  Lab.esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Lab.sup = (n) => `<sup>${n}</sup>`;
  Lab.pow = (n) => `2<sup>${n}</sup>`;

  /* ---------- Điều hướng giữa các phần (một phần hiển thị một lúc) ---------- */
  Lab.onShow = {};
  Lab.initPage = function (info) {
    const sections = Lab.$$('.section');
    const links = Lab.$$('.rail nav a');
    const work = Lab.$('.work');
    const rail = Lab.$('.rail');
    const shown = new Set();
    function show(id, push) {
      if (!sections.some((s) => s.id === id)) id = sections[0].id;
      sections.forEach((s) => (s.hidden = s.id !== id));
      links.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'));
      Lab.renderPanel(info[id]);
      if (work) work.scrollTop = 0;
      if (push && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
      const fn = Lab.onShow[id];
      if (fn) fn(!shown.has(id));
      shown.add(id);
      rail && rail.classList.remove('open');
    }
    links.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      show(a.getAttribute('href').slice(1), true);
      const h = Lab.$('#' + a.getAttribute('href').slice(1) + ' h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }));
    window.addEventListener('hashchange', () => show(location.hash.slice(1), false));
    const mb = Lab.$('.menu-btn');
    if (mb) mb.addEventListener('click', () => {
      rail.classList.toggle('open');
      mb.setAttribute('aria-expanded', rail.classList.contains('open'));
    });
    Lab.show = (id) => show(id, true);
    show(location.hash.slice(1), false);
  };

  /* ---------- Bảng giải thích: Là gì → Vì sao → Thế nào → Quan sát → Thử → Kiểm tra ---------- */
  Lab.renderPanel = function (d) {
    const p = Lab.$('.panel');
    if (!p || !d) return;
    let k = 0;
    const part = (t, body) => body ? `<h3><span class="n">${++k}</span>${t}</h3>${body.startsWith('<') ? body : `<p>${body}</p>`}` : '';
    let html = `<h2>${d.title}</h2><p class="en">${d.en || ''}</p>`;
    html += part('Là gì?', d.what) + part('Vì sao cần?', d.why) + part('Hoạt động thế nào?', d.how)
      + part('Quan sát trên hình', d.see) + part('Tự thử', d.try);
    if (d.check) {
      html += `<h3><span class="n">${++k}</span>Kiểm tra nhanh</h3><div class="check"><p>${d.check.q}</p>`
        + d.check.opts.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join('')
        + `<p class="fb" aria-live="polite"></p></div>`;
    }
    if (d.terms && d.terms.length) {
      html += `<details><summary>Thuật ngữ trong phần này</summary><dl class="terms">`
        + d.terms.map((t) => `<dt>${t[0]} <i>${t[1]}</i></dt><dd>${t[2]}</dd>`).join('') + `</dl></details>`;
    }
    if (d.extra) html += d.extra;
    p.innerHTML = html;
    if (d.check) {
      const box = Lab.$('.check', p);
      Lab.$$('button', box).forEach((b) => b.addEventListener('click', () => {
        const ok = Number(b.dataset.i) === d.check.ans;
        Lab.$$('button', box).forEach((x) => x.classList.remove('right', 'wrong'));
        b.classList.add(ok ? 'right' : 'wrong');
        Lab.$('.fb', box).innerHTML = (ok ? '<b class="tag-hit">Đúng.</b> ' : '<b class="tag-miss">Chưa đúng.</b> ') + d.check.why;
      }));
    }
  };

  /* ---------- Bộ phát từng bước (thủ công / tự chạy) ---------- */
  class StepPlayer {
    constructor(host, { steps, onStep, interval = 1500, listHost }) {
      this.host = host; this.onStep = onStep; this.interval = interval;
      this.timer = null; this.i = -1;
      host.innerHTML = `<div class="player">
        <button type="button" class="btn" data-a="reset">Đặt lại</button>
        <button type="button" class="btn" data-a="prev">Bước trước</button>
        <button type="button" class="btn btn--solid" data-a="play">Chạy</button>
        <button type="button" class="btn" data-a="next">Bước tiếp</button>
        <span class="player__count" aria-live="polite"></span></div>`;
      this.list = document.createElement('ol');
      this.list.className = 'steps';
      (listHost || host).appendChild(this.list);
      host.addEventListener('click', (e) => {
        const a = e.target.closest('button') && e.target.closest('button').dataset.a;
        if (!a) return;
        if (a === 'reset') this.reset();
        if (a === 'prev') { this.pause(); this.go(this.i - 1); }
        if (a === 'next') { this.pause(); this.go(this.i + 1); }
        if (a === 'play') this.timer ? this.pause() : this.play();
      });
      this.setSteps(steps);
    }
    setSteps(steps) {
      this.steps = steps;
      this.list.innerHTML = steps.map((s) => `<li>${s.label}</li>`).join('');
      this.reset();
    }
    go(i) {
      i = Math.max(-1, Math.min(this.steps.length - 1, i));
      this.i = i;
      Lab.$$('li', this.list).forEach((li, k) => { li.className = k < i ? 'done' : k === i ? 'now' : ''; });
      Lab.$('.player__count', this.host).textContent = `Bước ${i + 1}/${this.steps.length}`;
      Lab.$('[data-a=prev]', this.host).disabled = i < 0;
      Lab.$('[data-a=next]', this.host).disabled = i >= this.steps.length - 1;
      this.onStep(i);
      if (i >= this.steps.length - 1) this.pause();
    }
    play() {
      if (this.i >= this.steps.length - 1) this.go(-1);
      Lab.$('[data-a=play]', this.host).textContent = 'Tạm dừng';
      this.go(this.i + 1);
      this.timer = setInterval(() => this.go(this.i + 1), this.interval);
    }
    pause() {
      clearInterval(this.timer); this.timer = null;
      Lab.$('[data-a=play]', this.host).textContent = 'Chạy';
    }
    reset() { this.pause(); this.go(-1); }
  }
  Lab.StepPlayer = StepPlayer;

  /* ---------- Công tắc DIP (0/1) ---------- */
  Lab.dip = function (host, { label, value = 0, kind = '', onChange, note }) {
    const wrap = document.createElement('div');
    wrap.className = 'dip' + (kind ? ' dip--' + kind : '');
    wrap.innerHTML = `<span class="dip__label">${label}</span><button type="button" role="switch"></button><span class="dip__val"></span>`;
    const btn = wrap.querySelector('button');
    let v = value;
    const sync = () => {
      btn.setAttribute('aria-checked', v ? 'true' : 'false');
      btn.setAttribute('aria-label', `${label.replace(/<[^>]+>/g, '')} = ${v}${note ? ', ' + note : ''}`);
      wrap.querySelector('.dip__val').textContent = v;
    };
    btn.addEventListener('click', () => { v = v ? 0 : 1; sync(); onChange && onChange(v); });
    sync();
    host.appendChild(wrap);
    return { get: () => v, set: (x) => { v = x ? 1 : 0; sync(); }, el: wrap };
  };

  /* ---------- Nhóm nút chọn một ---------- */
  Lab.seg = function (host, options, value, onChange) {
    host.classList.add('seg');
    host.setAttribute('role', 'group');
    host.innerHTML = options.map((o) => `<button type="button" data-v="${o.value}">${o.label}</button>`).join('');
    const set = (v) => { value = v; Lab.$$('button', host).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); };
    host.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      set(b.dataset.v); onChange && onChange(b.dataset.v);
    });
    set(value);
    return { set, get: () => value };
  };

  /* ---------- Thẻ tab ---------- */
  Lab.tabs = function (bar, onChange) {
    const btns = Lab.$$('button', bar);
    bar.setAttribute('role', 'tablist');
    const select = (key) => {
      btns.forEach((b) => {
        const on = b.dataset.tab === key;
        b.setAttribute('aria-selected', String(on));
        b.setAttribute('role', 'tab');
        b.tabIndex = on ? 0 : -1;
        const pane = document.getElementById(b.dataset.tab);
        if (pane) pane.hidden = !on;
      });
      onChange && onChange(key);
    };
    bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(b.dataset.tab); });
    bar.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const j = (i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length;
        btns[j].focus(); select(btns[j].dataset.tab);
      }
    });
    select(btns[0].dataset.tab);
    return { select };
  };

  /* ---------- Đọc số người học nhập: 13, 2^13, 8K, 4KB, 0x1F ---------- */
  Lab.readNumber = function (text) {
    const s = String(text).trim().replace(/\s+/g, '').replace(/,/g, '');
    if (s === '') return null;
    let m = s.match(/^2(?:\^|\*\*)(\d+)$/);
    if (m) return 2 ** Number(m[1]);
    if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16);
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    const v = Calc.parseSize(s);
    return v === null ? NaN : v;
  };

  /* ---------- Bộ luyện tập: đề cố định + đề ngẫu nhiên hợp lệ ---------- */
  Lab.practice = function (host, { fixed, random, intro }) {
    let current = null, hintShown = false;
    host.innerHTML = `<div class="practice">
      ${intro ? `<p class="caption">${intro}</p>` : ''}
      <div class="controls">
        <label class="field">Chọn đề<select data-r="pick"></select></label>
        <button type="button" class="btn" data-r="rand">Đề ngẫu nhiên</button>
      </div>
      <div class="practice__q" data-r="q" aria-live="polite"></div>
      <div class="practice__fields" data-r="fields"></div>
      <div class="controls">
        <button type="button" class="btn btn--solid" data-r="check">Kiểm tra</button>
        <button type="button" class="btn" data-r="hint">Gợi ý</button>
        <button type="button" class="btn" data-r="sol">Xem lời giải</button>
        <button type="button" class="btn btn--ghost" data-r="retry">Làm lại</button>
      </div>
      <div data-r="out" aria-live="polite"></div></div>`;
    const R = (k) => Lab.$(`[data-r=${k}]`, host);
    R('pick').innerHTML = fixed.map((f, i) => `<option value="${i}">${f().title}</option>`).join('');
    function load(p) {
      current = p; hintShown = false;
      R('q').innerHTML = p.text;
      R('fields').innerHTML = p.fields.map((f, i) => `<label class="field">${f.label}
        <input type="text" inputmode="text" data-i="${i}" autocomplete="off" spellcheck="false" placeholder="${f.unit ? f.unit : 'số'}">
        <span class="fb" data-fb="${i}"></span></label>`).join('');
      R('out').innerHTML = '';
    }
    function check() {
      let all = true;
      current.fields.forEach((f, i) => {
        const inp = Lab.$(`input[data-i="${i}"]`, host);
        const fb = Lab.$(`[data-fb="${i}"]`, host);
        const val = Lab.readNumber(inp.value);
        const d = Calc.diagnose(f.kind || 'generic', val, f.answer, f.ctx || {});
        inp.setAttribute('aria-invalid', d.ok ? 'false' : 'true');
        fb.className = 'fb ' + (d.ok ? 'ok' : 'bad');
        fb.textContent = d.msg;
        if (!d.ok) all = false;
      });
      R('out').innerHTML = all
        ? `<div class="status status--ok">Tất cả đều đúng. Thử một đề ngẫu nhiên để chắc chắn bạn nắm được cách làm.</div>`
        : `<div class="status status--warn">Còn ô chưa đúng. Đọc gợi ý dưới từng ô, sửa lại rồi bấm Kiểm tra.</div>`;
    }
    R('pick').addEventListener('change', () => load(fixed[Number(R('pick').value)]()));
    R('rand').addEventListener('click', () => load(random()));
    R('check').addEventListener('click', check);
    R('hint').addEventListener('click', () => {
      hintShown = true;
      R('out').innerHTML = `<div class="status status--addr"><b>Gợi ý.</b> ${current.hint}</div>`;
    });
    R('sol').addEventListener('click', () => {
      R('out').innerHTML = `<div class="solution"><b>Lời giải</b><ol>${current.solution.map((s) => `<li>${s}</li>`).join('')}</ol></div>`;
    });
    R('retry').addEventListener('click', () => load(current));
    host.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) check(); });
    load(fixed[0]());
  };

  /* ---------- Lời giải có hướng dẫn: Bước tiếp / Bước trước / Đặt lại ---------- */
  Lab.guided = function (host, getSteps) {
    let i = 0, steps = getSteps();
    host.innerHTML = `<div class="guided"><ol class="guided__list"></ol>
      <div><div class="guided__body" aria-live="polite"></div>
      <div class="player"><button type="button" class="btn" data-g="reset">Đặt lại</button>
      <button type="button" class="btn" data-g="prev">Bước trước</button>
      <button type="button" class="btn btn--solid" data-g="next">Bước tiếp</button>
      <span class="player__count"></span></div></div></div>`;
    const list = Lab.$('.guided__list', host), body = Lab.$('.guided__body', host);
    function render() {
      list.innerHTML = steps.map((s, k) => `<li><button type="button" data-k="${k}" class="${k < i ? 'done' : k === i ? 'now' : ''}"><span class="n">${k + 1}</span>${s.title}</button></li>`).join('');
      body.innerHTML = `<h4>${steps[i].title}</h4>${steps[i].body}`;
      Lab.$('[data-g=prev]', host).disabled = i === 0;
      Lab.$('[data-g=next]', host).disabled = i === steps.length - 1;
      Lab.$('.player__count', host).textContent = `Bước ${i + 1}/${steps.length}`;
      steps[i].after && steps[i].after(body);
    }
    host.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k !== undefined) i = Number(b.dataset.k);
      if (b.dataset.g === 'next') i = Math.min(steps.length - 1, i + 1);
      if (b.dataset.g === 'prev') i = Math.max(0, i - 1);
      if (b.dataset.g === 'reset') i = 0;
      if (b.dataset.k !== undefined || b.dataset.g) render();
    });
    render();
    return { refresh() { steps = getSteps(); i = Math.min(i, steps.length - 1); render(); } };
  };

  /* ---------- Nội dung giả lập cho ô nhớ (ổn định theo địa chỉ) ---------- */
  Lab.seedValue = (addr, width) => {
    let x = (addr + 1) * 2654435761 % 4294967296;
    x ^= x >>> 13;
    return Math.abs(x) % (2 ** Math.min(width, 30));
  };

  /** Ghép thuộc tính SVG nhanh */
  Lab.attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
})();
