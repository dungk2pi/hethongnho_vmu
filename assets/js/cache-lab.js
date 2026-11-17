/* =========================================================================
   cache-lab.js — Trang "Bộ nhớ Cache và ánh xạ" (slide 35–52)
   ========================================================================= */
(function () {
  'use strict';
  const C = window.Calc, L = window.Lab, $ = L.$;
  const hex = (v, d) => C.toHex(v, d), bin = (v, b) => C.toBin(v, b);
  const wire = (cls, d, live, dim) => `<path class="w ${cls}${live ? ' live' : ''}${dim ? ' dim' : ''}" d="${d}"/>`;
  const arrow = (x, y, dir) => {
    const p = { r: `${x},${y} ${x - 8},${y - 5} ${x - 8},${y + 5}`, l: `${x},${y} ${x + 8},${y - 5} ${x + 8},${y + 5}`, d: `${x},${y} ${x - 5},${y - 8} ${x + 5},${y - 8}`, u: `${x},${y} ${x - 5},${y + 8} ${x + 5},${y + 8}` }[dir];
    return `<polygon points="${p}" class="dot"/>`;
  };
  const status = (kind, html) => `<div class="status status--${kind}">${html}</div>`;
  const num = (v) => Number(v).toLocaleString('vi-VN');
  const MISS = { cold: 'miss lần đầu', conflict: 'conflict miss (xung đột)', replacement: 'miss do Block đã bị thay ra' };

  /** Thanh trường địa chỉ: [Tag][Line/Set][Offset] với độ rộng tỉ lệ số bit */
  function fieldBar(f, opts = {}) {
    const offName = opts.offName || 'Offset';
    const parts = [['Tag', f.tag, '#E2E8EB', opts.tagVal], ...(f.index ? [[f.indexName, f.index, '#DCEAF1', opts.idxVal]] : []), [offName, f.offset, '#D9EEE8', opts.offVal]];
    return `<div class="fieldbar" role="img" aria-label="${parts.map((p) => `${p[0]} ${p[1]} bit`).join(', ')}">${parts.map(([n, b, c, v]) => `<div style="flex:${Math.max(b, 2)};background:${c}"><b>${n}</b>${b} bit${v !== undefined ? `<div class="mono">${v}</div>` : ''}</div>`).join('')}</div>`;
  }

  /* =======================================================================
     Nội dung bảng giải thích
     ======================================================================= */
  const INFO = {
    'sec-a': {
      title: 'Cache là gì', en: 'Cache memory',
      what: 'Cache là thành phần nhớ trong sơ đồ phân cấp bộ nhớ, đứng trung gian giữa CPU và bộ nhớ chính.',
      why: 'CPU nhanh hơn bộ nhớ chính rất nhiều. Cache giữ một phần dữ liệu đang dùng ở chỗ CPU lấy được nhanh.',
      how: '<ul><li>Nhỏ hơn bộ nhớ chính.</li><li>Nhanh hơn bộ nhớ chính.</li><li>Giá mỗi bit đắt hơn.</li><li>Hệ thống cũ đặt cache ngoài CPU; hệ thống hiện đại tích hợp trong CPU.</li></ul>',
      see: 'Kích thước các hộp chỉ thể hiện quan hệ lớn/nhỏ, không theo tỉ lệ thật.',
      try: 'Đổi sang “Hệ thống cũ” để thấy cache nằm trên bo mạch, ngoài CPU.',
      check: { q: 'Phát biểu nào đúng về cache so với bộ nhớ chính?', opts: ['Lớn hơn và rẻ hơn', 'Nhỏ hơn, nhanh hơn, đắt hơn mỗi bit', 'Chậm hơn nhưng lớn hơn', 'Giống hệt, chỉ khác vị trí'], ans: 1, why: 'Slide 35: cache nhỏ, nhanh hơn bộ nhớ chính và chi phí mỗi bit đắt hơn.' },
      terms: [['Cache', 'cache memory', 'Bộ nhớ đệm tốc độ cao.'], ['Bộ nhớ chính', 'main memory', 'RAM, lớn hơn và chậm hơn cache.'], ['Phân cấp bộ nhớ', 'memory hierarchy', 'Thanh ghi → cache → bộ nhớ chính → bộ nhớ ngoài.']]
    },
    'sec-b': {
      title: 'Vì sao cache có ích', en: 'Performance and cost benefits',
      what: 'Phần lớn truy cập được cache trả lời. Chỉ khi trượt (miss) CPU mới phải chờ bộ nhớ chính.',
      why: 'Thời gian truy cập trung bình của cả hệ thống gần bằng thời gian truy cập cache, trong khi phần lớn dung lượng vẫn là bộ nhớ chính rẻ tiền.',
      how: '<p class="formula">t<sub>tb</sub> = h × t<sub>c</sub> + (1 − h) × (t<sub>c</sub> + t<sub>m</sub>)</p><p>h là tỷ lệ hit. Mô hình đơn giản: khi miss phải hỏi cache rồi mới đến bộ nhớ chính.</p>',
      see: 'Mỗi ô vuông là một lần truy cập. Ô xanh là hit, ô đỏ có chữ M là miss.',
      try: 'Kéo tỷ lệ hit về 0%: hệ thống có cache còn chậm hơn, vì mỗi lần đều mất thêm t<sub>c</sub>.',
      check: { q: 'Hai hệ thống có cùng chi phí. Theo slide 36, hệ thống nào nhanh hơn?', opts: ['Hệ thống không có cache', 'Hệ thống có cache', 'Như nhau', 'Không xác định'], ans: 1, why: 'Cùng chi phí thì hệ thống có cache nhanh hơn; cùng hiệu năng thì hệ thống có cache rẻ hơn.' },
      extra: '<p class="note">Các thời gian t<sub>c</sub>, t<sub>m</sub> là số minh họa do bạn nhập, không phải thông số của phần cứng cụ thể.</p>'
    },
    'sec-c': {
      title: 'Tính cục bộ', en: 'Locality of reference: spatial and temporal',
      what: '<p><b>Không gian:</b> vừa dùng một vị trí thì sắp dùng các vị trí gần đó.</p><p><b>Thời gian:</b> vừa dùng một vị trí thì sắp dùng lại chính vị trí đó.</p>',
      why: 'Nhờ hai tính chất này, việc nạp cả Block và giữ dữ liệu vừa dùng giúp các truy cập sau trúng cache.',
      how: '<ul><li>Lệnh và mảng thường đi tuần tự → cache nạp cả khối xung quanh.</li><li>Vòng lặp dùng lại biến và lệnh → giữ lại thứ vừa dùng.</li></ul>',
      see: 'Tab không gian: một miss kéo theo ba hit. Tab thời gian: biến lặp lại thì hit.',
      try: 'Ở tab thời gian, nhập “A A A A” rồi “A B C D E”. So sánh tỷ lệ hit.',
      check: { q: 'Duyệt mảng a[0], a[1], a[2]… chủ yếu nhờ tính cục bộ nào?', opts: ['Thời gian', 'Không gian', 'Cả hai như nhau', 'Không cái nào'], ans: 1, why: 'Các phần tử nằm liền nhau, được nạp cùng một Block.' },
      terms: [['Cục bộ không gian', 'spatial locality', 'Dùng dữ liệu ở gần.'], ['Cục bộ thời gian', 'temporal locality', 'Dùng lại dữ liệu vừa dùng.']],
      extra: '<p class="note">Cache mẫu ở đây chứa 2 Block và thay Block vào sớm nhất (FIFO) khi đầy. Đây là giả định của mô phỏng, slide không quy định.</p>'
    },
    'sec-d': {
      title: 'Thao tác trên cache', en: 'Cache read operation',
      what: 'CPU đưa ra địa chỉ một ô nhớ trong bộ nhớ chính. Cache kiểm tra xem có đang giữ dữ liệu đó không.',
      why: 'Hit thì trả nhanh. Miss thì phải đọc cả Block từ bộ nhớ chính vào cache trước.',
      how: '<ol style="padding-left:18px;margin:0"><li>CPU gửi địa chỉ.</li><li>Cache so Tag.</li><li>Hit: trả dữ liệu cho CPU.</li><li>Miss: nạp Block chứa dữ liệu vào cache, rồi chuyển dữ liệu cho CPU.</li></ol><p class="formula">Tỷ lệ hit = số hit ÷ tổng số truy cập × 100%</p>',
      see: 'CPU ↔ Cache chở <b>một từ</b>. Cache ↔ bộ nhớ chính chở <b>cả Block</b>.',
      try: 'Chạy chuỗi 13, 14, 15, 30, 13. Từ 14 và 15 trúng vì cùng Block với 13.',
      check: { q: 'Khi miss, cache đọc gì từ bộ nhớ chính?', opts: ['Chỉ đúng một từ CPU cần', 'Cả Block chứa từ đó', 'Toàn bộ bộ nhớ', 'Không đọc gì'], ans: 1, why: 'Cache trao đổi với bộ nhớ chính theo từng khối (Block).' },
      extra: '<p class="note"><b>Ghi chú nguồn.</b> Slide 38 và 39 có cùng nội dung, nên phần này dạy quy trình một lần.</p>'
    },
    'sec-e': {
      title: 'Cấu trúc cache', en: 'Blocks, Lines and Tags',
      what: '<p><b>Bộ nhớ chính:</b> 2<sup>n</sup> ô, chia thành M Block, mỗi Block K từ: M = 2<sup>n</sup>/K.</p><p><b>Cache:</b> m Line, mỗi Line chứa đúng một Block, kèm các bit Tag.</p>',
      why: 'Vì m ≪ M, mỗi Line lần lượt chứa nhiều Block khác nhau. Tag cho biết Line đang giữ Block nào.',
      how: 'Block là một nhóm trong bộ nhớ chính. Line là một chỗ chứa trong cache. Tag là thông tin nhận diện Block đang nằm trong Line.',
      see: 'Đường nối từ Block được chọn tới Line đang chứa nó.',
      try: 'Nạp hai Block khác nhau vào cùng một Line: Block sau thay Block trước, Tag đổi theo.',
      check: { q: 'Bộ nhớ có 2⁸ ô, mỗi Block 4 ô. M bằng bao nhiêu?', opts: ['4', '32', '64', '256'], ans: 2, why: 'M = 2⁸ / 4 = 256 / 4 = 64.' },
      terms: [['Block', 'block', 'Khối K từ liên tiếp trong bộ nhớ chính.'], ['Line', 'cache line', 'Một ô chứa của cache, vừa đúng một Block.'], ['Tag', 'tag', 'Bit nhận diện Block đang ở trong Line.'], ['Ánh xạ', 'mapping', 'Quy tắc quyết định Block được vào Line nào.']],
      extra: '<p class="note">Ký hiệu m, M, K, n chỉ có nghĩa trong phần này. Ở phần ánh xạ tập hợp, chữ p là số Line mỗi Set; ở bài tập, N là độ rộng địa chỉ.</p>'
    },
    'sec-f': {
      title: 'Ánh xạ trực tiếp', en: 'Direct mapping',
      what: 'Mỗi Block chỉ ánh xạ vào đúng một Line.',
      why: 'Chỉ cần so sánh một Tag, nên mạch đơn giản và rẻ.',
      how: '<p class="formula">B<sub>j</sub> → L<sub>j mod m</sub></p><p>Địa chỉ chia thành Tag | Line | Word. Trường Line chọn thẳng Line; Tag dùng để so sánh.</p>',
      see: 'Mỗi Block chỉ có một đường nối sang cache. Bật “Hiện mọi liên kết” để thấy cả bảng ánh xạ.',
      try: 'Chạy B0 → B4 → B0. Lần thứ ba vẫn miss vì B4 đã chiếm Line 0.',
      check: { q: 'Cache 4 Line. Block B9 vào Line nào?', opts: ['L0', 'L1', 'L2', 'L3'], ans: 1, why: '9 mod 4 = 1.' },
      terms: [['Conflict miss', 'conflict miss', 'Miss do Block cần đã bị Block khác cùng Line đẩy ra, dù cache vẫn còn Line trống.'], ['Valid', 'valid bit', 'Cho biết Line đã có dữ liệu chưa (V).']],
      extra: '<p class="note">Theo slide 44: bộ so sánh đơn giản, giá rẻ, nhưng hai Block cùng Line dùng xen kẽ sẽ miss liên tục. Không có nghĩa ánh xạ trực tiếp luôn có tỷ lệ hit thấp hơn với mọi chương trình.</p>'
    },
    'sec-g': {
      title: 'Ánh xạ hoàn toàn', en: 'Fully associative mapping',
      what: 'Mỗi Block có thể nạp vào bất kỳ Line nào của cache.',
      why: 'Không còn xung đột vì vị trí cố định; cache chỉ phải thay khi đã đầy.',
      how: '<p>Địa chỉ chỉ có Tag và Word, không có trường Line. Muốn biết Block có trong cache không, phải so Tag với <b>tất cả</b> Line cùng lúc.</p>',
      see: 'Mỗi Line có một bộ so sánh “=”. Ô xanh là trùng, ô đỏ là khác, ô xám là Line trống.',
      try: 'Chạy B0 B4 B8 B0: B0 không bị đẩy ra như ở ánh xạ trực tiếp.',
      check: { q: 'Vì sao ánh xạ hoàn toàn cần mạch phức tạp?', opts: ['Vì Tag ngắn hơn', 'Vì phải so sánh Tag với mọi Line đồng thời', 'Vì Block lớn hơn', 'Vì cần bộ giải mã Line'], ans: 1, why: 'Block có thể nằm ở bất kỳ đâu, nên cần một bộ so sánh cho mỗi Line.' },
      extra: '<p class="note"><b>* FIFO</b> là giả định riêng của mô phỏng khi cache đầy. Slide không dạy chính sách thay thế.</p><p class="note"><b>Ghi chú nguồn.</b> Bảng ở slide 45 ghi địa chỉ 16 bit gồm Tag 5 bit và Word 11 bit. Với cùng ví dụ 16 bit của slide 43 (Block 16 từ), đúng ra là Tag 12 bit, Word 4 bit.</p>'
    },
    'sec-h': {
      title: 'Ánh xạ tập hợp', en: 'Set associative mapping',
      what: 'Các Line chia thành các Set, mỗi Set gồm p Line (p đường, p-way). Block ánh xạ cố định vào một Set nhưng được vào Line bất kỳ trong Set đó.',
      why: 'Dung hòa: chỉ so sánh p Tag (ít hơn ánh xạ hoàn toàn), mà vẫn tránh được nhiều xung đột (tốt hơn ánh xạ trực tiếp).',
      how: '<p class="formula">Số Set S = số Line ÷ p</p><p class="formula">Set = j mod S</p><p>Địa chỉ: Tag | Set | Word. Way <b>không</b> có trong địa chỉ; nó được tìm bằng so sánh Tag.</p>',
      see: 'Set được chọn có khung đậm. Chỉ các Line trong Set đó được so sánh.',
      try: 'Đặt 1-way: giống ánh xạ trực tiếp. Đặt 8-way: giống ánh xạ hoàn toàn.',
      check: { q: '8 Line, 4-way. Block B6 vào Set nào?', opts: ['Set 0', 'Set 1', 'Set 2', 'Set 6'], ans: 0, why: 'S = 8 ÷ 4 = 2; 6 mod 2 = 0.' },
      extra: '<p class="note"><b>Ghi chú nguồn.</b> Slide 47 viết B<sub>j</sub> → Set (j mod p), trong khi p là số Line trong một Set. Công thức nhất quán là Set = j mod S, với S là số Set. Danh sách “Set 0: B₁, B₂, B<sub>p−1</sub>” trong slide cũng cần đọc lại theo quy tắc này.</p><p class="note"><b>* FIFO</b> là giả định của mô phỏng khi Set đầy.</p>'
    },
    'sec-i': {
      title: 'Thước đo địa chỉ', en: 'Address field dissection',
      what: 'Địa chỉ nhị phân được cắt thành các nhóm bit liên tiếp: Tag, Line (hoặc Set), Offset.',
      why: 'Phần cứng cache không chia số; nó chỉ nối các dây bit vào đúng chỗ. Cắt bit chính là phép chia cho lũy thừa của 2.',
      how: '<p class="formula">Block = ⌊Địa chỉ ÷ kích thước Block⌋</p><p class="formula">Line = Block mod số Line</p><p class="formula">Tag = ⌊Block ÷ số Line⌋</p><p>Với ánh xạ tập hợp, thay số Line bằng số Set.</p>',
      see: 'Các số thập phân bên dưới thước được đọc trực tiếp từ nhóm bit, và trùng với kết quả của phép chia.',
      try: 'Tăng địa chỉ thêm 1 rồi thêm 32: lần đầu chỉ Offset đổi, lần sau Line đổi.',
      check: { q: 'Trong ánh xạ hoàn toàn, vì sao không có trường Line?', opts: ['Vì địa chỉ ngắn', 'Vì Block được vào bất kỳ Line nào, không có Line cố định để chọn', 'Vì Tag đã chứa Offset', 'Vì cache không có Line'], ans: 1, why: 'Không có vị trí cố định, nên toàn bộ số Block trở thành Tag.' }
    },
    'sec-j': {
      title: 'Bài tập trường địa chỉ', en: 'Address-field calculation',
      what: 'Tìm số bit của Tag, Line/Set và Offset cho ba kiểu ánh xạ.',
      why: 'Đây là dạng bài chính của phần cache trong slide 49–52.',
      how: '<ol style="padding-left:18px;margin:0"><li>N = log₂(dung lượng bộ nhớ chính).</li><li>Offset = log₂(kích thước Line).</li><li>Số Line = cache ÷ Line.</li><li>Trực tiếp: Line = log₂(số Line).</li><li>Tập hợp: Set = log₂(số Line ÷ p).</li><li>Tag = N − các trường còn lại.</li></ol>',
      try: 'Đổi số liệu đề rồi bấm Tính lại: mọi bước được tính lại.',
      check: { q: 'Cache 256KB, Line 32 byte có bao nhiêu Line?', opts: ['2¹³', '2¹⁸', '2⁵', '2¹¹'], ans: 0, why: '2¹⁸ ÷ 2⁵ = 2¹³ = 8192 Line.' },
      extra: '<p class="note">Bài 4GB giả định bộ nhớ đánh địa chỉ theo byte và 1KB = 2¹⁰ byte, đúng như slide.</p>'
    },
    'sec-k': {
      title: 'Tự luyện', en: 'Practice',
      what: 'Các đề cùng dạng với slide 43 và 49–52, kèm đề ngẫu nhiên luôn hợp lệ.',
      how: 'Gõ số thập phân, hoặc dạng 2^13, 8K, 0x1F. Đáp án được tính lại cho từng đề, không so với chuỗi cố định.',
      try: 'Khi sai, đọc thông báo dưới ô: nó cho biết bạn nhầm số Line với số Set, quên trừ Offset hay nhầm đơn vị.',
      check: { q: '1MB, cache 16KB, Line 16 byte, 2-way: số Set?', opts: ['1024', '512', '2048', '16'], ans: 1, why: '16KB ÷ 16 = 1024 Line; 1024 ÷ 2 = 512 Set.' }
    }
  };

  /* =======================================================================
     A. Cache là gì (slide 35)
     ======================================================================= */
  function drawA(mode) {
    const modern = mode === 'modern';
    let s = `<svg viewBox="0 0 780 270" role="img" aria-label="CPU, cache và bộ nhớ chính">`;
    if (modern) {
      s += `<rect x="16" y="22" width="356" height="206" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="7 5"/><text class="lbl" x="28" y="44">Chip CPU</text>`;
      s += `<rect class="box" x="40" y="80" width="120" height="96"/><text class="lbl" x="100" y="122" text-anchor="middle">Lõi CPU</text><text class="lbl-sm" x="100" y="140" text-anchor="middle">thanh ghi</text>`;
      s += `<rect class="box box--addr" x="230" y="96" width="112" height="64"/><text class="lbl-big" x="286" y="134" text-anchor="middle">Cache</text>`;
    } else {
      s += `<rect x="16" y="56" width="176" height="144" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="7 5"/><text class="lbl" x="28" y="76">Chip CPU</text>`;
      s += `<rect class="box" x="40" y="88" width="120" height="96"/><text class="lbl" x="100" y="130" text-anchor="middle">Lõi CPU</text><text class="lbl-sm" x="100" y="148" text-anchor="middle">thanh ghi</text>`;
      s += `<rect class="box box--addr" x="250" y="96" width="112" height="64"/><text class="lbl-big" x="306" y="134" text-anchor="middle">Cache</text><text class="lbl-sm" x="306" y="182" text-anchor="middle">trên bo mạch</text>`;
    }
    const cx = modern ? 342 : 362, c0 = modern ? 230 : 250;
    s += wire('w-data', `M160 128 H${c0 - 4}`, true) + arrow(c0 - 2, 128, 'r');
    s += `<text class="lbl-sm" x="${(160 + c0) / 2}" y="118" text-anchor="middle">từng từ</text><text class="lbl lbl-data" x="${(160 + c0) / 2}" y="152" text-anchor="middle">nhanh</text>`;
    s += wire('w-data', `M${cx} 128 H466`, false) + arrow(468, 128, 'r');
    const mxl = modern ? 421 : (cx + 470) / 2;
    s += `<text class="lbl-sm" x="${mxl}" y="118" text-anchor="middle">từng Block</text><text class="lbl lbl-ctrl" x="${mxl}" y="152" text-anchor="middle">chậm hơn</text>`;
    s += `<rect class="box box--soft" x="470" y="22" width="292" height="206"/><text class="lbl-big" x="616" y="120" text-anchor="middle">Bộ nhớ chính</text><text class="lbl-sm" x="616" y="142" text-anchor="middle">lớn hơn nhiều, chậm hơn, rẻ hơn mỗi bit</text>`;
    for (let i = 0; i < 9; i++) s += `<path d="M486 ${44 + i * 20} H746" stroke="var(--rule-soft)"/>`;
    s += `<text class="lbl-sm" x="390" y="258" text-anchor="middle">Kích thước hộp chỉ thể hiện quan hệ lớn/nhỏ, không theo tỉ lệ thật.</text></svg>`;
    $('#a-fig').innerHTML = s;
  }
  function initA() {
    L.seg($('#a-mode'), [{ value: 'modern', label: 'Hệ thống hiện đại: cache trong CPU' }, { value: 'old', label: 'Hệ thống cũ: cache ngoài CPU' }], 'modern', drawA);
    drawA('modern');
    $('#a-facts').innerHTML = `<div class="zone"><h3>Đặc điểm theo slide 35</h3><table class="tbl"><tbody>
      <tr><td class="left">Vị trí</td><td class="left">Trung gian giữa CPU và bộ nhớ chính</td></tr>
      <tr><td class="left">Hệ thống cũ</td><td class="left">Ngoài CPU; thường 16K, 32K… 128K</td></tr>
      <tr><td class="left">Hệ thống mới</td><td class="left">Trong CPU; 256K, 512K, 1MB, 2MB…</td></tr>
      <tr><td class="left">Tốc độ</td><td class="left">Nhanh hơn bộ nhớ chính</td></tr>
      <tr><td class="left">Chi phí mỗi bit</td><td class="left">Đắt hơn bộ nhớ chính</td></tr></tbody></table></div>
      <div class="zone"><h3>So sánh tương đối</h3><table class="tbl"><thead><tr><th class="left"></th><th>Thanh ghi</th><th>Cache</th><th>Bộ nhớ chính</th></tr></thead><tbody>
      <tr><td class="left">Dung lượng</td><td>nhỏ nhất</td><td>nhỏ</td><td>lớn</td></tr>
      <tr><td class="left">Tốc độ</td><td>nhanh nhất</td><td>nhanh</td><td>chậm hơn</td></tr>
      <tr><td class="left">Giá mỗi bit</td><td>cao nhất</td><td>cao</td><td>thấp hơn</td></tr></tbody></table>
      <p class="caption">Theo sơ đồ phân cấp bộ nhớ (slide 4–5): xuống càng sâu, dung lượng tăng, tốc độ và giá mỗi bit giảm.</p></div>`;
  }

  /* =======================================================================
     B. Lợi ích (slide 36)
     ======================================================================= */
  function initB() {
    const draw = () => {
      const n = Math.max(1, Math.min(200, Math.floor(Number($('#b-n').value)) || 1));
      const h = Number($('#b-h').value), tc = Math.max(0, Number($('#b-tc').value) || 0), tm = Math.max(0, Number($('#b-tm').value) || 0);
      $('#b-hv').textContent = h + '%';
      const t = C.timingCompare({ accesses: n, hitPercent: h, tCache: tc, tMem: tm });
      // phân bố miss đều trong chuỗi
      const miss = [];
      let acc = 0;
      for (let i = 0; i < n; i++) { const before = Math.round(acc); acc += t.misses / n; miss.push(Math.round(acc) > before); }
      const W = 760, max = Math.max(t.noCache, t.withCache, 1), barW = (v) => Math.max(2, (v / max) * 520);
      const cells = Math.min(n, 60), cw = 520 / cells;
      let s = `<svg viewBox="0 0 ${W} 250" role="img" aria-label="So sánh tổng thời gian">`;
      s += `<text class="lbl" x="0" y="36">Không có cache</text><rect x="200" y="20" width="${barW(t.noCache)}" height="26" fill="var(--ink-2)"/><text class="lbl-mono" x="${206 + barW(t.noCache)}" y="38">${num(t.noCache)}</text>`;
      for (let i = 0; i < cells; i++) s += `<rect x="${200 + i * cw}" y="54" width="${cw - 1.5}" height="14" fill="#C9D5DA"/>`;
      s += `<text class="lbl-sm" x="0" y="66">mọi lần đều ra RAM</text>`;
      s += `<text class="lbl" x="0" y="126">Có cache</text><rect x="200" y="110" width="${barW(t.withCache)}" height="26" fill="var(--data)"/><text class="lbl-mono" x="${206 + barW(t.withCache)}" y="128">${num(t.withCache)}</text>`;
      for (let i = 0; i < cells; i++) {
        const m = miss[i];
        s += `<rect x="${200 + i * cw}" y="144" width="${cw - 1.5}" height="14" fill="${m ? 'var(--err)' : 'var(--data-soft)'}" stroke="${m ? 'none' : 'var(--data)'}" stroke-width=".8"/>`;
        if (m && cw >= 9) s += `<text x="${200 + i * cw + cw / 2 - 0.7}" y="155" text-anchor="middle" style="font:700 9px var(--f-mono);fill:#fff">M</text>`;
      }
      s += `<text class="lbl-sm" x="0" y="156">${t.hits} hit, ${t.misses} miss</text>`;
      if (n > cells) s += `<text class="lbl-sm" x="200" y="176">Hiển thị ${cells} lần truy cập đầu.</text>`;
      s += `<text class="lbl" x="0" y="214">Thời gian trung bình mỗi lần</text><text class="lbl-mono" x="200" y="214">không cache: ${num(tm)}   có cache: ${num(+t.avg.toFixed(2))}   (t cache = ${num(tc)})</text>`;
      s += `<text class="lbl-sm" x="0" y="240">Tổng có cache = ${t.hits} × ${tc} + ${t.misses} × (${tc} + ${tm}) = ${num(t.withCache)}. Đơn vị thời gian minh họa.</text></svg>`;
      $('#b-fig').innerHTML = s;
    };
    ['#b-n', '#b-h', '#b-tc', '#b-tm'].forEach((q) => $(q).addEventListener('input', draw));
    draw();
    $('#b-cost').innerHTML = `<div class="zone"><h3>Nâng cao hiệu năng</h3><ul><li>Cân bằng tốc độ nhanh của CPU và tốc độ chậm của bộ nhớ chính.</li><li>Giảm số lần CPU truy cập trực tiếp bộ nhớ chính.</li><li>Thời gian truy cập trung bình gần bằng thời gian truy cập cache.</li></ul></div>
      <div class="zone"><h3>Giảm chi phí sản xuất</h3><table class="tbl"><tbody><tr><td class="left">Cùng hiệu năng</td><td class="left">Hệ thống có cache rẻ hơn</td></tr><tr><td class="left">Cùng chi phí</td><td class="left">Hệ thống có cache nhanh hơn</td></tr></tbody></table></div>`;
  }

  /* =======================================================================
     C. Tính cục bộ (slide 37)
     ======================================================================= */
  function initC() {
    L.tabs($('#c-tabs'));
    // --- Không gian: duyệt a[0..15], Block 4 từ, cache 2 Block
    const N = 16, K = 4;
    function replay(upto) {
      const sim = new C.CacheSim({ mapping: 'full', lines: 2 });
      const res = [];
      for (let i = 0; i <= upto; i++) res.push(sim.access(Math.floor(i / K)));
      return { sim, res };
    }
    function drawS(i) {
      const { sim, res } = i >= 0 ? replay(i) : { sim: new C.CacheSim({ mapping: 'full', lines: 2 }), res: [] };
      const cw = 44, x0 = 20;
      let s = `<svg viewBox="0 0 760 250" role="img" aria-label="Duyệt mảng tuần tự">`;
      s += `<text class="lbl" x="${x0}" y="20">Bộ nhớ chính: mảng a[0…15]</text>`;
      const inCache = new Set(sim.store[0].filter((e) => e.valid).map((e) => e.block));
      for (let k = 0; k < N; k++) {
        const x = x0 + k * cw + Math.floor(k / K) * 6, b = Math.floor(k / K);
        const cur = k === i, loaded = inCache.has(b);
        s += `<rect class="box ${cur ? 'box--on' : loaded ? 'box--addr' : ''}" x="${x}" y="54" width="${cw - 2}" height="34"/><text class="lbl-mono ${cur ? 'lbl-on' : ''}" x="${x + cw / 2 - 1}" y="76" text-anchor="middle">a[${k}]</text>`;
        if (res[k]) s += `<text class="lbl-mono ${res[k].hit ? 'tag-hit' : 'lbl-err'}" x="${x + cw / 2 - 1}" y="106" text-anchor="middle" style="fill:${res[k].hit ? 'var(--data)' : 'var(--err)'}">${res[k].hit ? 'H' : 'M'}</text>`;
        if (k % K === 0) s += `<path class="w w-ink" d="M${x} 44 v-6 h${K * cw - 2} v6"/><text class="lbl-sm" x="${x + (K * cw) / 2}" y="34" text-anchor="middle">Block ${b}</text>`;
      }
      if (i >= 0) {
        const x = x0 + i * cw + Math.floor(i / K) * 6 + cw / 2 - 1;
        s += `<text class="lbl" x="${x}" y="128" text-anchor="middle">CPU đọc</text>` + arrow(x, 112, 'u');
      }
      s += `<text class="lbl" x="${x0}" y="164">Cache (2 Line, mỗi Line 1 Block = 4 từ)</text>`;
      sim.store[0].forEach((e, w) => {
        const y = 176 + w * 34;
        s += `<rect class="box box--soft" x="${x0}" y="${y}" width="80" height="28"/><text class="lbl-sm" x="${x0 + 8}" y="${y + 19}">Line ${w}</text>`;
        for (let k = 0; k < K; k++) {
          const x = x0 + 86 + k * cw;
          s += `<rect class="box ${e.valid ? 'box--addr' : ''}" x="${x}" y="${y}" width="${cw - 2}" height="28"/><text class="lbl-mono" x="${x + cw / 2 - 1}" y="${y + 19}" text-anchor="middle">${e.valid ? `a[${e.block * K + k}]` : ''}</text>`;
        }
      });
      const last = res[i];
      if (last) s += `<text class="lbl" x="420" y="196">${last.hit ? `Hit: a[${i}] đã có sẵn trong Block ${last.block}` : `Miss: nạp cả Block ${last.block} (a[${last.block * K}]…a[${last.block * K + K - 1}])`}</text>`;
      s += `</svg>`;
      $('#cs-fig').innerHTML = s;
      const h = res.filter((r) => r.hit).length;
      $('#cs-out').innerHTML = res.length ? status('ok', `${res.length} lần đọc: ${h} hit, ${res.length - h} miss, tỷ lệ hit ${C.hitRate(h, res.length).toFixed(0)}%. Mỗi miss nạp 4 phần tử liền nhau, nên 3 lần đọc sau trúng cache.`) : '';
    }
    new L.StepPlayer($('#cs-player'), { steps: Array.from({ length: N }, (_, i) => ({ label: `Đọc a[${i}]` })), onStep: drawS, interval: 900, listHost: document.createElement('div') });
    // --- Thời gian: chuỗi biến
    let seq = [];
    function drawT(i) {
      const names = [...new Set(seq)];
      const sim = new C.CacheSim({ mapping: 'full', lines: 2 });
      const res = seq.map((v) => sim.access(names.indexOf(v)));
      const cols = Math.max(seq.length, 1), cw = Math.min(70, 720 / cols);
      let s = `<svg viewBox="0 0 760 210" role="img" aria-label="Dòng thời gian truy cập">`;
      s += `<text class="lbl-sm" x="0" y="40">Truy cập</text><text class="lbl-sm" x="0" y="76">Kết quả</text><text class="lbl-sm" x="0" y="116">Cache sau</text><path class="w w-ink" d="M70 182 H750"/>`;
      // dựng lại trạng thái sau mỗi bước
      const sim2 = new C.CacheSim({ mapping: 'full', lines: 2 });
      seq.forEach((v, k) => {
        const r = sim2.access(names.indexOf(v));
        const x = 74 + k * cw, on = k <= i;
        s += `<rect class="box ${k === i ? 'box--on' : ''}" x="${x}" y="20" width="${cw - 6}" height="30" style="opacity:${on ? 1 : 0.35}"/><text class="lbl-big ${k === i ? 'lbl-on' : ''}" x="${x + cw / 2 - 3}" y="42" text-anchor="middle" style="opacity:${on ? 1 : 0.35}">${v}</text>`;
        if (on) {
          s += `<text class="lbl" x="${x + cw / 2 - 3}" y="80" text-anchor="middle" style="fill:${r.hit ? 'var(--data)' : 'var(--err)'}">${r.hit ? 'Hit' : 'Miss'}</text>`;
          sim2.store[0].forEach((e, w) => {
            s += `<rect class="box ${e.valid ? 'box--addr' : ''}" x="${x}" y="${96 + w * 32}" width="${cw - 6}" height="26"/><text class="lbl-mono" x="${x + cw / 2 - 3}" y="${114 + w * 32}" text-anchor="middle">${e.valid ? names[e.block] : ''}</text>`;
          });
        }
        s += `<path d="M${x + cw / 2 - 3} 178 V186" stroke="var(--ink)"/><text class="lbl-sm" x="${x + cw / 2 - 3}" y="202" text-anchor="middle">t${k + 1}</text>`;
      });
      s += `</svg>`;
      $('#ct-fig').innerHTML = s;
      const done = res.slice(0, i + 1), h = done.filter((r) => r.hit).length;
      $('#ct-out').innerHTML = done.length ? status('ok', `${done.length} lần truy cập: ${h} hit. Mỗi lần một biến được dùng lại khi còn trong cache, đó là cục bộ về thời gian. Không có gì “ở gần” được nạp thêm ở đây.`) : '';
    }
    const playerT = new L.StepPlayer($('#ct-player'), { steps: [], onStep: drawT, interval: 900, listHost: document.createElement('div') });
    const load = () => {
      seq = $('#ct-seq').value.trim().toUpperCase().split(/[\s,]+/).filter(Boolean).slice(0, 14);
      $('#ct-seq').setAttribute('aria-invalid', seq.length ? 'false' : 'true');
      playerT.setSteps(seq.map((v, k) => ({ label: `t${k + 1}: đọc ${v}` })));
    };
    $('#ct-load').addEventListener('click', load);
    load();
  }

  /* =======================================================================
     D. Quy trình truy cập (slide 38–39)
     ======================================================================= */
  function initD() {
    const K = 4, LINES = 4, f = C.cacheFields({ memUnits: 64, cacheUnits: LINES * K, blockUnits: K, mapping: 'direct' });
    const sim = new C.CacheSim({ mapping: 'direct', lines: LINES });
    const snap = () => sim.store.map((s) => ({ ...s[0] }));
    let cur = null, step = -1, queue = [];
    const log = [];
    function draw() {
      const store = cur ? (step >= 2 && !cur.r.hit ? cur.after : cur.before) : snap();
      const sp = cur ? cur.sp : null;
      let s = `<svg viewBox="0 0 660 270" role="img" aria-label="CPU, cache 4 Line và bộ nhớ chính 16 Block">`;
      s += `<rect class="box ${cur && step >= 0 ? 'box--soft' : ''}" x="10" y="70" width="104" height="110"/><text class="lbl-big" x="62" y="104" text-anchor="middle">CPU</text>`;
      if (sp) {
        s += `<text class="lbl-sm" x="62" y="126" text-anchor="middle">địa chỉ ${cur.addr}</text>`;
        s += `<text class="lbl-mono" x="62" y="146" text-anchor="middle"><tspan style="fill:#4C5E66">${sp.tagBin}</tspan> <tspan class="lbl-addr">${sp.idxBin}</tspan> <tspan class="lbl-data">${sp.offBin}</tspan></text>`;
        s += `<text class="lbl-sm" x="62" y="164" text-anchor="middle">Tag Line Word</text>`;
      }
      // cache
      s += `<text class="lbl" x="232" y="40">Cache (ánh xạ trực tiếp)</text>`;
      s += `<text class="lbl-sm" x="232" y="60">Line</text><text class="lbl-sm" x="268" y="60">V</text><text class="lbl-sm" x="290" y="60">Tag</text><text class="lbl-sm" x="330" y="60">Dữ liệu (4 từ)</text>`;
      store.forEach((e, i) => {
        const y = 68 + i * 40, on = sp && sp.index === i && step >= 1;
        const res = on && step >= 1 ? (cur.r.hit ? 'box--data' : step >= 2 ? 'box--addr' : 'box--err') : '';
        s += `<rect class="box ${res}" x="226" y="${y}" width="236" height="34" style="${on ? 'stroke-width:2.6' : ''}"/>`;
        s += `<text class="lbl-mono" x="236" y="${y + 22}">L${i}</text><text class="lbl-mono" x="268" y="${y + 22}">${e.valid ? 1 : 0}</text><text class="lbl-mono" x="290" y="${y + 22}">${e.valid ? bin(e.tag, 2) : '—'}</text>`;
        s += `<text class="lbl-mono" x="330" y="${y + 22}">${e.valid ? `w${e.block * K}…w${e.block * K + 3} (B${e.block})` : 'trống'}</text>`;
      });
      // bộ nhớ chính
      s += `<text class="lbl" x="560" y="40" text-anchor="middle">Bộ nhớ chính</text>`;
      for (let b = 0; b < 16; b++) {
        const y = 50 + b * 13.2, on = sp && sp.block === b && step >= 2 && !cur.r.hit;
        s += `<rect class="box ${on ? 'box--on' : 'box--soft'}" x="512" y="${y}" width="96" height="12" style="stroke-width:1"/><text x="560" y="${y + 9.5}" text-anchor="middle" style="font:600 9.5px var(--f-mono);fill:${on ? '#fff' : 'var(--ink)'}">B${b}: w${b * 4}–w${b * 4 + 3}</text>`;
      }
      // chuyển dữ liệu
      const toCPU = cur && ((cur.r.hit && step >= 2) || (!cur.r.hit && step >= 3));
      s += wire('w-addr', 'M114 100 H224', cur && step >= 0) + arrow(224, 100, 'r') + `<text class="lbl-sm lbl-addr" x="120" y="92">địa chỉ</text>`;
      s += wire('w-data', 'M224 150 H118', toCPU) + arrow(116, 150, 'l');
      if (toCPU) s += `<rect x="146" y="158" width="52" height="20" fill="var(--data)"/><text x="172" y="172" text-anchor="middle" style="font:700 11px var(--f-body);fill:#fff">1 từ</text>`;
      const loadBlk = cur && !cur.r.hit && step >= 2;
      s += wire('w-data', 'M510 150 H466', loadBlk) + arrow(464, 150, 'l');
      if (loadBlk) s += `<rect x="466" y="158" width="44" height="34" fill="var(--data)"/><text x="488" y="172" text-anchor="middle" style="font:700 10px var(--f-body);fill:#fff">Block</text><text x="488" y="185" text-anchor="middle" style="font:700 10px var(--f-body);fill:#fff">4 từ</text>`;
      s += `</svg>`;
      $('#d-fig').innerHTML = s;
      // lưu đồ
      const node = (x, y, w, t, on, shape) => shape === 'd'
        ? `<polygon points="${x + w / 2},${y} ${x + w},${y + 22} ${x + w / 2},${y + 44} ${x},${y + 22}" class="box ${on ? 'box--ctrl' : ''}"/><text class="lbl-sm" x="${x + w / 2}" y="${y + 26}" text-anchor="middle" style="fill:var(--ink)">${t}</text>`
        : `<rect class="box ${on ? 'box--ctrl' : ''}" x="${x}" y="${y}" width="${w}" height="40"/><text class="lbl-sm" x="${x + w / 2}" y="${y + 25}" text-anchor="middle" style="fill:var(--ink)">${t}</text>`;
      const hit = cur && cur.r.hit;
      let fl = `<svg viewBox="0 0 660 130" role="img" aria-label="Lưu đồ truy cập cache">`;
      fl += node(4, 44, 130, 'CPU gửi địa chỉ', step === 0) + arrow(152, 66, 'r') + `<path class="w w-ink" d="M134 66 H150"/>`;
      fl += node(154, 44, 150, 'Có trong cache?', step === 1, 'd');
      fl += `<path class="w w-ink" d="M304 66 H340 V22 H486"/>` + arrow(488, 22, 'r') + `<text class="lbl-sm" x="346" y="16">Có: hit</text>`;
      fl += `<path class="w w-ink" d="M229 88 V108 H354"/>` + arrow(356, 108, 'r') + `<text class="lbl-sm" x="250" y="124">Không: miss</text>`;
      fl += node(358, 88, 170, 'Nạp Block từ bộ nhớ chính', !hit && step === 2);
      fl += `<path class="w w-ink" d="M528 108 H560 V46"/>` + arrow(560, 44, 'u');
      fl += node(490, 2, 160, 'Trả dữ liệu cho CPU', (hit && step === 2) || (!hit && step === 3));
      fl += `</svg>`;
      $('#d-flow').innerHTML = fl;
    }
    function stats() {
      const t = sim.accesses;
      $('#d-stats').innerHTML = `<div class="kv"><div><span>Truy cập</span><b>${t}</b></div><div><span>Hit</span><b class="tag-hit">${sim.hits}</b></div><div><span>Miss</span><b class="tag-miss">${sim.misses}</b></div><div><span>Tỷ lệ hit</span><b>${C.hitRate(sim.hits, t).toFixed(1)}%</b></div></div>
        <p class="formula" style="margin-top:6px">${sim.hits} ÷ ${t || 0} × 100% = ${C.hitRate(sim.hits, t).toFixed(1)}%</p>
        ${log.length ? `<table class="tbl" style="margin-top:8px"><thead><tr><th>#</th><th>Địa chỉ</th><th>Block</th><th>Line</th><th>Kết quả</th></tr></thead><tbody>${log.slice(-6).map((r) => `<tr><td>${r.k}</td><td class="mono">${r.addr}</td><td>B${r.block}</td><td>L${r.line}</td><td class="${r.hit ? 'tag-hit' : 'tag-miss'}">${r.hit ? 'Hit' : 'Miss'}</td></tr>`).join('')}</tbody></table>` : ''}`;
    }
    const player = new L.StepPlayer($('#d-player'), { steps: [{ label: 'Nhập địa chỉ rồi bấm Truy cập' }], interval: 1300, onStep: (i) => {
      step = i; draw();
      if (cur && i === player.steps.length - 1 && !cur.logged) {
        cur.logged = true;
        log.push({ k: log.length + 1, addr: cur.addr, block: cur.r.block, line: cur.r.line, hit: cur.r.hit });
        stats();
        if (queue.length) setTimeout(() => { access(queue.shift()); player.play(); }, L.reduced ? 200 : 900);
      }
    } });
    function access(addr) {
      const before = snap();
      const sp = C.splitAddress(addr, f);
      const r = sim.access(sp.block);
      cur = { addr, sp, r, before, after: snap(), logged: false };
      const tagNote = before[sp.index].valid ? `Line ${sp.index} có V = 1, Tag ${bin(before[sp.index].tag, 2)}` : `Line ${sp.index} trống (V = 0)`;
      const steps = [{ label: `CPU gửi địa chỉ ${addr} = ${sp.bin}: Tag ${sp.tagBin}, Line ${sp.idxBin}, Word ${sp.offBin}` },
        { label: `Cache xem Line ${sp.index}: ${tagNote}. So với Tag ${sp.tagBin}: ${r.hit ? 'trùng → hit' : 'không trùng → miss'}` }];
      if (r.hit) steps.push({ label: `Hit: cache trả từ w${addr} cho CPU` });
      else steps.push({ label: `Miss: đọc cả Block ${sp.block} (w${sp.block * K}…w${sp.block * K + 3}) vào Line ${sp.index}${r.evicted !== null ? `, thay B${r.evicted}` : ''}` }, { label: `Chuyển từ w${addr} từ cache đến CPU` });
      player.setSteps(steps);
    }
    $('#d-go').addEventListener('click', () => {
      const v = C.parseAddress($('#d-addr').value, 6);
      $('#d-addr').setAttribute('aria-invalid', v.error ? 'true' : 'false');
      if (v.error) return;
      queue = []; access(v.value); player.play();
    });
    $('#d-seq').addEventListener('click', () => { queue = [14, 15, 30, 13]; access(13); player.play(); });
    $('#d-reset').addEventListener('click', () => { sim.reset(); log.length = 0; cur = null; queue = []; player.setSteps([{ label: 'Nhập địa chỉ rồi bấm Truy cập' }]); stats(); draw(); });
    stats(); draw();
  }

  /* =======================================================================
     E. Cấu trúc cache (slide 40–41)
     ======================================================================= */
  function initE() {
    let lines = [];
    function cfg() { return { n: Number($('#e-n').value), K: Number($('#e-k').value), m: Number($('#e-m').value) }; }
    function draw(selJ) {
      const { n, K, m } = cfg(), M = 2 ** n / K;
      $('#e-tb').textContent = `M = ${M}`; $('#e-tb2').textContent = `m = ${m}`;
      $('#e-kv').innerHTML = `<div><span>Số ô bộ nhớ chính</span><b>2<sup>${n}</sup> = ${2 ** n}</b></div><div><span>Kích thước Block K</span><b>${K} từ</b></div><div><span>Số Block M = 2<sup>n</sup>/K</span><b>${2 ** n}/${K} = ${M}</b></div><div><span>Số Line m</span><b>${m}</b></div><div><span>m ≪ M</span><b>${m} so với ${M}</b></div>`;
      let s = `<svg viewBox="0 0 780 ${Math.max(340, m * 34 + 80)}" role="img" aria-label="Cache ${m} Line và bộ nhớ chính ${M} Block">`;
      s += `<text class="lbl" x="20" y="24">Cache</text><text class="lbl-sm" x="20" y="48">Line</text><text class="lbl-sm" x="76" y="48">Tag</text><text class="lbl-sm" x="176" y="48">Block (${K} từ)</text>`;
      const lineY = (i) => 58 + i * 34;
      for (let i = 0; i < m; i++) {
        const e = lines[i], on = e !== undefined && e === selJ;
        s += `<rect class="box box--soft" x="20" y="${lineY(i)}" width="48" height="30"/><text class="lbl-mono" x="44" y="${lineY(i) + 20}" text-anchor="middle">L${i}</text>`;
        s += `<rect class="box" x="70" y="${lineY(i)}" width="100" height="30" style="fill:#E2E8EB"/><text class="lbl-sm" x="120" y="${lineY(i) + 20}" text-anchor="middle" style="fill:var(--ink)">${e !== undefined ? `nhận diện B${e}` : '—'}</text>`;
        s += `<rect class="box ${on ? 'box--addr' : ''}" x="172" y="${lineY(i)}" width="200" height="30"/><text class="lbl-mono" x="272" y="${lineY(i) + 20}" text-anchor="middle">${e !== undefined ? `B${e}: ô ${e * K}…${e * K + K - 1}` : 'trống'}</text>`;
      }
      // bộ nhớ chính dạng cửa sổ
      const rows = [];
      const set = [...new Set([0, 1, M - 1, Math.max(0, selJ - 1), selJ, Math.min(M - 1, selJ + 1)])].sort((a, b) => a - b);
      set.forEach((v, i) => { if (i && v - set[i - 1] > 1) rows.push(null); rows.push(v); });
      s += `<text class="lbl" x="520" y="24">Bộ nhớ chính (${M} Block)</text>`;
      const rowH = 34, bY = (i) => 40 + i * rowH;
      rows.forEach((b, i) => {
        if (b === null) { s += `<text class="lbl" x="620" y="${bY(i) + 20}" text-anchor="middle">⋮</text>`; return; }
        const on = b === selJ;
        s += `<rect class="box ${on ? 'box--on' : ''}" x="520" y="${bY(i) + 2}" width="200" height="${rowH - 4}"/><text class="lbl-mono ${on ? 'lbl-on' : ''}" x="530" y="${bY(i) + 22}">B${b}</text><text class="lbl-sm ${on ? 'lbl-on' : ''}" x="712" y="${bY(i) + 22}" text-anchor="end">địa chỉ ${b * K}…${b * K + K - 1}</text>`;
      });
      s += `<text class="lbl-sm" x="520" y="${bY(rows.length) + 16}">Địa chỉ cuối: 2<tspan baseline-shift="super" font-size="9">${n}</tspan> − 1 = ${2 ** n - 1}</text>`;
      const li = lines.indexOf(selJ);
      if (li >= 0) {
        const sy = bY(rows.indexOf(selJ)) + rowH / 2;
        s += wire('w-data', `M520 ${sy} C460 ${sy} 430 ${lineY(li) + 15} 374 ${lineY(li) + 15}`, true) + arrow(374, lineY(li) + 15, 'l');
      }
      s += `</svg>`;
      $('#e-fig').innerHTML = s;
    }
    const reset = () => {
      const { n, K, m } = cfg(), M = 2 ** n / K;
      lines = new Array(m).fill(undefined);
      $('#e-line').innerHTML = Array.from({ length: m }, (_, i) => `<option value="${i}">L${i}</option>`).join('');
      const j = Math.min(Number($('#e-j').value) || 0, M - 1);
      $('#e-j').value = j; draw(j);
    };
    const curJ = () => {
      const { n, K } = cfg(), M = 2 ** n / K;
      const v = Number($('#e-j').value);
      const ok = Number.isInteger(v) && v >= 0 && v < M && $('#e-j').value.trim() !== '';
      $('#e-j').setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok ? v : null;
    };
    ['#e-n', '#e-k', '#e-m'].forEach((q) => $(q).addEventListener('change', reset));
    $('#e-j').addEventListener('input', () => { const j = curJ(); if (j !== null) draw(j); });
    $('#e-load').addEventListener('click', () => {
      const j = curJ(); if (j === null) return;
      const li = Number($('#e-line').value);
      lines = lines.map((x) => (x === j ? undefined : x));
      lines[li] = j; draw(j);
    });
    reset();
    $('#e-map').innerHTML = `<table class="tbl"><thead><tr><th class="left">Kỹ thuật</th><th class="left">Block j được vào</th><th class="left">Trường địa chỉ</th><th class="left">Số Tag phải so sánh</th><th class="left">Phần cứng</th></tr></thead><tbody>
      <tr><td class="left"><a href="#sec-f">Trực tiếp</a></td><td class="left">Đúng Line j mod m</td><td class="left">Tag | Line | Word</td><td class="left">1</td><td class="left">Đơn giản, rẻ</td></tr>
      <tr><td class="left"><a href="#sec-g">Hoàn toàn</a></td><td class="left">Bất kỳ Line nào</td><td class="left">Tag | Word</td><td class="left">Tất cả m Line</td><td class="left">Phức tạp nhất</td></tr>
      <tr><td class="left"><a href="#sec-h">Tập hợp</a></td><td class="left">Line bất kỳ trong Set j mod S</td><td class="left">Tag | Set | Word</td><td class="left">p Line trong Set</td><td class="left">Trung gian</td></tr></tbody></table>`;
  }

  window.CacheLab = { INFO, initA, initB, initC, initD, initE, fieldBar, wire, arrow, status, num, MISS, hex, bin };
})();

