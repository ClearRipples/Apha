var listWrapper = $s('#list_wrapper');
var articleWrapper = $s('#article_wrapper');
var backBtn = $s('#back_btn');
var listPage = $s('#list_page');
var articlePage = $s('#article_page');
var loadingLayer = $s('#loading_layer');
var unreadNum = $s('#update_num');
var cancelLoading = $s('#cancel_loading_btn');
var channelTitle = $s('#channel_title');

var articleTitle = $s('#article_title');

var monitorInterval = null;

var ActiveRequest;
// screen sliding sign
var screenIsSliding = false;

var isScanning = false;

// MESSAGES TABLE
var MESSAGES = {
    NETWORK_ERROR: '网络不可用，请检查网络',
    NO_UPDATE: '暂时没有更新',
    NO_BEFORE: '这是第一页',
    NO_AFTER: '这已经是最后一页',
    LOADING: '正在更新中...',
    IS_LOADING: '加载中，请耐心等待',
    DOWNLOADING: '正在下载离线内容...',
    DELETE_CACHE_SUCCEED: '删除成功',
    UPDATE_BILL_LIST_SUCCEED: '更新列表成功',
    UPDATE_BILL_LIST_FAIL: '更新列表失败',
    QRCODE_FORMAT_ERROR: '二维码格式错误',
    NO_BATCH_INFO: '没有批次信息',
    NO_ARTICLE_EXIST: '当前只能扫描单据二维码'
};


function extend(a, b) {
    for (var key in b) {
        if (b.hasOwnProperty(key)) {
            a[key] = b[key];
        }
    }
    return a;
}
var tabW;
var contentW;
//构造函数
function SrcTypeTabs(el, options) {
    this.el = el;
    this.options = extend({}, this.options);
    extend(this.options, options);
    //计算每个tab的宽度
    this.cols = this.options.tabdata.vSrcType.length;

    var floor = Math.floor;
    var mw = window.innerWidth;
    var hRatio = 6;

    //this.itemW = (mw * hRatio) / (hRatio * this.cols + this.cols + 1);
    this.itemW = mw / this.cols;
    if (this.itemW < 120) {
        if (this.cols == 1) {
            this.itemW = mw;
        } else {
            this.itemW = 120;
        }
    }

    tabW = this.itemW;
    contentW = document.body.clientWidth;
    //进行Tab的初始化
    this._init();
}

SrcTypeTabs.prototype.options = {
    istart: 0
};

SrcTypeTabs.prototype._init = function () {
    //动态生成 tab 格式如下,通过option进行待处理单据的源单类型 JSON 格式
    /*
    <div class="tabs tabs-style-linemove">
        <nav>
            <ul>
                <li><a data-rel="#section-linemove-1" href="javascript:;" class="icon icon-home"   ><span>Home</span></a></li>
                <li><a data-rel="#section-linemove-2" href="javascript:;" class="icon icon-box"    ><span>Archive</span></a></li>
                <li><a data-rel="#section-linemove-3" href="javascript:;" class="icon icon-display"><span>Analytics</span></a></li>
                <li><a data-rel="#section-linemove-4" href="javascript:;" class="icon icon-upload" ><span>Upload</span></a></li>
                <li><a data-rel="#section-linemove-5" href="javascript:;" class="icon icon-tools"  ><span>Settings</span></a></li>
            </ul>
        </nav>
        <div class="content-wrap">
            <section id="section-linemove-1"><p>1</p></section>
            <section id="section-linemove-2"><p>2</p></section>
            <section id="section-linemove-3"><p>3</p></section>
            <section id="section-linemove-4"><p>4</p></section>
            <section id="section-linemove-5"><p>5</p></section>
        </div><!-- /content -->
    </div><!-- /tabs -->
    */
    var tabTemplate = $s('#tab_template').innerHTML;
    var html = tabTemplate.tmpl(this.options.tabdata.vSrcType);
    var ele = $s.html2dom(html);
    this.el.appendChild(ele);

    // 各项的Tabs
    this.tabs = [].slice.call(this.el.querySelectorAll('nav > ul > li'));
    document.getElementById('tabs_scroller').style.width = this.itemW * this.tabs.length + 'px';
    document.getElementById('content_sroller').style.width = screen.width + 'px';
    // 当前页需要显示的内容
    this.items = [].slice.call(this.el.querySelectorAll('.content_sroller > section'));
    // 当前页签的index
    this.current = -1;
    // 显示当前的源单类型的待处理列表
    this._show();
    //TODO: 后续需要进行优化，并且处理切换tab content的情况下，tab标签自动修改
    this.tabScroller = new iScroll('.tabs_wrapper', {
        useTransition: true,
        eventPassthrough: true,
        scrollX: true,
        scrollY: false,
        preventDefault: false
    });

    //this.tabContentScroller = new iScroll(".content_wrap", {
    //    snap: true,
    //    momentum: true,
    //    eventPassthrough: true,
    //    scrollX: true,
    //    scrollY: false,
    //    preventDefault: false
    //});

    // 初始化事件
    this._initEvents();
};

SrcTypeTabs.prototype._initEvents = function () {
    var self = this;
    this.tabs.forEach(function (tab, idx) {
        tab.addEventListener('click', function (ev) {
            ev.preventDefault();
            self._show(idx);
        });
    });
};

