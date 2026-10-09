window.AnnotationData = {
  association: [
    {
      id: '1', page: 'association', target: '[data-anno="assoc-layer-stats"]', title: 'F01 · 每层题目的配置统计',
      sections: {
        valueLogic: '各层展示“共 xx 题，已配置 xx 题，未配置 xx 题”；未配置数＝总题数－已配置数。统计当前问卷、当前层级及对应上级分支的全部题目，搜索不改变总题数。',
        judgeRule: '完成普通节点或系统保留节点关联均计为已配置；仅勾选题目不计为已配置。同一道题按题目 ID 去重。'
      }
    },
    {
      id: '2', page: 'association', target: '#modal-search', title: 'F02 · 只允许关联现有节点',
      sections: {
        interactionDesc: '检索、选择现有节点后点击“确认”完成关联；取消不应用本次选择。此页面不提供新增、编辑、删除节点入口。',
        judgeRule: '选择范围沿用当前层级与上级关联范围。点击本条标注只打开节点选择窗口，不确认关联。'
      }
    },
    {
      id: '3', page: 'association', target: '[data-anno="assoc-reserved-nodes"]', title: 'F02 · 保留系统字段关联',
      sections: {
        interactionDesc: '可选择“困扰度”或“最近发生时间”系统保留节点，仍须点击“确认”生效。',
        judgeRule: '普通节点与系统保留节点互斥，系统保留项单选；完成关联后计入已配置题目。'
      }
    },
    {
      id: '4', page: 'association', target: '#association-export-title', title: 'F03 · 全量逐题导出与完整路径',
      sections: {
        dataSource: '导出当前逻辑树下已添加问卷的全部题目，每道题一行，包含已配置和未配置题目，不受搜索、展开分支或预览分页影响。',
        fieldDesc: '前置列为逻辑树名称、问卷编号、问卷名称、本行题目 ID、本行层级；L1～L5 每层包含问题 ID、问题名称、节点名称、是否配置。',
        exceptionRule: '上级未配置时仍保留下级题目及完整题目路径；该上级“是否配置”为“否”，节点名称留空。超过本行题目层级的列全部留空。'
      }
    },
    {
      id: '5', page: 'association', target: '[data-anno="assoc-export-current-vs-sample"]', title: 'F03 · 当前配置与 Excel 样例',
      sections: {
        interactionDesc: '“下载当前配置 CSV”读取节点弹窗确认后的页面配置状态，导出全部逐题记录；“下载 Excel 样例”提供固定参考文件。',
        otherDesc: '当前为静态演示，样例包含 2 张问卷、62 道题、25 列；实际题目数随已添加问卷变化。点击标注只打开预览，不下载文件。'
      }
    }
  ],
  report: [
    {
      id: '1', page: 'report', target: '#table-head th[data-column="recordLayer"]', title: 'F04 · L2 与 L3 明细拆行',
      sections: {
        judgeRule: 'L2 有 L3 明细时，每个 L3 各占一行，L2 仅作为上级信息随行展示，不额外增加 L2 行；只有实际有回答但没有 L3 的 L2 分支才单独一行。按 L2 分支及所属 L3 顺序排列。',
        fieldDesc: '记录层级标明本行是 L2 或 L3；L3 行带出 L1、L2 上级信息，仅 L2 行的 L3～L5 留空。深层筛选只保留匹配的 L3 明细，不因子行被筛掉而补出 L2 行。本静态示例暂将困扰度及最近发生时间展示在所属 L3 明细。',
        otherDesc: '待确认：困扰度与最近发生时间的真实来源及归属；L4/L5 多回答、只到 L1 的答卷及未作答分支的处理。标注定位不提交查询；可用问卷 ID 118 查看示例。'
      }
    },
    {
      id: '2', page: 'report', target: '#result-count', title: 'F04 · 行数与答卷数分别统计',
      sections: {
        valueLogic: '明细条数＝实际 L3 明细条数＋有回答但无 L3 的 L2 分支数；“仅 L2”统计独立 L2 行，“L3”统计 L3 行。答卷数按实际答卷去重，上级 L2 的重复展示不增加条数。',
        otherDesc: '示例问卷 118：颜色/色差、颜色/褪色、造型/线条不流畅、空气动力学/空，共 4 行（3 条 L3＋1 条仅 L2），仍为 1 份答卷。'
      }
    },
    {
      id: '3', page: 'report', target: '#table-head th[data-column="score"]', title: 'F04 · 重复评分的统计口径',
      sections: {
        valueLogic: '同一 L1 评分会随明细行重复展示。汇总时按“答卷＋L1 问题”去重，不将重复显示的评分逐行累加。',
        otherDesc: '此原型展示明细拆行，评分汇总接口与真实业务数据不在本次静态演示范围。'
      }
    },
    {
      id: '4', page: 'report', target: '#f-qid', title: 'F05 · 首次进入保持空表',
      sections: {
        interactionDesc: '首次进入页面不要求先选车系，不自动加载数据；结果为 0，输入条件后点击“查询”或按回车才加载结果。',
        otherDesc: 'F04 卡片为拆行展示入口，预置问卷 118 的示例结果；F05 卡片及普通报表入口保持首进空表。'
      }
    },
    {
      id: '5', page: 'report', target: '#query-btn', title: 'F05 · 查询条件与校验',
      sections: {
        judgeRule: '演示暂按至少一个有效条件查询，车系可选；默认逻辑树、默认“全部”不算条件。文本去除首尾空格，日期须填写完整且开始日期不晚于结束日期。',
        exceptionRule: '无有效条件或日期无效时提示并保留原结果；查询成功但无匹配数据时显示空结果。',
        otherDesc: '待确认：可触发查询的有效条件白名单。深层节点筛选只保留命中的明细，不追加 L2 父行。'
      }
    },
    {
      id: '6', page: 'report', target: '#export-btn', title: 'F05 · 导出与上次查询结果一致',
      sections: {
        dataSource: '刷新、分页和导出均使用上次已提交查询的条件及结果。输入未提交的新条件时提示“条件已修改”，不改变当前结果。',
        interactionDesc: '导出上次查询的全部明细，包含 L3 行及有回答但无 L3 的独立 L2 行；不受当前分页或隐藏列影响。首进空表、查询无结果时禁用导出。',
        otherDesc: '点击本条标注仅定位导出按钮，不发起下载。'
      }
    },
    {
      id: '7', page: 'report', target: '#reset-btn', title: 'F05 · 重置恢复初始空表',
      sections: {
        interactionDesc: '清除查询条件与所选逻辑节点，清空结果并恢复初始页码；保留默认逻辑树，导出不可用。',
        otherDesc: '点击本条标注只定位“重置”，不会执行重置。'
      }
    }
  ]
};
