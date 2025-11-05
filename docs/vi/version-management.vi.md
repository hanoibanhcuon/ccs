# Quản Lý Phiên Bản

## Tổng Quan

CCS sử dụng hệ thống quản lý phiên bản tập trung để đảm bảo tính nhất quán trên tất cả các thành phần.

## Vị Trí Phiên Bản

Số phiên bản phải được đồng bộ hóa trên các tệp sau:

1. **`VERSION`** - Tệp phiên bản chính (được đọc bởi ccs/ccs.ps1 tại runtime)
2. **`installers/install.sh`** - Hardcoded cho các cài đặt độc lập (`curl | bash`)
3. **`installers/install.ps1`** - Hardcoded cho các cài đặt độc lập (`irm | iex`)

## Tại Sao Hardcoded Phiên Bản trong Installers?

Khi người dùng chạy:
- `curl -fsSL ccs.kaitran.ca/install | bash`
- `irm ccs.kaitran.ca/install.ps1 | iex`

Script installer được tải xuống và thực thi trực tiếp **không** có tệp VERSION. Do đó, installers phải có phiên bản hardcoded làm dự phòng.

Đối với các cài đặt dựa trên git, tệp VERSION sẽ được đọc nếu có, ghi đè phiên bản hardcoded.

## Cập Nhật Phiên Bản

### Phương Pháp Tự Động (Được khuyến nghị)

Sử dụng script được cung cấp để tự động tăng phiên bản:

```bash
# Tăng phiên bản patch (2.1.1 -> 2.1.2)
./scripts/bump-version.sh patch

# Tăng phiên bản minor (2.1.1 -> 2.2.0)
./scripts/bump-version.sh minor

# Tăng phiên bản major (2.1.1 -> 3.0.0)
./scripts/bump-version.sh major
```

Điều này cập nhật:
- Tệp VERSION
- installers/install.sh (phiên bản hardcoded)
- installers/install.ps1 (phiên bản hardcoded)

### Phương Pháp Thủ Công

Nếu cập nhật thủ công, cập nhật phiên bản ở CẢ BA vị trí:

1. **Tệp VERSION**:
   ```bash
   echo "2.1.2" > VERSION
   ```

2. **installers/install.sh** (dòng ~34):
   ```bash
   CCS_VERSION="2.1.2"
   ```

3. **installers/install.ps1** (dòng ~33):
   ```powershell
   $CcsVersion = "2.1.2"
   ```

## Checklist Release

Khi phát hành phiên bản mới:

- [ ] Cập nhật phiên bản sử dụng `./scripts/bump-version.sh X.Y.Z`
- [ ] Xem lại các thay đổi: `git diff`
- [ ] Cập nhật CHANGELOG.md với ghi chú release
- [ ] Commit các thay đổi: `git commit -am "chore: bump version to X.Y.Z"`
- [ ] Push: `git push`
- [ ] Xác nhận CloudFlare worker phục vụ installer đã cập nhật

## Hiển Thị Phiên Bản

Sau khi cài đặt, người dùng có thể kiểm tra phiên bản:

```bash
# Hiển thị phiên bản CCS (từ tệp VERSION nếu có)
ccs --version

# Hiển thị phiên bản Claude CLI
ccs version
```

## Semantic Versioning

CCS tuân theo [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Thay đổi đột phá
- **MINOR** (0.X.0): Tính năng mới (tương thích ngược)
- **PATCH** (0.0.X): Sửa lỗi

Phiên bản hiện tại: **2.1.1**
- 2.1.0: Thêm tính năng delegation tác vụ
- 2.1.1: Sửa lỗi phân tích đối số (cờ được coi là profiles)