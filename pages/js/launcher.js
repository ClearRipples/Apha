//localStorage.clear();
// constants
var MESSAGES = {
    NETWORK_ERROR: '网络不可用，请检查网络',
    NO_UPDATE: '暂时没有更新',
    NO_BEFORE: '第一篇',
    NO_AFTER: '最后一篇',
    NO_MORE: '没有更多了',
    LOADING: '正在更新中...',
    IS_LOADING: '加载中，请耐心等待',
    DOWNLOADING: '正在下载离线内容...',
    DELETE_CACHE_SUCCEED: '删除成功',
    CHANNEL_LIMIT: '订阅失败，订阅功能总数已达上限'
};

var server = "../QRCodeServiceForPDA.ashx";
var screenIsSliding = false;
var currentChannel = null;

var categoryList = $s('#category_list');
var cacheMgrList = $s('#clear_cache_list');
var settingPage = $s('#setting_page');
var launcherPage = $s('#launcher_page');
var categoryPage = $s('#category_page');
var launcherMenu = $s('#launcher_menu');
var editFinishBtn = $s('#finish_edit_btn');
var headerBtnAdd = $s('#header_btn_add');
var flashPage = $s('#first_sight');
var iosTip = $s('#ios_tips');


var channelTemplate = $s('#channel_icon_template').innerHTML;
var categoryTemplate = $s('#category_template').innerHTML;
//BUG:hongbo_liang 按照原型进行绘制
//var categoryTemplate = $s('#category_template_new').innerHTML;
var clearCacheTemplate = $s('#clear_cache_list_template').innerHTML;

//默认为空
var defaultChannels = [];

var launcherCurrPage = launcherPage;
var launcherInstance;


var installedChannels = [];
var userinstalledChannels = []


