# Tài Liệu Workflow CCS

Tài liệu workflow cho CCS v2.0.0 bao gồm cài đặt, hành vi runtime, và khắc phục sự cố.

---

## Tổng Quan Kiến Trúc

```
User Command: ccs [profile] [claude-args...]
         │
         ▼
┌─────────────────┐
│  ccs (wrapper)  │  ← Bash (Unix) hoặc PowerShell (Windows)
└────────┬────────┘
         │
         ├─ 1. Đọc ~/.ccs/config.json
         ├─ 2. Tìm profile → file settings
         ├─ 3. Xác nhận file settings tồn tại
         │
         ▼
    ┌────────────────┐
    │ Profile System │
    └───────┬────────┘
            │
            ├─ default: ~/.claude/settings.json
            └─ glm: ~/.ccs/glm.settings.json
            │
            ▼
    ┌──────────────────┐
    │   Claude CLI     │
    └──────────────────┘
```

### Các Thành Phần Chính

1. **ccs wrapper**: Script nhẹ (bash/PowerShell)
2. **Config file**: `~/.ccs/config.json` (profile → settings mappings)
3. **Settings files**: Định dạng JSON settings Claude CLI
4. **Claude CLI**: CLI chính thức của Anthropic (không thay đổi)

### Nguyên Tắc Thiết Kế

- **YAGNI**: Chỉ có 2 profiles (default/glm)
- **KISS**: Delegation đơn giản, không magic
- **DRY**: Một nguồn chân lý duy nhất (config.json)
- **Non-invasive**: Không bao giờ sửa ~/.claude/settings.json

---

## Workflow Cài Đặt

### Quy Trình

1. **Phát hiện Nền tảng**: Windows so với Unix
2. **Tạo thư mục**: `~/.ccs/`, `~/.local/bin`
3. **Dọn dẹp cài đặt cũ**: Xóa các cài đặt `/usr/local/bin` cũ (nếu là symlinks CCS)
4. **Cài đặt executables**:
   - Git mode: Symlink từ repo
   - Standalone: Tải xuống từ GitHub
5. **Cài đặt thư mục .claude**: Commands và skills
6. **Tạo config**: `config.json` nếu thiếu
7. **Tạo profile GLM**: `glm.settings.json` nếu thiếu
8. **Backup**: File `config.json.backup` duy nhất (ghi đè)
9. **Xác nhận**: Kiểm tra cú pháp JSON
10. **Cấu hình PATH**: Tự động phát hiện shell, thêm vào profile
11. **Hiển thị hướng dẫn**: Tải lại shell, API key GLM (nếu cần)

### Vị Trí Cài Đặt Thống Nhất (v2.2.0+)

**Tất cả Hệ Thống Unix**: `~/.local/bin/ccs`
- Người dùng có thể ghi, không cần sudo
- Cấu hình PATH tự động cho bash, zsh, fish
- Thiết lập idempotent (an toàn khi chạy nhiều lần)

**Windows**: `%USERPROFILE%\.ccs\ccs.ps1`
- Tự động thêm vào PATH người dùng

### Quản Lý Shell Profile

**Tự động phát hiện** (`detect_shell_profile()`):
- Trích xuất shell từ biến `$SHELL`
- Trả về file profile phù hợp:
  - bash: `~/.bashrc` (Linux) hoặc `~/.bash_profile` (macOS)
  - zsh: `~/.zshrc`
  - fish: `~/.config/fish/config.fish`
- Xác thực tên shell (chỉ chữ và số)
- Mặc định là `~/.bashrc` nếu không xác định được

**Kiểm tra PATH** (`check_path_configured()`):
- Kiểm tra nếu `~/.local/bin` trong `$PATH` hiện tại
- Trả về true nếu đã được cấu hình

**Thêm PATH** (`add_to_path()`):
- Tạo file profile nếu thiếu
- Kiểm tra comment marker CCS hiện có
- Thêm export PATH phù hợp cho shell:
  - bash/zsh: `export PATH="$HOME/.local/bin:$PATH"`
  - fish: `set -gx PATH $HOME/.local/bin $PATH`
- Idempotent: bỏ qua nếu đã thêm

**Workflow cấu hình** (`configure_shell_path()`):
- Kiểm tra nếu PATH đã được cấu hình
- Phát hiện shell profile
- Thêm entry PATH
- Hiển thị hướng dẫn tải lại
- Fallback sang hướng dẫn thủ công nếu thất bại

### Các Tệp Được Tạo

**Vị Trí Executable**:
- macOS / Linux: `~/.local/bin/ccs` (symlink đến `~/.ccs/ccs`)
- Windows: `%USERPROFILE%\.ccs\ccs.ps1`

