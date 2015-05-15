/*
 * 出库控件
 * options{
 *  type: 单据的类型
 *}
 * activePageFlip: inactive：闭合状态, active：展开状态, popup：当前有弹出
 * 在页面的详情中inactive->popup->inactive
 * 控件内部只做单据内部数据的逻辑处理，其他的都将使用回调的方式进行
 * 将扫描放到插件中进行
 */
(function (window, document, Math) {
    var Delivery = (function () {
        var Delivery = function (el, options) {
            this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
            //存放表单的JSON数据
            this.dataHash = {};
            this.dataHash.batch = {};
            //当前选中数据表
            this.currTable = null;
            //存放页面的scroller
            this.scrollers = [];
            //当前的scroller
            this.currScroll = null;
            //用于判断数据是否正在加载
            this.isloading = false;
            //用于判断是否有弹出界面
            this.activePageFlip = 'inactive';
            //用于存放前一个状态
            this.oldActivePageFlip = 'inactive';
            //存放当前选中的行
            this.selectedRows = [];
            //当前的行,默认情况下是第一行
            this.currRow = null;
            //存放当前选中的仓库仓位信息
            this.currStock = {};
            //判断是否为扫描得到的单据，为扫描单据的情况允许用户进行扫描分录新增
            //部位扫描单据的情况不允许进行扫描新增
            this.isScanBill = false;

            this.isFilter = false;

            //type 则是单据的类型，可用作于数据的提交,
            this.options = {
                type: "",
                loadingLayer: $s('#loading_layer')
            };

            for (var i in options) {
                this.options[i] = options[i];
            }
            this._init();
            this._initTable();
        };


        Delivery.prototype = {
            version: '1.0',

            //将得到的请求数据进行转换
            _initAttribute: function (type) {
                var that = this;                

                if (type == 'list') {
                    var listData = that.dataHash[type];
                    var newDataHash = {};
                    newDataHash.HeadData = listData.HeadData;
                    newDataHash.EntryData = {};
                    newDataHash.ShowData = {};
                    newDataHash.ShowData.DetailData = {};
                    newDataHash.ShowData.TableData = {};
                    //用于存放拆批的信息
                    newDataHash.SplitBatchData = {};

                    for (var i = 0; i < listData.EntryData.length; i++){
                        var key = listData.EntryData[i].FSourceInterId + "_" + listData.EntryData[i].FSourceEntryID;

                        if(listData.EntryData[i].FSourceInterId != 0){
                            key = listData.EntryData[i].FSourceInterId + "_" + listData.EntryData[i].FSourceEntryID+"_"+ listData.EntryData[i];
                        }else{
                            key = listData.EntryData[i]["FInterID"] + "_" + listData.EntryData[i]["FEntryID"] + "_" + listData.EntryData[i]["FEntryID"];
                        }
                        newDataHash.EntryData[key] = listData.EntryData[i];
                    }

                    for (var i = 0; i < listData.ShowData.TableData.length; i++) {
                        var key = listData.ShowData.TableData[i]["FDataKey"]["DefaultValue"]["SaveValue"];
                        newDataHash.ShowData.TableData[key] = listData.ShowData.TableData[i];
                    }

                    that.dataHash[type] = {};
                    that.dataHash[type] = newDataHash;
                }
                
                //转换成为 {key:value}
                if (type == 'stock') {
                    var stockData = that.dataHash[type];      
                    delete that.dataHash[type];
                    that.dataHash[type] = {};
                    for (var i = 0; i < stockData.length > 0; i++) {
                        that.dataHash[type][stockData[i]["FItemID"]] = stockData[i];
                    }
                }
            },

            //用于页面的构建，构建基础的页面结构
            _init: function () {
                var that = this;
                //得到页面结构的模板
                var html = $s('#delivery_template').innerHTML;
                var pageObject = $s.html2dom(html);
                this.wrapper.appendChild(pageObject);
                var components = this.wrapper.querySelectorAll('.component');
          
                that._initEnvets();
            },

            //处理页面的初始化的时间
            _initEnvets: function () {
                var that = this;
                var container = that.wrapper.querySelector('.container');
                var trigger = container.querySelector('button.trigger_up');
                var trigger_popup = container.querySelector('button.trigger_popup');

                this._triggerClickHandler(container, trigger);

                //展开之后，修改当前的component的top值
                var component = that.wrapper.querySelector(".intro .component");

                //为点击仓库仓位绑定事件
                var slidingbtn = that.wrapper.querySelector('.intro_description');
                var hideWrap = that.wrapper.querySelector('.hide_wrap');

                $s.tap(slidingbtn, function () {
                    if(that.activePageFlip != "inactive"){
                        if ($s.hasClass(container, 'container_popup')) {
                            $s.removeClass(container, 'container_popup');
                            $s.removeClass(trigger_popup, 'trigger_active');
                            that.activePageFlip = that.oldActivePageFlip;
                        } else {
                            if (!$s.hasClass(container, 'container_popup')) {
                                $s.addClass(container, 'container_popup');
                                $s.addClass(trigger_popup, 'trigger_active');
                                that.oldActivePageFlip = that.activePageFlip;
                                that.activePageFlip = "popup";
                            }
                        }
                    }
                });

                $s.tap(trigger_popup, function () {
                    if ($s.hasClass(container, 'container_popup')) {
                        $s.removeClass(container, 'container_popup');
                        $s.removeClass(trigger_popup, 'trigger_active');
                        that.activePageFlip = that.oldActivePageFlip;
                        that.oldActivePageFlip = 'inactive';
                    } else {
                        if (!$s.hasClass(container, 'container_popup')) {
                            $s.addClass(container, 'container_popup');
                            $s.addClass(trigger_popup, 'trigger_active');
                            that.oldActivePageFlip = that.activePageFlip;
                            that.activePageFlip = "popup";
                        }
                    }
                });

                var deleteBtn = this.wrapper.querySelector('#deleteBtn');
                $s.tap(deleteBtn, function () {
                    //正在进行拆批的情况下，不进行删除操作
                    //if (that.activePageFlip == 'inactive') {
                    that.deleterows();
                    //}
                });

                var submitBtn = this.wrapper.querySelector("#submitBtn");
                $s.tap(submitBtn, function () {
                    if (that.SubmitCallBack) {
                        that._submitData();
                    }
                });
                var touchend = touchable ? 'touchend' : 'mouseup';

                $s.bind(that.wrapper, touchend, function () {
                    if (that.BlurCallBack) {
                        that.BlurCallBack();
                    }
                });
            },

            _triggerClickHandler: function (c, t) {
                var that = this;
                $s.tap(t, function () {
                    var tbody = that.wrapper.querySelector('.list tbody');

                    if ($s.hasClass(c, 'container_open')) {
                        $s.removeClass(c, 'container_open');
                        $s.removeClass(t, 'trigger_active');
                        that.activePageFlip = 'inactive';
                        that.oldActivePageFlip = 'inactive';
                        
                        tbody.style.height = document.body.clientHeight - 155 + "px";
                    }
                    else {
                        $s.addClass(c, 'container_open');
                        $s.addClass(t, 'trigger_active');
                        that.oldActivePageFlip = that.activePageFlip;
                        that.activePageFlip = "active";
                        that.oldActivePageFlip = 'inactive';

                        if (typeof that.currRow == "undefined" || that.currRow == null) {
                            //获取列表中的第一行
                            var firstRow = that.wrapper.querySelector(".intro table tbody tr");
                            if (firstRow != null && typeof firstRow != "undefined") {
                                that.currRow = firstRow.getAttribute("id");
                            }
                        }
                        
                        //重新设置list中tbody的高度
                        tbody.style.height = (document.body.clientHeight - 155) / 2 - 36 + "px";
                        //只有当 currStock为null的情况下进行
                        //if (typeof that.currStock == 'object' && that.currStock == null) {
                        //将当前分录中的仓库和仓位填入到，仓库仓位栏位
                        var stockSCName = that.dataHash["list"].ShowData.TableData[that.currRow]["FSCStockID"];
                        var stockDCName = that.dataHash["list"].ShowData.TableData[that.currRow]["FDCStockID"];

                        var stockName = (stockSCName == null || typeof stockSCName == "undefined")
                                        ? ((stockDCName == null || typeof stockDCName == "undefined") ? "" : stockDCName)
                                        : stockSCName;


                        var stockPlaceName = that.dataHash["list"].ShowData.TableData[that.currRow].FDCSPID;

                        that.currStock = {
                            "stock": {
                                "stockid": stockName.DefaultValue.SaveValue,
                                "stockname": stockName.DefaultValue.DisplayValue,
                            },
                            "stockPlace": {
                                "spid": stockPlaceName.DefaultValue.SaveValue,
                                "spname": stockPlaceName.DefaultValue.DisplayValue
                            }
                        };

                        that.wrapper.querySelector(".intro_description > span > a").innerHTML = stockName.DefaultValue.DisplayValue;
                        that.wrapper.querySelector(".intro_description > span > a").setAttribute("stockid", stockName.DefaultValue.SaveValue);
                        that.wrapper.querySelector(".intro_description span:last-child a").innerHTML = stockPlaceName.DefaultValue.DisplayValue;
                        that.wrapper.querySelector(".intro_description span:last-child a").setAttribute("stockid", stockPlaceName.DefaultValue.SaveValue);
                        //}

                        //进行回调，进行拆批操作
                        if (typeof that.dataHash["batch"] == "undefined" && that.dataHash["batch"] == null) {
                            if (typeof that.currRow != "undefined" && that.currRow != null) {
                                that._popuprequest();
                            }

                        } else {
                            if (typeof that.dataHash["batch"][that.currRow] != "undefined" && that.dataHash["batch"][that.currRow] != null) {
                                //不进行数据的请求，直接将原有的batch数据进行添加展示, 另外在上方的扫描数量改变的时候需要将原有的batch数据进行清除，
                                //需要进行重新的拆批操作
                                var data = {};
                                data.Data = that.dataHash["batch"][that.currRow];
                                that.BindBatchData(data);
                            } else {
                                if (typeof that.currRow != "undefined" && that.currRow != null)
                                {
                                    that._popuprequest();
                                }
                            }
                        }
                    }
                });
            },

            //内容填充,进行回调进行scroller的刷新,options:{tabletype: 1:list,2:batch,3:stock,data:数据源}
            fillData: function (options, callback) {
                var that = this;
                //判断数据的类型，主要分为三种，单据数据，拆批数据，仓库数据
                //现在假定只有单据的数据，先动态生成详情数据
                if (options.type == 'batch') {
                    that.dataHash.batch[that.currRow] = options.data;
                } else {
                    that.dataHash[options.type] = options.data;
                }

                that._initAttribute(options.type);

                //判断表格是否存在了，不存在则新增表格
                //if (!that._exist(that.currTable)) {
                var structure = that._getHtml(options.type);
                var html = structure.table;
                var t = $s.html2dom(html);

                var component = "";
                if (options.type === "list") {
                    component = that.wrapper.querySelector(".intro .component div");
                    component.style.width = structure.width + "px";
                    component.innerHTML = "";

                    if (typeof t == "object" && t != null) {
                        component.appendChild(t);
                    }

                    that._introTableEvent();
                } else if (options.type === "batch") {
                    component = that.wrapper.querySelector(".items_wrap .component div");
                    component.style.width = structure.width + "px";
                    component.innerHTML = "";

                    if (typeof t == "object" && t != null) {
                        component.appendChild(t);
                        //that._distributeScanQty();
                        that._itemWrapTableEvent();
                    }                    
                } else {
                    component = that.wrapper.querySelector(".hide_wrap .component div");
                    //component.style.width = structure.width + "px";
                    component.innerHTML = "";

                    if (typeof t == "object" && t != null) {
                        component.appendChild(t);
                    }
                    that._stockItemTableEvent();
                }
                //}
            },

            //先生成字符串然后再一次性添加到DOM中,根据类型构建不同的表格
            _getHtml: function (type) {
                var that = this;
                var table = "";
                var thead = "";
                var tbody = "";
                var width = 0;
                var height = 0;
                var firstRow = null;
                if (typeof that.dataHash[type] == "object" && that.dataHash[type] != "undefined" && type == "list") {
                    var showValue = that.dataHash[type].ShowData.TableData;
                    table = "<table class='list fixed_headers'>";
                    thead = "<thead><tr><th width='40'><input type='checkbox' /></th>";
                    width = 22;
                    //TODO: 高度应该根据界面的元素outerWidth 进行加减后得到
                    height = document.body.clientHeight - 155;
                    tbody = "<tbody style='height: "+ height +"px'>";  
                    var count = 0;
                    for (var id in showValue) {
                        if (count >= 1) {
                            break;
                        }
                        for (var i in showValue[id]) {
                            if (showValue[id][i].Visible) {
                                thead += "<th width=" + showValue[id][i].Width + ">" + showValue[id][i].Name + "</th>";
                                width += showValue[id][i].Width + 22;
                            }
                        }
                        count = count + 1;
                    }

                    for (var i in showValue) {
                        var tr = "<tr id=" + showValue[i]["FDataKey"]["DefaultValue"]["SaveValue"]  + " ><th width='40'><input data-cid = " + showValue[i]["FDataKey"]["DefaultValue"]["SaveValue"] + " type='checkbox' />";
                        for (var id in showValue[i]) {
                            if (showValue[i][id].Visible) {
                                tr += "<td noWrap='noWrap' data-key = " + showValue[i][id].Key + " data-colname = " + showValue[i][id].Name + " data-editable=" + showValue[i][id].Editable + " width=" + showValue[i][id].Width + ">" + showValue[i][id].DefaultValue.DisplayValue + "</td>";
                            }
                        }

                        tr += "</tr>";
                        tbody += tr;
                    }

                    tbody += "</tbody>";

                } else if (typeof that.dataHash[type] == "object" && that.dataHash[type] != "undefine" && type == "batch") {
                    table = "<table class='batch fixed_headers'>";
                    thead = "<thead>";
                    height = (document.body.clientHeight - 80) * 0.5 - 28
                    tbody = "<tbody style='height: " + height + "px'>";
           
                    var batchData = that.dataHash[type][that.currRow];
                    if (batchData != null) {
                        if (batchData.length > 0) {
                            firstRow = batchData[0];

                            for (var id in firstRow) {
                                if(firstRow[id].Visible){
                                    thead += "<th width=" + firstRow[id].Width + ">" + firstRow[id].Name + "</th>";
                                    width += firstRow[id].Width + 22;
                                }
                            }
                            thead += "</tr></thead>";

                            for (var i = 0; i < batchData.length; i++) {
                                // var tr = "<tr rowid = " + i + ">";
                                var tr = "<tr rowid = "+ batchData[i]["FDataKey"]["DefaultValue"]["SaveValue"] +">";

                                for (var id in batchData[i]) {
                                    if(batchData[i][id].Visible){
                                        tr += "<td noWrap='noWrap' data-key = " + batchData[i][id].Key + " data-colname = " + batchData[i][id].Name + " data-editable=" + batchData[i][id].Editable + " width=" + batchData[i][id].Width + ">" + batchData[i][id].DefaultValue.DisplayValue + "</td>";
                                    }
                                }

                                tr += "</tr>";

                                tbody += tr;
                            }


                            tbody += "</tbody>";
                        }
                    }
                } else if (typeof that.dataHash[type] == "object" && that.dataHash[type] != "undefine" && type == "stock") {
                    table = "<table class='stock fixed_headers'>";
                    height = document.body.clientHeight - 84;
                    tbody = "<tbody style='height: " + height + "px'>";

                    width = document.body.clientWidth;
                    thW = width / 2 - 5
                    thead = "<thead><th style='width: " + thW + "px'>仓库编号</th><th style='width: " + thW + "px'>仓库名称</th></thead>";

                    var stockData = that.dataHash[type];
                    var tr = "<tr rowid = '-1'><td>无</td><td>无</td></tr>";
                    for (var id in stockData) {
                        tr += "<tr stockid = " + stockData[id].FItemID + "><td noWrap='noWrap' style='width: " + thW + "px' >" + stockData[id].FNumber + "</td><td noWrap='noWrap' style='width: " + thW + "px'>" + stockData[id].FName + "</td></tr>";
                    }

                    tbody += tr + "</tbody>"

                } 

                table += thead + tbody + "</table>"

                return {"width": width,"table": table};
            },

            //TODO: 填充完数据之后，进行表格初始化，包括滚动，表格头和表格第一列的固定
            _initTable: function () {
    
            },

            //单据列表事件
            _introTableEvent: function () {
                var that = this;
                var table = that.wrapper.querySelector(".list");
                var selectAll = table.querySelector("thead tr input[type=checkbox]");

                $s.bind(selectAll,"click", function () {
                    if (!selectAll.checked) {
                        var entryCheckboxs = table.querySelectorAll("tbody tr input[type=checkbox]");

                        for (var i = 0; i < entryCheckboxs.length; i++) {
                            entryCheckboxs[i].checked = false;
                        }
                    } else {
                        var entryCheckboxs = table.querySelectorAll("tbody tr input[type=checkbox]");

                        for (var i = 0; i < entryCheckboxs.length; i++) {
                            entryCheckboxs[i].checked = true;
                        }
                    }
                });

                var rows = table.querySelectorAll("tbody tr");
                for (var i = 0; i < rows.length; i++) {                    
                    $s.tap(rows[i], function (e) {
                        var nodes = that.wrapper.querySelector('.list').querySelectorAll("tbody tr");
                        
                        if (nodes.length > 0);
                        {
                            for (var i = 0; i < nodes.length; i++) {
                                if($s.hasClass(nodes[i],"selected")){
                                    $s.removeClass(nodes[i], "selected");
                                }
                            }
                        }

                        if (e.target.nodeName == 'INPUT') {
                            e.target.parentNode.parentNode.setAttribute("class", 'selected');
                            that.currRow = e.target.parentNode.parentNode.getAttribute("id");
                        } else {
                            e.target.parentNode.setAttribute("class", 'selected');
                            that.currRow = e.target.parentNode.getAttribute("id");
                        }
                        
                        if (e.target.nodeName == 'TD' && e.target.dataset.editable == "true") {
                            if (e.target.dataset.key == 'FSCStockID' ||
                                e.target.dataset.key == 'FDCStockID' ||
                                e.target.dataset.key == 'FDCSPID') {

                                var container = that.wrapper.querySelector('.container');
                                var trigger_popup = container.querySelector('button.trigger_popup');

                                //为基础资料时应该弹出窗体进行修改
                                if ($s.hasClass(container, 'container_popup')) {
                                    $s.removeClass(container, 'container_popup');
                                    $s.removeClass(trigger_popup, 'trigger_active');
                                    that.activePageFlip = that.oldActivePageFlip;
                                } else {
                                    if (!$s.hasClass(container, 'container_popup')) {
                                        $s.addClass(container, 'container_popup');
                                        $s.addClass(trigger_popup, 'trigger_active');
                                        that.oldActivePageFlip = that.activePageFlip;
                                        that.activePageFlip = "popup";
                                    }
                                }
                            } else {
                                if (that.activePageFlip == "inactive") {
                                    var el = e;

                                    //检查选中的行进行删除，另外更新dataHash中的数据    
                                    var rows = that.wrapper.querySelectorAll(".intro table tbody tr input[type=checkbox]");

                                    for (var i = 0; i < rows.length; i++) {
                                        if (rows[i].checked) {
                                            that.selectedRows.push(rows[i].dataset.cid);
                                        }
                                    }

                                    if (!that.editConfirm) {
                                        that.editConfirm = new cConfirm({
                                            ok: function (o, e) {
                                                if (typeof that.ChangeCallBack == 'function' && that.ChangeCallBack != null) {
                                                    // 点击确认后，需要比较两次数据是否一致，一致的情况下，不进行回调构建修改数据包
                                                    //得到数据后回填,
                                                    //结束后需要进行回调，将焦点重新设置到列表界面中的input中,将当前修改的字段和值,
                                                    //TODO: 除了基础资料的数据的字段saveValue有所不同
                                                    var modifyFields = [{
                                                        "FieldKey": el.target.dataset.key,
                                                        "DisplayValue": $s('#data_input').value,
                                                        "SaveValue": $s('#data_input').value
                                                    }];

                                                    //如果是修改扫描数量则应该进行判断，需要将前一个拆批的信息进行清除
                                                    if (el.target.dataset.key == 'FScanQty') {

                                                        if(that.selectedRows.length > 0){
                                                            for(var i = 0; i < that.selectedRows.length; i++) {
                                                                delete that.dataHash["batch"][that.selectedRows[i]];
                                                                delete that.dataHash["list"]["SplitBatchData"][that.selectedRows[i]];
                                                            }
                                                        }else{
                                                            delete that.dataHash["batch"][that.currRow];
                                                            delete that.dataHash["list"]["SplitBatchData"][that.currRow];
                                                        }
                                                    }

                                                    var data = that._generateModifyPackage(that.selectedRows, modifyFields);
                                                    that.selectedRows = [];

                                                    that.ChangeCallBack(data);
                                                }
                                            },
                                            cancel: function () {
                                                that.selectedRows = [];
                                            }
                                        });
                                    }

                                    that.editConfirm.setTitle(el.target.dataset.colname);
                                    that.editConfirm
                                        .setContent("<input id='data_input' style='width: 100%; background: transparent; border:none; border-bottom: 1px solid #87cefa; outline:none;' type='text' value = " + el.target.innerText + ">");
                                    that.editConfirm.show();
                                }
                            }
                        }

                        //将当前分录中的仓库和仓位填入到，仓库仓位栏位
                        var stockSCName = that.dataHash["list"].ShowData.TableData[that.currRow]["FSCStockID"];
                        var stockDCName = that.dataHash["list"].ShowData.TableData[that.currRow]["FDCStockID"];
                        
                        var stockName = (stockSCName == null || typeof stockSCName == "undefined")
                                        ? ((stockDCName == null || typeof stockDCName == "undefined") ? "" : stockDCName)
                                        : stockSCName;


                        var stockPlaceName = that.dataHash["list"].ShowData.TableData[that.currRow].FDCSPID;

                        that.currStock = {
                            "stock": {
                                "stockid": stockName.DefaultValue.SaveValue,
                                "stockname": stockName.DefaultValue.DisplayValue,
                            },
                            "stockPlace": {
                                "spid": stockPlaceName.DefaultValue.SaveValue,
                                "spname": stockPlaceName.DefaultValue.DisplayValue
                            }
                        };

                        that.wrapper.querySelector(".intro_description > span > a").innerHTML = stockName.DefaultValue.DisplayValue;
                        that.wrapper.querySelector(".intro_description > span > a").setAttribute("stockid", stockName.DefaultValue.SaveValue);
                        that.wrapper.querySelector(".intro_description span:last-child a").innerHTML = stockPlaceName.DefaultValue.DisplayValue;
                        that.wrapper.querySelector(".intro_description span:last-child a").setAttribute("stockid", stockPlaceName.DefaultValue.SaveValue);

                        //当界面处于展开的情况下，进行列表的填充, 只有在展开的情况下才能批号信息的修改
                        if (that.activePageFlip == "active") {                            
                            if (typeof that.dataHash["batch"] == "undefined" && that.dataHash["batch"] == null) {
                                if (typeof that.currRow != "undefined" && that.currRow != null) {
                                    that._popuprequest();
                                }
                            } else {
                                if (typeof that.dataHash["batch"][that.currRow] != "undefined" && that.dataHash["batch"][that.currRow] != null) {
                                    //不进行数据的请求，直接将原有的batch数据进行添加展示, 另外在上方的扫描数量改变的时候需要将原有的batch数据进行清除，
                                    //需要进行重新的拆批操作
                                    var data = {};
                                    data.Data = that.dataHash["batch"][that.currRow];
                                    that.BindBatchData(data);
                                } else {
                                    if (typeof that.currRow != "undefined" && that.currRow != null) {
                                        that._popuprequest();
                                    }
                                }
                            }
                        } else {

                        }
                    });
                }
            },

            //拆批列表事件
            _itemWrapTableEvent:function(){
                var that = this;

                var table = that.wrapper.querySelector('.batch');
                var rows = table.querySelectorAll('tbody tr');

                for (var i = 0; i < rows.length; i++) {
                    //tap事件在table的row中执行时中只会对当前点击目标起作用即e.target
                    $s.bind(rows[i], 'click', function (e) {     
                        that._batchRowEvents(e.target);
                    });
                }
            },

            //批次的行修改
            _batchRowEvents: function(el){
                var that = this;                 
                var rowid = el.parentNode.getAttribute('rowid');
                //可编辑则应该进行弹窗处理,只支持单据的扫描数量的修改操作
                if (el.dataset.editable == "true" && that.activePageFlip == "active") {
                    if (!that.batchEditConfirm) {
                        that.batchEditConfirm = new cConfirm({
                            ok: function (o, e) {
                                //现在的方案中是在后台服务器放着一个session，当前端有所修改的时候，需要进行后台的数据的更新，同时反馈到前端来
                                //进行前端的批次信息的更新，需要进行更新上下两表格的数据
                                if (typeof that.BatchChangeCallBack == 'function' && that.BatchChangeCallBack != null) {
                                    var modifyFields = [{
                                            "FieldKey": "FScanQty",
                                            "DisplayValue": $s('#batch_data_input').value,
                                            "SaveValue": $s('#batch_data_input').value
                                        }];

                                        var data = {"ModifyKeys":[o.rowid],"ModifyFields": modifyFields};

                                        that.BatchChangeCallBack(data);
                                }

                            },
                            cancel: function () {
                            }
                        });
                    }           
                    
                    that.batchEditConfirm.rowid = rowid;
                    that.batchEditConfirm.el = el;
        
                    that.batchEditConfirm.setTitle(el.dataset.colname);
                    that.batchEditConfirm
                        .setContent("<input id='batch_data_input' style='width: 100%; background: transparent; border:none; border-bottom: 1px solid #87cefa; outline:none;' type='text' value = " + el.innerText + ">");

                    that.batchEditConfirm.show();
                }

            },

            //仓库仓位列表事件
            _stockItemTableEvent: function () {
                var that = this;

                var table = that.wrapper.querySelector(".stock");
                var rows = table.querySelectorAll("tbody tr");

                for (var i = 0; i < rows.length; i++) {
                    $s.tap(rows[i], function (e) {
                        if (e.target.parentNode.getAttribute('rowid') == -1) {
                            var container = that.wrapper.querySelector('.container');
                            if ($s.hasClass(container, 'container_popup')) {
                                $s.removeClass(container, 'container_popup');
                                that.activePageFlip = that.oldActivePageFlip;
                                that.oldActivePageFlip = 'inactive';
                            }

                            that.currStock['stock'] = {
                                'stockid': '',
                                'stockname': lang.getText("stock")
                            };

                            that.currStock['stockPlace'] = {
                                'spid': '',
                                'spname': lang.getText("stockplace")
                            };

                            that.wrapper.querySelector(".intro_description > span > a").innerHTML = that.currStock['stock']['stockname'];
                            that.wrapper.querySelector(".intro_description > span > a").setAttribute("stockid", that.currStock['stock']['stockid']);
                            that.wrapper.querySelector(".intro_description span:last-child a").innerHTML = that.currStock['stockPlace']['spname'];
                            that.wrapper.querySelector(".intro_description span:last-child a").setAttribute("stockid", that.currStock['stockPlace']['spid']);
                        } else {
                            that.currStock['stock'] = {
                                'stockid': e.target.parentNode.getAttribute('stockid'),
                                'stockname': that.dataHash['stock'][e.target.parentNode.getAttribute('stockid')]['FName']
                            };

                            that.currStock['stockPlace'] = {
                                'spid': '',
                                'spname': lang.getText("stockplace")
                            };
                            that._openPopupChild();
                            that._bindStockPlace(e.target.parentNode);
                        }
                    });
                }
            },

            //展开仓位的页面
            _openPopupChild: function(){
                var that = this;

                var container = that.wrapper.querySelector('.container');
                if (!$s.hasClass(container, 'container_popup_child')) {
                    $s.addClass(container, 'container_popup_child');
                }
            },

            //绑定仓位列表
            _bindStockPlace: function (element) {
                var that = this;
                var stockid = element.getAttribute('stockid');
                var stockPlaceData = that.dataHash["stock"][stockid]["StockPlaceData"];
                //if (typeof stockPlaceData == "object" && stockPlaceData.constructor == Array) {
                width = document.body.clientWidth;
                thW = width / 2 - 5
                var table = "<table class='stock_place fixed_headers'><thead><tr><th style='width: " + thW + "px'>" + lang.getText("stockplace_num") + "</th><th style='width: " + thW + "px'>" + lang.getText("stockplace_name") + "</th></tr></thead><tbody><tr rowid = '-1'><td style='width: " + thW + "px'>" + lang.getText("nothing") + "</td><td style='width: " + thW + "px'>" + lang.getText("nothing") + "</td></tr>";
                var tr = '';
                if (stockPlaceData.length > 0) {
                    for (var i = 0; i < stockPlaceData.length; i++) {
                        tr += "<tr rowid = " + i + " spid = " + stockPlaceData[i]["FSPID"] + " spname = " + stockPlaceData[i]["FSPName"] + "><td style='width: " + thW + "px'>" + stockPlaceData[i]["FSPNumber"] + "</td><td style='width: " + thW + "px'>" + stockPlaceData[i]["FSPName"] + " </td></tr>";
                    }
                }

                table += tr + "</tbody></table>";
                var element = $s.html2dom(table);

                that.wrapper.querySelector('.hide_wrap_child .component div').innerHTML = '';
                that.wrapper.querySelector('.hide_wrap_child .component div').appendChild(element);

                that._bindStockPlaceEvent();
            },

            //绑定仓位列表事件
            _bindStockPlaceEvent: function(){
                var that = this;
                var tbody = that.wrapper.querySelector('.hide_wrap_child .component div table tbody');
                //第一行的点击事件，将仓位信息的列表进行隐藏
                $s.tap(tbody, function (e) {
                    if (e.target.parentNode.getAttribute('rowid') == -1) {
                        that.currStock['stockPlace'] = {
                            'spid': '',
                            'spname': '',
                        };
                    } else {
                        //将数据写到列表中并触发事件进行数据的批次信息的获取
                        that.currStock['stockPlace'] = {
                            'spid': e.target.parentNode.getAttribute('spid'),
                            'spname': e.target.parentNode.getAttribute('spname'),
                        };
                    }

                    var container = that.wrapper.querySelector('.container');
                    if ($s.hasClass(container, 'container_popup_child')) {
                        $s.removeClass(container, 'container_popup_child');

                            that.activePageFlip = that.oldActivePageFlip;
                            that.oldActivePageFlip = 'inactive';
                    }

                    if ($s.hasClass(container, 'container_popup')) {
                        $s.removeClass(container, 'container_popup');
                    }

                    that.wrapper.querySelector(".intro_description > span > a").innerHTML = that.currStock['stock']['stockname'];
                    that.wrapper.querySelector(".intro_description > span > a").setAttribute("stockid", that.currStock['stock']['stockid']);
                    that.wrapper.querySelector(".intro_description span:last-child a").innerHTML = that.currStock['stockPlace']['spname'];
                    that.wrapper.querySelector(".intro_description span:last-child a").setAttribute("stockid", that.currStock['stockPlace']['spid']);

                    //TODO: 提交到后台完成数据更改
                    if(that.activePageFlip == 'inactive'){
                        if (typeof that.ChangeCallBack == 'function' && that.ChangeCallBack != null) {
                            var modifyFields = [{
                                                "FieldKey": "FSCStockID",
                                                "DisplayValue": that.currStock["stock"]["stockname"],
                                                "SaveValue": that.currStock["stock"]["stockid"]
                                            },
                                            {
                                                "FieldKey": "FDCSPID",
                                                "DisplayValue": that.currStock["stockPlace"]["spname"],
                                                "SaveValue": that.currStock["stockPlace"]["spid"]
                                            }
                                        ];

                            //检查选中的行进行删除，另外更新dataHash中的数据    
                            var rows = that.wrapper.querySelectorAll(".intro table tbody tr input[type=checkbox]");

                            for (var i = 0; i < rows.length; i++) {
                                if (rows[i].checked) {
                                    that.selectedRows.push(rows[i].dataset.cid);
                                }
                            }

                            if(that.selectedRows.length > 0){
                                for(var i = 0; i < that.selectedRows.length; i++) {
                                    delete that.dataHash["batch"][that.selectedRows[i]];
                                    delete that.dataHash["list"]["SplitBatchData"][that.selectedRows[i]];
                                }
                            }else{
                                delete that.dataHash["batch"][that.currRow];
                                delete that.dataHash["list"]["SplitBatchData"][that.currRow];
                            }

                            var data = that._generateModifyPackage(that.selectedRows, modifyFields);
                            that.selectedRows = [];
                            that.ChangeCallBack(data);
                        }
                    }

                    if (that.activePageFlip == 'active') {
                        that._popuprequest();
                    }
                });
            },

            //进行删除等操作后，需要进行当前行的检查,将当前的行进行清空，并设置列表中的第一行为当前行
            _resetCurrRow: function () {
                var that = this;

                var table = that.wrapper.querySelector('.intro table');
                var rows = table.querySelectorAll('tbody tr');

                that.currRow = null;
                
                if (that.selectedRows.length > 0) {
                    that.currRow = that.selectedRows[0];
                }
            },

            //用于在仓库仓位选择后进行回调
            _popuprequest: function () {
                var that = this;

                if (that.BindBatchCallBack && typeof that.BindBatchCallBack == 'function'
                               && typeof that.currRow != "undefined" && that.currRow != null) {
                    var data = {
                        "data":{
                            FItemID: that.dataHash["list"]["ShowData"]["TableData"][that.currRow].FItemID.DefaultValue.SaveValue,
                            FSCStockID: that.currStock["stock"]["stockid"],
                            FDCSPID: that.currStock["stockPlace"]["spid"]
                        },
                        "key": that.currRow
                    }

                    that.BindBatchCallBack(data);
                }
            },

            //scroll进行刷新
            _refresh: function () {
                var that = this;

                $s.each(that.scrollers, function (t, n) {
                    t.refresh();
                    that._bindEvent();
                });

            },

            //用于动态数据事件的绑定，分有行绑定和单元格绑定，单元格只对可编辑的单元格进行绑定,在对表格进行修改后同样需要进行重新的绑定
            _bindEvent: function () {

            },

            //构建修改的数据包
            _generateModifyPackage: function(editrows,modifyFields){
                var that = this;
                //用于存放修改的数据
                var data = {
                    ModifyKeys:[]
                };
                //得到当前行的数据,以及修改的数据,
                //可以允许多条分录进行修改，故先要进行轮询selectRows,若selectRows为0,则只对当前行进行修改
                if (editrows.length > 0) {
                    for (var i = 0; i < editrows.length; i++) {
                        data.ModifyKeys.push(editrows[i]);
                    }
                } else {
                    data.ModifyKeys.push(that.currRow);
                }

                data.ModifyFields = modifyFields;
                
                return data;
            },

            //修改完成后，提交数据，成功后进行回调，
            //可以返回到前一个页面或者是清除内存中的数据，更新DOM的结构
            _submitData: function () {
                var that = this;
                var subData = that._getSubmitPackage();
                var entryData = [];

                for (var i in subData["list"].EntryData) {
                    entryData.push(subData["list"].EntryData[i]);
                }

                var Data = {
                    "HeadData": subData["list"].HeadData,
                    "EntryData": entryData,
                    "SplitBatchData": subData["list"].SplitBatchData
                };

                that.SubmitCallBack(Data);
            },

            /*获取需要进行提交的数据包，
             * 1. 分录中的扫描数据没有的情况下，直接进行剔除不让进行提交
             * 2. 分录中有扫描数据的情况下，需要进行拆批的数据检查，将没有扫描数据的拆批信息进行剔除
             * 3. 有可能情况是，有扫描数据但没有进行拆批的情况下，需要进行拆批信息的构建
             * 应该将数据保存一份然后通过传参的当时进行回传
             * 故提交失败之后应该返回到列表界面，防止数据出错
             */
            _getSubmitPackage: function(){
                var that = this;
                //先进行克隆不然引用对象将会被修改
                var tmpDataHash = $s.clone(that.dataHash);
                var data = tmpDataHash["list"];
                var tableData = data["ShowData"]["TableData"];
                tmpDataHash["list"]["SplitBatchData"] = tmpDataHash["batch"];

                for (var i in tableData) {
                    var scanQty = tableData[i]["FScanQty"]["DefaultValue"]["DisplayValue"];
                    //扫描数量不为零，则检查其拆批信息
                    if (scanQty != 0) {
                        var splitBatchData = tmpDataHash["list"]["SplitBatchData"][i];

                        if (splitBatchData != null && splitBatchData.length > 0) {
                            //检查并剔除没有扫描数量的拆批分录
                            var arr = [];
                            for (var j = 0; j < splitBatchData.length; j++) {
                                if (parseInt(splitBatchData[j]["FScanQty"]["DefaultValue"]["DisplayValue"]) != 0) {
                                    //tmpDataHash["list"]["SplitBatchData"][i].pop(j);
                                    arr.push(splitBatchData[j]);
                                }
                            }

                            tmpDataHash["list"]["SplitBatchData"][i] = arr;
                        } else {
                            //构建当前分录的拆批包,只有一条分录
                            var arr = []
                            var batchData = {};
                            batchData["FScanQty"] = tableData[i]["FScanQty"];
                            batchData["FBatchNo"] = tableData[i]["FScanQty"];
                            batchData["FStockQtyOnlyForShow"] = tableData[i]["Fauxqty"];
                            batchData["FSCStockID"] = tableData[i]["FSCStockID"];
                            batchData["FDCSPID"] = tableData[i]["FDCSPID"];
                            arr.push(batchData);
                            tmpDataHash["list"]["SplitBatchData"][i] = arr;
                            
                        }
                    } else {
                        //为零则进行节点的删除操作，包括拆批信息，以及entrydata的节点的删除
                        delete tmpDataHash["list"]["SplitBatchData"][i];
                        delete tmpDataHash["list"]["EntryData"][i];
                    }
                }

                return tmpDataHash;
            },

            //删除对应行, 从当前选中的行中进行删除
            _deleterows: function (callback) {
                var that = this;

                //检查选中的行进行删除，另外更新dataHash中的数据    
                var rows = that.wrapper.querySelectorAll(".intro table tbody tr input[type=checkbox]");

                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].checked) {
                        that.selectedRows.push(rows[i].dataset.cid);
                    }
                }

                if (!that.deleteConfirm) {                    
                    if (that.selectedRows.length > 0) {
                        that.deleteConfirm = new cConfirm({
                            ok: function (o, e) {
                                //从DOM中进行数据的移除,并更新dataHash
                                for (var i = 0; i < that.selectedRows.length; i++) {       
                                    that.wrapper.querySelector(".intro table tbody")
                                    .removeChild($s("tr[id='" +that.selectedRows[i] +"']"));
                                    
                                    //移除对应的行，以及显示的数据，同时应该删除改行的拆批信息
                                    delete that.dataHash["list"].EntryData[that.selectedRows[i]];
                                    delete that.dataHash["list"].ShowData.TableData[that.selectedRows[i]];
                                    delete that.dataHash["list"]["SplitBatchData"][that.selectedRows[i]];
                                    //删除拆批信息
                                    delete that.dataHash["batch"][that.selectedRows[i]];
                                }
               
                                that.selectedRows = [];
                                //处理 theCurrRow
                                that._resetCurrRow();
                                //结束后需要进行回调，将焦点重新设置到列表界面中的input中
                                if (typeof that.BlurCallBack == 'function' && that.BlurCallBack) {
                                    that.BlurCallBack();
                                }
                            },
                            cancel: function () {
                                //history.back();
                                // that.deleteConfirm.hide();
                                that.selectedRows = [];

                                //结束后需要进行回调，将焦点重新设置到列表界面中的input中
                                if (typeof that.BlurCallBack == 'function' && that.BlurCallBack) {
                                    that.BlurCallBack();
                                }
                            }
                        });
                    } else {
                        that.deleteConfirm = new cConfirm({
                            ok: function (o, e) {
                                that.selectedRows = [];
                            },
                            cancel: function () {
                                //history.back();
                                // that.deleteConfirm.hide();
                                that.selectedRows = [];
                            }
                        });                       
                    }
                }

                if (that.selectedRows.length > 0) {
                    that.deleteConfirm.setTitle(lang.getText("title"));
                    that.deleteConfirm.setContent(lang.getText("sure_to_delete").format(that.selectedRows.length));
                    //that.deleteConfirm.setContent('您确定删除这 ' + that.selectedRows.length + ' 条分录吗？');
                } else {
                    that.deleteConfirm.setTitle(lang.getText("title"));
                    that.deleteConfirm.setContent(lang.getText("select_entry"));
                }

                that.deleteConfirm.show();
            },

            deleterows: function (callback) {
                var that = this;
                that._deleterows(callback);
            },

            //更新数据，更新显示表格,需要更新showData中的对应行
            //如果当前单据时通过扫描所得，则在该条物料不在列表中的情况下，进行新增的操作，追加到最后
            _update: function (data,isScan) {
                var that = this;
                //得到更新的数据包
                var newData = data.Data[0];
                var entryData = newData["EntryData"];
                var headData = newData["HeadData"];
                var showData = newData["ShowData"];

                var tableData = showData["TableData"];
                //在修改拆批信息的情况下，这个数据为修改后的拆批信息
                var detailData = showData["DetailData"];
                var spliteData = detailData;
                
                for (var i = 0; i < entryData.length; i++) {
                    var key = entryData[i].FSourceInterId + "_" + entryData[i].FSourceEntryID + "_" + entryData[i].FEntryID;

                    if (entryData[i].FSourceInterId == 0) {
                        key = entryData[i].FInterID + "_" + entryData[i].FEntryID + "_" + entryData[i].FEntryID;
                    }

                    that.dataHash["list"]["EntryData"][key] = entryData[i];
                }

                for (var i = 0; i < tableData.length; i++) {

                    var key = tableData[i]["FDataKey"]["DefaultValue"]["SaveValue"];
                    that.dataHash["list"]["ShowData"]["TableData"][key] = tableData[i];

                    //不存在的情况下，新增行
                    if (that._exist(key) == false && that.isScanBill) {
                        var tr = "<tr id=" + +"><th><input type='checkbox' /></th>";
                        for (var id in tableData[i]) {
                            tr += "<td noWrap='noWrap' data-colname = " + tableData[i][id].Name + " data-editable=" + tableData[i][id].Editable + " width=" + tableData[i][id].Width + ">" + tableData[i][id].DefaultValue.DisplayValue + "</td>";
                        }
                        tr += "</tr>";

                        var el = $s.html2dom(tr);

                        that.wrapper.querySelector('table.list tbody').appendChild(el);
                    } else {
                        //触发行的数据的更新,只更新当前行
                        var row = that.wrapper.querySelector('tr[id="' + key + '"]');
                        var grids = row.querySelectorAll("td");

                        for (var j = 0; j < grids.length; j++) {
                            var dataKey = grids[j].dataset.key;
                            //更新table中的数据
                            grids[j].innerText = tableData[i][dataKey]["DefaultValue"]["DisplayValue"];
                        }
                    }
                }

                //更新数据，页面以及内存中的数据
                if (spliteData != null && spliteData !== "undefined") {
                    for (var i = 0; i < spliteData.length; i++) {
                        if (spliteData[i] != null) {
                            var key = spliteData[i]["FDataKey"]["DefaultValue"]["DisplayValue"];

                            //更新 dataHash 中的数据
                            var tmpBatch = that.dataHash["batch"];
                            for (var id in tmpBatch) {
                                for (var count = 0; count < tmpBatch[id].length; count++) {
                                    if (key == tmpBatch[id][count]["FDataKey"]["DefaultValue"]["DisplayValue"]) {
                                        tmpBatch[id][count] = spliteData[i];
                                    }
                                }
                            }

                            var row = that.wrapper.querySelector('tr[rowid="' + key + '"]');
                            var grids = row.querySelectorAll("td");

                            for (var j = 0; j < grids.length; j++) {
                                var dataKey = grids[j].dataset.key;
                                grids[j].innerText = spliteData[i][dataKey]["DefaultValue"]["DisplayValue"];
                            }
                        }
                    }
                }

                //更新批次的

                //只对扫描数量修改时有效
                // if (smChangeArr.length > 0) {
                //     var modifyFields = [];
                //     for (var i = 0; i < smChangeArr.length; i++) {
                //         var key = smChangeArr[i];
                //         modifyFields.push({
                //             "DataIndex": key,
                //             "FieldKey": "FScanQty",
                //             "DisplayValue": smChangeData[key],
                //             "SaveValue": smChangeData[key]
                //         });
                //     }

                //     if (that.SMDDChangeCallBack) {
                //         var changePackage = that._generateModifyPackage(smChangeArr, modifyFields);
                //         that.SMDDChangeCallBack(changePackage);
                //     }
                // }
            },

            //数据变更后，进行更新,包括dataHash["list"] dataHash["batch"]
            _updateDataHash: function () {
                var that = this;
                var data = that.dataHash["list"];
            },

            //判断分录是否存在
            _exist: function (key) {
                var that = this;

                if (that.dataHash["list"]["ShowData"]["TableData"][key] != "undefined"){
                    return true;
                } else {
                    return false;
                }
            },

            //销毁数据
            destroy: function () {
                var that = this;
                //清除scrollers
                if(that.editConfirm)
                    that.editConfirm.destroy();
                if(that.batchEditConfirm)
                    that.batchEditConfirm.destroy();
                if(that.deleteConfirm)
                    that.deleteConfirm.destroy();
            },

            //对外的接口
            BindCKCWData: function (data) {
                var that = this;
                that.fillData({type: "stock",data: data});
            },

            //绑定单据接口
            BindData: function (data, isScan) {
                var that = this;
                that.isScanBill = isScan;
                that.fillData({ type: "list", data: data.Data[0] });
            },

            //绑定拆批数据
            BindBatchData: function (data) {
                var that = this;
                that.fillData({ type: "batch", data: data.Data });
            },

            //进行回调,然后在外面进行ajax请求获取拆批的数据
            BindBatchCallBack: function (callback) {
                this.BindBatchCallBack = callback;
            },

            //提交数量
            SubmitCallBack: function (callback) {
                this.SubmitCallBack = callback;
            },

            //修改数据之后，进行回传进行ajax请求，请求结束后需要继续进行数据的更新
            ChangeCallBack: function (callback) {
                this.ChangeCallBack = callback;
            },

            //获得焦点回调
            FocusCallBack: function (callback) {
                this.FocusCallBack = callback
            },

            //失去焦点回调
            BlurCallBack: function (callback) {
                this.BlurCallBack = callback;
            },

            //更新数据，包括拆单的数据
            UpDate: function (data) {
                var that = this;
                that._update(data);
            },

            //扫描功能设置
            //扫描订单，存在单据是扫描生成时，不存在新增，存在则数量进行累加
            SetDD: function (data) {
                var that = this;
                try{
                    that._update(data,true);
                } catch (ex) {
                    alert(ex.message);
                }
            },

            //扫描物料,包括自定义二维码,扫描后若有扫描数量则进行累加，同时需要进行拆批中的扫描数量换算，重新填写
            SetWL: function (data) {
                var that = this;                
                var tableData = data.Data[0]["ShowData"]["TableData"];
                
                for (var i = 0; i < tableData.length; i++) {
                    var key = tableData[i]["FDataKey"]["DefaultValue"]["SaveValue"];
                    delete that.dataHash["batch"][key]
                }

                that._update(data)
            },

            //扫描仓库仓位,每次只会扫描一个组合,必须为选中状态下的分录进行仓库仓位的修改
            SetCKCW: function (data) {
                var that = this;

                //hongbo_liang 调用 update 方法进行数据的更新
                that._update(data);

                //需要将原有对应行的拆批信息进行清除, 需要进行重新的拆批操作              
                var tableData = data.Data[0]["ShowData"]["TableData"];
                
                var count;
                for (var i = 0; i < tableData.length; i++) {
                    var key = tableData[i]["FDataKey"]["DefaultValue"]["SaveValue"];

                    if (key == that.currRow) {
                        count = i;
                    }
                    delete that.dataHash["batch"][key]
                }

                var changeData = null;
                //展开状态下，则直接将数据写入到过滤按钮中，然后调用查询拆批信息的接口
                if (that.activePageFlip == 'active' && count != null) {

                    that.currStock = {
                        "stock": {
                            "stockid": tableData[count]["FSCStockID"]["DefaultValue"]["SaveValue"],
                            "stockname": tableData[count]["FSCStockID"]["DefaultValue"]["DisplayValue"],
                        },
                        "stockPlace": {
                            "spid": tableData[count]["FDCSPID"]["DefaultValue"]["SaveValue"],
                            "spname": tableData[count]["FDCSPID"]["DefaultValue"]["DisplayValue"]
                        }
                    };

                    that.wrapper.querySelector(".intro_description > span > a").innerHTML = tableData[count]["FSCStockID"]["DefaultValue"]["DisplayValue"];
                    that.wrapper.querySelector(".intro_description > span > a").setAttribute("stockid", tableData[count]["FSCStockID"]["DefaultValue"]["SaveValue"]);
                    that.wrapper.querySelector(".intro_description span:last-child a").innerHTML = tableData[count]["FDCSPID"]["DefaultValue"]["DisplayValue"];
                    that.wrapper.querySelector(".intro_description span:last-child a").setAttribute("stockid", tableData[count]["FDCSPID"]["DefaultValue"]["SaveValue"]);

                    if (typeof that.dataHash["batch"][that.currRow] == "undefined" || that.dataHash["batch"][that.currRow] == null) {
                        if (typeof that.currRow != "undefined" && that.currRow != null) {
                            that._popuprequest();
                        }

                    }
                }

                //非展开状态下，则将拆批的信息进行移除，并更新当前分录或所选择的分录进行仓库仓位的更新
                if (that.activePageFlip == 'inactive') {
                    that.wrapper.querySelector(".intro_description > span > a").innerHTML = "仓库";
                    that.wrapper.querySelector(".intro_description > span > a").setAttribute("stockid", "");
                    that.wrapper.querySelector(".intro_description span:last-child a").innerHTML = "仓位";
                    that.wrapper.querySelector(".intro_description span:last-child a").setAttribute("stockid", "");
                }
            },

            SMDDChangeCallBack: function (callback) {
                var that = this;

                that.SMDDChangeCallBack = callback;
            },

            BatchChangeCallBack: function(callback){
                var that = this;

                that.BatchChangeCallBack = callback;
            },

            GetChoseKeys:function(){
                var that = this;
                var rows = that.wrapper.querySelectorAll(".intro table tbody tr input[type=checkbox]");

                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].checked) {
                        that.selectedRows.push(rows[i].dataset.cid);
                    }
                }

                return that.selectedRows;
            },
            
            GetEntryKey: function () {
                var that = this;
                var tmp = that.dataHash["list"]["EntryData"];
                
                var arr = [];
                for (var id in tmp) {
                    arr.push(id);
                }

                return arr;
            }
        }

        return function (el, options) {
            return new Delivery(el, options);
        };
    })();

    window.Delivery = Delivery;

})(window, document, Math);