var Channels = {
    init: function () {

        var sid = $s.cache.getItem('sid');

        if (!$s.cache.getItem('userinstalledChannels')) {
            $s.cache.setItem('userinstalledChannels', [{ sid: sid, installedChannels: [] }]);
        }

        userinstalledChannels = $s.cache.getItem('userinstalledChannels');
        var isExist = false;
        for (var i = 0; i < userinstalledChannels.length; i++) {
            if (userinstalledChannels[i].sid == $s.cache.getItem('sid')) {
                installedChannels = userinstalledChannels[i].installedChannels;
                isExist = true;
                break;
            }
        }

        if (!isExist) {
            userinstalledChannels.push({ sid: sid, installedChannels: [] });
            isExist = false;
        }

        this.categoryScroller = new iScroll(categoryList);
        this.cacheMgrListScroller = new iScroll(cacheMgrList);        

        if ($s.cache.getItem('categorys')) {
            setTimeout(function () {
               // Launcher.removeFlash(function () {
                    Channels.initDom();
                    Channels.initClearCacheDom();
                    Launcher.showIosTip();
               // });
            }, 400);
        } else {          
            location.hash = "#~type=7";
        }
    },
    initDom: function () {
        var cats = $s.cache.getItem('categorys');
        var wareList = $s('#ware_list');

        Channels.channelHash = {};
        for (var i = 0, j = cats.length; i < j; i++) {
            var cat = $s.html2dom(
                categoryTemplate.tmpl(
                    cats[i]
                )
            );

            wareList.appendChild(cat);

            // 整理功能数据
            for (var k = 0, l = cats[i].vWidget.length; k < l; k++) {
                var widget = cats[i].vWidget[k];
                Channels.channelHash[widget.sWidgetId] = widget;
            }
        }

        for (var m = 0, n = defaultChannels.length; m < n; m++) {
            var widget = defaultChannels[m];
            Channels.channelHash[widget.sWidgetId] = widget;
        }

        Channels.initDomEvents();
        Channels.initLauncher();
    },
    initClearCacheDom: function () {
        var len = installedChannels.length;
        var clearCacheWrap = $s('#clear_cache_wrap');
        clearCacheWrap.innerHTML = "";
        for (var i = 0; i < len; i++) {
            var ele = $s.html2dom(clearCacheTemplate.tmpl(installedChannels[i]));
            clearCacheWrap.appendChild(ele);
            var clearBtn = ele.querySelector(".clear_channe_cache");
            clearBtn && $s.bind(clearBtn, 'click', Launcher.cacheMgr);
           
            // 检测是否有缓存数据
            if (!isUc) {

                //TODO: 处理单据列表的缓存
                //var src = null;

                //for (var id in srcType) {
                //    src = srcType[id];
                //    if (src.iDestId == getDestType(installedChannels[i].sWidgetId)) {
                //        cacheMgr.check(installedChannels[i].sWidgetId + '_' + src.iDestId, Channels.CacheExist, Channels.CacheNotExist);
                //    }
                //}
                cacheMgr.check(installedChannels[i].sWidgetId, Channels.CacheExist, Channels.CacheNotExist);
            }

        }
    },
    CacheNotExist: function (name) {
        //var idName = "ch_" + name.slice(0, name.indexOf('_'));
        var idName = "ch_" + name;
        var children = document.getElementById(idName).firstElementChild;
        children.querySelector("i.btn").innerHTML = lang.getText("clear_cache");
        if ($s.hasClass(children, "active")) {
            $s.removeClass(children, "active");
        }
    },
    CacheExist: function (name) {
        //var idName = "ch_" + name.slice(0, name.indexOf('_'));
        var idName = "ch_" + name;
        var children = document.getElementById(idName).firstElementChild;
        children.querySelector("i.btn").innerHTML = lang.getText("clear_cache");
        if (!$s.hasClass(children, "active")) {
            $s.addClass(children, "active");
        }
    },
    initDomEvents: function () {
        var cons = document.querySelectorAll('.ware_child_list');
        var len = cons.length;
        for (var i = 0; i < len; i++) {
            var links = cons[i].querySelectorAll('.checkbox');
            for (var m = 0; m < links.length; m++) {
                this.clickCheckboxHandler(links[m]);
                //BUG 2015-04-13 hongbo_liang 移除从功能列表跳转到功能列表的功能
                //var channelLink = links[m].previousElementSibling;
                //this.clickChannelLinkHandler(channelLink);
            }
        }

        var cats = document.querySelectorAll('a[type="channel_category"]');
        for (var m = 0, n = cats.length; m < n; m++) {
            this.clickCatHandler(cats[m]);
        }

        var backBtn = $s('#channels_back_to_launcher_btn');
        $s.tap(backBtn, function (e) {         
            history.back();
            //Channels.gotoLauncherPage();
        });
    },
    clickChannelLinkHandler: function (channellink) {        
        $s.tap(channellink, function (e) {
            var cid = channellink.getAttribute('widgetid');
            var isRed = channellink.getAttribute('isRed');
            location.hash = "#~type=1&sType=" + cid + "&isRed=" + isRed;
            //Launcher.gotoChannel(cid);
        });
    },
    initLauncher: function () {
        if (installedChannels.length === 0) {
            for (var m = 0, n = defaultChannels.length; m < n; m++) {
                var widget = defaultChannels[m];
                widget.index = m;
                installedChannels.push(widget);
            }
        }

        launcherInstance = new Launcher($s('#channels_installed'));
        launcherInstance.onaddChannel = function (o, e) {
            
            var channel = $s.clone(e.channel);
            var cid = e.channel.sWidgetId;
            installedChannels.push(channel);

            // 替换默认图片
            var icon = channel.sIconUrl;
            var img = new Image();
            img.src = icon;
            img.onload = function () {
                $s.addClass($s('#default_icon_' + e.channel.sWidgetId), 'none');
                $s.removeClass($s('#real_icon_' + e.channel.sWidgetId), 'none');
            };

            for (var i = 0; i < userinstalledChannels.length; i++) {
                if (userinstalledChannels[i].sid == $s.cache.getItem('sid')) {
                    userinstalledChannels[i].installedChannels = [];
                    userinstalledChannels[i].installedChannels = installedChannels;
                    break;
                }
            }

            // 更新缓存
            $s.cache.removeItem('userinstalledChannels');
            $s.cache.setItem('userinstalledChannels', userinstalledChannels);

            // 打勾
            var checkbox = $s('#checkbox_' + cid);
            if (checkbox) {
                $s.addClass($s('#checkbox_' + cid), 'active');
            }

            // 绑定删除按钮事件
            var removeBtn = $s('#remove_channel_button_' + cid);
            if (removeBtn) {
                $s.bind(removeBtn, TOUCHSTART, function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    Launcher.removeChannel(cid);
                });
            }
        };
        //在功能列表页面进行删除
        launcherInstance.onremoveChannel = function (o, e) {
            // 处理动画
            var sortIndex = e.sortIndex;
            for (var i = 0, j = o.channels.length; i < j; i++) {
                var channel = o.channels[i];

                if (channel.data.index > sortIndex) {
                    channel.data.index = channel.data.index - 1;
                    channel.indexChanged = true;
                }
            }

            var positions = o.positions;

            setTimeout(function () {
                for (var m = 0, n = o.channels.length; m < n; m++) {
                    var channel = o.channels[m];
                    if (channel.indexChanged) {
                        var position = positions[channel.data.index];
                        setTransform(channel.element, position[0] + 'px', position[1] + 'px', 0);
                        channel.position.x = position[0];
                        channel.position.y = position[1];
                    }
                }

                screenIsSliding = true;
                setTimeout(function () {
                    screenIsSliding = false;
                }, 400);
            }, 100);
            // 去勾
            var checkEle = $s('#checkbox_' + e.removeid);
            if (checkEle != null)
                $s.removeClass(checkEle, 'active');
            // 更新数据
            installedChannels = [];
            for (var i = 0, j = o.channels.length; i < j; i++) {
                installedChannels.push(o.channels[i].data);
            }

            for (var i = 0; i < userinstalledChannels.length; i++) {
                if (userinstalledChannels[i].sid == $s.cache.getItem('sid')) {
                    userinstalledChannels[i].installedChannels = [];
                    userinstalledChannels[i].installedChannels = installedChannels;
                    break;
                }
            }
            // 更新缓存
            $s.cache.removeItem('userinstalledChannels');
            $s.cache.setItem('userinstalledChannels', userinstalledChannels);
            // 删除filesystem中的缓存文件
            var js = e.removeid + "";

            //TODO: 需要WebView中启用WebSQL的支持
            if (!isUc) {
                cacheMgr.drop(js);
            }
        };

        var channelInstances = [];
        for (var i = 0, j = installedChannels.length; i < j; i++) {
            //进行权限的判断
            if (Channels.channelHash[installedChannels[i].sWidgetId].sRight) {
                channelInstances.push(
                    new Channel(
                        installedChannels[i]
                    )
                )
            }
        }
        installedChannels = [];
        launcherInstance.initialize(channelInstances);
    },
    clickCatHandler: function (cat) {
        var t = Channels;
        $s.tap(cat, function (e) {
            Channels.categoryScroller.destroy();
            t.toggleSubs(cat);
            Channels.categoryScroller = new iScroll(categoryList);
            Channels.categoryScroller.refresh();
        });
    },
    toggleSubs: function (cat) {
        var status = cat.getAttribute('status');

        if (!status) {
            cat.setAttribute('status', 'shrink');
        }

        var subChannelsContainer = cat.nextElementSibling;
        if (subChannelsContainer) {
            if (cat.getAttribute('status') === 'expand') {
                $s.swapClass(cat.parentNode, 'read_ico_down', 'read_ico_right_02');
                $s.addClass(subChannelsContainer, 'none');
                cat.setAttribute('status', 'shrink');

                Channels.currExpand = null;
            } else if (cat.getAttribute('status') === 'shrink') {
                $s.swapClass(cat.parentNode, 'read_ico_right_02', 'read_ico_down');
                $s.removeClass(subChannelsContainer, 'none');
                cat.setAttribute('status', 'expand');

                if (Channels.currExpand) {
                    Channels.currExpand.setAttribute('status', 'shrink');
                    $s.swapClass(Channels.currExpand.parentNode, 'read_ico_down', 'read_ico_right_02');
                    $s.addClass(Channels.currExpand.nextElementSibling, 'none');
                }
                Channels.currExpand = cat;
            }

            setTimeout(function () {
                Channels.categoryScroller.refresh();
            }, 17);
        }
    },
    clickCheckboxHandler: function (link) {
        var t = Channels;

        $s.tap(link, function (e) {
            var el = e.target;
            var cid = el.getAttribute('widgetid');
            if ($s.hasClass(el, 'active')) {             
                Launcher.removeChannel(cid);
            } else {
                //statistics.operation(E_SI_ADDWIDGETCOUNT);
                if (!Channels.channelHash[cid].sRight) {
                    reader.showTip(lang.getText("no_rights"));
                } else {
                    t.addChannel(el.getAttribute('widgetid'));
                }
            }
        });
    },
    addChannel: function (widgetId) {
        //BUG: 2015-04-14 hongbo_liang 应该使用克隆数据，避免修改原有数据，导致 index 计算错误
        var channelData = $s.clone(Channels.channelHash[widgetId]);

        launcherInstance.addChannel(
            new Channel(channelData)
        );
    }
};

Channels.gotoLauncherPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;
    sliding({
        a: launcherPage,
        b: categoryPage,
        direction: 'right',
        ready: function () {
            screenIsSliding = false;
            launcherCurrPage = launcherPage;
            currentChannel = null;
        }
    });
};

