(function () {
  'use strict';

  const targets = {
    counts: '[data-anno="assoc-layer-stats"]',
    existingNodes: '#modal-search',
    reservedNodes: '[data-anno="assoc-reserved-nodes"]',
    exportScope: '#association-export-title',
    exportSample: '[data-anno="assoc-export-current-vs-sample"]'
  };

  function closeExportPreview() {
    const overlay = document.getElementById('association-export-overlay');
    if (overlay && !overlay.hidden && window.AssociationExport) window.AssociationExport.closePreview({ annotation: true });
  }

  function closeNodeSelector() {
    const modal = document.getElementById('modal');
    if (modal && modal.style.display !== 'none') closeModal();
  }

  function revealNodeSelector() {
    closeExportPreview();
    const modal = document.getElementById('modal');
    // 已打开时保留当前待选项；标注不会勾题、选节点或确认关联。
    if (modal && modal.style.display !== 'none' && modalPending) return;
    for (let level = 0; level < activeLayers; level++) {
      const question = getQuestionsForLayer(level).find(item => layerSelected[level].has(item.id));
      if (question) {
        openModal(question.id, level, null, { focus: false });
        return;
      }
    }
    // 无可用题目时维持窗口隐藏，由运行时给出标准的无法定位提示。
    return;
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  window.AnnotationConfig = {
    enabled: true,
    mode: 'b-drawer',
    editable: false,
    projectId: 'tcs-ab4783e3',
    dataVersion: '20261009-drawer-v1',
    page: 'association',
    pageTitle: '逻辑树关联配置 · 交互与规则',
    revealTarget: function (annotation) {
      const target = annotation && annotation.target;
      if (target === targets.counts) {
        closeExportPreview();
        closeNodeSelector();
      } else if (target === targets.existingNodes || target === targets.reservedNodes) {
        revealNodeSelector();
      } else if (target === targets.exportScope || target === targets.exportSample) {
        closeNodeSelector();
        if (!window.AssociationExport || !window.AssociationExport.openPreview) throw new Error('导出预览尚未就绪');
        window.AssociationExport.openPreview({ annotation: true });
      }
      return nextFrame();
    }
  };
})();
