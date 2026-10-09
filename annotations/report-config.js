(function () {
  'use strict';
  window.AnnotationConfig = {
    enabled: true,
    editable: false,
    mode: 'b-drawer',
    projectId: 'tcs-ab4783e3',
    dataVersion: '20261009-l2-v2',
    page: 'report',
    pageTitle: '问卷报表 · 原型标注',
    revealTarget: function (annotation) {
      if (!annotation || !/^#table-head th\[data-column=/.test(annotation.target)) return;
      const target = document.querySelector(annotation.target);
      const scroller = document.getElementById('table-scroll');
      if (!target || target.hidden || !scroller) return;
      const scrollBox = scroller.getBoundingClientRect();
      let frozenEdge = scrollBox.left;
      document.querySelectorAll('#table-head th').forEach(function (cell) {
        const style = getComputedStyle(cell);
        if (!cell.hidden && style.position === 'sticky' && style.left !== 'auto') {
          frozenEdge = Math.max(frozenEdge, cell.getBoundingClientRect().right);
        }
      });
      // Only reveal the column; never query, reset or change visible fields.
      const delta = target.getBoundingClientRect().left - frozenEdge - 12;
      scroller.scrollLeft = Math.max(0, scroller.scrollLeft + delta);
      return new Promise(resolve => requestAnimationFrame(resolve));
    }
  };
})();
