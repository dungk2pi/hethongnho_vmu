# Ghi chú kỹ thuật và điểm cần làm rõ trong slide

## 1. Điểm chưa nhất quán trong slide nguồn và cách website xử lý

| Slide | Nội dung gốc | Vấn đề | Cách xử lý |
|---|---|---|---|
| 26 | “14 đường địa chỉ A13 ÷ A0 → có 2ⁿ từ nhớ” | n chưa được gán giá trị | Ghi rõ 2¹⁴ = 16.384 từ |
| 26 | Hình: A6…A0 vào bộ giải mã hàng, A13…A7 vào bộ giải mã cột | Không mâu thuẫn, nhưng ngược thứ tự “hàng là bit cao” mà nhiều sách dùng | Mô phỏng làm đúng theo hình: địa chỉ logic = cột × 2^n1 + hàng |
| 28 | Pha 2: “chốt n bit truyền lần 1 là các tín hiệu chọn cột” | Lỗi chép: phải là lần 2 | Ghi chú trong bảng giải thích phần D |
| 28 | RAS, CAS không ghi mức tích cực | Không rõ | Giản đồ vẽ theo quy ước phổ biến là tích cực thấp, có ghi chú là quy ước |
| 30 | “4Kb = 2¹² byte” | Viết thường b (bit) thay cho B (byte) | Dùng 4KB |
| 33 | “Bộ giải mã 2 → 1” | Hình là AND + NOT, bảng chân lý là NAND; theo định nghĩa bộ giải mã có ít ngõ vào hơn ngõ ra | Giữ nguyên nội dung trong một tab riêng và gọi đúng tên cổng NAND |
| 38–39 | Hai slide giống hệt nhau | Trùng lặp | Dạy một lần ở phần D trang Cache |
| 45 | Bảng 16 bit: Tag 5, Word 11 | Với ví dụ 16 bit, Block 16 từ của slide 43, đúng ra là Tag 12, Word 4 | Ghi chú tại phần G và phần J |
| 47 | B<sub>j</sub> → Set (j mod p), trong khi p là số Line mỗi Set | Mâu thuẫn với quy tắc chung | Dạy Set = j mod S, S = số Line ÷ p; ghi chú tại phần H |
| 47 | “Set 0: B₁, B₂, B<sub>p−1</sub>” | Không khớp với danh sách B₀…B<sub>p−1</sub> → Set 0 ngay bên cạnh | Ghi chú tại phần H |
| 47 | Bảng 16 bit: Tag 9, Set 3, Word 4 | Chỉ nhất quán nếu 128 Line chia thành 8 Set, 16 Line/Set; slide không nói | Ghi chú trong tab “Ghi chú về slide” |
| 50, 52 | Hình bảng 16 bit (5/7/4, 9/3/4) đặt cạnh lời giải bài 32 bit | Hình còn sót từ ví dụ 16 bit | Website hiển thị kết quả 14/13/5, 27/5, 16/11/5 tính từ đề |
| 49–52 | Không nói đơn vị địa chỉ | Kết quả phụ thuộc giả định | Ghi rõ: đánh địa chỉ theo byte, 1K = 2¹⁰ |

Ngoài phạm vi 23–52 nhưng thấy khi đọc: tiêu đề slide 17 ghi “RAM (READ ONLY MEMORY)”.

## 2. Giả định chỉ dùng cho mô phỏng

- **Thay thế FIFO** trong ánh xạ hoàn toàn và tập hợp, và trong cache mẫu 2 Block ở phần tính cục bộ. Slide không dạy chính sách thay thế; giao diện ghi rõ “giả định của mô phỏng”.
- **Phân loại miss:** “miss lần đầu” khi Block chưa từng vào cache; “conflict miss” khi ánh xạ trực tiếp đẩy ra một Block đã từng có; “miss do Block đã bị thay ra” cho hai kiểu còn lại. Đây là cách gọi đơn giản hóa cho người mới học.
- **Nội dung ô nhớ** được sinh giả ngẫu nhiên ổn định theo địa chỉ, để bảng nhớ lớn không cần lưu hàng nghìn giá trị.
- **Mô hình thời gian ở phần B** là số minh họa do người học nhập: hit tốn t<sub>c</sub>, miss tốn t<sub>c</sub> + t<sub>m</sub>.
- **Bộ điều khiển chip (phần E):** CS = 1 → không chọn, bus thả nổi (Z); OE = WE = 0 cùng lúc → báo không hợp lệ, không ghi không đọc. Không mô phỏng điện áp hay thời gian trễ.
- **DRAM (phần I):** mô hình hóa bit 1 là tụ có điện tích, bit 0 là tụ không tích điện; hoạt ảnh cho thấy điện áp chuẩn hóa giảm khi rò, được nạp lại khi làm tươi, và giảm về 0 khi ngắt nguồn. Ngưỡng và thời lượng là minh họa, không đại diện cho điện áp hoặc thời gian rò thực của chip.
- **So sánh RAM (phần I):** hoạt ảnh nạp D1–D4 vào các thanh RAM; giả định 1 × 16 GB chạy single-channel (1 phần/chu kỳ) và 2 × 8 GB chạy dual-channel trên nền tảng hỗ trợ (2 phần/chu kỳ). Vì vậy dual-channel hoàn tất workload minh họa ở CK2 thay vì CK4; đây là gấp đôi băng thông lý thuyết trong mô hình, không dự đoán mức tăng tốc ứng dụng.
- **74LS138** được mô phỏng ở mức logic theo bảng chân lý slide 34, không mô phỏng chân vật lý.
- **Phòng thử ánh xạ** dùng mô hình thu nhỏ: 16 Block × 4 từ (địa chỉ 6 bit), cache 4 hoặc 8 Line.
- **Ví dụ 4K × 8 → 4K × 16** là ví dụ bổ sung, có nhãn “không phải bài giải cụ thể trong slide”.

