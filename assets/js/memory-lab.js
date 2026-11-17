/* =========================================================================
   memory-lab.js — Trang "Tổ chức chip nhớ" (slide 23–34 + phần mở rộng I)
   Mọi con số hiển thị được tính bằng Calc (calc.js).
   ========================================================================= */
(function () {
  'use strict';
  const C = window.Calc, L = window.Lab, $ = L.$, $$ = L.$$;
  const hex = (v, d) => C.toHex(v, d), bin = (v, b) => C.toBin(v, b);
  const pw = L.pow;

  /** Đọc ô nhập địa chỉ, đánh dấu lỗi ngay trên ô */
  function readAddr(input, bits) {
    const r = C.parseAddress(input.value, bits);
    input.setAttribute('aria-invalid', r.error ? 'true' : 'false');
    return r;
  }
  function readInt(input, min, max) {
    const v = Number(String(input.value).trim());
    const ok = Number.isInteger(v) && v >= min && v <= max && String(input.value).trim() !== '';
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok ? v : null;
  }
  const status = (host, kind, html) => { host.innerHTML = `<div class="status status--${kind}">${html}</div>`; };
  const wire = (cls, d, live, dim) => `<path class="w ${cls}${live ? ' live' : ''}${dim ? ' dim' : ''}" d="${d}"/>`;
  const arrowHead = (x, y, dir, cls) => {
    const p = { r: `${x},${y} ${x - 8},${y - 5} ${x - 8},${y + 5}`, l: `${x},${y} ${x + 8},${y - 5} ${x + 8},${y + 5}`, d: `${x},${y} ${x - 5},${y - 8} ${x + 5},${y - 8}`, u: `${x},${y} ${x - 5},${y + 8} ${x + 5},${y + 8}` }[dir];
    return `<polygon points="${p}" class="${cls}"/>`;
  };
  const bar = (s) => `<tspan text-decoration="overline">${s}</tspan>`;

  /* =======================================================================
     Nội dung bảng giải thích cho từng phần
     ======================================================================= */
  const INFO = {
    'sec-a': {
      title: 'Ô nhớ, địa chỉ, từ nhớ', en: 'Memory cell, address, word',
      what: 'Bộ nhớ gồm nhiều ô (ngăn, hàng) nhớ. Theo slide 23, mỗi ô nhớ chứa 8 bit và có một địa chỉ duy nhất.',
      why: 'CPU cần một con số để chỉ đúng chỗ muốn đọc hoặc ghi. Con số đó là địa chỉ, gửi đi trên bus địa chỉ.',
      how: '<ul><li>Bus địa chỉ chở địa chỉ từ CPU tới bộ nhớ.</li><li>Bus điều khiển báo đọc hay ghi.</li><li>Bus dữ liệu chở giá trị đi hai chiều.</li></ul>',
      see: 'Hàng đang chọn tô đậm. Giá trị trên từng bus hiện ngay trên đường dây.',
      try: 'Đổi sang “16 bit”: một từ nhớ chiếm hai ô liền nhau, nhưng mỗi ô vẫn có địa chỉ riêng.',
      check: { q: 'Bộ nhớ có 4 đường địa chỉ thì có bao nhiêu ô nhớ?', opts: ['4', '8', '16', '32'], ans: 2, why: '4 bit địa chỉ tạo ra 2⁴ = 16 tổ hợp, mỗi tổ hợp chỉ tới một ô.' },
      terms: [['Bit', 'bit', 'Một chữ số nhị phân 0 hoặc 1. Trên hình là một ô vuông nhỏ.'], ['Byte', 'byte', '8 bit. Ở đây mỗi ô nhớ là một byte.'], ['Ô nhớ', 'memory cell / location', 'Đơn vị có địa chỉ riêng. Mỗi hàng trên hình.'], ['Từ nhớ', 'word', 'Lượng dữ liệu xử lý một lần: 8, 16, 32… bit. Dấu ngoặc bên phải hình.'], ['Bus địa chỉ', 'address bus', 'Đường dây chở địa chỉ. Nét liền xanh lam.'], ['Bus dữ liệu', 'data bus', 'Đường dây chở dữ liệu. Nét gạch xanh lục.'], ['Bus điều khiển', 'control bus', 'Tín hiệu đọc/ghi, chọn chip. Nét chấm màu hổ phách.']]
    },
    'sec-b': {
      title: 'SRAM tổ chức một chiều', en: 'One-dimensional (linear) organization',
      what: 'Chip có n đường địa chỉ A<sub>n−1</sub>…A<sub>0</sub> và m đường dữ liệu D<sub>m−1</sub>…D<sub>0</sub>. Ma trận nhớ có 2<sup>n</sup> từ, mỗi từ m bit.',
      why: 'Mỗi từ nhớ cần được chọn riêng. Bộ giải mã biến n bit địa chỉ thành đúng một đường chọn trong 2<sup>n</sup> đường.',
      how: '<p class="formula">Dung lượng = 2<sup>n</sup> × m bit</p><p>m bit của một từ được truyền đồng thời qua m đường dữ liệu.</p>',
      see: 'Chạy từng bước: địa chỉ vào bộ giải mã, một hàng sáng lên, dữ liệu đi qua bộ đệm.',
      try: 'Tăng n lên 16: số từ tăng gấp 16 lần, nhưng chip cần thêm 4 chân địa chỉ. Đó là nhược điểm slide 25 nêu.',
      check: { q: 'Chip 4K × 8 có bao nhiêu đường địa chỉ?', opts: ['8', '12', '32', '4096'], ans: 1, why: '4K = 4096 = 2¹², nên cần 12 đường địa chỉ. Số 8 là số đường dữ liệu.' },
      terms: [['Bộ giải mã địa chỉ', 'address decoder', 'Chọn 1 trong 2ⁿ từ nhớ. Hộp bên trái.'], ['Ma trận nhớ', 'memory array', 'Nơi chứa các từ nhớ. Hộp giữa.'], ['Bộ đệm dữ liệu', 'data buffer', 'Nối từ nhớ được chọn với bus dữ liệu. Hộp bên phải.'], ['SRAM', 'Static RAM', 'RAM tĩnh, lưu bit bằng flip-flop.']]
    },
    'sec-c': {
      title: 'DRAM tổ chức hai chiều', en: 'Two-dimensional (row/column) organization',
      what: 'Các từ nhớ xếp thành ma trận hàng × cột. Giao điểm của một hàng và một cột là một từ nhớ.',
      why: 'Thay vì một bộ giải mã 2<sup>14</sup> đường, ta dùng hai bộ giải mã nhỏ 2<sup>7</sup> đường cho hàng và cột. Đây là bước chuẩn bị cho dồn kênh ở phần D.',
      how: '<p class="formula">n = n1 + n2</p><ul><li>Bước 1: n1 bit chọn 1 hàng.</li><li>Bước 2: n2 bit chọn 1 cột.</li></ul><p class="formula">Dung lượng = 2<sup>n1</sup> × (2<sup>n2</sup> × m) bit</p>',
      see: 'Hàng chọn có nền xanh lam đậm, cột chọn có nền nhạt. Giao điểm có vòng đánh dấu.',
      try: 'Bấm vào ma trận rồi đổi n1, n2 để thấy công thức thay đổi theo.',
      check: { q: 'Ma trận 128 × 128 cần bao nhiêu bit địa chỉ logic?', opts: ['7', '14', '128', '256'], ans: 1, why: '128 = 2⁷ hàng và 2⁷ cột, tổng cộng 7 + 7 = 14 bit.' },
      terms: [['Bộ giải mã hàng', 'row decoder', 'Chọn 1 hàng. Hộp dọc bên trái ma trận.'], ['Bộ giải mã cột', 'column decoder', 'Chọn 1 cột. Hộp ngang phía trên.'], ['DRAM', 'Dynamic RAM', 'RAM động, lưu bit trên tụ điện, cần làm tươi.']],
      extra: '<p class="note"><b>Ghi chú nguồn.</b> Hình slide 26 đưa A<sub>6</sub>…A<sub>0</sub> vào bộ giải mã hàng và A<sub>13</sub>…A<sub>7</sub> vào bộ giải mã cột. Mô phỏng theo đúng cách nối này. Slide 26 ghi “có 2ⁿ từ nhớ”, với n = 14 tức là 2¹⁴ = 16384 từ.</p>'
    },
    'sec-d': {
      title: 'Dồn kênh địa chỉ RAS/CAS', en: 'Address multiplexing, Row/Column Address Strobe',
      what: 'Dùng cùng n đường địa chỉ hai lần: pha 1 chở địa chỉ hàng, pha 2 chở địa chỉ cột.',
      why: 'Chip có dung lượng lớn cần nhiều bit địa chỉ, tức nhiều chân. Dồn kênh giảm số chân địa chỉ đi một nửa.',
      how: '<ul><li>Pha 1: RAS báo “đây là địa chỉ hàng”, chốt hàng giữ lại.</li><li>Pha 2: CAS báo “đây là địa chỉ cột”, chốt cột giữ lại.</li></ul><p class="formula">r chân × 2 pha = 2r bit → 2<sup>2r</sup> từ</p>',
      see: 'Theo dõi giá trị trên bus 7 đường thay đổi giữa hai pha, và giản đồ thời gian phía dưới.',
      try: 'Đổi hàng và cột rồi chạy lại. Chú ý chốt hàng vẫn giữ giá trị khi bus đã chuyển sang địa chỉ cột.',
      check: { q: 'Vì sao cần chốt địa chỉ hàng?', opts: ['Để tăng tốc độ', 'Vì ở pha 2 bus đã mang địa chỉ cột, hàng phải được giữ lại', 'Để làm tươi DRAM', 'Để chọn chip'], ans: 1, why: 'Cùng 7 chân được dùng lại ở pha 2. Nếu không chốt, địa chỉ hàng sẽ mất.' },
      terms: [['RAS', 'Row Address Strobe', 'Tín hiệu chốt địa chỉ hàng.'], ['CAS', 'Column Address Strobe', 'Tín hiệu chốt địa chỉ cột.'], ['Chốt', 'latch', 'Mạch giữ lại giá trị đã nhận.'], ['Dồn kênh', 'multiplexing', 'Dùng chung đường dây cho nhiều thông tin theo thời gian.']],
      extra: '<p class="note"><b>Ghi chú nguồn.</b> Pha 2 trong slide 28 ghi “chốt n bit truyền lần 1”. Đúng ra phải là lần 2, đó là bit cột. Slide không nói RAS/CAS tích cực mức nào; giản đồ vẽ theo quy ước phổ biến là tích cực thấp.</p>'
    },
    'sec-e': {
      title: 'Chân tín hiệu của chip nhớ', en: 'Chip pinout: CS, OE, WE',
      what: 'Ngoài địa chỉ và dữ liệu, chip có ba chân điều khiển: CS chọn chip, OE cho phép đọc, WE cho phép ghi.',
      why: 'Nhiều chip cùng nối vào một bus. CS quyết định chip nào được phép làm việc, OE và WE quyết định làm gì.',
      how: '<ul><li>CS = 0: chip được kích hoạt.</li><li>OE = 0: được phép đọc.</li><li>WE = 0: được phép ghi.</li></ul><p>Dấu gạch trên tên và vòng tròn nhỏ ở chân nghĩa là tích cực mức thấp.</p>',
      see: 'Bảng bên dưới sáng hàng ứng với tổ hợp công tắc hiện tại.',
      try: 'Gạt CS = 1 rồi bấm Thực hiện: dữ liệu ra là Z (thả nổi), chip không trả lời dù OE = 0.',
      check: { q: 'CS = 0, OE = 1, WE = 0 nghĩa là gì?', opts: ['Đọc', 'Ghi', 'Chip không được chọn', 'Không hợp lệ'], ans: 1, why: 'Chip được chọn (CS = 0) và WE = 0 cho phép ghi.' },
      terms: [['CS', 'Chip Select', 'Chọn chip, tích cực thấp.'], ['OE', 'Output Enable', 'Cho phép xuất dữ liệu (đọc).'], ['WE', 'Write Enable', 'Cho phép ghi.'], ['Thả nổi', 'high impedance, Z', 'Chân không kéo bus lên hay xuống, nhường bus cho chip khác.']]
    },
    'sec-f': {
      title: 'Thiết kế module nhớ', en: 'Memory module design: more words or wider words',
      what: 'Ghép nhiều chip 2<sup>n</sup> × m thành module lớn hơn. Có hai hướng: tăng số lượng từ nhớ, hoặc tăng độ dài từ nhớ.',
      why: 'Một chip không đủ dung lượng hay độ rộng mà hệ thống cần.',
      how: '<p><b>Tăng số từ (slide 31):</b> cần 2<sup>k</sup> chip và n + k đường địa chỉ. k bit cao đi vào bộ giải mã để chọn đúng 1 chip qua CS.</p><p><b>Tăng độ dài từ:</b> các chip dùng chung địa chỉ, cùng được chọn, mỗi chip cấp một phần bit dữ liệu.</p>',
      see: 'Chip đang được chọn có viền đậm và nhãn CS = 0. Các chip khác mờ đi.',
      try: 'Bấm “Thử 0x0ABC” và “Thử 0x1ABC”: chỉ bit A12 khác nhau, và chính bit này đổi chip.',
      check: { q: 'Ghép 4K × 8 thành 8KB, chân nào chọn chip?', opts: ['A0', 'A11', 'A12', 'D7'], ans: 2, why: 'A11…A0 chọn ô bên trong chip (12 bit). Bit kế tiếp A12 đi vào bộ giải mã 1 → 2 để chọn chip.' },
      terms: [['Module nhớ', 'memory module', 'Nhiều chip ghép lại thành một khối nhớ.'], ['Bus dữ liệu chung', 'shared data bus', 'Các chip nối chung D7…D0; chỉ chip được chọn mới đưa dữ liệu lên bus.'], ['Địa chỉ bên trong chip', 'internal address', 'Phần địa chỉ A11…A0 mà từng chip nhận.']],
      extra: '<p class="note">Theo slide 31, tại một thời điểm chỉ truy xuất 1 ô nhớ thuộc 1 chip. Vì thế bộ giải mã phải chọn đúng một chip.</p>'
    },
    'sec-g': {
      title: 'Bộ giải mã', en: 'Decoder',
      what: 'Mạch có n ngõ vào và tối đa 2<sup>n</sup> ngõ ra. Mỗi tổ hợp ngõ vào kích hoạt đúng một ngõ ra.',
      why: 'Dùng để chọn một chip (qua CS) hoặc một hàng nhớ từ vài bit địa chỉ.',
      how: 'Ở các bộ giải mã trong slide, ngõ ra tích cực mức thấp: ngõ ra được chọn bằng 0, các ngõ còn lại bằng 1. Chân cho phép Ḡ phải bằng 0 thì mạch mới làm việc.',
      see: 'Ngõ ra được chọn có chấm tròn đậm và nhãn “chọn”. Hàng tương ứng trong bảng chân lý sáng lên.',
      try: 'Ở 74LS138, đặt G1 = 0: dù C, B, A là gì, mọi ngõ ra đều bằng 1.',
      check: { q: 'Bộ giải mã 2 → 4 với Ḡ = 0, B = 1, A = 0 chọn ngõ nào?', opts: ['Ȳ0', 'Ȳ1', 'Ȳ2', 'Ȳ3'], ans: 2, why: 'BA = 10₂ = 2, nên Ȳ2 = 0.' },
      terms: [['Ngõ vào cho phép', 'enable', 'Ḡ (hoặc G1, G2A, G2B ở 74LS138) bật/tắt cả bộ giải mã.'], ['Tích cực thấp', 'active-low', 'Trạng thái “có tác dụng” là mức 0.'], ['74LS138', '3-to-8 decoder IC', 'Vi mạch giải mã 3 → 8 trong slide 34.']],
      extra: '<p class="note"><b>Ghi chú nguồn.</b> Slide 33 ghi “Bộ giải mã 2 → 1” nhưng hình và bảng là cổng AND nối NOT, tức cổng NAND: Q = 0 chỉ khi A = B = 1. Tab “2 → 1 trong slide” giữ nguyên nội dung đó và ghi rõ là cổng NAND.</p>'
    },
    'sec-h': {
      title: 'Bài tập thiết kế', en: 'Design exercises',
      what: 'Đề gốc slide 31–32: dùng chip SRAM 4K × 8, thiết kế module 8KB.',
      why: 'Đây là dạng bài chính của phần tổ chức chip nhớ. Cách làm áp dụng cho mọi cặp chip/module là lũy thừa của 2.',
      how: '<ol style="padding-left:18px;margin:0"><li>Đọc thông số chip.</li><li>Số chip = dung lượng module ÷ dung lượng chip.</li><li>Số đường địa chỉ module = log₂(số từ).</li><li>Tách bit chung và bit chọn chip.</li><li>Chọn bộ giải mã.</li><li>Nối bus dữ liệu.</li></ol>',
      try: 'Ở tab Tự luyện, có thể gõ đáp án dạng 13, 2^13 hoặc 8K.',
      check: { q: 'Chip 2K × 8, module 16KB cần bộ giải mã nào?', opts: ['1 → 2', '2 → 4', '3 → 8', 'Không cần'], ans: 2, why: '16KB ÷ 2KB = 8 chip = 2³, cần 3 bit chọn chip, tức bộ giải mã 3 → 8.' }
    },
    'sec-i': {
      title: 'DRAM và kênh bộ nhớ', en: 'DRAM storage and memory channels',
      what: 'Một ô DRAM lưu bit bằng điện tích trên tụ điện: mô hình đơn giản coi có điện tích là 1, không có là 0.',
      why: 'Tụ điện rò điện tích nên dữ liệu cần được làm tươi định kỳ. DRAM cũng là bộ nhớ bay hơi: mất nguồn thì dữ liệu mất.',
      how: '<ul><li>Ghi bit sẽ nạp hoặc xả tụ.</li><li>Khi tụ rò, điện áp giảm; refresh nạp lại điện tích trước khi bit bị mất.</li><li>Mất nguồn làm điện áp về 0 và dữ liệu mất.</li><li>Trong mô hình băng thông, một kênh nạp một phần mỗi chu kỳ; hai kênh nạp hai phần đồng thời.</li></ul>',
      see: 'Chạy tụ rò và làm tươi ở hình trên. Ở hình dưới, theo dõi D1–D4 chạy vào các thanh RAM: hai thanh 8 GB hoàn tất sau 2 chu kỳ, thanh 16 GB sau 4 chu kỳ trong giả định này.',
      try: 'So sánh lúc kết thúc CK2: 2×8 GB đã nạp đủ D1–D4, còn 1×16 GB mới nạp D1–D2. Tiếp tục đến CK4 để thanh 16 GB hoàn tất.',
      check: { q: 'Vì sao DRAM cần làm tươi?', opts: ['Tụ điện bị rò điện tích', 'Để tăng số đường địa chỉ', 'Để tăng dung lượng', 'Vì bit 0 luôn cần điện'], ans: 0, why: 'Điện tích trên tụ suy giảm theo thời gian; làm tươi định kỳ giúp giữ dữ liệu khi còn nguồn.' },
      terms: [['DRAM', 'Dynamic RAM', 'RAM động, lưu bit bằng điện tích trên tụ.'], ['Làm tươi', 'refresh', 'Đọc và nạp lại dữ liệu định kỳ để bù điện tích bị rò.'], ['Kênh nhớ', 'memory channel', 'Đường truyền độc lập giữa bộ điều khiển nhớ và RAM.'], ['Dual-channel', 'hai kênh', 'Cấu hình có thể truyền dữ liệu song song nếu nền tảng hỗ trợ.']],
      extra: '<p class="note">Hai thanh RAM không tự động nhanh hơn trong mọi máy. Lợi thế băng thông cần CPU/bo mạch hỗ trợ dual-channel và lắp thanh vào đúng khe ghép kênh.</p>'
    }
  };

  /* =======================================================================
     A. Ô nhớ, địa chỉ, từ nhớ (slide 23–24)
     ======================================================================= */
  const A = { mem: Array.from({ length: 16 }, (_, i) => L.seedValue(i * 7 + 3, 8)), sel: 5, word: 1, reg: null, phase: 0, op: null };
  function drawA() {
    const rowH = 22, top = 40, x0 = 300, bitW = 26;
    const p = A.phase, op = A.op;
    let s = `<svg viewBox="0 0 620 420" role="img" aria-label="CPU nối với 16 ô nhớ qua ba bus">`;
    // CPU
    s += `<rect class="box" x="18" y="140" width="116" height="130"/><text class="lbl-big" x="76" y="166" text-anchor="middle">CPU</text>`;
    s += `<text class="lbl-sm" x="76" y="196" text-anchor="middle">Thanh ghi</text>`;
    s += `<rect class="box box--soft" x="32" y="204" width="88" height="30"/><text class="lbl-mono" x="76" y="224" text-anchor="middle">${A.reg === null ? '— —' : hex(A.reg, 2)}</text>`;
    s += `<text class="lbl-sm" x="76" y="258" text-anchor="middle">${A.reg === null ? '' : bin(A.reg, 8)}</text>`;
    // Buses
    const ys = { a: 172, d: 210, c: 248 };
    s += wire('w-addr', `M134 ${ys.a} H292`, p >= 1) + arrowHead(296, ys.a, 'r', 'dot');
    s += `<text class="lbl-sm lbl-addr" x="146" y="${ys.a - 7}">Bus địa chỉ A3–A0</text><text class="lbl-mono lbl-addr" x="292" y="${ys.a + 16}" text-anchor="end">${p >= 1 ? bin(A.sel, 4) : ''}</text>`;
    s += wire('w-data', `M138 ${ys.d} H292`, p >= 3);
    if (p >= 3) s += op === 'read' ? arrowHead(138, ys.d, 'l', 'dot') : arrowHead(296, ys.d, 'r', 'dot');
    s += `<text class="lbl-sm lbl-data" x="146" y="${ys.d - 7}">Bus dữ liệu D7–D0</text><text class="lbl-mono lbl-data" x="292" y="${ys.d + 16}" text-anchor="end">${p >= 3 ? bin(op === 'read' ? A.mem[A.sel] : A.pending, 8) : ''}</text>`;
    s += wire('w-ctrl', `M134 ${ys.c} H292`, p >= 2) + arrowHead(296, ys.c, 'r', 'dot');
    s += `<text class="lbl-sm lbl-ctrl" x="146" y="${ys.c - 7}">Điều khiển</text><text class="lbl-mono lbl-ctrl" x="292" y="${ys.c + 16}" text-anchor="end">${p >= 2 ? (op === 'read' ? 'ĐỌC' : 'GHI') : ''}</text>`;
    // Memory grid
    s += `<text class="lbl-sm" x="${x0 + 4}" y="${top - 12}">Địa chỉ</text>`;
    for (let b = 7; b >= 0; b--) s += `<text class="lbl-sm" x="${x0 + 76 + (7 - b) * bitW + bitW / 2}" y="${top - 12}" text-anchor="middle">b${b}</text>`;
    const ws = A.sel - (A.sel % A.word);
    for (let i = 0; i < 16; i++) {
      const y = top + i * rowH, on = i === A.sel;
      const inWord = i >= ws && i < ws + A.word;
      s += `<g class="clickable" data-row="${i}" tabindex="0" role="button" aria-label="Ô nhớ địa chỉ ${hex(i)}, giá trị ${hex(A.mem[i], 2)}">`;
      s += `<rect class="box ${on ? 'box--on' : inWord ? 'box--addr' : ''}" x="${x0}" y="${y}" width="70" height="${rowH}"/>`;
      s += `<text class="lbl-mono ${on ? 'lbl-on' : ''}" x="${x0 + 8}" y="${y + 15}">${hex(i)}</text><text class="lbl-sm ${on ? 'lbl-on' : ''}" x="${x0 + 64}" y="${y + 15}" text-anchor="end" style="font-family:var(--f-mono);font-size:11px">${bin(i, 4)}</text>`;
      for (let b = 7; b >= 0; b--) {
        const bit = (A.mem[i] >> b) & 1, bx = x0 + 76 + (7 - b) * bitW;
        s += `<rect class="box ${on ? 'box--on' : ''}" x="${bx}" y="${y}" width="${bitW}" height="${rowH}" ${on ? `data-bit="${b}"` : ''}/>`;
        s += `<text class="lbl-mono ${on ? 'lbl-on' : ''}" x="${bx + bitW / 2}" y="${y + 15}" text-anchor="middle" ${on ? `data-bit="${b}"` : ''} style="pointer-events:none">${bit}</text>`;
      }
      s += `</g>`;
    }
    // Word bracket
    const by = top + ws * rowH, bh = A.word * rowH, bx = x0 + 76 + 8 * bitW + 8;
    s += `<path class="w w-ink" d="M${bx} ${by + 2} h7 v${bh - 4} h-7"/>`;
    s += `<text class="lbl" x="${bx + 12}" y="${by + bh / 2 - 2}">Từ</text><text class="lbl-sm" x="${bx + 12}" y="${by + bh / 2 + 12}">${A.word * 8} bit</text>`;
    s += `</svg>`;
    $('#a-fig').innerHTML = s;
    // readout
    const words = [];
    for (let i = ws; i < ws + A.word; i++) words.push(hex(i));
    $('#a-out').innerHTML = `<dt>Địa chỉ</dt><dd>${hex(A.sel)} = ${bin(A.sel, 4)}₂ = ${A.sel}</dd>
      <dt>Nội dung ô</dt><dd>${hex(A.mem[A.sel], 2)} = ${bin(A.mem[A.sel], 8)}₂ = ${A.mem[A.sel]}</dd>
      <dt>Từ nhớ ${A.word * 8} bit</dt><dd>${A.word === 1 ? 'chính là ô này' : 'gồm các ô ' + words.join(', ')}</dd>`;
  }
  function initA() {
    L.seg($('#a-word'), [{ value: 1, label: '8 bit' }, { value: 2, label: '16 bit' }, { value: 4, label: '32 bit' }], 1, (v) => { A.word = Number(v); drawA(); });
    const fig = $('#a-fig');
    fig.addEventListener('click', (e) => {
      const bitEl = e.target.closest('[data-bit]');
      if (bitEl) { A.mem[A.sel] ^= 1 << Number(bitEl.dataset.bit); drawA(); return; }
      const g = e.target.closest('[data-row]');
      if (g) { A.sel = Number(g.dataset.row); $('#a-addr').value = hex(A.sel); A.phase = 0; drawA(); }
    });
    fig.addEventListener('keydown', (e) => {
      const g = e.target.closest('[data-row]');
      if (!g) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); A.sel = Number(g.dataset.row); $('#a-addr').value = hex(A.sel); drawA(); $(`[data-row="${A.sel}"]`, fig).focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); A.sel = (A.sel + (e.key === 'ArrowDown' ? 1 : 15)) % 16; $('#a-addr').value = hex(A.sel); drawA(); $(`[data-row="${A.sel}"]`, fig).focus(); }
    });
    $('#a-addr').addEventListener('input', () => { const r = readAddr($('#a-addr'), 4); if (!r.error) { A.sel = r.value; A.phase = 0; drawA(); } });
    let timers = [];
    function run(op) {
      const r = readAddr($('#a-addr'), 4);
      if (r.error) return status($('#a-status'), 'err', r.error);
      A.sel = r.value;
      if (op === 'write') {
        const d = C.parseAddress($('#a-data').value, 8);
        $('#a-data').setAttribute('aria-invalid', d.error ? 'true' : 'false');
        if (d.error) return status($('#a-status'), 'err', 'Dữ liệu ghi phải từ 0x00 đến 0xFF (8 bit).');
        A.pending = d.value;
      }
      A.op = op; timers.forEach(clearTimeout); timers = [];
      const msgs = op === 'read'
        ? ['1. CPU đặt địa chỉ lên bus địa chỉ.', '2. CPU gửi lệnh ĐỌC trên bus điều khiển.', '3. Ô nhớ đưa 8 bit lên bus dữ liệu, CPU nhận vào thanh ghi.']
        : ['1. CPU đặt địa chỉ lên bus địa chỉ.', '2. CPU gửi lệnh GHI trên bus điều khiển.', '3. CPU đặt dữ liệu lên bus dữ liệu, ô nhớ lưu lại 8 bit mới.'];
      const stepTo = (k) => {
        A.phase = k;
        if (k === 3) { if (op === 'read') A.reg = A.mem[A.sel]; else A.mem[A.sel] = A.pending; }
        drawA();
        status($('#a-status'), k === 3 ? 'ok' : 'addr', msgs.slice(0, k).join('<br>'));
      };
      if (L.reduced) { stepTo(3); return; }
      [1, 2, 3].forEach((k, i) => timers.push(setTimeout(() => stepTo(k), i * 650)));
    }
    $('#a-read').addEventListener('click', () => run('read'));
    $('#a-write').addEventListener('click', () => run('write'));
    drawA();
  }

  /* =======================================================================
     B. SRAM một chiều (slide 25)
     ======================================================================= */
  const B = { n: 12, m: 8, addr: 0x2A5, mode: 'read', val: 0xA7, over: new Map(), step: -1, page: 0 };
  const bGet = (a) => (B.over.has(a) ? B.over.get(a) : L.seedValue(a, B.m));
  function drawB() {
    const n = B.n, m = B.m, k = B.addr, st = B.step, words = 2 ** n;
    const read = B.mode === 'read';
    let s = `<svg viewBox="0 0 600 410" role="img" aria-label="Sơ đồ chip SRAM tổ chức một chiều">`;
    // address pins
    const pinNames = n <= 4 ? Array.from({ length: n }, (_, i) => i) : [0, 1, 2, null, n - 1];
    const py = (i) => 70 + i * 44;
    pinNames.forEach((b, i) => {
      if (b === null) { s += `<text class="lbl" x="62" y="${py(i) + 4}" text-anchor="middle">⋮</text>`; return; }
      s += wire('w-addr', `M18 ${py(i)} H108`, st >= 0) + arrowHead(110, py(i), 'r', 'dot');
      s += `<text class="lbl-mono lbl-addr" x="20" y="${py(i) - 6}">A${b}</text><text class="lbl-mono" x="96" y="${py(i) - 6}" text-anchor="end">${st >= 0 ? (k >> b) & 1 : ''}</text>`;
    });
    s += `<text class="lbl-sm" x="18" y="40">từ CPU</text>`;
    // decoder
    s += `<rect class="box ${st === 1 ? 'box--addr' : ''}" x="110" y="40" width="62" height="290"/>`;
    s += `<text class="lbl" x="141" y="170" text-anchor="middle">Bộ</text><text class="lbl" x="141" y="186" text-anchor="middle">giải mã</text><text class="lbl" x="141" y="202" text-anchor="middle">địa chỉ</text>`;
    s += `<text class="lbl-sm" x="141" y="222" text-anchor="middle">${n} → ${C.formatCount(words)}</text>`;
    // array rows window
    let rows = [];
    if (words <= 9) rows = Array.from({ length: words }, (_, i) => i);
    else {
      const set = new Set([0, 1, words - 1, Math.max(0, k - 1), k, Math.min(words - 1, k + 1)]);
      const sorted = [...set].sort((a, b) => a - b);
      sorted.forEach((v, i) => { if (i && v - sorted[i - 1] > 1) rows.push(null); rows.push(v); });
    }
    const rh = Math.min(30, 270 / rows.length), ry = (i) => 50 + i * rh;
    s += `<rect class="box box--soft" x="210" y="40" width="190" height="290"/>`;
    s += `<text class="lbl-sm" x="305" y="34" text-anchor="middle">Ma trận nhớ 2<tspan baseline-shift="super" font-size="9">${n}</tspan> × ${m} bit = ${C.formatCount(words)} × ${m} bit</text>`;
    rows.forEach((r, i) => {
      const y = ry(i);
      if (r === null) { s += `<text class="lbl" x="305" y="${y + rh / 2 + 4}" text-anchor="middle">⋮</text>`; return; }
      const on = r === k && st >= 2;
      s += `<rect class="box ${on ? 'box--on' : ''}" x="222" y="${y + 2}" width="166" height="${rh - 4}"/>`;
      s += `<text class="lbl-sm ${on ? 'lbl-on' : ''}" x="230" y="${y + rh / 2 + 4}">Từ nhớ ${r}</text>`;
      s += `<text class="lbl-mono ${on ? 'lbl-on' : ''}" x="382" y="${y + rh / 2 + 4}" text-anchor="end">${hex(bGet(r), Math.ceil(m / 4))}</text>`;
      s += wire('w-addr', `M172 ${y + rh / 2} H220`, r === k && st >= 1, !(r === k && st >= 1));
    });
    // buffer and data path
    const sel = rows.indexOf(k), sy = ry(sel) + rh / 2;
    s += `<rect class="box ${st >= 3 ? 'box--data' : ''}" x="432" y="40" width="58" height="290"/>`;
    s += `<text class="lbl" x="461" y="170" text-anchor="middle">Bộ</text><text class="lbl" x="461" y="186" text-anchor="middle">đệm</text><text class="lbl" x="461" y="202" text-anchor="middle">dữ liệu</text>`;
    s += wire('w-data', `M390 ${sy} H430`, st >= 3, st < 3);
    const dNames = m <= 4 ? Array.from({ length: m }, (_, i) => i) : [0, 1, null, m - 1];
    const dval = read ? bGet(k) : B.val;
    dNames.forEach((b, i) => {
      const y = 70 + i * 50;
      if (b === null) { s += `<text class="lbl" x="540" y="${y + 4}" text-anchor="middle">⋮</text>`; return; }
      const live = read ? st >= 4 : st >= 3;
      s += wire('w-data', `M490 ${y} H586`, live) + (read ? arrowHead(590, y, 'r', 'dot') : arrowHead(492, y, 'l', 'dot'));
      s += `<text class="lbl-mono lbl-data" x="582" y="${y - 6}" text-anchor="end">D${b}</text><text class="lbl-mono" x="500" y="${y - 6}">${live ? (dval >> b) & 1 : ''}</text>`;
    });
    s += `<text class="lbl-sm" x="586" y="40" text-anchor="end">${read ? 'đến CPU' : 'từ CPU'}</text>`;
    // control
    s += `<rect class="box ${st >= 3 ? 'box--ctrl' : ''}" x="110" y="348" width="380" height="30"/><text class="lbl" x="300" y="368" text-anchor="middle">Điều khiển đọc/ghi</text>`;
    const cs = st >= 3 ? 0 : 1, oe = st >= 3 && read ? 0 : 1, we = st >= 3 && !read ? 0 : 1;
    [['CS', cs, 180], ['WE', we, 300], ['OE', oe, 420]].forEach(([nm, v, x]) => {
      s += wire('w-ctrl', `M${x} 406 V382`, v === 0) + arrowHead(x, 380, 'u', 'dot');
      s += `<text class="lbl-mono lbl-ctrl" x="${x + 8}" y="402">${nm} = ${v}</text>`;
    });
    s += `</svg>`;
    $('#b-fig').innerHTML = s;
  }
  function kvB() {
    const c = C.chip(2 ** B.n, B.m);
    $('#b-kv').innerHTML = `<div><span>Đường địa chỉ n</span><b>${c.addrLines}</b></div>
      <div><span>Số từ nhớ 2<sup>n</sup></span><b>${c.words.toLocaleString('vi-VN')}</b></div>
      <div><span>Đường dữ liệu m</span><b>${c.dataLines}</b></div>
      <div><span>Dung lượng 2<sup>n</sup> × m</span><b>${c.bits.toLocaleString('vi-VN')} bit = ${C.formatBits(c.bits)}</b></div>`;
    $('#b-tb').textContent = c.label;
    $('#b-tb2').textContent = C.formatBits(c.bits);
  }
  function tableB() {
    const per = 16, words = 2 ** B.n, pages = Math.ceil(words / per);
    B.page = Math.min(B.page, pages - 1);
    const hd = Math.ceil(B.n / 4) || 1, dd = Math.ceil(B.m / 4);
    let t = `<table class="tbl"><thead><tr><th>Địa chỉ (hex)</th><th>Địa chỉ (nhị phân)</th><th>Dữ liệu (hex, sửa được)</th><th>Dữ liệu (nhị phân)</th><th>Thập phân</th></tr></thead><tbody>`;
    for (let a = B.page * per; a < Math.min(words, (B.page + 1) * per); a++) {
      const v = bGet(a);
      t += `<tr class="${a === B.addr ? 'on' : ''}"><td class="mono">${hex(a, hd)}</td><td class="mono">${bin(a, B.n)}</td>
        <td><input data-a="${a}" value="${hex(v, dd)}" aria-label="Dữ liệu tại ${hex(a, hd)}"></td><td class="mono">${bin(v, B.m)}</td><td class="mono">${v}</td></tr>`;
    }
    t += `</tbody></table><div class="pager"><button type="button" class="btn" data-p="-1">Trang trước</button><span>Trang ${B.page + 1}/${pages}</span><button type="button" class="btn" data-p="1">Trang sau</button></div>`;
    $('#b-table').innerHTML = t;
  }
  function initB() {
    $('#b-n').innerHTML = Array.from({ length: 15 }, (_, i) => i + 2).map((v) => `<option ${v === 12 ? 'selected' : ''}>${v}</option>`).join('');
    const mode = L.seg($('#b-mode'), [{ value: 'read', label: 'Đọc' }, { value: 'write', label: 'Ghi' }], 'read', (v) => { B.mode = v; rebuild(); });
    const player = new L.StepPlayer($('#b-player'), { steps: [], onStep: (i) => {
      B.step = i;
      if (i === 4 && B.mode === 'write') { B.over.set(B.addr, B.val); tableB(); }
      drawB();
    } });
    function steps() {
      const a = hex(B.addr, Math.ceil(B.n / 4)), words = C.formatCount(2 ** B.n);
      const common = [
        { label: `CPU đặt địa chỉ ${a} lên ${B.n} đường A${B.n - 1}…A0` },
        { label: `Bộ giải mã nhận ${B.n} bit, bật đúng 1 trong ${words} đường chọn` },
        { label: `Từ nhớ số ${B.addr} được chọn` }
      ];
      if (B.mode === 'read') return common.concat([{ label: 'CS = 0, OE = 0: nội dung từ nhớ đi qua bộ đệm' }, { label: `CPU nhận ${B.m} bit = ${hex(bGet(B.addr), Math.ceil(B.m / 4))} trên D${B.m - 1}…D0` }]);
      return common.concat([{ label: `CS = 0, WE = 0: CPU đặt ${hex(B.val, Math.ceil(B.m / 4))} lên bus dữ liệu` }, { label: `Bộ đệm ghi ${B.m} bit vào từ nhớ số ${B.addr}` }]);
    }
    function rebuild() {
      const r = readAddr($('#b-addr'), B.n);
      if (!r.error) B.addr = r.value;
      const d = C.parseAddress($('#b-data').value, B.m);
      $('#b-data').setAttribute('aria-invalid', d.error ? 'true' : 'false');
      if (!d.error) B.val = d.value;
      $('#b-data').disabled = B.mode === 'read';
      B.page = Math.floor(B.addr / 16);
      kvB(); player.setSteps(steps()); tableB(); drawB();
    }
    $('#b-n').addEventListener('change', () => {
      B.n = Number($('#b-n').value); B.over.clear();
      if (B.addr >= 2 ** B.n) { B.addr = 2 ** B.n - 1; $('#b-addr').value = hex(B.addr); }
      rebuild();
    });
    $('#b-m').addEventListener('change', () => { B.m = Number($('#b-m').value); B.over.clear(); rebuild(); });
    $('#b-addr').addEventListener('change', rebuild);
    $('#b-data').addEventListener('change', rebuild);
    $('#b-table').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const pages = Math.ceil(2 ** B.n / 16);
      B.page = (B.page + Number(b.dataset.p) + pages) % pages; tableB();
    });
    $('#b-table').addEventListener('change', (e) => {
      const inp = e.target.closest('input[data-a]'); if (!inp) return;
      const r = C.parseAddress(inp.value, B.m);
      if (r.error) { inp.setAttribute('aria-invalid', 'true'); return; }
      B.over.set(Number(inp.dataset.a), r.value); tableB(); drawB();
    });
    $('#b-go').addEventListener('click', () => {
      const r = readAddr($('#b-find'), B.n);
      if (r.error) return;
      B.page = Math.floor(r.value / 16); tableB();
    });
    mode.set('read');
    rebuild();
  }

  /* =======================================================================
     C. DRAM hai chiều (slide 26–27)
     ======================================================================= */
  const Cs = { n1: 7, n2: 7, m: 8, row: 37, col: 90, step: 5 };
  function cDims() {
    const rows = 2 ** Cs.n1, cols = 2 ** Cs.n2;
    const cell = Math.max(2, Math.floor(400 / Math.max(rows, cols)));
    return { rows, cols, cell, w: cols * cell, h: rows * cell };
  }
  function drawC() {
    const { rows, cols, cell, w, h } = cDims();
    const st = Cs.step, dec = 74;
    const fig = $('#c-fig');
    if (!fig.dataset.built || fig.dataset.built !== `${rows}x${cols}`) {
      fig.innerHTML = `<div style="display:grid;grid-template-columns:${dec}px ${w}px;grid-template-rows:${dec}px ${h}px;gap:0">
        <div></div><svg id="c-coldec" viewBox="0 0 ${w} ${dec}" width="${w}" height="${dec}" aria-hidden="true"></svg>
        <svg id="c-rowdec" viewBox="0 0 ${dec} ${h}" width="${dec}" height="${h}" aria-hidden="true"></svg>
        <canvas class="matrix" id="c-canvas" width="${w}" height="${h}" style="width:${w}px;height:${h}px" aria-label="Ma trận ${rows} hàng × ${cols} cột. Bấm để chọn ô."></canvas></div>`;
      fig.dataset.built = `${rows}x${cols}`;
      $('#c-canvas').addEventListener('click', (e) => {
        const r = e.target.getBoundingClientRect();
        const cc = cDims();
        Cs.col = Math.min(cc.cols - 1, Math.floor((e.clientX - r.left) / (r.width / cc.cols)));
        Cs.row = Math.min(cc.rows - 1, Math.floor((e.clientY - r.top) / (r.height / cc.rows)));
        syncC(true);
      });
    }
    const cv = $('#c-canvas'), g = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    if (st >= 2) { g.fillStyle = '#9FC4D8'; g.fillRect(0, Cs.row * cell, w, cell); }
    if (st >= 4) { g.fillStyle = '#C3DAE6'; g.fillRect(Cs.col * cell, 0, cell, h); g.strokeStyle = '#39789A'; g.lineWidth = 1; g.strokeRect(Cs.col * cell + 0.5, 0.5, cell - 1, h - 1); }
    // lưới: mỗi ô nếu đủ lớn, nếu không thì mỗi 8 ô
    const step = cell >= 8 ? 1 : 8;
    g.strokeStyle = 'rgba(25,49,62,0.14)'; g.lineWidth = 1;
    g.beginPath();
    for (let x = step; x < cols; x += step) { g.moveTo(x * cell + 0.5, 0); g.lineTo(x * cell + 0.5, h); }
    for (let y = step; y < rows; y += step) { g.moveTo(0, y * cell + 0.5); g.lineTo(w, y * cell + 0.5); }
    g.stroke();
    if (st >= 5) {
      const cx = Cs.col * cell, cy = Cs.row * cell;
      g.fillStyle = css.getPropertyValue('--ink').trim() || '#19313E';
      g.fillRect(cx, cy, cell, cell);
      g.strokeStyle = css.getPropertyValue('--ctrl').trim() || '#C58B2C'; g.lineWidth = 2.5;
      const pad = Math.max(5, cell * 0.6);
      g.strokeRect(cx - pad, cy - pad, cell + pad * 2, cell + pad * 2);
    }
    // bộ giải mã hàng
    const ry = Cs.row * cell + cell / 2, cx = Cs.col * cell + cell / 2;
    let rs = `<rect class="box ${st === 1 ? 'box--addr' : ''}" x="4" y="2" width="38" height="${h - 4}"/>`;
    rs += `<text class="lbl" transform="translate(28 ${h / 2}) rotate(-90)" text-anchor="middle">Giải mã hàng 1/${rows}</text>`;
    rs += wire('w-addr', `M42 ${ry} H${dec - 2}`, st >= 2, st < 1) + (st >= 1 ? arrowHead(dec - 1, ry, 'r', 'dot') : '');
    $('#c-rowdec').innerHTML = rs;
    let cs = `<rect class="box ${st === 3 ? 'box--addr' : ''}" x="2" y="4" width="${w - 4}" height="34"/>`;
    cs += `<text class="lbl" x="${w / 2}" y="26" text-anchor="middle">Bộ giải mã cột 1 trong ${cols}</text>`;
    cs += wire('w-addr', `M${cx} 38 V${dec - 2}`, st >= 4, st < 3) + (st >= 3 ? arrowHead(cx, dec - 1, 'd', 'dot') : '');
    $('#c-coldec').innerHTML = cs;
    // các bit địa chỉ
    const addr = C.dramAddress(Cs.row, Cs.col, Cs.n1);
    const colBits = bin(Cs.col, Cs.n2), rowBits = bin(Cs.row, Cs.n1);
    const cellBox = (b, cls) => `<span style="display:inline-block;width:1.2em;text-align:center;border:1px solid var(--rule);background:${cls}">${b}</span>`;
    $('#c-bits').innerHTML = `<div class="zone"><h3>Địa chỉ ${Cs.n1 + Cs.n2} bit</h3>
      <div class="mono" style="font-size:15px;line-height:1.9">${[...colBits].map((b) => cellBox(b, '#C3DAE6')).join('')}${[...rowBits].map((b) => cellBox(b, '#9FC4D8')).join('')}</div>
      <dl class="readout" style="margin-top:6px"><dt>Cột A${Cs.n1 + Cs.n2 - 1}…A${Cs.n1}</dt><dd>${colBits} = ${Cs.col}</dd><dt>Hàng A${Cs.n1 - 1}…A0</dt><dd>${rowBits} = ${Cs.row}</dd><dt>Địa chỉ logic</dt><dd>${hex(addr, Math.ceil((Cs.n1 + Cs.n2) / 4))} = ${addr}</dd></dl></div>`;
  }
  function generalC() {
    const d = C.dram2D(Cs.n1, Cs.n2, Cs.m);
    $('#c-general').innerHTML = `<div class="calc">n = n1 + n2 = ${d.n1} + ${d.n2} = <span class="res">${d.n}</span> bit địa chỉ<br>
      Số hàng = 2<sup>${d.n1}</sup> = <span class="res">${d.rows}</span>, số từ mỗi hàng = 2<sup>${d.n2}</sup> = <span class="res">${d.cols}</span><br>
      Dung lượng = 2<sup>${d.n1}</sup> × (2<sup>${d.n2}</sup> × ${d.m}) = 2<sup>${d.n}</sup> × ${d.m} = <span class="res">${d.bits.toLocaleString('vi-VN')} bit = ${C.formatBits(d.bits)}</span></div>`;
    $('#c-tb').textContent = `${d.rows} × ${d.cols}`;
    $('#c-tb2').textContent = `${d.n} bit`;
  }
  let cPlayer;
  function syncC(fromClick) {
    const { rows, cols } = cDims();
    Cs.row = Math.min(Cs.row, rows - 1); Cs.col = Math.min(Cs.col, cols - 1);
    $('#c-row').value = Cs.row; $('#c-col').value = Cs.col;
    $('#c-addr').value = hex(C.dramAddress(Cs.row, Cs.col, Cs.n1), Math.ceil((Cs.n1 + Cs.n2) / 4));
    ['#c-row', '#c-col', '#c-addr'].forEach((q) => $(q).setAttribute('aria-invalid', 'false'));
    cPlayer.setSteps(cSteps());
    cPlayer.go(fromClick ? 5 : -1);
    generalC();
  }
  function cSteps() {
    const n = Cs.n1 + Cs.n2;
    return [
      { label: `Đưa địa chỉ ${n} bit vào chip` },
      { label: `Bộ giải mã hàng nhận A${Cs.n1 - 1}…A0 = ${Cs.row}` },
      { label: `Hàng ${Cs.row} được chọn` },
      { label: `Bộ giải mã cột nhận A${n - 1}…A${Cs.n1} = ${Cs.col}` },
      { label: `Cột ${Cs.col} được chọn` },
      { label: `Giao điểm (hàng ${Cs.row}, cột ${Cs.col}) là từ nhớ cần truy cập` }
    ];
  }
  function initC() {
    const opts = [2, 3, 4, 5, 6, 7].map((v) => `<option ${v === 7 ? 'selected' : ''}>${v}</option>`).join('');
    $('#c-n1').innerHTML = opts; $('#c-n2').innerHTML = opts;
    cPlayer = new L.StepPlayer($('#c-player'), { steps: cSteps(), onStep: (i) => { Cs.step = i; drawC(); } });
    ['#c-n1', '#c-n2', '#c-m'].forEach((q) => $(q).addEventListener('change', () => {
      Cs.n1 = Number($('#c-n1').value); Cs.n2 = Number($('#c-n2').value); Cs.m = Number($('#c-m').value);
      $('#c-fig').dataset.built = ''; syncC(true);
    }));
    $('#c-row').addEventListener('change', () => { const v = readInt($('#c-row'), 0, 2 ** Cs.n1 - 1); if (v !== null) { Cs.row = v; syncC(true); } });
    $('#c-col').addEventListener('change', () => { const v = readInt($('#c-col'), 0, 2 ** Cs.n2 - 1); if (v !== null) { Cs.col = v; syncC(true); } });
    $('#c-addr').addEventListener('change', () => {
      const r = readAddr($('#c-addr'), Cs.n1 + Cs.n2);
      if (r.error) return;
      const sp = C.dramSplit(r.value, Cs.n1); Cs.row = sp.row; Cs.col = sp.col; syncC(true);
    });
    syncC(true);
  }

  window.MemLab = { INFO, initA, initB, initC, readAddr, readInt, status, wire, arrowHead, bar, hex, bin };
})();