var SettingPage = function () { };
SettingPage.init = function () {
    // 初始化离线
    if ($s.cache.getItem('auto_download') === undefined) {
        $s.cache.setItem('auto_download', false);
    }

    var autoDownloadBtn = $s('#auto_download_btn');
    var cacheMgr = $s('#clear_cache_btn');
    var cacheMgrHeader = $s('#back_to_setting');
    var clickHandler = function (e) {
        SettingPage.toggleAutoDownload();
    };
    var clickCacheMgr = function (e) {
        location.hash = "#~type=6";
        //SettingPage.gotoClearCachePage();
    };
    var clickBackSetting = function (e) {
        history.back();
        //SettingPage.backToSettingPage();
    };
    //$s.bind(autoDownloadBtn, 'click', clickHandler);
    $s.bind(cacheMgr, 'click', clickCacheMgr);
    $s.bind(cacheMgrHeader, 'click', clickBackSetting);

    var flag = $s('#auto_download_icon');
    if ($s.cache.getItem('auto_download')) {
        $s.addClass(flag, 'active');
    }

    var eLoginStatus = $s('#login_status_txt');
    var eNickName = $s('#setting_nickname');

    if ($s.cache.getItem('sid')) {
        if ($s.cache.getItem('nickname')) {
            eLoginStatus.innerHTML = lang.getText("curr_user");
            eNickName.innerHTML = $s.cache.getItem('nickname');
        }
    } else {
        eLoginStatus.innerHTML = lang.getText("sign_in_qrcode");
        eNickName.innerHTML = '';
    }

    var settingBackLauncherBtn = $s('#setting_back_to_launcher_btn');
    $s.tap(settingBackLauncherBtn, function (e) {
        history.back();
        //SettingPage.gotoLauncherPage();
    });

    var logoutBtn = $s('#logout_btn');
    $s.tap(logoutBtn, function () {
        location.hash = "#~type=8";
    });

    if (isUc) {
        cacheMgr.style.display = 'none';
    }
};

SettingPage.Logout = function () {
    if (!Launcher.logoutConfirm) {
        Launcher.logoutConfirm = new cConfirm({
            ok: function (o, e) {
                $s.cache.setItem('sid', null);
                var eLoginStatus = $s('#login_status_txt');
                var eNickName = $s('#setting_nickname');
                eLoginStatus.innerHTML = lang.getText("no_login");
                eNickName.innerHTML = '';
//                history.back();
                //返回到登陆页面                
                $s.removeClass(loadingLayer, "none");                                
                //Launcher.channelsHash = {};

                screenIsSliding = true;
                ActiveRequest = $s.post({
                    url: server,
                    error: function (data) {
                        history.back();
                    },
                    success: function (data) {                        
                        $s.cache.removeItem("sid");
                        $s.cache.removeItem("nickname");
                        $s.addClass(loadingLayer, "none");


                        cacheMgrList.children[0].innerHTML = "";
                        categoryList.children[0].innerHTML = "";
                        launcherInstance.positions = [];
                        launcherInstance.channel = [];
                        launcherPage.querySelector('#channels_installed').innerHTML = '<li id="channel_add" class="none" style="-webkit-transition: 0.4s; );"><a href="javascript:;" class="addOne" id="add_channel_btn">+</a></li>';
                        userinstalledChannels = [];
                        installedChannels = [];

                        //清理 cookie
                        var oDate=new Date();   
                        oDate.setDate(oDate.getDate() -1);       
                        document.cookie='_info=;expires='+oDate;

                        location.hash = "#~type=7";
                        //SettingPage.gotoLogonPage();
                        ActiveRequest = null;
                        screenIsSliding = false;
                    },
                    params: {
                        type: "LOGOUT",
                        data: null
                    }
                });
            },
            cancel: function () {
                history.back();
            }
        });

        Launcher.logoutConfirm.setTitle(lang.getText('title'));
        Launcher.logoutConfirm.setContent(lang.getText('sure_to_logout'));
    }

    Launcher.logoutConfirm.show();

};

SettingPage.toggleAutoDownload = function () {
    var auto = $s.cache.getItem('auto_download');
    var flag = $s('#auto_download_icon');
    if (!auto) {
        $s.addClass(flag, 'active');
    } else {
        $s.removeClass(flag, 'active');
    }

    $s.cache.setItem('auto_download', !auto);
};

SettingPage.gotoClearCachePage = function () {
    var setHeader = $s('#set_header');
    var setWrap = $s('#set_main');
    var clearHeader = $s('#clear_cache_head');
    var clearWrap = $s('#clear_cache_list');
    $s.hasClass(setHeader, "none") || $s.addClass(setHeader, "none");
    $s.hasClass(setWrap, "none") || $s.addClass(setWrap, "none");
    $s.hasClass(clearHeader, "none") && $s.removeClass(clearHeader, "none");
    $s.hasClass(clearWrap, "none") && $s.removeClass(clearWrap, "none");
    Channels.cacheMgrListScroller && Channels.cacheMgrListScroller.refresh();
    Channels.cacheMgrListScroller.scrollTo(0, 0);

    //更新缓存状态
    if (!isUc) {
        var len = installedChannels.length;
        for (var i = 0; i < len; i++) {
            //TODO: 处理单据列表的缓存
            //var src = null;

            //for (var id in srcType) {
            //    src = srcType[id];
            //    if (src.iDestId == getDestType(installedChannels[i].sWidgetId)) {
            //        cacheMgr.check(installedChannels[i].sWidgetId + '_' + src.iDestId, Channels.CacheExist, Channels.CacheNotExist);
            //    }
            //}
            cacheMgr.check(installedChannels[i].sWidgetId, Channels.CacheExist, Channels.CacheNotExist);
        }
    }
};

SettingPage.gotoLogonPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;

    sliding({
        a: logonPage,
        b: settingPage,
        direction: 'right',
        ready: function () {
            screenIsSliding = false;
        }
    });
};

//返回到设置页面
SettingPage.backToSettingPage = function () {
    var setHeader = $s('#set_header');
    var setWrap = $s('#set_main');
    var clearHeader = $s('#clear_cache_head');
    var clearWrap = $s('#clear_cache_list');
    $s.hasClass(clearHeader, "none") || $s.addClass(clearHeader, "none");
    $s.hasClass(clearWrap, "none") || $s.addClass(clearWrap, "none");
    $s.hasClass(setHeader, "none") && $s.removeClass(setHeader, "none");
    $s.hasClass(setWrap, "none") && $s.removeClass(setWrap, "none");
};
//从设置页面跳转到主控台页面
SettingPage.gotoLauncherPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;
    sliding({
        a: launcherPage,
        b: settingPage,
        direction: 'right',
        ready: function () {
            screenIsSliding = false;
            currentChannel = null;
        }
    });
};

var itemWidth;
var itemHeight;

//实例化主控台页面
var Launcher = function (element) {
    this.element = element; // launch wrap
    this.element.style.width = sw + 'px';
    this.cols = 4;

    var floor = Math.floor;
    var mw = window.innerWidth;
    var mh = window.innerHeight - 67;

    var hRatio = 6;

    var width = (mw * hRatio) / (hRatio * this.cols + this.cols + 1);
    //var height = (110 * width) / 92;
    var height = (107 * width) / 96;
    //var height = width+20;

    var rows = Math.floor(mh / height);
    var minVerticalMargin = 5;

    var totalMargin = mh % height;
    rows = (mh - totalMargin) / height;

    var marginVertical = totalMargin / (rows + 1);
    if (marginVertical < minVerticalMargin) {
        rows = rows - 1;
        totalMargin = mh - height * rows;
        marginVertical = totalMargin / (rows + 1);
    }

    rows = parseInt(rows);

    this.rows = rows;
    this.channelsPerPage = this.cols * this.rows;
    this.marginHorizontal = width / hRatio;
    this.marginVertical = marginVertical;
    this.channelWidth = width;
    this.channelHeight = height;

    itemWidth = this.channelWidth;
    itemHeight = this.channelHeight;

    console.log(this.marginHorizontal, this.marginVertical);
};

