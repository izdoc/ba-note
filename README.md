# ISTQB Lab

Site học và luyện thi ISTQB CTFL 4.0.1 bằng tiếng Việt.

## Chạy trên máy

```bash
python -m http.server 8080 --directory dist
```

Mở http://localhost:8080. Không cần cài thư viện hoặc build.

## Mã nguồn

- `dist/index.html`: giao diện HTML.
- `dist/style.css`: giao diện và responsive.
- `dist/app.js`: học, luyện thi, flashcards và theo dõi tiến độ.
- `dist/data.js`: bài học, câu hỏi và thuật ngữ.

Tiến độ lưu bằng localStorage trên trình duyệt; dùng xuất/nhập để sao lưu hoặc chuyển thiết bị. Ngân hàng ban đầu có 40 câu tự biên soạn, không phải đề thi chính thức. Nội dung cần được đối chiếu và cập nhật thủ công khi syllabus thay đổi.

Site: https://istqb-study-tim.tim90s.chatgpt.site
