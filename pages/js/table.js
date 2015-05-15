/*
 * hongbo_liang@kingdee.com
 * 构建适合移动端的table插件
 * 只能在webkit的浏览器中使用其他环境暂时没有进行测试
 * options中 fixed：true 冻结表头，若为 false 这表示生成普通表格，不进行冻结，fixedcol:[1,2] 若该写上则冻结对应的列
 * fiexdrow: [1,2 ..] 冻结对应的行数据
 */

(function(window, document, undefined) {
	"use strict";
	var coolTableProto;

	var coolTable = function(element, options) {
		if ((this.element = (typeof(element) === "string") ? $(element) : element)) {
			this.css = { idRulePrefix : "#" + this.element.id + " ", sheet : null, rules : {} };
			this.columns = 0;
			this.columnWidths = [];
			this.cellData = { head : [], body : [], foot : [] };
			this.alignTimer = null;
			this.rawData = [];
			this.sortCache = {};
			this.lastSortedColumn = [-1, null];
			this.selectedIndexes = [];
			this.usesTouch = (window.ontouchstart !== undefined);
			this.startEvt = (this.usesTouch) ? "touchstart" : "mousedown";
			this.moveEvt = (this.usesTouch) ? "touchmove" : "mousemove";
			this.endEvt = (this.usesTouch) ? "touchend" : "mouseup";
			this.setOptions(options);
			this.init();
		}
	};

	(coolTableProto = coolTable.prototype).nothing = function();

	coolTableProto.setOptions = function(options){
		var hasOwnProp = Object.prototype.hasOwnProperty, option;

		this.options = {
			srcType : "", // "dom", "json", "xml"
			srcData : "", 
			allowGridResize : false, 
			allowColumnResize : false, 
			allowClientSideSorting : false, 
			allowSelections : false, 
			allowMultipleSelections : false, 
			showSelectionColumn : false, 
			onColumnSort : this.nothing, 
			onResizeGrid : this.nothing, 
			onResizeGridEnd : this.nothing, 
			onResizeColumn : this.nothing, 
			onResizeColumnEnd : this.nothing, 
			onRowSelect : this.nothing, 
			onLoad : this.nothing, 
			supportMultipleGridsInView : false, 
			fixedCols : 0, 
			selectedBgColor : "#eaf1f7", 
			fixedSelectedBgColor : "#dce7f0", 
			colAlign : [], // "left", "center", "right"
			colBGColors : [], 
			colSortTypes : [], // "string", "number", "date", "custom", "none"
			customSortCleaner : null
		};

		if(options){
			for(option in this.options){
				if(hasOwnProp.call(this.options,option) && options[option] !== undefined){
					this.options[option] = options[option];
				}
			}
		}

		this.options.allowColumnResize = this.options.allowColumnResize && !this.usesTouch;
		this.options.allowMultipleSelections = this.options.allowMultipleSelections && this.options.allowSelections;
		this.options.showSelectionColumn = this.options.showSelectionColumn && this.options.allowSelections;
		this.options.fixedCols = (!this.usesTouch)? this.options.fixedCols: 0;
	};

	coolTableProto.init = function(){
		var srcType = this.options.srcType,
		srcData = this.options.srcData,
		data;

		this.generateSkeleton();
		this.addEvents();
		
			
		// JSON: 只支持json数据格式
		if (srcType === "json" && (data = parseJSON(srcData))) {
			this.convertData(data);			
		} 
		
		this.generateGrid();
		this.displayGrid();
	};

	//完成数据的转换
	coolTableProto.convertData = function(data){
		var base, cols, h, b, f;

		this.addSelectionColumns(data);
		this.rowData = data.Body || [];

		if((base = data.Head) || data.Body || data.Foot || null){
			cols = this.columns = base[0].length;
			h = this.cellData.head;
			b = this.cellData.body;
			f = this.cellData.foot;

			while(cols){
				h[--cols] = [];
				b[cols] = [];
				f[cols] = [];
			}

			cols = this.columns;

			if(data.Head){

			}else{

			}

			if(data.Body){

			}else{

			}

			if(data.Foot){

			}else{

			}
		}
	};

	coolTableProto.convertDataItem = function(arr, rows, rowClass, cols, allowColumnResize){
		var rowsIdx = rows.length;
	};

	coolTableProto.generateGrid = function(){

	};

	coolTableProto.displayGrid = function(){

	};

	var $ = function(elemId){return document.getElementById(elemId);},
		slice = Array.prototype.slice,
		msie = getIEVersion();

	window.coolTable = coolTable;

 })(window, document, Math);