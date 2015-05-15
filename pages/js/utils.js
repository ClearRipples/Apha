// normalize
var isIDevice = (/iphone|ipad/gi).test(navigator.appVersion);
var DURATION = 'webkitTransitionDuration';
var TRANSITION_END = 'webkitTransitionEnd';
var TRANSFORM = 'webkitTransform';

var sw = window.innerWidth;
var touchable = 'ontouchstart' in window;
var TOUCHSTART = touchable ? 'touchstart': 'mousedown';
var TOUCHMOVE = touchable ? 'touchmove': 'mousemove';
var TOUCHEND = touchable ? 'touchend' : 'mouseup';
//当进行数据修改时，请更新版本，同时修改qrcode.manifest中的VERSION
//清除本地缓存数据，应当进行角色的判断
var version = '0.0.4';

(function() {
    function tmpl(_t, data) {
        var _data = [],
            v = {};
        v.last = _t.replace(/([\s\S]*?)(?:<%((?:\=|\$\/)?)([\s\S]*?)%>)/g, function (m, s, t, c, i) {
            v["s_" + i] = s;
            _data.push("res.push(v.s_" + i + ");");
            if (t === "=") {
                _data.push("res.push(" + c.trim() + ");");
            } else {
                _data.push(c.trim());
            }
            return "";
        });
        try {
            var _ = new Function("data", "res", "v", _data.join("") + "res.push(v.last);return String.prototype.concat.apply('', res);").toString();
            return eval("(" + _ + ")")(data || {}, [], v);
        } catch (e) {
            console.error("Template Error.", e);
            console.log(_);
        }
    };

    String.prototype.tmpl = function (data) {
        return tmpl(this, data);
    };

    String.prototype.trim = function () {
        return this.replace(/(^\s*)|(\s*$)/g, '');
    };

    String.prototype.ltrim = function () {
        return this.replace(/(^\s*)/g, '');
    };

    String.prototype.rtrim = function () {
        return this.replace(/(\s*$)/g, '');
    };

    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g,
            function (m, i) {
                return args[i];
            });
    };

    Array.prototype.indexOf = function (val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == val) return i;
        }
        return -1;
    };
    //计算数组中的最大值
    Array.prototype.max = function () {
        return Math.max.apply({}, this)
    }

    //计算数组中的最小值
    Array.prototype.min = function () {
        return Math.min.apply({}, this)
    }

    //复制数组
    Array.prototype.copy =
      function () {
          return [].concat(this);
      };

    //去除数组中只指定元素，只能去除一个，如果想多个，之前先用unique处理
    Array.prototype.remove = function (value) {
        for (var i = 0, len = this.length; i < len; i++) {
            if (this[i] == value) {
                this.splice(i, 1);
                break;
            }
        }

        return this;
    }

    //去除数组中只指定元素，只能去除一个，如果想多个，之前先用unique处理
    Array.prototype.inArray = function (value) {
        var index = -1;
        each(this, function (v, k) {
            if (v == value) {
                index = k;
                return false;
            }
        })

        return index;
    }

    //去除数组中的重复元素
    Array.prototype.unique = function () {
        var rst = [];
        each(this, function (v, k) {
            if (rst.inArray(v) < 0) rst.push(v);
        })
        return rst;
    }

    var _re_date_format = /(Y{2,4})|(M{1,2})|(D{1,2})|(h{1,2})|(m{1,2})|(s{1,2})/g;
    Date.prototype.format = function(fo) {
        if (fo) {
            var date = this;
            return fo.replace(_re_date_format, function(ma, Y, M, D, h, m, s) {
                if (Y) {
                    return date.getFullYear().toString().substr(-Y.length);
                }
                if (M) {
                    return ("00" + (date.getMonth() + 1).toString()).substr(-M.length);
                }
                if (D) {
                    return ("00" + date.getDate().toString()).substr(-D.length);
                }
                if (h) {
                    return ("00" + date.getHours().toString()).substr(-h.length);
                }
                if (m) {
                    return ("00" + date.getMinutes().toString()).substr(-m.length);
                }
                if (s) {
                    return ("00" + date.getSeconds().toString()).substr(-s.length);
                }
                return "";
            });
        } else {
            return this.toLocaleDateString();
        }
    }; 

    //判断val在数组arr中是否存在
    $s.in_array = function (val, arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == val)
                return true;
        }
        return false;
    };

    var clone = function(o) {
        var newObj = (o instanceof Array) ? [] : {};
        for (var i in o) {
            if (o[i] && typeof o[i] == "object") {
                newObj[i] = clone(o[i]);
            } else {
                newObj[i] = o[i];
            }
        }
        return newObj;
    };
    $s.clone = clone;

    function isEmptyObject(o) {
        for (var key in o) {
            return false;
        }
        return true;
    };

    $s.isEmptyObject = isEmptyObject;

    // selector

    function $s(rule) {
        var res;
        if (rule[0] === '#') {
            res = document.getElementById(rule.substr(1));
        } else {
            res = document.querySelector(rule);
        }
        return res;
    };

    function $ss(rule) {
        return document.querySelectorAll(rule);
    };

    // css
    function hasClass(el, c) {
        var cs = el.className;
        if (!cs) {
            return false;
        }
        
        cs = cs.split(' ');
        return (cs.indexOf(c) >= 0);
    }
    
    function addClass(el, c) {
        var oc = el.className,
            nc = '';
        if (/\S+/.test(oc)) {
            nc = oc.concat(' ' + c);
        } else {
            nc = c;
        }
        el.className = nc;
    }

    function removeClass(el, c) {
        var oc = el.className;
        var arr = oc.split(' '),
            temp = [];
        for (var i = 0, j = arr.length; i < j; i++) {
            if (arr[i] !== c) {
                temp.push(arr[i]);
            }
        }
        el.className = temp.join(' ');
    }

    function swapClass(el, o, c) {
        var oc = el.className;
        var arr = oc.split(' '),
            temp = [];
        for (var i = 0, j = arr.length; i < j; i++) {
            if (arr[i] === o) {
                temp.push(c);
            } else {
                temp.push(arr[i]);
            }
        }

        el.className = temp.join(' ');
    }
    
    $s.hasClass = hasClass;
    $s.addClass = addClass;
    $s.removeClass = removeClass;
    $s.swapClass = swapClass;


    var each = function (object, callback) {
        if (undefined === object.length) {
            for (var name in object) {
                if (false === callback(object[name], name, object)) break;
            }
        } else {
            for (var i = 0, len = object.length; i < len; i++) {
                if (i in object) { if (false === callback(object[i], i, object)) break; }
            }
        }
    }

    $s.each = each;

    //DOM 添加移除替换操作
    function placeNode(node, fn, __this) {
        fn.call(__this, frag(node));
        return __this;
    }

    function append(node, newNode) {
        return placeNode(newNode, function (one) { node.appendChild(one) }, node);
    }

    function preappend(node, newNode) {
        return placeNode(newNode, function (one) { node.insertBefore(one, node.firstChild) }, node);
    }

    function before(node, newNode) {
        return placeNode(newNode, function (one) { node.parentNode.insertBefore(one, node) }, node);
    }

    function after(node, newNode) {
        //如果node有下一个节点的话,newNode 插入到node.nextSibling的前面
        //如果node没有下一个节点,newNode插入为node.parentNode的最后一个子
        if (node.nextSibling) {
            placeNode(newNode, function (one) { node.parentNode.insertBefore(one, node.nextSibling) }, node);
        } else {
            placeNode(newNode, function (one) { node.parentNode.appendChild(one) }, node);
        }
        return node;
    }

    //如果新节点是页面中已经存在的则新节点原来的位置会消失
    function replaceNode(newNode, node) {
        node.parentNode.replaceChild(newNode, node);
    }

    function delNode(node) {
        node.parentNode.removeChild(this);
    }
    function frag(nodes) {
        var tempFrag = document.createDocumentFragment();
        if (nodes.nodeType) { nodes = [nodes]; }

        /*    错误的写法 传入的是引用
        each(nodes,function(node){
            tempFrag.appendChild(node);
        })*/

        for (var i = 0; i < nodes.length; i++) {
            //克隆后不在是引用
            var a = nodes[i].cloneNode(true);
            (function (node) {
                tempFrag.appendChild(node);
            })(a)
        }

        /*    
            while(nodes.length>0)
            {
                tempFrag.appendChild(nodes[0]);
                alert(nodes.length);
            }
        */

        return tempFrag;
    }

    $s.placeNode = placeNode;
    $s.append = append;
    $s.prepend = preappend;
    $s.before = before;
    $s.after = after;
    $s.replaceNode = replaceNode;
    $s.removeNode = delNode;  

    HTMLElement.prototype.wrap = function (elms) {
        // Convert `elms` to an array, if necessary.
        if (!elms.length) elms = [elms];

        // Loops backwards to prevent having to clone the wrapper on the
        // first element (see `child` below).
        for (var i = elms.length - 1; i >= 0; i--) {
            var child = (i > 0) ? this.cloneNode(true) : this;
            var el = elms[i];

            // Cache the current parent and sibling.
            var parent = el.parentNode;
            var sibling = el.nextSibling;

            // Wrap the element (is automatically removed from its current
            // parent).
            child.appendChild(el);

            // If the element had a sibling, insert the wrapper before
            // the sibling to maintain the HTML structure; otherwise, just
            // append it to the parent.
            if (sibling) {
                parent.insertBefore(child, sibling);
            } else {
                parent.appendChild(child);
            }
        }
    };
    // ajax

    function ajax(options) {
        var xhr = new XMLHttpRequest(),
            complete = false;

        if ('timeout' in options) {
            options.timer = setTimeout(function() {
                xhr.abort();

                options.timeout.callback && options.timeout.callback();
            }, options.timeout.time * 1000);
        }

        if (options.method === 'POST') {
            xhr.open('POST', options.url, 'sync' in options ? options.sync : true);
            xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        } else {
            options.url = options.url + '?' + (options.plus ? options.plus + '&' : '') + encodeURI(JSON.stringify(options.params));
            xhr.open('GET', options.url, 'sync' in options ? options.sync : true);
        }

        xhr.onreadystatechange = function () {
            var status = xhr.status;
            var response = undefined;

            options.progress && options.progress(xhr.readyState * 25);

            if (xhr.readyState === 4) {
                if ('timer' in options) {
                    clearTimeout(options.timer);
                    delete options.timer;
                }

                if (xhr.status === 200 || xhr.status === 304) {
                    response = JSON.parse(xhr.responseText);
                    if (parseInt(response.Result) === 1) {
                        //if('mbid' in response)
                        //    $s.setUid(response['mbid']);
                        options.success && options.success.call(xhr, response);
                    } else {
                        options.error && options.error.call(xhr, response);
                    }
                } else {
                    options.fail && options.fail.call(xhr, xhr.status);
                }

                complete = true;
            }
        };
        xhr.onabort = function() {
            options.abort && options.abort();
        };
        xhr.send(options.method === 'POST' ? JSON.stringify(options.params) : null);
        return xhr;
    };

    $s.ajax = function(options) {
        return ajax(options);
    };

    $s.get = function(options) {
        options.method = 'GET';
        return ajax(options);
    };

    $s.post = function(options) {
        options.method = 'POST';
        return ajax(options);
    };

    $s.getUid = function(){
        var mbid = $s.cache.getItem("mbid");
        if(mbid == null || mbid == undefined)
        {
            mbid = "";
        }
        return mbid;
    };

    $s.setUid = function(id){
        id += "";
        if(id != null && id != undefined && id != "")
            $s.cache.setItem("mbid", id);
    };

    // 默认图片
    $s.replaceWithDefault = function(img) {
        var o = document.createElement('i');
        o.className = 'read_ico_nobanimg';
        
        img.parentNode.replaceChild(o, img);
    };
    
    // events

    function bind(el, type, f) {
        return el.addEventListener(type, f, false);
    };

    function unbind(el, type, f) {
        return el.removeEventListener(type, f, false);
    };

    function once(el, type, f) {
        el.addEventListener(type, function(e) {
            el.removeEventListener(type, arguments.callee, false);
            f(e);
        }, false);
    };    
        
    var tap = function (el, tapHandler) {
        var touchable = 'ontouchstart' in window,
         touchstart = touchable ? 'touchstart' : 'mousedown',
         touchmove = touchable ? 'touchmove' : 'mousemove',
         touchend = touchable ? 'touchend' : 'mouseup';

        var moved = false;
        var startX = 0;
        var starttY = 0;
        if (el != null && el != undefined) {
            el.addEventListener(touchstart, function (e) {
                moved = false;
                startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

                el.addEventListener(touchmove, function (e) {
                    if (Math.abs(e.touches[0].clientX - startX) > 10 || Math.abs(e.touches[0].clientY - startY) > 10) {
                        moved = true;
                        el.removeEventListener(touchmove, arguments.callee, false);
                    }
                }, false);
            }, false);
            el.addEventListener(touchend, function (e) {
                if (!moved) {
                    tapHandler(e);
                }
            }, false);
        }
    };

    //触屏长按事件
    var tapHold = function (el, tabHoldHandler, duration) {
        var initDuration = duration == null || duration == undefined?750:duration;
        var intervalTimer;
        var moved = false;
        
        var timer = function (e) {
            duration--;
            if (duration > 0 && moved == false) {
                intervalTimer = setTimeout(function() {
                    timer(duration);
                });
            } else {                
                if (moved == false && duration == 0) {
                    e.preventDefault();
                    tabHoldHandler(e);
                }
                //时间进行重置
                duration = initDuration;
            }
        };
    
        //长按事件
        if (!$s.isEmptyObject(el)) {
            el.addEventListener(touchstart, function (e) {
                moved = false;
                timer(e);

                el.addEventListener(touchmove, function (e) {
                    moved = true;
                    clearTimeout(intervalTimer);
                    el.removeEventListener(touchmove, arguments.callee, false);
                }, false);
            },false);

            el.addEventListener(TOUCHEND, function (e) {
                clearTimeout(intervalTimer);
            });
        }
    };

    $s.bind = bind;
    $s.unbind = unbind;
    $s.tap = tap;
    $s.tapHold = tapHold;
    $s.once = once;

    $s.cache = {};

    function getItem(key) {
        var item = localStorage.getItem(key);
        
        if (item) {
            try {
                item = JSON.parse(item);
            } catch(e) {
                alert('JSON parse error');
                return undefined;
            }
        } else {
            return undefined;
        }
        
        return item;
    }

    function setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        return getItem(key);
    }

    function removeItem(key){
        localStorage.removeItem(key);
    }

    $s.cache.setItem = setItem;
    $s.cache.getItem = getItem;
    $s.cache.removeItem = removeItem;

    var html2dom = function(html) {
        var div = document.createElement('div');
        div.innerHTML = html;

        return div.firstElementChild;
    };

    $s.html2dom = html2dom;
    $s.random = function(arr) {
        var floor = Math.floor;
        var rand = Math.random;
        var i = floor(rand() * arr.length);
        return arr[i];
    };

    //获取元素的兄弟
    //传入兄弟节点
    function sibling(n, elem) {
        var r = [];

        for (; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== elem) {
                r.push(n);
            }
        }

        return r;
    }
    //获取首个元素
    $s.firstChild = function (elem) {
        var node = elem.firstChild ? elem.firstChild : null;
        while (node && node.nodeType != 1) {
            node = node.nextSibling;
        }
        return node;
    };

    $s.next = function (elem) {
        return sibling(elem, "nextSibling");
    },
    $s.prev =  function( elem ) {
        return sibling( elem, "previousSibling" );
    },
    $s.siblings =  function( elem ) {
        return sibling( ( elem.parentNode || {} ).firstChild, elem );
    },

    window.$s = $s;
    window.$ss = $ss;
}());


