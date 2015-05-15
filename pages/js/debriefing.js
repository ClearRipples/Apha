/*
 * hongbo_liang@kingdee.com
 * 使用js的严格模式，插件需要结合 utils.js 来使用，里面有基本的公用方法
 * 插件内部私有的函数统一添加前缀 “_” 如“_init”
 * 插件中的原型链命名上统一添加 proto后缀 如 “DebriefingProto”
 * 统一将私有方法放到后面并用 
 * 	//////////////////////////////////
	//
	// Utility Methods
	//
	//////////////////////////////////////////////////////////////////////////////////
	进行分割，并在函数的声明上统一使用匿名的命名方法如： “”
 *  在插件中使用的数据统一使用 键值对的方式，所以在进行初始化之前应该做好数据的转换统一转换成为
 *  请在每个方法前添加注释
 */

(function(window, document, undefined) {
	"use strict";

	var DebriefingProto;
	function Debriefing(element,options){
		if ((this.element = (typeof(element) === "string") ? $(element) : element)) {
			
			//移动端的一些属性，没有用到可以忽略
			this.usesTouch = (window.ontouchstart !== undefined);
			this.startEvt = (this.usesTouch) ? "touchstart" : "mousedown";
			this.moveEvt = (this.usesTouch) ? "touchmove" : "mousemove";
			this.endEvt = (this.usesTouch) ? "touchend" : "mouseup";

			this.setOptions(options);
			this.init();
		}
    }

	(DebriefingProto = Debriefing.prototype).nothing = function(){};

	///////////////////////////////////
	DebriefingProto.setOptions = function(options){
		var hasOwnProp = Object.prototype.hasOwnProperty, 
		option;

		this.options = {
			//插件中需要自定义的属性，如有特殊需要告知
		}

		if (options) {
			for (option in this.options) {
				if (hasOwnProp.call(this.options, option) && options[option] !== undefined) {
					this.options[option] = options[option];
				}
			}
		}
	};

	//////////////////////////////////
	//DOM初始化以及数据的初始化
	DebriefingProto.init = function)(){

	};

	//////////////////////////////////
	DebriefingProto.initAttribute = function(type){
		//TODO: 将插件中使用到的数据按类型分别转换成为键值对的形式
	};

	

	//////////////////////////////////
	//
	// 所有插件中都需要进行曝光的方法
	//
	//////////////////////////////////
	//在初始化时进行数据的绑定
	DebriefingProto.BindData = function(){

	};

	//////////////////////////////////
	//单据内容发生改变（手动进行修改时），进行回调的接口
	DebriefingProto.ChangeCallBack = function(callback){

	};

	//////////////////////////////////
	//扫描订单的时候的回调方法
	DebriefingProto.SMDDChangeCallBack = function(callback){

	};

	//////////////////////////////////
	//提交数据的回调方法
	DebriefingProto.SubmitCallBack = function(data){
		
	};

	/////////////////////////////////
	//扫描订单的时候进行调用
	DebriefingProto.SetDD = function(data){

	};

	////////////////////////////////
	//扫描物料的时候进行调用
	DebriefingProto.SetWL = function(data){

	};

	////////////////////////////////
	//扫描仓库仓位的时候调用
	DebriefingProto.SetCKCW = function(data){
		
	};

	//////////////////////////////////
	//
	// Utility Methods
	//
	//////////////////////////////////////////////////////////////////////////////////
	//TODO: 这里之后是填写插件中的私有的公共方法

	//将插件进行曝光
    window.Debriefing = Debriefing;
})(window, document, undefined);