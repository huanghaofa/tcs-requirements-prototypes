(function () {
  'use strict';
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', function () {
    const closed = document.body.classList.toggle('sidebar-collapsed');
    const mobile = window.matchMedia('(max-width:780px)').matches;
    const open = mobile ? closed : !closed;
    sidebarToggle.setAttribute('aria-expanded', String(open));
    sidebarToggle.setAttribute('aria-label', open ? '收起侧栏' : '展开侧栏');
  });
  document.getElementById('report-nav-toggle').addEventListener('click', function () {
    const target = document.getElementById('report-nav-items');
    target.hidden = !target.hidden;
    this.setAttribute('aria-expanded', String(!target.hidden));
    this.querySelector('.arrow').textContent = target.hidden ? '⌄' : '⌃';
  });
})();
