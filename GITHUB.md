# 推送到 GitHub（简明说明）

本文说明在本仓库 **`D:\Go\GG\PDF`**（或你的克隆路径）下，如何把代码提交并推送到远程仓库。

---

## 前置条件

1. 已安装 [Git](https://git-scm.com/downloads)。
2. 已在 [GitHub](https://github.com) 创建仓库（例如：`https://github.com/zhouduaofei-alt/pdf`）。
3. 本机已登录 GitHub（HTTPS 用 **Personal Access Token** 作密码，或已配置 **SSH 密钥**）。

---

## 第一次：关联远程（只需做一次）

在**项目根目录**打开 PowerShell 或终端：

```powershell
cd D:\Go\GG\PDF
git remote -v
```

若**没有** `origin`，添加远程（把地址换成你的仓库）：

```powershell
git remote add origin https://github.com/zhouduaofei-alt/pdf.git
```

若已加错，可改成正确地址：

```powershell
git remote set-url origin https://github.com/zhouduaofei-alt/pdf.git
```

默认分支建议使用 `main`：

```powershell
git branch -M main
```

---

## 日常：提交并推送

```powershell
cd D:\Go\GG\PDF
git status
git add -A
git commit -m "简要说明这次改了什么"
git pull origin main --rebase
git push -u origin main
```

说明：

- **`git add -A`**：把所有变更（含删除）加入暂存区。
- **`git commit -m "..."`**：提交到本地；`-m` 里写**真实说明**，不要用占位句。
- **`git pull ... --rebase`**：若远程有别人提交，先变基再推，减少无意义合并提交。若提示有未提交修改，请先 `commit` 或 `git stash`。
- **`git push -u origin main`**：推到 GitHub；`-u` 只需第一次，之后可直接 **`git push`**。

---

## PowerShell 注意（避免误把 `PS` 当命令）

提示符形如 **`PS D:\Go\GG\PDF>`**，其中 **`PS` 是提示符的一部分**。  
复制命令时**不要**把 `PS` 一起复制进去；在 PowerShell 里 **`PS` 会被当成 `Get-Process` 的别名**，容易报错。

正确：在提示符**后面**只输入：

```text
git push
```

错误示例：整行粘贴成 `PS git push` 之类。

---

## 常见提示含义

| 提示 | 含义 |
|------|------|
| `Everything up-to-date` | 本地已和远程一致，没有新提交需要推送。 |
| `nothing to commit, working tree clean` | 没有未提交的修改，无需 `commit`。 |
| `You have unstaged changes`（在 `pull --rebase` 时） | 有未提交修改；先 `git add` + `git commit`，或 `git stash` 再拉取。 |

---

## 与 CI / Pages 配合（可选）

若 GitHub 接了 **Cloudflare Pages**、**Netlify**、**Vercel** 等：推送 `main` 后，平台会按仓库里的构建命令执行 **`npm run build`**，请把 **`dist`** 或平台要求的输出目录配好，并保证 **`package.json`** 里 **`postinstall`** 等脚本在云端能跑通（例如复制 `pdfjs-wasm`）。

---

## 本仓库远程示例

当前远程一般为：

```text
origin  https://github.com/zhouduaofei-alt/pdf.git
```

若你 fork 或改名了仓库，用 **`git remote set-url origin <你的新地址>`** 更新即可。
