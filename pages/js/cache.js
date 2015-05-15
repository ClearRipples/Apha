;
var requestFileSystem = window.webkitRequestFileSystem;
var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

var cacheMgr = {};
cacheMgr.supportWebSQL = !!(window.openDatabase);
cacheMgr.supportFileSystem = !!(window.requestFileSystem || window.webkitRequestFileSystem);

// web SQL
cacheMgr.webSQL = {};
cacheMgr.webSQL.db = undefined;
cacheMgr.webSQL.inited = false;

// fileSystem
cacheMgr.fileSystem = {};
cacheMgr.fileSystem.fs = undefined;

cacheMgr.webSQL.init = function () {
    cacheMgr.webSQL.dbName = "info";
    cacheMgr.webSQL.version = "1.0";
    cacheMgr.webSQL.displayName = "qrcode";
    cacheMgr.webSQL.size = 5 * 1024 * 1024;
    var info = cacheMgr.webSQL;
    cacheMgr.webSQL.openDB(info.dbName, info.version, info.displayName, info.size);
    cacheMgr.webSQL.inited = true;
};

cacheMgr.webSQL.openDB = function (dbName, version, displayName, maxSize) {
    var db;
    try {
        db = openDatabase(dbName, version, displayName, maxSize);
        cacheMgr.supportWebSQL = true;
    }
    catch (e) {
        db = undefined;
        cacheMgr.supportWebSQL = false;
    }
    cacheMgr.webSQL.db = db;
};

cacheMgr.webSQL.createTable = function (tableName, callback) {
    tableName = "table_" + tableName;
    var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' ([key] INTEGER  NOT NULL,[value] TEXT  NOT NULL)';
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(function (transaction) {
        transaction.executeSql(sql);
        callback && callback();
    });
};

cacheMgr.webSQL.insertData = function (tableName, data, callBack) {
    tableName = "table_" + tableName;
    var sql = 'INSERT INTO ' + tableName + ' (key, value) VALUES (?' + Array(2).join(',?') + ')';
    var num = 0;
    var len = data.length;
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(function (transaction) {
        for (var i = 0; i < len; i++) {
            transaction.executeSql(sql, data[i], function () {
                num++;
                if (num == len) {
                    callBack && callBack();
                }
            });
        }
    });
};

cacheMgr.webSQL.selectData = function (sql, found, notFound) {
    var cache = {};
    cache.ids = [];
    cache.Hash = {};
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
        function (transaction) {
            transaction.executeSql(sql, [], function (ts, results) {
                var len = results.rows.length;
                for (var i = 0; i < len; i++) {
                    var row = results.rows.item(i);
                    var key = row.key + "";
                    if (key == "ids") {
                        if (row.value == "undefined") {
                            cache.ids = [];
                        } else {
                            cache.ids = JSON.parse(row.value);
                        }
                    }
                    else {
                        if (row.value == "undefined") {
                            cache.Hash[key] = {};
                        } else {
                            cache.Hash[key] = JSON.parse(row.value);
                        }
                    }
                }
                if (len == 0) {
                    console.log("Have not data");
                    notFound && notFound();
                }
                else {
                    found && found(cache);
                }
            },
                function (ts, err) {
                    console.log("Fail to select");
                    notFound && notFound();
                });
        }
    );
};

cacheMgr.webSQL.selectAllData = function (tableName, found, notFound) {
    tableName = "table_" + tableName;
    var sql = "SELECT * FROM " + tableName;
    cacheMgr.webSQL.selectData(sql, found, notFound);
};

cacheMgr.webSQL.deleteData = function (tableName) {
    tableName = "table_" + tableName;
    var sql = "DELETE FROM " + tableName;
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
        function (transaction) {
            transaction.executeSql(sql, [],
                function () {
                },
                function () {
                    console.log("Fail to delete table " + tableName);
                });
        }
    );
};

cacheMgr.webSQL.deleteEntry = function (tableName, data, callBack, err) {
    tableName = "table_" + tableName;
    var sql = "DELETE FROM " + tableName + " WHERE key = ?";
    var num = 0;
    var len = data.length;
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(function (transaction) {
        for (var i = 0; i < len; i++) {
            transaction.executeSql(sql, data[i], function (tx, ressult) {
                num++;
                if (num == len) {
                    callBack && callBack();
                }
            }, function () {
                console.log("Fail to delete");
                err && err();
            });
        }
    });
}

