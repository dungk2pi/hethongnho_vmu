// Chạy: node tests/calculations.test.js   (hoặc: node --test tests/)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/js/calc.js');

const KB = 1024, GB = 1024 ** 3;

test('Tiện ích: log2, kích thước, chuyển đổi', () => {
  assert.equal(C.log2Exact(4096), 12);
  assert.equal(C.log2Exact(4095), null);
  assert.equal(C.log2Exact(2 ** 32), 32);
  assert.equal(C.parseSize('4K'), 4096);
  assert.equal(C.parseSize('256KB'), 262144);
  assert.equal(C.parseSize('4GB'), 4 * GB);
  assert.equal(C.formatCount(8192), '8K');
  assert.equal(C.formatBytes(4096), '4KB');
  assert.equal(C.toBin(5, 8), '00000101');
  assert.equal(C.toHex(4095, 4), '0x0FFF');
});

test('Đọc địa chỉ: thập phân, hex, nhị phân, lỗi', () => {
  assert.equal(C.parseAddress('4660', 16).value, 4660);
  assert.equal(C.parseAddress('0x1234', 16).value, 0x1234);
  assert.equal(C.parseAddress('0b1010', 8).value, 10);
  assert.equal(C.parseAddress('0xFFFFFFFF', 32).value, 4294967295);
  assert.ok(C.parseAddress('0x100000000', 32).error, 'vượt 32 bit phải báo lỗi');
  assert.ok(C.parseAddress('', 32).error);
  assert.ok(C.parseAddress('12g', 32).error);
  assert.ok(C.parseAddress('-5', 32).error);
});

test('SRAM 4K × 8 = 4KB, 12 đường địa chỉ, 8 đường dữ liệu', () => {
  const c = C.chip(4096, 8);
  assert.equal(c.addrLines, 12);
  assert.equal(c.dataLines, 8);
  assert.equal(c.bytes, 4 * KB);
  assert.equal(C.formatBytes(c.bytes), '4KB');
});

test('Tăng số từ: 4K × 8 → 8K × 8 dùng 2 chip, A12 chọn chip', () => {
  const m = C.expandWords(4096, 8, 8192);
  assert.equal(m.chips, 2);
  assert.equal(m.chip.addrLines, 12);
  assert.equal(m.externalAddr, 13);
  assert.equal(m.dataLines, 8);
  assert.equal(m.totalBytes, 8 * KB);
  assert.deepEqual(m.selectBits, [12, 12]);
  assert.deepEqual(m.ranges[0], { chip: 0, start: 0x0000, end: 0x0FFF });
  assert.deepEqual(m.ranges[1], { chip: 1, start: 0x1000, end: 0x1FFF });
  assert.deepEqual(C.locateInModule(0x1234, 4096, 2), { chip: 1, internal: 0x234 });
  assert.deepEqual(C.locateInModule(0x0FFF, 4096, 2), { chip: 0, internal: 0xFFF });
  assert.equal(C.locateInModule(0x2000, 4096, 2), null);
  // Bộ giải mã 1 → 2 (Ḡ = 0): A12 = 0 → Ȳ0 = 0 (chip 1), A12 = 1 → Ȳ1 = 0 (chip 2)
  assert.deepEqual(C.dec1to2(0, 0), [0, 1]);
  assert.deepEqual(C.dec1to2(0, 1), [1, 0]);
});

test('Tăng độ dài từ (ví dụ bổ sung): 4K × 8 → 4K × 16', () => {
  const m = C.expandWidth(4096, 8, 16);
  assert.equal(m.chips, 2);
  assert.equal(m.addrLines, 12);
  assert.equal(m.dataLines, 16);
  assert.equal(m.totalWords, 4096);
  assert.equal(m.totalBytes, 8 * KB);
  assert.deepEqual(m.slices[1], { chip: 1, lo: 8, hi: 15 });
  assert.throws(() => C.expandWidth(4096, 8, 12));
});

test('DRAM 128 × 128: 14 bit logic, 7 chân dồn kênh, 2 pha', () => {
  const d = C.dram2D(7, 7, 1);
  assert.equal(d.rows, 128);
  assert.equal(d.cols, 128);
  assert.equal(d.n, 14);
  assert.equal(d.words, 16384);
  const x = C.muxDram(7, 1);
  assert.equal(x.pins, 7);
  assert.equal(x.phases, 2);
  assert.equal(x.logicalBits, 14);
  assert.equal(x.locations, 16384);
  const a = C.dramAddress(5, 3, 7);
  assert.deepEqual(C.dramSplit(a, 7), { row: 5, col: 3 });
});

