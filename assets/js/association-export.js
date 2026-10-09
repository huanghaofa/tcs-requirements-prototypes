(function () {
  'use strict';

  const headers = ['逻辑树名称', '问卷编号', '问卷名称', '本行题目ID', '本行层级'];
  for (let level = 1; level <= 5; level++) headers.push(`L${level} 问题ID`, `L${level} 问题名称`, `L${level} 节点名称`, `L${level} 是否配置`);

  function nodeIndex(nodes, result) {
    const index = result || new Map();
    (nodes || []).forEach(node => { index.set(node.id, node); nodeIndex(node.children, index); });
    return index;
  }

  function buildSnapshot(state) {
    const rows = []; const records = []; const summaries = [];
    const tree = state.tree;
    const nodes = nodeIndex(tree ? tree.nodes : []);
    let configuredCount = 0;
    function choice(questionId) {
      const normalId = state.mappings[questionId];
      const reservedNames = Array.from(state.reservedMappings[questionId] || []);
      const normalNode = normalId ? nodes.get(normalId) : null;
      return {
        configured: Boolean(normalId || reservedNames.length),
        nodeName: normalId ? (normalNode ? normalNode.label : '') : (reservedNames[0] || ''),
        nodeType: normalId ? '普通节点' : reservedNames.length ? '系统保留节点' : ''
      };
    }
    state.surveys.forEach(survey => {
      const questionTree = state.questionTrees[survey.id] || {};
      const allIds = new Set();
      for (let level = 1; level <= 5; level++) {
        const source = questionTree[`L${level}`];
        const questions = Array.isArray(source) ? source : Object.values(source || {}).flat();
        questions.forEach(question => allIds.add(question.id));
      }
      const visited = new Set(); let surveyConfigured = 0;
      function walk(questions, level, ancestors) {
        (questions || []).forEach(question => {
          if (visited.has(question.id)) return;
          visited.add(question.id);
          const configuration = choice(question.id);
          if (configuration.configured) { configuredCount++; surveyConfigured++; }
          const path = [...ancestors, { questionId: question.id, questionName: question.val, level, ...configuration }];
          const row = [tree ? tree.name : '', survey.code, survey.name, question.id, `L${level}`];
          for (let depth = 1; depth <= 5; depth++) {
            const item = path[depth - 1];
            row.push(...(item ? [item.questionId, item.questionName, item.nodeName, item.configured ? '是' : '否'] : ['', '', '', '']));
          }
          rows.push(row);
          records.push({ surveyId: survey.id, questionId: question.id, level, path });
          // 未配置题目同样向下遍历；题目是否勾选不影响全量逐题导出。
          if (level < 5) walk((questionTree[`L${level + 1}`] || {})[question.id] || [], level + 1, path);
        });
      }
      walk(questionTree.L1 || [], 1, []);
      if (visited.size !== allIds.size || [...allIds].some(id => !visited.has(id))) {
        throw new Error(`${survey.name}存在无法对应完整上级路径的题目，请检查问卷结构。`);
      }
      summaries.push({ surveyId: survey.id, total: visited.size, configured: surveyConfigured, unconfigured: visited.size - surveyConfigured });
    });
    return { headers: headers.slice(), rows, records, summaries, treeName: tree ? tree.name : '', surveyCount: state.surveys.length, total: rows.length, configured: configuredCount, unconfigured: rows.length - configuredCount };
  }

  function readState() {
    return {
      tree: getTree(), surveys: selectedSurveys.slice(), questionTrees: SURVEY_TREE,
      mappings: { ...mappings },
      reservedMappings: Object.fromEntries(Object.entries(reservedMappings).map(([id, names]) => [id, Array.from(names)]))
    };
  }
  function getSnapshot() { return buildSnapshot(readState()); }
  function csvCell(value) {
    let text = value == null ? '' : String(value);
    if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^\d{15,}$/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function buildCsv(snapshot) {
    return '\uFEFF' + [snapshot.headers, ...snapshot.rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }
  window.AssociationExport = { headers: headers.slice(), buildSnapshot, getSnapshot, buildCsv, csvCell };

  function init() {
    const overlay = document.getElementById('association-export-overlay');
    if (!overlay) return;
    const byId = id => document.getElementById(id);
    const pageSize = 12;
    let snapshot = null; let page = 1; let restoreFocus = null;
    function make(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text != null) element.textContent = text;
      return element;
    }
    function status(text, error) {
      const element = byId('association-export-status');
      element.textContent = text; element.classList.toggle('is-error', Boolean(error));
    }
    function renderHead() {
      const head = byId('association-export-head'); head.textContent = '';
      const groups = make('tr'); const fields = make('tr');
      headers.slice(0, 5).forEach(label => { const th = make('th', '', label); th.rowSpan = 2; th.scope = 'col'; groups.append(th); });
      for (let level = 1; level <= 5; level++) {
        const th = make('th', 'layer-group', `L${level}`); th.colSpan = 4; th.scope = 'colgroup'; groups.append(th);
        ['问题ID', '问题名称', '节点名称', '是否配置'].forEach(label => { const field = make('th', '', label); field.scope = 'col'; fields.append(field); });
      }
      head.append(groups, fields);
    }
    function renderRows() {
      const body = byId('association-export-body'); body.textContent = '';
      const offset = (page - 1) * pageSize;
      snapshot.rows.slice(offset, offset + pageSize).forEach((values, rowIndex) => {
        const record = snapshot.records[offset + rowIndex];
        const row = make('tr'); row.dataset.questionId = record.questionId; row.dataset.surveyId = record.surveyId;
        values.forEach((value, column) => {
          const cell = make('td', '', value === '' ? '—' : value);
          if (column === 2) cell.classList.add('survey-name');
          if (column >= 5 && (column - 5) % 4 === 1) cell.classList.add('question-name');
          if (column === 3 || column === 4 || column === 5 + (record.level - 1) * 4) cell.classList.add('current-question');
          if (column >= 5 && (column - 5) % 4 === 3 && value) cell.classList.add(value === '是' ? 'configured-yes' : 'configured-no');
          cell.title = String(value); row.append(cell);
        });
        body.append(row);
      });
      if (!snapshot.rows.length) {
        const row = make('tr'); const cell = make('td', 'export-empty-cell', '请先添加问卷，再预览和导出逐题关联配置。');
        cell.colSpan = 25; row.append(cell); body.append(row);
      }
      const pagination = byId('association-export-pagination'); pagination.textContent = '';
      const pageCount = Math.max(1, Math.ceil(snapshot.total / pageSize));
      pagination.append(make('span', '', `第 ${page} / ${pageCount} 页，共 ${snapshot.total} 行`));
      const previous = make('button', '', '上一页'); previous.type = 'button'; previous.disabled = page === 1;
      previous.addEventListener('click', () => { page--; renderRows(); byId('association-export-scroll').scrollTop = 0; });
      const next = make('button', '', '下一页'); next.type = 'button'; next.disabled = page === pageCount;
      next.addEventListener('click', () => { page++; renderRows(); byId('association-export-scroll').scrollTop = 0; });
      pagination.append(previous, next);
    }
    function updateSnapshot() {
      try {
        snapshot = getSnapshot();
        page = Math.min(page, Math.max(1, Math.ceil(snapshot.total / pageSize)));
        byId('association-export-summary').textContent = `当前逻辑树：${snapshot.treeName} · ${snapshot.surveyCount} 张问卷 · ${snapshot.total} 题，${snapshot.total} 行`;
        status(`已配置 ${snapshot.configured} 题，未配置 ${snapshot.unconfigured} 题。普通节点和系统保留节点已关联均标为“是”。`);
        byId('association-export-download').disabled = !snapshot.total;
        renderRows();
        return true;
      } catch (error) {
        status(error.message, true); byId('association-export-download').disabled = true;
        return false;
      }
    }
    function openPreview(options) {
      const fromAnnotation = Boolean(options && options.annotation === true);
      const wasOpen = !overlay.hidden;
      if (!wasOpen || !fromAnnotation) restoreFocus = document.activeElement;
      if (!wasOpen || !fromAnnotation) page = 1;
      overlay.hidden = false;
      renderHead(); updateSnapshot();
      if (!fromAnnotation) byId('association-export-close').focus();
    }
    function closePreview(options) {
      overlay.hidden = true;
      if (!(options && options.annotation === true) && restoreFocus && restoreFocus.isConnected) restoreFocus.focus();
    }
    function downloadCsv() {
      // 每次下载重取当前配置，预览打开之后发生的变更也不会导出旧值。
      if (!updateSnapshot() || !snapshot.total) return;
      const url = URL.createObjectURL(new Blob([buildCsv(snapshot)], { type: 'text/csv;charset=utf-8;' }));
      const anchor = make('a'); anchor.href = url; anchor.download = '逻辑树关联配置_逐题导出演示.csv'; anchor.hidden = true;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status(`已导出当前 ${snapshot.surveyCount} 张问卷的全部 ${snapshot.total} 题，文件共 ${snapshot.total} 行。`);
    }
    byId('association-export-btn').addEventListener('click', openPreview);
    byId('association-export-close').addEventListener('click', closePreview);
    byId('association-export-download').addEventListener('click', downloadCsv);
    overlay.addEventListener('click', event => { if (event.target === overlay) closePreview(); });
    document.addEventListener('keydown', event => {
      if (overlay.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closePreview(); }
      if (event.key === 'Tab') {
        // 标注抽屉是独立的只读阅读区，键盘操作不被预览焦点循环接管。
        if (event.target.closest && event.target.closest('#anno-panel, #anno-reopen')) return;
        const controls = [...overlay.querySelectorAll('button:not(:disabled),a[href]')];
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    function locateFeature() {
      const feature = (new URLSearchParams(window.location.search).get('feature') || window.location.hash.slice(1)).toUpperCase();
      if (feature === 'F03') { openPreview(); return; }
      if (feature === 'F02') {
        for (let level = 0; level < 5; level++) {
          const question = getQuestionsForLayer(level).find(item => layerSelected[level].has(item.id));
          if (question) { openModal(question.id, level); return; }
        }
      }
      if (feature === 'F01') {
        const heading = byId('F01'); heading.classList.add('assoc-feature-focus'); heading.focus({ preventScroll: true });
        const counter = document.querySelector('.cc-layer-progress'); if (counter) counter.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
    window.addEventListener('hashchange', locateFeature);
    window.AssociationExport.openPreview = openPreview;
    window.AssociationExport.closePreview = closePreview;
    locateFeature();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