SrcTypeTabs.prototype._show = function (idx) {
    if (this.current >= 0) {
        this.tabs[this.current].className = this.items[this.current].className = '';
    }
    // change current
    this.current = idx != undefined ? idx : this.options.start >= 0 && this.options.start < this.items.length ? this.options.start : 0;
    this.tabs[this.current].className = 'tab_current';
    this.items[this.current].className = 'content_current';
    //得到当前选中的单据类型，在检索页面中也只针对当前单据类型进行检索。
    reader.currSrcType = this.items[this.current].dataset.srctype;

    //先对当前的scroll进行释放，然后重新创建
    if (this.currTabScroller) {
        this.currTabScroller.destroy();
    }

    this.currTabScroller = new iScroll('.content_current', {
        click: true,
        useTransition: true,
        probeType: 2,//probeType：1对性能没有影响。在滚动事件被触发时，滚动轴是不是忙着做它的东西。probeType：2总执行滚动，除了势头，反弹过程中的事件。这类似于原生的onscroll事件。probeType：3发出的滚动事件与到的像素精度。注意，滚动被迫requestAnimationFrame（即：useTransition：假）。  
        scrollbars: true,//有滚动条  
        mouseWheel: true,//允许滑轮滚动  
        fadeScrollbars: true,//滚动时显示滚动条，默认影藏，并且是淡出淡入效果  
        bounce: true,//边界反弹  
        interactiveScrollbars: true,//滚动条可以拖动  
        shrinkScrollbars: 'scale',// 当滚动边界之外的滚动条是由少量的收缩。'clip' or 'scale'.  
        click: true,// 允许点击事件  
        keyBindings: true,//允许使用按键控制  
        momentum: true// 允许有惯性滑动  
    });

    reader.tabs = this.currTabScroller;

    var pullDownEl, pullDownL;
    var pullUpEl, pullUpL;
    var Downcount = 0, Upcount = 0;
    var loadingStep = 0;//加载状态0默认，1显示加载状态，2执行加载数据，只有当为0时才能再次加载，这是防止过快拉动刷新  

    pullDownEl = $s('.content_current').querySelector('.pull_down');
    pullDownL = pullDownEl.querySelector('.pull_down_label');
    pullDownEl['class'] = pullDownEl.getAttribute('class');
    pullDownEl.setAttribute('class', '');
    $s.addClass(pullDownEl, 'pull_down none');

    pullUpEl = $s('.content_current').querySelector('.pull_up');
    pullUpL = pullUpEl.querySelector('.pull_up_label');
    pullUpEl['class'] = pullUpEl.getAttribute('class');
    pullUpEl.setAttribute('class', '');
    $s.addClass(pullUpEl, 'pull_up none');

    var l = this;
    var t = this.currTabScroller;

    t.on('refresh', function () {
        if (pullDownEl.className.match('list_loading')) {
            pullDownEl.className = '';
            pullDownEl.querySelector('.pull_down_label').innerHTML = lang.getText('pull_down_refresh');
        } else if (pullUpEl.className.match('list_loading')) {
            pullUpEl.className = '';
            pullUpEl.querySelector('.pull_up_label').innerHTML = lang.getText('pull_up_load');
        }
    });


    t.on('scrollMove', function () {
        if (loadingStep == 0 && !pullDownEl.getAttribute('class').match('flip|loading') && !pullUpEl.getAttribute('class').match('flip|loading')) {
            if (this.y > 5) {
                //下拉刷新效果  
                pullDownEl.setAttribute('class', pullUpEl['class'])
                //                pullDownEl.show();
                $s.removeClass(pullDownEl, 'none');
                t.refresh();
                $s.addClass(pullDownEl, 'flip');
                pullDownL.innerHTML = lang.getText('prepare_refresh');
                loadingStep = 1;
            } else if (this.y < (this.maxScrollY - 5)) {
                //上拉刷新效果  
                pullUpEl.setAttribute('class', pullUpEl['class'])
                //pullUpEl.show();
                $s.removeClass(pullUpEl, 'none');
                t.refresh();
                $s.addClass(pullUpEl, 'flip');
                pullUpL.innerHTML = lang.getText('prepare_refresh');
                loadingStep = 1;
            }
        }
    });
    t.on('scrollEnd', function () {
        if (loadingStep == 1) {
            if (pullUpEl.getAttribute('class').match('flip|loading')) {
                $s.removeClass(pullUpEl, 'flip');
                $s.addClass(pullUpEl, 'list_loading');
                pullUpL.innerHTML = 'Loading...';
                loadingStep = 2;
                l.pullUpAction();
            } else if (pullDownEl.getAttribute('class').match('flip|loading')) {
                $s.removeClass(pullDownEl, 'flip');
                $s.addClass(pullDownEl, 'list_loading');
                pullDownL.innerHTML = 'Loading...';
                loadingStep = 2;
                l.pullDownAction();
            }
        }
    });

    //下拉进行页面数据的刷新 
    l.pullDownAction = function () {
        setTimeout(function () {
            $s.removeClass(pullDownEl, 'list_loading');
            pullDownL.innerHTML = lang.getText('load');
            pullDownEl['class'] = pullDownEl.getAttribute('class');
            pullDownEl.setAttribute('class', '');
            $s.addClass(pullDownEl, 'pull_down none');
            //下拉进行更新
            reader.checkUpdate();

            t.refresh();
            loadingStep = 0;
        }, 300); //1秒  
    };

    //上拉获取更多内容
    l.pullUpAction = function () {
        setTimeout(function () {
            $s.removeClass(pullUpEl, 'list_loading');
            pullUpL.innerHTML = lang.getText('load');
            pullUpEl['class'] = pullUpEl.getAttribute('class');
            pullUpEl.setAttribute('class', '')
            $s.addClass(pullUpEl, 'pull_up none');
            reader.readMore();
            t.refresh();
            loadingStep = 0;
        }, 300);
    };

    //加载待处理的单据列表，默认的情况下加载当前类型中保存未审核的单据
    reader.initDom();
    this.currTabScroller.refresh();
};

//SrcTypeTabs End


//动态生成待处理列表
var PageFactory = function () {
    var pageInstances = {};

    return function (pageid) {
        // if (pageid in pageInstances) {
        //     return pageInstances[pageid];
        // }

        var pageData = reader.pageHash[pageid];
        return pageInstances[pageid] = {
            id: pageid,
            data: pageData,
            fetchElement: function () {

                var data = $s.clone(this.data);

                var infos = data.vTotalInfo;
                var html = "<ul>";
                var template = $s('#item_list_template').innerHTML;
                for (var i = 0; i < infos.length; i++) {
                    var item = $s('#' + infos[i].sTitle);
                    if (!item) {
                        html += template.tmpl(infos[i]);
                    }
                }
                html += "</ul>";
                pageElement = $s.html2dom(html);

                return pageElement;
            }
        };
    };
}();

var ArticleFactory = function (data) {
    var articleInstances = {};
    return function (articleid) {
        var data = reader.articleHash[articleid];
        return articleInstances[articleid] ? articleInstances[articleid] : articleInstances[articleid] = {
            data: $s.clone(data),
            element: function () {
                var articleElement = $s('#article_' + articleid);
                if (!articleElement) {
                    var data = this.data;
                    var template = $s('#article_template').innerHTML;
                    var html = template.tmpl(data);

                    articleElement = $s.html2dom(html);
                    articleElement.setAttribute('id', articleid);
                }

                return articleElement;
            }
        };
    };
}();

window.reader = reader = {};
reader.pageids = [];
reader.articleids = [];
reader.pageHash = {};
reader.articleHash = {};
reader.articleReadStatistics = {};
reader.pageIndex = 0;
reader.pageOffset = 0;
reader.currPage;
reader.prevPage;
reader.nextPage;
reader.articleIndex;
reader.currArticle;
reader.prevArticle;
reader.nextArticle;
reader.articleScroller;
reader.articleFlip;
reader.pageFlip;
reader.autoDownload = false;
reader.loadingPages = false;
reader.currSrcType;
reader.pagesize = 5;
reader.isRedBill = false;
reader.currWidgetId;
reader.currArticleId;
reader.scanData = null;
reader.pd = null;
reader.scanBill = null;
reader.sourType = null;

reader.tabs = null;

//判断是否冲列表进入到详情界面
reader.listToDetail = true;
reader.isWholeBill = false;

reader.supportOfflineCache = !isUc;
reader.percent = percent;

var serverBillAction = "../QRCodeBillsActionForPDA.ashx";

