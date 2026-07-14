# Moodle Sheet To XML

App FE-only dùng để chuyển file Excel/CSV theo template thành Moodle XML để import vào Moodle Question bank.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở: http://localhost:5173

## Luồng dùng

1. Tải file mẫu trong app hoặc dùng file `public/templates/moodle_xml_sheet_templates.xlsx`.
2. Điền câu hỏi vào các tab tương ứng.
3. Upload file `.xlsx` vào app.
4. Xem lỗi validate nếu có.
5. Bấm `Xuất Moodle XML`.
6. Vào Moodle → Question bank → Import → Moodle XML format → upload file `.xml`.

## Các type được hỗ trợ

- `single`: Trắc nghiệm 1 đáp án đúng.
- `multi`: Trắc nghiệm nhiều đáp án đúng.
- `truefalse`: Đúng/Sai.
- `shortanswer`: Trả lời ngắn.
- `numerical`: Câu hỏi số.
- `matching`: Ghép đôi, nhiều dòng cùng `question_id`.
- `essay`: Tự luận.
- `description`: Đoạn mô tả/đọc hiểu.
- `cloze`: Embedded answers theo cú pháp Cloze của Moodle.
- `dragdrop_text`: Kéo-thả từ/cụm từ vào chỗ trống trong văn bản, xuất ra Moodle XML type `ddwtos`.
- `select_missing_words`: Chọn từ/cụm từ còn thiếu bằng hộp chọn thả xuống, xuất ra Moodle XML type `gapselect`.

## Header chính nên có

```txt
category, question_id, type, question_name, question_text,
option_a, option_b, option_c, option_d, option_e, option_f,
correct_answer, left_text, right_text, explanation, grade,
passage_id, passage_text, tolerance, drag_no, drag_text, group, unlimited
```

## Ghi chú

- `matching`: app tự gom các dòng có cùng `question_id` thành 1 câu.
- `multi`: `correct_answer` nhập dạng `A,C` hoặc `A;C`.
- `shortanswer`: nhiều đáp án đúng cách nhau bằng `;`, ví dụ `Hà Nội;Ha Noi`.
- `truefalse`: chấp nhận `TRUE/FALSE`, `Đúng/Sai`, `1/0`.
- `dragdrop_text`: nhập nhiều dòng cùng `question_id`; `question_text` chứa chỗ trống dạng `[[1]]`, `[[2]]`; mỗi dòng có `drag_no`, `drag_text`, `group`, `unlimited`.
- `select_missing_words`: nhập giống `dragdrop_text` nhưng Moodle hiển thị dạng dropdown; dùng `drag_no`, `drag_text`, `group`, không cần `unlimited`.
- Preview câu hỏi tự tải MathJax để render LaTeX trong text như `$x^2$`, `$$...$$`, `\(...\)` hoặc `\[...\]` khi trình duyệt có kết nối mạng.
- Nội dung câu hỏi/đáp án được bọc CDATA để tránh lỗi XML với HTML, LaTeX, ký tự `<`, `>`, `&`.