/* ===== Phần 2: D, E, F, G, H và khởi tạo ===== */
(function () {
  'use strict';
  const C = window.Calc, L = window.Lab, $ = L.$;
  const M = window.MemLab;
  const { readAddr, readInt, status, wire, arrowHead, bar, hex, bin } = M;
  const sup = (n) => `<tspan baseline-shift="super" font-size="9">${n}</tspan>`;

  /* =======================================================================
     D. Dồn kênh địa chỉ, RAS và CAS (slide 28)
     ======================================================================= */
  const D = { row: 45, col: 102, step: -1 };
  function drawD() {
    const st = D.step;
    const busVal = st < 0 ? '' : st <= 1 ? bin(D.row, 7) : bin(D.col, 7);
    const ras = st >= 1 ? 0 : 1, cas = st >= 3 ? 0 : 1;
    let s = `<svg viewBox="0 0 620 320" role="img" aria-label="Dồn kênh địa chỉ: một bus 7 đường, chốt hàng và chốt cột">`;
    s += `<rect class="box" x="10" y="120" width="104" height="90"/><text class="lbl" x="62" y="160" text-anchor="middle">Bộ điều khiển</text><text class="lbl-sm" x="62" y="178" text-anchor="middle">(phía CPU)</text>`;
    // bus 7 đường
    s += wire('w-addr', 'M114 165 H210', st >= 0) + `<path class="w w-ink" d="M156 158 l8 -14"/><text class="lbl-mono" x="168" y="150">7</text>`;
    s += `<text class="lbl-mono lbl-addr" x="120" y="190">${busVal}</text>`;
    s += `<text class="lbl-sm" x="120" y="204">${st < 0 ? '' : st <= 1 ? 'đang chở hàng' : 'đang chở cột'}</text>`;
    s += wire('w-addr', 'M210 80 V240', st >= 0) + wire('w-addr', 'M210 80 H238', st >= 2 && st <= 3) + wire('w-addr', 'M210 240 H238', st >= 0 && st <= 1);
    // chốt
    s += `<rect class="box ${st >= 3 ? 'box--addr' : ''}" x="240" y="55" width="100" height="50"/><text class="lbl" x="290" y="75" text-anchor="middle">Chốt địa chỉ cột</text><text class="lbl-mono" x="290" y="95" text-anchor="middle">${st >= 3 ? bin(D.col, 7) : '———————'}</text>`;
    s += `<rect class="box ${st >= 1 ? 'box--addr' : ''}" x="240" y="215" width="100" height="50"/><text class="lbl" x="290" y="235" text-anchor="middle">Chốt địa chỉ hàng</text><text class="lbl-mono" x="290" y="255" text-anchor="middle">${st >= 1 ? bin(D.row, 7) : '———————'}</text>`;
    // RAS, CAS
    s += wire('w-ctrl', 'M62 210 V300 H290 V267', st === 1) + arrowHead(290, 267, 'u', 'dot');
    s += `<text class="lbl-mono lbl-ctrl" x="70" y="294"><tspan text-decoration="overline">RAS</tspan> = ${ras}</text>`;
    s += wire('w-ctrl', 'M62 120 V20 H290 V53', st === 3) + arrowHead(290, 53, 'd', 'dot');
    s += `<text class="lbl-mono lbl-ctrl" x="70" y="34"><tspan text-decoration="overline">CAS</tspan> = ${cas}</text>`;
    // bộ giải mã
    s += wire('w-addr', 'M340 240 H362', st >= 1, st < 1);
    s += `<rect class="box ${st === 1 ? 'box--addr' : ''}" x="362" y="120" width="36" height="170"/><text class="lbl-sm" transform="translate(385 205) rotate(-90)" text-anchor="middle">Giải mã hàng</text>`;
    s += wire('w-addr', 'M340 80 H420', st >= 3, st < 3);
    s += `<rect class="box ${st === 3 ? 'box--addr' : ''}" x="420" y="62" width="170" height="36"/><text class="lbl-sm" x="505" y="84" text-anchor="middle">Giải mã cột</text>`;
    // ma trận 128 × 128 thu nhỏ
    const mx = 420, my = 120, ms = 170, k = ms / 128;
    s += `<rect class="box" x="${mx}" y="${my}" width="${ms}" height="${ms}"/>`;
    for (let i = 1; i < 16; i++) s += `<path d="M${mx + i * ms / 16} ${my} V${my + ms} M${mx} ${my + i * ms / 16} H${mx + ms}" stroke="var(--rule-soft)" stroke-width="1"/>`;
    const ry = my + D.row * k, cx = mx + D.col * k;
    if (st >= 1) s += `<rect x="${mx}" y="${ry - 1.5}" width="${ms}" height="${Math.max(3, k)}" fill="var(--addr)" opacity=".55"/>` + wire('w-addr', `M398 ${ry} H${mx}`, true);
    if (st >= 3) s += `<rect x="${cx - 1.5}" y="${my}" width="${Math.max(3, k)}" height="${ms}" fill="var(--addr)" opacity=".35"/>` + wire('w-addr', `M${cx} 98 V${my}`, true);
    if (st >= 4) s += `<rect x="${cx - 6}" y="${ry - 6}" width="12" height="12" fill="var(--ink)" stroke="var(--ctrl)" stroke-width="2.5"/>`;
    s += `<text class="lbl-sm" x="${mx + ms / 2}" y="${my + ms + 16}" text-anchor="middle">Ma trận 128 × 128</text></svg>`;
    $('#d-fig').innerHTML = s;
    // giản đồ thời gian
    const cur = [170, 262, 352, 432, 478][st];
    let t = `<svg viewBox="0 0 620 124" role="img" aria-label="Giản đồ thời gian: bus địa chỉ, RAS, CAS">`;
    t += `<text class="lbl-mono lbl-addr" x="8" y="34">A6–A0</text><text class="lbl-mono lbl-ctrl" x="8" y="70"><tspan text-decoration="overline">RAS</tspan></text><text class="lbl-mono lbl-ctrl" x="8" y="104"><tspan text-decoration="overline">CAS</tspan></text>`;
    t += `<path class="w w-ink" d="M80 30 H150 M80 30 H150" stroke-dasharray="3 3"/>`;
    t += `<path class="w w-addr" d="M150 30 L158 20 H322 L330 30 L322 40 H158 Z M330 30 L338 20 H492 L500 30 L492 40 H338 Z" style="stroke-width:1.8"/>`;
    t += `<path class="w w-ink" d="M500 30 H600" stroke-dasharray="3 3"/>`;
    t += `<text class="lbl-mono" x="240" y="34" text-anchor="middle">hàng ${D.row}</text><text class="lbl-mono" x="415" y="34" text-anchor="middle">cột ${D.col}</text>`;
    t += `<path class="w w-ctrl" style="stroke-dasharray:none" d="M80 58 H200 V78 H600"/><path class="w w-ctrl" style="stroke-dasharray:none" d="M80 92 H380 V112 H600"/>`;
    t += `<text class="lbl-sm" x="240" y="12" text-anchor="middle">Pha 1</text><text class="lbl-sm" x="415" y="12" text-anchor="middle">Pha 2</text>`;
    t += `<path d="M330 4 V120" stroke="var(--rule)" stroke-dasharray="2 3"/>`;
    if (st >= 0) t += `<path d="M${cur} 4 V120" stroke="var(--ink)" stroke-width="1.5"/><polygon points="${cur - 5},4 ${cur + 5},4 ${cur},11" class="dot"/>`;
    t += `</svg>`;
    $('#d-timing').innerHTML = t;
  }
  function initD() {
    const player = new L.StepPlayer($('#d-player'), { steps: [], onStep: (i) => { D.step = i; drawD(); } });
    const steps = () => [
      { label: `Pha 1: đặt 7 bit hàng ${bin(D.row, 7)} (= ${D.row}) lên 7 chân địa chỉ` },
      { label: 'RAS tích cực: chốt hàng giữ 7 bit, bộ giải mã chọn hàng ' + D.row },
      { label: `Pha 2: cùng 7 chân đó chở 7 bit cột ${bin(D.col, 7)} (= ${D.col})` },
      { label: 'CAS tích cực: chốt cột giữ 7 bit, bộ giải mã chọn cột ' + D.col },
      { label: `Giao điểm hàng ${D.row}, cột ${D.col} được truy cập. 7 chân × 2 pha = 14 bit địa chỉ` }
    ];
    const upd = () => {
      const r = readInt($('#d-row'), 0, 127), c = readInt($('#d-col'), 0, 127);
      if (r !== null) D.row = r; if (c !== null) D.col = c;
      player.setSteps(steps());
    };
    $('#d-row').addEventListener('change', upd); $('#d-col').addEventListener('change', upd);
    upd();
    // so sánh số chân
    const x = C.muxDram(7, 1);
    let s = `<svg viewBox="0 0 470 190" role="img" aria-label="So sánh 14 chân riêng và 7 chân dồn kênh">`;
    s += `<rect class="box" x="70" y="20" width="96" height="150"/><text class="lbl" x="118" y="92" text-anchor="middle">Chip</text><text class="lbl-sm" x="118" y="108" text-anchor="middle">không dồn kênh</text>`;
    for (let i = 0; i < x.separatePins; i++) s += `<path class="w w-addr" d="M30 ${28 + i * 10.3} H70" style="stroke-width:1.6"/>`;
    s += `<text class="lbl-mono lbl-addr" x="2" y="186">${x.separatePins} chân A13…A0</text>`;
    s += `<rect class="box" x="300" y="20" width="96" height="150"/><text class="lbl" x="348" y="92" text-anchor="middle">Chip</text><text class="lbl-sm" x="348" y="108" text-anchor="middle">dồn kênh</text>`;
    for (let i = 0; i < x.pins; i++) s += `<path class="w w-addr" d="M260 ${40 + i * 13} H300" style="stroke-width:1.6"/>`;
    s += `<path class="w w-ctrl" d="M260 140 H300"/><path class="w w-ctrl" d="M260 156 H300"/><text class="lbl-mono lbl-ctrl" x="226" y="144">RAS</text><text class="lbl-mono lbl-ctrl" x="226" y="160">CAS</text>`;
    s += `<text class="lbl-mono lbl-addr" x="236" y="186">${x.pins} chân A6…A0, dùng 2 lần</text></svg>`;
    $('#d-compare').innerHTML = s + `<p class="caption">Cùng 2<sup>${x.logicalBits}</sup> = ${x.locations.toLocaleString('vi-VN')} vị trí. Dồn kênh bớt ${x.savedPins} chân địa chỉ; đổi lại cần thêm tín hiệu RAS, CAS và địa chỉ phải gửi trong hai pha.</p>`;
    // tổng quát
    $('#d-general').innerHTML = `<div class="controls"><label class="field field--sm">Số chân r<input id="d-r" value="7"></label><label class="field field--sm">m (bit/từ)<input id="d-m" value="1"></label></div><div class="calc" id="d-gout" style="margin-top:8px"></div>`;
    const gen = () => {
      const r = readInt($('#d-r'), 1, 16), m = readInt($('#d-m'), 1, 64);
      if (r === null || m === null) return;
      const g = C.muxDram(r, m);
      $('#d-gout').innerHTML = `${r} chân × 2 pha = <span class="res">${g.logicalBits}</span> bit<br>Số vị trí = 2<sup>2×${r}</sup> = <span class="res">${g.locations.toLocaleString('vi-VN')}</span><br>Dung lượng = 2<sup>${g.logicalBits}</sup> × ${m} = <span class="res">${C.formatBits(g.bits)}</span>`;
    };
    $('#d-r').addEventListener('input', gen); $('#d-m').addEventListener('input', gen); gen();
  }

  /* =======================================================================
     E. Chân tín hiệu CS, OE, WE (slide 29)
     ======================================================================= */
  const E = { mem: Array.from({ length: 16 }, (_, i) => L.seedValue(i * 13 + 5, 8)), cs: 0, oe: 0, we: 1, addr: 6, last: null };
  function drawE() {
    const r = E.last, mode = r ? r.mode : null;
    let s = `<svg viewBox="0 0 560 370" role="img" aria-label="Sơ đồ chân chip nhớ">`;
    const boxCls = mode === 'conflict' ? 'box--err' : mode === 'read' ? 'box--data' : mode === 'write' ? 'box--addr' : mode === 'off' ? 'box--soft' : '';
    s += `<rect class="box ${boxCls}" x="170" y="34" width="200" height="236"/>`;
    s += `<text class="lbl-big" x="270" y="140" text-anchor="middle">Chip nhớ</text><text class="lbl" x="270" y="162" text-anchor="middle">2${sup(4)} × 8 bit</text>`;
    if (mode) s += `<text class="lbl-sm" x="270" y="186" text-anchor="middle">${{ read: 'đang đọc', write: 'vừa ghi', off: 'không được chọn', conflict: 'tổ hợp không hợp lệ', idle: 'chờ lệnh' }[mode]}</text>`;
    for (let b = 0; b < 4; b++) {
      const y = 62 + b * 40;
      s += wire('w-addr', `M40 ${y} H168`, !!r && mode !== 'off') + arrowHead(170, y, 'r', 'dot');
      s += `<text class="lbl-mono lbl-addr" x="40" y="${y - 6}">A${b}</text><text class="lbl-mono" x="150" y="${y - 6}" text-anchor="end">${(E.addr >> b) & 1}</text>`;
    }
    for (let b = 0; b < 8; b++) {
      const y = 50 + b * 27;
      let v = '', live = false, dir = 'r';
      if (mode === 'read') { v = (r.value >> b) & 1; live = true; }
      else if (mode === 'write') { v = (r.value >> b) & 1; live = true; dir = 'l'; }
      else if (mode === 'off' || mode === 'idle') v = 'Z';
      else if (mode === 'conflict') v = '?';
      s += wire('w-data', `M370 ${y} H500`, live, !live) + arrowHead(dir === 'r' ? 504 : 372, y, dir, 'dot');
      s += `<text class="lbl-mono lbl-data" x="520" y="${y + 4}">D${b}</text><text class="lbl-mono ${v === '?' ? 'lbl-err' : ''}" x="384" y="${y - 5}">${v}</text>`;
    }
    // CS, WE, OE
    s += `<circle cx="165" cy="248" r="5" class="box"/>` + wire('w-ctrl', 'M40 248 H159', E.cs === 0);
    s += `<text class="lbl-mono lbl-ctrl" x="40" y="240"><tspan text-decoration="overline">CS</tspan> = ${E.cs}</text>`;
    s += `<circle cx="230" cy="275" r="5" class="box"/>` + wire('w-ctrl', 'M230 281 V340', E.we === 0);
    s += `<text class="lbl-mono lbl-ctrl" x="230" y="358" text-anchor="middle"><tspan text-decoration="overline">WE</tspan> = ${E.we}</text>`;
    s += `<circle cx="310" cy="275" r="5" class="box"/>` + wire('w-ctrl', 'M310 281 V340', E.oe === 0);
    s += `<text class="lbl-mono lbl-ctrl" x="310" y="358" text-anchor="middle"><tspan text-decoration="overline">OE</tspan> = ${E.oe}</text>`;
    s += `</svg>`;
    $('#e-fig').innerHTML = s;
    // bảng điều khiển
    const st = C.controlState(E.cs, E.oe, E.we).mode;
    const rows = [['1', 'x', 'x', 'off', 'Chip không được chọn, dữ liệu ra Z'], ['0', '0', '1', 'read', 'Đọc'], ['0', '1', '0', 'write', 'Ghi'], ['0', '1', '1', 'idle', 'Được chọn, chờ lệnh'], ['0', '0', '0', 'conflict', 'Không hợp lệ (mô hình đơn giản)']];
    $('#e-truth').innerHTML = `<table class="tbl"><thead><tr><th>CS</th><th>OE</th><th>WE</th><th class="left">Kết quả</th></tr></thead><tbody>${rows.map((r) => `<tr class="${r[3] === st ? 'on' : ''}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="left">${r[4]}</td></tr>`).join('')}</tbody></table>`;
    $('#e-mem').innerHTML = `<table class="tbl"><thead><tr><th>Địa chỉ</th><th>Hex</th><th>Nhị phân</th><th>Địa chỉ</th><th>Hex</th><th>Nhị phân</th></tr></thead><tbody>${Array.from({ length: 8 }, (_, i) => {
      const c = (a) => `<td class="mono">${a}</td><td class="mono">${hex(E.mem[a], 2)}</td><td class="mono">${bin(E.mem[a], 8)}</td>`;
      return `<tr>${c(i)}${c(i + 8)}</tr>`;
    }).join('')}</tbody></table>`;
    // tô ô đang chọn
    const cells = $('#e-mem').querySelectorAll('tbody tr');
    const row = cells[E.addr % 8], off = E.addr < 8 ? 0 : 3;
    for (let k = 0; k < 3; k++) { const td = row.children[off + k]; td.style.background = 'var(--ink)'; td.style.color = '#fff'; }
  }
  function initE() {
    const host = $('#e-dips');
    const onChange = () => { E.cs = cs.get(); E.oe = oe.get(); E.we = we.get(); E.last = null; drawE(); status($('#e-status'), 'addr', C.controlState(E.cs, E.oe, E.we).text + ' Bấm Thực hiện để chạy.'); };
    const cs = L.dip(host, { label: '<span class="ovl">CS</span>', value: 0, kind: 'ctrl', onChange, note: 'chọn chip, tích cực 0' });
    const oe = L.dip(host, { label: '<span class="ovl">OE</span>', value: 0, kind: 'ctrl', onChange, note: 'cho phép đọc, tích cực 0' });
    const we = L.dip(host, { label: '<span class="ovl">WE</span>', value: 1, kind: 'ctrl', onChange, note: 'cho phép ghi, tích cực 0' });
    $('#e-addr').addEventListener('input', () => { const v = readInt($('#e-addr'), 0, 15); if (v !== null) { E.addr = v; E.last = null; drawE(); } });
    $('#e-run').addEventListener('click', () => {
      const a = readInt($('#e-addr'), 0, 15);
      if (a === null) return status($('#e-status'), 'err', 'Địa chỉ phải là số nguyên từ 0 đến 15 (chip có 4 đường địa chỉ).');
      E.addr = a;
      const st = C.controlState(E.cs, E.oe, E.we);
      let value = null;
      if (st.mode === 'read') value = E.mem[a];
      if (st.mode === 'write') {
        const d = C.parseAddress($('#e-data').value, 8);
        $('#e-data').setAttribute('aria-invalid', d.error ? 'true' : 'false');
        if (d.error) return status($('#e-status'), 'err', 'Dữ liệu ghi phải từ 0x00 đến 0xFF.');
        value = d.value; E.mem[a] = value;
      }
      E.last = { mode: st.mode, value };
      drawE();
      const extra = st.mode === 'read' ? ` Dữ liệu ra: <b>${hex(value, 2)}</b> = ${bin(value, 8)}.` : st.mode === 'write' ? ` Ô ${a} giờ chứa <b>${hex(value, 2)}</b>.` : '';
      status($('#e-status'), st.mode === 'conflict' ? 'err' : st.mode === 'off' || st.mode === 'idle' ? 'warn' : 'ok', st.text + extra);
    });
    drawE();
    status($('#e-status'), 'addr', C.controlState(0, 0, 1).text + ' Bấm Thực hiện để chạy.');
  }

  /* =======================================================================
     F. Thiết kế module (slide 30–32)
     ======================================================================= */
  /** Vẽ module ghép 2^k chip theo chiều dọc như hình slide 32 */
  function moduleSVG(mod, addr, st) {
    const k = mod.chips, n = mod.chip.addrLines, chipH = 66, gap = 22, top = 64;
    const chipY = (i) => top + i * (chipH + gap);
    const H = top + k * (chipH + gap) + 34;
    const loc = C.locateInModule(addr, mod.chip.words, k);
    const sel = loc ? loc.chip : -1;
    const selBits = mod.selectLines, selVal = Math.floor(addr / mod.chip.words);
    const decH = Math.max(64, k * 24), decY = top + (k * (chipH + gap) - gap) / 2 - decH / 2;
    const selName = selBits === 1 ? `A${n}` : `A${n + selBits - 1}–A${n}`;
    let s = `<svg viewBox="0 0 610 ${H}" role="img" aria-label="Module gồm ${k} chip ${mod.chip.label}, bộ giải mã ${selBits} → ${k}">`;
    s += `<rect class="box" x="10" y="24" width="80" height="116"/><text class="lbl-big" x="50" y="88" text-anchor="middle">CPU</text>`;
    // bus địa chỉ chung
    s += wire('w-addr', `M90 44 H330 V${chipY(k - 1) + 20}`, st >= 0);
    s += `<text class="lbl-mono lbl-addr" x="100" y="38">A${n - 1}–A0</text><text class="lbl-mono" x="320" y="38" text-anchor="end">${st >= 0 && loc ? hex(loc.internal, 3) : ''}</text>`;
    for (let i = 0; i < k; i++) s += wire('w-addr', `M330 ${chipY(i) + 20} H378`, st >= 3 && i === sel, st >= 3 && i !== sel) + arrowHead(380, chipY(i) + 20, 'r', 'dot');
    // bit chọn chip → bộ giải mã
    s += wire('w-addr', `M90 104 H130 V${decY + decH / 2} H158`, st >= 0) + arrowHead(160, decY + decH / 2, 'r', 'dot');
    s += `<text class="lbl-mono lbl-addr" x="96" y="98">${selName}</text><text class="lbl-mono" x="136" y="${decY + decH / 2 - 8}">${st >= 0 ? bin(selVal, selBits) : ''}</text>`;
    s += `<rect class="box ${st === 1 ? 'box--addr' : ''}" x="160" y="${decY}" width="84" height="${decH}"/>`;
    s += `<text class="lbl" x="202" y="${decY + decH / 2 - 4}" text-anchor="middle">Giải mã</text><text class="lbl" x="202" y="${decY + decH / 2 + 12}" text-anchor="middle">${selBits} → ${k}</text>`;
    s += `<text class="lbl-mono" x="202" y="${decY + decH + 16}" text-anchor="middle"><tspan text-decoration="overline">G</tspan> = 0</text>`;
    for (let i = 0; i < k; i++) {
      const oy = decY + ((i + 0.5) * decH) / k, xv = 262 + i * 8, cy = chipY(i) + 50;
      const v = st >= 1 && i === sel ? 0 : 1;
      s += wire('w-ctrl', `M244 ${oy} H${xv} V${cy} H372`, st >= 2 && i === sel, st >= 2 && i !== sel);
      s += `<circle cx="376" cy="${cy}" r="4" class="box"/>`;
      s += `<text class="lbl-mono" x="248" y="${oy - 3}" style="font-size:10px"><tspan text-decoration="overline">Y${i}</tspan></text>`;
      s += `<text class="lbl-mono lbl-ctrl" x="348" y="${cy - 5}" text-anchor="end" style="font-size:11px">${st >= 1 ? v : ''}</text>`;
    }
    // chip
    for (let i = 0; i < k; i++) {
      const y = chipY(i), on = st >= 2 && i === sel;
      s += `<rect class="box ${on ? 'box--addr' : ''}" x="380" y="${y}" width="132" height="${chipH}" style="${on ? 'stroke-width:3' : st >= 2 ? 'opacity:.45' : ''}"/>`;
      s += `<text class="lbl" x="446" y="${y + 24}" text-anchor="middle">Chip ${i + 1}</text><text class="lbl-sm" x="446" y="${y + 40}" text-anchor="middle">SRAM ${mod.chip.label}</text>`;
      s += `<text class="lbl-mono" x="386" y="${y + 60}" style="font-size:10px"><tspan text-decoration="overline">CS</tspan>${st >= 1 ? ' = ' + (i === sel ? 0 : 1) : ''}</text>`;
      if (on && st >= 3 && loc) s += `<text class="lbl-mono lbl-addr" x="506" y="${y + 60}" text-anchor="end" style="font-size:10.5px">ô ${hex(loc.internal, 3)}</text>`;
      s += wire('w-data', `M512 ${y + 30} H568`, st >= 4 && i === sel, st >= 4 && i !== sel);
      s += wire('w-ctrl', `M512 ${y + 54} H546`, false, true);
    }
    // bus dữ liệu chung
    s += wire('w-data', `M568 ${chipY(k - 1) + 30} V12 H50 V22`, st >= 4);
    s += `<text class="lbl-mono lbl-data" x="300" y="8" text-anchor="middle">D${mod.dataLines - 1}–D0, bus dữ liệu chung</text>`;
    s += wire('w-ctrl', `M60 140 V${H - 10} H546 V${chipY(0) + 54}`, false, true);
    s += `<text class="lbl-mono lbl-ctrl" x="68" y="${H - 16}"><tspan text-decoration="overline">WE</tspan>, <tspan text-decoration="overline">OE</tspan> nối chung</text>`;
    s += `</svg>`;
    return s;
  }
  const F = { target: 8192, addr: 0x1234, step: -1 };
  function rangesTable(mod, sel) {
    const n = mod.chip.addrLines, d = Math.ceil(mod.externalAddr / 4);
    return `<table class="tbl"><thead><tr><th>Chip</th><th>Bit chọn ${mod.selectLines === 1 ? 'A' + n : `A${n + mod.selectLines - 1}…A${n}`}</th><th>Địa chỉ đầu</th><th>Địa chỉ cuối</th><th>Ngõ ra bộ giải mã nối vào CS</th></tr></thead><tbody>
      ${mod.ranges.map((r) => `<tr class="${r.chip === sel ? 'on' : ''}"><td>Chip ${r.chip + 1}</td><td class="mono">${bin(r.chip, mod.selectLines)}</td><td class="mono">${hex(r.start, d)}</td><td class="mono">${hex(r.end, d)}</td><td class="mono">Ȳ${r.chip}</td></tr>`).join('')}</tbody></table>`;
  }
  function initF() {
    L.tabs($('#f-tabs'));
    const player = new L.StepPlayer($('#f-player'), { steps: [], onStep: (i) => { F.step = i; drawF(); } });
    function mod() { return C.expandWords(4096, 8, F.target); }
    function drawF() {
      const m = mod();
      $('#f-fig').innerHTML = moduleSVG(m, F.addr, F.step);
      const loc = C.locateInModule(F.addr, 4096, m.chips);
      $('#f-ranges').innerHTML = rangesTable(m, F.step >= 2 && loc ? loc.chip : -1);
    }
    function rebuild() {
      const m = mod();
      const r = readAddr($('#f-addr'), m.externalAddr);
      if (!r.error) F.addr = r.value;
      $('#f-tb').textContent = C.formatBytes(m.totalBytes);
      $('#f-kv').innerHTML = `<div><span>Dung lượng 1 chip</span><b>${C.formatBytes(m.chip.bytes)}</b></div>
        <div><span>Số chip</span><b>${C.formatBytes(m.totalBytes)} ÷ ${C.formatBytes(m.chip.bytes)} = ${m.chips}</b></div>
        <div><span>Địa chỉ module</span><b>${m.externalAddr} đường</b></div><div><span>Địa chỉ mỗi chip</span><b>${m.chip.addrLines} đường</b></div>
        <div><span>Dữ liệu</span><b>${m.dataLines} đường</b></div><div><span>Bộ giải mã</span><b>${m.selectLines} → ${m.chips}</b></div>`;
      const loc = C.locateInModule(F.addr, 4096, m.chips);
      const d = Math.ceil(m.externalAddr / 4), n = m.chip.addrLines;
      const sb = bin(loc.chip, m.selectLines), selName = m.selectLines === 1 ? `A${n}` : `A${n + m.selectLines - 1}…A${n}`;
      player.setSteps([
        { label: `CPU phát địa chỉ ${hex(F.addr, d)} = ${bin(F.addr, m.externalAddr)} (${m.externalAddr} bit)` },
        { label: `${selName} = ${sb} đi vào bộ giải mã ${m.selectLines} → ${m.chips}` },
        { label: `Ȳ${loc.chip} = 0 nên CS chip ${loc.chip + 1} = 0: chip ${loc.chip + 1} được chọn, các chip khác có CS = 1` },
        { label: `A${n - 1}…A0 = ${hex(loc.internal, 3)} chọn ô bên trong chip ${loc.chip + 1}` },
        { label: `Chỉ chip ${loc.chip + 1} đưa dữ liệu lên bus D7…D0 dùng chung` }
      ]);
      drawF();
    }
    $('#f-target').addEventListener('change', () => { F.target = Number($('#f-target').value); rebuild(); });
    $('#f-addr').addEventListener('change', rebuild);
    $('#sec-f').addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]'); if (!b) return;
      $('#f-addr').value = b.dataset.q; rebuild(); player.play();
    });
    rebuild();
    // --- Tăng độ dài từ (ví dụ bổ sung)
    const W = C.expandWidth(4096, 8, 16);
    const lane = (a, c) => L.seedValue(a * 2 + c + 101, 8);
    function drawW() {
      const r = readAddr($('#fw-addr'), W.addrLines);
      const a = r.error ? 0 : r.value;
      const lo = lane(a, 0), hi = lane(a, 1), word = hi * 256 + lo;
      let s = `<svg viewBox="0 0 600 300" role="img" aria-label="Hai chip 4K × 8 ghép song song thành 4K × 16">`;
      s += `<rect class="box" x="10" y="96" width="80" height="100"/><text class="lbl-big" x="50" y="152" text-anchor="middle">CPU</text>`;
      s += wire('w-addr', 'M90 120 H180 V60 H218 M180 120 V200 H218', true) + arrowHead(220, 60, 'r', 'dot') + arrowHead(220, 200, 'r', 'dot');
      s += `<text class="lbl-mono lbl-addr" x="96" y="114">A11–A0 = ${hex(a, 3)}</text>`;
      [[40, 'Chip 1', 'D7–D0', lo], [180, 'Chip 2', 'D15–D8', hi]].forEach(([y, nm, dn, v]) => {
        s += `<rect class="box box--addr" x="220" y="${y}" width="140" height="70" style="stroke-width:2.5"/><text class="lbl" x="290" y="${y + 28}" text-anchor="middle">${nm}</text><text class="lbl-sm" x="290" y="${y + 46}" text-anchor="middle">SRAM 4K × 8</text>`;
        s += `<circle cx="216" cy="${y + 58}" r="4" class="box"/>` + wire('w-ctrl', `M196 ${y + 58} H210`, true);
        s += `<text class="lbl-mono lbl-ctrl" x="194" y="${y + 62}" text-anchor="end" style="font-size:10.5px"><tspan text-decoration="overline">CS</tspan> = 0</text>`;
        s += wire('w-data', `M360 ${y + 30} H440`, true) + `<text class="lbl-mono lbl-data" x="368" y="${y + 22}">${dn} = ${hex(v, 2)}</text>`;
      });
      s += `<rect class="box box--data" x="440" y="58" width="140" height="180"/><text class="lbl" x="510" y="84" text-anchor="middle">Bus dữ liệu 16 bit</text>`;
      s += `<text class="lbl-mono" x="510" y="130" text-anchor="middle">D15–D8: ${bin(hi, 8)}</text><text class="lbl-mono" x="510" y="160" text-anchor="middle">D7–D0: ${bin(lo, 8)}</text><text class="lbl-big" x="510" y="200" text-anchor="middle">${hex(word, 4)}</text>`;
      s += wire('w-data', 'M510 238 V280 H50 V198', true) + `<text class="lbl-sm" x="60" y="274">16 bit cùng lúc về CPU</text></svg>`;
      $('#fw-fig').innerHTML = s;
      $('#fw-out').innerHTML = `<dl class="readout"><dt>Số chip</dt><dd>16 ÷ 8 = ${W.chips}</dd><dt>Đường địa chỉ</dt><dd>${W.addrLines} (nối chung)</dd><dt>Đường dữ liệu</dt><dd>${W.dataLines}</dd><dt>Số từ</dt><dd>${C.formatCount(W.totalWords)} (không đổi)</dd><dt>Dung lượng</dt><dd>${C.formatCount(W.totalWords)} × ${W.dataLines} bit = ${C.formatBytes(W.totalBytes)}</dd></dl>
        <p class="note">Cả hai chip <b>cùng được chọn</b> (CS = 0) và nhận <b>cùng một địa chỉ</b>. Mỗi chip cấp 8 bit của từ 16 bit. Không cần bộ giải mã.</p>`;
    }
    $('#fw-addr').addEventListener('input', drawW); drawW();
    // --- So sánh
    const Wd = C.expandWords(4096, 8, 8192);
    $('#f-cmp-table').innerHTML = `<table class="tbl"><thead><tr><th class="left">Tiêu chí</th><th>Tăng số lượng từ<br><small>4K × 8 → 8K × 8 (slide 31–32)</small></th><th>Tăng độ dài từ<br><small>4K × 8 → 4K × 16 (ví dụ bổ sung)</small></th></tr></thead><tbody>
      <tr><td class="left">Số chip</td><td>${Wd.chips}</td><td>${W.chips}</td></tr>
      <tr><td class="left">Số từ nhớ của module</td><td>${C.formatCount(Wd.totalWords)}</td><td>${C.formatCount(W.totalWords)}</td></tr>
      <tr><td class="left">Độ dài từ</td><td>${Wd.dataLines} bit</td><td>${W.dataLines} bit</td></tr>
      <tr><td class="left">Đường địa chỉ module</td><td>${Wd.externalAddr}</td><td>${W.addrLines}</td></tr>
      <tr><td class="left">Đường dữ liệu module</td><td>${Wd.dataLines}</td><td>${W.dataLines}</td></tr>
      <tr><td class="left">Dung lượng</td><td>${C.formatBytes(Wd.totalBytes)}</td><td>${C.formatBytes(W.totalBytes)}</td></tr>
      <tr><td class="left">Nối địa chỉ</td><td>A11–A0 chung, A12 vào bộ giải mã</td><td>A11–A0 chung cho cả hai chip</td></tr>
      <tr><td class="left">Tín hiệu CS</td><td>Mỗi lúc chỉ 1 chip có CS = 0</td><td>Cả hai chip cùng CS = 0</td></tr>
      <tr><td class="left">Bus dữ liệu</td><td>Hai chip nối chung D7–D0</td><td>Chip 1 → D7–D0, chip 2 → D15–D8</td></tr>
      <tr><td class="left">Bộ giải mã</td><td>Cần, loại 1 → 2</td><td>Không cần</td></tr></tbody></table>
      <p class="note">Cùng dùng 2 chip và cùng ra 8KB, nhưng một bên có nhiều từ hơn, bên kia có từ dài hơn.</p>`;
  }

  /* =======================================================================
     G. Bộ giải mã (slide 33–34)
     ======================================================================= */
  function decoderSVG({ ins, outs, title, h }) {
    const H = h || Math.max(170, Math.max(ins.length, outs.length) * 30 + 40);
    const bx = 150, bw = 130, by = 16, bh = H - 32;
    let s = `<svg viewBox="0 0 460 ${H}" role="img" aria-label="${title}">`;
    s += `<rect class="box" x="${bx}" y="${by}" width="${bw}" height="${bh}"/><text class="lbl" x="${bx + bw / 2}" y="${by + bh / 2 + 4}" text-anchor="middle">${title}</text>`;
    ins.forEach((p, i) => {
      const y = by + ((i + 0.5) * bh) / ins.length;
      s += wire(p.ctrl ? 'w-ctrl' : 'w-addr', `M40 ${y} H${bx - (p.low ? 10 : 0)}`, p.val === 1) + (p.low ? `<circle cx="${bx - 5}" cy="${y}" r="5" class="box"/>` : '');
      s += `<text class="lbl-mono ${p.ctrl ? 'lbl-ctrl' : 'lbl-addr'}" x="40" y="${y - 6}">${p.low ? `<tspan text-decoration="overline">${p.name}</tspan>` : p.name}</text><text class="lbl-mono" x="${bx - 22}" y="${y - 6}" text-anchor="end">${p.val}</text>`;
    });
    outs.forEach((p, i) => {
      const y = by + ((i + 0.5) * bh) / outs.length;
      const x0 = bx + bw + (p.low ? 10 : 0);
      s += (p.low ? `<circle cx="${bx + bw + 5}" cy="${y}" r="5" class="box"/>` : '') + wire('w-ink', `M${x0} ${y} H360`, false, !p.sel);
      s += `<text class="lbl-mono" x="${x0 + 4}" y="${y - 6}">${p.low ? `<tspan text-decoration="overline">${p.name}</tspan>` : p.name}</text>`;
      s += `<circle cx="372" cy="${y}" r="8" style="fill:${p.sel ? 'var(--ink)' : '#fff'};stroke:var(--ink);stroke-width:1.6"/>`;
      s += `<text class="lbl-mono" x="388" y="${y + 4}">${p.val}</text>${p.sel ? `<text class="lbl" x="406" y="${y + 4}">chọn</text>` : ''}`;
    });
    return s + `</svg>`;
  }
  const match = (row, vals) => row.every((r, i) => r === 'x' || String(r) === String(vals[i]));
  function truthTable(head, rows, vals, nIn) {
    return `<table class="tbl"><thead><tr>${head.map((h, i) => `<th${i === nIn ? ' style="border-left:2px solid var(--ink)"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr class="${match(r.slice(0, nIn), vals) ? 'on' : ''}">${r.map((c, i) => `<td class="mono"${i === nIn ? ' style="border-left:2px solid var(--ink)"' : ''}>${c === 'x' ? 'X' : c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function decoderTab(host, cfg) {
    host.innerHTML = `<div class="stage stage--split-wide"><div><div class="figure figure--grid" data-k="fig"></div><div class="dips" data-k="dips" style="margin-top:12px"></div></div><div><div class="tbl-wrap" data-k="tt"></div><div data-k="msg" aria-live="polite"></div></div></div>`;
    const vals = cfg.inputs.map((p) => p.init);
    const draw = () => {
      const r = cfg.eval(vals);
      $('[data-k=fig]', host).innerHTML = decoderSVG({ title: cfg.title, ins: cfg.inputs.map((p, i) => ({ ...p, val: vals[i] })), outs: r.outs, h: cfg.h });
      $('[data-k=tt]', host).innerHTML = truthTable(cfg.head, cfg.rows, vals, cfg.inputs.length);
      $('[data-k=msg]', host).innerHTML = `<div class="status status--${r.ok ? 'ok' : 'warn'}">${r.msg}</div>`;
    };
    cfg.inputs.forEach((p, i) => L.dip($('[data-k=dips]', host), { label: p.low ? `<span class="ovl">${p.name}</span>` : p.name, value: p.init, kind: p.ctrl ? 'ctrl' : 'addr', onChange: (v) => { vals[i] = v; draw(); } }));
    draw();
  }
  function initG() {
    L.tabs($('#g-tabs'));
    decoderTab($('#g-12'), {
      title: 'Giải mã 1 → 2', inputs: [{ name: 'G', low: true, ctrl: true, init: 0 }, { name: 'A', init: 0 }],
      head: ['Ḡ', 'A', 'Ȳ0', 'Ȳ1'], rows: [[0, 0, 0, 1], [0, 1, 1, 0], [1, 'x', 1, 1]],
      eval: ([g, a]) => { const o = C.dec1to2(g, a); return { outs: o.map((v, i) => ({ name: 'Y' + i, low: true, val: v, sel: v === 0 })), ok: !g, msg: g ? 'Ḡ = 1: bộ giải mã bị tắt, cả hai ngõ ra bằng 1.' : `A = ${a}: Ȳ${a} = 0 được chọn. Trong module 8KB, A chính là A12.` }; }
    });
    decoderTab($('#g-24'), {
      title: 'Giải mã 2 → 4', inputs: [{ name: 'G', low: true, ctrl: true, init: 0 }, { name: 'B', init: 1 }, { name: 'A', init: 0 }],
      head: ['Ḡ', 'B', 'A', 'Ȳ0', 'Ȳ1', 'Ȳ2', 'Ȳ3'], rows: [[0, 0, 0, 0, 1, 1, 1], [0, 0, 1, 1, 0, 1, 1], [0, 1, 0, 1, 1, 0, 1], [0, 1, 1, 1, 1, 1, 0], [1, 'x', 'x', 1, 1, 1, 1]],
      eval: ([g, b, a]) => { const o = C.dec2to4(g, b, a); return { outs: o.map((v, i) => ({ name: 'Y' + i, low: true, val: v, sel: v === 0 })), ok: !g, msg: g ? 'Ḡ = 1: bộ giải mã bị tắt.' : `BA = ${b}${a}₂ = ${b * 2 + a}: chọn Ȳ${b * 2 + a}.` }; }
    });
    const rows138 = [[1, 'x', 'x', 'x', 'x', 'x', 1, 1, 1, 1, 1, 1, 1, 1], ['x', 1, 'x', 'x', 'x', 'x', 1, 1, 1, 1, 1, 1, 1, 1], ['x', 'x', 0, 'x', 'x', 'x', 1, 1, 1, 1, 1, 1, 1, 1]];
    for (let v = 0; v < 8; v++) rows138.push([0, 0, 1, (v >> 2) & 1, (v >> 1) & 1, v & 1, ...Array.from({ length: 8 }, (_, i) => (i === v ? 0 : 1))]);
    decoderTab($('#g-138'), {
      title: '74LS138', h: 300,
      inputs: [{ name: 'G2A', low: true, ctrl: true, init: 0 }, { name: 'G2B', low: true, ctrl: true, init: 0 }, { name: 'G1', ctrl: true, init: 1 }, { name: 'C', init: 1 }, { name: 'B', init: 0 }, { name: 'A', init: 1 }],
      head: ['G2A', 'G2B', 'G1', 'C', 'B', 'A', '0', '1', '2', '3', '4', '5', '6', '7'], rows: rows138,
      eval: ([g2a, g2b, g1, c, b, a]) => {
        const r = C.ls138(g1, g2a, g2b, c, b, a);
        const why = g1 !== 1 ? 'G1 = 0' : g2a !== 0 ? 'G2A = 1' : 'G2B = 1';
        return { outs: r.out.map((v, i) => ({ name: 'Y' + i, low: true, val: v, sel: v === 0 })), ok: r.enabled, msg: r.enabled ? `Cho phép: G1 = 1, G2A = G2B = 0. CBA = ${c}${b}${a}₂ = ${c * 4 + b * 2 + a}: ngõ ${c * 4 + b * 2 + a} xuống 0.` : `${why}: IC không được cho phép, cả 8 ngõ ra bằng 1.` };
      }
    });
    $('#g-138').insertAdjacentHTML('beforeend', '<p class="note">Đây là mô phỏng logic theo bảng chân lý ở slide 34, không mô phỏng điện áp, thời gian trễ hay sơ đồ chân vật lý của IC.</p>');
    decoderTab($('#g-21'), {
      title: 'AND + NOT = NAND', inputs: [{ name: 'A', init: 1 }, { name: 'B', init: 1 }],
      head: ['A', 'B', 'Q'], rows: [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
      eval: ([a, b]) => { const q = C.nand2(a, b); return { outs: [{ name: 'Q', val: q, sel: q === 0 }], ok: true, msg: `Q = NOT(A AND B) = ${q}.` }; }
    });
    $('#g-21').insertAdjacentHTML('afterbegin', '<p class="note"><b>Ghi chú nguồn.</b> Slide 33 đặt tên “Bộ giải mã 2 → 1”, nhưng hình là cổng AND nối cổng NOT và bảng chân lý là của cổng NAND. Theo định nghĩa, bộ giải mã có ít ngõ vào hơn ngõ ra, nên tab này giữ nguyên nội dung slide và gọi đúng tên là cổng NAND.</p>');
    // tổng quát
    const G = $('#g-n');
    G.innerHTML = `<div class="controls"><label class="field">Số ngõ vào n<select id="gn-n">${[1, 2, 3, 4, 5].map((v) => `<option ${v === 3 ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><div class="dips" id="gn-dips" style="margin:12px 0"></div><div id="gn-out"></div><p class="caption">Mô hình trừu tượng: ngõ ra được chọn bằng 1. Bộ giải mã thực trong slide dùng ngõ ra tích cực thấp.</p>`;
    let vals = [];
    const drawN = () => {
      const n = vals.length, v = vals.reduce((acc, b) => acc * 2 + b, 0);
      const out = C.decoderN(n, v);
      const cols = Math.min(16, out.length), cw = 520 / cols, rows = Math.ceil(out.length / cols);
      let s = `<svg viewBox="0 0 540 ${rows * 52 + 10}" role="img" aria-label="${out.length} ngõ ra, ngõ ${v} được chọn">`;
      out.forEach((o, i) => {
        const x = 10 + (i % cols) * cw, y = 6 + Math.floor(i / cols) * 52;
        s += `<rect class="box ${o ? 'box--on' : ''}" x="${x + 2}" y="${y}" width="${cw - 4}" height="30"/><text class="lbl-mono ${o ? 'lbl-on' : ''}" x="${x + cw / 2}" y="${y + 20}" text-anchor="middle">${o}</text><text class="lbl-sm" x="${x + cw / 2}" y="${y + 45}" text-anchor="middle">Y${i}</text>`;
      });
      $('#gn-out').innerHTML = s + `</svg><p class="formula">${n} bit vào → 2<sup>${n}</sup> = ${out.length} ngõ ra; giá trị ${vals.join('')}₂ = ${v} → Y${v} = 1</p>`;
    };
    const build = () => {
      const n = Number($('#gn-n').value);
      vals = new Array(n).fill(0); vals[n - 1] = 1;
      $('#gn-dips').innerHTML = '';
      for (let i = 0; i < n; i++) L.dip($('#gn-dips'), { label: 'I' + (n - 1 - i), value: vals[i], kind: 'addr', onChange: (v) => { vals[i] = v; drawN(); } });
      drawN();
    };
    $('#gn-n').addEventListener('change', build); build();
  }

  /* =======================================================================
     H. Bài tập: lời giải từng bước + tự luyện
     ======================================================================= */
  function initH() {
    L.tabs($('#h-tabs'));
    L.guided($('#h-guided'), () => {
      const m = C.expandWords(4096, 8, 8192), c = m.chip;
      return [
        { title: 'Hiểu thông số chip', body: `<p>Chip <b>SRAM 4K × 8</b>: “4K” là số từ nhớ, “8” là số bit mỗi từ.</p><div class="calc">Số từ = 4K = 4 × 1024 = <span class="res">${c.words}</span> = 2<sup>${c.addrLines}</sup><br>Dung lượng = ${c.words} × ${c.width} bit = ${c.bits} bit = <span class="res">${C.formatBytes(c.bytes)}</span><br>Đường địa chỉ = log₂(${c.words}) = <span class="res">${c.addrLines}</span><br>Đường dữ liệu = <span class="res">${c.dataLines}</span></div>` },
        { title: 'Tính số chip', body: `<div class="calc">Số chip = dung lượng module ÷ dung lượng chip<br>= ${C.formatBytes(m.totalBytes)} ÷ ${C.formatBytes(c.bytes)} = <span class="res">${m.chips} chip</span></div><p>Độ dài từ của module vẫn là 8 bit, nên đây là bài <b>tăng số lượng từ nhớ</b>.</p>` },
        { title: 'Số đường địa chỉ của module', body: `<p>Module 8KB, mỗi ô 1 byte, nên có ${m.totalWords} ô cần địa chỉ riêng.</p><div class="calc">${m.totalWords} = 2<sup>${m.externalAddr}</sup> → <span class="res">${m.externalAddr} đường địa chỉ</span> A${m.externalAddr - 1}…A0<br>Cách khác: n + k = ${c.addrLines} + log₂(${m.chips}) = ${c.addrLines} + ${m.selectLines} = ${m.externalAddr}</div>` },
        { title: 'Bit chung và bit chọn chip', body: `<ul><li><b>A${c.addrLines - 1}…A0</b> (${c.addrLines} bit) nối chung vào cả hai chip, chọn ô bên trong chip.</li><li><b>A${c.addrLines}</b> (${m.selectLines} bit) quyết định chip nào làm việc.</li></ul>${rangesTable(m, -1)}` },
        { title: 'Thiết kế bộ giải mã', body: `<div class="calc">Cần chọn 1 trong ${m.chips} chip → ${m.selectLines} ngõ vào, ${m.chips} ngõ ra → <span class="res">bộ giải mã ${m.selectLines} → ${m.chips}</span></div><p>Ngõ ra tích cực thấp nối thẳng vào CS: A12 = 0 → Ȳ0 = 0 → chip 1; A12 = 1 → Ȳ1 = 0 → chip 2. Ḡ nối mức 0 để luôn cho phép.</p>` },
        { title: 'Nối bus dữ liệu và kiểm tra', body: `<p>Hai chip nối chung D7…D0 và chung WE, OE. Vì chỉ một chip có CS = 0, chỉ chip đó được đưa dữ liệu lên bus.</p><div data-k="final" class="figure figure--grid"></div>`, after: (body) => { $('[data-k=final]', body).innerHTML = moduleSVG(m, 0x1234, 4); } }
      ];
    });
    // ---- Tự luyện
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const fmt = C.formatCount;
    function pWords(cw, cm, targetBytes, title) {
      const m = C.expandWords(cw, cm, (targetBytes * 8) / cm);
      return {
        title: title || `Tăng số từ: ${fmt(cw)} × ${cm} → ${C.formatBytes(targetBytes)}`,
        text: `Dùng chip SRAM <b>${fmt(cw)} × ${cm}</b> để thiết kế module <b>${fmt(m.totalWords)} × ${cm}</b> (${C.formatBytes(targetBytes)}). Tính các thông số.`,
        fields: [
          { label: 'Số chip cần dùng', answer: m.chips, kind: 'chips' },
          { label: 'Số đường địa chỉ mỗi chip', answer: m.chip.addrLines, kind: 'addrBits', ctx: { countValue: cw } },
          { label: 'Số đường địa chỉ module', answer: m.externalAddr, kind: 'addrBits', ctx: { countValue: m.totalWords, chipAddr: m.chip.addrLines } },
          { label: 'Số đường dữ liệu', answer: m.dataLines },
          { label: 'Số ngõ vào bộ giải mã', answer: m.selectLines, kind: 'addrBits', ctx: { countValue: m.chips } }
        ],
        hint: 'Số chip = số từ module ÷ số từ một chip (cùng độ rộng). Số ngõ vào bộ giải mã = log₂(số chip).',
        solution: [`Chip có ${cw} = 2<sup>${m.chip.addrLines}</sup> từ → ${m.chip.addrLines} đường địa chỉ.`, `Số chip = ${m.totalWords} ÷ ${cw} = ${m.chips}.`, `Module có ${m.totalWords} = 2<sup>${m.externalAddr}</sup> từ → ${m.externalAddr} đường địa chỉ.`, `Dữ liệu giữ nguyên ${cm} đường.`, `Bộ giải mã ${m.selectLines} → ${m.chips}, dùng ${m.selectLines} bit cao nhất của địa chỉ.`]
      };
    }
    function pCap(n, mm) {
      const c = C.chip(2 ** n, mm);
      return {
        title: `Dung lượng chip có ${n} đường địa chỉ, ${mm} đường dữ liệu`,
        text: `Chip nhớ có <b>${n}</b> đường địa chỉ và <b>${mm}</b> đường dữ liệu. Tính số từ nhớ và dung lượng.`,
        fields: [{ label: 'Số từ nhớ', answer: c.words }, { label: 'Dung lượng (bit)', answer: c.bits, kind: 'capacityBits' }, { label: 'Dung lượng (byte)', answer: c.bytes, kind: 'bytes' }],
        hint: 'Số từ = 2ⁿ. Dung lượng = 2ⁿ × m bit. Chia cho 8 để đổi sang byte.',
        solution: [`Số từ = 2<sup>${n}</sup> = ${c.words}.`, `Dung lượng = ${c.words} × ${mm} = ${c.bits} bit.`, `= ${c.bits} ÷ 8 = ${c.bytes} byte = ${C.formatBytes(c.bytes)}.`]
      };
    }
    function pWidth(cw, cm, tm) {
      const m = C.expandWidth(cw, cm, tm);
      return {
        title: `Tăng độ dài từ: ${fmt(cw)} × ${cm} → ${fmt(cw)} × ${tm}`,
        text: `Dùng chip <b>${fmt(cw)} × ${cm}</b> để tạo module <b>${fmt(cw)} × ${tm}</b>.`,
        fields: [{ label: 'Số chip', answer: m.chips, kind: 'chips' }, { label: 'Số đường địa chỉ module', answer: m.addrLines, kind: 'addrBits', ctx: { countValue: cw } }, { label: 'Số đường dữ liệu module', answer: m.dataLines }, { label: 'Dung lượng module (byte)', answer: m.totalBytes, kind: 'bytes' }],
        hint: 'Số từ không đổi nên số đường địa chỉ không đổi. Số chip = độ dài từ mới ÷ độ dài từ của chip.',
        solution: [`Số chip = ${tm} ÷ ${cm} = ${m.chips}, ghép song song.`, `Địa chỉ: ${m.addrLines} đường nối chung (${fmt(cw)} = 2<sup>${m.addrLines}</sup>).`, `Dữ liệu: ${m.dataLines} đường; chip i cấp các bit D${cm}i…`, `Dung lượng = ${cw} × ${tm} ÷ 8 = ${m.totalBytes} byte.`]
      };
    }
    function pSelect(cw, chips, addr) {
      const m = C.expandWords(cw, 8, cw * chips), loc = C.locateInModule(addr, cw, chips);
      const d = Math.ceil(m.externalAddr / 4);
      return {
        title: `Địa chỉ ${hex(addr, d)} thuộc chip nào? (${chips} chip ${fmt(cw)} × 8)`,
        text: `Module gồm <b>${chips}</b> chip ${fmt(cw)} × 8 ghép tăng số từ, bắt đầu từ địa chỉ 0, chip 0 ở vùng thấp nhất. CPU phát địa chỉ <b>${hex(addr, d)}</b>.`,
        fields: [{ label: 'Chip số (đếm từ 0)', answer: loc.chip }, { label: 'Địa chỉ bên trong chip (thập phân hoặc hex)', answer: loc.internal }, { label: 'Ngõ ra Ȳ nào bằng 0? (số)', answer: loc.chip }],
        hint: `Chia địa chỉ cho số từ mỗi chip (${cw}). Thương là số chip, số dư là địa chỉ bên trong chip.`,
        solution: [`${hex(addr, d)} = ${addr} = ${bin(addr, m.externalAddr)}₂.`, `${m.selectLines} bit cao = ${bin(loc.chip, m.selectLines)}₂ = ${loc.chip} → chip ${loc.chip}, Ȳ${loc.chip} = 0.`, `${m.chip.addrLines} bit thấp = ${hex(loc.internal, 3)} = ${loc.internal}.`]
      };
    }
    function pBoth(cw, cm, tw, tm) {
      const total = C.log2Exact(tw / cw) !== null ? (tw / cw) * (tm / cm) : null;
      const k = C.log2Exact(tw / cw);
      return {
        title: `Ghép cả hai chiều: ${fmt(cw)} × ${cm} → ${fmt(tw)} × ${tm}`,
        text: `Dùng chip <b>${fmt(cw)} × ${cm}</b> để tạo module <b>${fmt(tw)} × ${tm}</b>.`,
        fields: [{ label: 'Số nhóm (theo số từ)', answer: tw / cw }, { label: 'Số chip mỗi nhóm (theo độ dài từ)', answer: tm / cm }, { label: 'Tổng số chip', answer: total, kind: 'chips' }, { label: 'Số đường địa chỉ module', answer: C.log2Exact(tw), kind: 'addrBits', ctx: { countValue: tw } }, { label: 'Số ngõ vào bộ giải mã', answer: k }],
        hint: 'Tách thành hai bước: ghép song song để đủ độ dài từ, rồi ghép nhiều nhóm để đủ số từ.',
        solution: [`Mỗi nhóm ${tm / cm} chip song song tạo ${fmt(cw)} × ${tm}.`, `Cần ${tw / cw} nhóm để có ${fmt(tw)} từ.`, `Tổng = ${tw / cw} × ${tm / cm} = ${total} chip.`, `Địa chỉ module ${C.log2Exact(tw)} đường; ${k} bit cao vào bộ giải mã ${k} → ${tw / cw}, mỗi ngõ ra nối CS của cả nhóm.`]
      };
    }
    const fixed = [
      () => pWords(4096, 8, 8192, 'Đề gốc slide 31: 4K × 8 → 8KB'),
      () => pCap(10, 16),
      () => pWords(2048, 8, 16384),
      () => pWidth(8192, 4, 16),
      () => pSelect(4096, 4, 0x2F10),
      () => pBoth(1024, 4, 4096, 8)
    ];
    const random = () => {
      const t = rnd(['w', 'c', 'wd', 's', 'b']);
      if (t === 'w') { const cw = rnd([1024, 2048, 4096, 8192]); const mult = rnd([2, 4, 8]); return pWords(cw, 8, cw * mult); }
      if (t === 'c') return pCap(rnd([8, 10, 11, 12, 14, 16]), rnd([1, 4, 8, 16]));
      if (t === 'wd') { const cm = rnd([1, 4, 8]); return pWidth(rnd([1024, 2048, 4096]), cm, cm * rnd([2, 4])); }
      if (t === 's') { const cw = rnd([1024, 2048, 4096]); const chips = rnd([2, 4, 8]); return pSelect(cw, chips, Math.floor(Math.random() * cw * chips)); }
      const cw = rnd([1024, 2048]), cm = rnd([4, 8]);
      return pBoth(cw, cm, cw * rnd([2, 4]), cm * 2);
    };
    L.practice($('#h-practice'), { fixed, random, intro: 'Nhập số thập phân, hoặc dạng 2^13, 8K, 0x1F. Đáp án được tính lại bằng công thức cho từng đề.' });
  }

  /* =======================================================================
     I. Tụ điện DRAM, mất nguồn và kênh nhớ
     ======================================================================= */
  function initI() {
    const refreshThreshold = 0.35;
    let powered = true, bit = 1, voltage = 1, cycles = 0;
    let animation = 'idle', frameId = 0, animationId = 0;

    function stopVoltageAnimation() {
      animationId++;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      animation = 'idle';
    }

    function drawDram(message, kind = 'addr') {
      const state = bit === null ? 'mất' : String(bit);
      const powerText = powered ? 'Nguồn đang cấp' : 'Nguồn đã ngắt';
      const percent = Math.round(voltage * 100);
      const meterY = 166 - voltage * 108;
      const meterHeight = voltage * 108;
      const chargeDots = Array.from({ length: Math.round(voltage * 5) }, (_, i) =>
        `<circle cx="${240 + i * 10}" cy="${i % 2 ? 99 : 84}" r="3.5" fill="var(--ctrl)"/>`).join('');
      const meterColor = voltage <= refreshThreshold ? 'var(--ctrl)' : 'var(--data)';
      let s = `<svg viewBox="0 0 540 220" role="img" aria-label="Ô DRAM, bit ${state}, điện áp mô hình ${percent} phần trăm, ${powerText.toLowerCase()}">`;
      s += `<rect class="box box--soft" x="14" y="12" width="512" height="196"/>`;
      s += `<text class="lbl-big" x="36" y="46">Ô nhớ DRAM</text>`;
      s += `<text class="lbl-sm" x="36" y="72">${powerText}</text>`;
      s += `<circle cx="62" cy="112" r="13" fill="${powered ? 'var(--ctrl)' : 'var(--rule)'}" stroke="var(--ink)" stroke-width="1.5"/>`;
      s += `<text class="lbl-mono" x="36" y="153">Vcc ${powered ? 'ON' : 'OFF'}</text>`;
      s += wire('w-ctrl', 'M76 112 H226', powered, !powered);
      if (powered) s += arrowHead(228, 112, 'r', 'dot');
      s += `<path d="M260 56 V82 M230 84 H290 M230 98 H290 M260 100 V132 M244 132 H276 M249 139 H271 M254 146 H266" fill="none" stroke="var(--ink)" stroke-width="2.5"/>`;
      s += chargeDots;
      s += `<text class="lbl" x="260" y="171" text-anchor="middle">Tụ điện</text>`;
      s += `<text class="lbl-mono ${bit === null ? 'lbl-err' : bit === 1 ? 'lbl-data' : 'lbl-addr'}" x="318" y="82">Bit lưu: ${state}</text>`;
      s += `<text class="lbl-sm" x="318" y="105">${bit === 1 ? 'Có điện tích' : bit === 0 ? 'Không tích điện' : 'Dữ liệu đã mất'}</text>`;
      s += `<rect x="402" y="58" width="32" height="108" fill="#fff" stroke="var(--ink)" stroke-width="1.5"/>`;
      s += `<rect x="403" y="${meterY}" width="30" height="${meterHeight}" fill="${meterColor}"/>`;
      s += `<path d="M397 ${166 - 108 * refreshThreshold} H439" fill="none" stroke="var(--ctrl)" stroke-width="2" stroke-dasharray="3 2"/>`;
      s += `<text class="lbl-sm" x="418" y="48" text-anchor="middle">100%</text><text class="lbl-sm" x="418" y="184" text-anchor="middle">0%</text>`;
      s += `<text class="lbl-mono" x="444" y="78">V = ${voltage.toFixed(2)}</text><text class="lbl-sm" x="444" y="99">(tương đối)</text>`;
      s += `<text class="lbl-sm lbl-ctrl" x="444" y="${166 - 108 * refreshThreshold + 4}">Ngưỡng</text></svg>`;
      $('#i-dram-fig').innerHTML = s;
      $('#i-power').textContent = powered ? 'Ngắt nguồn' : animation === 'powerOff' ? 'Đang xả tụ…' : 'Cấp nguồn';
      $('#i-power').disabled = animation === 'powerOff';
      $('#i-leak').disabled = !powered || bit !== 1 || animation !== 'idle';
      $('#i-write-0').disabled = !powered || animation === 'powerOff';
      $('#i-write-1').disabled = !powered || animation === 'powerOff';
      $('#i-refresh').disabled = !powered || bit === null || animation === 'refresh' || animation === 'powerOff';
      if (message) status($('#i-dram-state'), kind, message);
    }

    function animateVoltage(target, duration, kind, onComplete) {
      stopVoltageAnimation();
      animation = kind;
      drawDram();
      const id = animationId, start = voltage, startTime = performance.now();
      if (L.reduced) {
        voltage = target;
        animation = 'idle';
        drawDram();
        onComplete();
        return;
      }
      const tick = (now) => {
        if (id !== animationId) return;
        const progress = Math.min(1, (now - startTime) / duration);
        voltage = start + (target - start) * progress;
        drawDram();
        if (progress < 1) frameId = requestAnimationFrame(tick);
        else {
          frameId = 0;
          animation = 'idle';
          onComplete();
        }
      };
      frameId = requestAnimationFrame(tick);
    }

    $('#i-write-0').addEventListener('click', () => {
      stopVoltageAnimation(); bit = 0; voltage = 0;
      drawDram('Ghi bit 0: tụ được xả điện tích.', 'ok');
    });
    $('#i-write-1').addEventListener('click', () => {
      stopVoltageAnimation(); bit = 1; voltage = 1;
      drawDram('Ghi bit 1: nguồn nạp điện tích vào tụ.', 'ok');
    });
    $('#i-leak').addEventListener('click', () => {
      if (!powered || bit !== 1 || animation !== 'idle') return;
      drawDram('Tụ đang rò điện: điện áp sẽ giảm dần. Bấm Làm tươi để nạp lại trước khi chạm ngưỡng.', 'warn');
      animateVoltage(refreshThreshold, 5000, 'leak', () => {
        drawDram('Điện áp đã giảm đến ngưỡng mô phỏng; cần làm tươi để giữ bit 1.', 'warn');
      });
    });
    $('#i-refresh').addEventListener('click', () => {
      if (!powered || bit === null || animation === 'powerOff') return;
      if (bit === 0 || voltage >= 0.999) {
        drawDram(`Làm tươi duy trì bit ${bit}; tụ đã ở mức điện áp cần thiết.`, 'ok');
        return;
      }
      drawDram('Đang làm tươi: bộ điều khiển nạp lại điện tích vào tụ.', 'addr');
      animateVoltage(1, 1200, 'refresh', () => drawDram('Làm tươi hoàn tất: điện áp tụ đã được nạp lại.', 'ok'));
    });
    $('#i-power').addEventListener('click', () => {
      if (powered) {
        stopVoltageAnimation();
        powered = false; bit = null;
        drawDram('Ngắt nguồn: tụ bắt đầu phóng điện, điện áp giảm về 0 và dữ liệu mất.', 'warn');
        animateVoltage(0, 1800, 'powerOff', () => drawDram('Tụ đã phóng điện về 0. Cấp nguồn lại không khôi phục bit đã mất.', 'warn'));
      } else {
        stopVoltageAnimation();
        powered = true; voltage = 0; bit = null;
        drawDram('Đã cấp nguồn lại. Điện áp nguồn có lại nhưng dữ liệu cũ đã mất.', 'warn');
      }
    });
    drawDram('Bit 1 đang được giữ bằng điện tích. Chạy Mô phỏng tụ rò để thấy điện áp giảm.', 'addr');

    let ramFrameId = 0, ramAnimationId = 0;
    const singleSlots = [
      { x: 730, y: 101, data: 1 }, { x: 810, y: 101, data: 2 },
      { x: 730, y: 132, data: 3 }, { x: 810, y: 132, data: 4 }
    ];
    const dualSlots = [
      { x: 730, y: 244, data: 1 }, { x: 810, y: 244, data: 3 },
      { x: 730, y: 326, data: 2 }, { x: 810, y: 326, data: 4 }
    ];

    function stopRamAnimation() {
      ramAnimationId++;
      if (ramFrameId) cancelAnimationFrame(ramFrameId);
      ramFrameId = 0;
    }

    function drawRam(loadedSingle, loadedDual, packets) {
      let s = `<svg viewBox="0 0 920 380" role="img" aria-label="Dữ liệu D1 đến D4 được nạp vào một thanh RAM 16 GB tuần tự hoặc hai thanh RAM 8 GB đồng thời">`;
      s += `<text class="lbl" x="28" y="28">1 thanh 16 GB · 1 kênh</text>`;
      s += `<text class="lbl-sm" x="890" y="28" text-anchor="end">${cycles ? `CK${cycles}/4` : '1 phần / chu kỳ'}</text>`;
      s += `<rect class="box box--soft" x="28" y="72" width="145" height="72" rx="4"/>`;
      s += `<text class="lbl" x="100" y="101" text-anchor="middle">Bộ điều khiển</text>`;
      s += `<text class="lbl-sm" x="100" y="125" text-anchor="middle">gửi tuần tự</text>`;
      s += `<path class="w w-data" d="M173 108 H704"/>`;
      s += `<path d="M704 102 L716 108 L704 114 Z" fill="var(--data)"/>`;
      s += `<text class="lbl-sm lbl-data" x="440" y="98" text-anchor="middle">1 gói dữ liệu mỗi chu kỳ</text>`;
      s += `<rect class="box box--soft" x="718" y="62" width="174" height="104" rx="4"/>`;
      s += `<text class="lbl" x="805" y="83" text-anchor="middle">Thanh RAM 16 GB</text>`;
      singleSlots.forEach((slot) => {
        const loaded = slot.data <= loadedSingle;
        s += `<rect class="box ${loaded ? 'box--data' : 'box--soft'}" x="${slot.x}" y="${slot.y}" width="72" height="25" rx="2"/>`;
        s += `<text class="${loaded ? 'lbl-mono lbl-data' : 'lbl-sm'}" x="${slot.x + 36}" y="${slot.y + 17}" text-anchor="middle">${loaded ? `D${slot.data}` : 'trống'}</text>`;
      });

      s += `<path d="M20 184 H900" stroke="var(--rule)" stroke-dasharray="3 4"/>`;
      s += `<text class="lbl" x="28" y="208">2 thanh 8 GB · dual-channel</text>`;
      s += `<text class="lbl-sm" x="890" y="208" text-anchor="end">${cycles >= 2 ? 'hoàn tất tại CK2' : cycles ? 'CK1/2' : '2 phần đồng thời / chu kỳ'}</text>`;
      s += `<rect class="box box--soft" x="28" y="248" width="145" height="72" rx="4"/>`;
      s += `<text class="lbl" x="100" y="277" text-anchor="middle">Bộ điều khiển</text>`;
      s += `<text class="lbl-sm" x="100" y="301" text-anchor="middle">2 kênh độc lập</text>`;
      s += `<path class="w w-data" d="M173 284 H208 V257 H704 M208 284 V339 H704"/>`;
      s += `<path d="M704 251 L716 257 L704 263 Z M704 333 L716 339 L704 345 Z" fill="var(--data)"/>`;
      s += `<text class="lbl-sm lbl-data" x="440" y="247" text-anchor="middle">Kênh A</text>`;
      s += `<text class="lbl-sm lbl-data" x="440" y="329" text-anchor="middle">Kênh B</text>`;
      s += `<rect class="box box--soft" x="718" y="218" width="174" height="56" rx="4"/>`;
      s += `<text class="lbl" x="805" y="238" text-anchor="middle">RAM 8 GB A</text>`;
      s += `<rect class="box box--soft" x="718" y="300" width="174" height="56" rx="4"/>`;
      s += `<text class="lbl" x="805" y="320" text-anchor="middle">RAM 8 GB B</text>`;
      dualSlots.forEach((slot) => {
        const loaded = slot.data <= loadedDual;
        s += `<rect class="box ${loaded ? 'box--data' : 'box--soft'}" x="${slot.x}" y="${slot.y}" width="72" height="25" rx="2"/>`;
        s += `<text class="${loaded ? 'lbl-mono lbl-data' : 'lbl-sm'}" x="${slot.x + 36}" y="${slot.y + 17}" text-anchor="middle">${loaded ? `D${slot.data}` : 'trống'}</text>`;
      });
      packets.forEach((packet) => {
        s += `<g id="i-ram-packet-${packet.id}" transform="translate(${packet.startX} ${packet.y})"><circle r="17" fill="var(--data)" stroke="#fff" stroke-width="2"/><text class="lbl-mono lbl-on" y="5" text-anchor="middle" font-size="12">D${packet.data}</text></g>`;
      });
      s += `</svg>`;
      $('#i-ram-fig').innerHTML = s;
    }

    function updateRamSummary(singleLoaded, dualLoaded, moving) {
      if (!cycles) {
        status($('#i-ram-summary'), 'addr', 'Bấm Chạy hoặc Bước tiếp để xem D1–D4 được nạp vào các thanh RAM.');
      } else if (moving) {
        status($('#i-ram-summary'), 'addr',
          `CK${cycles}: đang nạp ${cycles <= 4 ? `D${cycles} vào thanh 16 GB` : ''}${cycles <= 2 ? `; đồng thời D${cycles * 2 - 1} và D${cycles * 2} vào hai thanh 8 GB` : '; hai thanh 8 GB đã nạp đủ sau CK2'}.`);
      } else {
        const dualResult = dualLoaded === 4 ? '2×8 GB đã hoàn tất từ CK2' : `2×8 GB đã nạp ${dualLoaded}/4 phần`;
        const singleResult = singleLoaded === 4 ? '1×16 GB đã hoàn tất ở CK4' : `1×16 GB đã nạp ${singleLoaded}/4 phần`;
        const faster = dualLoaded === 4 && singleLoaded < 4
          ? ` Còn ${4 - singleLoaded} chu kỳ nữa để 1×16 GB hoàn tất; 2×8 GB dùng một nửa số chu kỳ trong mô hình này.`
          : singleLoaded === 4 ? ' Cùng 4 phần dữ liệu: 2 chu kỳ thay vì 4, tức một nửa thời gian mô phỏng.'
            : '';
        status($('#i-ram-summary'), singleLoaded === 4 ? 'ok' : 'addr',
          `Sau CK${cycles}: ${singleResult}; ${dualResult}.${faster}`);
      }
    }

    function animateRamPackets(packets, onComplete) {
      stopRamAnimation();
      const id = ramAnimationId;
      if (!packets.length || L.reduced) {
        onComplete();
        return;
      }
      const started = performance.now(), duration = 1050;
      const tick = (now) => {
        if (id !== ramAnimationId) return;
        const progress = Math.min(1, (now - started) / duration);
        packets.forEach((packet) => {
          const x = packet.startX + (packet.endX - packet.startX) * progress;
          const node = document.getElementById(`i-ram-packet-${packet.id}`);
          if (node) node.setAttribute('transform', `translate(${x} ${packet.y})`);
        });
        if (progress < 1) ramFrameId = requestAnimationFrame(tick);
        else {
          ramFrameId = 0;
          onComplete();
        }
      };
      ramFrameId = requestAnimationFrame(tick);
    }

    const steps = [
      { label: 'CK1 · 1×16 GB nạp D1; hai kênh đồng thời nạp D1 vào RAM A và D2 vào RAM B.' },
      { label: 'CK2 · 1×16 GB nạp D2 (mới 2/4); hai thanh 8 GB nạp D3 và D4, hoàn tất 4/4.' },
      { label: 'CK3 · 1×16 GB nạp D3 (3/4); 2×8 GB đã hoàn tất từ CK2.' },
      { label: 'CK4 · 1×16 GB nạp D4 và hoàn tất. Cùng workload: dual-channel dùng nửa số chu kỳ trong giả định này.' }
    ];
    new L.StepPlayer($('#i-ram-player'), {
      steps,
      onStep: (i) => {
        stopRamAnimation();
        cycles = Math.max(0, i + 1);
        if (!cycles) {
          drawRam(0, 0, []);
          updateRamSummary(0, 0, false);
          return;
        }
        const singleBefore = Math.min(cycles - 1, 4), singleAfter = Math.min(cycles, 4);
        const dualBefore = Math.min((cycles - 1) * 2, 4), dualAfter = Math.min(cycles * 2, 4);
        const packets = [];
        if (singleAfter > singleBefore) {
          packets.push({ id: `single-${cycles}`, data: cycles, startX: 190, endX: 690, y: 108 });
        }
        for (let data = dualBefore + 1; data <= dualAfter; data++) {
          packets.push({
            id: `dual-${data}`, data, startX: 190, endX: 690,
            y: data % 2 ? 257 : 339
          });
        }
        drawRam(singleBefore, dualBefore, packets);
        updateRamSummary(singleBefore, dualBefore, true);
        animateRamPackets(packets, () => {
          drawRam(singleAfter, dualAfter, []);
          updateRamSummary(singleAfter, dualAfter, false);
        });
      }
    });
  }

  /* ---------- Khởi tạo ---------- */
  const inits = { 'sec-a': M.initA, 'sec-b': M.initB, 'sec-c': M.initC, 'sec-d': initD, 'sec-e': initE, 'sec-f': initF, 'sec-g': initG, 'sec-h': initH, 'sec-i': initI };
  Object.entries(inits).forEach(([id, fn]) => { L.onShow[id] = (first) => { if (first) fn(); }; });
  L.initPage(M.INFO);
})();
