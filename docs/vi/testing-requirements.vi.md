# Yêu cầu & Quy trình Kiểm tra CCS

**Phiên bản:** 2.1.4
**Cập nhật lần cuối:** 2025-11-03
**Trạng thái:** Hoạt động

## Tổng quan

Tài liệu này vạch ra các yêu cầu và quy trình kiểm tra toàn diện cho dự án CCS (Claude Code Switch). Tuân thủ các hướng dẫn này đảm bảo các bản phát hành nhất quán, đáng tin cậy và tương thích đa nền tảng.

## Cấu trúc Suite Test

### Các File Test Chính

| File Test | Mục đích | Độ bao phủ | Nền tảng |
|-----------|---------|------------|-----------|
| `tests/uninstall-test.sh` | Xác nhận chức năng gỡ cài đặt | 20 tests | Unix/Linux/macOS |
| `tests/uninstall-test.ps1` | Xác nhận chức năng gỡ cài đặt | 20 tests | Windows |
| `tests/edge-cases.sh` | Kiểm tra trường hợp biên toàn diện | 37 tests | Unix/Linux/macOS |
| `tests/edge-cases.ps1` | Kiểm tra trường hợp biên toàn diện | 37 tests | Windows |

### Các Danh mục Test

#### 1. Tests Chức năng Gỡ cài đặt (20 tests)
**File:** `tests/uninstall-test.sh` / `tests/uninstall-test.ps1`

**Các phần:**
1. **Gỡ cài đặt Trống (3 tests)**
   - Lệnh thực thi không có lỗi
   - Thông báo "nothing to uninstall" phù hợp
   - Báo cáo 0 items bị xóa đúng

2. **Vòng lặp Cài đặt/Gỡ cài đặt (5 tests)**
   - Thực thi gỡ cài đặt sạch
   - Xóa file lệnh ccs.md
   - Xóa thư mục kỹ năng ccs-delegation
   - Bảo tồn các lệnh khác (non-invasive)
   - Bảo tồn các kỹ năng khác (non-invasive)

3. **Idempotency (2 tests)**
   - Gỡ cài đặt lần thứ hai thành công
   - Báo cáo không tìm thấy gì trong các lần chạy tiếp theo

4. **Định dạng Output (4 tests)**
   - Chứa headers vẽ khung
   - Hiển thị thông báo thành công
   - Cung cấp hướng dẫn cài đặt lại

5. **Tests Tích hợp (3 tests)**
   - Không có lỗi profile khi gỡ cài đặt
   - Lệnh version vẫn hoạt động
   - Lệnh help vẫn hoạt động

6. **Trường hợp Biên (3 tests)**
   - Xử lý các cài đặt một phần
   - Xử lý các thư mục thiếu
   - Quản lý các kịch bản lỗi một cách khéo léo

#### 2. Trường hợp Biên Toàn diện (37 tests)
**File:** `tests/edge-cases.sh` / `tests/edge-cases.ps1`

**Các lĩnh vực bao phủ:**
- **Lệnh Version (3 tests)**
- **Lệnh Help (2 tests)**
- **Phân tích Đối số (6 tests)**
- **Lệnh Profile (4 tests)**
- **Xử lý Lỗi (3 tests)**
- **Trường hợp Biên (6 tests)**
- **Xác nhận Cấu hình (6 tests)**
- **Mô phỏng Sử dụng Thực tế (3 tests)**
- **Tests Cụ thể theo Nền tảng (4 tests)**

## Yêu cầu Môi trường Kiểm tra

### Cô lập Biến Môi trường

**Yêu cầu Quan trọng:** Tất cả tests phải sử dụng thư mục HOME cô lập để ngăn tác động đến dữ liệu người dùng.

**Mẫu Triển khai:**
```bash
# Unix/Linux/macOS
HOME=/tmp/test-ccs-home ./ccs --install
HOME=/tmp/test-ccs-home ./ccs --uninstall

# Windows PowerShell
$env:HOME = "C:\temp\test-ccs-home"
.\ccs.ps1 --install
.\ccs.ps1 --uninstall
```

**Yêu cầu Xác nhận:**
- ✅ Cài đặt sử dụng thư mục test (không `~/.claude`)
- ✅ Gỡ cài đặt chỉ xóa file từ thư mục test
- ✅ Thư mục người dùng thực tế hoàn toàn không bị ảnh hưởng
- ✅ Đạt được cô lập test hoàn hảo

### Tương thích Đa nền tảng

**Mẫu Cụ thể theo Nền tảng:**
- **Phiên bản Bash:** Sử dụng `$HOME/.claude` trực tiếp
- **Phiên bản PowerShell:** Sử dụng mẫu ưu tiên HOME với fallback USERPROFILE

**Mẫu PowerShell:**
```powershell
$HomeDir = if ($env:HOME) { $env:HOME } else { $env:USERPROFILE }
```

## Quy trình Thực thi Test

### Điều kiện tiên quyết

