/*
 * 基础资料的显示，选择界面插件,此插件需要配合 utils.js 来使用
 * 考虑到 iSCroll 在低配置的安卓系统中性能较差的问题，
 * 故滚动采用安卓原生的滚动，对于数据量较大是的处理方式
 * 支持链式的写法
 * 
 * hongbo_liang@kingdee.com 
 * 2015-04-21
 */

 (function (window, document, Math) {
 	"use strict"
    //touch 事件
	var isIDevice = (/iphone|ipad/gi).test(navigator.appVersion);
	var DURATION = 'webkitTransitionDuration';
	var TRANSITION_END = 'webkitTransitionEnd';
	var TRANSFORM = 'webkitTransform';

	var sw = window.innerWidth;
	var touchable = 'ontouchstart' in window;
	var TOUCHSTART = touchable ? 'touchstart': 'mousedown';
	var TOUCHMOVE = touchable ? 'touchmove': 'mousemove';
	var TOUCHEND = touchable ? 'touchend' : 'mouseup';

    var utils = (function(){
    	var me = {};     

        var copyIsArray, 
        toString = object.prototype.toString,
        hasOwn = object.prototype.hasOwnProperty;   

        class2Type = {
           '[object Boolean]' : 'boolean',
           '[object Number]' : 'number',
           '[object String]' : 'string',
           '[object Function]' : 'function',
           '[object Array]' : 'array',
           '[object Date]' : 'date',
           '[object RegExp]' : 'regExp',
           '[object Object]' : 'object'
        }   

        //将对象进行转换
        type = function (obj) {
             return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"; 
        }     

        //判断是否是 window 对象
        isWindow = function(obj){
            return obj && typeof obj === "object" && "setInterval" in obj;
        }

        //若浏览器中存在 isArray 函数直接调用浏览器的，否则调用自定义的
        isArray = Array.isArray || function(obj){
            return type(obj) == "array";
        }

        isPlainObject = function(obj) { 
            if (!obj || type(obj) !== "object" || obj.nodeType || isWindow(obj)) { 

               return false; 
            } 

           if (obj.constructor && !hasOwn.call(obj, "constructor") 
                    && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) { 
                return false; 
            } 
      
            var key; 

            for (key in obj) { 

            } 
            return key === undefined || hasOwn.call(obj, key); 
        }

    	return me;
    })();

    //只做对象的创建
    function KPlugin = function (el, options) {
    	//若不进行元素的传入的状态下，则新增一个容器
    	if(el != ""){
    		this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
    	}else{
    		this.wrapper = document.createElement('div');
    	}

        //用于存放格式化好后的数据
        this.dataHash = {};

    	this.options = {
    		useTransition: true,
    		userTransform: true,
    	};

    	for(var i in options){
    		this.options[i] = options[i];
    	}

    	this.options.useTransition = utils.hasTransition && this.options.useTransition;
        this.options.useTransform = utils.hasTransform && this.options.useTransform;
    }

    //对外的接口不使用下划线
    KPlugin.prototype = {
    	version: '0.0.1',

        //初始化 DOM 结构
    	_init: function(){
            
    		//给当前整个容器进行添加事件监听
    		this._initEvents();
    	},

        //方便数据的统一将得到的数据进行统一化，转换成为 key：value 的方式
        _initData: function(){

        },

        //过滤接口，将过滤的条件存放到 localStorage 中存放的格式，{type: "stock",filter:{}}
        _filter: function(){
            var me = this;

            //获取过滤条件
            var filter = $s.cache.getItem('_kplugin_filter');

            return me;
        },

        //修改过滤条件
        _change_filter: function(){

        },

        /*
         * 插件初始化接口
         * 出入必要的参数
         */
        init: function(option){
            var me = this;

            me.dataHash = option.data;

            return me;
        },

    	//插件内容显示
    	show: function(){
            var me = this;
            return me;
    	},
        
    	//插件内容隐藏
    	hide:function(){
            var me = this;
            return me;
        },

        //返回插件中当前选中的数据，可为多条数据，因此返回的是一个list对象
        receive: function(){
            var me = this;

            return Text;
        },

        //用于继承和拓展插件，另外可以使用 apply 进行函数的拷贝来实现
        extend: function(deep,target,options){
            var me = this;

            var copyIsArray, 
            toString = object.prototype.toString,
            hasOwn = object.prototype.hasOwnProperty;

            for(name in options){
                src = target[name];
                copy = options[name];
            

                if(target == copy){
                    continue;
                }

                if(deep && copy
                    && (utils.isPlainObject(copy) || (copyIsArray == utils.isArray(copy)))){
                    if(copyIsArray){
                        copyIsArray = false;
                        clone = src && utils.isArray(src) ? src : [];
                    }else{
                        clone = src && utils.isPlainObject(src) ? src : {}; 
                    }

                     target[name] = me.extend(deep, clone, copy); 
                }else if(copy !== "undefined"){
                    target[name] = copy;
                }
            }

            return target;
        }
    };

    //公共私有方法
    window.KPlugin = KPlugin;

})(window, document, Math);