cacheMgr.webSQL.updateData = function (tableName,data, callBack,err) {
    tableName = "table_" + tableName;
    var sql = "UPDATE " + tableName + " SET  value = ? WHERE key = ?";
    var num = 0;
    var len = data.length;
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(function (transaction) {
        for (var i = 0; i < len; i++) {
            transaction.executeSql(sql, data[i], function (tx,ressult) {
                num++;
                if (num == len) {
                    callBack && callBack();
                }
            },
            function () {              
                console.log("Fail to update");
                err && err();
            });
        }
    });

};

cacheMgr.webSQL.dropTables = function (tableName, callback, err) {
    tableName = "table_" + tableName;
    var sql = "DROP TABLE " + tableName + ";";
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
        function (transaction) {
            transaction.executeSql(sql, [],
                function () {
                    callback && callback();
                },
                function (tx, result) {
                    console.log(tx);
                    console.log(result);
                    console.log("Fail to drop!");
                    err && err();
                });
        }
    );
};

cacheMgr.webSQL.get = function (name, found, notFound) {
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    cacheMgr.webSQL.selectAllData(name, found, notFound);
};

cacheMgr.webSQL.set = function (name, content, callback) {
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    cacheMgr.webSQL.createTable(name);
    cacheMgr.webSQL.deleteData(name);
    var data = [];
    var ids = [];
    ids[0] = "ids";
    ids[1] = JSON.stringify(content.ids);
    data.push(ids);
    for (var id in content.Hash) {
        var temp = [];
        temp[0] = id;
        temp[1] = JSON.stringify(content.Hash[id]);
        data.push(temp);
    }
    cacheMgr.webSQL.insertData(name, data, callback);
};

//更新分录
cacheMgr.webSQL.update = function (name, content, callback, err) {
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    var data = [];
    //var ids = [];
    //ids[0] = "ids";
    //ids[1] = JSON.stringify(content.ids);
    //data.push(ids);

    for (var id in content.Hash) {
        var temp = [];
        temp[1] = id;
        temp[0] = JSON.stringify(content.Hash[id]);
        data.push(temp);
    }

    cacheMgr.webSQL.updateData(name, data, callback, err);
};
//删除分录
cacheMgr.webSQL.delete = function (name, content, callback, err) {
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    var data = [];

    for (var id in content.ids) {
        var temp = [];
        //temp[0] = JSON.stringify(content.Hash[id]);
        temp[0] = id;
        data.push(temp);
    }

    cacheMgr.webSQL.deleteEntry(name, data, callback, err);
};

cacheMgr.webSQL.drop = function (names, callback, err) {
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    //判断参数是不是数组
    if ((typeof names == 'object') && names.constructor == Array) {
        for (var i = 0; i < names.length; i++) {
            cacheMgr.webSQL.dropTables(names[i], callback, err);
        }
    } else {
        cacheMgr.webSQL.dropTables(names, callback, err);
    }
};

cacheMgr.webSQL.generate = function (name, callback) {
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    cacheMgr.webSQL.createTable(name, callback);
};

/**
 * 检测方法：尝试从table中查找一个不可能满足的条件，如果表存在则返回结果0条记录，否则报错
 * @param name 表名
 * @param found
 * @param notFound
 */
cacheMgr.webSQL.check = function (name, found, notFound) {
    var tableName = "table_" + name;
    !cacheMgr.webSQL.inited && cacheMgr.webSQL.init();
    var sql = "SELECT *  FROM " + tableName + " where key='not_exist'";
    cacheMgr.webSQL.db && cacheMgr.webSQL.db.transaction(
        function (transaction) {
            transaction.executeSql(sql, [], function (ts, results) {
                var len = results.rows.length;
                found && found(name);
            },
                function (ts, err) {
                    notFound && notFound(name);
                });
        });
};

// filesystem
cacheMgr.fileSystem.fileError = function () {
    FileError.prototype.__defineGetter__('name', function () {
        var keys = Object.keys(FileError);
        for (var i = 0, key; key = keys[i]; ++i) {
            if (FileError[key] == this.code) {
                return key;
            }
        }
        return 'Unknown Error';
    });
};