test('Tín hiệu điều khiển CS, OE, WE tích cực thấp', () => {
  assert.equal(C.controlState(1, 0, 1).mode, 'off');
  assert.equal(C.controlState(0, 0, 1).mode, 'read');
  assert.equal(C.controlState(0, 1, 0).mode, 'write');
  assert.equal(C.controlState(0, 0, 0).mode, 'conflict');
  assert.equal(C.controlState(0, 1, 1).mode, 'idle');
});

test('Bộ giải mã đúng bảng chân lý slide 33–34', () => {
  assert.deepEqual([C.nand2(0, 0), C.nand2(0, 1), C.nand2(1, 0), C.nand2(1, 1)], [1, 1, 1, 0]);
  assert.deepEqual(C.dec1to2(1, 0), [1, 1]);
  assert.deepEqual(C.dec2to4(0, 1, 0), [1, 1, 0, 1]);
  assert.deepEqual(C.dec2to4(1, 1, 1), [1, 1, 1, 1]);
  assert.deepEqual(C.ls138(1, 0, 0, 1, 0, 1).out, [1, 1, 1, 1, 1, 0, 1, 1]);
  assert.equal(C.ls138(0, 0, 0, 1, 1, 1).enabled, false);
  assert.equal(C.ls138(1, 1, 0, 0, 0, 0).enabled, false);
  assert.deepEqual(C.decoderN(2, 3), [0, 0, 0, 1]);
});

test('Ví dụ slide 43: địa chỉ 16 bit, word-addressed', () => {
  // 2^16 word, Block 16 word, Cache 128 Line → 2048 word
  const f = C.cacheFields({ memUnits: 2 ** 16, blockUnits: 16, cacheUnits: 128 * 16, mapping: 'direct' });
  assert.equal(f.N, 16);
  assert.equal(f.offset, 4);
  assert.equal(f.blocks, 4096);
  assert.equal(f.lines, 128);
  assert.equal(f.index, 7);
  assert.equal(f.tag, 5);
});

test('Ví dụ 4GB / 256KB / 32B (slide 49–52)', () => {
  const base = { memUnits: 4 * GB, cacheUnits: 256 * KB, blockUnits: 32 };
  const d = C.cacheFields({ ...base, mapping: 'direct' });
  assert.deepEqual([d.N, d.tag, d.index, d.offset, d.lines], [32, 14, 13, 5, 8192]);
  const f = C.cacheFields({ ...base, mapping: 'full' });
  assert.deepEqual([f.tag, f.index, f.offset], [27, 0, 5]);
  const s = C.cacheFields({ ...base, mapping: 'set', ways: 4 });
  assert.deepEqual([s.tag, s.index, s.offset, s.sets], [16, 11, 5, 2048]);
});

test('Tách địa chỉ 32 bit khớp giữa phép chia và cắt chuỗi nhị phân', () => {
  const base = { memUnits: 4 * GB, cacheUnits: 256 * KB, blockUnits: 32 };
  for (const cfg of [{ mapping: 'direct' }, { mapping: 'full' }, { mapping: 'set', ways: 4 }]) {
    const f = C.cacheFields({ ...base, ...cfg });
    for (const addr of [0, 31, 32, 0x12345678, 0xDEADBEEF, 0xFFFFFFFF]) {
      const r = C.splitAddress(addr, f);
      assert.equal(r.bin.length, 32);
      assert.equal(parseInt(r.tagBin, 2), r.tag);
      assert.equal(parseInt(r.offBin, 2), r.offset);
      if (f.index) assert.equal(parseInt(r.idxBin, 2), r.index);
      else assert.equal(r.index, null);
    }
  }
  const d = C.cacheFields({ ...base, mapping: 'direct' });
  const r = C.splitAddress(0x12345678, d);
  assert.equal(r.offset, 0x18);
  assert.equal(r.block, Math.floor(0x12345678 / 32));
  assert.equal(r.index, r.block % 8192);
  assert.equal(r.tag, Math.floor(r.block / 8192));
});

test('Mô phỏng ánh xạ trực tiếp: B0 → B4 → B0 gây conflict miss', () => {
  const sim = new C.CacheSim({ mapping: 'direct', lines: 4 });
  const a = sim.access(0), b = sim.access(4), c = sim.access(0);
  assert.equal(a.hit, false); assert.equal(a.line, 0); assert.equal(a.missType, 'cold');
  assert.equal(b.hit, false); assert.equal(b.line, 0); assert.equal(b.evicted, 0);
  assert.equal(c.hit, false); assert.equal(c.missType, 'conflict'); assert.equal(c.evicted, 4);
  assert.equal(sim.access(0).hit, true);
  assert.equal(sim.hits, 1); assert.equal(sim.misses, 3);
  assert.equal(sim.hitRate, 25);
});

