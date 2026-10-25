# Phạm vi Git: skill và source dựng video

Đợt dọn ngày 25/10/2026:

- Giữ source, skill, script, cấu hình, lockfile, example props và font dùng chung.
- Media trong `Remotion/public/` (trừ `fonts/`) và staging public của professional editor được giữ trên máy, gỡ khỏi index và ignore. Checkout mới cần cấp lại các asset này để render các tập/demo liên quan.
- `_cleanup_review/` và `merge-backup-*/` là dữ liệu khôi phục cục bộ, giữ trên máy và ignore; không coi toàn bộ nội dung là bản trùng đã được kiểm chứng.
- `hyperframes/` là checkout upstream riêng: https://github.com/heygen-com/hyperframes.git. Không đưa gitlink thiếu `.gitmodules` vào repository cha. Commit source của HyperFrames từ chính checkout đó nếu cần.
- Xóa hai cache Webpack tái tạo được (792.005.005 byte), log render ở gốc Remotion và Python bytecode đã lọt vào index.
- Giữ `node_modules/` cục bộ để công việc đang dùng không phải cài lại; Git luôn bỏ qua.

Việc gỡ dữ liệu khỏi index không xóa dữ liệu đã có trong lịch sử commit. Không rewrite lịch sử Git trong đợt dọn này.

Chỉ kiểm tra phạm vi file Git và whitespace; không thay đổi logic dựng phim và không render lại video.
