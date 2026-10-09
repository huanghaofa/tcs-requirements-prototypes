(function () {
  'use strict';

  const mock = window.ReportMock;
  if (!mock) return;

  const columns = [
    ['sequence', '序号', 56], ['qid', '问卷ID', 90], ['carCode', '车系编码', 90],
    ['carName', '车系名称', 90], ['vin', 'vin', 170], ['vehicleClassCode', '车型18位编码', 170],
    ['unionid', '微信unionid', 150], ['oneid', 'oneid', 145], ['pushId', '推送ID', 155],
    ['status', '点评状态', 95], ['mis', '调研MIS', 135], ['qtitle', '问卷标题', 190],
    ['planName', '调查方案名称', 190], ['method', '点评方式', 90], ['pushTime', '推送时间', 170],
    ['reviewTime', '点评时间', 170], ['deliveryDate', '交车日期', 130], ['dealer', '专营店', 150],
    ['rewardSuccess', '是否已成功发放点评奖励', 190], ['rewardTime', '发放点评奖励时间', 170],
    ['rewardFailure', '发放奖励失败原因', 220], ['recordLayer', '记录层级', 95],
    ['score', '第一层评分', 110], ['l1Name', '第一层Lvl_1项目', 150], ['l2Name', '第二层Lvl_2项目', 140],
    ['l3Name', '第三层Lvl_3项目', 150], ['l4Value', '第四层Lvl_4详细', 240],
    ['l5Value', '第五层留言', 280], ['troubleDegree', '困扰度', 100],
    ['recentOccurrenceTime', '最近发生时间', 140]
  ].map(([key, label, width]) => ({ key, label, width }));
  const dateRanges = [
    { key: 'delivery', label: '交车时间', field: 'deliveryDate' },
    { key: 'push', label: '推送时间', field: 'pushTime' },
    { key: 'review', label: '点评时间', field: 'reviewTime' }
  ];
  const textFields = [
    ['plan', 'f-plan', '调查方案单号', 'planNo'], ['qid', 'f-qid', '问卷ID', 'qid'],
    ['vin', 'f-vin', 'vin', 'vin'], ['push', 'f-push', '推送ID', 'pushId']
  ];

  function flattenNodes(nodes, list) {
    const result = list || [];
    (nodes || []).forEach(node => { result.push(node); flattenNodes(node.children, result); });
    return result;
  }

  function getTree(id) { return mock.trees.find(tree => tree.id === id) || null; }
  function nodeLookup(treeId) {
    const tree = getTree(treeId);
    return new Map(flattenNodes(tree ? tree.nodes : []).map(node => [node.id, node]));
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function validateConditions(conditions) {
    for (const range of dateRanges) {
      const dates = conditions.dates[range.key];
      if (!dates.start && !dates.end) continue;
      if (!dates.start || !dates.end) return `请完整填写${range.label}的开始日期和结束日期。`;
      if (!validDate(dates.start) || !validDate(dates.end)) return `${range.label}日期格式无效，请重新选择。`;
      if (dates.start > dates.end) return `${range.label}的开始日期不能晚于结束日期。`;
    }
    if (!getTree(conditions.treeId)) return '请选择有效的逻辑树。';
    const index = nodeLookup(conditions.treeId);
    for (let depth = 0; depth < 5; depth++) {
      if ((conditions.nodes[depth] || []).some(id => !index.has(id) || index.get(id).depth !== depth)) {
        return '逻辑节点条件已失效，请重新选择。';
      }
    }
    if (conditions.cars.some(code => !mock.cars.some(car => car.code === code))) return '车系条件无效。';
    if (conditions.status && !['已完成', '填写中'].includes(conditions.status)) return '点评状态条件无效。';
    if (conditions.mis && !mock.misOptions.includes(conditions.mis)) return 'MIS 条件无效。';
    const hasText = textFields.some(([key]) => conditions.text[key].trim());
    const hasDates = dateRanges.some(range => conditions.dates[range.key].start);
    const hasNodes = Object.values(conditions.nodes).some(ids => ids.length);
    if (!hasText && !hasDates && !hasNodes && !conditions.cars.length && !conditions.status && !conditions.mis) {
      return '请设置至少一个有效查询条件后点击查询；默认逻辑树不作为查询条件。';
    }
    return '';
  }

  function matchesAnswer(answer, conditions) {
    if (answer.treeId !== conditions.treeId) return false;
    if (textFields.some(([key, , , field]) => conditions.text[key] && !String(answer[field] || '').toLowerCase().includes(conditions.text[key].toLowerCase()))) return false;
    if (conditions.cars.length && !conditions.cars.includes(answer.carCode)) return false;
    if (conditions.status && conditions.status !== answer.status) return false;
    if (conditions.mis && conditions.mis !== answer.mis) return false;
    for (const range of dateRanges) {
      const dates = conditions.dates[range.key];
      if (!dates.start) continue;
      const value = String(answer[range.field] || '').slice(0, 10);
      if (!value || value < dates.start || value > dates.end) return false;
    }
    return true;
  }

  function matchesNodePath(pathIds, selectedNodes) {
    return Object.entries(selectedNodes).every(([depth, ids]) => !ids.length || ids.includes(pathIds[Number(depth)]));
  }

  function expandAnswers(answers, conditions) {
    const rows = [];
    const index = nodeLookup(conditions.treeId);
    const selectedNodes = conditions.nodes;
    const name = id => index.has(id) ? index.get(id).label : '';
    answers.forEach(answer => {
      if (!matchesAnswer(answer, conditions)) return;
      answer.l1Branches.forEach(l1 => {
        l1.l2Branches.forEach(l2 => {
          const parentPath = [l1.nodeId, l2.nodeId];
          const childBranches = l2.l3Branches.filter(l3 => matchesNodePath(
            [...parentPath, l3.nodeId, l3.l4 ? l3.l4.nodeId : '', l3.l5 ? l3.l5.nodeId : ''], selectedNodes
          ));
          // 演示暂定：深层筛选保留命中子题的 L2 父行，不带出无关兄弟。
          if (!matchesNodePath(parentPath, selectedNodes) && !childBranches.length) return;
          const base = {
            ...answer, answerId: answer.mockAnswerId, scoreKey: `${answer.mockAnswerId}:${l1.questionId}`,
            score: l1.score, l1Name: name(l1.nodeId), l2Name: name(l2.nodeId),
            parentQuestionId: l2.questionId, l1QuestionId: l1.questionId
          };
          rows.push({
            ...base, rowKey: `${answer.mockAnswerId}:${l1.questionId}:${l2.questionId}:L2`,
            recordLayer: 'L2', currentQuestionId: l2.questionId, nodePath: parentPath,
            l3Name: '', l4Value: '', l5Value: '', troubleDegree: '', recentOccurrenceTime: ''
          });
          childBranches.forEach(l3 => rows.push({
            ...base, rowKey: `${answer.mockAnswerId}:${l1.questionId}:${l2.questionId}:${l3.questionId}:L3`,
            recordLayer: 'L3', currentQuestionId: l3.questionId,
            nodePath: [...parentPath, l3.nodeId, l3.l4 ? l3.l4.nodeId : '', l3.l5 ? l3.l5.nodeId : ''],
            l3Name: name(l3.nodeId), l4Value: l3.l4 ? l3.l4.value : '', l5Value: l3.l5 ? l3.l5.value : '',
            troubleDegree: l3.troubleDegree || '', recentOccurrenceTime: l3.recentOccurrenceTime || ''
          }));
        });
      });
    });
    return rows;
  }

  function csvCell(value) {
    let text = value == null ? '' : String(value);
    if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^\d{15,}$/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function buildCsv(rows) {
    const data = [columns.map(column => column.label)];
    rows.forEach((row, index) => data.push(columns.map(column => column.key === 'sequence' ? index + 1 : row[column.key] ?? '')));
    return '\uFEFF' + data.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }

  window.ReportLogic = { columns, validateConditions, expandAnswers, buildCsv, csvCell, matchesAnswer, matchesNodePath };

  function init() {
    const form = document.getElementById('query-form');
    if (!form || form.dataset.reportBound) return;
    form.dataset.reportBound = 'true';
    const state = {
      selectedCars: [], selectedNodes: { 0: [], 1: [], 2: [], 3: [], 4: [] },
      lastConditions: null, rows: [], hasQuery: false, page: 1, pageSize: 20,
      compact: false, visibleColumns: new Set(columns.map(column => column.key)), toastTimer: null
    };
    const byId = id => document.getElementById(id);
    const make = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text != null) element.textContent = text;
      return element;
    };
    function setMessage(text, type) {
      const element = byId('query-message');
      element.textContent = text;
      element.className = 'query-message' + (type ? ' ' + type : '') + (type === 'is-error' ? ' error' : '');
    }
    function toast(text) {
      const element = byId('toast');
      element.textContent = text;
      element.hidden = false;
      element.classList.add('show');
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => { element.classList.remove('show'); element.hidden = true; }, 3200);
    }
    function collectDraft() {
      const text = {};
      textFields.forEach(([key, id]) => { text[key] = byId(id).value.trim(); });
      const dates = {};
      dateRanges.forEach(range => {
        dates[range.key] = { start: byId(`f-${range.key}-start`).value, end: byId(`f-${range.key}-end`).value };
      });
      return {
        text, dates, status: byId('f-status').value, mis: byId('f-mis').value,
        cars: state.selectedCars.slice().sort(), treeId: byId('tree-select').value,
        nodes: Object.fromEntries(Object.entries(state.selectedNodes).map(([depth, ids]) => [depth, ids.slice().sort()]))
      };
    }
    function isDirty() {
      return state.hasQuery && JSON.stringify(collectDraft()) !== JSON.stringify(state.lastConditions);
    }
    function describe(conditions) {
      const parts = [];
      textFields.forEach(([key, , label]) => { if (conditions.text[key]) parts.push(`${label}：${conditions.text[key]}`); });
      if (conditions.cars.length) parts.push('车系：' + conditions.cars.map(code => mock.cars.find(car => car.code === code).name).join('、'));
      if (conditions.status) parts.push('点评状态：' + conditions.status);
      if (conditions.mis) parts.push('MIS：' + conditions.mis);
      dateRanges.forEach(range => {
        const dates = conditions.dates[range.key];
        if (dates.start) parts.push(`${range.label}：${dates.start} 至 ${dates.end}`);
      });
      const nodes = nodeLookup(conditions.treeId);
      const labels = Object.values(conditions.nodes).flat().map(id => nodes.get(id).label);
      if (labels.length) parts.push('逻辑节点：' + labels.join('、'));
      return `逻辑树：${getTree(conditions.treeId).name}；${parts.join('；')}`;
    }
    function draftChanged() {
      if (isDirty()) setMessage('条件已修改，当前结果仍为上次查询；请点击查询更新。', 'is-dirty');
      else if (state.hasQuery) setMessage('当前结果对应上次已提交的查询条件。', 'is-success');
      else setMessage('', '');
    }

    function renderCars() {
      const host = byId('car-control');
      host.textContent = '';
      const wrapper = make('div', 'car-select');
      const trigger = make('button', 'car-trigger', state.selectedCars.length
        ? mock.cars.filter(car => state.selectedCars.includes(car.code)).map(car => car.name).join('、') : '请选择车系（可选）');
      trigger.type = 'button';
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      const options = make('div', 'car-options');
      options.hidden = true;
      mock.cars.forEach(car => {
        const label = make('label', 'car-option');
        const input = make('input');
        input.type = 'checkbox'; input.value = car.code; input.checked = state.selectedCars.includes(car.code);
        input.addEventListener('change', () => {
          state.selectedCars = input.checked ? [...state.selectedCars, car.code] : state.selectedCars.filter(code => code !== car.code);
          trigger.textContent = state.selectedCars.length
            ? mock.cars.filter(item => state.selectedCars.includes(item.code)).map(item => item.name).join('、') : '请选择车系（可选）';
          draftChanged();
        });
        label.append(input, make('span', '', car.name)); options.append(label);
      });
      trigger.addEventListener('click', () => { options.hidden = !options.hidden; trigger.setAttribute('aria-expanded', String(!options.hidden)); });
      wrapper.append(trigger, options); host.append(wrapper);
    }

    function renderDimensions() {
      const host = byId('dim-cascade'); host.textContent = '';
      const tree = getTree(byId('tree-select').value);
      const all = flattenNodes(tree ? tree.nodes : []);
      for (let depth = 0; depth < 5; depth++) {
        if (depth > 0 && !state.selectedNodes[depth - 1].length) break;
        const nodes = depth === 0 ? (tree ? tree.nodes : []) : all
          .filter(node => state.selectedNodes[depth - 1].includes(node.id)).flatMap(node => node.children || []);
        if (depth > 0 && !nodes.length) break;
        const column = make('div', 'dim-col');
        column.append(make('div', 'dim-col-label', `L${depth + 1}`));
        const options = make('div', 'dim-options');
        if (!nodes.length) options.append(make('div', 'dim-empty', '暂无节点'));
        nodes.forEach(node => {
          const label = make('label', 'dim-option');
          const input = make('input');
          input.type = 'checkbox'; input.value = node.id; input.checked = state.selectedNodes[depth].includes(node.id);
          input.addEventListener('change', () => {
            state.selectedNodes[depth] = input.checked ? [...state.selectedNodes[depth], node.id] : state.selectedNodes[depth].filter(id => id !== node.id);
            for (let next = depth + 1; next < 5; next++) state.selectedNodes[next] = [];
            renderDimensions(); draftChanged();
          });
          label.append(input, make('span', '', node.label)); options.append(label);
        });
        column.append(options); host.append(column);
      }
    }

    function renderHeaders() {
      const head = byId('table-head'); head.textContent = '';
      const row = make('tr');
      columns.forEach(column => {
        const cell = make('th', '', column.label);
        cell.scope = 'col'; cell.style.minWidth = column.width + 'px';
        cell.hidden = !state.visibleColumns.has(column.key); cell.dataset.column = column.key;
        row.append(cell);
      });
      head.append(row);
    }
    function renderTable() {
      renderHeaders();
      const body = byId('table-body'); body.textContent = '';
      const start = (state.page - 1) * state.pageSize;
      const rows = state.rows.slice(start, start + state.pageSize);
      if (!rows.length) {
        const row = make('tr');
        const cell = make('td', 'empty-state');
        const message = make('div', 'empty-message', state.hasQuery ? '暂无符合条件的数据' : '请设置查询条件后点击查询加载数据');
        message.style.position = 'sticky'; message.style.left = '0';
        message.style.textAlign = 'center'; message.style.boxSizing = 'border-box';
        cell.colSpan = state.visibleColumns.size; cell.append(message); row.append(cell); body.append(row);
      }
      rows.forEach((record, offset) => {
        const row = make('tr', record.recordLayer === 'L2' ? 'parent-row' : 'child-row');
        row.dataset.rowKey = record.rowKey; row.dataset.answerId = record.answerId;
        columns.forEach(column => {
          const cell = make('td');
          cell.hidden = !state.visibleColumns.has(column.key); cell.dataset.column = column.key;
          const value = column.key === 'sequence' ? start + offset + 1 : record[column.key];
          const text = value == null || value === '' ? '—' : String(value);
          if (column.key === 'recordLayer') cell.append(make('span', 'record-badge record-' + record.recordLayer.toLowerCase(), text));
          else if (column.key === 'score') cell.append(make('span', 'score-badge', text));
          else cell.textContent = text;
          if (['sequence', 'recordLayer', 'score', 'troubleDegree', 'rewardSuccess'].includes(column.key)) cell.classList.add('cell-center');
          cell.title = text; row.append(cell);
        });
        body.append(row);
      });
      byId('report-table').classList.toggle('is-compact', state.compact);
      updateEmptyWidth();
    }
    function updateEmptyWidth() {
      const message = byId('table-body').querySelector('.empty-message');
      const scroll = byId('table-scroll');
      if (message && scroll) {
        const style = window.getComputedStyle(message.parentElement);
        const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
        message.style.width = Math.max(0, scroll.clientWidth - 2 - padding) + 'px';
      }
    }
    function renderPagination() {
      const host = byId('pagination'); host.textContent = '';
      const maxPage = Math.max(1, Math.ceil(state.rows.length / state.pageSize));
      const start = state.rows.length ? (state.page - 1) * state.pageSize + 1 : 0;
      const end = Math.min(state.page * state.pageSize, state.rows.length);
      host.append(make('span', 'pagination-summary', `${start}–${end} / ${state.rows.length} 条`));
      const sizeLabel = make('label', 'page-size', '每页 ');
      const size = make('select'); size.setAttribute('aria-label', '每页条数');
      [10, 20, 50, 100].forEach(number => { const option = make('option', '', number + ' 条'); option.value = String(number); option.selected = number === state.pageSize; size.append(option); });
      size.addEventListener('change', () => { state.pageSize = Number(size.value); state.page = 1; renderResults(); });
      sizeLabel.append(size); host.append(sizeLabel);
      function button(text, page, disabled, active) {
        const element = make('button', 'page-button' + (active ? ' active' : ''), text);
        element.type = 'button'; element.disabled = disabled;
        if (active) element.setAttribute('aria-current', 'page');
        element.addEventListener('click', () => { state.page = page; renderResults(); });
        host.append(element);
      }
      button('上一页', Math.max(1, state.page - 1), !state.rows.length || state.page === 1);
      const first = Math.max(1, state.page - 2); const last = Math.min(maxPage, state.page + 2);
      if (first > 1) { button('1', 1, false, false); if (first > 2) host.append(make('span', '', '…')); }
      for (let page = first; page <= last; page++) button(String(page), page, !state.rows.length, page === state.page);
      if (last < maxPage) { if (last < maxPage - 1) host.append(make('span', '', '…')); button(String(maxPage), maxPage, false, false); }
      button('下一页', Math.min(maxPage, state.page + 1), !state.rows.length || state.page === maxPage);
    }
    function renderResults() {
      state.page = Math.min(state.page, Math.max(1, Math.ceil(state.rows.length / state.pageSize)));
      byId('result-count').textContent = String(state.rows.length);
      byId('answer-count').textContent = String(new Set(state.rows.map(row => row.answerId)).size);
      byId('l2-count').textContent = String(state.rows.filter(row => row.recordLayer === 'L2').length);
      byId('l3-count').textContent = String(state.rows.filter(row => row.recordLayer === 'L3').length);
      byId('result-context').textContent = state.hasQuery ? '上次查询：' + describe(state.lastConditions) : '尚未提交查询';
      byId('export-btn').disabled = !state.hasQuery || !state.rows.length;
      byId('refresh-btn').disabled = !state.hasQuery;
      renderTable(); renderPagination();
    }
    function query(event) {
      if (event) event.preventDefault();
      const invalidDate = dateRanges.find(range => ['start', 'end'].some(edge => byId(`f-${range.key}-${edge}`).validity.badInput));
      if (invalidDate) {
        setMessage(`${invalidDate.label}日期格式无效，请重新选择。` + (state.hasQuery ? ' 当前结果仍为上次查询。' : ''), 'is-error');
        return false;
      }
      const conditions = collectDraft();
      const error = validateConditions(conditions);
      if (error) { setMessage(error + (state.hasQuery ? ' 当前结果仍为上次查询。' : ''), 'is-error'); return false; }
      state.lastConditions = JSON.parse(JSON.stringify(conditions));
      state.rows = expandAnswers(mock.answers, state.lastConditions);
      state.hasQuery = true; state.page = 1;
      renderResults();
      setMessage(state.rows.length ? '查询完成，结果按 L2 父行和 L3 子行排列。' : '查询完成，暂无符合条件的数据。', 'is-success');
      return true;
    }
    function reset(event) {
      if (event) event.preventDefault();
      form.reset();
      textFields.forEach(([, id]) => { byId(id).value = ''; });
      dateRanges.forEach(range => { byId(`f-${range.key}-start`).value = ''; byId(`f-${range.key}-end`).value = ''; });
      byId('f-status').value = ''; byId('f-mis').value = ''; byId('tree-select').value = mock.defaultTreeId;
      state.selectedCars = []; state.selectedNodes = { 0: [], 1: [], 2: [], 3: [], 4: [] };
      state.rows = []; state.lastConditions = null; state.hasQuery = false; state.page = 1;
      renderCars(); renderDimensions(); renderResults(); draftChanged();
    }
    function refresh(event) {
      if (event) event.preventDefault();
      if (!state.hasQuery) { toast('请先设置条件并查询。'); return; }
      state.rows = expandAnswers(mock.answers, state.lastConditions); renderResults(); draftChanged();
      toast('已按上次提交条件刷新结果。');
    }
    function exportCsv(event) {
      if (event) event.preventDefault();
      if (!state.hasQuery || !state.rows.length) { toast('暂无可导出的查询结果。'); return; }
      if (state.rows.length > 50000) { setMessage('您当前导出行数已超出5万行，请修改查询条件，分批导出。', 'is-error'); return; }
      const blob = new Blob([buildCsv(state.rows)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = make('a'); anchor.href = url; anchor.download = '问卷分层报表_匿名演示.csv'; anchor.hidden = true;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`已导出上次查询的全部 ${state.rows.length} 行${isDirty() ? '，未使用尚未提交的条件' : ''}。`);
    }
    function renderColumnPanel() {
      const panel = byId('column-panel'); panel.textContent = '';
      panel.append(make('div', 'column-panel-title', '显示字段（导出保留全部字段）'));
      columns.forEach(column => {
        const label = make('label', 'column-option'); const input = make('input');
        input.type = 'checkbox'; input.checked = state.visibleColumns.has(column.key);
        input.addEventListener('change', () => {
          if (!input.checked && state.visibleColumns.size === 1) { input.checked = true; toast('至少保留一个显示字段。'); return; }
          if (input.checked) state.visibleColumns.add(column.key); else state.visibleColumns.delete(column.key);
          renderTable();
        });
        label.append(input, make('span', '', column.label)); panel.append(label);
      });
    }

    const treeSelect = byId('tree-select'); treeSelect.textContent = '';
    mock.trees.forEach(tree => { const option = make('option', '', tree.name); option.value = tree.id; treeSelect.append(option); });
    treeSelect.value = mock.defaultTreeId;
    const misSelect = byId('f-mis');
    misSelect.textContent = '';
    const defaultMis = make('option', '', '请选择'); defaultMis.value = ''; misSelect.append(defaultMis);
    mock.misOptions.forEach(value => {
      if (![...misSelect.options].some(option => option.value === value)) { const option = make('option', '', value); option.value = value; misSelect.append(option); }
    });
    treeSelect.addEventListener('change', () => { state.selectedNodes = { 0: [], 1: [], 2: [], 3: [], 4: [] }; renderDimensions(); draftChanged(); });
    form.addEventListener('submit', query);
    form.addEventListener('input', draftChanged);
    form.addEventListener('change', draftChanged);
    byId('query-btn').addEventListener('click', query);
    byId('reset-btn').addEventListener('click', reset);
    byId('refresh-btn').addEventListener('click', refresh);
    byId('export-btn').addEventListener('click', exportCsv);
    byId('collapse-btn').addEventListener('click', event => {
      event.preventDefault(); const advanced = byId('advanced-fields'); advanced.hidden = !advanced.hidden;
      byId('collapse-btn').textContent = advanced.hidden ? '展开' : '收起';
      byId('collapse-btn').setAttribute('aria-expanded', String(!advanced.hidden));
    });
    byId('density-btn').addEventListener('click', event => {
      event.preventDefault(); state.compact = !state.compact;
      byId('density-btn').title = state.compact ? '切换为标准密度' : '切换为紧凑密度';
      byId('density-btn').setAttribute('aria-label', byId('density-btn').title);
      byId('density-btn').setAttribute('aria-pressed', String(state.compact)); renderTable();
    });
    byId('columns-btn').addEventListener('click', event => {
      event.preventDefault(); const panel = byId('column-panel'); panel.hidden = !panel.hidden;
      byId('columns-btn').setAttribute('aria-expanded', String(!panel.hidden));
    });
    document.addEventListener('click', event => {
      if (!byId('car-control').contains(event.target)) {
        const options = byId('car-control').querySelector('.car-options'); if (options) options.hidden = true;
        const trigger = byId('car-control').querySelector('.car-trigger'); if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
      if (!byId('column-panel').contains(event.target) && !byId('columns-btn').contains(event.target)) {
        byId('column-panel').hidden = true; byId('columns-btn').setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const options = byId('car-control').querySelector('.car-options'); if (options) options.hidden = true;
      const trigger = byId('car-control').querySelector('.car-trigger'); if (trigger) trigger.setAttribute('aria-expanded', 'false');
      byId('column-panel').hidden = true; byId('columns-btn').setAttribute('aria-expanded', 'false');
    });
    byId('column-panel').hidden = true;
    window.addEventListener('resize', updateEmptyWidth);
    if (window.ResizeObserver) new window.ResizeObserver(updateEmptyWidth).observe(byId('table-scroll'));
    renderCars(); renderDimensions(); renderColumnPanel(); renderResults(); draftChanged();
    window.ReportController = {
      query, reset, refresh, collectDraft,
      getState: () => ({
        hasQuery: state.hasQuery, dirty: isDirty(), page: state.page, pageSize: state.pageSize,
        lastConditions: state.lastConditions ? JSON.parse(JSON.stringify(state.lastConditions)) : null,
        rows: state.rows.map(row => ({ ...row })), visibleColumns: [...state.visibleColumns]
      })
    };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