//显示提示
// var showTip = function () {
//     var tipContainer = $s('#tip_message_container'),
//         timeout;
//     tipContainer.style.zIndex = 10000;
//     return function (message) {
//         tipContainer.innerHTML = message;
//         if (tipContainer.style.display === 'none') {
//             tipContainer.style.display = '';
//             timeout = setTimeout(function () {
//                 tipContainer.style.display = 'none';
//             }, 3000);
//         } else {
//             tipContainer.style.display = 'none';
//             timeout && clearTimeout(timeout);
//             reader.showTip(message);
//         }
//     };
// }();

var showTip = function(){
    var element = document.getElementById("toast_tips");
    var tips = element.querySelector(".txt");
    var timeout;

    return function(message){
        tips.innerHTML = message;

        if(element.className === 'none'){
            element.className = "";
            timeout = setTimeout(function(){
                element.className = 'none';
            }, 3000);
        }else{
            element.className = 'none';
            timeout&& clearTimeout(timeout);
        }
    };       
}();

var Touch = function(el) {
    this.el = el;
    this.initialize();
};

Touch.prototype = (function() {
    var touchable = 'ontouchstart' in window,
        touchcancel = 'touchcancel',
        touchstart = touchable ? 'touchstart': 'mousedown',
        touchmove = touchable ? 'touchmove': 'mousemove',
        touchend = touchable ? 'touchend' : 'mouseup';
    
    var getPoint = function(e) {
        var touchPoint = e.changedTouches ? e.changedTouches[0] : e;
        return {
            x: touchPoint.pageX,
            y: touchPoint.pageY
        }
    };
    
    return {
        initialize: function() {
            this.el.addEventListener(touchstart, this, false);
        },
        handleEvent: function(e) {
            switch (e.type) {
                case touchstart:
                    this.startHandler(e);break;
                case touchmove:
                    this.moveHandler(e);break;
                case touchcancel:
                case touchend:
                    this.endHandler(e);break;
            }
        },
        startHandler: function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.el.addEventListener(touchmove, this, false);
            this.el.addEventListener(touchend, this, false);
            
            var point = getPoint(e);
            this.startX = point.x;
            this.startY = point.y;
            this.x = this.startX;
            this.y = this.startY;
            
            if ('onstart' in this) {
                this.onstart(this, {
                    x: this.startX,
                    y: this.startY,
                    target: e.target
                });
            }
        },
        moveHandler: function(e) {
            e.preventDefault();
            e.stopPropagation();
            var point = getPoint(e);
            var deltaX = point.x - this.startX;
            var deltaY = point.y - this.startY;
            var changedX = point.x - this.x;
            var changedY = point.y - this.y;
            this.x = this.startX + deltaX;
            this.y = this.startY + deltaY;
            
            // console.log(changedX);
            if ('onmove' in this) {
                this.onmove(this, {
                    deltaX: point.x - this.startX,
                    deltaY: point.y - this.startY,
                    changedX: changedX,
                    changedY: changedY,
                    target: e.target
                });
            }
        },
        endHandler: function(e) {
            e.preventDefault();
            e.stopPropagation();
            var point = getPoint(e);
            this.unbind();
            if ('onend' in this) {
                this.onend(this, {
                    deltaX: point.x - this.startX,
                    deltaY: point.y - this.startY,
                    x: point.x,
                    y: point.y,
                    target: e.target
                });
            }
        },
        unbind: function() {
            this.el.removeEventListener(touchmove, this, false);
            this.el.removeEventListener(touchend, this, false);
        },
        destroy: function() {
            this.el.removeEventListener(touchstart, this, false);
            this.el.removeEventListener(touchmove, this, false);
            this.el.removeEventListener(touchend, this, false);
        }
    }
})();

