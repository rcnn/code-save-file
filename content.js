(function() {
  'use strict';

  /**
   * 从带语法高亮的代码块中提取纯文本代码
   * @param {HTMLElement} preElement - <pre> 元素
   * @returns {string} 纯文本代码
   */
  function extractCleanCode(preElement) {
    // 方法1: 如果 <code> 标签存在，使用它
    const codeElement = preElement.querySelector('code');
    const targetElement = codeElement || preElement;
    
    // 方法2: 克隆元素以避免修改原始 DOM
    const clonedElement = targetElement.cloneNode(true);
    
    // 移除复制按钮等辅助元素
    const copyButtons = clonedElement.querySelectorAll('.copy-code-button, .copy-button, [class*="copy"]');
    copyButtons.forEach(btn => btn.remove());
    
    // 移除行号元素（如果有）
    const lineNumbers = clonedElement.querySelectorAll('.line-number, .line-numbers, [class*="line-num"]');
    lineNumbers.forEach(ln => ln.remove());
    
    // 方法3: 使用 textContent 或 innerText
    // textContent 保留所有文本和空白，innerText 更接近渲染效果
    let code = clonedElement.innerText || clonedElement.textContent;
    
    // 清理代码
    code = cleanExtractedCode(code);
    
    return code;
  }

  /**
   * 清理提取的代码文本
   * @param {string} code - 原始代码文本
   * @returns {string} 清理后的代码
   */
  function cleanExtractedCode(code) {
    // 移除开头和结尾的多余空行
    code = code.trim();
    
    // 处理可能的 Unicode 字符问题
    // 替换不间断空格为普通空格
    code = code.replace(/\u00A0/g, ' ');
    
    // 移除复制按钮的文本（如 "::after", "Copy" 等）
    code = code.replace(/^::after\s*\n?/gm, '');
    code = code.replace(/^Copy\s*\n?/gm, '');
    code = code.replace(/^Copied!\s*\n?/gm, '');
    
    // 确保使用统一的换行符（LF）
    code = code.replace(/\r\n/g, '\n');
    
    // 移除末尾多余的空白行（保留最多一个）
    code = code.replace(/\n{3,}$/g, '\n\n');
    
    return code;
  }

  /**
   * 检测文件类型并返回合适的 MIME 类型
   * @param {string} filePath - 文件路径
   * @returns {string} MIME 类型
   */
  function getMimeType(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'jsx': 'text/javascript',
      'tsx': 'text/typescript',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'py': 'text/x-python',
      'java': 'text/x-java',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'go': 'text/x-go',
      'rs': 'text/x-rustsrc',
      'php': 'text/x-php',
      'rb': 'text/x-ruby',
      'sh': 'text/x-shellscript',
      'xml': 'application/xml',
      'yaml': 'text/yaml',
      'yml': 'text/yaml'
    };
    return mimeTypes[ext] || 'text/plain';
  }

  /**
   * 检测页面是否包含文件结构
   * @returns {Array} 文件数组
   */
  function detectFileStructure() {
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    const files = [];
    
    headings.forEach(heading => {
      const text = heading.textContent.trim();
      
      // 提取文件路径
      let filePath = text;
      
      // 移除序号（支持多种格式）
      // 例如: "1. ", "1、", "1) ", "(1) ", "Step 1: ", "文件1："
      filePath = filePath.replace(/^(?:\d+[\.\、\)\:：]|\(\d+\)|Step\s+\d+[\:：]|文件\d+[：:])\s*/i, '');
      
      // 移除可能的前缀词（如 "文件:", "File:", "Path:" 等）
      filePath = filePath.replace(/^(?:文件|File|Path|代码|Code)[\:：]\s*/i, '');
      
      // 检查是否看起来像文件路径
      // 必须包含扩展名（如 .js, .ts 等）
      const fileExtRegex = /\.\w{1,6}$/;
      if (!fileExtRegex.test(filePath)) {
        return; // 不是有效的文件路径
      }
      
      // 查找紧跟在标题后面的 <pre> 或包含代码的容器
      let nextElement = heading.nextElementSibling;
      
      // 跳过空白文本节点
      while (nextElement && nextElement.nodeType === 3 && !nextElement.textContent.trim()) {
        nextElement = nextElement.nextSibling;
      }
      
      // 查找 <pre> 元素
      let preElement = null;
      if (nextElement) {
        if (nextElement.tagName === 'PRE') {
          preElement = nextElement;
        } else if (nextElement.tagName === 'DIV') {
          // 可能包裹在 div 中
          preElement = nextElement.querySelector('pre');
        }
      }
      
      // 如果没找到，尝试向下查找几个兄弟节点
      if (!preElement) {
        let sibling = heading.nextElementSibling;
        let attempts = 0;
        while (sibling && attempts < 5) {
          if (sibling.tagName === 'PRE' || sibling.querySelector('pre')) {
            preElement = sibling.tagName === 'PRE' ? sibling : sibling.querySelector('pre');
            break;
          }
          sibling = sibling.nextElementSibling;
          attempts++;
        }
      }
      
      if (preElement) {
        // 使用改进的代码提取方法
        const code = extractCleanCode(preElement);
        
        // 只添加非空代码
        if (code.trim().length > 0) {
          files.push({
            path: filePath,
            content: code,
            element: heading,
            mimeType: getMimeType(filePath),
            size: new Blob([code]).size
          });
        }
      }
    });
    
    return files;
  }

  /**
   * 创建保存按钮UI
   */
  function createSaveButton(fileCount) {
    if (document.getElementById('batch-save-btn-container')) {
      return;
    }
    
    const container = document.createElement('div');
    container.id = 'batch-save-btn-container';
    container.className = 'batch-save-container';
    
    const button = document.createElement('button');
    button.id = 'batch-save-btn';
    button.className = 'batch-save-button';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>批量保存 ${fileCount} 个文件</span>
    `;
    
    const status = document.createElement('div');
    status.id = 'batch-save-status';
    status.className = 'batch-save-status';
    
    container.appendChild(button);
    container.appendChild(status);
    document.body.appendChild(container);
    
    return button;
  }

  /**
   * 显示状态消息
   */
  function showStatus(message, type = 'info') {
    const status = document.getElementById('batch-save-status');
    if (status) {
      status.textContent = message;
      status.className = `batch-save-status ${type}`;
      status.style.display = 'block';
      
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          status.style.display = 'none';
        }, 3000);
      }
    }
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 使用 JSZip 创建压缩包并下载
   */
  async function downloadAsZip(files) {
    try {
      showStatus('正在准备文件...', 'info');
      
      // 动态加载 JSZip 库
      if (typeof JSZip === 'undefined') {
        showStatus('❌ JSZip 库未加载，请重新安装插件', 'error');
        console.error('JSZip is not defined. Check manifest.json configuration.');
        return;
        }
      
      const zip = new JSZip();
      
      // 添加一个 README 文件
      const readme = `# 批量保存的代码文件

保存时间: ${new Date().toLocaleString('zh-CN')}
文件总数: ${files.length}

## 文件列表

${files.map((f, i) => `${i + 1}. ${f.path} (${formatFileSize(f.size)})`).join('\n')}

---
由代码文件批量保存器插件生成
`;
      
      zip.file('README.md', readme);
      
      // 添加文件到压缩包，保持目录结构
      files.forEach(file => {
        // 确保路径使用正斜杠
        const normalizedPath = file.path.replace(/\\/g, '/');
        zip.file(normalizedPath, file.content);
      });
      
      showStatus(`正在压缩 ${files.length} 个文件...`, 'info');
      
      // 生成压缩包
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 } // 最高压缩率
      }, (metadata) => {
        // 显示进度
        const percent = metadata.percent.toFixed(0);
        showStatus(`正在压缩... ${percent}%`, 'info');
      });
      
      // 下载压缩包
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `code-files-${timestamp}.zip`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showStatus(`✓ 成功保存 ${files.length} 个文件 (${formatFileSize(blob.size)})`, 'success');
    } catch (error) {
      console.error('保存文件时出错:', error);
      showStatus('❌ 保存失败: ' + error.message, 'error');
    }
  }

  /**
   * 动态加载外部脚本
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * 显示文件列表对话框
   */
  function showFileListDialog(files) {
    const dialog = document.createElement('div');
    dialog.className = 'batch-save-dialog';
    
    // 计算总大小
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    
    dialog.innerHTML = `
      <div class="batch-save-dialog-content">
        <div class="batch-save-dialog-header">
          <h2>检测到 ${files.length} 个文件 (${formatFileSize(totalSize)})</h2>
          <button class="batch-save-close-btn">&times;</button>
        </div>
        <div class="batch-save-dialog-body">
          <div class="batch-save-toolbar">
            <button class="batch-save-select-all">全选</button>
            <button class="batch-save-deselect-all">全不选</button>
            <button class="batch-save-preview-btn">预览选中</button>
          </div>
          <div class="file-list">
            ${files.map((file, index) => `
              <div class="file-item" data-index="${index}">
                <input type="checkbox" id="file-${index}" checked>
                <label for="file-${index}">
                  <span class="file-icon">${getFileIcon(file.path)}</span>
                  <span class="file-path">${file.path}</span>
                  <span class="file-size">${formatFileSize(file.size)}</span>
                  <span class="file-lines">${file.content.split('\n').length} 行</span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="batch-save-dialog-footer">
          <div class="footer-info">
            <span id="selected-count">${files.length} 个文件已选</span>
          </div>
          <div class="footer-actions">
            <button class="batch-save-download-zip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              下载为 ZIP
            </button>
            <button class="batch-save-cancel">取消</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 更新选中计数
    const updateSelectedCount = () => {
      const checked = dialog.querySelectorAll('input[type="checkbox"]:checked').length;
      dialog.querySelector('#selected-count').textContent = `${checked} 个文件已选`;
    };
    
    // 事件监听
    dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', updateSelectedCount);
    });
    
    dialog.querySelector('.batch-save-close-btn').addEventListener('click', () => {
      dialog.remove();
    });
    
    dialog.querySelector('.batch-save-cancel').addEventListener('click', () => {
      dialog.remove();
    });
    
    dialog.querySelector('.batch-save-select-all').addEventListener('click', () => {
      dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
      updateSelectedCount();
    });
    
    dialog.querySelector('.batch-save-deselect-all').addEventListener('click', () => {
      dialog.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      updateSelectedCount();
    });
    
    // 预览功能
    dialog.querySelector('.batch-save-preview-btn').addEventListener('click', () => {
      const selectedIndices = Array.from(dialog.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => parseInt(cb.id.replace('file-', '')));
      
      if (selectedIndices.length === 0) {
        alert('请至少选择一个文件');
        return;
      }
      
      const selectedFiles = selectedIndices.map(i => files[i]);
      showPreviewDialog(selectedFiles);
    });
    
    dialog.querySelector('.batch-save-download-zip').addEventListener('click', () => {
      const selectedFiles = files.filter((file, index) => {
        return dialog.querySelector(`#file-${index}`).checked;
      });
      
      if (selectedFiles.length === 0) {
        alert('请至少选择一个文件');
        return;
      }
      
      dialog.remove();
      downloadAsZip(selectedFiles);
    });
    
    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  /**
   * 显示代码预览对话框
   */
  function showPreviewDialog(files) {
    const previewDialog = document.createElement('div');
    previewDialog.className = 'batch-save-dialog batch-save-preview-dialog';
    
    previewDialog.innerHTML = `
      <div class="batch-save-dialog-content preview-content">
        <div class="batch-save-dialog-header">
          <h2>代码预览 (${files.length} 个文件)</h2>
          <button class="batch-save-close-btn">&times;</button>
        </div>
        <div class="batch-save-dialog-body">
          <div class="preview-file-tabs">
            ${files.map((file, index) => `
              <button class="preview-tab ${index === 0 ? 'active' : ''}" data-index="${index}">
                ${file.path.split('/').pop()}
              </button>
            `).join('')}
          </div>
          <div class="preview-code-container">
            ${files.map((file, index) => `
              <div class="preview-code-panel ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="preview-code-header">
                  <span class="preview-code-path">${file.path}</span>
                  <span class="preview-code-info">${formatFileSize(file.size)} · ${file.content.split('\n').length} 行</span>
                </div>
                <pre class="preview-code"><code>${escapeHtml(file.content)}</code></pre>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="batch-save-dialog-footer">
          <button class="batch-save-cancel">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(previewDialog);
    
    // 标签切换
    previewDialog.querySelectorAll('.preview-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const index = tab.dataset.index;
        
        previewDialog.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
        previewDialog.querySelectorAll('.preview-code-panel').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        previewDialog.querySelector(`.preview-code-panel[data-index="${index}"]`).classList.add('active');
      });
    });
    
    previewDialog.querySelector('.batch-save-close-btn').addEventListener('click', () => {
      previewDialog.remove();
    });
    
    previewDialog.querySelector('.batch-save-cancel').addEventListener('click', () => {
      previewDialog.remove();
    });
    
    previewDialog.addEventListener('click', (e) => {
      if (e.target === previewDialog) {
        previewDialog.remove();
      }
    });
  }

  /**
   * 转义 HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 根据文件扩展名返回图标
   */
  function getFileIcon(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const icons = {
      'js': '📜',
      'ts': '📘',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'json': '📋',
      'html': '🌐',
      'css': '🎨',
      'md': '📝',
      'txt': '📄',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'go': '🐹',
      'rs': '🦀',
      'php': '🐘',
      'rb': '💎',
      'sh': '🐚',
      'xml': '📰',
      'yaml': '⚙️',
      'yml': '⚙️'
    };
    return icons[ext] || '📄';
  }

  /**
   * 初始化
   */
  function init() {
    const files = detectFileStructure();
    
    if (files.length > 0) {
      console.log(`✓ 检测到 ${files.length} 个代码文件`);
      console.table(files.map(f => ({
        路径: f.path,
        大小: formatFileSize(f.size),
        行数: f.content.split('\n').length
      })));
      
      const button = createSaveButton(files.length);
      button.addEventListener('click', () => {
        showFileListDialog(files);
      });
    }
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 监听DOM变化
  const observer = new MutationObserver(() => {
    clearTimeout(observer.timer);
    observer.timer = setTimeout(() => {
      const files = detectFileStructure();
      const existingButton = document.getElementById('batch-save-btn');
      
      if (files.length > 0 && !existingButton) {
        init();
      } else if (existingButton) {
        const span = existingButton.querySelector('span');
        if (span) {
          span.textContent = `批量保存 ${files.length} 个文件`;
        }
      }
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
