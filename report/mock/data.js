(function () {
  'use strict';

  // 全部为匿名静态示例；标识、日期、奖励和问题回答均不代表 SIT 或生产数据。
  window.ReportMock = {
    defaultTreeId: 'tree3',
    cars: [
      { code: 'P33A', name: 'N7' },
      { code: 'J33', name: 'N6' },
      { code: 'P33B', name: 'NX8' }
    ],
    misOptions: ['外观MIS', '内饰MIS', '复访MIS'],
    trees: [
      {
        id: 'tree3', name: '业测的树3', nodes: [
          {
            id: 'appearance', label: '外观与油漆', depth: 0, children: [
              {
                id: 'color', label: '颜色', depth: 1, children: [
                  {
                    id: 'color-difference', label: '色差', depth: 2, children: [
                      {
                        id: 'paint-difference', label: '漆面色差', depth: 3, children: [
                          { id: 'paint-description', label: '色差描述', depth: 4, children: [] }
                        ]
                      }
                    ]
                  },
                  {
                    id: 'fading', label: '褪色', depth: 2, children: [
                      {
                        id: 'door-fading', label: '车门边缘褪色', depth: 3, children: [
                          { id: 'fading-description', label: '褪色描述', depth: 4, children: [] }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                id: 'shape', label: '造型', depth: 1, children: [
                  {
                    id: 'uneven-lines', label: '线条不流畅', depth: 2, children: [
                      {
                        id: 'side-curve', label: '侧面弧度', depth: 3, children: [
                          { id: 'curve-description', label: '弧度描述', depth: 4, children: [] }
                        ]
                      }
                    ]
                  }
                ]
              },
              { id: 'aerodynamics', label: '空气动力学', depth: 1, children: [] }
            ]
          },
          {
            id: 'interior', label: '内饰与材质', depth: 0, children: [
              { id: 'seat-material', label: '座椅材质', depth: 1, children: [] },
              { id: 'interior-assembly', label: '内饰装配', depth: 1, children: [] }
            ]
          }
        ]
      }
    ],
    answers: [
      {
        mockAnswerId: 'MOCK-ANSWER-118', treeId: 'tree3', planNo: 'MOCK-PLAN-001', qid: '118',
        carCode: 'P33A', carName: 'N7', vin: 'MOCKVIN0000000118', vehicleClassCode: '000000000000000118',
        unionid: 'MOCK-UNION-118', oneid: 'MOCK-ONE-118', pushId: 'MOCK-PUSH-118', status: '已完成',
        mis: '外观MIS', qtitle: '匿名示例外观问卷', planName: '匿名示例调查方案 A', method: '短信',
        pushTime: '2026-10-01 09:00:00', reviewTime: '2026-10-02 10:30:00', deliveryDate: '2026-09-20',
        dealer: '示例专营店 A', rewardSuccess: '是', rewardTime: '2026-10-02 11:00:00', rewardFailure: '',
        l1Branches: [
          {
            nodeId: 'appearance', questionId: 'MOCK-Q118-L1', score: 5,
            l2Branches: [
              {
                nodeId: 'color', questionId: 'MOCK-Q118-L2-COLOR', l3Branches: [
                  {
                    nodeId: 'color-difference', questionId: 'MOCK-Q118-L3-DIFFERENCE',
                    l4: { nodeId: 'paint-difference', value: '车门与翼子板的漆面色差' },
                    l5: { nodeId: 'paint-description', value: '两处漆面在自然光下颜色略有差异。' },
                    troubleDegree: '2', recentOccurrenceTime: '2026-09-29'
                  },
                  {
                    nodeId: 'fading', questionId: 'MOCK-Q118-L3-FADING',
                    l4: { nodeId: 'door-fading', value: '左侧车门边缘' },
                    l5: { nodeId: 'fading-description', value: '车门边缘颜色比周围浅。' },
                    troubleDegree: '1', recentOccurrenceTime: '2026-09-30'
                  }
                ]
              },
              {
                nodeId: 'shape', questionId: 'MOCK-Q118-L2-SHAPE', l3Branches: [
                  {
                    nodeId: 'uneven-lines', questionId: 'MOCK-Q118-L3-LINES',
                    l4: { nodeId: 'side-curve', value: '前门到后门的侧面弧度' },
                    l5: { nodeId: 'curve-description', value: '侧面线条在连接处不够顺滑。' },
                    troubleDegree: '2', recentOccurrenceTime: '2026-10-01'
                  }
                ]
              },
              { nodeId: 'aerodynamics', questionId: 'MOCK-Q118-L2-AERO', l3Branches: [] }
            ]
          }
        ]
      },
      {
        mockAnswerId: 'MOCK-ANSWER-119', treeId: 'tree3', planNo: 'MOCK-PLAN-002', qid: '119',
        carCode: 'J33', carName: 'N6', vin: 'MOCKVIN0000000119', vehicleClassCode: '000000000000000119',
        unionid: 'MOCK-UNION-119', oneid: 'MOCK-ONE-119', pushId: 'MOCK-PUSH-119', status: '填写中',
        mis: '内饰MIS', qtitle: '匿名示例内饰问卷', planName: '匿名示例调查方案 B', method: 'app',
        pushTime: '2026-10-03 14:00:00', reviewTime: '', deliveryDate: '2026-09-25',
        dealer: '示例专营店 B', rewardSuccess: '否', rewardTime: '', rewardFailure: '',
        l1Branches: [
          {
            nodeId: 'interior', questionId: 'MOCK-Q119-L1', score: 6, l2Branches: [
              { nodeId: 'seat-material', questionId: 'MOCK-Q119-L2-SEAT', l3Branches: [] },
              { nodeId: 'interior-assembly', questionId: 'MOCK-Q119-L2-ASSEMBLY', l3Branches: [] }
            ]
          }
        ]
      },
      {
        mockAnswerId: 'MOCK-ANSWER-120', treeId: 'tree3', planNo: 'MOCK-PLAN-001', qid: '120',
        carCode: 'P33B', carName: 'NX8', vin: 'MOCKVIN0000000120', vehicleClassCode: '000000000000000120',
        unionid: 'MOCK-UNION-120', oneid: 'MOCK-ONE-120', pushId: 'MOCK-PUSH-120', status: '已完成',
        mis: '复访MIS', qtitle: '匿名示例外观复访问卷', planName: '匿名示例调查方案 A', method: '小程序',
        pushTime: '2026-10-05 08:45:00', reviewTime: '2026-10-06 16:20:00', deliveryDate: '2026-09-28',
        dealer: '示例专营店 C', rewardSuccess: '否', rewardTime: '', rewardFailure: '匿名示例：奖励账户暂不可用',
        l1Branches: [
          {
            nodeId: 'appearance', questionId: 'MOCK-Q120-L1', score: 4, l2Branches: [
              {
                nodeId: 'color', questionId: 'MOCK-Q120-L2-COLOR', l3Branches: [
                  {
                    nodeId: 'color-difference', questionId: 'MOCK-Q120-L3-DIFFERENCE',
                    l4: { nodeId: 'paint-difference', value: '后保险杠与车身之间' },
                    l5: { nodeId: 'paint-description', value: '后保险杠的色泽与车身存在差异。' },
                    troubleDegree: '3', recentOccurrenceTime: '2026-10-04'
                  }
                ]
              },
              {
                nodeId: 'shape', questionId: 'MOCK-Q120-L2-SHAPE', l3Branches: [
                  {
                    nodeId: 'uneven-lines', questionId: 'MOCK-Q120-L3-LINES',
                    l4: { nodeId: 'side-curve', value: '后翼子板的侧面弧度' },
                    l5: { nodeId: 'curve-description', value: '后翼子板处线条过渡不自然。' },
                    troubleDegree: '1', recentOccurrenceTime: '2026-10-05'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
})();
