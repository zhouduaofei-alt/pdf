# Linux 服务器部署说明（Nginx + 静态 `dist`）

本文面向 **Ubuntu 22.04 (jammy)** 等常见发行版，说明在自有 VPS 上部署本仓库（Vite + React 单页应用）的推荐流程：**构建出 `dist` 后由 Nginx 托管静态文件**。

---

## 一、你需要准备什么

| 项目 | 说明 |
|------|------|
| 服务器 | 已能 SSH 登录（示例中以 `root` 为例，生产环境建议用普通用户 + `sudo`）。 |
| 域名（可选） | 有域名可配 HTTPS；仅用 IP 访问也可先跑 HTTP。 |
| 代码来源 | **二选一**：① `git clone` 仓库后在服务器构建；② 在本地 Windows 构建后 **只上传 `dist` 目录**。 |

---

## 二、安装系统依赖

### 2.1 Git 与 Nginx

```bash
sudo apt update
sudo apt install -y git nginx curl
```

### 2.2 Node.js（不要用系统过旧的 `apt install nodejs`）

推荐用 **NodeSource** 安装 **Node 20 或 22 LTS**（本项目使用 Vite 8，需要较新 Node）：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

若 `curl` 执行 NodeSource 脚本时，中途弹出 **粉/紫色对话框**（例如 *Pending kernel upgrade*）：

- **不能用鼠标点**，用键盘：**Tab** 切到 `Ok`，**Enter** 确认。
- 若另一个终端正在跑 `apt`，会出现 **“Could not get lock …”**，需等前一个 `apt` 结束，不要同时开两个 `apt`。

---

## 三、方式 A：在服务器上 `git clone` 再构建

### 3.1 克隆代码

**公开仓库**可直接：

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/zhouduaofei-alt/pdf.git
sudo chown -R "$USER:$USER" pdf
cd pdf
```

**私有仓库**需任选其一：

- 将仓库改为 **Public**；或  
- **HTTPS + Personal Access Token**：  
  `git clone https://<用户名>:<TOKEN>@github.com/zhouduaofei-alt/pdf.git`  
  （勿泄露 Token、勿截图外传）；或  
- **SSH Deploy Key**：在服务器 `ssh-keygen`，把公钥加到 GitHub 仓库 **Settings → Deploy keys**，再用 `git@github.com:zhouduaofei-alt/pdf.git` 克隆。

### 3.2 安装依赖并构建

```bash
cd /var/www/pdf
npm ci
```

若无 `package-lock.json` 或希望宽松安装，可用：`npm install`

```bash
npm run build
```

构建成功后会生成目录 **`dist/`**（内含 `index.html`、`assets/`、各工具路由下的 `index.html`、`robots.txt` 等）。

#### 可选：生成带域名的 sitemap / canonical

若希望构建产物里写入 **canonical**、**sitemap.xml**（需部署域名已确定）：

```bash
export SITE_URL="https://你的域名.com"
npm run build
```

未设置 `SITE_URL` 时仍会生成各路由的静态 `index.html`，但不会写入错误域名的 canonical（详见 `scripts/generate-seo-pages.mjs` 注释）。

---

## 四、方式 B：本机构建，只上传 `dist`（服务器可不装 Node）

在 **Windows** 开发机：

```powershell
cd D:\Go\GG\PDF
npm run build
```

用 **WinSCP、FileZilla、`scp`、压缩包上传解压** 等方式，将 **`dist` 目录内的所有文件** 上传到服务器，例如：

```text
/var/www/pdf/
├── index.html
├── assets/
├── robots.txt
├── tools/
├── privacy/
└── …
```

注意：**网站根目录应对应 `dist` 里的内容**，不要多一层无意义的空文件夹导致 Nginx `root` 指错。

此方式服务器上 **无需** `git`、`npm`，只需 **Nginx**。

---

## 五、配置 Nginx

### 5.1 新建站点配置

将 **`/var/www/pdf`** 换成你实际的 **`dist` 绝对路径**（方式 A 一般为 `/var/www/pdf/dist`，方式 B 若直接把 `dist` 内容放到 `/var/www/pdf` 则 `root` 为 `/var/www/pdf`）。

方式 A 示例（代码在 `/var/www/pdf`，构建产物在 **`dist`**）：

