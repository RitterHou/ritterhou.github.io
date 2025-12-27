/**
 * 代码块增强功能模块
 * 为代码块添加复制按钮和折叠功能
 */
(function () {
    'use strict';

    // SVG图标定义 - 复制和成功状态图标
    const copyIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
  </svg>`;

    const checkIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
  </svg>`;

    /**
     * 提取元素的文本内容
     * 优先使用innerText（保留换行），回退到textContent
     * 
     * @param {HTMLElement} element - 要提取文本的DOM元素
     * @returns {string} 提取的文本内容
     */
    function extractCode(element) {
        return element.innerText !== undefined ? element.innerText : (element.textContent || '');
    }

    /**
     * 复制代码到剪贴板
     * 优先使用现代Clipboard API，回退到传统方法
     * 
     * @param {string} code - 要复制的代码内容
     * @param {HTMLElement} btn - 复制按钮元素
     */
    function copyToClipboard(code, btn) {
        if (navigator.clipboard && window.isSecureContext) {
            // 使用现代Clipboard API（需要HTTPS或localhost）
            navigator.clipboard.writeText(code)
                .then(function () { showCopySuccess(btn); })
                .catch(function () { fallbackCopyTextToClipboard(code, btn); });
        } else {
            // 回退到传统方法
            fallbackCopyTextToClipboard(code, btn);
        }
    }

    /**
     * 显示复制成功状态
     * 临时改变按钮图标和文字，2秒后恢复
     * 
     * @param {HTMLElement} btn - 复制按钮元素
     */
    function showCopySuccess(btn) {
        btn.innerHTML = checkIcon;
        btn.classList.add('copied');
        btn.setAttribute('title', 'Copied!');
        setTimeout(function () {
            btn.innerHTML = copyIcon;
            btn.classList.remove('copied');
            btn.setAttribute('title', 'Copy code');
        }, 2000);
    }

    /**
     * 传统复制方法的回退实现
     * 使用隐藏的textarea元素和document.execCommand
     * 
     * @param {string} text - 要复制的文本
     * @param {HTMLElement} btn - 复制按钮元素
     */
    function fallbackCopyTextToClipboard(text, btn) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        // 将textarea定位到屏幕外
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showCopySuccess(btn);
        } catch (err) {
            // 复制失败时的处理
            console.error('复制功能出错:', err);
            btn.setAttribute('title', 'Copy failed');
            setTimeout(function () {
                btn.setAttribute('title', 'Copy code');
            }, 2000);
        }
        document.body.removeChild(textArea);
    }

    /**
     * 为长代码块添加折叠功能
     * 当代码行数超过25行时，自动折叠并添加展开按钮
     * 
     * @param {HTMLElement} figure - 代码块容器元素
     */
    function foldLongCodeBlock(figure) {
        try {
            // 检查是否有flat标记，如果有则不折叠
            var figcaption = figure.querySelector('figcaption');
            if (figcaption && figcaption.textContent.includes('flat')) {
                figcaption.remove();
                return;
            }

            var lineCount = 0;
            var targetElement = null;
            var gutterElement = figure.querySelector('td.gutter pre');
            var codeElement = figure.querySelector('td.code pre');

            // 判断代码块类型并计算行数
            if (gutterElement && codeElement) {
                // 带行号的代码块：通过span.line元素计算
                lineCount = gutterElement.querySelectorAll('span.line').length;
                targetElement = figure;
            } else {
                // 不带行号的代码块：通过文本分割计算
                var preElement = figure.querySelector('pre');
                if (!preElement) return;
                var lines = preElement.textContent.split('\n').filter(function (line) {
                    return line.trim().length > 0;
                });
                lineCount = lines.length;
                targetElement = preElement;
            }

            // 只有超过25行的代码块才需要折叠
            if (lineCount <= 25) return;

            // 设置折叠样式
            targetElement.style.maxHeight = '400px';
            targetElement.style.overflowY = 'hidden';
            targetElement.style.overflowX = 'auto';
            targetElement.style.position = 'relative';

            // 创建渐变遮罩层
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,rgba(247,247,247,0.9));pointer-events:none;z-index:1;';
            targetElement.appendChild(overlay);

            // 创建展开/折叠按钮
            var button = document.createElement('button');
            button.style.cssText = 'position:absolute;bottom:8px;left:50%;margin-left:-50px;width:100px;height:24px;background:rgba(247,247,247,0.95);color:#656d76;border:1px solid rgba(175,184,193,0.3);border-radius:6px;cursor:pointer;font-size:12px;z-index:3;transition:all 0.15s ease;backdrop-filter:blur(4px);white-space:nowrap;';
            button.textContent = '展开 ' + lineCount + ' 行';
            targetElement.appendChild(button);

            // 按钮悬停效果
            button.addEventListener('mouseenter', function () {
                button.style.background = 'rgba(247,247,247,1)';
                button.style.borderColor = 'rgba(175,184,193,0.6)';
                button.style.color = '#24292f';
            });
            button.addEventListener('mouseleave', function () {
                button.style.background = 'rgba(247,247,247,0.95)';
                button.style.borderColor = 'rgba(175,184,193,0.3)';
                button.style.color = '#656d76';
            });

            // 按钮点击事件：展开/折叠切换
            var expanded = false;
            button.addEventListener('click', function () {
                if (!expanded) {
                    // 展开代码块
                    targetElement.style.maxHeight = 'none';
                    targetElement.style.overflowY = 'auto';
                    overlay.style.display = 'none';
                    button.textContent = '收起';
                    expanded = true;
                } else {
                    // 折叠代码块
                    targetElement.style.maxHeight = '400px';
                    targetElement.style.overflowY = 'hidden';
                    overlay.style.display = 'block';
                    button.textContent = '展开 ' + lineCount + ' 行';
                    expanded = false;
                }
            });
        } catch (e) {
            // 打印错误信息，便于调试
            console.error('代码折叠功能出错:', e);
        }
    }

    /**
     * 增强代码块功能
     * 为代码块添加复制按钮和折叠功能
     * 
     * @param {HTMLElement} element - 代码块元素
     * @param {boolean} isHighlightBlock - 是否为高亮代码块
     */
    function enhanceCodeBlock(element, isHighlightBlock) {
        try {
            var wrapper, codeElement;

            if (isHighlightBlock) {
                // 处理高亮代码块（figure.highlight）
                var codeCell = element.querySelector('td.code');
                if (!codeCell) return;

                // 创建包装容器
                wrapper = document.createElement('div');
                wrapper.className = 'highlight-wrapper';
                wrapper.style.position = 'relative';
                element.parentNode.insertBefore(wrapper, element);
                wrapper.appendChild(element);

                // 创建复制按钮
                var copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = copyIcon;
                copyBtn.setAttribute('title', 'Copy code');
                copyBtn.setAttribute('aria-label', 'Copy code');
                wrapper.appendChild(copyBtn);

                // 复制按钮点击事件
                copyBtn.addEventListener('click', function () {
                    var code = '';
                    var codeEl = codeCell.querySelector('pre') || codeCell.querySelector('code');
                    if (codeEl) code = extractCode(codeEl);
                    copyToClipboard(code.trim(), copyBtn);
                });

                // 应用折叠功能
                foldLongCodeBlock(element);

            } else {
                // 处理普通代码块（pre:not(.highlight pre)）
                codeElement = element.querySelector('code') || element;
                if (!codeElement) return;

                // 创建包装容器
                wrapper = document.createElement('div');
                wrapper.className = 'pre-wrapper';
                wrapper.style.position = 'relative';
                element.parentNode.insertBefore(wrapper, element);
                wrapper.appendChild(element);

                // 创建复制按钮
                var copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = copyIcon;
                copyBtn.setAttribute('title', 'Copy code');
                copyBtn.setAttribute('aria-label', 'Copy code');
                wrapper.appendChild(copyBtn);

                // 复制按钮点击事件
                copyBtn.addEventListener('click', function () {
                    copyToClipboard(extractCode(codeElement).trim(), copyBtn);
                });

                // 检查是否需要折叠
                var lines = codeElement.textContent.split('\n').filter(function (line) {
                    return line.trim().length > 0;
                });

                if (lines.length > 25) {
                    // 应用折叠样式
                    element.style.maxHeight = '400px';
                    element.style.overflow = 'hidden';
                    element.style.position = 'relative';

                    // 创建渐变遮罩层
                    var overlay = document.createElement('div');
                    overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,rgba(247,247,247,0.9));pointer-events:none;z-index:1;';
                    element.appendChild(overlay);

                    // 创建展开按钮
                    var button = document.createElement('button');
                    button.style.cssText = 'position:absolute;bottom:8px;left:50%;margin-left:-40px;width:80px;height:24px;background:rgba(247,247,247,0.95);color:#656d76;border:1px solid rgba(175,184,193,0.3);border-radius:6px;cursor:pointer;font-size:12px;z-index:3;transition:all 0.15s ease;backdrop-filter:blur(4px);';
                    button.textContent = '展开 ' + lines.length + ' 行';
                    element.appendChild(button);

                    // 按钮悬停效果
                    button.addEventListener('mouseenter', function () {
                        button.style.background = 'rgba(247,247,247,1)';
                        button.style.borderColor = 'rgba(175,184,193,0.6)';
                        button.style.color = '#24292f';
                    });
                    button.addEventListener('mouseleave', function () {
                        button.style.background = 'rgba(247,247,247,0.95)';
                        button.style.borderColor = 'rgba(175,184,193,0.3)';
                        button.style.color = '#656d76';
                    });

                    // 按钮点击事件
                    var expanded = false;
                    button.addEventListener('click', function () {
                        if (!expanded) {
                            element.style.maxHeight = 'none';
                            overlay.style.display = 'none';
                            button.textContent = '收起';
                            expanded = true;
                        } else {
                            element.style.maxHeight = '400px';
                            overlay.style.display = 'block';
                            button.textContent = '展开 ' + lines.length + ' 行';
                            expanded = false;
                        }
                    });
                }
            }
        } catch (e) {
            // 打印错误信息，便于调试
            console.error('代码块增强功能出错:', e);
        }
    }

    /**
     * 初始化代码块增强功能
     * 遍历页面中的所有代码块并应用增强功能
     */
    function initCodeEnhancer() {
        // 处理高亮代码块
        var highlightBlocks = document.querySelectorAll('.highlight');
        for (var i = 0; i < highlightBlocks.length; i++) {
            enhanceCodeBlock(highlightBlocks[i], true);
        }

        // 处理普通代码块
        var preBlocks = document.querySelectorAll('pre:not(.gutter pre):not(.highlight pre)');
        for (var i = 0; i < preBlocks.length; i++) {
            enhanceCodeBlock(preBlocks[i], false);
        }
    }

    /**
     * 设置打印支持
     * 在打印时自动展开所有折叠的代码块
     */
    function setupPrintSupport() {
        window.addEventListener('beforeprint', function () {
            var figures = document.querySelectorAll('figure.highlight');
            figures.forEach(function (figure) {
                var foldedElement = figure;
                // 检查折叠的元素类型
                if (figure.style.maxHeight !== '400px') {
                    var preElement = figure.querySelector('pre');
                    if (preElement && preElement.style.maxHeight === '400px') {
                        foldedElement = preElement;
                    }
                }

                // 展开折叠的代码块
                if (foldedElement.style.maxHeight === '400px') {
                    foldedElement.style.maxHeight = 'none';
                    var overlay = foldedElement.querySelector('div[style*="linear-gradient"]');
                    var button = foldedElement.querySelector('button');
                    if (overlay) overlay.style.display = 'none';
                    if (button) button.style.display = 'none';
                }
            });
        });
    }

    /**
     * 模块初始化函数
     * 根据DOM状态选择合适的初始化时机
     */
    function init() {
        if (document.readyState === 'loading') {
            // DOM还在加载中，等待DOMContentLoaded事件
            document.addEventListener('DOMContentLoaded', function () {
                initCodeEnhancer();
                setupPrintSupport();
            });
        } else {
            // DOM已经加载完成，直接初始化
            initCodeEnhancer();
            setupPrintSupport();
        }
    }

    // 启动模块
    init();

})(); 