cacheMgr.fileSystem.init = function (callback) {
    var size = 1024 * 1024 * 5;
    requestFileSystem(TEMPORARY, size, function (fs) {
        cacheMgr.fileSystem.fs = fs;
        cacheMgr.supportFileSystem = true;
        callback && callback();
    }, function (err) {
        //console.log('Fail to init : ' + err.name);
        cacheMgr.supportFileSystem = false;
    });
};

cacheMgr.fileSystem.get = function (name, found, notFound) {
    cacheMgr.fileSystem.init(function () {
        cacheMgr.fileSystem.fs.root.getFile(name, { create: false }, function (fileEntry) {
            fileEntry.file(function (file) {
                var fr = new FileReader();
                fr.onload = function (e) {
                    var cache = JSON.parse(this.result);
                    found && found(cache);
                };
                fr.readAsText(file);
            });
        }, function (err) {
            //console.log('Fail to get : ' + err.name);
            notFound && notFound();
        });
    });
};

cacheMgr.fileSystem.set = function (name, content, callback) {
    cacheMgr.fileSystem.init(function () {
        cacheMgr.fileSystem.fs.root.getFile(name, { create: false }, function (fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.onwrite = function () {
                    fileEntry.createWriter(function (write) {
                        write.onwrite = function () {
                            //console.log('write complete');
                            callback && callback();
                        };
                        var bb = new BlobBuilder();
                        bb.append(JSON.stringify(content));

                        write.write(bb.getBlob('text/plain'));
                    });
                };
                writer.truncate(0);
            })
        }, function (err) {
            //console.log("Fail to set: " + err.name);
            if (err.code === 1) // 文件不存在
            {
                cacheMgr.fileSystem.generate(name, function () {
                    cacheMgr.fileSystem.set(name, content, callback);
                });
            }
        });
    })
};

cacheMgr.fileSystem.generate = function (name, callback) {
    cacheMgr.fileSystem.init(function () {
        cacheMgr.fileSystem.fs.root.getFile(name, { create: true }, function (fileEntry) {
            callback && callback();
        }, function () {
            //console.log("Fail to generate: "+ err.name);
        });
    });
};

cacheMgr.fileSystem.drop = function (name, callback, err) {
    cacheMgr.fileSystem.init(function () {
        cacheMgr.fileSystem.fs.root.getFile(name, { create: false }, function (fileEntry) {
            fileEntry.remove(function () {
                console.log('Removed file ' + name);
                callback && callback();
            });
        }, function (err) {
            console.log("Fail to removes " + name);
            err && err();
        })
    });
};

cacheMgr.fileSystem.check = function (name, found, notFound) {
    cacheMgr.fileSystem.init(function () {
        cacheMgr.fileSystem.fs.root.getFile(name, { create: false }, function (fileEntry) {
            found && found(name);
        }, function (err) {
            //console.log('Fail to get : ' + err.name);
            notFound && notFound(name);
        });
    });
};

cacheMgr.checkCacheType = function () {
    if (cacheMgr.supportWebSQL) {
        cacheMgr.drop = cacheMgr.webSQL.drop;
        cacheMgr.get = cacheMgr.webSQL.get;
        cacheMgr.set = cacheMgr.webSQL.set;
        cacheMgr.generate = cacheMgr.webSQL.generate;
        cacheMgr.check = cacheMgr.webSQL.check;
        cacheMgr.update = cacheMgr.webSQL.update;
        cacheMgr.delete = cacheMgr.webSQL.delete;
    }
    else {
        cacheMgr.drop = cacheMgr.fileSystem.drop;
        cacheMgr.get = cacheMgr.fileSystem.get;
        cacheMgr.set = cacheMgr.fileSystem.set;
        cacheMgr.update = cacheMgr.fileSystem.set;
        cacheMgr.generate = cacheMgr.fileSystem.generate;
        cacheMgr.check = cacheMgr.fileSystem.check;
        cacheMgr.fileSystem.fileError();
    }
};

if (!isUc) {
    cacheMgr.webSQL.init(); // 检测是否支持 web SQL
    cacheMgr.checkCacheType();
} else {
    console.log('is uc browser');
}

