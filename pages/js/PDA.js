(function () {
    window.PDA = window.PDA || {};

    function getAbsulotePosition(obj) {
        var obj1 = obj;
        var position = { "left": obj1.offsetLeft, "top": obj1.offsetTop };

        while (obj1.offsetParent) {
            obj1 = obj1.offsetParent;
            position.left += obj1.offsetLeft;
            position.top += obj1.offsetTop;
        }
        while (obj.parentNode != document.body) {
            obj = obj.parentNode;
            position.left -= obj.scrollLeft;
            position.top -= obj.scrollTop;
        }
        return position;
    }

    function getComputedPosition(obj) {
        var matrix = window.getComputedStyle(obj, null),
            x, y;
        var s = true;
        if (s) {
            matrix = matrix["-webkit-transform"].split(')')[0].split(', ');
            x = +(matrix[12] || matrix[4]);
            y = +(matrix[13] || matrix[5]);
        } else {
            x = +matrix.left.replace(/[^-\d.]/g, '');
            y = +matrix.top.replace(/[^-\d.]/g, '');
        }

        return { x: x, y: y };
    }

    PDA.RK = function (container, containerHeight) {
        var me = this;
        me.Conatiner = container;
        me.ContainerHeight = containerHeight || window.innerHeight;
        me.hasBindCKCW = false;
        me.IDPrefix = "k3pda" + parseInt(100000 * Math.random()) + "_";
        me.CurSelectedprimarykey = null;
        me.AllowAdd = false;
        me._InitLayout();
    }
    PDA.RK.prototype = {
        _InitLayout: function () {
            var me = this;

            me.innerWraper = document.createElement("DIV");
            me.innerWraper.className = "pda-inner-wraper";
            me.innerWraper.style["height"] = me.ContainerHeight + "px";
            me.DetailArea = document.createElement("DIV");
            me.DetailArea.className = "pda-detail-wraper";

            me.CloseDetailIcon = document.createElement("SPAN");
            me.CloseDetailIcon.className = "pda-close-detail";

            me.ListArea = document.createElement("DIV");
            me.ListArea.className = "pda-list-wraper";


            me.CKCWSelectorWraper = document.createElement("DIV");
            me.CKCWSelectorWraper.className = "pda-ckcw-selector-wraper";
            me.CKCWSelectorWraper.style["height"] = me.ContainerHeight + "px";


            me.ButtonArea = document.createElement("DIV");
            me.ButtonArea.className = "pda-btn-wraper bg_2";

            me.tableHeaderArea = document.createElement("DIV");
            me.tableHeaderArea.className = "pda-tabheder-wraper";

            me.CKCWArea = document.createElement("DIV");
            me.CKCWArea.className = "pda-ckcw-wraper";

            me._CreateDetailArea();
            me.DetailArea.appendChild(me.CloseDetailIcon);
            me.innerWraper.appendChild(me.DetailArea);
            me.innerWraper.appendChild(me.CKCWArea);
            me.innerWraper.appendChild(me.tableHeaderArea);
            me.innerWraper.appendChild(me.ListArea);
            me.innerWraper.appendChild(me.ButtonArea);
            me.innerWraper.appendChild(me.CKCWSelectorWraper);
            me.Conatiner.appendChild(me.innerWraper);
            me._CreateCKCWLayout();
            me._InitButton();
            me._InitEvent();
            me._InitDeleteDialog();
            me._InitModifyDialog();
        },
        _InitModifyDialog: function () {
            var me = this;

            if (!me.ModifyDialog) {
                me.ModifyDialog = new cConfirm({
                    ok: function (o, e) {
                         if (me._ChangeCallBack) {
                            var PArr = [e[0]["pkey"]];                            
                            // var PArr = [$s('#data_input').getAttribute("pkey")];
                            var CData = me._CreateChangeDataByPkeyArr(PArr);
                            CData.ModifyFields = [{
                                "FieldKey": e[0]["fkey"],
                                "DisplayValue": e[0]["input_value"],
                                "SaveValue": e[0]["input_value"]
                            }];

                            me._ChangeCallBack(CData);
                        }
                    },
                    cancel: function () {
                    }
                });
            }
        },

        "ChangeCallBack": function (callback) {
            var me = this;
            me._ChangeCallBack = callback;
            return me;
        },
        "SMDDChangeCallBack": function (callback) {
            var me = this;
            me._SMDDChangeCallBack = callback;
            return me;
        },
        _InitDeleteDialog: function () {
            var me = this;

            if (!me.DeleteDialog) {
                me.DeleteDialog = new cConfirm({
                    ok: function (o, e) {
                        for (var i = 0, j = me.DeleteArr.length; i < j; i++) {
                            me.delteDataByPrimaryKey(me.DeleteArr[i]);
                        }
                        me.DeleteArr = [];
                    },
                    cancel: function () {
                    }
                });
            }
        },
        _InitButton: function () {
            var me = this; //"pad-col

            var fbtnDiv = document.createElement("DIV");
            fbtnDiv.className = "pad-col";
            var sbtnDiv = document.createElement("DIV");
            sbtnDiv.className = "pad-col";
            sbtnDiv.style["width"] = "50%";
            fbtnDiv.style["width"] = "50%";

            var OKBtn = document.createElement("button");
            OKBtn.innerHTML = lang.getText("submit");
            OKBtn.className = "button button_ujarak button_border_medium button_round_s button_text_thick";
            fbtnDiv.appendChild(OKBtn);

            OKBtn.addEventListener("click", function (e) {
                if (me._SubmitCallBack) {

                    //提交前，将扫描数量反写到实收数量上
                    if (me.TableData != null && me.TableData != undefined) {
                        for (var i = 0; i < me.TableData.length; i++) {
                            var oldTableRowData = me.TableData[i];
                            var scanQty = oldTableRowData["FScanQty"]["DefaultValue"]["SaveValue"];
                            var TablePKey = oldTableRowData["FDataKey"]["DefaultValue"]["SaveValue"];
                            for (var j = 0; j < me.EntryData.length; j++) {
                                var oldEntryRowData = me.EntryData[j];
                                var EntryPKey = oldEntryRowData["FSourceInterId"] + "_" + oldEntryRowData["FSourceEntryID"] + "_" + oldEntryRowData["FEntryID"];
                                if (oldEntryRowData["FSourceInterId"] == "0")
                                    EntryPKey = oldEntryRowData["FInterID"] + "_" + oldEntryRowData["FEntryID"] + "_" + oldEntryRowData["FEntryID"];                                
                                if (TablePKey == EntryPKey) {
                                    me.EntryData[j]["Fauxqty"] = scanQty;
                                    break;
                                }
                            }
                        }
                    }

                    var Data = {
                        "HeadData": me.HeadData,
                        "EntryData": me.EntryData
                    };

                    me._SubmitCallBack(Data);
                }
            }, false);

            var deleteBtn = document.createElement("button");


            deleteBtn.addEventListener("click", function (e) {
                me.getCheckedPrimaryKeys();
                if (me.DeleteArr.length > 0) {
                    me.DeleteDialog.setTitle(lang.getText("title"));
                    me.DeleteDialog.setContent(lang.getText("sure_to_delete").format(me.DeleteArr.length));
                }else{
                    me.DeleteDialog.setTitle(lang.getText("title"));
                    me.DeleteDialog.setContent(lang.getText("select_entry"));
                }

                me.DeleteDialog.show();
            }, false);

            deleteBtn.innerHTML = lang.getText("delete");
            deleteBtn.className = "button button_ujarak button_border_medium button_round_s button_text_thick";
            sbtnDiv.appendChild(deleteBtn);

            me.ButtonArea.appendChild(fbtnDiv);
            me.ButtonArea.appendChild(sbtnDiv);

        },
        getCheckedPrimaryKeys: function () {
            var me = this;
            var checkBoxs = me.ListTable.getElementsByTagName("INPUT");
            me.DeleteArr = [];
            for (var i = 0, j = checkBoxs.length; i < j; i++) {
                var CurC = checkBoxs[i];
                if (CurC.checked) {
                    var primarykey = CurC.getAttribute("primarykey");
                    me.DeleteArr.push(primarykey);
                }
            }
        },
        _InitEvent: function () {
            var me = this, start = { x: 0, y: 0 }, move = { x: 0, y: 0 }, touchleave = false,
                curPos = { x: 0, y: 0 }
                , diff = { x: 0, y: 0 }, hasLockXOrY = false, LockX = true, movePos = { x: 0, y: 0 };
            var testStyle = document.createElement("DIV").style, curtarget = null;
            me.transform = "-webkit-transform";
            me.transition = "-webkit-transition";
            if (!"-webkit-transform" in testStyle) {
                me.transform = "transform";
                me.transition = "transition";
            }
            me.ListArea.addEventListener("touchstart", function (e) {
                var touches = e.touches[0];
                start = { x: touches.pageX, y: touches.pageY };
                move = { x: touches.pageX, y: touches.pageY };
                curPos = movePos;
                hasLockXOrY = false;
                me.ListTable.style[me.transition] = "";
                me.FixedHeaderTable.style[me.transition] = "";
                touchleave = false;
                curtarget = e.target;
            }, false);

            me.ListArea.addEventListener("touchmove", function (e) {
                e.preventDefault();
                if (touchleave) {
                    return;
                }
                var touches = e.touches[0];
                move = { x: touches.pageX, y: touches.pageY };
                diff = { x: move.x - start.x, y: move.y - start.y };

                if (!hasLockXOrY) {
                    hasLockXOrY = true;
                    LockX = Math.abs(diff.x) < Math.abs(diff.y);
                }
                LockX ? diff.x = 0 : diff.y = 0;
                movePos = { x: curPos.x + diff.x, y: curPos.y + diff.y };
                me.ListTable.style[me.transform] = "translate(" + movePos.x + "px," + movePos.y + "px)";
                if (!LockX) {
                    me.FixedHeaderTable.style[me.transform] = "translate(" + movePos.x + "px,0)"
                }
                if (touches.pageX <= 10 || touches.pageX >= me.tableListWraperSize.w - 10 || (touches.pageY - me.ListTablePos.top) <= 10 || (touches.pageY - me.ListTablePos.top) >= me.tableListWraperSize.h - 10) {
                    TouchEnd();
                    touchleave = true;
                    return;
                }
                else {
                    touchleave = false;
                }
            }, false);

            function TouchEnd() {
                diff = { x: move.x - start.x, y: move.y - start.y };
                if (diff.x == 0 && diff.y == 0) {
                    var primarykey = curtarget.getAttribute("primarykey");
                    if (curtarget.tagName != "INPUT" && primarykey != undefined && me.CurSelectedprimarykey != primarykey) {
                        var currTr = document.getElementById(me.IDPrefix + primarykey);
                        if (currTr) {
                            me.BindDetaiDataByKey(primarykey);
                            currTr.className = "pad-selected";
                        }

                    }
                    return;
                }
                movePos = me._getTableListRealPos(movePos);
                me.ListTable.style[me.transition] = me.transform + " .3s cubic-bezier(0.333333, 0.666667, 0.666667, 1) 0s";
                me.ListTable.style[me.transform] = "translate(" + movePos.x + "px," + movePos.y + "px)";
                me.FixedHeaderTable.style[me.transition] = me.transform + " .3s cubic-bezier(0.333333, 0.666667, 0.666667, 1) 0s";
                me.FixedHeaderTable.style[me.transform] = "translate(" + movePos.x + "px,0)"
            }

            me.ListArea.addEventListener("touchend", function () {
                if (touchleave) {
                    return;
                }
                TouchEnd();
            })

            me._initDetailEvent();

        },
        _InitTableListLimit: function () {
            var me = this;
            me.tableListLimit = { x: { min: 0, max: 0 }, y: { min: 0, max: 0} };
            me.tableListWraperSize = { w: me.ListArea.offsetWidth, h: me.ListArea.offsetHeight };
            var listTableSize = { w: me.ListTable.offsetWidth, h: me.ListTable.offsetHeight };
            var diffx = listTableSize.w - me.tableListWraperSize.w;
            me.tableListLimit.x.min = diffx < 0 ? 0 : 0 - diffx;
            var diffy = listTableSize.h - me.tableListWraperSize.h;
            me.tableListLimit.y.min = diffy < 0 ? 0 : 0 - diffy;
            me.ListTablePos = getAbsulotePosition(me.ListArea);
        },
        _getTableListRealPos: function (movePos) {
            var me = this;
            movePos.x = movePos.x < me.tableListLimit.x.min ? me.tableListLimit.x.min : movePos.x;
            movePos.x = movePos.x > me.tableListLimit.x.max ? me.tableListLimit.x.max : movePos.x;
            movePos.y = movePos.y < me.tableListLimit.y.min ? me.tableListLimit.y.min : movePos.y;
            movePos.y = movePos.y > me.tableListLimit.y.max ? me.tableListLimit.y.max : movePos.y;
            return movePos;
        },

        _CreateDetailArea: function () {
            var me = this;
            me.DetailDiv = document.createElement("DIV");
            me.DetailDiv.className = "pda-detail-div";
            me.DetailArea.appendChild(me.DetailDiv);
        },
        BindCKCWData: function (data) {
            var me = this;
            me.CKCWData = data;
            return me;
        },

        _InitCKCWSelector: function () {
            var me = this;
            //me.CKCWSelectorWraper
            var HeaderDiv = document.createElement("DIV");
            HeaderDiv.className = "pda-ckcw-header";
            me.CKCWSelectorWraper.appendChild(HeaderDiv);
            var CKCWHeaderTable = document.createElement("Table");
            CKCWHeaderTable.className = "pda-ckcw-headertable";
            me.CKCWtable = document.createElement("Table");
            me.CKCWtable.className = "pda-ckcw-table";

            var headerTitle = [lang.getText("stock_num"), lang.getText("stock_name"), lang.getText("stockplace_num"), lang.getText("stockplace_name")];
            var headerRow = document.createElement("TR");
            for (var i = 0, j = headerTitle.length; i < j; i++) {
                var headerCell = document.createElement("TD");
                headerCell.innerHTML = headerTitle[i];
                headerRow.appendChild(headerCell);
            }
            CKCWHeaderTable.appendChild(headerRow);
            HeaderDiv.appendChild(CKCWHeaderTable);


            for (var i = 0, j = me.CKCWData.length; i < j; i++) {


                var CKData = me.CKCWData[i];
                var CWArr = CKData["StockPlaceData"];


                for (var n = 0, m = CWArr.length; n < m; n++) {
                    var row = document.createElement("TR");
                    var CKDMCell = document.createElement("TD");
                    CKDMCell.innerHTML = CKData["FNumber"];
                    var CKMCCell = document.createElement("TD");
                    CKMCCell.innerHTML = CKData["FName"];

                    var CWData = CWArr[n];
                    var CWDMCell = document.createElement("TD");
                    CWDMCell.innerHTML = CWData["FSPNumber"];
                    var CWMCCell = document.createElement("TD");
                    CWMCCell.innerHTML = CWData["FSPName"];

                    CKDMCell.setAttribute("ckdm", CKData["FItemID"]);
                    CKDMCell.setAttribute("ckmc", CKData["FName"]);
                    CKDMCell.setAttribute("cwdm", CWData["FSPID"]);
                    CKDMCell.setAttribute("cwmc", CWData["FSPName"]);

                    CKMCCell.setAttribute("ckdm", CKData["FItemID"]);
                    CKMCCell.setAttribute("ckmc", CKData["FName"]);
                    CKMCCell.setAttribute("cwdm", CWData["FSPID"]);
                    CKMCCell.setAttribute("cwmc", CWData["FSPName"]);

                    CWDMCell.setAttribute("ckdm", CKData["FItemID"]);
                    CWDMCell.setAttribute("ckmc", CKData["FName"]);
                    CWDMCell.setAttribute("cwdm", CWData["FSPID"]);
                    CWDMCell.setAttribute("cwmc", CWData["FSPName"]);

                    CWMCCell.setAttribute("ckdm", CKData["FItemID"]);
                    CWMCCell.setAttribute("ckmc", CKData["FName"]);
                    CWMCCell.setAttribute("cwdm", CWData["FSPID"]);
                    CWMCCell.setAttribute("cwmc", CWData["FSPName"]);

                    row.setAttribute("ckdm", CKData["FNumber"]);
                    row.setAttribute("ckmc", CKData["FName"]);
                    row.setAttribute("cwdm", CWData["FSPNumber"]);
                    row.setAttribute("cwmc", CWData["FSPName"]);

                    row.appendChild(CKDMCell);
                    row.appendChild(CKMCCell);
                    row.appendChild(CWDMCell);
                    row.appendChild(CWMCCell);
                    me.CKCWtable.appendChild(row);

                }
            }
            me.CKCWSelectorWraper.appendChild(me.CKCWtable);
            me._InitCKCWSelectorEvent();

        },
        _InitCKCWLimit: function () {
            var me = this;
            me.ckcwLimit = { x: { min: 0, max: 0 }, y: { min: 0, max: 0} };
            me.ckcwWraperSize = { w: me.CKCWSelectorWraper.offsetWidth, h: me.CKCWSelectorWraper.offsetHeight };
            var CKCWtableSize = { w: me.CKCWtable.offsetWidth, h: me.CKCWtable.offsetHeight };
            var diffx = CKCWtableSize.w - me.tableListWraperSize.w;
            me.ckcwLimit.x.min = diffx < 0 ? 0 : 0 - diffx;
            var diffy = CKCWtableSize.h - me.ckcwWraperSize.h;
            me.ckcwLimit.y.min = diffy < 0 ? 0 : 0 - diffy - 40;
            me.CKCWtablePos = getAbsulotePosition(me.CKCWSelectorWraper);
        },
        _getCKCWRealPos: function (movePos) {
            var me = this;
            movePos.x = movePos.x < me.ckcwLimit.x.min ? me.ckcwLimit.x.min : movePos.x;
            movePos.x = movePos.x > me.ckcwLimit.x.max ? me.ckcwLimit.x.max : movePos.x;
            movePos.y = movePos.y < me.ckcwLimit.y.min ? me.ckcwLimit.y.min : movePos.y;
            movePos.y = movePos.y > me.ckcwLimit.y.max ? me.ckcwLimit.y.max : movePos.y;
            return movePos;
        },
        _InitCKCWSelectorEvent: function () {
            var me = this, start = { x: 0, y: 0 }, move = { x: 0, y: 0 }, touchleave = false,
                curPos = { x: 0, y: 0 }
                , diff = { x: 0, y: 0 },
                movePos = { x: 0, y: 0 };
            me._InitCKCWLimit();
            var curTaget = null;
            me.CKCWSelectorWraper.addEventListener("touchstart", function (e) {
                var touches = e.touches[0];
                start = { x: touches.pageX, y: touches.pageY };
                move = { x: touches.pageX, y: touches.pageY };
                curPos = movePos;
                me.CKCWtable.style[me.transition] = "";
                curTaget = e.target;
                touchleave = false;
            }, false);

            me.CKCWSelectorWraper.addEventListener("touchmove", function (e) {
                e.preventDefault();
                var touches = e.touches[0];
                move = { x: touches.pageX, y: touches.pageY };
                diff = { x: move.x - start.x, y: move.y - start.y };

                movePos = { x: curPos.x + diff.x, y: curPos.y + diff.y };
                me.CKCWtable.style[me.transform] = "translate(0," + movePos.y + "px)";


            }, false);

            function TouchEnd() {
                diff = { x: move.x - start.x, y: move.y - start.y };
                if (diff.x == 0 && diff.y == 0) {
                    var ckmc = curTaget.getAttribute("ckmc"); //FDCStockID
                    var ckdm = curTaget.getAttribute("ckdm");
                    var cwmc = curTaget.getAttribute("cwmc"); //FDCSPID
                    var cwdm = curTaget.getAttribute("cwdm");
                    if (ckdm == null) {
                        return;
                    }
                    window.setTimeout(function () {
                        //alert(ckmc + "    " + ckdm + "    " + cwmc + "    " + cwdm + "    ");
                        me.CKCWSelectorWraper.style["left"] = "101%";
                        if (me._ChangeCallBack) {
                            var Arr = (!me.DeleteArr || me.DeleteArr.length == 0) ? [me.CurSelectedprimarykey] : me.DeleteArr;
                            var ChangeData = me._CreateChangeDataByPkeyArr(Arr);
                            ChangeData.ModifyFields = [{
                                "FieldKey": "FDCStockID",
                                "DisplayValue": ckmc,
                                "SaveValue": ckdm
                            }, {
                                "FieldKey": "FDCSPID",
                                "DisplayValue": cwmc,
                                "SaveValue": cwdm
                            }];
                            me._ChangeCallBack(ChangeData);
                        }
                    }, 20);
                    return;
                }
                movePos = me._getCKCWRealPos(movePos);
                me.CKCWtable.style[me.transition] = me.transform + " .3s cubic-bezier(0.333333, 0.666667, 0.666667, 1) 0s";
                me.CKCWtable.style[me.transform] = "translate(0," + movePos.y + "px)";
            }

            me.CKCWSelectorWraper.addEventListener("touchend", function () {
                TouchEnd();
            })
        },
        _CreateCKCWLayout: function () {
            //pad-ckcw-col
            var me = this;
            var CKCWDiv = document.createElement("DIV");
            CKCWDiv.className = "pad-col";
            CKCWDiv.innerHTML = "<span class='pda-ckcw-label'>" + lang.getText("stock") + "：</span><span class='pda-ckcw-val'></span><span class='pda-ckcw-label'>" + lang.getText("stockplace") + "：</span><span  class='pda-ckcw-val'></span>";
            CKCWDiv.addEventListener("click", function () {
                if (!me.hasBindCKCW) {

                    me._InitCKCWSelector();
                    me.hasBindCKCW = true;
                }
                me.getCheckedPrimaryKeys();
                if (me.DeleteArr.length == 0) {
                    return;
                }
                me.CKCWSelectorWraper.style["left"] = "0px";

            }, false);

            var DownIconDiv = document.createElement("DIV");
            DownIconDiv.className = "pad-col pda-down-icon";
            DownIconDiv.style["width"] = "50px";

            var state = "nomal";

            var UpIconDiv = document.createElement("DIV");
            UpIconDiv.className = "pad-col pda-up-icon";
            UpIconDiv.style["width"] = "50px";

            UpIconDiv.addEventListener("click", function (e) {
                if (state == "down") {
                    return;
                }
                me.DetailArea.style["z-index"] = 0;
                me.CKCWArea.style["top"] = "0px";
                me.tableHeaderArea.style["top"] = "40px";
                me.ListArea.style["top"] = "74px";
                state = "up";
                UpIconDiv.style["display"] = "none";
                me._InitTableListLimit();
            }, false)
            DownIconDiv.addEventListener("click", function (e) {
                if (state == "up") {
                    me.CKCWArea.style["top"] = "";
                    me.DetailArea.style["z-index"] = 10;
                    me.tableHeaderArea.style["top"] = "";
                    me.ListArea.style["top"] = "";
                    UpIconDiv.style["display"] = "table-cell";
                    me._InitTableListLimit();
                    state = "nomal";
                } else {
                    me.DetailDiv.style["height"] = (me.ContainerHeight - 50) + "px";
                    me.CloseDetailIcon.style["display"] = "block";
                    state = "down";
                    me._InitDetailListLimit();
                }
            }, false);
            me.CloseDetailIcon.addEventListener("click", function (e) {
                state = "nomal";
                me.DetailDiv.style["height"] = "";
                me.CloseDetailIcon.style["display"] = "none";
                me._InitDetailListLimit();
            }, false);
            me.CKCWArea.appendChild(CKCWDiv);
            me.CKCWArea.appendChild(DownIconDiv);
            me.CKCWArea.appendChild(UpIconDiv);
        },
        _getDataByKey: function (primarykey) {
            var me = this;
            if (!me.DetailData) {
                return null;
            }
            for (var i = 0, j = me.DetailData.length; i < j; i++) {
                var curData = me.DetailData[i];
                if (curData["FDataKey"].DefaultValue.SaveValue == primarykey) {
                    return curData;
                }
            }
            return null;
        },
        BindDetaiDataByKey: function (primarykey) {
            var me = this;
            var Data = null;
            if (primarykey != null) {
                Data = me._getDataByKey(primarykey);
            }
            me.DetailRefresh = true;

            me.DetailDiv.innerHTML = "";
            me.DetailUL = document.createElement("UL");
            me.DetailUL.className = "pda-detail-ul";

            if (me.CurSelectedprimarykey != null) {
                var PreSelectedRow = document.getElementById(me.IDPrefix + me.CurSelectedprimarykey);
                if (PreSelectedRow) {
                    PreSelectedRow.className = "";
                }

            }
            me.CurSelectedprimarykey = primarykey;
            if (Data != null) {
                for (var key in Data) {
                    var CurData = Data[key];
                    if (!CurData.Visible) {
                        continue;
                    }


                    var CurLi = document.createElement("LI");
                    var Label = document.createElement("SPAN");
                    Label.className = "pda-detail-label";
                    var Value = document.createElement("SPAN");
                    Value.className = "pda-detail-value";

                    Label.innerHTML = CurData.Name;
                    if (CurData.Editable) {
                        var Input = document.createElement("INPUT");
                        Input.type = "text";
                        Input.setAttribute("label", CurData.Name);
                        Input.setAttribute("readonly", "readonly");
                        Input.value = CurData["DefaultValue"]["DisplayValue"];
                        // me.ModifyTextBox.setAttribute("fkey", key);
                        // me.ModifyTextBox.setAttribute("pkey", primarykey);

                        Input.setAttribute("fkey", key);
                        Input.setAttribute("pkey", primarykey);
                        Value.appendChild(Input);
                    } else {
                        Value.innerHTML = CurData["DefaultValue"]["DisplayValue"];
                    }
                    CurLi.appendChild(Label);
                    CurLi.appendChild(Value);
                    me.DetailUL.appendChild(CurLi);
                }

            }
            me.DetailDiv.appendChild(me.DetailUL);
            me._InitDetailListLimit();

        },
        _InitDetailListLimit: function () {
            var me = this;
            me.detailListLimit = { x: { min: 0, max: 0 }, y: { min: 0, max: 0} };
            me.detailListWraperSize = { w: me.DetailDiv.offsetWidth, h: me.DetailDiv.offsetHeight };
            var listTableSize = { w: me.DetailUL.offsetWidth, h: me.DetailUL.offsetHeight };
            var diffx = listTableSize.w - me.detailListWraperSize.w;
            me.detailListLimit.x.min = diffx < 0 ? 0 : 0 - diffx;
            var diffy = listTableSize.h - me.detailListWraperSize.h;
            me.detailListLimit.y.min = diffy < 0 ? 0 : 0 - diffy;
            me.DetailListPos = getAbsulotePosition(me.DetailDiv);
        },
        _getDetailListRealPos: function (movePos) {
            var me = this;
            movePos.x = movePos.x < me.detailListLimit.x.min ? me.detailListLimit.x.min : movePos.x;
            movePos.x = movePos.x > me.detailListLimit.x.max ? me.detailListLimit.x.max : movePos.x;
            movePos.y = movePos.y < me.detailListLimit.y.min ? me.detailListLimit.y.min : movePos.y;
            movePos.y = movePos.y > me.detailListLimit.y.max ? me.detailListLimit.y.max : movePos.y;
            return movePos;
        },
        _initDetailEvent: function () {

            var me = this, start = { x: 0, y: 0 }, move = { x: 0, y: 0 }, touchleave = false,
                curPos = { x: 0, y: 0 }
                , diff = { x: 0, y: 0 },
                movePos = { x: 0, y: 0 }, CurTarget = null;

            me.DetailDiv.addEventListener("touchstart", function (e) {
                var touches = e.touches[0];
                start = { x: touches.pageX, y: touches.pageY };
                move = { x: touches.pageX, y: touches.pageY };
                if (me.DetailRefresh) {
                    me.DetailRefresh = false;
                    curPos = movePos = { x: 0, y: 0 };
                } else {
                    curPos = movePos;
                }
                CurTarget = e.target;
                me.DetailUL.style[me.transition] = "";

                touchleave = false;
            }, false);

            me.DetailDiv.addEventListener("touchmove", function (e) {
                e.preventDefault();
                var touches = e.touches[0];
                move = { x: touches.pageX, y: touches.pageY };
                diff = { x: move.x - start.x, y: move.y - start.y };

                movePos = { x: curPos.x + diff.x, y: curPos.y + diff.y };
                me.DetailUL.style[me.transform] = "translate(0," + movePos.y + "px)";


            }, false);

            function TouchEnd() {
                diff = { x: move.x - start.x, y: move.y - start.y };
                if (diff.x == 0 && diff.y == 0) {
                    if (CurTarget.tagName == "INPUT") {
                        window.setTimeout(function () {
                            var fkey = CurTarget.getAttribute("fkey");
                            var pkey = CurTarget.getAttribute("pkey");
                            if (fkey == "FDCSPID" || fkey == "FDCStockID") {
                                if (!me.hasBindCKCW) {
                                    me._InitCKCWSelector();
                                    me.hasBindCKCW = true;
                                }
                                me.CKCWSelectorWraper.style["left"] = "0px";
                                return;
                            }

                            me.ModifyDialog.setTitle(CurTarget.getAttribute("label"));
                            me.ModifyDialog
                                    .setContent("<input id='data_input' fkey="+ fkey +" pkey="+pkey+" style='width: 100%; background: transparent; border:none; border-bottom: 1px solid #87cefa; outline:none;' type='text' value = " + CurTarget.value + ">");
                            me.ModifyDialog.show();

                            $s.bind($s('#data_input'),"change",function(e){
                                me.ModifyDialog.setArgs([{"input_value": e.target.value, "fkey": fkey,"pkey": pkey}]);
                            });
                        }, 100)
                    }
                    return;
                }
                movePos = me._getDetailListRealPos(movePos);
                me.DetailUL.style[me.transition] = me.transform + " .3s cubic-bezier(0.333333, 0.666667, 0.666667, 1) 0s";
                me.DetailUL.style[me.transform] = "translate(0," + movePos.y + "px)";
            }

            me.DetailDiv.addEventListener("touchend", function () {
                TouchEnd();
            })
        },
        FocusCallBack: function (callback) {
            var me = this;
            me._FocusCallBack = callback;
            return me;
        },
        BlurCallBack: function (callback) {
            var me = this;
            me._BlurCallBack = callback;
            return me;
        },
        delteDataByPrimaryKey: function (primarykey) {
            var me = this;
            var TableRow = document.getElementById(me.IDPrefix + primarykey);
            if (TableRow) {
                if (me.CurSelectedprimarykey == primarykey) {
                    me.CurSelectedprimarykey = null;
                    me.BindDetaiDataByKey(null);
                }

                TableRow.parentNode.removeChild(TableRow);

                for (var n = 0, m = me.EntryData.length; n < m; n++) {
                    var oldRowData = me.EntryData[n];
                    var EntryPKey = oldRowData["FSourceInterId"] + "_" + oldRowData["FSourceEntryID"] + "_" + oldRowData["FEntryID"];
                    if (oldRowData["FSourceInterId"] == "0")
                        EntryPKey = oldRowData["FInterID"] + "_" + oldRowData["FEntryID"] + "_" + oldRowData["FEntryID"];
                    if (primarykey == EntryPKey) {
                        me.EntryData.splice(n, 1);
                        break;
                    }
                }

                for (var n = 0, m = me.TableData.length; n < m; n++) {
                    var oldRowData = me.TableData[n];
                    var TablePKey = oldRowData["FDataKey"]["DefaultValue"]["SaveValue"];
                    if (primarykey == TablePKey) {
                        me.TableData.splice(n, 1);
                        break;
                    }
                }

                for (var n = 0, m = me.DetailData.length; n < m; n++) {
                    var oldRowData = me.DetailData[n];
                    var TablePKey = oldRowData["FDataKey"]["DefaultValue"]["SaveValue"];
                    if (primarykey == TablePKey) {
                        me.DetailData.splice(n, 1);
                        break;
                    }
                }
            }
        },
        _CreateListRow: function (RowData, Table, Header, index, isFirstInitTable) {
            var me = this;
            var HeaderRow = index == 0 ? document.createElement("TR") : null;
            var Row = document.createElement("TR");
            Row.setAttribute("rowindex", index);
            var isFirstCol = true;
            var colIndex = 0;
            var sumWidth = 0;
            var ParimaryKeyValue = RowData["FDataKey"]["DefaultValue"]["SaveValue"];
            Row.setAttribute("primarykey", ParimaryKeyValue);

            for (var key in RowData) {
                var CellData = RowData[key];
                if (!CellData.Visible) {
                    continue;
                }
                var Cell = document.createElement("TD");
                Cell.setAttribute("primarykey", ParimaryKeyValue);
                sumWidth += CellData.Width || 120;
                Cell.style["width"] = CellData.Width + "px";

                if (index == 0 && isFirstInitTable) {
                    var HeaderCell = document.createElement("TD");
                    HeaderCell.style["width"] = CellData.Width + "px";
                    if (isFirstCol) {
                        var HeaderCheckBoxCell = document.createElement("TD");
                        HeaderCheckBoxCell.setAttribute("primarykey", ParimaryKeyValue);
                        HeaderCheckBoxCell.style["width"] = "40px";
                        var TopCheckBox = document.createElement("INPUT");
                        TopCheckBox.setAttribute("primarykey", ParimaryKeyValue);
                        TopCheckBox.type = "checkbox";
                        TopCheckBox.addEventListener("change", function (e) {
                            var checked = e.target.checked;
                            var checkBoxs = me.ListTable.getElementsByTagName("INPUT");
                            me.DeleteArr = [];
                            for (var i = 0, j = checkBoxs.length; i < j; i++) {
                                checkBoxs[i].checked = checked;
                            }
                        });
                        HeaderCheckBoxCell.appendChild(TopCheckBox);
                        HeaderRow.appendChild(HeaderCheckBoxCell);
                    }
                    HeaderCell.innerHTML = CellData.Name;
                    HeaderRow.appendChild(HeaderCell);
                }


                if (isFirstCol) {
                    var isFirstCol = false;
                    var CheckBoxCell = document.createElement("TD");
                    CheckBoxCell.setAttribute("primarykey", ParimaryKeyValue);
                    CheckBoxCell.style["width"] = "40px";
                    var ChBox = document.createElement("INPUT");
                    ChBox.setAttribute("primarykey", ParimaryKeyValue);
                    ChBox.type = "checkbox";

                    CheckBoxCell.appendChild(ChBox);
                    Row.appendChild(CheckBoxCell);
                  

                }

                Cell.innerHTML = CellData["DefaultValue"]["DisplayValue"];
                colIndex += 1;
                Row.appendChild(Cell);
              
                Row.id = me.IDPrefix + ParimaryKeyValue;
            }
            if (index == 0) {
                Table.style["width"] = (sumWidth + 40) + "px";
                if (isFirstInitTable) {
                    Header.style["width"] = (sumWidth + 40) + "px";
                    Header.appendChild(HeaderRow);
                }
            }
            return Row;
        },
        SubmitCallBack: function (callback) {
            var me = this;
            me._SubmitCallBack = callback;
            return me;
        },
        BindData: function (DataSource, AllowAdd) {
            var me = this;
            me.AllowAdd = AllowAdd == undefined ? false : AllowAdd;
            var Data = DataSource.Data[0];
            var ShowData = Data.ShowData;
            me.DetailData = ShowData.DetailData;
            me.TableData = ShowData.TableData;
            me.HeadData = Data.HeadData;
            me.EntryData = Data.EntryData;

            me.ListArea.innerHTML = "";
            me.tableHeaderArea.innerHTML = "";
            me.ListTable = document.createElement("TABLE");
            me.FixedHeaderTable = document.createElement("TABLE");
            me.FixedHeaderTable.className = "pda-list-table";
            me.ListTable.className = "pda-list-table";
            for (var i = 0, j = me.TableData.length; i < j; i++) {
                me.ListTable.appendChild(me._CreateListRow(me.TableData[i], me.ListTable, me.FixedHeaderTable, i, true));
            }
            me.tableHeaderArea.appendChild(me.FixedHeaderTable);
            me.ListArea.appendChild(me.ListTable);
            me._InitTableListLimit();
            //me.BindDetaiDataByKey(null);
            //BUG： 2015-04-13 hongbo_liang 获取到当前列表中的第一行的primarykey
            me.CurSelectedprimarykey = me.ListTable.querySelector('.pda-list-table > tr').getAttribute('primarykey');
            me.BindDetaiDataByKey(me.CurSelectedprimarykey);
            return me;
        },
        _CreateChangeDataByPkeyArr: function (pkeyArr) {
            var me = this;
            var Re = {
                ModifyKeys: pkeyArr
            };
            //var Re = {
            //    ModifyHeadData: me.HeadData,
            //    ModifyEntryData: [],
            //    ModifyShowData:
            //    {
            //        TableData: [],
            //        DetailData: []
            //    }
            //};
            //for (var i = 0, j = pkeyArr.length; i < j; i++) {
            //    var pkey = pkeyArr[i];
            //    for (var n = 0, m = me.EntryData.length; n < m; n++) {
            //        var RowData = me.EntryData[n];
            //        var EntryPKey = RowData["FSourceInterId"] + "_" + RowData["FSourceEntryID"] + "_" + RowData["FEntryID"];
            //        if (RowData["FSourceInterId"] == "0")
            //            EntryPKey = RowData["FInterID"] + "_" + RowData["FEntryID"] + "_" + RowData["FEntryID"];
            //        if (pkey == EntryPKey) {
            //            Re.ModifyEntryData.push(RowData);
            //            break;
            //        }
            //    }

            //    for (var n = 0, m = me.TableData.length; n < m; n++) {
            //        var RowData = me.TableData[n];
            //        var TablePKey = RowData["FDataKey"]["DefaultValue"]["SaveValue"];
            //        if (TablePKey == pkey) {
            //            Re.ModifyShowData.TableData.push(RowData);
            //            break;
            //        }
            //    }

            //    for (var n = 0, m = me.DetailData.length; n < m; n++) {
            //        var RowData = me.DetailData[n];
            //        var DetailPKey = RowData["FDataKey"]["DefaultValue"]["SaveValue"];
            //        if (DetailPKey == pkey) {
            //            Re.ModifyShowData.DetailData.push(RowData);
            //            break;
            //        }
            //    }

            //}
            return Re;
        },
        UpDate: function (newData, isDD) {
            var me = this;
            //是否是扫描订单跟新
            isDD = isDD == undefined ? false : isDD;
            var Data = newData.Data[0];
            var ShowData = Data.ShowData;
            //me.AllowAdd
            var NewDetailSource = ShowData.DetailData;
            var NewTableData = ShowData.TableData;
            me.HeadData = Data.HeadData;
            var NewEntryData = Data.EntryData;
           // var PrimaryArr = [];
           // var ParimaryKeyValue_Fauxqty = {};
            for (var i = 0, j = NewEntryData.length; i < j; i++) {
                var RowData = NewEntryData[i];
                var hasExists = false;
                var ParimaryKeyValue = RowData["FSourceInterId"] + "_" + RowData["FSourceEntryID"] + "_" + RowData["FEntryID"];
                if (RowData["FSourceInterId"] == "0")
                    ParimaryKeyValue = RowData["FInterID"] + "_" + RowData["FEntryID"] + "_" + RowData["FEntryID"];
                for (var n = 0, m = me.EntryData.length; n < m; n++) {
                    var oldRowData = me.EntryData[n];
                    var EntryPKey = oldRowData["FSourceInterId"] + "_" + oldRowData["FSourceEntryID"] + "_" + oldRowData["FEntryID"];
                    if (oldRowData["FSourceInterId"] == "0")
                        EntryPKey = oldRowData["FInterID"] + "_" + oldRowData["FEntryID"] + "_" + oldRowData["FEntryID"];
                    if (ParimaryKeyValue == EntryPKey) {

                        //if (isDD) {
                        //    数量等于 原先加上现在的
                        //    var Fauxqty = parseInt(RowData["Fauxqty"]) + parseInt(oldRowData["Fauxqty"]);
                        //    RowData["Fauxqty"] = Fauxqty;
                        //    ParimaryKeyValue_Fauxqty[ParimaryKeyValue] = Fauxqty;
                        //    PrimaryArr.push(ParimaryKeyValue);

                        //}


                        me.EntryData.splice(n, 1, RowData);
                        hasExists = true;
                        break;
                    }
                }

                if (!hasExists && me.AllowAdd) {
                    //追加一条
                    me.EntryData.push(RowData);
                }
            }


            for (var i = 0, j = NewTableData.length; i < j; i++) {
                var RowData = NewTableData[i];
                var ParimaryKeyValue = RowData["FDataKey"]["DefaultValue"]["SaveValue"];

                var hasExists = false;
                for (var n = 0, m = me.TableData.length; n < m; n++) {
                    var oldRowData = me.TableData[n];
                    var TablePKey = oldRowData["FDataKey"]["DefaultValue"]["SaveValue"];
                    if (ParimaryKeyValue == TablePKey) {
                        //if (isDD) {
                        //    //数量等于 原先加上现在的
                        //    var Qty = parseInt(RowData["FScanQty"]["DefaultValue"]["SaveValue"]) + parseInt(oldRowData["FScanQty"]["DefaultValue"]["SaveValue"]);
                        //    RowData["FScanQty"]["DefaultValue"]["DisplayValue"] = RowData["FScanQty"]["DefaultValue"]["SaveValue"] = Qty;

                        //}
                        var OldRow = document.getElementById(me.IDPrefix + ParimaryKeyValue);
                        if (OldRow) {
                            var rowindex = OldRow.getAttribute("rowindex");
                            var NewRow = me._CreateListRow(RowData, me.ListTable, null, parseInt(rowindex), false);
                            OldRow.parentNode.replaceChild(NewRow, OldRow);
                        }
                        me.TableData.splice(n, 1, RowData);
                        hasExists = true;
                        break;
                    }
                }

                if (!hasExists && me.AllowAdd) {
                    try{
                        var theRow = me._CreateListRow(RowData, me.ListTable, null, me.ListTable.rows.length, false);
                    }catch(ex){
                        alert(ex.message);
                    }
                    me.ListTable.appendChild(theRow);
                    me.TableData.push(RowData);
                }
            }


            for (var i = 0, j = NewDetailSource.length; i < j; i++) {
                var RowData = NewDetailSource[i];
                var ParimaryKeyValue = RowData["FDataKey"]["DefaultValue"]["SaveValue"];
                var hasExists = false;
                for (var n = 0, m = me.DetailData.length; n < m; n++) {
                    var oldRowData = me.DetailData[n];
                    var TablePKey = oldRowData["FDataKey"]["DefaultValue"]["SaveValue"];
                    if (ParimaryKeyValue == TablePKey) {
                        //if (isDD) {
                        //    //数量等于 原先加上现在的
                        //    var Qty = parseInt(RowData["FScanQty"]["DefaultValue"]["SaveValue"]) + parseInt(oldRowData["FScanQty"]["DefaultValue"]["SaveValue"]);
                        //    RowData["FScanQty"]["DefaultValue"]["DisplayValue"] = RowData["FScanQty"]["DefaultValue"]["SaveValue"] = Qty;

                        //}
                        me.DetailData.splice(n, 1, RowData);
                        break;
                    }
                }

                if (!hasExists && me.AllowAdd) {
                    me.DetailData.push(RowData);
                }
            }

            if (me.CurSelectedprimarykey != null) {
                var currTr = document.getElementById(me.IDPrefix + me.CurSelectedprimarykey);
                if (currTr) {
                    me.BindDetaiDataByKey(me.CurSelectedprimarykey);
                    currTr.className = "pad-selected";
                }
            }


            //if (PrimaryArr.length > 0 && isDD) {
            //    var ModifyFields = [];
            //    for (var i = 0, j = PrimaryArr.length; i < j; i++) {
            //        var pk = PrimaryArr[i];
            //        ModifyFields.push({
            //            "DataIndex": pk,
            //            "FieldKey": "FScanQty",
            //            "DisplayValue": ParimaryKeyValue_Fauxqty[pk],
            //            "SaveValue": ParimaryKeyValue_Fauxqty[pk]
            //        });
            //    }

            //    if (me._SMDDChangeCallBack) {
            //        var ChangeData = me._CreateChangeDataByPkeyArr(PrimaryArr);
            //        ChangeData.ModifyFields = ModifyFields;
            //        me._SMDDChangeCallBack(ChangeData);
            //    }

            //}

            return me;
        },
        //扫描订单二维码
        SetDD: function (DDData) {
            var me = this;
            if (DDData.Result == 0) {
                return;
            }
            me.UpDate(DDData, true);
            return me;
        },
        //扫描物料二维码
        SetWL: function (WLData) {
            //FScanQty
            var me = this;
            if (WLData.Result == 0) {
                return;
            }
            me.UpDate(WLData);
            //var ModifyFields = [];
            //var PrimaryArr = [];
            //for (var i = 0, j = WLData.Data.length; i < j; i++) {
            //    var CurData = WLData.Data[i];
            //    var FItemID = CurData["FItemID"];
            //    var FAuxQty = CurData["FAuxQty"];
            //    var FStockID = CurData["FStockID"];
            //    var FSPID = CurData["FSPID"];
            //    var FBatchNo = CurData["FBatchNo"];

            //    // FItemID FStockID > FSPID > FBatchNo
            //    for (var n = 0, m = me.TableData.length; n < m; n++) {
            //        var CurEntryData = me.TableData[n];
            //        var oldQty = parseInt(CurEntryData["FScanQty"]["DefaultValue"]["SaveValue"]) || 0;
            //        var PrimariKey = CurEntryData["FDataKey"]["DefaultValue"]["SaveValue"];
            //        if (CurEntryData["FItemID"] == FItemID) {
            //            if (FStockID && !FSPID && !FBatchNo) {
            //                if (CurEntryData["FStockID"] == FStockID) {
            //                    PrimaryArr.push(PrimariKey);
            //                    ModifyFields.push(
            //                        {
            //                            "FieldKey": "FScanQty",
            //                            "DisplayValue": (oldQty + FAuxQty),
            //                            "SaveValue": (oldQty + FAuxQty)
            //                        }
            //                    );
            //                    break;
            //                }

            //            }

            //            if (FStockID && !FSPID && FBatchNo) {
            //                if (CurEntryData["FBatchNo"] == FBatchNo && CurEntryData["FStockID"] == FStockID) {
            //                    PrimaryArr.push(PrimariKey);
            //                    ModifyFields.push(
            //                        {
            //                            "FieldKey": "FScanQty",
            //                            "DisplayValue": (oldQty + FAuxQty),
            //                            "SaveValue": (oldQty + FAuxQty)
            //                        }
            //                    );
            //                    break;
            //                }

            //            }

            //            if (FStockID && FSPID && !FBatchNo) {
            //                if (CurEntryData["FStockID"] == FStockID && CurEntryData["FSPID"] == FSPID) {
            //                    PrimaryArr.push(PrimariKey);
            //                    ModifyFields.push(
            //                        {
            //                            "FieldKey": "FScanQty",
            //                            "DisplayValue": (oldQty + FAuxQty),
            //                            "SaveValue": (oldQty + FAuxQty)
            //                        }
            //                    );
            //                    break;
            //                }
            //            }

            //            if (FStockID && FSPID && FBatchNo) {
            //                if (CurEntryData["FBatchNo"] == FBatchNo && CurEntryData["FStockID"] == FStockID && CurEntryData["FSPID"] == FSPID) {
            //                    PrimaryArr.push(PrimariKey);
            //                    ModifyFields.push(
            //                        {
            //                            "FieldKey": "FScanQty",
            //                            "DisplayValue": (oldQty + FAuxQty),
            //                            "SaveValue": (oldQty + FAuxQty)
            //                        }
            //                    );
            //                    break;
            //                }
            //            }

            //            if (!FStockID && !FSPID && FBatchNo) {
            //                if (CurEntryData["FBatchNo"] == FBatchNo) {
            //                    PrimaryArr.push(PrimariKey);
            //                    ModifyFields.push(
            //                        {
            //                            "FieldKey": "FScanQty",
            //                            "DisplayValue": (oldQty + FAuxQty),
            //                            "SaveValue": (oldQty + FAuxQty)
            //                        }
            //                    );
            //                    break;
            //                }
            //            }

            //            if (!FStockID && !FSPID && !FBatchNo) {
            //                PrimaryArr.push(PrimariKey);
            //                ModifyFields.push(
            //                    {
            //                        "FieldKey": "FScanQty",
            //                        "DisplayValue": (oldQty + FAuxQty),
            //                        "SaveValue": (oldQty + FAuxQty)
            //                    }
            //                );
            //                break;
            //            }

            //        }
            //    }

            //}

            //if (PrimaryArr.length == 0) {
            //    alert("没有匹配的物料");
            //    return;
            //}

            //if (me._ChangeCallBack) {
            //    var ChangeData = me._CreateChangeDataByPkeyArr(PrimaryArr);
            //    ChangeData.ModifyFields = ModifyFields;
            //    me._ChangeCallBack(ChangeData);
            //}

            return me;

        },
        //扫描仓库二维码
        SetCKCW: function (CKCWData) {
            var me = this;
            if (CKCWData.Result == 0) {
                return;
            }
            me.UpDate(CKCWData);

            //var ckdm = CKCWData.Data[0]["StockID"];
            //if (!ckdm) {
            //    //alert("扫描信息中不包括仓库代码");
            //    return;
            //}
            //var cwdm = CKCWData.Data[0]["StockPlaceID"];
            //if (!cwdm) {
            //    //alert("扫描信息中不包括仓位代码");
            //    return;
            //}

            //var ckmc = null, cwmc = null;
            //for (var i = 0, j = me.CKCWData.length; i < j; i++) {
            //    var CKData = me.CKCWData[i];
            //    var CWArr = CKData["StockPlaceData"];
            //    if (CKData["primarykey"] == ckdm) {
            //        ckmc = CKData["FName"];
            //        for (var n = 0, m = CWArr.length; n < m; n++) {
            //            var CWData = CWArr[n];
            //            if (cwdm == CWData["FSPID"]) {
            //                cwmc = CWData["FSPName"];
            //            }
            //        }
            //    }
            //}

            //if (me._ChangeCallBack) {
            //    me.getCheckedPrimaryKeys();
            //    var Arr = (!me.DeleteArr || me.DeleteArr.length == 0) ? [me.CurSelectedprimarykey] : me.DeleteArr;
            //    if (Arr[0] == null) {
            //        return;
            //    }
            //    var ChangeData = me._CreateChangeDataByPkeyArr(Arr);
            //    ChangeData.ModifyFields = [{
            //        "FieldKey": "FDCStockID",
            //        "DisplayValue": ckmc,
            //        "SaveValue": ckdm
            //    }, {
            //        "FieldKey": "FDCSPID",
            //        "DisplayValue": cwmc,
            //        "SaveValue": cwdm
            //    }];

            //    me._ChangeCallBack(ChangeData);
            //}

            return me;
        },
        GetEntryKey: function () {
            var that = this;
            var tmp = that.EntryData;

            var arr = [];

            for (var i = 0; i < tmp.length; i++) {
                var key = tmp[i]["FSourceInterId"] + "_" + tmp[i]["FSourceEntryID"] + "_" + tmp[i]["FEntryID"];
                if (tmp[i]["FSourceInterId"] == "0")
                    key = tmp[i]["FInterID"] + "_" + tmp[i]["FEntryID"] + "_" + tmp[i]["FEntryID"];
                arr.push(key);
            }

            return arr;
        },

        GetChoseKeys: function(){
            var me = this;
            me.getCheckedPrimaryKeys();
            var Arr = (!me.DeleteArr || me.DeleteArr.length == 0) ? null : me.DeleteArr;
            return Arr;
        },

        destroy: function () {
            var that = this;
            //清除scrollers
            if(that.ModifyDialog)
                that.ModifyDialog.destroy();
            if(that.DeleteDialog)
                that.DeleteDialog.destroy();
        }
    }

})(window);
/**
* Created by pc on 2015/3/23.
*/