// tools start
function getOffset(el) {
    var bound = el.getBoundingClientRect();
    return {
        x:bound.left + window.scrollX,
        y:bound.top + window.scrollY,
        w:bound.width,
        h:bound.height
    }
}

function getElementTransformOffset(ele) {
    var transformStyle = window.getComputedStyle(ele, null)['-webkit-transform'];
    if (!transformStyle || transformStyle.indexOf('matrix') == -1) return {
        x: 0,
        y: 0
    }

    var matrix = transformStyle.match(/\(([^\)]+)\)/)[1].split(',');
    return {
        x: parseInt(matrix[4]),
        y: parseInt(matrix[5])
    }
};

$s.getTranslate = getElementTransformOffset;

var convertTimeFormat = function(timestamp, format) {
    var now = Date.now();
    var d = new Date(timestamp * 1000);
    var ts = Math.floor(now / 1000) - timestamp;
    var idx = [ts < 60, ts < 3600, ts < 3600 * 24, ts > 3600 * 24].indexOf(true);
    
    if (format) {
        return d.format(format);
    }
    
    if (idx >= 0) {
        // return ["1分钟内", Math.floor(ts / 60) + "分钟前", Math.floor(ts / 3600) + "小时前", d.format("YYYY.MM.DD hh:mm")][idx];
        return ["1分钟内", Math.floor(ts / 60) + "分钟前", Math.floor(ts / 3600) + "小时前", Math.floor(ts / (3600 * 24)) + "天前"][idx];
    }
};

