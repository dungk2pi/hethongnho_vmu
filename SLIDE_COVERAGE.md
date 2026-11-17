# Bảng phủ nội dung slide 23–52

Nguồn: `KTMT_Slide_Chuong_3_pptx__Bài_thuyết_trình___fixed.pptx` (52 slide). Đã đọc cả phần chữ trích xuất lẫn hình vẽ của từng slide 23–52 (sơ đồ khối, bảng chân lý, mạch ghép chip, bảng trường địa chỉ).

Ký hiệu: **M** = `memory-organization.html`, **C** = `cache-mapping.html`. Mỗi phần mở được trực tiếp bằng đường dẫn có `#sec-x`.

| Slide | Nội dung trong slide | Vị trí trên website | Hình thức |
|---|---|---|---|
| 23 | Bộ nhớ gồm ô/ngăn/hàng nhớ; ô nhớ 8 bit; mỗi ô một địa chỉ; từ nhớ 8, 16, 32… bit | M `#sec-a` | Lưới 16 ô × 8 bit có thể chọn, lật bit, đọc, ghi; nút gom 8/16/32 bit thành từ nhớ |
| 24 | Chip nhớ là ma trận vị trí nhớ; mỗi hàng 1 từ; đường địa chỉ, dữ liệu, điều khiển | M `#sec-a`, `#sec-b` | Ba bus có màu và kiểu nét riêng; giá trị hiện trên dây khi đọc/ghi |
| 25 | Tổ chức 1 chiều SRAM: A<sub>n−1</sub>…A<sub>0</sub>, D<sub>m−1</sub>…D<sub>0</sub>, 2ⁿ × m bit, CS/WE/OE, nhược điểm nhiều chân địa chỉ | M `#sec-b` | Sơ đồ chip theo hình slide (bộ giải mã, ma trận, bộ đệm, khối điều khiển); chạy từng bước đọc/ghi; n và m chỉnh được; bảng nội dung có phân trang |
| 26 | Ma trận 128 × 128, 14 đường địa chỉ, chia 7 + 7 cho hàng và cột | M `#sec-c` | Canvas 16.384 ô bấm được; bộ giải mã hàng và cột; tách bit A13…A7 / A6…A0 như hình slide |
| 27 | n = n1 + n2; 2^n1 hàng, 2^n2 từ/hàng; dung lượng; bước 1 chọn hàng, bước 2 chọn cột | M `#sec-c` | Trình tự 6 bước; khối “Tổng quát hóa” tính lại khi đổi n1, n2, m |
| 28 | Dồn kênh địa chỉ 2 pha, RAS, CAS, 2²ⁿ từ, dung lượng 2²ⁿ × m | M `#sec-d` | Sơ đồ bus 7 đường + chốt hàng/cột; giản đồ thời gian; so sánh 14 chân với 7 chân; công thức tổng quát theo r |
| 29 | Đóng vỏ chip: A, D, CS = 0, OE = 0, WE = 0 | M `#sec-e` | Sơ đồ chân theo hình slide; công tắc DIP; bảng điều khiển sáng theo tổ hợp; cảnh báo tổ hợp không hợp lệ |
| 30 | Thiết kế module: chip 2ⁿ × m, ví dụ SRAM 4K × 8 (12 đường địa chỉ, 8 đường dữ liệu), tăng độ dài từ và tăng số từ | M `#sec-f` (tab “So sánh hai cách”), `#sec-h` | Bảng so sánh tính động; ví dụ bổ sung 4K × 16 có nhãn rõ |
| 31 | Bản chất bài toán 2ᵏ × 2ⁿ × m; chỉ 1 chip hoạt động tại một thời điểm nhờ CS; thiết kế mạch giải mã | M `#sec-f`, `#sec-h` | Mạch module tổng quát (2, 4, 8 chip); bảng vùng địa chỉ |
| 32 | Lời giải 4K × 8 → 8KB: 13 đường địa chỉ, A12 vào giải mã 1 → 2, hai chip | M `#sec-f`, `#sec-h` | Mạch vẽ theo hình slide 32; CPU truy cập chip 1 và chip 2 có hoạt ảnh; lời giải 6 bước |
| 33 | Bộ giải mã “2 → 1” (hình là cổng NAND), 1 → 2, 2 → 4 với bảng chân lý | M `#sec-g` | Ba tab có ký hiệu, công tắc, bảng chân lý theo đúng slide; ghi chú tên gọi “2 → 1” |
| 34 | 74LS138 với G1, G2A, G2B, C, B, A và bảng chân lý | M `#sec-g` | Tab 74LS138 dùng đúng bảng của slide; tab tổng quát n → 2ⁿ |
| 35 | Cache là trung gian CPU – bộ nhớ chính; trong hoặc ngoài CPU; kích thước tiêu biểu; nhanh hơn; đắt hơn mỗi bit | C `#sec-a` | Sơ đồ chuyển đổi hệ thống hiện đại/cũ; bảng đặc điểm |
| 36 | Nâng cao hiệu năng; thời gian trung bình gần bằng cache; cùng hiệu năng rẻ hơn, cùng chi phí nhanh hơn | C `#sec-b` | Mô phỏng thời gian với số liệu minh họa có nhãn; bảng chi phí |
| 37 | Cục bộ không gian và thời gian | C `#sec-c` | Hai thí nghiệm khác nhau: duyệt mảng theo Block; chuỗi biến lặp lại trên dòng thời gian |
| 38 | Thao tác trên cache: hit, miss, nạp Block; CPU ↔ cache theo từ, cache ↔ bộ nhớ chính theo Block | C `#sec-d` | Mô phỏng truy cập + lưu đồ + đếm hit/miss/tỷ lệ hit |
| 39 | Trùng nội dung slide 38 | C `#sec-d` | Dạy một lần, có ghi chú trùng lặp |
| 40 | Bộ nhớ chính 2ⁿ ô, M Block, K từ/Block, M = 2ⁿ/K; cache m Line, Tag; m ≪ M | C `#sec-e` | Sơ đồ cache – bộ nhớ chính; n, K, m chỉnh được; nạp Block vào Line |
| 41 | Ba kỹ thuật ánh xạ | C `#sec-e` | Bảng so sánh có liên kết tới ba phòng thử |
| 42 | Ánh xạ trực tiếp, B<sub>j</sub> → L<sub>j mod m</sub> | C `#sec-f` | Phòng thử 16 Block, 4 Line; hiện mọi liên kết; chuỗi B0 → B4 → B0 |
| 43 | Ví dụ 16 bit: Tag 5 / Line 7 / Word 4, M = 4096, m = 128 | C `#sec-f`, `#sec-i`, `#sec-j` (tab 16 bit), `#sec-k` | Lời giải từng bước, bộ tách địa chỉ 16 bit, bảng phân biệt quy ước word và byte |
| 44 | Ưu, nhược điểm ánh xạ trực tiếp | C `#sec-f` | Khối ưu/nhược; minh họa conflict miss |
| 45 | Ánh xạ hoàn toàn: Block vào Line bất kỳ, Tag + Word, so sánh mọi Tag | C `#sec-g` | Phòng thử có bộ so sánh song song, chọn Line trống, FIFO có nhãn |
| 46 | Sơ đồ phần cứng ánh xạ hoàn toàn | C `#sec-g` | Bộ so sánh “=” cho từng Line, Tag yêu cầu nối tới tất cả |
| 47 | Ánh xạ tập hợp, p Line/Set, 2/4/8/16 Line/Set | C `#sec-h` | Phòng thử 8 Line, số way đổi được; ghi chú ký hiệu p |
| 48 | Sơ đồ phần cứng ánh xạ tập hợp | C `#sec-h` | Chỉ so sánh các way của Set được chọn |
| 49 | Đề 4GB / 256KB / 32B, ba kiểu ánh xạ | C `#sec-j`, `#sec-k` | Lời giải có hướng dẫn, số liệu đề sửa được, tính lại động |
| 50 | Lời giải trực tiếp: N 32, W 5, L 13, T 14 | C `#sec-j`, `#sec-i` | Bước 3; thước đo 32 bit |
| 51 | Lời giải hoàn toàn: T 27, W 5 | C `#sec-j`, `#sec-i` | Bước 4 |
| 52 | Lời giải 4-way: S 11, T 16 | C `#sec-j`, `#sec-i` | Bước 5 và bước so sánh ba kết quả |

Không slide nào trong khoảng 23–52 bị bỏ qua. Các chỗ slide chưa nhất quán được liệt kê trong `TECHNICAL_NOTES.md`.