(function () {
    var sizes = ['16px', '18px', '20px'];
    var rules = document.styleSheets[3].cssRules;
    var fontStyle = rules[rules.length - 1].style;
    reader.changeFontSize = function () {
        var currIndex = parseInt(reader.fontSizeIndex) + 1;
        if (currIndex == sizes.length) {
            currIndex = 0;
        }

        reader.setFontSize(currIndex);

        // 刷新scrollView参数
        if (reader.articleScroller) {
            reader.articleScroller.stop();
            reader.articleScroller.refresh();
        }
    };

    reader.setFontSize = function (sizeIndex) {
        fontStyle.fontSize = sizes[sizeIndex];
        reader.fontSizeIndex = sizeIndex;
        $s.cache.setItem('fontSizeIndex', sizeIndex);
    };
}());

reader.initEvents = function () {
    // 关闭loading
    $s.tap(cancelLoading, function (e) {
        if (ActiveRequest) {
            ActiveRequest.abort();
            ActiveRequest = null;
        }

        $s.addClass(loadingLayer, 'none');

        if (screenIsSliding) screenIsSliding = false;
    });

    // 添加频道按钮
    $s.tap(headerBtnAdd, function (e) {
        var succ = function () {
            showTip('添加成功');
            headerBtnAdd.style.display = 'none';
            statistics.operation(E_SI_ADDWIDGETCOUNT);  // 统计订阅次数
        };

        var channel = new Channel(
            Channels.channelHash[sWidgetId]
        );
        launcherInstance.addChannel(channel, succ);
    });

    // 返回launcher页面
    var backBtn = $s('#list_back_to_launcher_btn');
    $s.tap(backBtn, function (e) {
        history.back();
        //reader.gotoLauncher();
    });

    // 更新按钮
    var updateBtn = $s('#update_latest_btn');
    $s.tap(updateBtn, function (e) {
        $s.removeClass(loadingLayer, 'none');
        reader.checkUpdate();
    });

    var backBtn2 = $s('#article_back_to_list_btn');
    var backA = $s('#btn_con_artical_back');
    $s.tap(backBtn2, function (e) {
        // history.back();
        reader.clearSession();
        //reader.gotoIndex();
    });

    $s.bind(backA, 'click', function () {
        history.back();
    });

    var fontBtn = $s('#font_btn');
    $s.tap(fontBtn, function (e) {
        statistics.operation(E_SI_FONTSIZECOUNT); // 调整字号的次数
        reader.changeFontSize();
    });
};

reader.initEvents();
reader.updateCache = function () {
    var cache = {};
    var pageids;
    var pageHash = {};

    if (reader.pageids.length > 100) {
        pageids = reader.pageids.slice(0, 100);
    } else {
        pageids = reader.pageids;
    }

    var limit = 50;
    for (var i = 0; i < limit; i++) {
        var pid = pageids[i];

        if (pid in reader.pageHash) {
            pageHash[pid] = reader.pageHash[pid];
        } else {
            break;
        }
    }

    cache.ids = pageids;
    cache.Hash = pageHash;

    // cacheMgr.set(sWidgetId + "_" + reader.currSrcType, cache);
};

var showTip = function () {
    var tipContainer = $s('#tip_message_container'), timeout;
    tipContainer.style.zIndex = 10000;
    return function (message) {
        tipContainer.innerHTML = message;
        if (tipContainer.style.display === 'none') {
            tipContainer.style.display = '';
            timeout = setTimeout(function () {
                tipContainer.style.display = 'none';
            }, 3000);
        } else {
            tipContainer.style.display = 'none';
            timeout && clearTimeout(timeout);
            reader.showTip(message);
        }
    };
}();

reader.showTip = showTip;

/*
将数据追加到pageids后面，以及pageHash中，
数据将不保存到 WebSQL 中
*/
reader.readMore = function () {
    if (!navigator.onLine) {
        return reader.showTip(MESSAGES.NETWORK_ERROR);
    }

    if (ActiveRequest) {
        return;
    }

    if ($s.isEmptyObject(reader.pageHash)) {
        reader.pageids = [];
    }

    // 没有缓存点刷新
    if (reader.pageids.length <= 0) {
        reader.checkUpdate
    }

    var refId = reader.pageids.min();

    screenIsSliding = true;

    ActiveRequest = $s.post({
        url: serverBillAction,
        success: function (data) {
            ActiveRequest = null;

            var vPageIdList = [];

            if(data.Data != null){
                for (var i = 0; i < data.Data.length; i++) {
                    vPageIdList.push(data.Data[i].sPageId);
                }
            }

            var newPageIds = vPageIdList;

            if (newPageIds.length > 0) {
                // 待修改
                if (newPageIds.length > 10) {
                    newPageIds = newPageIds.slice(0, 10);
                }

                reader.additionUpdate(newPageIds, data.Data);
            } else {
                // 隐藏LOADING
                $s.addClass(loadingLayer, 'none');
                screenIsSliding = false;

                // 提示信息
                reader.showTip(MESSAGES.NO_UPDATE)
            }
        },
        error: function (data) {
            if (data.Result == 0) {
                reader.showTip(MESSAGES.NO_AFTER);
            } else {
                alert('check update error');
            }
            ActiveRequest = null;
        },
        params: {
            type: "GETPENDINGBILLS",
            data: {
                FClassTypeID: reader.currSrcType,
                FDestClassTypeID: reader.getDestType(sWidgetId),
                IsRedBill: reader.isRedBill,
                PageSize: reader.pagesize,
                LastInterID: refId,
                Filter: ""
            }
        }
    });
};

/*
 将数据追加到后面
*/
reader.additionUpdate = function (pageids, vNewsPage) {
    reader.updatePageIds(pageids);

    for (var i = vNewsPage.length - 1; i >= 0; i--) {
        var arrayItem = vNewsPage[i];
        // 更新分页表
        var key = arrayItem.sPageId;
        reader.pageHash[key] = arrayItem
    }

    reader.pageOffset = reader.pageOffset + pageids.length;

    // 更新单据ID数组
    reader.resetArticleIds();
    // 更新单据表
    reader.resetArticleHash();

    reader.onAdditionUpdate(vNewsPage);
};

//向DOM中添加节点
reader.onAdditionUpdate = function (pages) {
    for (var i = 0, j = pages.length; i < j; i++) {
        var pageId = pages[i].sPageId;
        var pageObj = PageFactory(pageId);
        var element = pageObj.fetchElement();

        //element.style.display = 'none';
        //listWrapper.appendChild(element);      

        for (var count = 0; count < element.childElementCount; count++) {
            $s.append($s('#content_' + reader.currSrcType), element.children[count]);
        }

    }
    //应该在生成列表后，对列表元素进行实践的添加
    reader.reBindArticle();

    reader.tabs.refresh();

    // 隐藏LOADING
    $s.addClass(loadingLayer, 'none');
    screenIsSliding = false;
};