var addAnim = function(el) {
    el.style[DURATION] = '.3s';  
};

var removeAnim = function(el) {
    el.style[DURATION] = '0s';
};

var front = function(el) {
    el.style['zIndex'] = 1000;    
};

var behind = function(el) {
    el.style['zIndex'] = '';
};

var getPoint = function(e) {
    var touchPoint = e.changedTouches ? e.changedTouches[0] : e;
    return {
        x: touchPoint.pageX,
        y: touchPoint.pageY
    }
};

var setTransform = function(el, x, y, z) {
    var before = 'translate3d(';
    var end = ')';
    return el.style[TRANSFORM] = before + [x,y,z].join(',') + end;
};

var asiiReg = /[^\x00-\xff]/g;

var stringLength = function(s) {
    return s.replace(/[^\x00-\xff]/g, '**').length;
};

var limitCharLength = function(str, num, tail) {
    tail = tail || '...';
    str += '';
    if (num < 0 || stringLength(str) <= num) {
        return str;
    }
    str = str.substr(0, num).replace(asiiReg, '$& ').substr(0, num).replace(/[^\x00-\xff]$/, '').replace(/([^\x00-\xff]) /g, '$1');
    return str + tail;
};

var sliding = function(settings) {
    var a = settings.a;
    var b = settings.b;
    var direction = settings.direction;
    var ready = settings.ready || null;
    
    var at;
    var bt;
    var before = 'translate3d(';
    var end = ')';
    switch (direction) {
        case 'left':
            ae = '-100%';
            bs = '100%';
            be = '0';
            break;
        case 'right':
            ae = '0';
            bs = '0';
            be = '100%';
            break;
    }
    
    b.style[TRANSFORM] = before + [bs, 0, 0] + end;
    a.style['transitionTimingFunction'] = 'ease-in-out';
    b.style['transitionTimingFunction'] = 'ease-in-out';
    a.style[DURATION] = '.4s';
    b.style[DURATION] = '.4s';
    
    b.style.display = '';
    a.style.display = '';
    
    setTimeout(function() {
        a.style[TRANSFORM] = before + [ae, 0, 0] + end;
        b.style[TRANSFORM] = before + [be, 0, 0] + end;
        
        b.addEventListener('webkitTransitionEnd', function(e) {
            a.style[DURATION] = '0s';
            b.style[DURATION] = '0s';
            
            switch (direction) {
                case 'left':
                    a.style.display = 'none';
                    break;
                case 'right':
                    b.style.display = 'none';
                    break;
            }
            
            ready && ready();
            
            b.removeEventListener('webkitTransitionEnd', arguments.callee, false);
        }, false);
    }, 17);
};