Launcher.prototype.max = 36;
Launcher.prototype.screens = 0;
Launcher.prototype.channels = [];
Launcher.prototype.positions = [];
Launcher.prototype.channelsHash = {};   

Launcher.prototype.initialize = function (channels) {
    this.channels = [];
    this.initScreenFlip(); //左右滑动效果
    for (var i = 0, j = channels.length; i < j; i++) {
        this.addChannel(channels[i]);
    }
    this.initAddIcon();
};

Launcher.prototype.initAddIcon = function () {
    var len = this.channels.length;
    var position = this.getPositionByIndex(len);
    var xyz = [position[0] + 'px', position[1] + 'px', 0].join(',');
    var before = 'translate3d(';
    var after = ')';
    var channelDom = $s("#channel_add");
    channelDom.style[TRANSFORM] = before + xyz + after;
    var aEle = channelDom.querySelector("a");
    //aEle.style["border-radius"] = itemWidth + "px"
    //aEle.style["-moz-border-radius"] = itemWidth + "px"
    //aEle.style["-webkit-border-radius"] = itemWidth + "px"
    aEle.style.width = itemWidth + "px";
    aEle.style.height = itemHeight + "px";
    if ($s.hasClass(channelDom, 'none'))
        $s.removeClass(channelDom, 'none');
};

Launcher.prototype.hideAddIcon = function () {
    var channelDom = $s("#channel_add");
    if (!$s.hasClass(channelDom, 'none'))
        $s.addClass(channelDom, 'none');
};
Launcher.prototype.showAddIcon = function () {
    var channelDom = $s("#channel_add");
    if ($s.hasClass(channelDom, 'none'))
        $s.removeClass(channelDom, 'none');
};

/**
* 用于处理桌面多页icon时左右滑动效果
*/
Launcher.prototype.initScreenFlip = function () {
    this.screenFlip = new Touch(this.element);

    var l = this;
    var t = this.screenFlip;
    t.currentState = 'inactive';
    t.currentScreen = 0;
    t.onstart = function (o, e) {
        switch (t.currentState) {
            case 'inactive':
                if (!t.currentOffset) {
                    t.currentOffset = getElementTransformOffset(o.el).x;
                }
                break;
            case 'follow':
                break;
            case 'sliding':
                break;
            default:
                break;
        }
    };

    t.onmove = function (o, e) {

        switch (t.currentState) {
            case 'inactive':
                t.currentState = 'follow';
                break;
            case 'follow':
                var x = 0;
                if (e.deltaX < 0 && !t.hasNext()) {
                    x = t.currentOffset + e.deltaX / 2;
                } else if (e.deltaX > 0 && !t.hasPrev()) {
                    x = t.currentOffset + e.deltaX / 2;
                } else {
                    x = t.currentOffset + e.deltaX;
                }
                //console.log("offset: " + t.currentOffset + ", x: " + x);
                setTransform(o.el, x + 'px', 0, 0);
                break;
            case 'sliding':
                ////若不进行处理则，进入死循环，currentState 通过restoreBeforeState 
                ////将会使状态，一直保持为sliding出现点击不到的情况
                //t.currentState = 'follow';
                break;
            default:
                break;
        }
    };

    t.onend = function (o, e) {
        if (t.currentState === 'follow') {
            var x = Math.abs(e.deltaX);
            if (x > sw / 4) {
                if (e.deltaX > 0) {
                    t.prevScreen();
                } else if (e.deltaX < 0) {
                    t.nextScreen();
                } else {
                    return false;
                }
            } else {
                t.restoreBeforeState();
            }
        }
    };

    t.hasNext = function () {
        return l.screens > t.currentScreen;
    };

    t.hasPrev = function () {
        return t.currentScreen > 0;
    };

    t.nextScreen = function () {
        if (t.hasNext()) {
            t._nextScreen();
        } else {
            t.restoreBeforeState();
        }
    };

    t.prevScreen = function () {
        if (t.hasPrev()) {
            t._prevScreen();
        } else {
            t.restoreBeforeState();
        }
    };

    t._nextScreen = function (callback) {
        t.currentState = 'sliding';

        addAnim(t.el);
        t.currentScreen = t.currentScreen + 1;
        setTransform(t.el, '-' + sw * t.currentScreen + 'px', 0, 0);
        $s.once(t.el, 'webkitTransitionEnd', function (e) {
            removeAnim(t.el);
            t.currentOffset = -sw * t.currentScreen;

            t.currentState = 'inactive';
            l.renderPager();
            callback && callback(t);
        });
    };

    t._prevScreen = function (callback) {
        t.currentState = 'sliding';
        addAnim(t.el);
        t.currentScreen = t.currentScreen - 1;
        setTransform(t.el, '-' + sw * t.currentScreen + 'px', 0, 0);
        $s.once(t.el, 'webkitTransitionEnd', function (e) {
            removeAnim(t.el);
            t.currentOffset = -sw * t.currentScreen;
            t.currentState = 'inactive';
            l.renderPager();
            callback && callback(t);
        });
    };

    t.restoreBeforeState = function () {
        t.currentState = 'sliding';
        addAnim(t.el);
        setTransform(t.el, t.currentOffset + 'px', 0, 0);
        $s.once(t.el, 'webkitTransitionEnd', function (e) {
            removeAnim(t.el);
            t.currentState = 'inactive';
        });
    };
};

//添加功能到
Launcher.prototype.addChannel = function (channel, succ, fail) {
    if (this.channels.length >= this.max) {
        showTip(lang.getText("channel_limit"));
        fail && fail();
    }

    // 添加功能到缓存管理页面
    var channel_id = "#ch_" + channel.data.sWidgetId;
    var removeCache = $s(channel_id);
    var ele;
    if (!removeCache) {
        ele = $s.html2dom(clearCacheTemplate.tmpl(channel.data));
    }
    var wareList = $s('#clear_cache_wrap');
    wareList && wareList.appendChild(ele);
    var clearBtn = ele.querySelector(".clear_channe_cache");
    clearBtn && $s.bind(clearBtn, 'click', Launcher.cacheMgr);

    var len = this.channels.length;
    len += 1;
    //重复的数据不进行push
    this.channels.push(channel);
    // 更新hash
    this.updateHash(channel);
    if (!('index' in channel.data)) {
        channel.data.index = len - 1;
    }

    //显示首页的功能icon  
    this.element.appendChild(channel.element);
    this.initPositions();
    this.initChannelPosition(channel);
    this.hideAddIcon();
    this.initAddIcon();
    this.posChannel(channel);
    this.showAddIcon();

    succ && succ();

    var screensPreviousState = this.screens;
    this.screens = Math.ceil((this.channels.length + 1) / this.channelsPerPage) - 1;

    if (this.screens != screensPreviousState) {
        this.onscreenchange(screensPreviousState, this.screens);
    }

    this.onaddChannel && this.onaddChannel(this, {
        channel: channel.data
    });
};