test('Mô phỏng hoàn toàn: so sánh mọi tag, FIFO khi đầy', () => {
  const sim = new C.CacheSim({ mapping: 'full', lines: 4 });
  [0, 4, 8, 12].forEach((b) => sim.access(b));
  const hit = sim.access(8);
  assert.equal(hit.hit, true);
  assert.equal(hit.comparisons.length, 4);
  const miss = sim.access(16);
  assert.equal(miss.evicted, 0, 'FIFO thay khối vào sớm nhất');
  assert.equal(sim.access(0).hit, false);
  // Chọn Line trống theo ý người học
  const s2 = new C.CacheSim({ mapping: 'full', lines: 4 });
  assert.equal(s2.access(5, 2).line, 2);
});

test('Mô phỏng tập hợp 8 Line, 4-way → 2 Set', () => {
  const sim = new C.CacheSim({ mapping: 'set', lines: 8, ways: 4 });
  assert.equal(sim.sets, 2); assert.equal(sim.ways, 4);
  const a = sim.access(0), b = sim.access(2);
  assert.equal(a.set, 0); assert.equal(b.set, 0);
  assert.notEqual(a.way, b.way, 'hai Block cùng Set cùng tồn tại ở hai way khác nhau');
  assert.equal(sim.access(0).hit, true);
  assert.equal(sim.access(3).set, 1);
  [4, 6].forEach((x) => sim.access(x));
  const r = sim.access(8);
  assert.equal(r.evicted, 0);
});

test('Cấu hình không hợp lệ bị từ chối', () => {
  assert.throws(() => C.chip(3000, 8));
  assert.throws(() => C.expandWords(4096, 8, 12288));
  assert.throws(() => C.cacheFields({ memUnits: 1000, cacheUnits: 64, blockUnits: 8, mapping: 'direct' }));
  assert.throws(() => C.cacheFields({ memUnits: 1024, cacheUnits: 64, blockUnits: 8, mapping: 'set', ways: 16 }));
  assert.throws(() => C.cacheFields({ memUnits: 1024, cacheUnits: 4, blockUnits: 8, mapping: 'direct' }));
});

test('So sánh thời gian minh họa và tỷ lệ hit', () => {
  const t = C.timingCompare({ accesses: 100, hitPercent: 90, tCache: 1, tMem: 10 });
  assert.equal(t.hits, 90); assert.equal(t.noCache, 1000); assert.equal(t.withCache, 90 + 10 * 11);
  assert.equal(C.hitRate(3, 4), 75);
  assert.equal(C.hitRate(0, 0), 0);
});

test('Chẩn đoán lỗi luyện tập', () => {
  assert.equal(C.diagnose('sets', 2048, 2048).ok, true);
  assert.match(C.diagnose('sets', 8192, 2048, { lines: 8192 }).msg, /số Line/);
  assert.match(C.diagnose('tag', 27, 14, { N: 32, offset: 5, index: 13 }).msg, /Line\/Set/);
  assert.match(C.diagnose('tag', 19, 14, { N: 32, offset: 5, index: 13 }).msg, /Offset/);
  assert.match(C.diagnose('bytes', 65536, 8192).msg, /bit/);
  assert.match(C.diagnose('lineBits', 8192, 13, { countValue: 8192 }).msg, /log/);
  assert.match(C.diagnose('setBits', 13, 11, { lineBits: 13, countValue: 2048 }).msg, /Line/);
  assert.match(C.diagnose('addrBits', 12, 13, { chipAddr: 12, countValue: 8192 }).msg, /một chip/);
  assert.match(C.diagnose('tag', 14, 16, { N: 32, offset: 5, index: 11, altIndex: 13 }).msg, /Line thay vì|ngược lại/);
});

test('Số chip khi ghép cả hai chiều và ví dụ luyện tập', () => {
  const words = C.expandWords(1024, 4, 4096), width = C.expandWidth(1024, 4, 8);
  assert.equal(words.chips * width.chips, 8);
  assert.equal(C.log2Exact(4096), 12);
  const loc = C.locateInModule(0x2F10, 4096, 4);
  assert.deepEqual(loc, { chip: 2, internal: 0xF10 });
  const f = C.cacheFields({ memUnits: 1024 ** 2, cacheUnits: 16 * 1024, blockUnits: 16, mapping: 'set', ways: 2 });
  assert.deepEqual([f.N, f.offset, f.lines, f.sets, f.index, f.tag], [20, 4, 1024, 512, 9, 7]);
  const g = C.cacheFields({ memUnits: 64 * 1024, cacheUnits: 8 * 1024, blockUnits: 64, mapping: 'direct' });
  const sp = C.splitAddress(0xBEEF, g);
  assert.deepEqual([g.tag, g.index, g.offset], [3, 7, 6]);
  assert.deepEqual([sp.tag, sp.index, sp.offset], [0xBEEF >> 13, (0xBEEF >> 6) & 127, 0xBEEF & 63]);
});