function cConfirm(settings) {
    this.template = $s('#confirm_template').innerHTML;
    this.element = $s.html2dom(this.template);
    
    document.body.appendChild(this.element);

    this.title = this.element.querySelector('.title');
    this.content = this.element.querySelector('.con');
    this.ensure = this.element.querySelector('.confirm_01');
    this.cancel = this.element.querySelector('.cancel_01');
    
    this.element.querySelector('.confirm_01').value = lang.getText("confirm");
    this.element.querySelector('.cancel_01').value = lang.getText("cancel");

    this.args = [];
    
    var t = this;

    $s.bind(t.ensure, TOUCHSTART, function (e) {
        if (!$s.hasClass(t.ensure, 'active')) {
            $s.addClass(t.ensure, 'active');
        }
    });

    $s.bind(t.ensure, TOUCHEND, function (e) {
        if ($s.hasClass(t.ensure, 'active')) {
            $s.removeClass(t.ensure, 'active');
        }

        //if (settings.ok) {
        //    settings.ok(t, t.args);
        //}

        //t.hide();
    });

    $s.bind(t.cancel, TOUCHSTART, function (e) {
        if (!$s.hasClass(t.cancel, 'active')) {
            $s.addClass(t.cancel, 'active');
        }
    });

    $s.bind(t.cancel, TOUCHEND, function (e) {
        if ($s.hasClass(t.cancel, 'active')) {
            $s.removeClass(t.cancel, 'active');
        }

        //if (settings.cancel) {
        //    settings.cancel(t);
        //}
        //t.hide();
    });

    $s.bind(t.ensure, 'click', function (e) {
        if (settings.ok) {
            settings.ok(t, t.args);
        }
        
        t.hide();
    });
    
    $s.bind(t.cancel, 'click', function (e) {
        if (settings.cancel) {
            settings.cancel(t);
        }
        
        t.hide();
    });
};

cConfirm.prototype.setTitle = function(title) {
    this.title.innerHTML = title;
};

cConfirm.prototype.setContent = function(content) {
    this.content.innerHTML = content;  
};

cConfirm.prototype.show = function () {
    if ($s.hasClass(this.element, 'none')) {
        $s.removeClass(this.element, 'none');
    }
};

cConfirm.prototype.hide = function () {
    if(!$s.hasClass(this.element,'none')){
        $s.addClass(this.element, 'none');
    }
};

cConfirm.prototype.destroy = function () {
    document.body.removeChild(this.element);
};

cConfirm.prototype.setArgs = function(args) {
    this.args = args;
};
// tools end

