# 代码文件批量保存器

一个实用的 Chrome 浏览器扩展，用于从网页中智能识别和批量下载代码文件。特别适用于从 AI 对话、技术文档、教程等页面中提取多个代码文件。
一键保存代码到文件，无需手工ctrl+c、ctrl+v。

## 功能特性

- **智能识别** - 自动检测网页中的代码块和对应的文件路径
- **批量下载** - 将所有代码文件打包为 ZIP 压缩包，一键下载
- **文件预览** - 下载前可预览所有检测到的代码文件
- **选择性保存** - 支持选择要保存的特定文件
- **目录结构** - 自动保持原有的目录结构
- **多语言支持** - 支持 JavaScript、TypeScript、Python、Java、Go、Rust 等多种编程语言
- **实时监控** - 动态检测页面内容变化，实时更新可保存文件数量

## 技术栈

- **Manifest V3** - 使用最新的 Chrome 扩展清单版本
- **JSZip** - 用于创建 ZIP 压缩包
- **纯原生 JavaScript** - 无需额外框架依赖

## 项目结构

```
code-save-file/
├── manifest.json         # 扩展配置文件
├── background.js         # 后台服务脚本
├── content.js            # 内容脚本 (核心功能)
├── styles.css            # 样式文件
├── libs/
│   └── jszip.min.js     # ZIP 压缩库
├── icon16.png           # 扩展图标 16x16
├── icon32.png           # 扩展图标 32x32
└── README.md            # 项目说明文档
```

## 安装步骤

### 方式一：开发者模式加载（推荐用于开发测试）

1. 克隆或下载本项目到本地
   ```bash
   git clone https://github.com/rcnn/code-save-file.git
   ```

2. 打开 Chrome 浏览器，进入扩展程序管理页面
   - 地址栏输入: `chrome://extensions/`
   - 或通过菜单: 更多工具 → 扩展程序

3. 开启右上角的"开发者模式"

4. 点击"加载已解压的扩展程序"

5. 选择项目文件夹 `code-save-file`

6. 扩展安装完成，图标会显示在浏览器工具栏

### 方式二：Chrome Web Store（待发布）

待扩展上架 Chrome Web Store 后，可直接在线安装。

## 使用方法

### 1. 自动检测

访问包含代码块的网页时，扩展会自动检测页面中的代码文件。如果检测到文件，页面右下角会显示悬浮按钮。

### 2. 支持的页面格式

扩展会识别以下格式的代码块：

```markdown
## src/components/App.js
​```javascript
function App() {
  return <div>Hello World</div>;
}
​```

## utils/helper.ts
​```typescript
export function helper() {
  console.log('Helper function');
}
​```
```

标题格式支持：
- `文件名.扩展名` - 直接使用文件名
- `1. 文件名.扩展名` - 带序号
- `路径/文件名.扩展名` - 完整路径
- `文件: 文件名.扩展名` - 带前缀

### 3. 批量保存流程

1. 点击右下角的"批量保存 N 个文件"按钮
2. 在弹出的对话框中查看检测到的文件列表
3. 可选择：
   - **全选/全不选** - 快速选择所有文件
   - **预览选中** - 在新对话框中预览代码内容
   - **下载为 ZIP** - 将选中的文件打包下载
4. 点击"下载为 ZIP"后，文件会自动保存到默认下载目录

### 4. ZIP 文件内容

下载的压缩包包含：
- `README.md` - 文件清单和保存信息
- 所有选中的代码文件（保持原有目录结构）

## 技术实现

### 核心功能模块

#### 1. 文件检测 (`detectFileStructure`)
- 扫描页面中的标题元素（h1-h4）
- 提取文件路径信息
- 查找对应的代码块
- 验证文件路径格式

#### 2. 代码提取 (`extractCleanCode`)
- 从语法高亮的代码块中提取纯文本
- 移除复制按钮、行号等辅助元素
- 清理特殊字符和格式问题

#### 3. ZIP 打包 (`downloadAsZip`)
- 使用 JSZip 创建压缩包
- 添加文件并保持目录结构
- 生成 README 文件清单
- 触发浏览器下载

#### 4. 用户界面
- 悬浮按钮显示文件数量
- 文件列表对话框
- 代码预览对话框
- 实时状态提示

### 权限说明

```json
{
  "permissions": [
    "activeTab",    // 访问当前标签页内容
    "downloads"     // 触发文件下载
  ]
}
```

## 支持的文件类型

| 扩展名 | 语言 | MIME 类型 |
|--------|------|-----------|
| .js | JavaScript | text/javascript |
| .ts | TypeScript | text/typescript |
| .jsx | React JSX | text/javascript |
| .tsx | React TSX | text/typescript |
| .json | JSON | application/json |
| .html | HTML | text/html |
| .css | CSS | text/css |
| .md | Markdown | text/markdown |
| .py | Python | text/x-python |
| .java | Java | text/x-java |
| .cpp | C++ | text/x-c++src |
| .go | Go | text/x-go |
| .rs | Rust | text/x-rustsrc |
| .php | PHP | text/x-php |
| .rb | Ruby | text/x-ruby |
| .sh | Shell | text/x-shellscript |

## 浏览器兼容性

- **Chrome** - v88+（推荐）
- **Edge** - v88+（基于 Chromium）
- **其他 Chromium 浏览器** - 理论上支持 Manifest V3 的版本

## 开发说明

### 修改代码后重新加载

1. 在 `chrome://extensions/` 页面找到本扩展
2. 点击刷新图标（或快捷键 Ctrl+R）
3. 刷新测试页面

### 调试

- **内容脚本调试** - 在网页中按 F12，查看控制台输出
- **后台脚本调试** - 在扩展管理页面点击"Service Worker"，打开后台调试工具

### 文件说明

- **manifest.json** - 扩展配置，定义权限、脚本加载等
- **content.js** - 注入到网页中的脚本，负责检测和提取代码
- **background.js** - 后台服务，处理下载请求
- **styles.css** - UI 样式定义

## 常见问题

### Q: 为什么没有检测到文件？

A: 请确保页面格式符合要求：
- 标题中包含文件名和扩展名
- 标题后紧跟 `<pre>` 代码块
- 文件扩展名在支持列表中

### Q: 下载的文件是否保留目录结构？

A: 是的，扩展会自动保持原有的目录结构。例如 `src/components/App.js` 会在 ZIP 中创建对应的文件夹。

### Q: 可以只下载部分文件吗？

A: 可以。在文件列表对话框中取消勾选不需要的文件即可。

### Q: 支持自定义文件命名规则吗？

A: 当前版本使用页面中的文件路径。如需自定义，可以修改 `content.js` 中的 `detectFileStructure` 函数。

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 更新日志

### v1.0.0 (2024-10-20)

- 初始版本发布
- 支持智能识别网页代码文件
- 批量打包下载为 ZIP
- 文件预览功能
- 支持 20+ 种编程语言
- 实时监控页面变化

## 致谢

- [JSZip](https://stuk.github.io/jszip/) - ZIP 文件创建库

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue: [GitHub Issues](https://github.com/rcnn/code-save-file/issues)

---

**提示**: 本扩展特别适合从 ChatGPT、Claude 等 AI 对话中批量保存生成的代码文件，大大提高开发效率！