## 3. Kiến trúc mã

- `assets/js/calc.js`: toàn bộ phép tính thuần (không DOM), xuất ra `window.Calc` trên trình duyệt và `module.exports` trong Node. Mọi con số trên giao diện đều đi qua đây.
- `assets/js/common.js`: điều hướng theo phần, bảng giải thích 6 bước (Là gì → Vì sao → Hoạt động → Quan sát → Tự thử → Kiểm tra), bộ phát từng bước, công tắc DIP, bộ luyện tập và lời giải có hướng dẫn.
- `assets/js/memory-lab.js`, `assets/js/cache-lab.js`: chỉ lo vẽ SVG/Canvas và nối sự kiện.
- Ma trận 128 × 128 vẽ trên Canvas, không tạo 16.384 phần tử DOM. Bảng SRAM lớn dùng phân trang 16 dòng.
- Đáp án luyện tập được tính lại từ tham số đề bằng `Calc`; hàm `Calc.diagnose` nhận ra các nhầm lẫn: số Line ↔ số Set, bit ↔ byte, số lượng ↔ số bit, quên trừ Offset hoặc trường Line/Set, nhầm đường địa chỉ của chip với của module.
- Số 32 bit được xử lý bằng phép chia và `Math.floor`, không dùng toán tử bit (vốn là số có dấu 32 bit trong JavaScript).

## 4. Thiết kế

- Hướng thiết kế: tờ bản vẽ kỹ thuật. Mỗi phần là một “tờ” có vạch chia vùng ở mép trên và khung tên ghi số tờ, số slide và thông số chính.
- Màu mang nghĩa và luôn đi kèm kiểu nét: địa chỉ xanh lam nét liền, dữ liệu xanh lục nét gạch, điều khiển hổ phách nét chấm. Ô được chọn tô mực đậm chữ trắng, không chỉ dựa vào màu.
- Phông chữ: Bahnschrift cho tiêu đề, Segoe UI/Aptos cho nội dung, Cascadia Code/Consolas cho bit và địa chỉ, đều có phông dự phòng của hệ thống. Không tải phông từ mạng. Chữ tiếng Việt trong công thức dùng phông nội dung để tránh lỗi dấu ở phông đơn cách.
- Điểm nhấn riêng: trang Tổ chức chip nhớ có sơ đồ chip và ma trận DRAM; trang Cache có thước đo địa chỉ với vạch chia bit và các trường tách sẵn.
- `prefers-reduced-motion` tắt hoạt ảnh dòng chảy trên dây và các chuyển tiếp.

## 5. Quy trình kiểm tra đã chạy

- `node tests/calculations.test.js`: 18 nhóm kiểm thử, tất cả đều qua.
- Chụp màn hình bằng Playwright (Chromium) ở 1366 × 768, 1440 × 900, 1920 × 1080 và 390 × 844; không có lỗi console, không tràn ngang trang.
- Kịch bản tương tác tự động: chuỗi B0 → B4 → B0 cho đúng conflict miss; ánh xạ hoàn toàn đầy và thay theo FIFO; hai Block cùng Set nằm ở hai way; chuỗi truy cập phần D cho hit ở từ cùng Block; nhập đáp án sai vào luyện tập nhận đúng thông báo chẩn đoán.
- Đã sửa sau lượt xem ảnh đầu tiên: chữ trong sơ đồ được tăng cỡ; sơ đồ ánh xạ được thu gọn hình học để to hơn; cột chọn trên ma trận DRAM được tô đậm hơn; chữ tiếng Việt trong công thức chuyển sang phông nội dung; vài nhãn bị đè được dời chỗ.
- Skill `impeccable` không có trong môi trường xây dựng này, nên không chạy được quy trình phê bình của nó. Thay vào đó đã tự rà soát bằng ảnh chụp theo các yêu cầu của đề bài.
- Phông Bahnschrift/Segoe/Cascadia không có trong máy dựng (Linux), nên ảnh chụp dùng phông dự phòng. Trên Windows, giao diện sẽ dùng đúng các phông đã chọn.
