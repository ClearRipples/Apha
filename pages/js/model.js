/*
 * Tabs 结合iScroll进行横向滚动，滚动到相应的页签进行
 * 数据请求获取待处理单据的源单，目前只测试这两种单据类型
 */

var srcType = [
    {
        iDestId: 1,
        sWidgetId: 'win',
        sDestName: "采购入库",
        vSrcType: [
            //{
            //   sid: 1,
            //   sName: "外购入库(未审核)",
            //   isDefault: true,
            //   langId: "purchase_receipt_unapproved"
            //},
            {
                sid: 72,
                sName: "收料通知/请检单",
                langId: "materials_receipt_document"
            }
        ]
    },
    {
        iDestId: 72,
        sDestName: "采购收料",
        sWidgetId: 'sltz',
        vSrcType: [
            {
                sid: 72,
                sName: "收料通知/请检单(未审核)",
                langId: "materials_receipt_unapproved",
                isDefault: true
            },
            {
                sid: 71,
                sName: "采购订单",
                langId: "purchase_order"
            }
        ]
    },
    {
        iDestId: -1,
        sWidgetId: 'winr',
        sDestName: "外购退料",
        vSrcType: [
            {
                sid: 73,
                sName: "退料通知",
                langId: "material_return_notice"
            }
        ]
    },
    {
        iDestId: 83,
        sWidgetId: 'xsfh',
        sDestName: "发货通知",
        vSrcType: [
            {
                sid: 83,
                sName: "发货通知(未审核)",
                isDefault: true,
                langId: "delivery_notice_unapproved"
            },
            {
                sid: 81,
                sName: "销售订单",
                langId: "sale_order"
            }
        ]
    },
     {
         iDestId: 21,
         sWidgetId: 'xsck',
         sDestName: "销售出库",
         vSrcType: [
             //{
             //    sid: 21,
             //    sName: "销售出库(未审核)",
             //    isDefault: true
             //},
             //{
             //    sid: 81,
             //    sName: "销售订单",
             //},
             {
                 sid: 83,
                 sName: "发货通知",
                 langId: "delivery_notice"
             }
         ]
     },
     {
         iDestId: -21,
         sWidgetId: 'xsckr',
         sDestName: "销售退库",
         vSrcType: [
             //{
             //    sid: 21,
             //    sName: "销售出库(未审核)",
             //    isDefault: true
             //},
             //{
             //    sid: 81,
             //    sName: "销售订单",
             //},
             {
                 sid: 83,
                 sName: "退货通知单",
                 langId: "goods_return_notice"
             }
         ]
     },
      //{
      //    iDestId: 551,
      //    sDestName: "任务汇报单",
      //    vSrcType: [
      //        {
      //            sid: 551,
      //            sName: "任务汇报单(未审核)",
      //            isDefault: true
      //        }
      //    ]
      //},
       {
           iDestId: 24,
           sWidgetId: 'scll',
           sDestName: "生产领料",
           vSrcType: [
               {
                   sid: 24,
                   sName: "生产领料(未审核)",
                   isDefault: true,
                   langId: "picking_list_unapproved"
               },
               //{
               //    sid: 85,
               //    sName: "生产任务单",
               //}
           ]
       },
        {
            iDestId: -24,
            sWidgetId: 'scllr',
            sDestName: "生产退料",
            vSrcType: [
               //{
               //    sid: 24,
               //    sName: "生产领料(未审核)",
               //    isDefault: true
               //},
               //{
               //    sid: 1,
               //    sName: "外购入库",
               //},
               //{
               //    sid: 24,
               //    sName: "生产领料",
               //},
               //{
               //    sid: 85,
               //    sName: "生产任务单",
               //}
            ]
        },
         {
             iDestId: 2,
             sWidgetId: 'scrk',
             sDestName: "产品入库",
             vSrcType: [
                 {
                    sid: 2,
                    sName: "产品入库(未审核)",
                    isDefault: true,
                    langId: "product_receipt_unapprove"
                 },                 
                 //{
                 //    sid: 85,
                 //    sName: "生产任务单",
                 //}
             ]
         },
          {
              iDestId: 1014400,
              sWidgetId: 'rkpd',
              sDestName: "盘点",
              vSrcType: [
                  {
                      sid: 1014400,
                      sName: "盘点(未审核)",
                      isDefault: true,
                      langId: "physical_counting_unapproved"
                  }
              ]
          },
          {
              iDestId: 5,
              sWidgetId: 'wwrk',
              sDestName: "委外入库",
              vSrcType: [
                  //{
                  //  sid: 5,
                  //  sName: "委外入库单(未审核)",
                  //  isDefault: true
                  //},
                  //{
                  //    sid: 1007105,
                  //    sName: "委外订单",
                  //},
                  {
                      sid: 72,
                      sName: "收料通知/请检单",
                      langId: "materials_receipt_document"
                  }
              ]
          },
          {
              iDestId: 28,
              sWidgetId: 'wwck',
              sDestName: "委外出库",
              vSrcType: [
                  {
                      sid: 28,
                      sName: "委外出库单(未审核)",
                      isDefault: true,
                      langId: "subcontract_delivery_unapproved"
                  }
              ]
          }
];
