
/*
    已进行废弃
*/
var logonPage = $s("#login_page");
var dblistPage = $s("#db_list_page");
var dbList = $s("#db_sel_list");

var dblistTemplate = $s('#db_list_template').innerHTML;

//保存的帐套信息
if (!$s.cache.getItem('selectDB')) {
    $s.cache.setItem('selectDB', []);
}

$s.cache.setItem("isReset", false);

var serverService = "../QRCodeServiceForPDA.ashx";

//页面进行初始化
var Logon = {
    init: function () {
        this.dbListScroller = new iScroll(dbList);
        //BUG：在线状态下需要进行获取最新的帐套信息
        if ($s.cache.getItem('dblist') && !navigator.onLine) {
            //初始化登陆页面，将帐套列表添加到dom中
            setTimeout(function () {
                Logon.removeFlash(function () {
                    Logon.initDom();
                    //Launcher.init();
                });
            }, 200);
        } else {
            if (!$s.cache.getItem("isReset")) {
                var qsData = { "type": "GETACCOUNTLIST", "data": null };

                ActiveRequest = $s.post({
                    url: serverService,
                    error: function (data) {
                        console.info(data);
                    },
                    success: function (data) {
                        ActiveRequest = null;
                        $s.cache.setItem('dblist', data["Data"]);
                        setTimeout(function () {
                            Logon.removeFlash(function () {
                                Logon.initDom();
                            });
                        }, 200);
                    },
                    params: qsData
                });
            }
        }
    },
    initDom: function () {
        var dbCaches = $s.cache.getItem('dblist');

        var dblistWrapper = $s('#db_list_wrap');
        dblistWrapper.innerHTML = "";

        for (var i = 0, j = dbCaches.length; i < j; i++) {
            var db = $s.html2dom(dblistTemplate.tmpl(dbCaches[i]));
            dblistWrapper.appendChild(db);
        }

        //初始化上次选择的帐套信息
        var selDb = $s.cache.getItem("selectDB");

        if (typeof (selDb) != "undefined" && selDb.length > 0) {
            $s('#chose_db').querySelector(".set_txt_01").innerHTML = selDb.AcctName;
            $s('#chose_db').setAttribute("dbid", selDb.AcctID);
            $s('#chose_db').setAttribute("dbname", selDb.AcctName);
        }
        
        if ($s.cache.getItem("nickname")) {
            $s('#username').value = $s.cache.getItem("nickname");
        }

        $s('#username').setAttribute("placeholder", lang.getText("username"));
        $s('#password').setAttribute("placeholder", lang.getText("password"));
        $s("#logon_btn").value = lang.getText("login");

        Logon.initEvents();
    },
    initEvents: function () {
        var dbListBtn = $s('#chose_db');
        $s.tap(dbListBtn, function () {
            location.hash = "#~type=15";
        });
        var dbBackToLogonBtn = $s('#back_to_logon');
        $s.tap(dbBackToLogonBtn, function () {
            //location.hash = "#~type=7";
            history.back();
        });
        var logonBtn = $s("#logon_btn");
        $s.tap(logonBtn, function () {
            Logon.sigin();
        });
       
        var dbs = $s('#db_list_wrap').querySelectorAll("li[type='db_list']");
        for (var i = 0; i < dbs.length; i++) {
            this.clickDBLinkHandler(dbs[i]);
        }

        //已经登录
        if($s.cache.getItem("sid"))
        {
            location.hash = "#~type=0";
        }

        
    },
    clickDBLinkHandler: function (dbLink) {
        //click事件在 ios 中不能使用

        $s.tap(dbLink, function () {
            var dbid = dbLink.getAttribute("dbid");
            var dbname = dbLink.getAttribute("dbname");
            //修改登录页面的帐套选项
            $s('#chose_db').querySelector(".set_txt_01").innerHTML = dbname;
            $s('#chose_db').setAttribute("dbid", dbid);
            $s('#chose_db').setAttribute("dbname", dbname);
            Logon.saveUserSetting();
            location.hash = "#~type=7";
        });
    }
};

Logon.sigin = function () {
    var acctID = 0;
    if ($s('#chose_db').getAttribute("dbid") != null && $s('#chose_db').getAttribute("dbid") != undefined)
        acctID = $s('#chose_db').getAttribute("dbid");
    var qsData = {
        "type": "LOGIN", "data": {
            "AcctID": acctID,
            "UserName": $s("#username").value,
            "Password": $s("#password").value
        }
    };

    $s.removeClass(loadingLayer, "none");
    //判断网络状态方可进行请求
    ActiveRequest = $s.post({
        url: serverService,
        error: function (data) {
            $s.addClass(loadingLayer, "none");
            ActiveRequest = null;
            showTip(data.Message);
        },
        success: function (data) {            
            //保存用户数据
            Logon.saveUserSetting();

            if (!$s.cache.getItem("sid")) {
                $s.cache.setItem("sid", $s("#username").value);
                $s.cache.setItem("nickname", $s("#username").value);
                //$s.cache.setItem("psw", $s("#password").value);
            }

            //将该用户的数据进行保存到 localstorage 中           
            $s.cache.setItem('categorys', data.Data);

            ActiveRequest = null;
            $s.addClass(loadingLayer, "none");
            //进行页面跳转
            location.hash = "#~type=0";
        },
        params: qsData
    });
};

