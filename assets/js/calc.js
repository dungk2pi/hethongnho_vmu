/* =========================================================================
   calc.js — Lớp tính toán thuần (không đụng tới DOM).
   Dùng chung cho trình duyệt (window.Calc) và Node (require) để kiểm thử.
   Mọi kết quả hiển thị trên giao diện đều được tính từ đây.
   ========================================================================= */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Calc = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Tiện ích số học ---------- */
  function log2Exact(x) {
    if (typeof x !== 'number' || !Number.isFinite(x) || x < 1) return null;
    const l = Math.log2(x);
    return Number.isInteger(l) && 2 ** l === x ? l : null;
  }
  const isPow2 = (x) => log2Exact(x) !== null;

  const UNIT = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3 };

  /** "4K" → 4096, "256KB" → 262144, "4GB" → 4294967296, "32" → 32 */
  function parseSize(str) {
    const m = String(str).trim().toUpperCase().replace(/\s+/g, '')
      .match(/^(\d+)([KMG]?)(B)?$/);
    if (!m) return null;
    return Number(m[1]) * UNIT[m[2]];
  }

  /** 4096 → "4K", 262144 → "256K" (đơn vị nhị phân như slide) */
  function formatCount(n) {
    for (const [u, v] of [['G', 1024 ** 3], ['M', 1024 ** 2], ['K', 1024]]) {
      if (n >= v && n % v === 0) return n / v + u;
    }
    return String(n);
  }
  const formatBytes = (b) => formatCount(b) + 'B';

  /** Dung lượng tính bằng bit → chuỗi dễ đọc (ưu tiên byte nếu chia hết cho 8) */
  function formatBits(bits) {
    if (bits % 8 === 0) return formatBytes(bits / 8);
    return formatCount(bits) + ' bit';
  }

  function toBin(value, bits) {
    return Math.floor(value).toString(2).padStart(bits, '0');
  }
  function toHex(value, digits) {
    return '0x' + Math.floor(value).toString(16).toUpperCase().padStart(digits || 1, '0');
  }

  /**
   * Đọc địa chỉ người dùng nhập: thập phân "4660", thập lục phân "0x1234"
   * hoặc nhị phân "0b1010". Kiểm tra nằm trong [0, 2^bits − 1].
   */
  function parseAddress(text, bits) {
    const s = String(text).trim().replace(/_/g, '').replace(/\s+/g, '');
    if (s === '') return { error: 'Hãy nhập một địa chỉ.' };
    let value;
    if (/^0x[0-9a-f]+$/i.test(s)) value = parseInt(s.slice(2), 16);
    else if (/^0b[01]+$/i.test(s)) value = parseInt(s.slice(2), 2);
    else if (/^[0-9]+$/.test(s)) value = Number(s);
    else if (/^[0-9a-f]+h$/i.test(s)) value = parseInt(s.slice(0, -1), 16);
    else return { error: 'Định dạng không hợp lệ. Dùng số thập phân (4660), hex (0x1234) hoặc nhị phân (0b1010).' };
    if (!Number.isSafeInteger(value)) return { error: 'Số quá lớn.' };
    const max = 2 ** bits - 1;
    if (value > max) return { error: `Địa chỉ vượt quá ${bits} bit (tối đa ${toHex(max)} = ${max}).` };
    return { value };
  }

  /* =======================================================================
     BỘ NHỚ — Tổ chức chip nhớ (slide 23–34)
     ======================================================================= */

  /** Chip 2^n × m bit */
  function chip(words, width) {
    const n = log2Exact(words);
    if (n === null) throw new Error('Số từ nhớ phải là lũy thừa của 2.');
    if (!Number.isInteger(width) || width < 1) throw new Error('Độ dài từ nhớ phải là số nguyên dương.');
    return {
      words, width, addrLines: n, dataLines: width,
      bits: words * width, bytes: (words * width) / 8,
      label: `${formatCount(words)} × ${width}`
    };
  }

  /** Tổ chức 2 chiều: n = n1 + n2, 2^n1 hàng, 2^n2 từ / hàng (slide 27) */
  function dram2D(n1, n2, m) {
    return {
      n1, n2, n: n1 + n2, m,
      rows: 2 ** n1, cols: 2 ** n2, words: 2 ** (n1 + n2),
      bits: 2 ** (n1 + n2) * m
    };
  }

  /**
   * Theo hình slide 26: A(n1−1)…A0 đi vào bộ giải mã hàng, các bit cao hơn
   * đi vào bộ giải mã cột. Địa chỉ logic = cột × 2^n1 + hàng.
   */
  function dramAddress(row, col, n1) { return col * 2 ** n1 + row; }
  function dramSplit(addr, n1) { return { row: addr % 2 ** n1, col: Math.floor(addr / 2 ** n1) }; }

  /** Dồn kênh địa chỉ: r chân dùng 2 pha → 2r bit logic (slide 28) */
  function muxDram(r, m) {
    return { pins: r, phases: 2, logicalBits: 2 * r, locations: 2 ** (2 * r), bits: 2 ** (2 * r) * m, separatePins: 2 * r, savedPins: r };
  }

  /** Tín hiệu điều khiển tích cực mức thấp (slide 29) */
  function controlState(cs, oe, we) {
    if (cs === 1) return { mode: 'off', ok: true, text: 'CS = 1: chip không được chọn. Bus dữ liệu của chip ở trạng thái thả nổi, chip bỏ qua OE và WE.' };
    if (oe === 0 && we === 0) return { mode: 'conflict', ok: false, text: 'OE = 0 và WE = 0 cùng lúc: không phải thao tác hợp lệ trong mô hình đơn giản của bài học.' };
    if (we === 0) return { mode: 'write', ok: true, text: 'CS = 0, WE = 0: ghi dữ liệu từ bus vào từ nhớ được chọn.' };
    if (oe === 0) return { mode: 'read', ok: true, text: 'CS = 0, OE = 0: đọc từ nhớ được chọn ra bus dữ liệu.' };
    return { mode: 'idle', ok: true, text: 'Chip đã được chọn nhưng chưa có lệnh đọc hay ghi (OE = 1, WE = 1).' };
  }

  /** Tăng số lượng từ nhớ (slide 30–32): ghép 2^k chip, giữ nguyên độ rộng */
  function expandWords(chipWords, chipWidth, targetWords) {
    const c = chip(chipWords, chipWidth);
    const count = targetWords / chipWords;
    const k = log2Exact(count);
    if (k === null) throw new Error('Số từ yêu cầu phải bằng 2^k lần số từ của một chip.');
    const ranges = [];
    for (let i = 0; i < count; i++) ranges.push({ chip: i, start: i * chipWords, end: (i + 1) * chipWords - 1 });
    return {
      chip: c, chips: count, selectLines: k,
      externalAddr: c.addrLines + k, dataLines: chipWidth,
      totalWords: targetWords, totalBits: targetWords * chipWidth, totalBytes: (targetWords * chipWidth) / 8,
      decoder: k === 0 ? null : { inputs: k, outputs: count },
      sharedLines: [0, c.addrLines - 1], selectBits: k ? [c.addrLines, c.addrLines + k - 1] : null,
      ranges
    };
  }

  /** Tăng độ dài từ nhớ: ghép song song, giữ nguyên số từ */
  function expandWidth(chipWords, chipWidth, targetWidth) {
    const c = chip(chipWords, chipWidth);
    const count = targetWidth / chipWidth;
    if (!Number.isInteger(count) || count < 1) throw new Error('Độ dài từ yêu cầu phải là bội của độ dài từ của chip.');
    const slices = [];
    for (let i = 0; i < count; i++) slices.push({ chip: i, lo: i * chipWidth, hi: (i + 1) * chipWidth - 1 });
    return {
      chip: c, chips: count, addrLines: c.addrLines, dataLines: targetWidth,
      totalWords: chipWords, totalBits: chipWords * targetWidth, totalBytes: (chipWords * targetWidth) / 8,
      slices
    };
  }

  /** Địa chỉ của module → chip nào, địa chỉ bên trong chip */
  function locateInModule(addr, chipWords, chips) {
    if (addr < 0 || addr >= chipWords * chips) return null;
    return { chip: Math.floor(addr / chipWords), internal: addr % chipWords };
  }

  /* --- Bộ giải mã, đúng bảng chân lý trong slide 33–34 (ngõ ra tích cực thấp) --- */
  /** Slide 33 ghi "2 → 1" nhưng hình là cổng AND + NOT (= NAND) */
  const nand2 = (a, b) => (a && b ? 0 : 1);
  /** 1 → 2: Ḡ tích cực thấp; trả về [Ȳ0, Ȳ1] */
  function dec1to2(g, a) { if (g) return [1, 1]; return a ? [1, 0] : [0, 1]; }
  /** 2 → 4: Ḡ, B, A; trả về [Ȳ0..Ȳ3] */
  function dec2to4(g, b, a) { const o = [1, 1, 1, 1]; if (!g) o[b * 2 + a] = 0; return o; }
  /** 74LS138: G1 tích cực cao, G2A/G2B tích cực thấp, chọn C B A, ngõ ra Ȳ0..Ȳ7 */
  function ls138(g1, g2a, g2b, c, b, a) {
    const enabled = g1 === 1 && g2a === 0 && g2b === 0;
    const out = new Array(8).fill(1);
    if (enabled) out[c * 4 + b * 2 + a] = 0;
    return { enabled, out };
  }
  /** Mô hình trừu tượng: n bit chọn 1 trong 2^n ngõ ra */
  function decoderN(n, value) {
    const out = new Array(2 ** n).fill(0);
    out[value] = 1;
    return out;
  }

  /* =======================================================================
     CACHE — Cấu trúc và ánh xạ (slide 35–52)
     ======================================================================= */

  /**
   * Tính độ rộng các trường địa chỉ.
   * Mọi kích thước tính bằng "đơn vị địa chỉ" (byte hoặc word tùy bài).
   *  mapping: 'direct' | 'full' | 'set'
   */
  function cacheFields({ memUnits, cacheUnits, blockUnits, mapping, ways = 1 }) {
    const N = log2Exact(memUnits);
    const W = log2Exact(blockUnits);
    const C = log2Exact(cacheUnits);
    if (N === null || W === null || C === null) throw new Error('Các kích thước phải là lũy thừa của 2.');
    if (blockUnits > cacheUnits) throw new Error('Kích thước Block lớn hơn dung lượng Cache.');
    if (cacheUnits > memUnits) throw new Error('Cache lớn hơn bộ nhớ chính.');
    const lines = cacheUnits / blockUnits;
    const lineBits = C - W;
    const blocks = memUnits / blockUnits;
    const base = { N, offset: W, lines, lineBits, blocks, blockBits: N - W, mapping };
    if (mapping === 'direct') return { ...base, index: lineBits, tag: N - lineBits - W, sets: lines, ways: 1, indexName: 'Line' };
    if (mapping === 'full') return { ...base, index: 0, tag: N - W, sets: 1, ways: lines, indexName: null };
    if (mapping === 'set') {
      if (!isPow2(ways) || ways > lines) throw new Error('Số đường (way) phải là lũy thừa của 2 và không lớn hơn số Line.');
      const sets = lines / ways;
      const S = log2Exact(sets);
      return { ...base, index: S, tag: N - S - W, sets, ways, wayBits: log2Exact(ways), indexName: 'Set' };
    }
    throw new Error('Kiểu ánh xạ không hợp lệ.');
  }

  /** Tách một địa chỉ theo cấu hình f (kết quả của cacheFields) */
  function splitAddress(addr, f) {
    const blockSize = 2 ** f.offset;
    const block = Math.floor(addr / blockSize);
    const offset = addr % blockSize;
    let index = null, tag;
    if (f.mapping === 'direct') { index = block % f.lines; tag = Math.floor(block / f.lines); }
    else if (f.mapping === 'set') { index = block % f.sets; tag = Math.floor(block / f.sets); }
    else { tag = block; }
    const bin = toBin(addr, f.N);
    const tagBin = bin.slice(0, f.tag);
    const idxBin = bin.slice(f.tag, f.tag + f.index);
    const offBin = bin.slice(f.tag + f.index);
    return { addr, block, offset, index, tag, bin, tagBin, idxBin, offBin };
  }

  /** Mô phỏng cache với thay thế FIFO (giả định mô phỏng, không có trong slide) */
  class CacheSim {
    constructor({ mapping, lines, ways = 1 }) {
      this.mapping = mapping;
      this.lines = lines;
      this.sets = mapping === 'direct' ? lines : mapping === 'full' ? 1 : lines / ways;
      this.ways = lines / this.sets;
      if (!Number.isInteger(this.sets) || this.sets < 1) throw new Error('Cấu hình cache không hợp lệ.');
      this.reset();
    }
    reset() {
      this.store = Array.from({ length: this.sets }, () =>
        Array.from({ length: this.ways }, () => ({ valid: false, tag: null, block: null })));
      this.fifo = Array.from({ length: this.sets }, () => []);
      this.seen = new Set();
      this.hits = 0; this.misses = 0; this.clock = 0;
      this.log = [];
    }
    locate(block) { return { set: block % this.sets, tag: Math.floor(block / this.sets) }; }
    /** Vị trí (số Line toàn cục) của set s, way w */
    lineOf(set, way) { return set * this.ways + way; }
    access(block, preferredWay = null) {
      const { set, tag } = this.locate(block);
      const row = this.store[set];
      const comparisons = row.map((e, way) => ({ way, valid: e.valid, tag: e.tag, match: e.valid && e.tag === tag }));
      const hitWay = comparisons.findIndex((c) => c.match);
      this.clock++;
      let result;
      if (hitWay >= 0) {
        this.hits++;
        result = { hit: true, block, set, tag, way: hitWay, line: this.lineOf(set, hitWay), comparisons, evicted: null, missType: null };
      } else {
        this.misses++;
        let way = -1;
        if (preferredWay !== null && preferredWay < this.ways && !row[preferredWay].valid) way = preferredWay;
        if (way < 0) way = row.findIndex((e) => !e.valid);
        let evicted = null;
        if (way < 0) {
          way = this.fifo[set].shift();
          evicted = row[way].block;
        }
        let missType = 'cold';
        if (this.seen.has(block)) missType = this.mapping === 'direct' ? 'conflict' : 'replacement';
        row[way] = { valid: true, tag, block };
        this.fifo[set] = this.fifo[set].filter((w) => w !== way);
        this.fifo[set].push(way);
        this.seen.add(block);
        result = { hit: false, block, set, tag, way, line: this.lineOf(set, way), comparisons, evicted, missType };
      }
      this.log.push(result);
      return result;
    }
    get accesses() { return this.hits + this.misses; }
    get hitRate() { return hitRate(this.hits, this.accesses); }
  }

  function hitRate(hits, total) { return total ? (hits / total) * 100 : 0; }

  /** So sánh thời gian minh họa có/không cache (số liệu ví dụ) */
  function timingCompare({ accesses, hitPercent, tCache, tMem }) {
    const hits = Math.round((accesses * hitPercent) / 100);
    const misses = accesses - hits;
    const noCache = accesses * tMem;
    const withCache = hits * tCache + misses * (tCache + tMem);
    return { hits, misses, noCache, withCache, avg: accesses ? withCache / accesses : 0 };
  }

  /* =======================================================================
     Chẩn đoán lỗi cho phần luyện tập
     ======================================================================= */
  /**
   * ctx: các giá trị liên quan để nhận diện nhầm lẫn thường gặp,
   * ví dụ { lines, sets, N, offset, index, bytes, bits }.
   */
  function diagnose(kind, given, correct, ctx = {}) {
    if (given === null || given === undefined || Number.isNaN(given)) return { ok: false, msg: 'Chưa nhập giá trị hoặc giá trị không phải là số.' };
    if (given === correct) return { ok: true, msg: 'Chính xác.' };
    const tips = [];
    if (kind === 'sets' && ctx.lines !== undefined && given === ctx.lines) tips.push('Bạn đang đưa ra số Line. Số Set = số Line ÷ số đường (way).');
    if (kind === 'sets' && ctx.ways !== undefined && given === ctx.ways) tips.push('Đó là số Line trong một Set (số way), không phải số Set.');
    if (kind === 'lines' && ctx.sets !== undefined && given === ctx.sets && ctx.sets !== ctx.lines) tips.push('Bạn đang đưa ra số Set. Số Line = dung lượng Cache ÷ kích thước Line.');
    if (kind === 'lines' && ctx.cacheUnits && given === ctx.cacheUnits) tips.push('Đó là dung lượng cache, chưa chia cho kích thước một Line.');
    if (kind === 'setBits' && ctx.lineBits !== undefined && given === ctx.lineBits) tips.push('Đó là số bit để đánh số Line. Trường Set = log₂(số Set), với số Set = số Line ÷ số way.');
    if (kind === 'addrBits' && ctx.chipAddr !== undefined && given === ctx.chipAddr) tips.push('Đó là số đường địa chỉ của một chip. Module cần thêm log₂(số chip) bit để chọn chip.');
    if ((kind === 'indexBits' || kind === 'setBits' || kind === 'lineBits') && ctx.countValue !== undefined && given === ctx.countValue) tips.push('Đó là số lượng, đề hỏi số bit. Lấy log₂ của số lượng.');
    if (kind === 'tag' && ctx.N !== undefined && ctx.offset !== undefined && given === ctx.N - ctx.offset && ctx.index) tips.push('Bạn chưa trừ số bit của trường Line/Set.');
    if (kind === 'tag' && ctx.N !== undefined && ctx.index !== undefined && given === ctx.N - ctx.index) tips.push('Bạn chưa trừ số bit Offset (vị trí trong Block).');
    if (kind === 'tag' && ctx.altIndex !== undefined && ctx.N !== undefined && given === ctx.N - ctx.altIndex - ctx.offset) tips.push('Có vẻ bạn dùng số bit của Line thay vì số bit của Set (hoặc ngược lại).');
    if (kind === 'addrBits' && ctx.countValue !== undefined && given === ctx.countValue) tips.push('Đó là số ô nhớ. Số đường địa chỉ = log₂(số ô nhớ).');
    if ((kind === 'capacityBits' || kind === 'bytes') && correct * 8 === given) tips.push('Sai đơn vị: bạn đang tính bằng bit, đề hỏi byte (1 byte = 8 bit).');
    if ((kind === 'capacityBits' || kind === 'bytes') && correct === given * 8) tips.push('Sai đơn vị: bạn đang tính bằng byte, đề hỏi bit.');
    if (isPow2(correct) && given === log2Exact(correct)) tips.push('Bạn đưa ra số mũ. Đề hỏi giá trị 2^x.');
    if (isPow2(given) && log2Exact(given) === correct) tips.push('Bạn đưa ra 2^x. Đề hỏi số bit, tức là số mũ x.');
    if (!tips.length) tips.push(given > correct ? 'Kết quả lớn hơn đáp án. Kiểm tra lại công thức.' : 'Kết quả nhỏ hơn đáp án. Kiểm tra lại công thức.');
    return { ok: false, msg: tips[0] };
  }

  return {
    log2Exact, isPow2, parseSize, formatCount, formatBytes, formatBits, toBin, toHex, parseAddress,
    chip, dram2D, dramAddress, dramSplit, muxDram, controlState, expandWords, expandWidth, locateInModule,
    nand2, dec1to2, dec2to4, ls138, decoderN,
    cacheFields, splitAddress, CacheSim, hitRate, timingCompare, diagnose
  };
});