/* ===== Phần 2: ba phòng thử ánh xạ, thước đo địa chỉ, bài tập, tự luyện ===== */
(function () {
  'use strict';
  const C = window.Calc, L = window.Lab, $ = L.$;
  const X = window.CacheLab;
  const { fieldBar, wire, arrow, status, num, MISS, hex, bin } = X;

  /* =======================================================================
     F, G, H. Phòng thử ánh xạ dùng chung một bộ vẽ
     ======================================================================= */
  const BLOCKS = 16, K = 4;
  const NAMES = { direct: 'trực tiếp', full: 'hoàn toàn', set: 'tập hợp' };
  function mappingLab(host, mode, opts) {
    const st = { lines: opts.lines, ways: opts.ways || 1, sel: opts.sel || 0, last: null, pref: null, showAll: false, queue: [], timer: null, log: [] };
    let sim;
    const f = () => C.cacheFields({ memUnits: BLOCKS * K, cacheUnits: st.lines * K, blockUnits: K, mapping: mode, ways: st.ways });
    host.innerHTML = `
      <div class="controls">
        <label class="field">Block<select data-k="blk">${Array.from({ length: BLOCKS }, (_, i) => `<option value="${i}">B${i}</option>`).join('')}</select></label>
        <button type="button" class="btn btn--solid" data-k="go">Truy cập Block</button>
        ${mode === 'set' ? `<label class="field">Số way p<select data-k="ways">${[1, 2, 4, 8].map((w) => `<option ${w === st.ways ? 'selected' : ''}>${w}</option>`).join('')}</select></label>` : ''}
        ${mode === 'direct' ? `<label class="field" style="flex-direction:row;align-items:center;gap:6px;height:36px"><input type="checkbox" data-k="all" style="width:18px;height:18px"> Hiện mọi liên kết</label>` : ''}
        <button type="button" class="btn btn--ghost" data-k="clear">Xóa cache</button>
      </div>
      <div class="controls" style="margin-top:8px">
        <label class="field" style="flex:1;min-width:200px">Chuỗi truy cập<input data-k="seq" value="${opts.presets[0][1]}" style="width:100%"></label>
        <button type="button" class="btn" data-k="run">Chạy chuỗi</button>
        <button type="button" class="btn" data-k="one">Bước tiếp</button>
      </div>
      <div class="controls" style="margin-top:6px">${opts.presets.map((p, i) => `<button type="button" class="btn btn--ghost" data-p="${i}">${p[0]}</button>`).join('')}</div>
      <div class="stage stage--split" style="margin-top:10px">
        <div class="figure figure--grid" data-k="fig"></div>
        <div><div data-k="side" aria-live="polite"></div><div data-k="stats" style="margin-top:10px"></div></div>
      </div>
      <div class="zone zone--quiet" style="margin-top:12px"><h3>Nhật ký truy cập</h3><div class="tbl-wrap" data-k="log"></div></div>
      ${opts.after || ''}`;
    const K$ = (k) => $(`[data-k=${k}]`, host);

    function geometry() {
      const pos = [];
      if (mode === 'set') {
        const S = st.lines / st.ways;
        let y = 74;
        for (let s = 0; s < S; s++) {
          for (let w = 0; w < st.ways; w++) { pos.push({ y, h: 32, set: s, way: w }); y += 36; }
          y += 16;
        }
      } else {
        for (let i = 0; i < st.lines; i++) pos.push({ y: 80 + i * 70, h: 52, set: mode === 'direct' ? i : 0, way: mode === 'direct' ? 0 : i });
      }
      return pos;
    }
    function destLines(b) {
      if (mode === 'direct') return [b % st.lines];
      if (mode === 'full') return Array.from({ length: st.lines }, (_, i) => i);
      const S = st.lines / st.ways, s = b % S;
      return Array.from({ length: st.ways }, (_, w) => s * st.ways + w);
    }
    function draw() {
      const pos = geometry();
      const MX = 8, MW = 136, CX = 318, CW = 254, CMP = 292;
      const H = Math.max(440, pos[pos.length - 1].y + 50);
      const by = (b) => 46 + b * 24;
      const last = st.last;
      let s = `<svg viewBox="0 0 ${CX + CW + 26} ${H}" role="img" aria-label="Ánh xạ ${NAMES[mode]}: ${BLOCKS} Block, ${st.lines} Line">`;
      s += `<text class="lbl" x="${MX}" y="28">Bộ nhớ chính</text><text class="lbl" x="${CX}" y="28">Cache</text>`;
      s += `<text class="lbl-sm" x="${CX + 6}" y="58">${mode === 'set' ? 'Way' : 'Line'}</text><text class="lbl-sm" x="${CX + 50}" y="58">V</text><text class="lbl-sm" x="${CX + 72}" y="58">Tag</text><text class="lbl-sm" x="${CX + 160}" y="58">Block</text>`;
      const curve = (b, li, cls) => { const y1 = by(b) + 11, y2 = pos[li].y + pos[li].h / 2, x1 = MX + MW, x2 = CX - 2, mx = (x1 + x2) / 2; return `<path class="w ${cls}" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`; };
      if (mode === 'direct' && st.showAll) for (let b = 0; b < BLOCKS; b++) s += curve(b, b % st.lines, 'w-faint');
      destLines(st.sel).forEach((li) => { s += curve(st.sel, li, last && last.block === st.sel && last.line === li ? 'w-addr live' : 'w-addr dim'); });
      for (let b = 0; b < BLOCKS; b++) {
        const on = b === st.sel, inC = sim.store.some((row) => row.some((e) => e.valid && e.block === b));
        s += `<g class="clickable" data-b="${b}"><rect class="box ${on ? 'box--on' : inC ? 'box--addr' : ''}" x="${MX}" y="${by(b)}" width="${MW}" height="22"/>`;
        s += `<text class="lbl-mono ${on ? 'lbl-on' : ''}" x="${MX + 7}" y="${by(b) + 16}">B${b}</text><text class="lbl-sm ${on ? 'lbl-on' : ''}" x="${MX + MW - 6}" y="${by(b) + 16}" text-anchor="end">từ ${b * K}–${b * K + K - 1}</text></g>`;
      }
      if (mode === 'set') {
        const S = st.lines / st.ways;
        for (let k = 0; k < S; k++) {
          const g = pos.filter((p) => p.set === k), y0 = g[0].y - 6, y1 = g[g.length - 1].y + g[g.length - 1].h + 6;
          const on = k === st.sel % S;
          s += `<rect x="${CX - 4}" y="${y0}" width="${CW + 6}" height="${y1 - y0}" fill="none" stroke="var(--ink)" stroke-width="${on ? 2.6 : 1}" stroke-dasharray="${on ? 'none' : '4 4'}"/>`;
          s += `<text class="lbl" x="${CX + CW + 16}" y="${(y0 + y1) / 2}" transform="rotate(90 ${CX + CW + 16} ${(y0 + y1) / 2})" text-anchor="middle">Set ${k}</text>`;
        }
      }
      const store = sim.store;
      pos.forEach((p, li) => {
        const e = store[p.set][p.way];
        const isRes = last && last.line === li;
        const cls = isRes ? (last.hit ? 'box--data' : 'box--addr') : '';
        const pref = mode === 'full' && st.pref === li;
        s += `<g class="${mode === 'full' ? 'clickable' : ''}" data-l="${li}"><rect class="box ${cls}" x="${CX}" y="${p.y}" width="${CW - 4}" height="${p.h}" style="${isRes ? 'stroke-width:2.8' : ''}${pref ? ';stroke:var(--ctrl);stroke-width:3;stroke-dasharray:6 4' : ''}"/>`;
        const ty = p.y + p.h / 2 + 5;
        s += `<text class="lbl-mono" x="${CX + 6}" y="${ty}">${mode === 'set' ? `W${p.way}` : `L${li}`}</text>`;
        s += `<text class="lbl-mono" x="${CX + 50}" y="${ty}">${e.valid ? 1 : 0}</text>`;
        s += `<rect x="${CX + 68}" y="${p.y + 5}" width="80" height="${p.h - 10}" fill="#E2E8EB" stroke="var(--rule)"/><text class="lbl-mono" x="${CX + 108}" y="${ty}" text-anchor="middle">${e.valid ? bin(e.tag, f().tag) : '—'}</text>`;
        s += `<text class="lbl-mono" x="${CX + 160}" y="${ty}">${e.valid ? `B${e.block}` : 'trống'}</text>`;
        if (mode === 'set') s += `<text class="lbl-sm" x="${CX + CW - 10}" y="${ty}" text-anchor="end">L${li}</text>`;
        if (pref) s += `<text class="lbl-sm lbl-ctrl" x="${CX + CW - 10}" y="${ty}" text-anchor="end">nạp vào đây</text>`;
        s += `</g>`;
      });
      if (last) {
        const cmpLines = last.comparisons.map((c) => mode === 'set' ? last.set * st.ways + c.way : mode === 'direct' ? last.set : c.way);
        const ys = cmpLines.map((li) => pos[li].y + pos[li].h / 2), top = Math.max(4, Math.min(...ys) - 70);
        s += `<rect class="box box--ctrl" x="${CMP - 56}" y="${top}" width="84" height="42"/><text class="lbl-sm" x="${CMP - 14}" y="${top + 17}" text-anchor="middle" style="fill:var(--ink)">Tag yêu cầu</text><text class="lbl-mono" x="${CMP - 14}" y="${top + 35}" text-anchor="middle">${bin(last.tag, f().tag)}</text>`;
        s += `<path class="w w-ctrl" d="M${CMP} ${top + 42} V${Math.max(...ys)}"/>`;
        last.comparisons.forEach((c, k) => {
          const y = ys[k];
          const fill = !c.valid ? '#E5EAEC' : c.match ? 'var(--data-soft)' : 'var(--err-soft)';
          const stroke = !c.valid ? 'var(--ink-3)' : c.match ? 'var(--data)' : 'var(--err)';
          s += `<path d="M${CMP} ${y} H${CX - 2}" stroke="${stroke}" stroke-width="1.6"/><circle cx="${CMP}" cy="${y}" r="11" style="fill:${fill};stroke:${stroke};stroke-width:1.8"/><text x="${CMP}" y="${y + 5}" text-anchor="middle" style="font:700 14px var(--f-mono);fill:${stroke}">${!c.valid ? '∅' : c.match ? '=' : '≠'}</text>`;
        });
      }
      s += `</svg>`;
      K$('fig').innerHTML = s;
      side();
    }
    function side() {
      const ff = f(), b = st.sel, sp = C.splitAddress(b * K, ff);
      let dest;
      if (mode === 'direct') dest = `${b} mod ${st.lines} = <b>Line ${b % st.lines}</b>. Không có lựa chọn khác.`;
      else if (mode === 'full') dest = `<b>Bất kỳ Line nào</b> trong ${st.lines} Line. Địa chỉ không có trường Line.`;
      else { const S = st.lines / st.ways, k = b % S; dest = `S = ${st.lines} ÷ ${st.ways} = ${S} Set. ${b} mod ${S} = <b>Set ${k}</b>, rồi vào Line trống bất kỳ trong ${st.ways} Line của Set (L${k * st.ways}–L${k * st.ways + st.ways - 1}).`; }
      let h = `<div class="zone"><h3>Block B${b} đi đâu?</h3><p style="margin:0">${dest}</p>
        <p class="caption" style="margin-top:8px">Địa chỉ từ đầu tiên của B${b} là ${b * K} = ${sp.bin}₂ (mô hình 64 từ, Block 4 từ):</p>
        ${fieldBar(ff, { offName: 'Word', tagVal: sp.tagBin, idxVal: sp.idxBin, offVal: sp.offBin })}</div>`;
      const l = st.last;
      if (l) {
        let m = l.hit ? `<b class="tag-hit">Hit.</b> B${l.block} đang ở ${mode === 'set' ? `Set ${l.set}, way ${l.way}` : `Line ${l.line}`}.`
          : `<b class="tag-miss">Miss</b> (${MISS[l.missType]}). Nạp B${l.block} vào ${mode === 'set' ? `Set ${l.set}, way ${l.way}` : `Line ${l.line}`}.`;
        if (l.evicted !== null) m += ` B${l.block} <b>thay thế</b> B${l.evicted}${mode === 'direct' ? ' vì cả hai cùng ánh xạ vào Line này' : ' (FIFO: Block vào sớm nhất bị thay)'}.`;
        const nCmp = l.comparisons.length;
        m += ` Đã so sánh ${nCmp} Tag.`;
        h += status(l.hit ? 'ok' : l.missType === 'conflict' ? 'err' : 'warn', m);
      }
      K$('side').innerHTML = h;
      K$('stats').innerHTML = `<div class="kv"><div><span>Truy cập</span><b>${sim.accesses}</b></div><div><span>Hit</span><b class="tag-hit">${sim.hits}</b></div><div><span>Miss</span><b class="tag-miss">${sim.misses}</b></div><div><span>Tỷ lệ hit</span><b>${sim.hitRate.toFixed(0)}%</b></div></div>`;
      K$('log').innerHTML = st.log.length ? `<table class="tbl"><thead><tr><th>#</th><th>Block</th><th>${mode === 'set' ? 'Set' : mode === 'direct' ? 'Line' : 'Line được dùng'}</th><th>Tag</th><th>Kết quả</th><th class="left">Ghi chú</th></tr></thead><tbody>${st.log.slice(-8).map((r) => `<tr><td>${r.k}</td><td>B${r.block}</td><td>${mode === 'set' ? r.set : r.line}</td><td class="mono">${bin(r.tag, f().tag)}</td><td class="${r.hit ? 'tag-hit' : 'tag-miss'}">${r.hit ? 'Hit' : 'Miss'}</td><td class="left">${r.hit ? '' : MISS[r.missType] + (r.evicted !== null ? `, thay B${r.evicted}` : '')}</td></tr>`).join('')}</tbody></table>` : '<p class="caption">Chưa có truy cập. Chọn một Block rồi bấm Truy cập Block, hoặc chạy một chuỗi.</p>';
    }
    function access(b) {
      st.sel = b; K$('blk').value = b;
      const r = sim.access(b, mode === 'full' ? st.pref : null);
      st.pref = null; st.last = r;
      st.log.push({ k: st.log.length + 1, ...r });
      draw();
    }
    function reset() {
      clearInterval(st.timer); st.timer = null; K$('run').textContent = 'Chạy chuỗi';
      sim = new C.CacheSim({ mapping: mode, lines: st.lines, ways: st.ways });
      st.last = null; st.log = []; st.queue = []; st.pref = null; draw();
    }
    function parseSeq() {
      const toks = K$('seq').value.trim().split(/[\s,→>-]+/).filter(Boolean);
      const out = toks.map((t) => Number(t.replace(/^b/i, '')));
      const ok = out.length && out.every((v) => Number.isInteger(v) && v >= 0 && v < BLOCKS);
      K$('seq').setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok ? out : null;
    }
    function stepOne() {
      if (!st.queue.length) { const q = parseSeq(); if (!q) return false; reset(); st.queue = q; }
      access(st.queue.shift());
      return st.queue.length > 0;
    }
    host.addEventListener('click', (e) => {
      const g = e.target.closest('[data-b]');
      if (g) { st.sel = Number(g.dataset.b); K$('blk').value = st.sel; draw(); return; }
      const l = e.target.closest('[data-l]');
      if (l && mode === 'full') {
        const li = Number(l.dataset.l);
        if (!sim.store[0][li].valid) { st.pref = st.pref === li ? null : li; draw(); }
        return;
      }
      const p = e.target.closest('[data-p]');
      if (p) { K$('seq').value = opts.presets[Number(p.dataset.p)][1]; reset(); K$('run').click(); return; }
      const k = e.target.closest('[data-k]') && e.target.closest('[data-k]').dataset.k;
      if (k === 'go') access(Number(K$('blk').value));
      if (k === 'clear') reset();
      if (k === 'one') { clearInterval(st.timer); st.timer = null; K$('run').textContent = 'Chạy chuỗi'; stepOne(); }
      if (k === 'run') {
        if (st.timer) { clearInterval(st.timer); st.timer = null; K$('run').textContent = 'Chạy chuỗi'; return; }
        const q = parseSeq(); if (!q) return;
        reset(); st.queue = q; K$('run').textContent = 'Tạm dừng';
        access(st.queue.shift());
        st.timer = setInterval(() => { if (!st.queue.length) { clearInterval(st.timer); st.timer = null; K$('run').textContent = 'Chạy chuỗi'; return; } access(st.queue.shift()); }, L.reduced ? 700 : 1300);
      }
    });
    K$('blk').addEventListener('change', () => { st.sel = Number(K$('blk').value); draw(); });
    if (mode === 'set') K$('ways').addEventListener('change', () => { st.ways = Number(K$('ways').value); reset(); });
    if (mode === 'direct') K$('all').addEventListener('change', () => { st.showAll = K$('all').checked; draw(); });
    reset();
  }

  /* =======================================================================
     I. Thước đo địa chỉ
     ======================================================================= */
  function initI() {
    let mode = 'direct';
    L.seg($('#i-mode'), [{ value: 'direct', label: 'Trực tiếp' }, { value: 'full', label: 'Hoàn toàn' }, { value: 'set', label: 'Tập hợp' }], 'direct', (v) => { mode = v; draw(); });
    function draw() {
      const memUnits = Number($('#i-mem').value), cacheUnits = Number($('#i-cache').value), blockUnits = Number($('#i-block').value), ways = Number($('#i-ways').value);
      $('#i-ways').disabled = mode !== 'set';
      let f;
      try { f = C.cacheFields({ memUnits, cacheUnits, blockUnits, mapping: mode, ways }); }
      catch (e) { $('#i-err').textContent = e.message; return; }
      const r = C.parseAddress($('#i-addr').value, f.N);
      $('#i-addr').setAttribute('aria-invalid', r.error ? 'true' : 'false');
      $('#i-err').textContent = r.error || '';
      $('#i-tb').textContent = `${f.N} bit`;
      if (r.error) return;
      const sp = C.splitAddress(r.value, f);
      const N = f.N;
      const cls = (pos) => pos < f.tag ? 'f-tag' : pos < f.tag + f.index ? 'f-idx' : 'f-off';
      const edges = new Set([f.tag - 1, f.tag + f.index - 1]);
      let h = `<div class="ruler__inner" style="--nbits:${N}">`;
      h += `<div class="ruler__ticks" aria-hidden="true" style="padding:0 0 4px">${Array.from({ length: N }, (_, i) => `<span class="${(N - 1 - i) % 4 === 0 ? 'major' : ''}" style="padding:0 0 2px">${N - 1 - i}</span>`).join('')}</div>`;
      h += `<div class="ruler__bits" role="img" aria-label="Địa chỉ ${N} bit: ${sp.bin}">${[...sp.bin].map((b, i) => `<div class="b ${cls(i)} ${edges.has(i) && i < N - 1 ? 'edge' : ''}">${b}</div>`).join('')}</div>`;
      const fld = (name, bits, val, c, extra) => bits ? `<div class="fld ${c}" style="grid-column:span ${bits}"><b>${name}</b>${bits} bit<div class="v">${num(val)}</div><div class="caption" style="margin:0">${extra}</div></div>` : '';
      h += `<div class="ruler__fields">${fld('Tag', f.tag, sp.tag, 'f-tag', 'so sánh để biết hit/miss')}${fld(f.indexName || '', f.index, sp.index, 'f-idx', f.indexName === 'Line' ? 'chọn thẳng 1 Line' : 'chọn 1 Set')}${fld('Offset', f.offset, sp.offset, 'f-off', `byte trong Block`)}</div></div>`;
      $('#i-ruler').innerHTML = h;
      // phép tính
      const B = blockUnits;
      let c = `<div class="calc">Địa chỉ A = ${hex(r.value, Math.ceil(N / 4))} = ${num(r.value)}<br>`;
      c += `Block = ⌊A ÷ ${B}⌋ = <span class="res">${num(sp.block)}</span><br>Offset = A mod ${B} = <span class="res">${sp.offset}</span><br>`;
      if (mode === 'direct') c += `Line = Block mod ${num(f.lines)} = <span class="res">${num(sp.index)}</span><br>Tag = ⌊Block ÷ ${num(f.lines)}⌋ = <span class="res">${num(sp.tag)}</span>`;
      if (mode === 'set') c += `Số Set = ${num(f.lines)} ÷ ${ways} = ${num(f.sets)}<br>Set = Block mod ${num(f.sets)} = <span class="res">${num(sp.index)}</span><br>Tag = ⌊Block ÷ ${num(f.sets)}⌋ = <span class="res">${num(sp.tag)}</span>`;
      if (mode === 'full') c += `Tag = Block = <span class="res">${num(sp.tag)}</span>`;
      c += `</div><p class="caption">Kiểm tra: đọc nhóm bit Tag ${sp.tagBin} được ${num(parseInt(sp.tagBin, 2))}${f.index ? `, nhóm ${f.indexName} ${sp.idxBin} được ${num(parseInt(sp.idxBin, 2))}` : ''}, nhóm Offset ${sp.offBin} được ${parseInt(sp.offBin, 2)}. Trùng với phép chia.</p>`;
      c += fieldBar(f);
      $('#i-calc').innerHTML = c;
      // đồng hồ vị trí
      let g = `<svg viewBox="0 0 420 ${mode === 'set' ? 150 : 96}" role="img" aria-label="Vị trí trong cache">`;
      const total = mode === 'set' ? f.sets : f.lines, x = 10 + (mode === 'full' ? 0 : (sp.index / total) * 400);
      g += `<rect x="10" y="30" width="400" height="22" fill="${mode === 'full' ? 'var(--addr-soft)' : '#fff'}" stroke="var(--ink)" stroke-width="1.6"/>`;
      for (let i = 1; i < 16; i++) g += `<path d="M${10 + i * 25} 30 v${i % 4 ? 6 : 22}" stroke="var(--ink-3)"/>`;
      g += `<text class="lbl-sm" x="10" y="20">${mode === 'set' ? 'Set' : 'Line'} 0</text><text class="lbl-sm" x="410" y="20" text-anchor="end">${num(total - 1)}</text>`;
      if (mode !== 'full') g += `<rect x="${Math.min(x, 406)}" y="26" width="4" height="30" fill="var(--ink)"/><text class="lbl" x="${Math.min(Math.max(x, 60), 360)}" y="76" text-anchor="middle">${mode === 'set' ? 'Set' : 'Line'} ${num(sp.index)} / ${num(total)}</text>`;
      else g += `<text class="lbl" x="210" y="76" text-anchor="middle">Có thể ở bất kỳ Line nào trong ${num(f.lines)} Line</text>`;
      if (mode === 'set') {
        const w = Math.min(90, 400 / ways);
        for (let k = 0; k < ways; k++) g += `<rect class="box box--addr" x="${10 + k * (w + 4)}" y="96" width="${w}" height="26"/><text class="lbl-mono" x="${10 + k * (w + 4) + w / 2}" y="114" text-anchor="middle">Way ${k}</text>`;
        g += `<text class="lbl-sm" x="10" y="142">${ways} Line của Set ${num(sp.index)}: so Tag với cả ${ways}, không có bit way trong địa chỉ.</text>`;
      }
      g += `</svg>`;
      $('#i-gauge').innerHTML = g;
      const why = { direct: 'Trường Line chọn thẳng một Line duy nhất. Chỉ cần so sánh một Tag.', full: 'Không có trường Line: Block được vào bất kỳ Line nào, nên toàn bộ số Block là Tag và phải so với Tag của mọi Line.', set: 'Trường Set chọn một Set. Way không nằm trong địa chỉ; phần cứng so Tag với tất cả way của Set để tìm.' }[mode];
      $('#i-why').innerHTML = `<p class="note">${why}</p>`;
    }
    ['#i-mem', '#i-cache', '#i-block', '#i-ways'].forEach((q) => $(q).addEventListener('change', draw));
    $('#i-addr').addEventListener('input', draw);
    $('#i-rand').addEventListener('click', () => {
      const N = C.log2Exact(Number($('#i-mem').value));
      $('#i-addr').value = hex(Math.floor(Math.random() * 2 ** N), Math.ceil(N / 4)); draw();
    });
    draw();
  }

  /* =======================================================================
     J. Bài tập (slide 43, 49–52)
     ======================================================================= */
  function initJ() {
    L.tabs($('#j-tabs'));
    let given = { mem: 4 * 1024 ** 3, cache: 256 * 1024, block: 32, ways: 4 };
    const p2 = (v) => { const l = C.log2Exact(v); return l === null ? num(v) : `2<sup>${l}</sup>`; };
    const g = L.guided($('#j-guided'), () => {
      const { mem, cache, block, ways } = given;
      const d = C.cacheFields({ memUnits: mem, cacheUnits: cache, blockUnits: block, mapping: 'direct' });
      const fu = C.cacheFields({ memUnits: mem, cacheUnits: cache, blockUnits: block, mapping: 'full' });
      const s = C.cacheFields({ memUnits: mem, cacheUnits: cache, blockUnits: block, mapping: 'set', ways });
      return [
        { title: 'Độ rộng địa chỉ N', body: `<p>Giả định: bộ nhớ đánh địa chỉ theo <b>byte</b>, mỗi byte một địa chỉ, và 1K = 2<sup>10</sup>.</p><div class="calc">Bộ nhớ chính: ${C.formatBytes(mem)} = ${p2(mem)} byte<br>→ N = <span class="res">${d.N} bit</span></div>` },
        { title: 'Trường Offset W', body: `<div class="calc">Line (Block): ${block} byte = ${p2(block)} byte<br>→ W = <span class="res">${d.offset} bit</span></div><p>${d.offset} bit này cho biết byte nào trong ${block} byte của Block.</p>` },
        { title: 'Ánh xạ trực tiếp', body: `<div class="calc">Cache: ${C.formatBytes(cache)} = ${p2(cache)} byte<br>Số Line = ${p2(cache)} ÷ ${p2(block)} = ${p2(d.lines)} = ${num(d.lines)} → L = <span class="res">${d.index} bit</span><br>T = ${d.N} − (${d.index} + ${d.offset}) = <span class="res">${d.tag} bit</span></div>${fieldBar(d)}` },
        { title: 'Ánh xạ hoàn toàn', body: `<p>Không có trường Line, vì Block được vào bất kỳ Line nào.</p><div class="calc">T = ${fu.N} − ${fu.offset} = <span class="res">${fu.tag} bit</span></div>${fieldBar(fu)}` },
        { title: `Ánh xạ tập hợp ${ways}-way`, body: `<div class="calc">Số Line = ${p2(s.lines)}<br>Mỗi Set có ${ways} Line = ${p2(ways)} Line<br>Số Set = ${p2(s.lines)} ÷ ${p2(ways)} = ${p2(s.sets)} → S = <span class="res">${s.index} bit</span><br>T = ${s.N} − (${s.index} + ${s.offset}) = <span class="res">${s.tag} bit</span></div>${fieldBar(s)}` },
        { title: 'So sánh ba kết quả', body: `<p>Cùng N = ${d.N} bit và Offset = ${d.offset} bit. Chỉ cách chia phần còn lại là khác.</p><p class="caption">Trực tiếp</p>${fieldBar(d)}<p class="caption">Hoàn toàn</p>${fieldBar(fu)}<p class="caption">Tập hợp ${ways}-way</p>${fieldBar(s)}<p class="note">Càng nhiều way, trường Set càng ngắn và Tag càng dài: mỗi Tag phải phân biệt nhiều Block hơn trong cùng Set.</p>` }
      ];
    });
    function apply() {
      const mem = C.parseSize($('#j-mem').value), cache = C.parseSize($('#j-cache').value), block = C.parseSize($('#j-block').value), ways = Number($('#j-ways').value);
      try {
        if (!mem || !cache || !block) throw new Error('Nhập kích thước dạng 4GB, 256KB, 32.');
        C.cacheFields({ memUnits: mem, cacheUnits: cache, blockUnits: block, mapping: 'set', ways });
        given = { mem, cache, block, ways };
        ['#j-mem', '#j-cache', '#j-block', '#j-ways'].forEach((q) => $(q).setAttribute('aria-invalid', 'false'));
        g.refresh();
      } catch (e) {
        ['#j-mem', '#j-cache', '#j-block', '#j-ways'].forEach((q) => $(q).setAttribute('aria-invalid', 'true'));
        $('#j-guided .guided__body').insertAdjacentHTML('afterbegin', status('err', e.message));
      }
    }
    $('#j-apply').addEventListener('click', apply);
    $('#j-orig').addEventListener('click', () => { $('#j-mem').value = '4GB'; $('#j-cache').value = '256KB'; $('#j-block').value = '32'; $('#j-ways').value = '4'; apply(); });
    // Ví dụ slide 43
    const f16 = C.cacheFields({ memUnits: 2 ** 16, blockUnits: 16, cacheUnits: 128 * 16, mapping: 'direct' });
    $('#j-16').innerHTML = `<p>Slide 43 dùng quy ước khác: mỗi địa chỉ chỉ tới một <b>từ nhớ (word)</b>, không phải một byte.</p><div id="j16g"></div>
      <div class="zone" style="margin-top:14px"><h3>Thử tách địa chỉ 16 bit</h3><div class="controls"><label class="field">Địa chỉ từ<input id="j16a" value="0xA5C3" style="width:140px"></label></div><div id="j16o" style="margin-top:8px"></div></div>
      <table class="tbl" style="margin-top:14px"><thead><tr><th class="left">So sánh</th><th>Ví dụ slide 43</th><th>Đề slide 49–52</th></tr></thead><tbody>
      <tr><td class="left">Một địa chỉ chỉ tới</td><td>1 từ (word)</td><td>1 byte</td></tr>
      <tr><td class="left">Độ rộng địa chỉ</td><td>${f16.N} bit</td><td>32 bit</td></tr>
      <tr><td class="left">Offset nghĩa là</td><td>vị trí từ trong 16 từ của Block (${f16.offset} bit)</td><td>vị trí byte trong 32 byte của Block (5 bit)</td></tr></tbody></table>`;
    L.guided($('#j16g'), () => [
      { title: 'Độ rộng địa chỉ', body: `<div class="calc">Bộ nhớ chính có 2<sup>16</sup> ô (từ nhớ) → N = <span class="res">${f16.N} bit</span></div>` },
      { title: 'Trường Word', body: `<div class="calc">Mỗi Block 16 từ = 2<sup>4</sup> → Word = <span class="res">${f16.offset} bit</span></div><p>4 bit này chọn 1 trong 16 từ của Block.</p>` },
      { title: 'Số Block', body: `<div class="calc">M = 2<sup>16</sup> ÷ 2<sup>4</sup> = 2<sup>12</sup> = <span class="res">${num(f16.blocks)}</span> Block</div>` },
      { title: 'Trường Line', body: `<div class="calc">Cache có m = 128 = 2<sup>7</sup> Line → Line = <span class="res">${f16.index} bit</span></div>` },
      { title: 'Trường Tag', body: `<div class="calc">${num(f16.blocks)} Block ÷ 128 Line = 2<sup>5</sup> Block chung một Line<br>Tag = 16 − 7 − 4 = <span class="res">${f16.tag} bit</span></div>${fieldBar(f16, { offName: 'Word' })}` }
    ]);
    const d16 = () => {
      const r = C.parseAddress($('#j16a').value, 16);
      $('#j16a').setAttribute('aria-invalid', r.error ? 'true' : 'false');
      if (r.error) { $('#j16o').innerHTML = status('err', r.error); return; }
      const sp = C.splitAddress(r.value, f16);
      $('#j16o').innerHTML = fieldBar(f16, { offName: 'Word', tagVal: `${sp.tagBin} = ${sp.tag}`, idxVal: `${sp.idxBin} = ${sp.index}`, offVal: `${sp.offBin} = ${sp.offset}` }) + `<p class="caption">Từ số ${sp.offset} của Block ${num(sp.block)}, Block này ánh xạ vào Line ${sp.index}.</p>`;
    };
    $('#j16a').addEventListener('input', d16); d16();
    // Ghi chú
    $('#j-notes').innerHTML = `<table class="tbl"><thead><tr><th>Slide</th><th class="left">Nội dung trong slide</th><th class="left">Cách xử lý trên website</th></tr></thead><tbody>
      <tr><td>38–39</td><td class="left">Hai slide trùng nội dung</td><td class="left">Dạy quy trình một lần ở phần D</td></tr>
      <tr><td>45</td><td class="left">Bảng địa chỉ 16 bit: Tag 5 bit, Word 11 bit</td><td class="left">Với ví dụ 16 bit, Block 16 từ: Tag 12 bit, Word 4 bit</td></tr>
      <tr><td>47</td><td class="left">B<sub>j</sub> → Set (j mod p), với p là số Line mỗi Set</td><td class="left">Dùng Set = j mod S, S là số Set</td></tr>
      <tr><td>47</td><td class="left">Bảng 16 bit: Tag 9, Set 3, Word 4</td><td class="left">Nhất quán nếu 128 Line chia thành 8 Set, mỗi Set 16 Line</td></tr>
      <tr><td>50, 52</td><td class="left">Hình bảng 16 bit (5/7/4 và 9/3/4) đặt cạnh lời giải 32 bit</td><td class="left">Là hình còn sót lại của ví dụ 16 bit; kết quả đúng của đề là 14/13/5, 27/5 và 16/11/5</td></tr>
      <tr><td>49–52</td><td class="left">Không nói rõ đơn vị địa chỉ</td><td class="left">Ghi rõ giả định đánh địa chỉ theo byte</td></tr></tbody></table>`;
  }

  /* =======================================================================
     K. Tự luyện
     ======================================================================= */
  function initK() {
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const sz = C.formatBytes;
    function pFields(mem, cache, block, mapping, ways, title) {
      const f = C.cacheFields({ memUnits: mem, cacheUnits: cache, blockUnits: block, mapping, ways });
      const name = mapping === 'direct' ? 'ánh xạ trực tiếp' : mapping === 'full' ? 'ánh xạ hoàn toàn' : `ánh xạ tập hợp ${ways}-way`;
      const fields = [
        { label: 'Độ rộng địa chỉ N (bit)', answer: f.N, kind: 'addrBits', ctx: { countValue: mem } },
        { label: 'Offset (bit)', answer: f.offset, kind: 'addrBits', ctx: { countValue: block } },
        { label: 'Số Line trong cache', answer: f.lines, kind: 'lines', ctx: { sets: f.sets, cacheUnits: cache } }
      ];
      if (mapping === 'direct') fields.push({ label: 'Trường Line (bit)', answer: f.index, kind: 'lineBits', ctx: { countValue: f.lines } });
      if (mapping === 'set') fields.push({ label: 'Số Set', answer: f.sets, kind: 'sets', ctx: { lines: f.lines, ways } }, { label: 'Trường Set (bit)', answer: f.index, kind: 'setBits', ctx: { countValue: f.sets, lineBits: f.lineBits } });
      fields.push({ label: 'Tag (bit)', answer: f.tag, kind: 'tag', ctx: { N: f.N, offset: f.offset, index: f.index, altIndex: mapping === 'set' ? f.lineBits : undefined } });
      const sol = [`N = log₂(${sz(mem)}) = ${f.N} bit.`, `Offset = log₂(${block}) = ${f.offset} bit.`, `Số Line = ${sz(cache)} ÷ ${block} = ${num(f.lines)} = 2<sup>${f.lineBits}</sup>.`];
      if (mapping === 'direct') sol.push(`Line = ${f.index} bit.`, `Tag = ${f.N} − ${f.index} − ${f.offset} = ${f.tag} bit.`);
      if (mapping === 'full') sol.push(`Không có trường Line. Tag = ${f.N} − ${f.offset} = ${f.tag} bit.`);
      if (mapping === 'set') sol.push(`Số Set = ${num(f.lines)} ÷ ${ways} = ${num(f.sets)} → Set = ${f.index} bit.`, `Tag = ${f.N} − ${f.index} − ${f.offset} = ${f.tag} bit.`);
      return {
        title: title || `${sz(mem)} / ${sz(cache)} / ${block}B, ${name}`,
        text: `Bộ nhớ chính <b>${sz(mem)}</b> (theo byte), cache <b>${sz(cache)}</b>, Line <b>${block} byte</b>, <b>${name}</b>. Tính các trường địa chỉ.`,
        fields, hint: mapping === 'set' ? 'Số Set = số Line ÷ số way. Trường Set là log₂(số Set), không phải log₂(số Line).' : 'Tag = N − (các trường còn lại). Mọi số đều là lũy thừa của 2, lấy log₂ để ra số bit.',
        solution: sol
      };
    }
    function pAddr(mem, cache, block, mapping, ways, addr) {
      const f = C.cacheFields({ memUnits: mem, cacheUnits: cache, blockUnits: block, mapping, ways });
      const sp = C.splitAddress(addr, f), d = Math.ceil(f.N / 4);
      const fields = [{ label: 'Tag (thập phân hoặc hex)', answer: sp.tag }];
      if (f.index) fields.push({ label: `${f.indexName} (thập phân)`, answer: sp.index });
      fields.push({ label: 'Offset (thập phân)', answer: sp.offset });
      return {
        title: `Tách địa chỉ ${hex(addr, d)} (${mapping === 'set' ? ways + '-way' : mapping === 'direct' ? 'trực tiếp' : 'hoàn toàn'})`,
        text: `Bộ nhớ ${sz(mem)}, cache ${sz(cache)}, Line ${block} byte, ${mapping === 'set' ? `tập hợp ${ways}-way` : mapping === 'direct' ? 'ánh xạ trực tiếp' : 'ánh xạ hoàn toàn'}. Tách địa chỉ <b>${hex(addr, d)}</b>.`,
        fields, hint: `Trường: Tag ${f.tag} bit${f.index ? `, ${f.indexName} ${f.index} bit` : ''}, Offset ${f.offset} bit. Viết địa chỉ ra ${f.N} bit nhị phân rồi cắt từ phải sang trái.`,
        solution: [`${hex(addr, d)} = ${sp.bin}₂.`, `Offset = ${f.offset} bit cuối = ${sp.offBin} = ${sp.offset}.`, ...(f.index ? [`${f.indexName} = ${f.index} bit kế tiếp = ${sp.idxBin} = ${sp.index}.`] : []), `Tag = ${f.tag} bit đầu = ${sp.tagBin} = ${num(sp.tag)}.`]
      };
    }
    function p16() {
      const f = C.cacheFields({ memUnits: 2 ** 16, blockUnits: 16, cacheUnits: 128 * 16, mapping: 'direct' });
      return {
        title: 'Ví dụ slide 43: 16 bit, Block 16 từ, 128 Line', text: 'Địa chỉ <b>16 bit</b>, mỗi địa chỉ chỉ tới một <b>từ nhớ</b>. Block 16 từ, cache 128 Line, ánh xạ trực tiếp.',
        fields: [{ label: 'Word (bit)', answer: f.offset, kind: 'addrBits', ctx: { countValue: 16 } }, { label: 'Số Block bộ nhớ chính', answer: f.blocks }, { label: 'Line (bit)', answer: f.index, kind: 'lineBits', ctx: { countValue: 128 } }, { label: 'Tag (bit)', answer: f.tag, kind: 'tag', ctx: { N: 16, offset: f.offset, index: f.index } }],
        hint: 'Ở đây đơn vị là từ nhớ, không phải byte. 16 từ = 2⁴.', solution: ['Word = log₂16 = 4 bit.', 'M = 2¹⁶ ÷ 2⁴ = 4096 Block.', 'Line = log₂128 = 7 bit.', 'Tag = 16 − 7 − 4 = 5 bit.']
      };
    }
    const GB = 1024 ** 3, MB = 1024 ** 2, KB = 1024;
    const fixed = [
      () => pFields(4 * GB, 256 * KB, 32, 'direct', 1, 'Đề slide 50: trực tiếp'),
      () => pFields(4 * GB, 256 * KB, 32, 'full', 1, 'Đề slide 51: hoàn toàn'),
      () => pFields(4 * GB, 256 * KB, 32, 'set', 4, 'Đề slide 52: tập hợp 4-way'),
      p16,
      () => pFields(1 * MB, 16 * KB, 16, 'set', 2),
      () => pAddr(64 * KB, 8 * KB, 64, 'direct', 1, 0xBEEF),
      () => pFields(16 * MB, 64 * KB, 32, 'set', 8),
      () => pAddr(4 * GB, 256 * KB, 32, 'set', 4, 0x12345678)
    ];
    const random = () => {
      for (;;) {
        const mem = rnd([64 * KB, MB, 16 * MB, 256 * MB, 4 * GB]);
        const cache = rnd([4 * KB, 8 * KB, 16 * KB, 32 * KB, 64 * KB, 128 * KB, 256 * KB, 512 * KB]);
        const block = rnd([8, 16, 32, 64, 128]);
        const mapping = rnd(['direct', 'full', 'set']);
        const ways = mapping === 'set' ? rnd([2, 4, 8, 16]) : 1;
        if (cache >= mem / 4 || cache / block < ways * 2) continue;
        if (Math.random() < 0.35) return pAddr(mem, cache, block, mapping, ways, Math.floor(Math.random() * mem));
        return pFields(mem, cache, block, mapping, ways);
      }
    };
    L.practice($('#k-practice'), { fixed, random, intro: 'Đề tính trường địa chỉ giả định đánh địa chỉ theo byte, trừ đề ví dụ slide 43 (theo từ nhớ).' });
  }

  /* ---------- Khởi tạo ---------- */
  const inits = {
    'sec-a': X.initA, 'sec-b': X.initB, 'sec-c': X.initC, 'sec-d': X.initD, 'sec-e': X.initE,
    'sec-f': () => mappingLab($('#f-body'), 'direct', {
      lines: 4,
      presets: [['B0 → B4 → B0 (xung đột)', 'B0 B4 B0'], ['B0 B1 B2 B3 B0 B1 (không xung đột)', 'B0 B1 B2 B3 B0 B1'], ['B1 B5 B9 B1 (ba Block tranh Line 1)', 'B1 B5 B9 B1']],
      after: `<div class="stage stage--split-wide" style="margin-top:12px"><div class="zone"><h3>Ưu và nhược điểm (slide 44)</h3><ul><li>Bộ so sánh đơn giản: chỉ một Tag.</li><li>Giá thành rẻ.</li><li>Hai Block cùng Line được dùng xen kẽ sẽ đẩy nhau ra liên tục, gây miss.</li></ul></div>
        <div class="zone"><h3>Địa chỉ trong ví dụ slide 43</h3><p style="margin:0">16 bit, Block 16 từ, 128 Line:</p>${fieldBar(C.cacheFields({ memUnits: 2 ** 16, blockUnits: 16, cacheUnits: 2048, mapping: 'direct' }), { offName: 'Word' })}<p class="caption">Thử tách địa chỉ ở <a href="#sec-j">phần J</a> hoặc dùng <a href="#sec-i">thước đo</a>.</p></div></div>`
    }),
    'sec-g': () => mappingLab($('#g-body'), 'full', { lines: 4, presets: [['B0 B4 B8 B0 (không còn xung đột)', 'B0 B4 B8 B0'], ['B0 B4 B8 B12 B1 B0 (đầy, FIFO)', 'B0 B4 B8 B12 B1 B0']] }),
    'sec-h': () => mappingLab($('#h-body'), 'set', { lines: 8, ways: 4, presets: [['B0 B2 B0 B2 (cùng Set, khác way)', 'B0 B2 B0 B2'], ['B0 B2 B4 B6 B8 B0 (Set 0 đầy, FIFO)', 'B0 B2 B4 B6 B8 B0'], ['B0 B1 B2 B3 (hai Set)', 'B0 B1 B2 B3']] }),
    'sec-i': initI, 'sec-j': initJ, 'sec-k': initK
  };
  Object.entries(inits).forEach(([id, fn]) => { L.onShow[id] = (first) => { if (first) fn(); }; });
  L.initPage(X.INFO);
})();
