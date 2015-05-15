var logonPage = $s("#login_page");
var dblistPage = $s("#db_list_page");
var dbList = $s("#db_sel_list");

var dblistTemplate = $s('#db_list_template').innerHTML;

//保存的帐套信息
if (!$s.cache.getItem('selectDB')) {
    $s.cache.setItem('selectDB', []);
}

if (!$s.cache.getItem('isInit')) {
    $s.cache.setItem('isInit', false);
}

var isInit = $s.cache.getItem("isInit");

var serverService = "../QRCodeServiceForPDA.ashx";

var Logon = {
	init: function () {
		this.dbListScroller = new iScroll(dbList);

		$s.cache.setItem('dblist', dblist_data);
		$s.cache.setItem('categorys', category);
		var login_info = {
			"AcctID": 2,
			"UserName": "administrator",
			"Password": ''
		};
		//将数据base64后，保存在cookie，默认过期时间为 30 天
       	var date = new Date();
       	var expireDays = 30;
       	date.setTime(date.getTime() + expireDays *24 *3600*1000);
       	var _info = "#~type=-1&AcctID=" + login_info.AcctID+ '&UserName=' +login_info.UserName + '&Password=' + login_info.Password;

       	setCookie("_info",_info, date);



		//做出判断如果系统已经进行初始化，则进行请求获取帐套信息，否则提示用户进行初始化
		if($s.cache.getItem("isInit")){
			if ($s.cache.getItem('dblist')) {
			//if ($s.cache.getItem('dblist') && !navigator.onLine) {
	            //初始化登陆页面，将帐套列表添加到dom中
	            setTimeout(function () {
	            	Logon.removeFlash(function () {
	            		Logon.initDom();
	                    //Launcher.init();
	                });
	            }, 200);
	        } else {
	        	var qsData = { "type": "GETACCOUNTLIST", "data": null };

	        	ActiveRequest = $s.post({
	        		//sync: false,
	        		url: serverService,
	        		error: function (data) {
	        			console.info(data);
	        			ActiveRequest = null;
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
	    }else{
	    	showTip("系统还没有进行初始化，请先扫描二维码进行初始化");
	    }
	},

	initDom: function(){
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

	initEvents: function(){
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
			var acctID = 0;

			if ($s('#chose_db').getAttribute("dbid") != null && $s('#chose_db').getAttribute("dbid") != undefined)
				acctID = $s('#chose_db').getAttribute("dbid");

			var login_info = {
				"AcctID": acctID,
				"UserName": $s("#username").value,
				"Password": $s("#password").value
			};

			Logon.sigin(login_info);
		});

		var dbs = $s('#db_list_wrap').querySelectorAll("li[type='db_list']");
		for (var i = 0; i < dbs.length; i++) {
			this.clickDBLinkHandler(dbs[i]);
		}

        //已经登录
        if(getCookie("_info"))
        {
        	var obj = getCookie("_info");

			if(obj){
				var userInfo = pageSkip.parse(obj);
				var login_info = {
					"AcctID": userInfo.AcctID,
					"UserName": userInfo.UserName,
					"Password": userInfo.Password
				};

				//设置页面上数据
				var dbs = $s.cache.getItem("dblist");
				if(dbs){
					for(var i = 0; i < dbs.length; i++){
						if(dbs[i].AcctID == userInfo.AcctID){
							$s('#chose_db').querySelector(".set_txt_01").innerHTML = dbs[i].AcctName;
							$s('#chose_db').setAttribute("dbid", login_info.AcctID);
							$s('#chose_db').setAttribute("dbname", dbs[i].AcctName);
						}
					}
				}

				$s('#username').value = login_info.UserName;
				$s('#password').value = login_info.Password;

				Logon.sigin(login_info);
			}
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
    },

	//登录
	sigin: function(login_info){
		$s.removeClass(loadingLayer, "none");

		// ActiveRequest = $s.post({
		// 	//sync: false,
		// 	url: serverService,
		// 	error: function(xhr){
		// 		$s.addClass(loadingLayer, "none");
		// 		ActiveRequest = null;
		// 		showTip(xhr.Message);
		// 	},
		// 	success: function(data){
		// 		//保存用户的数据
		// 		Logon.saveUserSetting();

		// 		$s.cache.setItem("sid",login_info.UserName);
		// 		$s.cache.setItem("nickname", login_info.UserName);
		// 		//将该用户的数据进行保存到 localstorage 中  
		// 		$s.cache.setItem('categorys', data.Data);
		// 		ActiveRequest = null;
		// 		$s.addClass(loadingLayer, "none");



		//        	//将数据base64后，保存在cookie，默认过期时间为 30 天
		//        	var date = new Date();
		//        	var expireDays = 30;
		//        	date.setTime(date.getTime() + expireDays *24 *3600*1000);
		//        	var _info = "#~type=-1&AcctID=" + login_info.AcctID+ '&UserName=' +login_info.UserName + '&Password=' + login_info.Password;

		//        	setCookie("_info",_info, date);

  //           	//进行页面跳转
  //           	location.hash = "#~type=0";
  //       	},
  //       	params: {
  //       		"type": "LOGIN",
  //       		"data": login_info
  //       	}
  //   	});


			//保存用户的数据
		Logon.saveUserSetting();

		$s.cache.setItem("sid",login_info.UserName);
		$s.cache.setItem("nickname", login_info.UserName);
		//将该用户的数据进行保存到 localstorage 中  
		$s.cache.setItem('categorys', category);
		ActiveRequest = null;
		$s.addClass(loadingLayer, "none");



       	//将数据base64后，保存在cookie，默认过期时间为 30 天
       	var date = new Date();
       	var expireDays = 30;
       	date.setTime(date.getTime() + expireDays *24 *3600*1000);
       	var _info = "#~type=-1&AcctID=" + login_info.AcctID+ '&UserName=' +login_info.UserName + '&Password=' + login_info.Password;

       	setCookie("_info",_info, date);

    	//进行页面跳转
    	location.hash = "#~type=0";
	},

	scanSigin: function(){
		//获取location.hash
		var hash = location.hash;
		var key;
		if(hash.indexOf("key=") != -1){
			key = hash.substring(hash.indexOf("key=")+4);
		}else{
			key=null		
		}

		var loginSignature = key;

		//若存在用户的签名信息，则进行系统的重新的设置
		if(loginSignature){	
			//进行同步请求		
			ActiveRequest = $s.post({
				//sync: false,
				url: serverService,
				error:function(data){
					ActiveRequest = null;
					$s.cache.setItem("isInit", false);
					showTip(lang.getText("init_fail"));
				},
				success: function(data){
					$s.cache.setItem("isInit", true);
					//清除所有的localstorage数据
                    resetSystem();
                    showTip(lang.getText("init_success"));
                    ActiveRequest = null;
                    //返回的信息中应当包含用户的基本信息，将其存入到cookie中，
                    //在下次进行重新的登录
                    var userInfo = data.Data[0];

                    //将数据base64后，保存在cookie，默认过期时间为 30 天
                    var date = new Date();
                    var expireDays = 30;
                    date.setTime(date.getTime() + expireDays *24 *3600*1000);
                    var _info = "#~type=-1&AcctID=" + userInfo.AcctID+ '&UserName=' +userInfo.UserName + '&Password=' + userInfo.Password;

                    setCookie("_info",_info, date);
                    Logon.init();
				},
				 params: {
                    type: "SETDBCONFIG",
                    data: loginSignature
                }
			});
		}else{
			Logon.init();
		}
	},

	saveUserSetting: function(){
		var selectDB = { "AcctID": $s('#chose_db').getAttribute("dbid"), "AcctName": $s('#chose_db').getAttribute("dbname") };
		$s.cache.setItem("selectDB", selectDB);
	},

	gotoDBListPage: function(){
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
	},

	backToLogonPage:function () {
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
	},

	gotoLauncherPage: function(){
		if (screenIsSliding &&  $s.cache.getItem("isInit") == true) {
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
	},

	removeFlash: function (callback) {
		if (flashPage.style.display !== 'none') {
			setTransform(flashPage, '-100%', 0, 0);
			$s.once(flashPage, TRANSITION_END, function (e) {
				flashPage.style.display = 'none';
				callback && callback();
			});
		} else {
			callback && callback();
		}
	}
};