// statistical data
var E_SI_ADDWIDGETCOUNT = "1";        //功能订阅次数
var E_SI_DELWIDGETCOUNT = "2";        //功能退订次数
var E_SI_CHANGPOSCOUNT  = "3";        //功能换位次数
var E_SI_EDITBTNCOUNT   = "4";        //首页编辑按钮点击次数
var E_SI_ADDBTNCOUNT    = "5";        //首页添加按钮点击次数
var E_SI_SETBTNCOUNT    = "6";        //首页设置按钮点击次数
var E_SI_WBSHARECOUNT   = "7";        //分享次数
var E_SI_FONTSIZECOUNT  = "8";        //调整字号次数
var E_SI_CLEARCACHECOUNT= "9";        //清理缓存次数
var statistics = {};
statistics.statReq = {};
statistics.statReq.sUid = undefined;
statistics.statReq.vWidgetStat = {};
statistics.statReq.mItems = {
    "1":0,
    "2":0,
    "3":0,
    "4":0,
    "5":0,
    "6":0,
    "7":0,
    "8":0,
    "9":0
};


//统计功能启动次数
statistics.openChannel = function(cid){
    cid += "";
    var st = statistics.statReq;
    if(cid in st.vWidgetStat)
    {
        st.vWidgetStat[cid].iStartCount++;
    }
    else
    {
        st.vWidgetStat[cid] = {};
        st.vWidgetStat[cid].sWidgetId = cid;
        st.vWidgetStat[cid].iStartCount = 1;
        st.vWidgetStat[cid].iViewCount = 0;
    }
    statistics.updateCache();
};

// 统计浏览相应功能的条数
statistics.readNews = function(cid){
    cid += "";
    var st = statistics.statReq;
    st.vWidgetStat[cid].iViewCount++;
    statistics.updateCache();
};

// 统计功能订阅次数
statistics.operation = function(type){
    var st = statistics.statReq;
    st.mItems[type]++;
    statistics.updateCache();
};

statistics.updateCache = function(){
    $s.cache.setItem("statistics", JSON.stringify(statistics.statReq));
};

statistics.get = function(){
    var t = $s.cache;
    var v = t.getItem("statistics");
    var temp;
    var arr =[];
    if(v == "" || v == undefined || v == null)
    {
        temp = "";
    }
    else
    {
        temp = JSON.parse(v);
        for ( var key in temp.vWidgetStat )
        {
            arr.push(temp.vWidgetStat[key]);
        }
        temp.vWidgetStat = arr;

        for (var i in temp.mItems)
        {
            if(temp.mItems[i] == 0)
                delete temp.mItems[i];
        }
    }
    return temp;
};

var CHROME = "crios".toUpperCase();
var QQB = "MQQBrowser".toUpperCase();
var SAFARI = "Safari".toUpperCase();
var FIREFOX = "FIREFOX".toUpperCase();
var ua = navigator.userAgent;
var isSafari = false;
var isLauchIcon = false;
ua = ua.toUpperCase();
console.log(ua);
if(ua.match(CHROME))
{
    isSafari = false;
}
else if (ua.match(FIREFOX)) {
    isSafari = false;
}
else if(ua.match(QQB))
{
    isSafari = false;
}
else
{
    isSafari = true;
}

if(screen.height - window.innerHeight < 40)
{
    isLauchIcon = true;
}

window.isUc = (navigator.userAgent.indexOf('UC') > -1);
    
if (isUc) {
    document.getElementById('precess_inner_circle_text').setAttribute('style', '-webkit-transform:scale(.6);');
}

//版本更新时执行
function updateVersion(){
    var oldVersion = localStorage.getItem("version");
    if(oldVersion != version)
    {
        localStorage.setItem("version", version);
        //使用户进行重新的登陆
        localStorage.removeItem("userinstalledChannels");
        localStorage.removeItem("sid");
        localStorage.removeItem("selectDB");
        localStorage.removeItem("nickname");
        localStorage.removeItem("isReset");
        localStorage.removeItem("dblist");
        localStorage.removeItem("nickname");
        localStorage.removeItem("installedChannels");
        //清除已添加的功能
        //localStorage.removeItem("installedChannels");
        //清除功能页面
        if (localStorage.getItem("categorys")) {
            localStorage.removeItem("categorys");
        }
    }
}

updateVersion();

function resetSystem() {
    var isReset = localStorage.getItem("isReset");

    if (isReset) {
        localStorage.removeItem("sid");
        localStorage.removeItem("dblist");
        localStorage.removeItem("categorys");
        localStorage.removeItem("selectDB");
        localStorage.removeItem("installedChannels");
        localStorage.removeItem("nickname");
    }
}



//检测 input[text] 是否发生改变，有改变则返回数据
var checkChanged = (function () {

    var dataStore = [];

    return function (el) {
        var value = el.value.trim(),
            oValue;

        for (var i = 0, iLen = dataStore.length; i < iLen; i += 2) {

            if (dataStore[i] == el) {
                oValue = dataStore[++i];

                if (value !== oValue && typeof(value) != "undefined" && !$s.isEmptyObject(typeof(value))) {
                    dataStore[i] = value;
                    return [true, value];

                } else {
                    return [false, value];
                }
            }
        }
        if (typeof (value) != "undefined" && !$s.isEmptyObject(typeof (value))) {
            dataStore.push(el, value.trim());
        }
        return [(el.defaultValue != value && typeof (value) != "undefined" && !$s.isEmptyObject(typeof (value))), value];
    }

}());


