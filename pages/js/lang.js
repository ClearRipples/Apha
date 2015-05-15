/*
 * 多语言处理数据 
 * 更改系统的多语言后，进行DOM数据的更新操作
 * hongbo_liang@kingdee.com 
 * 2015-04-14
 * 页面的书写如 <span data-lang-text="error-message"></span>
 * 通过data-lang-text 来指定多语言包中的Key
 * 通过动态更新DOM中的数据完成多语言的切换
 * 主要的方法： getUserAgentLang()获取当前客户端的语言, 
 * getText("error-message")获取对应的字段的当前与语言下的文本
 * updateText： 遍历更新当前DOM文本
 */

//renderLocales: ->
//  # 获取有 data-lang-* 属性的所有标签
//  # 逐个标签读取
//  # 取出属性当中的内容作为 key, 查询语言
//  # 按照 data-lang-* 的语义, 替换对应的语言


(function (window, document, Math) {
    window.lang = window.lang || {};

    //获取浏览器的多语言数据
    var getLang = function () {
        var type = navigator.appName
        var tmpLang = null;

        if (type == "Netscape") {
            tmpLang = navigator.language
        }
        else {
            tmpLang = navigator.userLanguage
        }
        //取得浏览器语言的前两个字母
        var lang = tmpLang.substr(0, 2)
        // 英语
        if (lang == "en") {
            lang = "en";
        }
            // 中文 - 不分繁体和简体
        else if (lang == "zh") {
            if (tmpLang == "zh-CN" || tmpLang == "zh") {
                lang = "zh_cn";
            } else {
                lang = "zh_tw";
            }
        }
        else {
            //其他情况返回中文简体文本
            lang = 'zh_cn'
        }

        return lang;
    };

    //英文状态下，标题的字体大小需要修改成为 14px 中文 20px
    var resetFontSize = function () {
        var arr = document.querySelectorAll("h1.title");
        var langType = getLang();
        //langType = "en";
        if (langType == "en") {
            for (var i = 0; i < arr.length; i++) {
                arr[i].style.fontSize = "16px";
            }
        }
    };

    //获取DOM中的数据进行更新，返回数组格式
    var getDomElement = function () {
        return document.querySelectorAll("*[data-lang-text]");
    };

    //获取lang_res中的数据,
    var getText = function(key){
        var langType = getLang();
        //langType = "en";
        return lang_res[key][langType];
    };

    //用于调用后端的接口
    lang.getUserAgentLang = function () {
        return getLang();
    };

    lang.getText = function (key) {
        return getText(key);
    };

    //遍历进行更行更新DOM中的信息
    lang.updateText = function () {
        var arr = getDomElement();
        for (var i = 0; i < arr.length; i++) {
            //得到Key值
            var key = arr[i].getAttribute("data-lang-text");
            if (arr[i].nodeType == "INPUT") {
                arr[i].setAttribute("value", getText(key));
                arr[i].setAttribute("placeholder", getText(key));
            } else {
                arr[i].innerHTML = getText(key);
            }
        }

        resetFontSize();
    };

})(window, document, Math);