Launcher.prototype.updateHash = function (channel) {
    this.channelsHash[channel.data.sWidgetId] = channel;
};

Launcher.prototype.removeChannel = function (channelId) {
    var l = this;
    var channels = l.channels;
    var arrayIndex;
    var sortIndex;
    var removeChannelId;

    for (var i = 0, j = channels.length; i < j; i++) {        
        if (channels[i].data.sWidgetId == channelId) {
            arrayIndex = i;
            sortIndex = channels[i].data.index;
            removeChannelId = channels[i].data.sWidgetId;
        }
    }

    // 从缓存管理页面剔除功能
    var channel_id = "#ch_" + removeChannelId;
    var removeCache = $s(channel_id);
    var clearBtn = removeCache.querySelector(".clear_channe_cache");
    clearBtn && $s.bind(clearBtn, 'click', Launcher.cacheMgr);
    removeCache && removeCache.parentElement.removeChild(removeCache);

    this.hideAddIcon();

    l.element.removeChild(
        channels[arrayIndex].element
    );   
    l.channels.splice(arrayIndex, 1);
    this.initPositions();
    this.screens = Math.ceil((this.channels.length + 1) / this.channelsPerPage) - 1;
    this.initAddIcon();
    this.showAddIcon();

    // 更新hash
    delete this.channelsHash[channelId];
    //delete Channels.channelsHash[channelId];
    console.log(this);

    var screensPreviousState = l.screens;
    l.screens = Math.ceil((l.channels.length + 1) / l.channelsPerPage) - 1;

    if (l.screens != screensPreviousState) {
        this.onscreenchange(screensPreviousState, l.screens);
    }

    //alert("removeid " + removeChannelId + " arrayIndex: " + arrayIndex + " sortIndex " + sortIndex);
    //删除后进行icon的位置的调整
    this.onremoveChannel && this.onremoveChannel(this, {
        removeid: removeChannelId,
        arrayIndex: arrayIndex,
        sortIndex: sortIndex
    });
};

/**
* 桌面的功能icon变化导致总页面变化时做处理
* @param previousState  变化之前的页面index
* @param currentState   当前页面index
*/
Launcher.prototype.onscreenchange = function (previousState, currentState) {
    var t = this;
  
    if (currentState < previousState) {
        if (t.screenFlip.currentScreen == previousState) {
            addAnim(t.element);
            setTransform(t.element, t.screenFlip.currentOffset + sw + 'px', 0, 0);
            $s.once(t.element, 'webkitTransitionEnd', function (e) {
                removeAnim(t.element);

                t.screenFlip.currentOffset = t.screenFlip.currentOffset + sw;
                t.screenFlip.currentScreen = t.screenFlip.currentScreen - 1;
                t.renderPager();
            });
        }
    }
    else {
        this.renderPager();
    }

    this.element.style.width = (sw * (this.screens + 1)) + 'px';
};

var launcherPagerCon = $s('#list_cur');

/**
* 显示当前桌面页索引的点
*/
Launcher.prototype.renderPager = function () {
    var total = this.screens + 1;
    launcherPagerCon.innerHTML = '';
    for (var i = 0; i < total; i++) {
        launcherPagerCon.innerHTML += '<i>●</i>'
    }

    launcherPagerCon.childNodes[this.screenFlip.currentScreen].className = 'active';
};

Launcher.prototype.initChannelPosition = function (channel) {
    var index = channel.data.index;
    var position = this.getPositionByIndex(index);

    channel.position.x = position[0];
    channel.position.y = position[1];

    //this.positions[index] = position;
};

Launcher.prototype.initPositions = function () {
    var chs = this.channels;
    var len = chs.length;
    this.positions = [];
    for (var i = 0; i < len; i++) {
        var position = this.getPositionByIndex(i);
        this.positions[i] = position;
    }
};

Launcher.prototype.getPositionByIndex = function (index) {
    var screen = Math.floor(index / this.channelsPerPage);
    var indexOfScreen = index % this.channelsPerPage;

    var row = Math.floor(indexOfScreen / this.cols) + 1;
    var y = this.marginVertical * row + this.channelHeight * (row - 1);
    var rowIndex = indexOfScreen - (this.cols * (row - 1));
    var x = sw * screen + this.marginHorizontal * (rowIndex + 1) + this.channelWidth * rowIndex;
    return [x, y];
};

Launcher.prototype.posChannel = function (channel) {
    var channelDom = channel.element;
    var x = channel.position.x;
    var y = channel.position.y;
    var xyz = [x + 'px', y + 'px', 0].join(',');
    var before = 'translate3d(';
    var after = ')';

    //console.log("x: " + x + ", y: " + y);
    channelDom.style[TRANSFORM] = before + xyz + after;
};

// 图标拖动处理
var Channel = function (data) {
    this.data = data;
    this.position = {};

    //桌面每个功能对应的元素
    this.element = $s.html2dom(
        channelTemplate.tmpl(
            this.data
        )
    );
    
    var channelIcon = this.element.querySelector("a")
    //修改成为圆形
    //channelIcon.style["border-radius"] = itemWidth + "px";

    if (!this.data.isDefault && !this.data.bg) {
        var bgIndex = Math.ceil(Math.random() * 6);
        var bg = Channel.bgs[bgIndex - 1];

        this.data.bg = bg;
    }

    if (!this.data.isDefault) {
        $s.addClass(this.element.firstElementChild, this.data.bg);
    }

    $s.addClass(this.element.firstElementChild, 'color_block');

    this.element.addEventListener(TOUCHSTART, this, false);
    this.state = 'inactive';
};

Channel.prototype.handleEvent = function (e) {
    switch (e.type) {
        case TOUCHSTART:
            this.touchStartHandler(e);
            break;
        case TOUCHMOVE:
            this.touchMoveHandler(e);
            break;
        case 'touchcancel':
        case TOUCHEND:
            this.touchEndHandler(e);
            break;
    }
};

Channel.prototype.touchStartHandler = function (e) {
    if (launcherInstance.screenFlip.currentState === 'sliding') return;

    e.preventDefault();
    e.stopPropagation();
    switch (this.state) {
        case 'inactive':
            this.startTimer(e);
            this.state = 'wait';
            break;
        case 'wait':
            break;
        case 'moveWithScreen':
            break;
        case 'active':
            break;
        case 'recovering':
            break;
    }

    this.element.addEventListener(TOUCHMOVE, this, false);
    this.element.addEventListener(TOUCHEND, this, false);
};