var pageSkip = {};
pageSkip.skipToChannel = false; // 添加->进入功能，返回时需返回到桌面
pageSkip.skipTips = false;  // 首页->设置->返回，此时到达桌面
pageSkip.hashChange = function(e){
    var oldUrl = e.oldURL;
    var pos = oldUrl.indexOf("#~");
    var oldHash;
    var oldType;
    if(pos != -1)
    {
        oldHash = oldUrl.substr(pos);
        oldHash = pageSkip.parse(oldHash);
        oldType = parseInt(oldHash.type);
    }
    else
    {
        oldType = -1;
    }

    var hash = location.hash;
    var navObj = pageSkip.parse(hash);
    var type = parseInt(navObj.type);
    var isRed = parseInt(navObj.isRed);

    //alert("old type: " + oldType + ", type: " + type);
    switch (type)
    {
        case 0:
            // 首页
            //TODO: 判断是否已进行进行登陆，没有登陆跳转到登陆页面
            //if (!$s.cache.getItem("selectDB")) {
            //    SettingPage.gotoLogonPage();
            //    break;
            //}
            if(oldType == 1)
            {
                var layer = $s('#loading_layer');
                if(layer != null)
                    $s.addClass(layer, 'none');
            }
            if (oldType == 3) {
                Launcher.finishEdit();
            }
            else if (oldType == 4 && !pageSkip.skipToChannel) {
                //launcherInstance.screenFlip.currentScreen = 0;
                //launcherInstance.screenFlip.currentOffset = 0;
                //var ele = $s("#channels_installed");
                //setTransform(ele, 0, 0, 0);
                Channels.gotoLauncherPage();
            }
            else if (oldType == 5 && !pageSkip.skipTips) {
                launcherInstance.screenFlip.currentScreen = 0;
                launcherInstance.screenFlip.currentOffset = 0;
                var ele1 = $s("#channels_installed");
                setTransform(ele1, 0, 0, 0);
                SettingPage.gotoLauncherPage();
            }
            else if (oldType == 7 && !pageSkip.skipToChannel) {
                Logon.gotoLauncherPage();
            }
            else
                reader.gotoLauncher();
            percent.hide();
            pageSkip.skipToChannel = false;
            pageSkip.skipTips = false;
            break;
        case 1:
            // 功能
            if (oldType < type || oldType == 4) {
                Launcher.gotoChannel(navObj.sType,navObj.isRed);
            }
            else if (oldType == 12) {
              
            }
            else if (oldType == 13) {
                reader.stockBackToBillListPage();
            }
            else if (oldType == 14) {
                reader.stockPlaceBackToBillListPage();
            }
            else {
                //跳转到详情页面
                reader.gotoIndex();
            }
            break;
        case 2:
            if(oldType == 1)
            {
                var layer1 = $s('#loading_layer');
                if(layer1 != null)
                    $s.addClass(layer1, 'none');
            }

            if(oldType == 7)
            {
                reader.hideLogin();
            }
            else
            {
                reader.gotoArticle(navObj.sType);
            }
            percent.hide();
            break;
        case 3:
            // 编辑
            if(oldType == 11)
            {
                //Launcher.removeChannelConfirm.hide();
            }
            else
            {
                Launcher.triggerEditMode();
            }
            break;
        case 4:
            // 添加
            if(oldType == 1)
            {
                pageSkip.skipToChannel = true;
                history.back();
            }
            else if(oldType == 11)
            {
                Launcher.removeChannelConfirm.hide();
            }
            else
                Launcher.gotoCategoryPage();
            break;
        case 5:
            // 设置
            if(oldType == 6)
                SettingPage.backToSettingPage();
            else if (oldType == 7)
                reader.hideLogin();
            else if(oldType == 8)
                Launcher.logoutConfirm.hide();
            else if(oldType == 1)
            {
                pageSkip.skipTips = true;
                history.back();
            }
            else
                Launcher.gotoSettingPage();
            break;
        case 6:
            // 清除离线缓存
            if(oldType == 10)
                Launcher.clearChannelCacheConfirm.hide();
            SettingPage.gotoClearCachePage();
            break;
        case 7:
            //TODO: 登陆页面，登陆页面登陆成功后，跳转到主控台页面
            //SettingPage.Login();
            if (oldType == 15) {
                Logon.backToLogonPage();
            } else if (oldType == 8) {
                SettingPage.gotoLogonPage();
            } else if (oldType == 0) {
                Launcher.gotoLogonPage();
            }
            //Logon.gotoLogonPage();
            break;
        case 8:
            SettingPage.Logout();
            break;
        case 10:
            // 清除缓存
            if(Launcher.clearChannelCacheConfirm)
                Launcher.clearChannelCacheConfirm.show();
            break;
        case 11:
            // 取消功能
            if(Launcher.removeChannelConfirm)
                Launcher.removeChannelConfirm.show();
            break;
        case 12:
            //服务器IP设置
            //SettingPage.gotoIPSettingPage();
            break;
        case 13:
            //跳转到仓库列表
            reader.gotoStockListPage();
            break;
        case 14:
            //跳转到仓位列表，同时传递仓库的ID
            reader.gotoStockPlaceListPage();
            break;
        case 15:
            //跳转到帐套选择界面
            Logon.gotoDBListPage();
        default:
            break;

    }
};

