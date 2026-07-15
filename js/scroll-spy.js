/**
 * 滚动时把地址栏 hash 更新为当前可见的标题
 * - 在标题上方 25% 视口高度的位置设为"当前节"分界线
 * - 用 history.replaceState，不入历史栈、不触发滚动
 * - 滚到顶部（还没进入任何标题）时清掉 hash
 * - 只处理 <h2>/<h3>，和 TOC 深度一致
 */
(function () {
  'use strict';

  var content = document.querySelector('.post-content');
  if (!content) return;

  var headings = Array.from(content.querySelectorAll('h2[id], h3[id]'));
  if (headings.length === 0) return;

  var currentId = null;
  var ticking = false;

  function updateHash() {
    ticking = false;
    // 视口上方 25% 处的 y 坐标作为分界线
    var threshold = window.innerHeight * 0.25;
    var active = null;
    for (var i = 0; i < headings.length; i++) {
      var top = headings[i].getBoundingClientRect().top;
      if (top <= threshold) {
        active = headings[i];
      } else {
        break;
      }
    }

    var newId = active ? active.id : null;
    if (newId === currentId) return;
    currentId = newId;

    var newHash = newId ? '#' + newId : '';
    // 只有 hash 真的变了才写回，避免无意义的 replaceState
    if (newHash === window.location.hash) return;
    var url = window.location.pathname + window.location.search + newHash;
    history.replaceState(null, '', url);
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHash);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // 初始化一次（处理带 hash 打开、或已滚动到中间刷新的情况）
  updateHash();
})();