Channel.prototype.touchMoveHandler = function (e) {
    if (launcherInstance.screenFlip.currentState === 'sliding') return;

    e.preventDefault();
    e.stopPropagation();
    switch (this.state) {
        case 'inactive':
            break;
        case 'wait':
            this.cancelTimer();
            this.state = 'moveWithScreen';
            break;
        case 'moveWithScreen':
            break;
        case 'active':
            this.moveChannel(e);
            break;
        case 'recovering':
            break;
    }
};

Channel.prototype.touchEndHandler = function (e) {
    if (launcherInstance.screenFlip.currentState === 'sliding') return;

    e.preventDefault();
    e.stopPropagation();
    switch (this.state) {
        case 'inactive':
            break;
        case 'wait':
            this.cancelTimer();
            this.clickHandler();
            break;
        case 'moveWithScreen':
            this.clickHandler();
            this.state = 'inactive';
            break;
        case 'active':
            this.recovering();
            break;
        case 'recovering':
            break;
    }
    if ("oldIndex" in this) {
        if (this.data.index != this.oldIndex) {
            //statistics.operation(E_SI_CHANGPOSCOUNT);   // 统计换位的次数
            delete this.oldIndex;
        }
    }
    this.element.removeEventListener(TOUCHMOVE, this, false);
    this.element.removeEventListener(TOUCHEND, this, false);
};

Channel.prototype.clickHandler = function () {
    if (Launcher.editMode == false || typeof Launcher.editMode === "undefined") {
        location.hash = "#~type=1&sType=" + this.data.sWidgetId + "&isRed=" + this.data.isRed;
    }
    //Launcher.gotoChannel(this.data.sWidgetId);
};

Channel.prototype.moveChannel = function (e) {
    Launcher.dragSort.move(e);
};

Channel.prototype.startTimer = function (event) {
    var t = this, e = event;
    t.timer = setTimeout(function () {
        t.initDragSort(e); // 触发拖动排序
    }, 600);
};

Channel.prototype.cancelTimer = function () {
    clearTimeout(this.timer);
    delete this.timer;
};

Channel.prototype.initDragSort = function (event) {
    // 设置当前移动target
    Launcher.dragSort.targetChannel = this;
    Launcher.dragSort.targetChannel.oldIndex = this.data.index;
    Launcher.dragSort.init(event);
};

Channel.prototype.recovering = function () {
    this.state = 'recovering';
    Launcher.dragSort.sortEnd();
};