// table {
//     border-collapse: collapse;
//     /*margin-bottom: 3em;*/
//     width: 100%;
//     background: #fff;
// }

// td, th {
//     padding: 5px;
//     /*display: inline-block;*/
//     text-align: center;
//     overflow: hidden;
//     white-space: nowrap;
//     text-overflow: ellipsis;
//  /*   border-right: 1px solid gray;
//     border-bottom: 1px solid gray;*/
//     display: table-cell;
//     box-sizing: border-box;
// }

//     td[data-editable="true"] {
//         background: #ffffe0;
//     }

// tbody tr:nth-child(2n-1) td[data-editable="true"] {
//     background: #fffacd;
// }

//     td[data-editable="true"].err,tbody tr:nth-child(2n-1) td[data-editable="true"].err{
//         background-color: #e992b9;
//         color: #fff;
//         font-size: 0.75em;
//         text-align: center;
//         line-height: 1;
//     }

// th {
//     /*BUG： 2015-04-13 hongbo_liang 修改表格样式*/
//     background-color: #31bc86;
//     font-weight: bold;
//     color: #fff;
// }

// tbody th {
//     /*background-color: #2ea879;*/
//     background-color: transparent;
// }

// tbody td input {
//     width: 100%;
//     border: none;
//     background: #e0ffff;
// }

// tbody tr:nth-child(2n-1) {
//     background-color: #f5f5f5;
//     transition: all .125s ease-in-out;
// }

// tbody tr:hover, tbody tr .selected {
//     background-color: rgba(129,208,177,.3);
// }


// .intro table {
//     border-collapse: collapse;
//     table-layout: fixed;
//     background-color: white;
//     position: relative;
//     font-size: 13px;
// }

// .intro table tr{    
// }

// .intro table th,.intro table td{
//     border-right: 1px solid gray;
//     border-bottom: 1px solid gray;
//     text-align: center;
//     overflow: hidden;
//     white-space: nowrap;
//     text-overflow: ellipsis;
//     display: table-cell;
//     background-color: #fff;
//     font-weight: normal;
//     color: gray;
// }


// /* For appearance */
// .sticky_wrap {
//     overflow-x: auto;
//     overflow-y: hidden;
//     position: relative;
//     margin: 3em 0;
//     width: 100%;
// }

//     .sticky_wrap .sticky_thead,
//     .sticky_wrap .sticky_col,
//     .sticky_wrap .sticky_intersect {
//         opacity: 0;
//         position: absolute;
//         top: 0;
//         left: 0;
//         transition: all .125s ease-in-out;
//         z-index: 50;
//         width: auto; /* Prevent table from stretching to full size */
//     }

//     .sticky_wrap .sticky_thead {
//         /*box-shadow: 0 0.25em 0.1em -0.1em rgba(0,0,0,.125);*/
//         z-index: 100;
//         width: 100%; /* Force stretch */
//     }

//     .sticky_wrap .sticky_intersect {
//         opacity: 1;
//         z-index: 150;
//     }

//         .sticky_wrap .sticky_intersect th {
//             background-color: #666;
//             color: #eee;
//         }

//     .sticky_wrap td,
//     .sticky_wrap th {
//         box-sizing: border-box;
//     }

//     .sticky_wrap.overflow_y {
//         overflow-y: auto;
//         max-height: 50vh;
//     }



// .fixed_headers {
// /*    table-layout: fixed;
//     border-collapse: collapse;*/
// }


//     .fixed_headers thead tr {
//         /*display: block;*/
//         position: relative;
//     }

//     .fixed_headers tbody {
//         /*display: block;*/
//         overflow: auto;
//         width: 100%;
//     }