/*
 进行数据的更新，每次更新都将清除 webSQL 中的数据
 清除内存中的保存的分页信息，进行重新的加载
 请求将获得 5 页的列表数据
*/
reader.checkUpdate = function () {
    if (!navigator.onLine) {
        return reader.showTip(MESSAGES.NETWORK_ERROR);
    }

    if (ActiveRequest) {
        return;
    }

    if ($s.isEmptyObject(reader.pageHash)) {
        reader.pageids = [];
    }

    // 没有缓存点刷新
    if (reader.pageids.length <= 0) {
        $s.removeClass(loadingLayer, 'none');
        ActiveRequest = $s.post({
            url: serverBillAction,
            error: function (data) {
                $s.addClass(loadingLayer, 'none');
                ActiveRequest = null;
                reader.showTip(data.Message);
            },
            success: function (data) {
                /*清除当前的列表*/
                $s('#content_' + reader.currSrcType).innerHTML = '';

                var vPageIdList = [];
                for (var i = 0; i < data.Data.length; i++) {
                    vPageIdList.push(data.Data[i].sPageId);
                }
                reader.updatePageIds(vPageIdList);
                //reader.fetchPageData(reader.oninit);
                var vNewsPage = data.Data;

                for (var i = 0, j = vNewsPage.length; i < j; i++) {
                    var arrayItem = vNewsPage[i];

                    // 更新分页表
                    reader.updatePageHash(arrayItem);
                }
                // 更新offset
                reader.pageOffset = reader.pageOffset + vNewsPage.length;

                // 更新ID数组
                reader.resetArticleIds();

                // 更新表
                reader.resetArticleHash(arrayItem.vTotalInfo);
                ActiveRequest = null;
                // 直接执行回调
                reader.oninit(vNewsPage);
                $s.addClass(loadingLayer, 'none');

                reader.tabs.refresh();
            },
            params: {
                type: "GETPENDINGBILLS",
                data: {
                    FClassTypeID: reader.currSrcType,
                    FDestClassTypeID: reader.getDestType(sWidgetId),
                    IsRedBill: reader.isRedBill,
                    PageSize: reader.pagesize,
                    LastInterID: 0,
                    Filter: ""
                }
            }
        });

        return;
    }

    // 显示loading,通过下拉来获取最新的数据
    //$s.removeClass(loadingLayer, 'none');
    /*清除 WebSQL 当前的数据表*/

    screenIsSliding = true;

    ActiveRequest = $s.post({
        url: serverBillAction,
        success: function (data) {
            ActiveRequest = null;

            if(!$s.hasClass(loadingLayer, 'none')){
                $s.addClass(loadingLayer, 'none');
            }
            /*清除内容*/
            // var fileName = reader.currWidgetId + "_" + reader.currSrcType;
            // cacheMgr.drop(fileName, function () {
                /*清空pageids pageHash, pageOffset, articleids, articleHash*/
                reader.pageids = [];
                reader.pageHash = {};
                reader.pageOffset = 0;
                reader.articleids = [];
                reader.articleHash = {};

                /*清除当前的列表*/
                $s('#content_' + reader.currSrcType).innerHTML = '';

                if (data.Data == null || data.Data.length <= 0) {
                    // 隐藏LOADING
                    $s.addClass(loadingLayer, 'none');
                    screenIsSliding = false;
                } else {

                    var vPageIdList = [];
                    for (var i = 0; i < data.Data.length; i++) {
                        //判断如果sPageId存在于 reader.pageids 的不入栈
                        if (reader.pageids.inArray(data.Data[i].sPageId) == -1) {
                            vPageIdList.push(data.Data[i].sPageId);
                        }
                    }
                    var newPageIds = vPageIdList;

                    if (newPageIds.length > 0) {
                        // 待修改
                        if (newPageIds.length > 10) {
                            newPageIds = newPageIds.slice(0, 10);
                        }

                        //reader.fetchUpdate(newPageIds);
                        ActiveRequest = null;
                        // 在此更新pageid以免停止更新后只拉到了id 没拉到数据 从而下次更新时显示无更新
                        reader.updatePageIds(newPageIds);

                        var vNewsPage = data.Data;
                        // console.log(vNewsPage);
                        for (var i = vNewsPage.length - 1; i >= 0; i--) {
                            var arrayItem = vNewsPage[i];
                            // 更新分页表
                            reader.updatePageHash(arrayItem);
                        }

                        // 更新offset
                        reader.pageOffset = reader.pageOffset + newPageIds.length;
                        // 更新ID数组
                        reader.resetArticleIds();
                        // 更新表
                        reader.resetArticleHash();

                        // 执行回调
                        reader.onUpdate(vNewsPage);
                    } else {
                        // 隐藏LOADING
                        $s.addClass(loadingLayer, 'none');
                        screenIsSliding = false;

                        // 提示信息
                        reader.showTip(MESSAGES.NO_UPDATE)
                    }
                }
            // },

            // function () {
            //     reader.showTip(MESSAGES.UPDATE_BILL_LIST_FAIL);
            // });
            reader.tabs.refresh();
            $s.addClass(loadingLayer, 'none');
        },
        error: function (data) {
            ActiveRequest = null;
            reader.showTip(data.Message);
        },
        params: {
            type: "GETPENDINGBILLS",
            data: {
                FClassTypeID: reader.currSrcType,
                FDestClassTypeID: reader.getDestType(sWidgetId),
                IsRedBill: reader.isRedBill,
                PageSize: reader.pagesize,
                LastInterID: 0,
                Filter: ""
            }
        }
    });
};


// 获取更新的
reader.fetchUpdate = function (pageids) {
    var refId = pageids[0];
    var count = pageids.length;

    ActiveRequest = $s.post({
        url: serverBillAction,
        success: function (data) {
            ActiveRequest = null;
            // 在此更新pageid以免停止更新后只拉到了id 没拉到数据 从而下次更新时显示无更新
            reader.updatePageIds(pageids);

            var vNewsPage = data.Data;
            // console.log(vNewsPage);
            for (var i = vNewsPage.length - 1; i >= 0; i--) {
                var arrayItem = vNewsPage[i];
                // 更新分页表
                reader.updatePageHash(arrayItem);
            }

            // 更新offset
            reader.pageOffset = reader.pageOffset + count;
            // 更新ID数组
            reader.resetArticleIds();
            // 更新表
            reader.resetArticleHash();

            // 执行回调
            reader.onUpdate(vNewsPage);
        },
        params: {
            type: "GETPENDINGBILLS",
            data: {
                FClassTypeID: reader.currSrcType,
                FDestClassTypeID: reader.getDestType(sWidgetId),
                IsRedBill: reader.isRedBill,
                PageSize: reader.pagesize,
                LastInterID: 0,
                Filter: ""
            }
        }
    });
};

// 更新页面
reader.onUpdate = function (pages) {
    for (var i = 0, j = pages.length; i < j; i++) {
        var pageId = pages[i].sPageId;
        var pageObj = PageFactory(pageId);
        var element = pageObj.fetchElement();


        for (var count = 0; count < element.childElementCount; count++) {
            $s.append($s('#content_' + reader.currSrcType), element.children[count]);
        }

    }

    reader.reBindArticle();
    reader.tabs.refresh();

    // 隐藏LOADING
    $s.addClass(loadingLayer, 'none');
    screenIsSliding = false;
};