**Thư Mục Cấu Hình** (`~/.ccs/`):
```
~/.ccs/
├── ccs                     # Tệp thực thi chính (symlink target)
├── config.json             # Profile mappings
├── config.json.backup      # Backup duy nhất (không timestamp)
├── glm.settings.json       # Profile GLM
├── VERSION                 # Tệp phiên bản
├── uninstall.sh            # Uninstaller
└── .claude/                # Tích hợp Claude Code
    ├── commands/ccs.md
    └── skills/ccs-delegation/
```

---

## Workflow Runtime

### Unix/Linux/macOS

```
ccs [profile] [args]
  ↓
Đọc config.json
  ↓
Tìm profile → đường dẫn file settings
  ↓
Xác nhận file tồn tại
  ↓
exec claude --settings <path> [args]
```

### Windows

```
ccs [profile] [args]
  ↓
Đọc config.json
  ↓
Tìm profile → đường dẫn file settings
  ↓
Xác nhận file tồn tại
  ↓
exec claude --settings <path> [args]
```

---

## Hệ Thống Profile

### Cấu Trúc Config

```json
{
  "profiles": {
    "glm": "~/.ccs/glm.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

### Định Dạng File Settings

**Profile GLM** (`~/.ccs/glm.settings.json`):
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your_api_key",
    "ANTHROPIC_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.6"
  }
}
```

**Claude (Default)** (`~/.claude/settings.json`):
- Người dùng quản lý, CCS không bao giờ sửa nó
- Được tham chiếu bởi profile default

---

## Khắc Phục Sự Cố

### Profile Không Tìm Thấy

| Kiểm Tra | Sửa |
|----------|-----|
| config.json tồn tại? | Chạy installer |
| JSON hợp lệ? | Sửa cú pháp hoặc phục hồi từ backup |
| Profile trong config? | Thêm profile hoặc dùng default/glm |
| File settings tồn tại? | Tạo từ template |

### Lỗi PowerShell (Windows)

**Lỗi**: Lỗi `SetEnvironmentVariable`

**Sửa**:
1. Kiểm tra định dạng settings có `{"env": {...}}`
2. Đảm bảo tất cả giá trị là chuỗi (không phải boolean/objects)
3. Xóa các trường không thuộc env khỏi file settings

### Vấn Đề Cài Đặt

| Vấn Đề | Sửa |
|---------|-----|
| 404 Not Found | Kiểm tra installers tồn tại trong GitHub |
| Permission denied | Kiểm tra quyền ~/.ccs/ |
| jq không tìm thấy | Cài đặt jq: `brew install jq` (Unix) |
| Cảnh báo PATH | Thêm `~/.local/bin` vào PATH |

---

## Tiêu Chuẩn Output Terminal

### Các Hàm Màu

**Phát Hiện TTY**: Màu chỉ hiển thị khi output ra terminal (không pipe/redirect)
```bash
if [[ -t 2 ]] && [[ -z "${NO_COLOR:-}" ]]; then
  # Bật màu
else
  # Tắt màu
fi
```

**Hỗ Trợ NO_COLOR**: Tôn trọng biến môi trường `NO_COLOR`
```bash
export NO_COLOR=1  # Vô hiệu hóa tất cả output màu
```

### Các Loại Message

**Error Messages** (đỏ, trong khung):
```
╔═════════════════════════════════════════════╗
║  ERROR                                      ║
╚═════════════════════════════════════════════╝
```

**Critical Messages** (đỏ, trong khung, "ACTION REQUIRED"):
```
╔═════════════════════════════════════════════╗
║  ACTION REQUIRED                            ║
╚═════════════════════════════════════════════╝
```

**Warning Messages** (vàng):
```
[!] WARNING
```

**Success Messages** (xanh lá):
```
[OK] Success message
```

**Info Messages** (thường):
```
[i] Information
```

### Ký Tự ASCII (Không Emojis)

Tất cả output sử dụng ký tự ASCII để tương thích:
- `[OK]` - Thành công
- `[!]` - Cảnh báo
- `[X]` - Lỗi/Thất bại
- `[i]` - Thông tin

## Các Điểm Chính

1. **Cài Đặt**: Vị trí thống nhất (`~/.local/bin`), cấu hình PATH tự động, xác nhận JSON
2. **Runtime**: Delegation đơn giản đến Claude CLI qua flag `--settings`
3. **Đa nền tảng**: Vị trí Unix thống nhất, hành vi giống hệt nhau
4. **Non-invasive**: Không bao giờ chạm `~/.claude/settings.json`
5. **Xác nhận**: Kiểm tra cú pháp JSON ngăn chặn lỗi
6. **Backup**: File duy nhất, ghi đè mỗi lần cài
7. **Output Terminal**: Phát hiện TTY, hỗ trợ NO_COLOR, chỉ ký tự ASCII
8. **Hỗ Trợ Shell**: Tự động phát hiện bash, zsh, fish

---

**Phiên bản**: v2.2.0
**Cập nhật**: 2025-11-03