/**
 * 代码块增强：复制按钮 + 长代码折叠
 * 所有视觉样式由 CSS 控制，本文件只负责 DOM 结构 + 行为
 */
(function () {
  'use strict';

  var FOLD_THRESHOLD = 30; // 行数超过此阈值才折叠

  var COPY_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
    '<path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>' +
    '<path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>';

  var CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
    '<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>';

  function extractCode(el) {
    return (el.innerText !== undefined ? el.innerText : el.textContent || '').replace(/ /g, ' ');
  }

  function showCopySuccess(btn) {
    btn.innerHTML = CHECK_ICON;
    btn.classList.add('copied');
    btn.setAttribute('title', 'Copied!');
    setTimeout(function () {
      btn.innerHTML = COPY_ICON;
      btn.classList.remove('copied');
      btn.setAttribute('title', 'Copy code');
    }, 2000);
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopySuccess(btn);
    } catch (e) {
      btn.setAttribute('title', 'Copy failed');
    }
    document.body.removeChild(ta);
  }

  function copyToClipboard(code, btn) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code)
        .then(function () { showCopySuccess(btn); })
        .catch(function () { fallbackCopy(code, btn); });
    } else {
      fallbackCopy(code, btn);
    }
  }

  function wrap(el, cls) {
    var w = document.createElement('div');
    w.className = cls;
    el.parentNode.insertBefore(w, el);
    w.appendChild(el);
    return w;
  }

  function attachCopyButton(wrapper, getCode) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = COPY_ICON;
    btn.type = 'button';
    btn.setAttribute('title', 'Copy code');
    btn.setAttribute('aria-label', 'Copy code');
    btn.addEventListener('click', function () {
      copyToClipboard(getCode().trim(), btn);
    });
    wrapper.appendChild(btn);
  }

  // 折叠状态在 wrapper 上：is-foldable / is-folded
  // 视觉淡出由 CSS ::after 实现，按钮放到代码块外（wrapper 内、代码块下方），不再 absolute 叠加
  function attachFoldButton(wrapper, lineCount) {
    if (lineCount <= FOLD_THRESHOLD) return;
    wrapper.classList.add('is-foldable', 'is-folded');

    var btn = document.createElement('button');
    btn.className = 'fold-btn';
    btn.type = 'button';
    btn.innerHTML = '<span class="fold-btn-text">展开 ' + lineCount + ' 行</span>';
    wrapper.appendChild(btn);

    btn.addEventListener('click', function () {
      var folded = wrapper.classList.toggle('is-folded');
      btn.querySelector('.fold-btn-text').textContent = folded ? ('展开 ' + lineCount + ' 行') : '收起';
    });
  }

  function enhanceHighlight(figure) {
    var codeCell = figure.querySelector('td.code');
    if (!codeCell) return;

    // 'flat' 标记：不折叠
    var figcaption = figure.querySelector('figcaption');
    var skipFold = false;
    if (figcaption && figcaption.textContent.indexOf('flat') !== -1) {
      figcaption.remove();
      skipFold = true;
    }

    var wrapper = wrap(figure, 'highlight-wrapper');
    attachCopyButton(wrapper, function () {
      var codeEl = codeCell.querySelector('pre') || codeCell.querySelector('code');
      return codeEl ? extractCode(codeEl) : '';
    });

    if (skipFold) return;
    var gutterEl = figure.querySelector('td.gutter pre');
    var lineCount = gutterEl ? gutterEl.querySelectorAll('span.line').length : 0;
    attachFoldButton(wrapper, lineCount);
  }

  function enhancePre(pre) {
    var codeEl = pre.querySelector('code') || pre;
    var wrapper = wrap(pre, 'pre-wrapper');
    attachCopyButton(wrapper, function () { return extractCode(codeEl); });

    var lines = codeEl.textContent.split('\n').filter(function (l) { return l.trim().length; });
    attachFoldButton(wrapper, lines.length);
  }

  function init() {
    document.querySelectorAll('figure.highlight').forEach(enhanceHighlight);
    document.querySelectorAll('pre').forEach(function (pre) {
      // 跳过 highlight 内部的 pre 和行号 pre
      if (pre.closest('figure.highlight')) return;
      enhancePre(pre);
    });

    // 打印时自动展开所有折叠
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('.is-foldable.is-folded').forEach(function (el) {
        el.classList.remove('is-folded');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