// 从头部更新
reader.updatePageIds = function (pageids) {
    // 插入分页id数组
    var pageidsBefore = reader.pageids;
    var pageidsNew = pageids;
    reader.pageids = pageidsNew.concat(pageidsBefore);
};

reader.initFromCache = function () {
    // 设置表和ID
    reader.resetArticleIds();
    reader.resetArticleHash();

    var pageids = reader.pageids;
    var offset = reader.pageOffset;
    for (var i = 0; i < offset; i++) {
        var pageId = pageids[i];
        var pageObj = PageFactory(pageId);
        var element = pageObj.fetchElement();

        for (var j = 0; j < element.children.length; j++) {
            $s.append($s('#content_' + reader.currSrcType), element.children[j]);
        }
    }
    reader.reBindArticle();
    reader.tabs.refresh();
};

reader.initAttributes = function (cache) {
    reader.pageids = cache.ids;
    reader.pageHash = cache.Hash;
    reader.pageOffset = Object.keys(reader.pageHash).length;

    reader.autoDownload = $s.cache.getItem('auto_download');
};

reader.initFontSize = function () {
    if ($s.cache.getItem('fontSizeIndex') === undefined) {
        $s.cache.setItem('fontSizeIndex', 1);
    }

    reader.fontSizeIndex = $s.cache.getItem('fontSizeIndex');
    reader.setFontSize(reader.fontSizeIndex);
};

//更新PageHash
reader.fetchPageData = function (callback) {
    var refId = reader.pageids[
        reader.pageOffset
    ];
    // console.log(reader.pageOffset);
    ActiveRequest = $s.post({
        url: serverBillAction,
        success: function (data) {
            ActiveRequest = null;
            var vNewsPage = data.Data;

            for (var i = 0, j = vNewsPage.length; i < j; i++) {
                var arrayItem = vNewsPage[i];

                // 更新分页表
                reader.updatePageHash(arrayItem);
            }
            // 更新offset
            reader.pageOffset = reader.pageOffset + vNewsPage.length;

            // 更新ID数组
            reader.resetArticleIds();

            // 更新表
            reader.resetArticleHash(arrayItem.vTotalInfo);

            // 直接执行回调
            callback && callback(vNewsPage);
        },
        params: {
            type: "GETPENDINGBILLS",
            data: {
                FClassTypeID: reader.currSrcType,
                FDestClassTypeID: reader.getDestType(sWidgetId),
                IsRedBill: reader.isRedBill,
                PageSize: reader.pagesize,
                LastInterID: 0,
                Filter: ""
            }
        }
    });

};

reader.updatePageHash = function (data) {
    var key = data.sPageId;
    reader.pageHash[key] = data;

    if (reader.supportOfflineCache) {
        reader.updateCache();
    }
};

//更新详情界面中的单据编号
reader.resetArticleIds = function () {
    var pageHash = reader.pageHash;
    var offset = reader.pageOffset;
    var pageids = reader.pageids;

    var temp = [];
    for (var i = 0; i < offset; i++) {
        var pageid = pageids[i];
        var pageData = pageHash[pageid].vTotalInfo;

        for (var m = 0, n = pageData.length; m < n; m++) {
            //var articleid = pageData[m].sArticleId;
            var articleid = pageData[m].sTitle;
            temp.push(articleid);
        }
    }

    reader.articleids = temp;
};

reader.resetArticleHash = function () {
    var pageHash = reader.pageHash;
    var offset = reader.pageOffset;
    var pageids = reader.pageids;

    var temp = {};
    for (var i = 0; i < offset; i++) {
        var pageid = pageids[i];
        var pageData = pageHash[pageid].vTotalInfo;

        for (var m = 0, n = pageData.length; m < n; m++) {
            //var key = pageData[m].sArticleId;
            var key = pageData[m].sTitle;
            var value = pageData[m];
            temp[key] = value;
        }
    }

    reader.articleHash = temp;
};

//队列表中的数据进行重新的绑定tap
reader.reBindArticle = function () {
    var contentList = $s('#content_' + reader.currSrcType).querySelectorAll("li");

    for (var i = 0; i < contentList.length; i++) {
        reader._bindArticle(contentList[i]);
    }
};

reader.bindArticle = function (el) {
    var cells = el.getElementsByTagName('li');
    for (var i = 0, j = cells.length; i < j; i++) {
        reader._bindArticle(cells[i]);
    }
};

reader._bindArticle = function (cell) {
    $s.tap(cell, function (e) {
        reader.listToDetail = true;
        reader.currArticleId = cell.getAttribute('aid');
        location.hash = "#~type=2&sType=" + cell.getAttribute('aid');
        //}
    });
};

reader.oninit = function (pages) {
    for (var i = 0, j = pages.length; i < j; i++) {
        var pageId = pages[i].sPageId;
        var pageObj = PageFactory(pageId);
        var element = pageObj.fetchElement();

        element.style.display = 'none';

        for (var count = 0; count < element.children.length; count++) {
            $s.append($s('#content_' + reader.currSrcType), element.children[count]);
        }
    }

    reader.reBindArticle();
    reader.tabs.refresh();

    $s.addClass(loadingLayer, 'none');
    screenIsSliding = false;
};

var articleScroller = null;
var mask;
var matrixPrefixBefore = 'matrix(';
var matrixPrefixEnd = ')';

var zoomOut = function (options) {
    setTransform(articlePage, 0, '100%', 0);
    articlePage.style.display = '';
    articlePage.style[DURATION] = '.4s';

    var readyFn = options.onready;
    setTimeout(function () {
        setTransform(articlePage, 0, 0, 0);
        $s.once(articlePage, TRANSITION_END, function (e) {
            if (readyFn) {
                readyFn(articlePage);
            }
        });
    }, 100);
};

reader.gotoIndex = function () {
    // 恢复首页显示
    listPage.style.display = '';
    // 开始动画
    setTransform(articlePage, 0, '100%', 0);
    // 改变状态
    $s.once(articlePage, TRANSITION_END, function (e) {
        articlePage.style.display = 'none';
        //按照现在的需求进行调整，应该清空详情页的数据
        articleTitle.innerHTML = "";
        articleWrapper.innerHTML = "";
        reader.currArticleId = null;
        reader.listToDetail = true;
        reader.isWholeBill = false;
        reader.pd.destroy();
        reader.pd = null;
        screenIsSliding = false;
    }, false);


};