pageSkip.parse = function(hash){
    var typeObj = {type: -1, sType: -1};
    if(hash == "" || hash.indexOf("#~type") == -1)
    {
        typeObj.type = 0;
        return typeObj;
    }

    if(hash.indexOf("key=") == -1){
        typeObj = JSON.parse(hash.replace('#~', '{"').replace(/&/ig, '","').replace(/\=/ig, '":"') + '"}');
    }
    return typeObj;
};

var percent = {};
percent.radius = undefined;
percent.DrawArc = function(Canvas,O,Radius,startAngle, endAngle, anticlockwise){
    Canvas.arc(O[0],O[1],Radius,startAngle*Math.PI/180, endAngle*Math.PI/180, anticlockwise);
};

percent.initDom = function(){
    var outerR = 18;
    var centerR = 15;
    var innerR = 10;

    this.outerE = document.getElementById("precess_wrap");
    this.centerE = document.getElementById("precess_outer_circle");
    this.innerE = document.getElementById("precess_inner_circle");
    this.percentContainer = document.getElementById("precess_inner_circle_text");
    this.canvas = document.getElementById("process_canvas");
    this.ctx = this.canvas.getContext('2d');

    this.outerE.style.width = (outerR * 2 - 2) + "px";
    this.outerE.style.height = (outerR * 2 - 2) + "px";
    this.outerE.style.borderRadius = outerR + "px";
    this.outerE.style.borderColor = "#E0E0E0";
    this.outerE.style.backgroundColor = "#ffffff";

    this.centerE.style.left = (outerR - centerR - 1) + "px";
    this.centerE.style.top = (outerR - centerR - 1) + "px";
    this.centerE.style.width = (centerR * 2) + "px";
    this.centerE.style.height = (centerR * 2) + "px";
    this.centerE.style.borderRadius = centerR + "px";
    this.centerE.style.backgroundColor = "#E0E0E0";

    this.innerE.style.left = (outerR - innerR - 1) + "px";
    this.innerE.style.top = (outerR - innerR - 1) + "px";
    this.innerE.style.width = (innerR * 2) + "px";
    this.innerE.style.height = (innerR * 2) + "px";
    this.innerE.style.borderRadius = innerR + "px";
    this.innerE.style.backgroundColor = "#ffffff";

    this.canvas.width = outerR * 2 - 2;
    this.canvas.height = outerR * 2 - 2;

    return {"outerR": outerR, "centerR": centerR, "innerR": innerR};
};

percent.schedule = function(speed){
    var ctx = this.ctx;
    var B = new Array((percent.radius.outerR * 2 - 2)/2, (percent.radius.outerR * 2 - 2)/2);
    if(speed >= 1)
        speed = 0.9997;
    var schedule = speed * 360;
    var per = Math.ceil(speed * 100) + "%";
    
    this.percentContainer.innerText = per;
    var start = 0.75 * 360;
    ctx.beginPath();
    ctx.clearRect(0, 0, 42, 42);
    ctx.strokeStyle = "#858585";
    ctx.lineWidth = (percent.radius.centerR - percent.radius.innerR) + "";
    percent.DrawArc(ctx, B, (percent.radius.centerR + percent.radius.innerR)/2, start, start + schedule, false);
    ctx.stroke();
};

percent.radius = percent.initDom();
percent.show = function(){
    this.outerE.style.display = '';
};
percent.hide = function(){
    this.outerE.style.display = 'none';
};
function gethashType(hash)
{
    var type = -1;
    var s = hash.replace(/ /g,"");
    var startPos = hash.indexOf("type=") + 5;
    if(startPos == -1)
        return type;
    var endPos = hash.indexOf("&");
    if(endPos == -1)
    {
        type = parseInt(hash.substr(startPos));
    }
    else
    {
        type =  parseInt(hash.substr(startPos, endPos - startPos));
    }
    return type;
}

// utility function called by getCookie()
function getCookieVal(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1) {
        endstr = document.cookie.length;
    }
    return unescape(document.cookie.substring(offset, endstr));
}
 
// primary function to retrieve cookie by name
function getCookie(name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while (i < clen) {
        var j = i + alen;
        if (document.cookie.substring(i, j) == arg) {
            return getCookieVal(j);
        }
        i = document.cookie.indexOf(" ", i) + 1;
        if (i == 0) break;
    }
    return null;
}
 
// store cookie value with optional details as needed
function setCookie(name, value, expires, path, domain, secure) {
    document.cookie = name + "=" + escape(value) +
    ((expires) ? "; expires=" + expires : "") +
    ((path) ? "; path=" + path : "") +
    ((domain) ? "; domain=" + domain : "") +
    ((secure) ? "; secure" : "");
}
 
// remove the cookie by setting ancient expiration date
function deleteCookie(name, path, domain) {
    if (getCookie(name)) {
        document.cookie = name + "=" +
      ((path) ? "; path=" + path : "") +
      ((domain) ? "; domain=" + domain : "") +
      "; expires=Thu, 01-Jan-1970 00:00:01 GMT";
 
    }
}