Logon.scanSigin = function (params) {
    //判断参数中是否存在用户信息
    var hash = location.hash;
    var navObj = pageSkip.parse(hash);
    //用于扫描登陆，同时配置客户的连接
    var acctid = parseInt(navObj.AccID);
    var userid = navObj.UserID;
    var password = navObj.Password;
    var dataSource = navObj.DataSource;
    var initialCatalog = navObj.InitialCatalog;
    var username = navObj.UserName;
    var userPsw = navObj.UserPsw;

    var dbStr = { "UserID": userid, "Password": password, "DataSource": dataSource, "InitialCatalog": initialCatalog };   
    //不为空这需要进行系统初始化配置
    if (typeof (userid) != "undefined" && userid != "") {
        $s.cache.setItem("isReset", true);     
        //$s.removeClass(loadingLayer, "none");
        setTimeout(function () {
            ActiveRequest = $s.post({
                url: serverService,
                error: function (data) {
                    showTip(lang.getText("init_fail"));
                },
                success: function (data) {
                    //请求结束后需要进行页面重新初始化
                    $s.cache.setItem("isReset", false);
                    //清除所有的localstorage数据
                    resetSystem();
                    showTip(lang.getText("init_success"));
                    ActiveRequest = null;
                    Logon.init();
                    var interval = setInterval(function () {
                        if (ActiveRequest == null) {
                            setTimeout(function () {
                                //直接进行登录
                                if (typeof (username) != "undefined" && typeof (acctid) != "undefined" && typeof (userPsw) != "undefined") {
                                    $s('#username').value = username;
                                    $s('#password').value = userPsw;

                                    var dbCaches = $s.cache.getItem('dblist');
                                    for (var i = 0; i < dbCaches.length; i++) {
                                        var item = dbCaches[i];
                                        if (item.AcctID == acctid) {
                                            //修改登录页面的帐套选项
                                            $s('#chose_db').querySelector(".set_txt_01").innerHTML = item.AcctName;
                                            $s('#chose_db').setAttribute("dbid", item.AcctID);
                                            $s('#chose_db').setAttribute("dbname", item.AcctName);
                                        }
                                    };
                                    Logon.sigin();
                                    window.clearInterval(interval);
                                }
                            }, 500);
                        }
                    }, 300);
                },
                params: {
                    type: "SETDBCONFIG",
                    data: dbStr
                }
            });
        }, 300);
    } else {
        $s.cache.setItem("isReset", false);
        //先进行页面的初始化
        setTimeout(function () {
            window.scrollTo(0, 1);
            Logon.init();
        }, 400);

        var interval = setInterval(function () {
            if (ActiveRequest == null) {
                setTimeout(function () {
                    //直接进行登录
                    if (typeof (username) != "undefined" && typeof (acctid) != "undefined" && typeof (userPsw) != "undefined") {
                        $s('#username').value = username;
                        $s('#password').value = userPsw;

                        var dbCaches = $s.cache.getItem('dblist');
                        for (var i = 0; i < dbCaches.length; i++) {
                            var item = dbCaches[i];
                            if (item.AcctID == acctid) {
                                //修改登录页面的帐套选项
                                $s('#chose_db').querySelector(".set_txt_01").innerHTML = item.AcctName;
                                $s('#chose_db').setAttribute("dbid", item.AcctID);
                                $s('#chose_db').setAttribute("dbname", item.AcctName);
                            }
                        };

                        Logon.sigin();
                        clearInterval(interval);
                    }                    
                }, 500);
            }
        }, 300);

    }
};


Logon.saveUserSetting = function () {
    var selectDB = { "AcctID": $s('#chose_db').getAttribute("dbid"), "AcctName": $s('#chose_db').getAttribute("dbname") };
    $s.cache.setItem("selectDB", selectDB);
};


//跳转到帐套列表页面
Logon.gotoDBListPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;

    sliding({
        a: logonPage,
        b: dblistPage,
        direction: 'left',
        ready: function () {
            screenIsSliding = false;
            Logon.dbListScroller.refresh();
        }
    });
};

Logon.backToLogonPage = function () {
    if (screenIsSliding) {
        return false;
    }

    screenIsSliding = true;

    sliding({
        a: logonPage,
        b: dblistPage,
        direction: 'right',
        ready: function () {
            screenIsSliding = false;
        }
    });
};

Logon.gotoLauncherPage = function () {
    if (screenIsSliding &&  $s.cache.getItem("isReset") == true) {
        return false;
    }

    screenIsSliding = true;
    setTimeout(function () {
        Launcher.init();
    },400);
    sliding({
        a: logonPage,
        b: launcherPage,
        direction: 'left',
        ready: function () {
            screenIsSliding = false;
        }
    });
};


Logon.removeFlash = function (callback) {
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