1. **Môi trường Test Sạch**
   ```bash
   # Xóa bất kỳ cài đặt CCS hiện có
   rm -rf ~/.ccs ~/.local/bin/ccs
   ```

2. **Công cụ Bắt buộc**
   - bash 3.2+ (Unix/Linux/macOS)
   - PowerShell 5.1+ (Windows)
   - Claude CLI 2.0.31+
   - jq 1.6+ (tùy chọn, để xác nhận JSON)

### Chạy Tests

#### Unix/Linux/macOS
```bash
# Điều hướng đến thư mục CCS
cd /path/to/ccs

# Chạy tests gỡ cài đặt
./tests/uninstall-test.sh

# Chạy tests trường hợp biên
./tests/edge-cases.sh

# Chạy tất cả tests (suite đầy đủ)
./tests/uninstall-test.sh && ./tests/edge-cases.sh
```

#### Windows
```powershell
# Điều hướng đến thư mục CCS
cd C:\path\to\ccs

# Chạy tests gỡ cài đặt
.\tests\uninstall-test.ps1

# Chạy tests trường hợp biên
.\tests\edge-cases.ps1

# Chạy tất cả tests (suite đầy đủ)
.\tests\uninstall-test.ps1; .\tests\edge-cases.ps1
```

### Kết quả Mong đợi

**Tiêu chí Thành công:**
- **Tỷ lệ Pass Test Tổng thể:** 100%
- **Suite Test Cá nhân:** Mỗi phải pass 100%
- **Cô lập Môi trường:** Không tác động đến dữ liệu người dùng
- **Tính nhất quán Đa nền tảng:** Hành vi giống hệt nhau trên các nền tảng

**Output Mẫu:**
```
=== CCS Uninstall Test Results ===
Total Tests: 20
Passed: 20 (100%)
Failed: 0 (0%)
Status: ✅ ALL TESTS PASSED
```

## Tiêu chuẩn Chất lượng

### Yêu cầu Chất lượng Code

1. **Xác nhận Cú pháp**
   ```bash
   # Kiểm tra cú pháp bash
   bash -n ccs
   bash -n install.sh
   bash -n uninstall.sh

   # Kiểm tra cú pháp PowerShell
   Get-Command Test-Path -Syntax ccs.ps1
   ```

2. **Tính nhất quán Mẫu**
   - Mẫu biến môi trường ưu tiên HOME
   - Xử lý lỗi nhất quán
   - Định dạng output đồng nhất

3. **Xác nhận Bảo mật**
   - Không tác động đến dữ liệu người dùng
   - Quyền file thích hợp
   - Không truy cập thư mục trái phép

### Yêu cầu Kiểm tra Chức năng

1. **Kiểm tra Happy Path**
   - Các hoạt động tiêu chuẩn hoạt động hoàn hảo
   - Các hành vi mặc định hoạt động như mong đợi
   - Các workflows người dùng hoàn thành thành công

2. **Xử lý Trường hợp Biên**
   - Xử lý mạnh mẽ các đầu vào không mong đợi
   - Chế độ thất bại khéo léo
   - Thông báo lỗi rõ ràng với giải pháp có thể hành động

3. **Kiểm tra Tích hợp**
   - Tích hợp CLI với tất cả các lệnh
   - Các hoạt động PATH hoạt động đúng
   - Xử lý biến môi trường đáng tin cậy

## Chỉ số Độ bao phủ Test

### Độ bao phủ Hiện tại (v2.1.4)

| Danh mục Test | Tests | Tỷ lệ Pass | Trạng thái |
|---------------|-------|------------|------------|
| Chức năng Gỡ cài đặt | 20 | 100% | ✅ Hoàn thành |
| Trường hợp Biên | 37 | 100% | ✅ Hoàn thành |
| Xác nhận Đa nền tảng | 57 | 100% | ✅ Hoàn thành |
| Cô lập Môi trường | 57 | 100% | ✅ Hoàn thành |
| **Tổng độ bao phủ** | **57** | **100%** | **✅ Hoàn thành** |

### Mục tiêu Độ bao phủ cho các Bản phát hành Tương lai

| Chỉ số | Mục tiêu | Trạng thái Hiện tại |
|--------|----------|---------------------|
| Tỷ lệ Pass Test | >95% | 100% ✅ |
| Độ bao phủ Đa nền tảng | 100% | 100% ✅ |
| Độ bao phủ Trường hợp Biên | >90% | 100% ✅ |
| Cô lập Môi trường | 100% | 100% ✅ |
| Xác nhận Bảo mật | 100% | 100% ✅ |

## Tích hợp Kiểm tra Tự động

### Yêu cầu Pipeline CI/CD

**Tích hợp Được khuyến nghị:**
```yaml
# Ví dụ GitHub Actions
- name: Run CCS Tests
  run: |
    ./tests/uninstall-test.sh
    ./tests/edge-cases.sh
```