//在列表界面点击某一条单据后进行跳转，跳转完毕需要获取该单据下推生成目标单据的内容，
//并将其更新到对应的reader.articleids, 和 reader.articleHash 中以作生成单据详情、修改和提交用。
reader.gotoArticle = function (articleid) {
    var backIco = $s("#btn_con_artical_back");
    if (!$s.hasClass(backIco, 'none')) {
        $s.addClass(backIco, 'none');
    }
    zoomOut({
        onready: function (articlePage) {
            //获取最新的此详情界面的内容
            //若获取不到，则返回列表界面并重新加载，若是从过滤界面过来的则需要进行重新检索
            //假定从任何一个界面返回到列表界面，都需要重新获取当前单据的源单列表        
            var header = $s("#article_header");
            if ($s.hasClass(header, 'none')) {
                $s.removeClass(header, 'none');
            }

            articleTitle.innerHTML = lang.getText(Channels.channelHash[sWidgetId].sName + "_detail");

            var wrapper = document.createElement("article");
            wrapper.style.position = "absolute";
            wrapper.style.left = 0;
            wrapper.style.right = 0;
            wrapper.style.top = 0;
            wrapper.style.bottom = 0;
            wrapper.setAttribute("id", articleid);

            reader.pd = reader.initArticle(wrapper);
            reader.getStockData(function (data) {
                reader.pd.BindCKCWData(data.Data);
            });

            //从列表界面进行点击得到的单据，不允许进行新增行的操作
            //直接从列表界面进行扫描的，允许进行新增行的操作，可以允许扫描多张的单据
            if (reader.scanBill == null || typeof reader.scanBill == "undefined") {
                setTimeout(function () {
                    reader.isWholeBill = true;
                    reader.listToDetail = false;
                    reader.getBillData(function (data) { reader.pd.BindData(data, false) });
                }, 200);
            } else {
                setTimeout(function () {
                    reader.pd.BindData(reader.scanBill, true);
                    reader.isWholeBill = false;
                    reader.scanBill = null;
                }, 200);
            }
            //只针对内部进行数据更新的情况下
            reader.pd.ChangeCallBack(function (data) {
                reader.changeCallback(data);
            });

            reader.pd.FocusCallBack(function () {
  
            });

            reader.pd.BlurCallBack(function () {
       
            });
            //扫描订单之后进行数据的更新，存在多字段变化的情况
            reader.pd.SMDDChangeCallBack(function (data) {
                if (!data) {
                    reader.smddChangeCallback(data);
                }
            });

            articleWrapper.appendChild(wrapper);
            reader.pd.SubmitCallBack(function (data) {
                reader.submitBill(data);
            });

            //listPage.style['display'] = 'none';
        }
    });
};

//插件为全局量,进行扫描，得到数据进行回调
reader.scan = function () {
    reader.checkScanInfo();

    if ($s.hasClass(loadingLayer, 'none')) {
        $s.removeClass(loadingLayer, 'none');
    }

    screenIsSliding = true;

    //获取扫描的单据信息
    ActiveRequest = $s.post({
        url: serverBillAction,
        //sync: false,
        error: function (data) {
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
            screenIsSliding = false;
            ActiveRequest = null;
            //防止正在生成DOM结构的时候，有新的数据插入，因此在此期间内的扫描将不生效
            var oDate=new Date();   
            oDate.setDate(oDate.getDate() -1);       
            document.cookie='scan_msg=;expires='+oDate;
        },
        success: function (data) {
            ActiveRequest = null;
            screenIsSliding = false;
            //防止正在生成DOM结构的时候，有新的数据插入，因此在此期间内的扫描将不生效
            var oDate=new Date();   
            oDate.setDate(oDate.getDate() -1);       
            document.cookie='scan_msg=;expires='+oDate;

            //BUG： 2015-04-13 hongbo_liang 取消扫描成功的提示
            //reader.showTip(data.Message);            
            $s.addClass(loadingLayer, 'none');

            //还存在一种情况： 存在单据的情况下，再次扫描同类型的单据，则应该在列表中，进行单据的新增
            if ((typeof reader.currArticleId == "undefined" || reader.currArticleId == null) && reader.scanData.indexOf("<!!") > -1) {
                reader.currArticleId = data.Data[0].ShowData.TableData[0]["FDataKey"].DefaultValue.DisplayValue;
                reader.sourType = data.Data[0]["HeadData"]["FSelTranType"];
                reader.pd = null;
                reader.scanBill = data;
                reader.listToDetail = false;
                //进行初始化
                location.hash = "#~type=2&sType=" + reader.currArticleId;
            } else if (reader.pd != null && reader.scanData.indexOf("<!!") > -1) {
                reader.pd.SetDD(data);
            } else if (reader.pd != null && (reader.scanData.indexOf("<#!") > -1 || reader.scanData.indexOf("<*!") > -1)) {
                //物料二维码
                reader.pd.SetWL(data);
            }
            else if (reader.pd != null && reader.scanData.indexOf("<@!") > -1) {
                //仓库二维码
                reader.pd.SetCKCW(data);
            }
            else {
                reader.showTip(lang.getText("no_article_exist"));
            }
        },
        params: {
            type: "QRCODESCAN",
            data: {
                FSourClassTypeID: reader.sourType == null? 0: reader.sourType,
                ChoseDataKeys: reader.pd != null ? reader.pd.GetChoseKeys() : null,
                FDestClassTypeID: reader.getDestType(reader.currWidgetId),
                QRCodeStr: reader.scanData,
                IsRedBill: reader.isRedBill,
                HeadData: null,
                WholeBillInfo: {
                    IsWholeBill: reader.isWholeBill,
                    FClassTypeID: reader.currSrcType,
                    BillData: reader.pd != null ? reader.pd.GetEntryKey() : null
                }
            }
        }
    });
};

//在changeCallback中进行调用
reader.changeCallback = function (data) {
    $s.removeClass(loadingLayer, 'none');
    //获取扫描的单据信息
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
        },
        success: function (data) {
            ActiveRequest = null;
            reader.pd.UpDate(data);
            $s.addClass(loadingLayer, 'none');
        },
        params: {
            type: "MODIFYSCANDATA",
            data:{
                FSourClassTypeID: reader.sourType != null ? reader.sourType : reader.currSrcType,
                FDestClassTypeID: reader.getDestType(reader.currWidgetId),
                IsRedBill: reader.isRedBill,
                ModifyFields: data.ModifyFields,
                ModifyKeys: data.ModifyKeys
            }
        }
    });
};

//扫描订单修改后进行回调
reader.smddChangeCallback = function (data) {
    $s.removeClass(loadingLayer, 'none');
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
        },
        success: function (data) {
            ActiveRequest = null;
            reader.pd.UpDate(data);
            $s.addClass(loadingLayer, 'none');
        },
        params: {
            type: "MODIFYSCANLISTDATA",
             data:{
                FSourClassTypeID: reader.sourType != null ? reader.sourType : reader.currSrcType,
                FDestClassTypeID: reader.getDestType(reader.currWidgetId),
                IsRedBill: reader.isRedBill,
                ModifyFields: data.ModifyFields,
                ModifyKeys: data.ModifyKeys
            }
        }
    });
};