```bash
sudo nano /etc/nginx/sites-available/pdf.conf
```

写入（**务必**包含下面 **`.mjs` 的 MIME** 与 **权限** 小节，否则浏览器会报 *Strict MIME type*，PDF 转换也会失败）：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;   # 有域名时改为: server_name 你的域名.com;

    root /var/www/pdf/dist;
    index index.html;

    # Vite 打出来的 chunk 常为 .mjs；若被标成 application/octet-stream，ES module 会被浏览器拒绝加载
    location ~* \.mjs$ {
        default_type application/javascript;
    }

    location / {
        try_files $uri $uri/ $uri/index.html /index.html;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

### 5.1.1 目录权限（避免 JS/CSS 返回 **403**）

若 `dist` 由 **root** 执行 `npm run build` 生成，可能出现目录 **755、文件 644 以外** 的组合，导致 **Nginx 工作进程（一般为 `www-data`）无法读文件**，控制台出现 **`Failed to load resource: 403`**，进而 PDF 转 Word 报「转换失败」。

构建或更新后执行一次：

```bash
sudo chmod -R a+rX /var/www/pdf/dist
```

仍有个别 403 时，再检查父目录是否可进入：

```bash
sudo chmod a+rx /var/www /var/www/pdf
```

自检（任选一个 `assets` 里的真实文件名）：

```bash
curl -sI "http://127.0.0.1/assets/index-XXXXX.js" | head -5
```

应看到 **`200`**，且 **`Content-Type`** 含 **`javascript`**（不要是 **`application/octet-stream`**）。

### 5.2 启用并重载

```bash
sudo ln -sf /etc/nginx/sites-available/pdf.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

若与默认站点冲突，可禁用默认站：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 5.3 防火墙（若启用 ufw）

```bash
sudo ufw allow 'Nginx Full'
# 或: sudo ufw allow 80 && sudo ufw allow 443
sudo ufw reload
```

浏览器访问：`http://服务器IP/` 或 `http://你的域名/`。

> 说明：**Cloudflare Pages** 用的 `public/_redirects` 只在 Cloudflare 生效；**Nginx** 需使用上面的 **`try_files`**，不要依赖 `_redirects` 文件。

---

## 六、HTTPS（建议公网正式使用时配置）

在 **80 端口可访问** 且 **域名已解析到本机** 时：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

按提示完成证书申请与自动续期。

---

## 七、以后更新站点

### 方式 A（服务器上构建）

```bash
cd /var/www/pdf
git pull
npm ci
npm run build
sudo systemctl reload nginx
```

### 方式 B（本机构建后只传 dist）

本地 `npm run build` 后，用工具 **覆盖上传** 服务器上原 `dist` 对应目录中的文件，然后：

```bash
sudo systemctl reload nginx
```

---

## 八、常见问题

| 现象 | 处理 |
|------|------|
| 打开子路径刷新 404 | 检查 Nginx 是否包含 `try_files … /index.html;` |
| 控制台 **403**、**MIME / octet-stream**、转换失败 | ① **`sudo chmod -R a+rX /var/www/pdf/dist`**；② Nginx 为 **`.mjs`** 设置 **`default_type application/javascript`**（见上文示例）。 |
| PDF 转 Word 空白、JPX 失败 | 确认 **`dist` 内存在** `pdfjs-wasm/openjpeg_nowasm_fallback.js`（由 `postinstall` 复制进 `public` 再被 Vite 打进产物）；仅上传 `dist` 时不要漏掉该目录。 |
| `npm run build` 内存不足 | 临时加 swap，或在本机构建后只传 `dist`。 |
| 仅 HTTP 下部分 API 异常 | 公网建议上 **HTTPS**；本机 `localhost` 一般为安全上下文。 |

---

## 九、与 GitHub 推送的关系

日常开发仍可将代码推送到 GitHub（见仓库根目录 **`GITHUB.md`**）。服务器部署与推送独立：可在服务器 `git pull` 构建，也可完全不使用 Git、只上传 `dist`。

---

## 十、安全建议

- 生产环境尽量避免长期用 **root** SSH；限制密码登录、使用密钥登录。  
- 定期 **`apt upgrade`**，内核提示重启时择窗 **`sudo reboot`**。  
- 勿在服务器历史记录、截图中保留 **GitHub Token**。