**Lợi ích Tự động hóa Test:**
- Thực thi test nhất quán
- Phát hiện sớm các hồi quy
- Xác nhận đa nền tảng
- Cổng chất lượng tự động

### Kiểm tra Hiệu suất

**Tiêu chuẩn Thực thi Test:**
- **Tests Gỡ cài đặt:** ~15 giây
- **Tests Trường hợp Biên:** ~45 giây
- **Suite Tổng thể:** ~60 giây
- **Sử dụng Memory:** Tối thiểu
- **Disk I/O:** Được kiểm soát và tạm thời

## Quy trình Bảo trì Test

### Khi Cập nhật Tests

1. **Thêm Tính năng Mới**
   - Thêm các test case tương ứng
   - Cập nhật tài liệu test
   - Xác nhận tương thích đa nền tảng

2. **Triển khai Sửa lỗi**
   - Thêm các test hồi quy cho lỗi đã sửa
   - Xác nhận sửa không làm hỏng chức năng hiện có
   - Cập nhật chỉ số độ bao phủ test

3. **Thay đổi Nền tảng**
   - Kiểm tra trên các phiên bản nền tảng mới
   - Cập nhật các test case cụ thể theo nền tảng
   - Xác nhận tính tương thích

### Quy trình Xem xét Test

1. **Tích hợp Xem xét Code**
   - Tests được xem xét cùng với các thay đổi code
   - Đảm bảo độ bao phủ test cho chức năng mới
   - Xác nhận chất lượng và hiệu quả test

2. **Xác nhận Release**
   - Thực thi suite test đầy đủ trước các bản phát hành
   - Xác nhận đa nền tảng
   - Đánh giá hiệu suất

## Khắc phục Thất bại Test

### Các vấn đề Phổ biến

1. **Xung đột Biến Môi trường**
   - **Triệu chứng:** Tests ảnh hưởng đến thư mục người dùng
   - **Giải pháp:** Xác nhận mẫu cô lập HOME
   - **Phòng ngừa:** Luôn sử dụng môi trường test cô lập

2. **Vấn đề Quyền**
   - **Triệu chứng:** Thất bại hoạt động file
   - **Giải pháp:** Kiểm tra quyền và đường dẫn file
   - **Phòng ngừa:** Xác nhận điều kiện tiên quyết trước khi test

3. **Thất bại Cụ thể theo Nền tảng**
   - **Triệu chứng:** Tests pass trên một nền tảng, fail trên nền tảng khác
   - **Giải pháp:** Xem lại các đường dẫn code cụ thể theo nền tảng
   - **Phòng ngừa:** Kiểm tra trên tất cả các nền tảng được hỗ trợ

### Quy trình Gỡ lỗi

1. **Bật Output Chi tiết**
   ```bash
   # Thêm flags debug vào các script test
   ./tests/uninstall-test.sh --verbose
   ```

2. **Cô lập Tests Thất bại**
   ```bash
   # Chạy các phần test cá nhân
   ./tests/uninstall-test.sh --section=empty-uninstall
   ```

3. **Xác nhận Môi trường**
   ```bash
   # Kiểm tra biến môi trường
   echo "HOME: $HOME"
   echo "USERPROFILE: $USERPROFILE"
   ```

## Thực hành Tốt nhất

### Hướng dẫn Phát triển Test

1. **Cô lập Test**
   - Không bao giờ sửa dữ liệu người dùng trong tests
   - Sử dụng thư mục tạm thời cho tất cả các hoạt động file
   - Dọn dẹp tất cả các tạo phẩm test

2. **Cân nhắc Đa nền tảng**
   - Kiểm tra trên tất cả các nền tảng được hỗ trợ
   - Sử dụng mẫu không phụ thuộc nền tảng khi có thể
   - Xử lý các khác biệt cụ thể theo nền tảng một cách rõ ràng

3. **Khả năng Bảo trì**
   - Tài liệu test rõ ràng
   - Cấu trúc test nhất quán
   - Tiện ích test có thể tái sử dụng

### Cải tiến Liên tục

1. **Phân tích Độ bao phủ Test**
   - Đánh giá độ bao phủ định kỳ
   - Xác định các đường dẫn code chưa được test
   - Ưu tiên các lĩnh vực rủi ro cao

2. **Giám sát Hiệu suất**
   - Theo dõi thời gian thực thi test
   - Xác nhận các hồi quy hiệu suất
   - Tối ưu hóa các test case chậm

3. **Chỉ số Chất lượng**
   - Theo dõi tỷ lệ pass test
   - Theo dõi tỷ lệ phát hiện lỗi
   - Đo lường hiệu quả test

---

**Duy trì Bởi:** Kỹ sư QA & Đội phát triển
**Tần suất Xem xét:** Hàng tháng hoặc sau các bản phát hành lớn
**Cập nhật lần cuối:** 2025-11-03

**Câu hỏi chưa giải quyết:** Không
**Chặn khối:** Không
**Xem xét Tiếp theo:** Post release v2.1.4