reader.batchChangeCallback = function(batchData){
    $s.removeClass(loadingLayer, 'none');
    //获取扫描的单据信息
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
        },
        success: function (data) {
            ActiveRequest = null;
            reader.pd.UpDate(data);
            $s.addClass(loadingLayer, 'none');
        },
        params: {
            type: "MODIFYSPLITSTOCKDATA",
            data:{
                FSourClassTypeID: reader.sourType != null ? reader.sourType : reader.currSrcType,
                FDestClassTypeID: reader.getDestType(reader.currWidgetId),
                IsRedBill: reader.isRedBill,
                ModifyFields: batchData.ModifyFields,
                ModifyKeys: batchData.ModifyKeys
            }
        }
    });
}

//提交单据
reader.submitBill = function (data) {
    $s.removeClass(loadingLayer, 'none');
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
        },
        success: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, "none");
            //成功后进行,进行列表的刷新
            reader.checkUpdate();
            reader.showTip(data.Message);
            //提交成功后，进行返回
            // history.back();
            reader.clearSession();
        },
        params: {
            type: "SAVESCANDATA",
            data: {
                FSourClassTypeID: reader.sourType != null ? reader.sourType : reader.currSrcType,
                FDestClassTypeID: reader.getDestType(reader.currWidgetId),
                IsRedBill: reader.isRedBill,
                HeadData: data.HeadData,
                EntryData: data.EntryData,
                SplitBatchData: data.SplitBatchData
            }
        }
    });
};


reader.clearSession = function () {
    $s.removeClass(loadingLayer, 'none');
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
        },
        success: function (data) {
            ActiveRequest = null;
            $s.addClass(loadingLayer, "none");
            reader.sourType = null;
            history.back();
        },
        params: {
            type: "CLEARBILLSESSION",
            data: {
                FSourClassTypeID: reader.sourType != null ? reader.sourType : reader.currSrcType,
                FDestClassTypeID: reader.getDestType(reader.currWidgetId),
                IsRedBill: reader.isRedBill
            }
        }
    });
}

reader.initArticle = function (wrapper) {
    switch (sWidgetId) {
        case "sltz":
        case "win":
        case "wwrk":
        case "scrk":
        case "xsckr":
        case "scllr":
            return new PDA.RK(wrapper, window.innerHeight - 40);
        case "scll":
        case "winr":
        case "xsck":
        case "wwck":
            var delivery = new Delivery(wrapper, null);
            delivery.BindBatchCallBack(function (data) {
                //获取拆批的数据
                reader.getBatchData(data, function (batchData) {
                    //回调进行更新批次信息
                    delivery.BindBatchData(batchData);
                });
            });

            delivery.BatchChangeCallBack(function(data){
                reader.batchChangeCallback(data);
            })
            return delivery;
    }
};

//对二维码信息进行修改替换
reader.checkScanInfo = function () {
    //将二维码中的：和 " 号分别替换为 @&, @#
    //<!!1|71|1211|2|390.0000000000!!>@&A@#POORD000068@&B@#1@&C@&1@&D@#1.01.000.00002@&E@#621
    reader.scanData = reader.scanData.replace(/[\"]/g, "@&");
    reader.scanData = reader.scanData.replace(/[\:]/g, "@#");
};

//获取仓库仓位信息
reader.getStockData = function (callback) {
    $s.removeClass(loadingLayer, 'none');
    ActiveRequest = $s.post({
        url: serverBillAction,
        success: function (data) {
            $s.addClass(loadingLayer, 'none');
            ActiveRequest = null;
            callback && callback(data);
        },
        error: function (data) {
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
            ActiveRequest = null;
        },
        params: {
            type: "GETSTOCK",
            data: false
        }
    });
};


//获取单据信息
reader.getBillData = function (callback) {
    $s.removeClass(loadingLayer, 'none');
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            ActiveRequest = null;
            reader.checkUpdate();
            $s.addClass(loadingLayer, 'none');
            reader.showTip(data.Message);
        },
        success: function (data) {
            $s.addClass(loadingLayer, 'none');
            ActiveRequest = null;
            if (data.Data != null) {
                var FSourTranType = data.Data[0]["HeadData"]["FSelTranType"];
                reader.sourType = FSourTranType == 0 ? null : FSourTranType;
            }
            reader.checkUpdate();
            callback && callback(data);
        },
        params: {
            type: "GETDESTBILLS",
            data: {
                FClassTypeID: reader.currSrcType,
                FDestClassTypeID: reader.getDestType(sWidgetId),
                FInterID: reader.currArticleId,
                IsRedBill: reader.isRedBill
            }
        }
    });
};

//获取当前分录的拆批数据
reader.getBatchData = function (entryData, callback) {

    var batchData = {
        FDestClassTypeID: reader.getDestType(sWidgetId),
        FSourClassTypeID: reader.sourType != null ? reader.sourType : reader.currSrcType,
        ItemInfo: entryData.data,
        IsRedBill: reader.isRedBill,
        FDataKey: entryData.key
    };

    $s.removeClass(loadingLayer, 'none');
    ActiveRequest = $s.post({
        url: serverBillAction,
        error: function (data) {
            $s.addClass(loadingLayer, 'none');
            //BUG： 2015-04-13 hongbo_liang 移除没有批次信息的提示
            //reader.showTip(data.Message);
            callback && callback(data);
            ActiveRequest = null;
        },
        success: function (data) {
            $s.addClass(loadingLayer, 'none');
            ActiveRequest = null;
            if (data.Data.length <= 0) {
                //BUG： 2015-04-13 hongbo_liang 移除没有批次信息的提示
                //reader.showTip(MESSAGES.NO_BATCH_INFO);
            }
            callback && callback(data);
        },
        params: {
            type: "GETBATCHANDSTOCK",
            data: batchData
        }
    });
};


reader.setArticles = function () {
    var nextIndex = reader.articleIndex + 1;
    var prevIndex = reader.articleIndex - 1;

    if (prevIndex < 0) {
        reader.prevArticle = null;
    } else {
        var previd = reader.articleids[prevIndex];
        //TODO: 获取最新的此详情界面的内容
        //若获取不到，则返回列表界面并重新加载，若是从过滤界面过来的则需要进行重新检索
        //假定从任何一个界面返回到列表界面，都需要重新获取当前单据的源单列表
        var element = ArticleFactory(previd).element();

        if (!articlePage.contains(element)) {
            element.style.display = 'none';
            articleWrapper.appendChild(element);
        }
        reader.prevArticle = element;

        //reader.bindImageLoadEventOfArticle(reader.prevArticle); // 图片加载重设scrollView
    }

    if (nextIndex >= reader.articleids.length) {
        reader.nextArticle = null;
    } else {
        var nextid = reader.articleids[nextIndex];
        //TODO: 获取最新的此详情界面的内容
        //若获取不到，则返回列表界面并重新加载，若是从过滤界面过来的则需要进行重新检索
        //假定从任何一个界面返回到列表界面，都需要重新获取当前单据的源单列表
        var element = ArticleFactory(nextid).element();
        if (!articlePage.contains(element)) {
            element.style.display = 'none';
            articleWrapper.appendChild(element);
        }
        reader.nextArticle = element;

        //reader.bindImageLoadEventOfArticle(reader.nextArticle); // 图片加载重设scrollView
    }
};