// tools
Launcher.dragSort = {
    targetChannel: null,
    init: function (event) {
        this.channels = launcherInstance.channels;
        this.positions = launcherInstance.positions;
        this.targetChannel.center = new Coords;

        var xy = getElementTransformOffset(this.targetChannel.element);
        this.targetChannel.startX = xy.x;
        this.targetChannel.startY = xy.y;

        var point = getPoint(event);
        this.targetChannel.mouseX = point.x;
        this.targetChannel.mouseY = point.y;

        $s.addClass(this.targetChannel.element, 'channel_icon');
        // 由于提出容器外 end事件不会冒泡到launcher上 需要手动清除launcher上绑定的事件
        launcherInstance.screenFlip.unbind();

        //提取到容器外
        this.takeOut();
    },
    // 将功能对应的元素移到容器外
    takeOut: function () {
        var position = this.targetChannel.position;
        var x = position.x;
        var y = position.y;
        var screenIndex = launcherInstance.screenFlip.currentScreen;
        var relativeX = x - screenIndex * sw;
        var header = $s("#launcher_menu");
        var relativeY = y + header.offsetHeight;
        var before = 'translate3d(';
        var after = ')';
        var transform = before + [relativeX + 'px', relativeY + 'px', 0].join(',') + after;
        launcherPage.appendChild(this.targetChannel.element);
        removeAnim(this.targetChannel.element);
        this.targetChannel.element.style[TRANSFORM] = transform;

        var t = this;
        setTimeout(function () {
            addAnim(t.targetChannel.element);
            t.targetChannel.element.style[TRANSFORM] = transform + ' scale(1.1)';
            $s.once(t.targetChannel.element, TRANSITION_END, function (e) {
                removeAnim(t.targetChannel.element);
                t.startTicker();
                t.targetChannel.state = 'active'; // 状态转变
            });
        }, 0);

        this.targetChannel.relativeX = relativeX;
        this.targetChannel.relativeY = relativeY;
    },
    startTimer: function () {
        this.state = 'wait';
        this.cancelTicker();
    },
    cancelTimer: function () {
        this.state = 'active';
        this.startTicker();
    },
    move: function (event) {
        var point = getPoint(event);
        var deltaX = point.x - this.targetChannel.mouseX;
        var deltaY = point.y - this.targetChannel.mouseY;

        var x = this.targetChannel.startX + deltaX;
        var y = this.targetChannel.startY + deltaY;
        var relativeX = this.targetChannel.relativeX + deltaX;
        var relativeY = this.targetChannel.relativeY + deltaY;

        var element = this.targetChannel.element;
        element.style[TRANSFORM] = 'translate3d(' + [relativeX + 'px', relativeY + 'px', 0].join(',') + ')' + ' scale(1.1)';

        this.targetChannel.center.x = x + (itemWidth * 1.1) / 2;
        this.targetChannel.center.y = y + (itemHeight * 1.1) / 2;

        this.relativeX = relativeX;
    },
    // 检测当前icon是否应该被拖动到上一屏或者下一屏
    checkRange: function () {
        if (!this.relativeX) return;
        var x = this.relativeX;

        var left = 0;
        var right = sw - itemWidth;
        if (x < left) {
            this.prevScreen();
        } else if (x > right) {
            this.nextScreen();
        } else {
            return;
        }
    },
    // 滚动到上一屏
    prevScreen: function () {
        var t = this;
        var flip = launcherInstance.screenFlip;
        if (flip.hasPrev()) {
            t.cancelTicker();
            t.targetChannel.startX -= sw;
            flip._prevScreen(function () {
                var o = t;
                setTimeout(function () {
                    o.startTicker();
                }, 300);
            });
        }
    },
    //滚动到下一屏
    nextScreen: function () {
        var t = this;
        var flip = launcherInstance.screenFlip;
        if (flip.hasNext()) {
            t.cancelTicker();
            t.targetChannel.startX += sw;
            flip._nextScreen(function () {
                var o = t;
                setTimeout(function () {
                    o.startTicker();
                }, 300);
            });
        }
    },
    // 轮询监测icon位置变化情况
    startTicker: function () {
        var t = this;
        t.ticker = setInterval(function () {
            t.calOrder();
        }, 200);
    },
    // 重新排序功能icon
    calOrder: function () {
        this.checkRange();

        var positions = this.positions;
        var channels = this.channels;
        var target = this.targetChannel;
        var center = this.targetChannel.center;

        for (var i = 0, j = channels.length; i < j; i++) {
            if (i !== target.data.index) {
                if (this.contains(center, positions[i])) {
                    target.newIndex = i;
                }
            }
        }

        if ('newIndex' in target) {
            if (target.newIndex !== target.data.index) {
                this.resetIndex();
                this.moveElements();
            }
        }
    },
    contains: function (c, position) {
        var x = position[0];
        var y = position[1];

        // console.log(c.x, c.y, x, y);
        if ((c.x > x) && (c.x < x + itemWidth) && (c.y > y) && (c.y < y + itemHeight)) {
            return true;
        } else {
            return false;
        }
    },
    // 移动更新过的功能icon
    moveElements: function () {
        var targetChannel = this.targetChannel;
        var positions = this.positions;
        var channels = this.channels;
        var len = channels.length;
        var position;
        for (var i = 0; i < len; i++) {
            var channel = channels[i];
            if (channel.data.sWidgetId != targetChannel.data.sWidgetId) {
                if (channel.indexChanged) {
                    position = positions[channel.data.index];
                    setTransform(channel.element, position[0] + 'px', position[1] + 'px', 0);
                    channel.position.x = position[0];
                    channel.position.y = position[1];
                }
            }
        }
    },
    // 移动icon结束，恢复icon状态
    sortEnd: function (callback) {
        var t = this;
        var screenIndex = launcherInstance.screenFlip.currentScreen;
        var relativeX = t.targetChannel.position.x - sw * screenIndex;
        var header = $s("#launcher_menu");
        var relativeY = t.targetChannel.position.y + header.offsetHeight;
        var el = t.targetChannel.element;
        Launcher.dragSort.checkState = 'active';
        addAnim(el);
        Launcher.dragSort.checkTimer = setTimeout(function () {
            if (Launcher.dragSort.checkState == 'active') {
                Launcher.dragSort.checkState = 'inactive';
                clearTimeout(Launcher.dragSort.checkTimer);
                removeAnim(el);
                t.targetChannel.state = 'inactive';
                t.cancelTicker();
                t.putIn();
                t.updateChannelCache();
                delete t.relativeX;
            }
        }, 500);

        setTransform(el, relativeX + 'px', relativeY + 'px', 0);
        $s.once(el, TRANSITION_END, function (e) {
            if (Launcher.dragSort.checkState == 'inactive') {
                return;
            }
            Launcher.dragSort.checkState = 'inactive';
            clearTimeout(Launcher.dragSort.checkTimer);
            removeAnim(el);
            t.targetChannel.state = 'inactive';
            t.cancelTicker();
            t.putIn();
            t.updateChannelCache();
            delete t.relativeX;
        });
    },
    // 恢复元素位置
    putIn: function () {
        var t = this;
        var el = t.targetChannel.element;
        $s.removeClass(el, 'channel_icon');
        launcherInstance.element.appendChild(el);
        setTransform(el, t.targetChannel.position.x + 'px', t.targetChannel.position.y + 'px', 0);
    },
    // 更新localstorage中的功能信息（index发生变化）
    updateChannelCache: function () {
        var t = this;
        installedChannels = [];
        for (var i = 0, j = t.channels.length; i < j; i++) {
            installedChannels.push(t.channels[i].data);
        }

        for (var i = 0; i < userinstalledChannels.length; i++) {
            if (userinstalledChannels[i].sid == $s.cache.getItem('sid')) {
                userinstalledChannels[i].installedChannels = [];
                userinstalledChannels[i].installedChannels = installedChannels;
                break;
            }
        }
        $s.cache.removeItem('userinstalledChannels');
        $s.cache.setItem('userinstalledChannels', userinstalledChannels);
    },
    // 更新功能icon的index
    resetIndex: function () {
        var channels = this.channels;
        var targetChannel = this.targetChannel;
        var len, i, channel;
        if (targetChannel.newIndex > targetChannel.data.index) { // 索引变大
            len = channels.length;
            for (i = 0; i < len; i++) {
                channel = channels[i];
                if (channel === targetChannel) {
                    continue;
                }
                if ((channel.data.index > targetChannel.data.index) && (channel.data.index <= targetChannel.newIndex)) {
                    channel.data.index--;
                    channel.indexChanged = true;
                } else {
                    channel.indexChanged = false;
                }
            }
        } else { // 索引变小
            len = channels.length;
            for (i = 0; i < len; i++) {
                channel = channels[i];
                if (channel === targetChannel) {
                    continue;
                }
                if ((channel.data.index < targetChannel.data.index) && (channel.data.index >= targetChannel.newIndex)) {
                    channel.data.index++;
                    channel.indexChanged = true;
                } else {
                    channel.indexChanged = false;
                }
            }
        }
        targetChannel.data.index = targetChannel.newIndex;
        delete targetChannel.newIndex;
        this.updateTargetProperty();
    },
    //　更新目标功能的位置信息
    updateTargetProperty: function () {
        var position = this.positions[
            this.targetChannel.data.index
        ];

        this.targetChannel.position.x = position[0];
        this.targetChannel.position.y = position[1];
    },
    // 取消重复断续器
    cancelTicker: function () {
        clearInterval(this.ticker);
        delete this.ticker;
    }
};

Channel.bgs = [];
for (var i = 1; i <= 6; i++) {
    Channel.bgs.push(
        'bg_0' + i
    );
};

// Coords constructor
var Coords = function () {
    this.x = 0;
    this.y = 0;
};

//移除当前界面功能
Launcher.removeChannel = function (cid) {
    var channel;
    for (var i = 0, j = installedChannels.length; i < j; i++) {
        if (installedChannels[i].sWidgetId == cid) {
            channel = installedChannels[i];
        }
    }
    //BUG 2015-04-13 hongbo_liang 移除界面的上的删除功能是的提示操作
    ////当其为 null 或者 undefined 时
    //if (!Launcher.removeChannelConfirm) {
    //    Launcher.removeChannelConfirm = new cConfirm({
    //        ok: function (o, e) {
                //statistics.operation(E_SI_DELWIDGETCOUNT);  // 统计功能退订次数 
                launcherInstance.removeChannel(cid);
                //history.back();
    //        },
    //        cancel: function () {
    //            history.back();
    //        }
    //    });
    //}

    //Launcher.removeChannelConfirm.setArgs({ cid: cid });
    //Launcher.removeChannelConfirm.setTitle('退订');
    //Launcher.removeChannelConfirm.setContent('您确定取消订阅"' + channel.sName + '"功能吗？');
    //location.hash = "#~type=11";
    //Launcher.removeChannelConfirm.show();
};

