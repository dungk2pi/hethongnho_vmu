# Phòng thí nghiệm Bộ nhớ

Website học tương tác cho Chương 3 môn Kiến trúc máy tính, slide 23–52: tổ chức chip nhớ và bộ nhớ cache.

## Mở website

Không cần cài đặt, không cần mạng.

- Cách 1: mở trực tiếp tệp `index.html` bằng trình duyệt (Chrome, Edge, Firefox).
- Cách 2: chạy máy chủ tĩnh trong thư mục dự án, ví dụ `python -m http.server 8000` rồi mở `http://localhost:8000`.

## Hai bài học

| Trang | Slide | Nội dung |
|---|---|---|
| `memory-organization.html` | 23–34 + mở rộng | A. Ô nhớ, địa chỉ, từ nhớ · B. SRAM một chiều · C. DRAM hai chiều · D. Dồn kênh RAS/CAS · E. Chân CS/OE/WE · F. Thiết kế module · G. Bộ giải mã · H. Bài tập · I. Tụ điện DRAM và dual-channel |
| `cache-mapping.html` | 35–52 | A. Cache là gì · B. Lợi ích · C. Tính cục bộ · D. Quy trình truy cập · E. Block/Line/Tag · F. Ánh xạ trực tiếp · G. Ánh xạ hoàn toàn · H. Ánh xạ tập hợp · I. Thước đo địa chỉ · J. Bài tập · K. Tự luyện |

Chuyển giữa hai bài bằng trang chủ hoặc liên kết ở cuối thanh bên trái. Mỗi phần có địa chỉ riêng, ví dụ `cache-mapping.html#sec-i` mở thẳng thước đo địa chỉ, tiện khi trình chiếu.

## Cách dùng

- **Thanh bên trái**: chọn phần học. Trên điện thoại, bấm “Mục lục”.
- **Vùng giữa**: thí nghiệm. Các ô nhập nhận số thập phân (`4660`), hex (`0x1234`) hoặc nhị phân (`0b1010`).
- **Bộ phát từng bước**: Đặt lại, Bước trước, Chạy/Tạm dừng, Bước tiếp. Danh sách bước bên dưới cho biết đang ở đâu.
- **Bảng bên phải**: giải thích theo thứ tự Là gì → Vì sao cần → Hoạt động thế nào → Quan sát → Tự thử → Kiểm tra nhanh, kèm thuật ngữ Việt – Anh và ghi chú về slide.
- **Phòng thử ánh xạ**: bấm một Block trên hình để xem nó đi đâu; bấm “Truy cập Block” hoặc chạy một chuỗi như `B0 B4 B0`. Ở ánh xạ hoàn toàn, bấm một Line trống để chọn chỗ nạp.
- **Luyện tập**: chọn đề cố định hoặc “Đề ngẫu nhiên”, nhập đáp án (chấp nhận `13`, `2^13`, `8K`), bấm Kiểm tra. Sai ở đâu sẽ có gợi ý ngay dưới ô.

## Chạy kiểm thử

Cần Node.js 18 trở lên.

```
node tests/calculations.test.js
```

Kiểm thử bao phủ: dung lượng SRAM, ghép 4K × 8 thành 8KB (2 chip, 12/13 đường địa chỉ, A12 chọn chip, vùng địa chỉ), ví dụ 4K × 16, DRAM 128 × 128 và dồn kênh 7 chân, tín hiệu CS/OE/WE, bảng chân lý các bộ giải mã, ví dụ 16 bit của slide 43, đề 4GB/256KB/32B cho ba kiểu ánh xạ, tách địa chỉ 32 bit, mô phỏng hit/miss/conflict/FIFO, cấu hình không hợp lệ và chẩn đoán lỗi.

## Cấu trúc

```
index.html, memory-organization.html, cache-mapping.html
assets/css/style.css
assets/js/calc.js          phép tính thuần, dùng chung cho trình duyệt và kiểm thử
assets/js/common.js        thành phần giao diện dùng chung
assets/js/memory-lab.js    trang Tổ chức chip nhớ
assets/js/cache-lab.js     trang Cache
tests/calculations.test.js
SLIDE_COVERAGE.md          slide nào nằm ở đâu
TECHNICAL_NOTES.md         chỗ slide chưa nhất quán, giả định mô phỏng, kiểm tra đã chạy
```