//TODO: 修改为直接通过chanels 来获取，或者是直接通过传参数的方式进行
var getDestType = function (sWidgetId) {
    var destType;
    switch (sWidgetId) {
        case "sltz":
            destType = 72
            break;
        case "win":
        case "winr":
            destType = 1
            break;
        case "xsfh":
            destType = 83;
            break;
        case "xsck":
        case "xsckr":
            destType = 21;
            break;
        case "scrw":
            destType = 551;
            break;
        case "scll":
        case "scllr":
            destType = 24;
            break;
        case "scrk":
        case "scrkr":
            destType = 2;
            break;
        case "wwrk":
            destType = 5;
            break;
        case "wwck":
            destType = 28;
            break;
        case "rkpd":
            destType = 1014400;//添加盘点方案列表
            break;
    }

    return destType;
};

reader.getDestType = getDestType;

reader.init = function (sWidgetId, isRedBill) {
    reader.isRedBill = isRedBill;
    reader.currWidgetId = sWidgetId;

    var tab = null;
    for (var id in srcType) {
        if (srcType[id].sWidgetId == sWidgetId && srcType[id]["vSrcType"].length > 0) {
            tab = srcType[id];
            break;
        }
    }
    if (!tab) {
        //TODO: 增加另外一种情况，没有源单的情况
        if(reader.getDestType(sWidgetId) == "551"){
            reader.currSrcType = 85;
            reader.initDom();
        }else{
            listWrapper.innerHTML = "<p>" + lang.getText("scan_qrcode") + "</p>";
        }
    } else {
        var options = { tabdata: tab };
        new SrcTypeTabs(listWrapper, options);
    }

    reader.startMonitor();
};

reader.startMonitor = function(){
    monitorInterval = setInterval(function () {
        if(getCookie("scan_msg") != null && getCookie("scan_msg") != ""){
            if ($s.hasClass(loadingLayer, 'none') && ActiveRequest == null) {
                $s.removeClass(loadingLayer, 'none');
            }
            //获取到数据之后，立即将该cookie进行过期处理，以方便移除的处理
            reader.scanData = getCookie("scan_msg");
            var oDate = new Date();
            oDate.setDate(oDate.getDate() - 1);
            document.cookie = 'scan_msg=;expires=' + oDate;

            reader.scan();
        }
    }, 300);
}

reader.initDom = function () {
    var foundHandler = function (cache) {
        reader.initAttributes(cache);
        reader.initFontSize();
        if ($s.isEmptyObject(reader.pageHash)) {
            noCache();
        } else {
            hasCache();
        }
    };

    var notFoundHandler = function () {
        var cache = {};
        cache.ids = [];
        cache.Hash = {};

        var fileName = reader.currWidgetId + "_" + reader.currSrcType;
        //cacheMgr.set(fileName, cache);
        reader.initAttributes(cache);
        reader.initFontSize();
        noCache();
        screenIsSliding = false;
    };

    var hasCache = function () {
        reader.initFromCache();
        if (navigator.onLine) {
            reader.checkUpdate();
        }

    };

    var noCache = function () {
        if (!navigator.onLine) {
            return reader.showTip(MESSAGES.NETWORK_ERROR);
        }
        // 显示loading
        $s.removeClass(loadingLayer, 'none');
        ActiveRequest = $s.post({
            url: serverBillAction,
            error: function (data) {
                $s.addClass(loadingLayer, 'none');
                reader.showTip(data.Message)
                ActiveRequest = null;
            },
            success: function (data) {
                /*清除当前的列表*/
                $s('#content_' + reader.currSrcType).innerHTML = '';
                if (data.Data != null) {
                    var vPageIdList = [];
                    for (var i = 0; i < data.Data.length; i++) {
                        vPageIdList.push(data.Data[i].sPageId);
                    }
                    reader.updatePageIds(vPageIdList);
                    //reader.fetchPageData(reader.oninit);                
                    var vNewsPage = data.Data;

                    for (var i = 0, j = vNewsPage.length; i < j; i++) {
                        var arrayItem = vNewsPage[i];

                        // 更新分页表
                        reader.updatePageHash(arrayItem);
                    }
                    // 更新offset
                    reader.pageOffset = reader.pageOffset + vNewsPage.length;

                    // 更新ID数组
                    reader.resetArticleIds();

                    // 更新表
                    reader.resetArticleHash(arrayItem.vTotalInfo);
                    ActiveRequest = null;
                    // 直接执行回调
                    reader.oninit(vNewsPage);
                } else {
                    reader.showTip(data.Message);
                }

                $s.addClass(loadingLayer, 'none');
            },
            params: {
                type: "GETPENDINGBILLS",
                data: {
                    FClassTypeID: reader.currSrcType,
                    FDestClassTypeID: reader.getDestType(sWidgetId),
                    IsRedBill: reader.isRedBill,
                    PageSize: reader.pagesize,
                    LastInterID: 0,
                    Filter: ""
                }
            }
        });
    };

    // 正文页的添加按钮
    var installed = Launcher.checkInstalled(sWidgetId);
    if (!installed) {
        headerBtnAdd.style.display = '';
    } else {
        headerBtnAdd.style.display = 'none';
    }

    if (reader.supportOfflineCache) {
        //不再进行数据的缓存，原有的缓存数据将通过 Webview 在下次的扫描进行登录的时候进行清空, 因为单据的变化较快
        //cacheMgr.get(sWidgetId + "_" + reader.currSrcType, foundHandler, notFoundHandler);
        notFoundHandler()
    } else {
        var cache = {};
        cache.ids = [];
        cache.Hash = {};
        screenIsSliding = false;
        reader.initAttributes(cache);
        reader.initFontSize();
        noCache();
    }
};

reader.gotoLauncher = function () {
    if (screenIsSliding) return;
    screenIsSliding = true;
    sliding({
        a: launcherPage,
        b: listPage,
        direction: 'right',
        ready: function () {
            reader.destroy();
            launcherCurrPage = launcherPage;
            currentChannel = null;
            screenIsSliding = false;
        }
    })
};

reader.destroy = function () {
    reader.pageHash = {};
    reader.articleHash = {};
    reader.pageids = [];
    reader.pageIndex = 0;
    reader.pageOffset = 0;
    reader.articleIndex = 0;
    reader.loadingPages = false;

    if (ActiveRequest) {
        ActiveRequest.abort();
    }

    if (reader.pageFlip) {
        reader.pageFlip.destroy();
        delete reader.pageFlip;
    }

    if (reader.articleFlip) {
        reader.articleFlip.destroy();
        delete reader.articleFlip;
    }

    if (reader.pageSlider) {
        reader.pageSlider.position();
        reader.pageSlider.destroy();
        delete reader.pageFlip;
        currentPagerInfo.innerHTML = '';
        $s.addClass(pagerCon, 'none');
    }

    if (reader.articleScroller) {
        reader.articleScroller.destroy();
    }

    channelTitle.innerHTML = '';
    listWrapper.innerHTML = '';
    articleWrapper.innerHTML = '';
};