//清除缓存
Launcher.clearCache = function (cid) {
    var channel;
    for (var i = 0, j = installedChannels.length; i < j; i++) {
        if (installedChannels[i].sWidgetId == cid) {
            channel = installedChannels[i];
        }
    }

    if (!Launcher.clearChannelCacheConfirm) {
        Launcher.clearChannelCacheConfirm = new cConfirm({
            ok: function (o, e) {
                //statistics.operation(E_SI_CLEARCACHECOUNT); // 统计清理缓存的次数
                history.back();
                //TODO: 清除缓存的时候，同时将所有源单类型的数据进行删除
                //var src = null;
                //var names = [];
                //for (var id in srcType) {
                //    src = srcType[id];
                //    if (src.iDestId == getDestType(e.cid)) {
                //        for (var i = 0; i < src.vSrcType.length; i++) {
                //            var tmp = e.cid + '_' + src.vSrcType[i].sid
                //            names.push(tmp);
                //        }
                //        break;
                //    }
                //}

                cacheMgr.drop(e.cid, function () {
                    var element = document.getElementById("toast_tips");
                    var tips = element.querySelector(".txt");
                    tips.innerHTML = '"' + channel.sName + lang.getText("clear_cache_success");
                    element.className = "";
                    // 更新缓存状态
                    Channels.CacheNotExist(e.cid);
                    setTimeout(function () {
                        element.className = "none";
                    }, 1000);
                }, function () {
                    var element = document.getElementById("toast_tips");
                    var tips = element.querySelector(".txt");
                    tips.innerHTML = '"' + channel.sName + lang.getText("clear_cache_fail");
                    element.className = "";
                    setTimeout(function () {
                        element.className = "none";
                    }, 1000);
                });
            },
            cancel: function () {
                history.back();
            }
        });
    }
    Launcher.clearChannelCacheConfirm.setArgs({ cid: cid });
    Launcher.clearChannelCacheConfirm.setTitle(lang.getText("clear_cache"));
    Launcher.clearChannelCacheConfirm.setContent(String.format(lang.getText("confirm_clear_cache"), channel.sName));
    //Launcher.clearChannelCacheConfirm.setContent('您确定要清除 "' + channel.sName + '" 功能的缓存吗？');
    location.hash = "#~type=10";
    //Launcher.clearChannelCacheConfirm.show();
};

Launcher.cacheMgr = function (e) {
    var ele = e.target;
    var parent = ele.parentElement;
    var id = ele.getAttribute('widgetid');
    if ($s.hasClass(parent, "active")) {
        id && Launcher.clearCache(id);
    }
};

Launcher.removeFlash = function (callback) {
    if (flashPage.style.display !== 'none') {
        setTransform(flashPage, '-100%', 0, 0);
        $s.once(flashPage, TRANSITION_END, function (e) {
            flashPage.style.display = 'none';
            callback && callback();
        });
    } else {
        callback && callback();
    }
};

Launcher.showIosTip = function () {
    if (isIDevice && isSafari && !isLauchIcon) {
        $s.removeClass(iosTip, 'none');
        setTimeout(function () {
            iosTip.style[DURATION] = '.5s';
            iosTip.style.opacity = 0;
            $s.bind(iosTip, TRANSITION_END, function (e) {
                iosTip.parentNode.removeChild(iosTip);
            });
        }, 2000);
    }
};
//转换编辑状态
Launcher.triggerEditMode = function () {
    // 显示删除按钮
    var channels = launcherInstance.channels;
    var len = channels.length;
    for (var i = 0; i < len; i++) {
        if (channels[i].data.isDefault) continue;
        var btn = $s('#remove_channel_button_' + channels[i].data.sWidgetId);
        $s.removeClass(btn, 'none');
    }

    // 按触发编辑模式
    Launcher.editMode = true;

    // 切换底部菜单
    $s.addClass(launcherMenu, 'none');
    $s.removeClass(editFinishBtn, 'none');
};
//编辑完成后的事件
Launcher.finishEdit = function () {
    // 隐藏删除按钮
    var channels = launcherInstance.channels;
    var len = channels.length;
    for (var i = 0; i < len; i++) {
        if (channels[i].data.isDefault) continue;
        var btn = $s('#remove_channel_button_' + channels[i].data.sWidgetId);
        $s.addClass(btn, 'none');
    }

    // 解除编辑模式
    Launcher.editMode = false;

    // 切换底部菜单
    $s.removeClass(launcherMenu, 'none');
    $s.addClass(editFinishBtn, 'none');
};

Launcher.gotoSettingPage = function () {
    if (screenIsSliding) {
        return false;
    }
    var eLoginStatus = $s('#login_status_txt');
    var eNickName = $s('#setting_nickname');
    if ($s.cache.getItem('sid')) {
        if ($s.cache.getItem('nickname')) {
            eLoginStatus.innerHTML = lang.getText("curr_user");
            eNickName.innerHTML = $s.cache.getItem('nickname');
        }
    } else {
        eLoginStatus.innerHTML = lang.getText("sign_in_qrcode");
        eNickName.innerHTML = '';
    }
    screenIsSliding = true;
    sliding({
        a: launcherPage,
        b: settingPage,
        direction: 'left',
        ready: function () {
            screenIsSliding = false;
        }
    });
};

Launcher.gotoCategoryPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;
    sliding({
        a: launcherPage,
        b: categoryPage,
        direction: 'left',
        ready: function () {
            screenIsSliding = false;
            launcherCurrPage = categoryPage;
            Channels.categoryScroller.refresh();
        }
    });
};
//从控制台页面跳转到登陆页面
Launcher.gotoLogonPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;
    sliding({
        a: logonPage,
        b: launcherPage,
        direction: 'right',
        ready: function () {
            screenIsSliding = false;
        }
    });
};

Launcher.checkInstalled = function (cid) {
    for (var i = 0, j = installedChannels.length; i < j; i++) {
        if (installedChannels[i].sWidgetId == cid) {
            return true;
        }
    }
    return false;
};
//跳转到功能详情
Launcher.gotoChannel = function (channelId, isRedBill) {
    //statistics.openChannel(channelId);
    if (screenIsSliding) return;

    screenIsSliding = true;
    sWidgetId = channelId.toString();
    currentChannel = sWidgetId;
    //channelTitle.innerHTML = Channels.channelHash[channelId].sListName ;
    channelTitle.innerHTML = lang.getText(Channels.channelHash[channelId].sName + "_list");

    sliding({
        a: launcherCurrPage,
        b: listPage,
        direction: 'left',
        ready: function () {
            reader.init(channelId, isRedBill);
            //ContentList.init(channelId, isRedBill);
            screenIsSliding = false;
        }
    });
};

Launcher.init = function () {
    //判断是否需要进行更新  
    Launcher.initEvents();
    Channels.init();
    SettingPage.init();
};

Launcher.initEvents = function () {
    var editChannelBtn = $s('#edit_channel_btn');
    var addChannelBtn = $s('#add_channel_btn');
    var appSettingBtn = $s('#app_setting_btn');
    var editCompleteBtn = $s('#edit_complete_btn');

    $s.tap(editChannelBtn, function (e) {
        location.hash = "#~type=3";
        //Launcher.triggerEditMode();
    });

    $s.tap(addChannelBtn, function (e) {
        var type = gethashType(location.hash);
        if (type == 0 ||isNaN(type)) {
            location.hash = "#~type=4";
        }
        //Launcher.gotoCategoryPage();
    });

    $s.tap(appSettingBtn, function (e) {
        location.hash = "#~type=5";
        //Launcher.gotoSettingPage();
    });

    $s.tap(editCompleteBtn, function (e) {
        history.back();
        //Launcher.finishEdit();
    });
};

setTimeout(function () {
    window.scrollTo(0, 1);
    //Logon.init();
}, 400);