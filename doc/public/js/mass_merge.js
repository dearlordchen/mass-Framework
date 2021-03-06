//=========================================
// 模块加载模块（核心模块）2011.11.11 by 司徒正美
//=========================================
(function(global , DOC){
    var
    _$ = global.$, //保存已有同名变量
    namespace = DOC.URL.replace( /(#.+|\W)/g,'');
    /**
     * @class $
     * mass Framework拥有两个命名空间,
     * 第一个是DOC.URL.replace(/(\W|(#.+))/g,'')，根据页面的地址动态生成
     * 第二个是$，我们可以使用别名机制重写它
     */
    function $(expr,context){//新版本的基石
        if($.type(expr,"Function")){ //注意在safari下,typeof nodeList的类型为function,因此必须使用dom.type
            $.require("ready,lang,attr,event,fx",expr);
        }else{
            if(!$.fn)
                throw "must load the 'node' module!"
            return new $.fn.init(expr,context);
        }
    }
    //多版本共存
    var commonNs = global[namespace], version = 1.0, postfix = "";
    if( typeof commonNs !== "function"){
        commonNs = $;//公用命名空间对象
    }
    if(commonNs.mass !== version ){
        commonNs[version] = $;//保存当前版本的命名空间对象到公用命名空间对象上
        if(commonNs.mass) {
            postfix = (version + "").replace(".","_");
        }
    }else{
        return;
    }
    var w3c = DOC.dispatchEvent, //w3c事件模型
    HEAD = DOC.head || DOC.getElementsByTagName("head")[0],
    class2type = {
        "[object HTMLDocument]"   : "Document",
        "[object HTMLCollection]" : "NodeList",
        "[object StaticNodeList]" : "NodeList",
        "[object IXMLDOMNodeList]": "NodeList",
        "[object DOMWindow]"      : "Window"  ,
        "[object global]"         : "Window"  ,
        "null"                    : "Null"    ,
        "NaN"                     : "NaN"     ,
        "undefined"               : "Undefined"
    },
    toString = class2type.toString;
    /**
     * 糅杂，为一个对象添加更多成员
     * @param {Object} target 目标对象
     * @param {Object} source 属性包
     * @return  {Object} 目标对象
     */
    function mix(target, source){
        var args = [].slice.call(arguments), key,
        ride = typeof args[args.length - 1] == "boolean" ? args.pop() : true;
        target = target || {};
        for(var i = 1; source = args[i++];){
            for (key in source) {
                if (ride || !(key in target)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
    mix($,{//为此版本的命名空间对象添加成员
        html : DOC.documentElement,
        head : HEAD,
        rword : /[^, ]+/g,
        mass : version,
        "@name" : "$",
        "@debug" : true,
        "@target" : w3c ? "addEventListener" : "attachEvent",
        "@path":(function(url, scripts, node){
            scripts = DOC.getElementsByTagName("script");
            node = scripts[scripts.length - 1];
            url = node.hasAttribute ?  node.src : node.getAttribute('src', 4);
            return url.substr( 0, url.lastIndexOf('/'));
        })(),
        /**
         * 暴露到全局作用域下，此时可重命名，并有jquery的noConflict的效果
         * @param {String} name 新的命名空间
         */
        exports: function (name) {
            _$ && (global.$ = _$);//多库共存
            name = name || $["@name"];//取得当前简短的命名空间
            $["@name"] = name
            global[namespace] = commonNs;
            return global[name]  = this;
        },
        /**
         * 数组化
         * @param {ArrayLike} nodes 要处理的类数组对象
         * @param {Number} start 可选。要抽取的片断的起始下标。如果是负数，从后面取起
         * @param {Number} end  可选。规定从何处结束选取
         * @return {Array}
         */
        slice: function (nodes, start, end) {
            for(var i = 0,n = nodes.length, result = []; i < n; i++){
                result[i] = nodes[i];
            }
            if (arguments.length > 1) {
                return result.slice(start , (end || result.length));
            } else {
                return result;
            }
        },
        /**
         * 用于取得数据的类型或判定数据的类型
         * @param {Any} obj 要检测的东西
         * @param {String} str 要比较的类型
         * @return {String|Boolean}
         */
        type : function (obj, str){
            var result = class2type[ (obj == null || obj !== obj )? obj :  toString.call(obj)  ] || obj.nodeName || "#";
            if( result.charAt(0) === "#"){//兼容旧式浏览器与处理个别情况,如window.opera
                //利用IE678 window == document为true,document == window竟然为false的神奇特性
                if(obj == obj.document && obj.document != obj){
                    result = 'Window'; //返回构造器名字
                }else if(obj.nodeType === 9) {
                    result = 'Document';//返回构造器名字
                }else if(  obj.callee ){
                    result = 'Arguments';//返回构造器名字
                }else if(isFinite(obj.length) && obj.item ){
                    result = 'NodeList'; //处理节点集合
                }else{
                    result = toString.call(obj).slice(8,-1);
                }
            }
            if(str){
                return str === result;
            }
            return result;
        },
        /**
         * 用于调试
         * @param {String} s 要打印的内容
         * @param {Boolean} force 强逼打印到页面上
         */
        log:function (s, force){
            if(force){
                $.require("ready",function(){
                    var div =  DOC.createElement("div");
                    div.innerHTML = s +"";//确保为字符串
                    DOC.body.appendChild(div)
                });
            }else if(global.console ){
                global.console.log(s);
            }
        },
        uuid : 1,
        getUid:global.getComputedStyle ? function(node){//用于建立一个从元素到数据的引用，以及选择器去重操作
            return node.uniqueNumber || (node.uniqueNumber = $.uuid++);
        }: function(node){
            var uid = node.getAttribute("uniqueNumber");
            if (!uid){
                uid = $.uuid++;
                node.setAttribute("uniqueNumber", uid);
            }
            return uid;
        },
        /**
         * 生成键值统一的对象，用于高速化判定
         * @param {Array|String} array 如果是字符串，请用","或空格分开
         * @param {Number} val 可选，默认为1
         * @return {Object}
         */
        oneObject : function(array, val){
            if(typeof array == "string"){
                array = array.match($.rword) || [];
            }
            var result = {},value = val !== void 0 ? val :1;
            for(var i=0,n=array.length;i < n;i++){
                result[array[i]] = value;
            }
            return result;
        }
    });
    $.noop = $.error = function(){};

    "Boolean,Number,String,Function,Array,Date,RegExp,Window,Document,Arguments,NodeList".replace($.rword,function(name){
        class2type[ "[object " + name + "]" ] = name;
    });
    var
    rmodule =  /([^(\s]+)\(?([^)]*)\)?/,
    names = [],//需要处理的模块名列表
    rets = {},//用于收集模块的返回值
    cbi = 1e4 ;//用于生成回调函数的名字
    var mapper = $["@modules"] = {
        "@ready" : { }
    };
    /**
     * 加载模块。它会临时生成一个iframe，并在里面创建相应的script节点进笨请求，并附加各种判定是否加载成功的机制
     * @param {String} name 模块名
     * @param {String} url  模块的路径
     * @param {String} ver  当前dom框架的版本
     */
    function loadModule(name, url, ver){
        url = url  || $["@path"] +"/"+ name.slice(1) + ".js" + ($["@debug"] ? "?timestamp="+(new Date-0) : "");
        var iframe = DOC.createElement("iframe"),//IE9的onload经常抽疯,IE10 untest
        codes = ["<script> var $ = parent[document.URL.replace(/(#.+|\\W)/g,'')][", ver,'] ;<\/script><script src="',url,'" ',
        (DOC.uniqueID ? "onreadystatechange" : "onload"),'="', "if(/loaded|complete|undefined/i.test(this.readyState)){  $._resolveCallbacks();",
        (global.opera ? "this.ownerDocument.x = 1;" : " $._checkFail('"+name+"');"),
        '} " ' , (w3c ? 'onerror="$._checkFail(\''+name+'\',true);" ' : ""),' ><\/script>' ];
        iframe.style.display = "none";
        //http://www.tech126.com/https-iframe/ http://www.ajaxbbs.net/post/webFront/https-iframe-warning.html
        if(!"1"[0]){//IE6 iframe在https协议下没有的指定src会弹安全警告框
            iframe.src = "javascript:false"
        }
        HEAD.insertBefore(iframe,HEAD.firstChild);
        var d = iframe.contentDocument || iframe.contentWindow.document;
        d.write(codes.join(''));
        d.close();
        $.bind(iframe,"load",function(){
            if(global.opera && d.x == void 0){
                $._checkFail(name, true);//模拟opera的script onerror
            }
            d.write("<body/>");//清空内容
            HEAD.removeChild(iframe);//移除iframe
        });
    }
    //凡是通过iframe加载回来的模块函数都要经过它进行转换
    function safeEval(fn, args, str, obj){
        obj = obj || rets;
        for(var i = 0,argv = [], name; name = args[i++];){
            argv.push(obj[name]);
        }//如果是同一执行环境下，就不用再eval了
        if(fn instanceof Function){//合并时进入此分支
            return fn.apply(global,argv);
        }
        return  Function("b"," return " +(str || fn) +".apply(window,b)" )(argv);
    }
    function deferred(){//一个简单的异步列队
        var list = [],self = function(fn){
            fn && fn.call && list.push(fn);
            return self;
        }
        self.method = "shift";
        self.fire = function(fn){
            while(fn = list[self.method]()){
                fn();
            }
            return list.length ? self : self.complete();
        }
        self.complete = $.noop;
        return self;
    }

    var errorstack = $.stack = deferred();
    errorstack.method = "pop";
    mix($, {
        mix:mix,
        //绑定事件(简化版)
        bind : w3c ? function(el, type, fn, phase){
            el.addEventListener(type,fn, !!phase);
            return fn;
        } : function(el, type, fn){
            el.attachEvent("on"+type, fn);
            return fn;
        },
        unbind : w3c ? function(el, type, fn, phase){
            el.removeEventListener(type, fn, !!phase);
        } : function(el, type, fn){
            el.detachEvent("on"+type, fn);
        },
        //请求模块
        require:function(deps,callback,errback){//依赖列表,正向回调,负向回调
            var _deps = {}, args = [], dn = 0, cn = 0;
            (deps +"").replace($.rword,function(url,name,match){
                dn++;
                match = url.match(rmodule);
                name  = "@"+ match[1];//取得模块名
                if(!mapper[name]){ //防止重复生成节点与请求
                    mapper[name] = { };//state: undefined, 未加载; 1 已加载; 2 : 已执行
                    loadModule(name,match[2],$.mass);//加载JS文件
                }else if(mapper[name].state === 2){
                    cn++;
                }
                if(!_deps[name] ){
                    args.push(name);
                    _deps[name] = "司徒正美";//去重，去掉@ready
                }
            });
            var cbname = callback._name;
            if(dn === cn ){//在依赖都已执行过或没有依赖的情况下
                if(cbname && !(cbname in rets)){
                    mapper[cbname].state = 2 //如果是使用合并方式，模块会跑进此分支（只会执行一次）
                    return rets[cbname] = safeEval(callback,args);
                }else if(!cbname){//普通的回调可执行无数次
                    return safeEval(callback,args);
                }
            }
            cbname = cbname || "@cb"+ (cbi++).toString(32);
            if(errback){
                errback = errback instanceof Function ? errback :
                Function((errback+"").replace(/[^{]*\{([\d\D]*)\}$/,"$1")) ;
                $.stack(errback);//压入错误堆栈
            }
            mapper[cbname] = {//创建或更新模块的状态
                callback:callback,
                name:cbname,
                str: callback.toString(),
                deps:_deps,
                args: args,
                state: 1
            };//在正常情况下模块只能通过resolveCallbacks执行
            names.unshift(cbname);
            $._resolveCallbacks();//FIX opera BUG。opera在内部解析时修改执行顺序，导致没有执行最后的回调
        },
        //定义模块
        define:function(name,deps,callback){//模块名,依赖列表,模块本身
            var str = "/"+name;
            for(var prop in mapper){
                if(mapper.hasOwnProperty(prop) ){
                    if(prop.substring(prop.length - str.length) === str && mapper[prop].state !== 2){
                        name = prop.slice(1);//自动修正模块名(加上必要的目录)
                        break;
                    }
                }
            }
            if(typeof deps == "function"){//处理只有两个参数的情况
                callback = deps;
                deps = "";
            }
            callback._name = "@"+name; //模块名
            this.require(deps,callback);
        },
        //执行并移除所有依赖都具备的模块或回调
        _resolveCallbacks: function (){
            loop:
            for (var i = names.length,repeat, name; name = names[--i]; ) {
                var  obj = mapper[name], deps = obj.deps;
                for(var key in deps){
                    if(deps.hasOwnProperty(key) && mapper[key].state != 2 ){
                        continue loop;
                    }
                }
                //如果deps是空对象或者其依赖的模块的状态都是2
                if( obj.state != 2){
                    names.splice(i,1);//必须先移除再执行，防止在IE下DOM树建完后手动刷新页面，会多次执行最后的回调函数
                    //在IE下通过iframe得到的回调，如果不立即变成字符串保存起来，会报“不能执行已释放 Script 的代码 ”错误
                    rets[obj.name] = safeEval(obj.callback, obj.args, obj.str);
                    obj.state = 2;//只收集模块的返回值
                    repeat = true;
                }
            }
        repeat && $._resolveCallbacks();
        },
        //用于检测这模块有没有加载成功
        _checkFail : function(name, error){
            if(error || !mapper[name].state ){
                this.stack(new Function('$.log("fail to load module [ '+name+' ]")'));
                this.stack.fire();//打印错误堆栈
            }
        }
    });
    //$.log("已加载模块加载模块")
    //domReady机制
    var readylist = deferred();
    function fireReady(){
        mapper["@ready"].state = 2;
        $._resolveCallbacks();
        readylist.complete = function(fn){
            $.type(fn, "Function") &&  fn()
        }
        readylist.fire();
        fireReady = $.noop;
    };
    function doScrollCheck() {
        try {
            $.html.doScroll("left");
            fireReady();
        } catch(e) {
            setTimeout( doScrollCheck, 1);
        }
    };
    //开始判定页面的加载情况
    if ( DOC.readyState === "complete" ) {
        fireReady();
    }else {
        $.bind(DOC, (w3c ? "DOMContentLoaded" : "readystatechange"), function(){
            if (w3c || DOC.readyState === "complete") {
                fireReady();
            }
        });
        if ( $.html.doScroll && self.eval === top.eval ) {
            doScrollCheck();
        }
    }
    //https://developer.mozilla.org/en/DOM/window.onpopstate
    $.bind(global,"popstate",function(){
        namespace = DOC.URL.replace(/(#.+|\W)/g,'');
        $.exports();
    });
    $.exports("$"+ postfix);//防止不同版本的命名空间冲突
var module_value = {                                    state:2                                };                                var list = "lang_fix,lang,support,class,data,query,node,css_fix,css,attr,target,event".match($.rword);                                for(var i=0, module;module = list[i++];){                                    mapper["@"+module] = module_value;                                }//=========================================
//  语言补丁模块
//==========================================
$.define("lang_fix", function(){
    $.log("已加载语言补丁模块");
    //Object扩展
    //fix ie for..in bug
    var DONT_ENUM = $.DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(","),
    P = "prototype",
    hasOwn = ({}).hasOwnProperty;
    for (var i in {
        toString: 1
    }){
        DONT_ENUM = false;
    }
    //第二个参数仅在浏览器支持Object.defineProperties时可用
    $.mix(Object,{
        //取得其所有键名以数组形式返回
        keys: function(obj){//ecma262v5 15.2.3.14
            var result = [];
            for(var key in obj ) if(hasOwn.call(obj,key)){
                result.push(key)
            }
            if(DONT_ENUM && obj){
                for(var i = 0 ;key =DONT_ENUM[i++]; ){
                    if(hasOwn.call(obj,key)){
                        result.push(key);
                    }
                }
            }
            return result;
        },
        getPrototypeOf  :  typeof P.__proto__ === "object" ?  function(obj){
            return obj.__proto__;
        }:function(obj){
            return obj.constructor[P];
        }

    },false);

    //用于创建javascript1.6 Array的迭代器
    function iterator(vars, body, ret) {
        var fun = 'for(var '+vars+'i=0,n = this.length;i < n;i++){'+
        body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))')
        +'}'+ret
        return new Function("fn,scope",fun);
    }
    $.mix(Array[P],{
        //定位类 返回指定项首次出现的索引。
        indexOf: function (item, index) {
            var n = this.length, i = ~~index;
            if (i < 0) i += n;
            for (; i < n; i++)
                if ( this[i] === item) return i;
            return -1;
        },
        //定位类 返回指定项最后一次出现的索引。
        lastIndexOf: function (item, index) {
            var n = this.length,
            i = index == null ? n - 1 : index;
            if (i < 0) i = Math.max(0, n + i);
            for (; i >= 0; i--)
                if (this[i] === item) return i;
            return -1;
        },
        //迭代类 在数组中的每个项上运行一个函数。
        forEach : iterator('', '_', ''),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter : iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //迭代类  在数组中的每个项上运行一个函数，并将全部结果作为数组返回。
        map :  iterator('r=[],', 'r[i]=_', 'return r'),
        //迭代类  在数组中的每个项上运行一个函数，若存在任意的结果返回真，则返回真值。
        some : iterator('', 'if(_)return true', 'return false'),
        //迭代类  在数组中的每个项上运行一个函数，若所有结果都返回真值，此方法亦返回真值。
        every : iterator('', 'if(!_)return false', 'return true'),
        //归化类 javascript1.8  对该数组的每项和前一次调用的结果运行一个函数，收集最后的结果。
        reduce: function (fn, lastResult, scope) {
            if (this.length == 0) return lastResult;
            var i = lastResult !== undefined ? 0 : 1;
            var result = lastResult !== undefined ? lastResult : this[0];
            for (var n = this.length; i < n; i++)
                result = fn.call(scope, result, this[i], i, this);
            return result;
        },
        //归化类 javascript1.8 同上，但从右向左执行。
        reduceRight: function (fn, lastResult, scope) {
            var array = this.concat().reverse();
            return array.reduce(fn, lastResult, scope);
        }
    },false);
   
    //修正IE67下unshift不返回数组长度的问题
    //http://www.cnblogs.com/rubylouvre/archive/2010/01/14/1647751.html
    if([].unshift(1) !== 1){
        var _unshift = Array[P].unshift;
        Array[P].unshift = function(){
            _unshift.apply(this, arguments);
            return this.length; //返回新数组的长度
        }
    }
    if(!Array.isArray){
        Array.isArray = function(obj){
            return Object.prototype.toString.call(obj) =="[object Array]";
        };
    }
    //String扩展
    $.mix(String[P],{
        //ecma262v5 15.5.4.20
        //http://www.cnblogs.com/rubylouvre/archive/2009/09/18/1568794.html
        //'      dfsd '.trim() === 'dfsd''
        trim: function(){
            return  this.replace(/^[\s\xA0]+/,"").replace(/[\s\xA0]+$/,'')
        }
    },false);

    $.mix(Function[P],{
        //ecma262v5 15.3.4.5
        bind:function(scope) {
            if (arguments.length < 2 && scope===void 0) return this;
            var fn = this, argv = arguments;
            return function() {
                var args = [], i;
                for(i = 1; i < argv.length; i++)
                    args.push(argv[i]);
                for(i = 0; i < arguments.length; i++)
                    args.push(arguments[i]);
                return fn.apply(scope, args);
            };
        }
    },false);
    // Fix Date.get/setYear() (IE5-7)
    if ((new Date).getYear() > 1900) {
        Date.now = function(){
            return +new Date;
        }
        //http://stackoverflow.com/questions/5763107/javascript-date-getyear-returns-different-result-between-ie-and-firefox-how-to
        Date[P].getYear = function() {
            return this.getFullYear() - 1900;
        };
        Date[P].setYear = function(year) {
            return this.setFullYear(year + 1900);
        };
    }
});
    
//2011.7.26
//移除Object.create方法,添加Object.getPrototypeOf方法
//2011.11.16
//重构Array.prototype.unshift (thx @abcd)
//2011.12.22
//修正命名空间

//=========================================
// 类型扩展模块 by 司徒正美
//=========================================
$.define("lang",function(){
    console.log("已加载语言扩展模块");
    var global = this,
    rascii = /[^\x00-\xff]/g,
    rformat = /\\?\#{([^{}]+)\}/gm,
    rnoclose = /^(area|base|basefont|bgsound|br|col|frame|hr|img|input|isindex|link|meta|param|embed|wbr)$/i,
    // JSON RegExp
    rvalidchars = /^[\],:{}\s]*$/,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    str_eval = global.execScript ? "execScript" : "eval",
    str_body = (global.open + '').replace(/open/g, '');
    $.mix($,{
        //判定是否是一个朴素的javascript对象（Object或JSON），不是DOM对象，不是BOM对象，不是自定义类的实例。
        isPlainObject : function (obj){
            if(!$.type(obj,"Object") || $.isNative(obj, "reload") ){
                return false;
            }
            try{//不存在hasOwnProperty方法的对象肯定是IE的BOM对象或DOM对象
                for(var key in obj)//只有一个方法是来自其原型立即返回flase
                    if(!({}).hasOwnProperty.call(obj, key)){//不能用obj.hasOwnProperty自己查自己
                        return false
                    }
            }catch(e){
                return false;
            }
            return true;
        },
        //判定method是否为obj的原生方法，如$.isNative(window,"JSON")
        isNative : function(obj, method) {
            var m = obj ? obj[method] : false, r = new RegExp(method, 'g');
            return !!(m && typeof m != 'string' && str_body === (m + '').replace(r, ''));
        },
        /**
         * 是否为空对象
         * @param {Object} obj
         * @return {Boolean}
         */
        isEmptyObject: function(obj ) {
            for ( var i in obj ){
                return false;
            }
            return true;
        },
        //包括Array,Arguments,NodeList,HTMLCollection,IXMLDOMNodeList与自定义类数组对象
        //select.options集合（它们两个都有item与length属性）
        isArrayLike :  function (obj) {
            if(!obj || obj.document || obj.nodeType || $.type(obj,"Function")) return false;
            return isFinite(obj.length) ;
        },
        //将字符串中的占位符替换为对应的键值
        //http://www.cnblogs.com/rubylouvre/archive/2011/05/02/1972176.html
        format : function(str, object){
            var array = $.slice(arguments,1);
            return str.replace(rformat, function(match, name){
                if (match.charAt(0) == '\\')
                    return match.slice(1);
                var index = Number(name)
                if(index >=0 )
                    return array[index];
                if(object && object[name] !== void 0)
                    return  object[name];
                return  '' ;
            });
        },
        /**
         * 用于拼接多行HTML片断,免去写<与>与结束标签之苦
         * @param {String} tag 可带属性的开始标签
         * @param {String} innerHTML 可选
         * @param {Boolean} xml 可选 默认false,使用HTML模式,需要处理空标签
         * @example var html = T("P title=aaa",T("span","111111")("strong","22222"))("div",T("div",T("span","两层")))("H1",T("span","33333"))('',"这是纯文本");
         * console.log(html+"");
         * @return {Function}
         */
        tag:function (start, content, xml){
            xml = !!xml
            var chain = function(start, content, xml){
                var html = arguments.callee.html;
                start && html.push("<",start,">");
                content = ''+(content||'');
                content && html.push(content);
                var end = start.split(' ')[0];//取得结束标签
                if(end && (xml || !rnoclose.test(end))){
                    html.push("</",end,">");
                }
                return chain;
            }
            chain.html = [];
            chain.toString = function(){
                return this.html.join("");
            }
            return chain(start,content,xml);
        },
        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        range : function(start, stop, step) {
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;
            var len = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = new Array(len);
            while(idx < len) {
                range[idx++] = start;
                start += step;
            }
            return range;
        },
        quote : global.JSON && JSON.stringify || String.quote ||  (function(){
            var meta = {
                '\t':'t',
                '\n':'n',
                '\v':'v',
                'f':'f',
                '\r':'\r',
                '\'':'\'',
                '\"':'\"',
                '\\':'\\'
            },
            reg = /[\x00-\x1F\'\"\\\u007F-\uFFFF]/g,
            regFn = function(c){
                if (c in meta) return '\\' + meta[c];
                var ord = c.charCodeAt(0);
                return ord < 0x20   ? '\\x0' + ord.toString(16)
                :  ord < 0x7F   ? '\\'   + c
                :  ord < 0x100  ? '\\x'  + ord.toString(16)
                :  ord < 0x1000 ? '\\u0' + ord.toString(16)
                : '\\u'  + ord.toString(16)
            };
            return function (str) {
                return    '"' + str.replace(reg, regFn)+ '"';
            }
        })(),
        dump : function(obj, indent) {
            indent = indent || "";
            if (obj === null)
                return indent + "null";
            if (obj === void 0)
                return indent + "undefined";
            if (obj.nodeType === 9)
                return indent + "[object Document]";
            if (obj.nodeType)
                return indent + "[object " + (obj.tagName || "Node") +"]";
            var arr = [],type = $.type(obj),self = arguments.callee,next = indent +  "\t";
            switch (type) {
                case "Boolean":
                case "Number":
                case "NaN":
                case "RegExp":
                    return indent + obj;
                case "String":
                    return indent + $.quote(obj);
                case "Function":
                    return (indent + obj).replace(/\n/g, "\n" + indent);
                case "Date":
                    return indent + '(new Date(' + obj.valueOf() + '))';
                case "Window" :
                    return indent + "[object "+type +"]";
                case "NodeList":
                case "Arguments":
                case "Array":
                    for (var i = 0, n = obj.length; i < n; ++i)
                        arr.push(self(obj[i], next).replace(/^\s* /g, next));
                    return indent + "[\n" + arr.join(",\n") + "\n" + indent + "]";
                default:
                    if($.isPlainObject(obj)){
                        for ( i in obj) {
                            arr.push(next + self(i) + ": " + self(obj[i], next).replace(/^\s+/g, ""));
                        }
                        return indent + "{\n" + arr.join(",\n") + "\n" + indent + "}";
                    }else{
                        return indent + "[object "+type +"]";
                    }
            }
        },
        //http://www.schillmania.com/content/projects/javascript-animation-1/
        //http://www.cnblogs.com/rubylouvre/archive/2010/04/09/1708419.html
        parseJS: function( code ) {
            //IE中，window.eval()和eval()一样只在当前作用域生效。
            //Firefox，Safari，Opera中，直接调用eval()为当前作用域，window.eval()调用为全局作用域。
            if ( code && /\S/.test(code) ) {
                try{
                    global[str_eval](code);
                }catch(e){ }
            }
        },
        parseJSON: function( data ) {
            if ( typeof data !== "string" || !data ) {
                return null;
            }
            data = data.trim();
            if ( global.JSON && global.JSON.parse ) {
                //使用原生的JSON.parse转换字符串为对象
                return global.JSON.parse( data );
            }
            if ( rvalidchars.test( data.replace( rvalidescape, "@" )
                .replace( rvalidtokens, "]" )
                .replace( rvalidbraces, "")) ) {
                //使用new Function生成一个JSON对象
                return (new Function( "return " + data ))();
            }
            $.error( "Invalid JSON: " + data );
        },

        // Cross-browser xml parsing
        parseXML: function ( data,xml,tmp ) {
            try {
                if ( global.DOMParser ) { // Standard
                    tmp = new DOMParser();
                    xml = tmp.parseFromString(data , "text/xml" );
                } else { // IE
                    xml = new ActiveXObject("Microsoft.XMLDOM" );//"Microsoft.XMLDOM"
                    xml.async = "false";
                    xml.loadXML( data );
                }
            } catch( e ) {
                xml = undefined;
            }
            if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
                $.log( "Invalid XML: " + data );
            }
            return xml;
        }

    }, false);

    "Array,Function".replace($.rword, function(name){
        $["is"+name] = function(obj){
            return obj && ({}).toString.call(obj) === "[object "+name+"]";
        }
    });
    if(Array.isArray){
        $.isArray = Array.isArray;
    }
    var adjustOne = $.oneObject("String,Array,Number,Object"),
    arrayLike = $.oneObject("NodeList,Arguments,Object");
    //语言链对象
    $.lang = function(obj){
        var type = $.type(obj), chain = this;
        if(arrayLike[type] &&  isFinite(obj.length)){
            obj = $.slice(obj);
            type = "Array";
        }
        if(adjustOne[type]){
            if(!(chain instanceof $.lang)){
                chain = new $.lang;
            }
            chain.target = obj;
            chain.type = type;
            return chain;
        }else{// undefined boolean null
            return obj
        }
    }

    $.lang.prototype = {
        constructor:$.lang,
        valueOf:function(){
            return this.target;
        },
        toString:function(){
            return this.target + "";
        }
    };
    var proto = $.lang.prototype;
    //  var $ = $.lang
    //构建语言链对象的四个重要工具:$.String, $.Array, $.Number, $.Object
    "String,Array,Number,Object".replace($.rword, function(type){
        $[type] = function(ext){
            Object.keys(ext).forEach(function(name){
                $[type][name] = ext[name];
                proto[name] = function(){
                    var obj = this.target;
                    var method = obj[name] || $[type][name];
                    var result = method.apply(obj, arguments);
                    return result;
                }
                proto[name+"X"] = function(){
                    var obj = this.target;
                    var method = obj[name] || $[type][name];
                    var result = method.apply(obj, arguments);
                    return $.lang.call(this, result) ;
                }
            });
        }
    });

    $.String({
        //判断一个字符串是否包含另一个字符
        contains: function(string, separator){
            return (separator) ? !!~(separator + this + separator).indexOf(separator + string + separator) : !!~this.indexOf(string);
        },
        //判定是否以给定字符串开头
        startsWith: function(string, ignorecase) {
            var start_str = this.substr(0, string.length);
            return ignorecase ? start_str.toLowerCase() === string.toLowerCase() :
            start_str === string;
        },
        //判定是否以给定字符串结尾
        endsWith: function(string, ignorecase) {
            var end_str = this.substring(this.length - string.length);
            return ignorecase ? end_str.toLowerCase() === string.toLowerCase() :
            end_str === string;
        },
        //得到字节长度
        byteLen:function(){
            return this.replace(rascii,"--").length;
        },
        //是否为空白节点
        empty: function () {
            return this.valueOf() === '';
        },
        //判定字符串是否只有空白
        blank: function () {
            return /^\s*$/.test(this);
        },
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        truncate :function(length, truncation) {
            length = length || 30;
            truncation = truncation === void(0) ? '...' : truncation;
            return this.length > length ?
            this.slice(0, length - truncation.length) + truncation :String(this);
        },
        //转换为驼峰风格
        camelize:function(){
            return this.replace(/-([a-z])/g, function($1, $2){
                return $2.toUpperCase();
            });
        },
        //转换为连字符风格
        underscored: function() {
            return this.replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/\-/g, '_').toLowerCase();
        },
        //首字母大写
        capitalize: function(){
            return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
        },
        //转换为整数
        toInt: function(radix) {
            return parseInt(this, radix || 10);
        },
        //转换为小数
        toFloat: function() {
            return parseFloat(this);
        },
        //转换为十六进制
        toHex: function() {
            var txt = '',str = this;
            for (var i = 0; i < str.length; i++) {
                if (str.charCodeAt(i).toString(16).toUpperCase().length < 2) {
                    txt += '\\x0' + str.charCodeAt(i).toString(16).toUpperCase() ;
                } else {
                    txt += '\\x' + str.charCodeAt(i).toString(16).toUpperCase() ;
                }
            }
            return txt;
        },
        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        escapeRegExp: function(){
            return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
        },
        //http://www.cnblogs.com/rubylouvre/archive/2010/02/09/1666165.html
        //在左边补上一些字符,默认为0
        padLeft: function(digits, filling, radix){
            var num = this.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num= filling + num;
            }
            return num;
        },

        //在右边补上一些字符,默认为0
        padRight: function(digits, filling, radix){
            var num = this.toString(radix || 10);
            filling = filling || "0";
            while(num.length < digits){
                num +=  filling;
            }
            return num;
        },
        // http://www.cnblogs.com/rubylouvre/archive/2009/11/08/1598383.html
        times :function(n){
            var str = this,res = "";
            while (n > 0) {
                if (n & 1)
                    res += str;
                str += str;
                n >>= 1;
            }
            return res;
        }
    });

    $.Array({
        //深拷贝当前数组
        clone: function(){
            var i = this.length, result = [];
            while (i--) result[i] = cloneOf(this[i]);
            return result;
        },
        //取得第一个元素或对它进行操作
        first: function(fn, scope){
            if($.type(fn,"Function")){
                for(var i=0, n = this.length;i < n;i++){
                    if(fn.call(scope,this[i],i,this)){
                        return this[i];
                    }
                }
                return null;
            }else{
                return this[0];
            }
        },
        //取得最后一个元素或对它进行操作
        last: function(fn, scope) {
            if($.type(fn,"Function")){
                for (var i=this.length-1; i > -1; i--) {
                    if (fn.call(scope, this[i], i, this)) {
                        return this[i];
                    }
                }
                return null;
            }else{
                return this[this.length-1];
            }
        },
        //判断数组是否包含此元素
        contains: function (item) {
            return !!~this.indexOf(item) ;
        },
        //http://msdn.microsoft.com/zh-cn/library/bb383786.aspx
        //移除 Array 对象中某个元素的第一个匹配项。
        remove: function (item) {
            var index = this.indexOf(item);
            if (~index ) return $.Array.removeAt.call(this, index);
            return null;
        },
        //移除 Array 对象中指定位置的元素。
        removeAt: function (index) {
            return this.splice(index, 1);
        },
        //对数组进行洗牌,但不影响原对象
        // Jonas Raoni Soares Silva http://jsfromhell.com/array/shuffle [v1.0]
        shuffle: function () {
            var shuff = (this || []).concat(), j, x, i = shuff.length;
            for (; i > 0; j = parseInt(Math.random() * i), x = shuff[--i], shuff[i] = shuff[j], shuff[j] = x) {};
            return shuff;
        },
        //从数组中随机抽选一个元素出来
        random: function () {
            return $.Array.shuffle.call(this)[0];
        },
        //取得数字数组中值最小的元素
        min: function() {
            return Math.min.apply(0, this);
        },
        //取得数字数组中值最大的元素
        max: function() {
            return Math.max.apply(0, this);
        },
        //只有原数组不存在才添加它
        ensure: function() {
            var args = $.slice(arguments);
            args.forEach(function(el){
                if (!~this.indexOf(el) ) this.push(el);
            },this);
            return this;
        },
        //取得对象数组的每个元素的特定属性
        pluck:function(name){
            var result = [], prop;
            this.forEach(function(item){
                prop = item[name];
                if(prop != null)
                    result.push(prop);
            });
            return result;
        },
        //根据对象的某个属性进行排序
        sortBy: function(fn, scope) {
            var array =  this.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                };
            }).sort(function(left, right) {
                var a = left.re, b = right.re;
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return $.Array.pluck.call(array,'el');
        },
        // 以数组形式返回原数组中不为null与undefined的元素
        compact: function () {
            return this.filter(function (el) {
                return el != null;
            });
        },
        //取差集(补集)
        diff : function(array) {
            var result = this.slice();
            for ( var i = 0; i < result.length; i++ ) {
                for ( var j = 0; j < array.length; j++ ) {
                    if ( result[i] === array[j] ) {
                        result.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
            return result;
        },
        //取并集
        union :function(array){
            var arr = this;
            arr = arr.concat(array);
            return $.Array.unique.call(arr);
        },
        //取交集
        intersect:function(array){
            return this.filter(function(n) {
                return ~array.indexOf(n)
            });
        },
        // 返回没有重复值的新数组
        unique: function () {
            var ret = [];
                o:for(var i = 0, n = this.length; i < n; i++) {
                    for(var x = i + 1 ; x < n; x++) {
                        if(this[x] === this[i])
                            continue o;
                    }
                    ret.push(this[i]);
                }
            return ret;
        },
        //对数组进行平坦化处理，返回一个一维数组
        flatten: function() {
            var result = [],self = $.Array.flatten;
            this.forEach(function(item) {
                if ($.isArray(item)) {
                    result = result.concat(self.call(item));
                } else {
                    result.push(item);
                }
            });
            return result;
        }
    });

    var NumberExt = {
        times: function(fn, bind) {
            for (var i=0; i < this; i++)
                fn.call(bind, i);
            return this;
        },
        //确保数值在[n1,n2]闭区间之内,如果超出限界,则置换为离它最近的最大值或最小值
        constrain:function(n1, n2){
            var a = [n1, n2].sort(),num = Number(this);
            if(num < a[0]) num = a[0];
            if(num > a[1]) num = a[1];
            return num;
        },
        //求出距离原数最近的那个数
        nearer:function(n1, n2){
            var num = Number(this),
            diff1 = Math.abs(num - n1),
            diff2 = Math.abs(num - n2);
            return diff1 < diff2 ? n1 : n2
        },
        upto: function(number, fn, scope) {
            for (var i=this+0; i <= number; i++)
                fn.call(scope, i);
            return this;
        },
        downto: function(number, fn, scope) {
            for (var i=this+0; i >= number; i--)
                fn.call(scope, i);
            return this;
        },
        round: function(base) {
            if (base) {
                base = Math.pow(10, base);
                return Math.round(this * base) / base;
            } else {
                return Math.round(this);
            }
        }
    }
    "padLeft,padRight".replace($.rword, function(name){
        NumberExt[name] = function(){
            return $.String[name].apply(this,arguments);
        }
    });
    "abs,acos,asin,atan,atan2,ceil,cos,exp,floor,log,pow,sin,sqrt,tan".replace($.rword,function(name){
        NumberExt[name] = function(){
            return Math[name](this);
        }
    });
    $.Number(NumberExt);
    function cloneOf(item){
        var name = $.type(item);
        switch(name){
            case "Array":
            case "Object":
                return $[name].clone.call(item);
            default:
                return item;
        }
    }
    //使用深拷贝方法将多个对象或数组合并成一个
    function mergeOne(source, key, current){
        if(source[key] && typeof source[key] == "object"){
            $.Object.merge.call(source[key], current);
        }else {
            source[key] = cloneOf(current)
        }
        return source;
    };

    $.Object({
        //根据传入数组取当前对象相关的键值对组成一个新对象返回
        subset: function(keys){
            var results = {};
            for (var i = 0, l = keys.length; i < l; i++){
                var k = keys[i];
                results[k] = this[k];
            }
            return results;
        },
        //遍历对象的键值对
        forEach: function(fn, scope){
            Object.keys(this).forEach(function(name){
                fn.call(scope, this[name], name, this);
            }, this);
        },
        map: function(fn, scope){
            return Object.keys(this).map(function(name){
                fn.call(scope, this[name], name, this);
            }, this);
        },
        //进行深拷贝，返回一个新对象，如果是拷贝请使用$.mix
        clone: function(){
            var clone = {};
            for (var key in this) {
                clone[key] = cloneOf(this[key]);
            }
            return clone;
        },
        merge: function(k, v){
            var target = this, obj, key;
            //为目标对象添加一个键值对
            if (typeof k === "string")
                return mergeOne(target, k, v);
            //合并多个对象
            for (var i = 0, n = arguments.length; i < n; i++){
                obj = arguments[i];
                for ( key in obj){
                    if(obj[key] !== void 0)
                        mergeOne(target, key, obj[key]);
                }
            }
            return target;
        },
        //去掉与传入参数相同的元素
        without: function(arr) {
            var result = {}, key;
            for (key in this) {//相当于构建一个新对象，把不位于传入数组中的元素赋给它
                if (!~arr.indexOf(key) ) {
                    result[key] = this[key];
                }
            }
            return result;
        }
    });
    return $.lang;
});

//2011.7.12 将toArray转移到lang模块下
//2011.7.26 去掉toArray方法,添加globalEval,parseJSON,parseXML方法
//2011.8.6  增加tag方法
//2011.8.14 更新隐藏的命名空间,重构range方法,将node模块的parseHTML方法移到此处并大幅强化
//2011.8.16 $.String2,$.Number2,$.Array2,$.Object2,globalEval 更名为$.String,$.Number,$.Array,$.Object,parseJS
//2011.8.18 $.Object.merge不再设置undefined的值
//2011.8.28 重构Array.unique
//2011.9.11 重构$.isArray $.isFunction
//2011.9.16 修复$.format BUG
//2011.10.2 优化$.lang
//2011.10.3 重写$.isPlainObject与jQuery的保持一致, 优化parseJS，
//2011.10.4 去掉array.without（功能与array.diff相仿），更改object.widthout的参数
//2011.10.6 使用位反操作代替 === -1, 添加array.intersect,array.union
//2011.10.16 添加返回值
//2011.10.21 修复Object.keys BUG
//2011.10.26 优化quote ;将parseJSON parseXML中$.log改为$.error; FIX isPlainObject BUG;
//2011.11.6 对parseXML中的IE部分进行强化
//2011.12.22 修正命名空间
//2012.1.17 添加dump方法
//2012.1.20 重构$.String, $.Array, $.Number, $.Object, 让其变成一个函数
//键盘控制物体移动 http://www.wushen.biz/move/

//==========================================
// 特征嗅探模块 by 司徒正美
//==========================================
$.define("support", function(){
    $.log("已加载特征嗅探模块");
    var global = this, DOC = global.document, div = DOC.createElement('div'),TAGS = "getElementsByTagName";
    div.setAttribute("className", "t");
    div.innerHTML = ' <link/><a href="/nasami"  style="float:left;opacity:.25;">d</a>'+
    '<object><param/></object><table></table><input type="checkbox"/>';
    var a = div[TAGS]("a")[0], style = a.style,
    select = DOC.createElement("select"),

    opt = select.appendChild( DOC.createElement("option") );
    var support = $.support = {
        //是否支持自动插入tbody
        insertTbody: !!div[TAGS]("tbody").length,
        // checkbox的value默认为on，唯有Chrome 返回空字符串
        checkOn :  div[TAGS]( "input" )[ 0 ].value === "on",
        //safari下可能无法取得这个属性,需要访问一下其父元素后才能取得该值
        attrSelected:!!opt.selected,
        //是否区分href属性与特性
        attrHref: a.getAttribute("href") === "/nasami",
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrStyle:a.getAttribute("style") !== style,
        //IE8,FF能直接用getAttribute("class")取得className,而IE67则需要将"class"映射为"className",才能用getAttribute取得
        attrProp:div.className !== "t",
        //http://www.cnblogs.com/rubylouvre/archive/2010/05/16/1736535.html
        //IE8返回".25" ，IE9pp2返回0.25，chrome等返回"0.25"
        cssOpacity: style.opacity == "0.25",
        //某些浏览器不支持w3c的cssFloat属性来获取浮动样式，而是使用独家的styleFloat属性
        cssFloat: !!style.cssFloat,
        //某些浏览器使用document.getElementByTagName("*")不能遍历Object元素下的param元素（bug）
        traverseAll: !!div[TAGS]("param").length,
        //https://prototype.lighthouseapp.com/projects/8886/tickets/264-ie-can-t-create-link-elements-from-html-literals
        //某些浏览器不能通过innerHTML生成link,style,script节点
        createAll: !!div[TAGS]("link").length,
        //IE的cloneNode才是真正意义的复制，能复制动态添加的自定义属性与事件（可惜这不是标准，归为bug）
        cloneAll: false,
        optDisabled: false,
        boxModel: null,
        insertAdjacentHTML:false,
        innerHTML:false,
        fastFragment:false
    };

    //当select元素设置为disabled后，其所有option子元素是否也会被设置为disabled
    select.disabled = true;
    support.optDisabled = !opt.disabled;
    if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
        div.attachEvent("onclick", function click() {
            support.cloneAll = true;//w3c的节点复制是不复制事件的
            div.detachEvent("onclick", click);
        });
        div.cloneNode(true).fireEvent("onclick");
    }
    //测试是否符合w3c的盒子模型
    div.style.width = div.style.paddingLeft = "1px";
    //判定insertAdjacentHTML是否完美，用于append,prepend,before,after等方法
    var table = div[TAGS]("table")[0]
    try{
        table.insertAdjacentHTML("afterBegin","<tr><td>1</td></tr>");
        support.insertAdjacentHTML = true;
    }catch(e){ }
    try{
        var range =  DOC.createRange();
        support.fastFragment = range.createContextualFragment("<a>") && range;
    }catch(e){ };
    //判定innerHTML是否完美，用于html方法
    try{
        table.innerHTML = "<tr><td>1</td></tr>";
        support.innerHTML = true;
    }catch(e){};

    //有些特征嗅探必须连接到DOM树上才能进行
    var body = DOC[TAGS]( "body" )[ 0 ],i,
    testElement = DOC.createElement( body ? "div" : "body" ),
    testElementStyle = {
        visibility: "hidden",
        width: 0,
        height: 0,
        border: 0,
        margin: 0,
        background: "none"
    };
    if ( body ) {
        $.mix( testElementStyle, {
            position: "absolute",
            left: "-1000px",
            top: "-1000px"
        });
    }
    for ( i in testElementStyle ) {
        testElement.style[ i ] = testElementStyle[ i ];
    }
    testElement.appendChild( div );//将DIV加入DOM树
    var testElementParent = body || $.html;
    testElementParent.insertBefore( testElement, testElementParent.firstChild );

    support.boxModel = div.offsetWidth === 2;
    if ( "zoom" in div.style ) {
        //IE7以下版本并不支持display: inline-block;样式，而是使用display: inline;
        //并通过其他样式触发其hasLayout形成一种伪inline-block的状态
        div.style.display = "inline";
        div.style.zoom = 1;
        support.inlineBlockNeedsLayout = div.offsetWidth === 2;
        //http://w3help.org/zh-cn/causes/RD1002
        // 在 IE6 IE7(Q) IE8(Q) 中，如果一个明确设置了尺寸的非替换元素的 'overflow' 为 'visible'，
        // 当该元素无法完全容纳其内容时，该元素的尺寸将被其内容撑大
        // 注:替换元素（replaced element）是指 img，input，textarea，select，object等这类默认就有CSS格式化外表范围的元素
        div.style.display = "";
        div.innerHTML = "<div style='width:4px;'></div>";
        support.shrinkWrapBlocks = div.offsetWidth !== 2;
        if( global.getComputedStyle ) {
            div.style.marginTop = "1%";
            support.pixelMargin = ( global.getComputedStyle( div, null ) || {
                marginTop: 0
            } ).marginTop !== "1%";
        }

    }
    div.innerHTML = "";
    testElementParent.removeChild( testElement );
    div = null;
    return support;
});
/**
2011.9.7 优化attrProp判定
2011.9.16所有延时判定的部分现在可以立即判定了
2011.9.23增加fastFragment判定
*/
//=========================================
// 类工厂模块
//==========================================
$.define("class", "lang",function(){
    $.log("已加载class模块")
    var
    P = "prototype",  C = "constructor", I = "@init",S = "_super",
    unextend = $.oneObject([S,P, 'extend', 'implement','_class']),
    exclusive = new RegExp([S,I,C].join("|")),ron = /on([A-Z][A-Za-z]+)/,
    classOne = $.oneObject('Object,Array,Function');
    function expand(klass,props){
        'extend,implement'.replace($.rword, function(name){
            var modules = props[name];
            if(classOne[$.type(modules)]){
                klass[name].apply(klass,[].concat(modules));
                delete props[name];
            }
        });
        return klass
    }
    function setOptions(){
        var options = this.options = $.Object.merge.apply(this.options || {}, arguments),key,match
        if (typeof this.bind == "function") {
            for (key in options) {
                if ((match = key.match(ron))) {
                    this.bind(match[1].toLowerCase(), options[key]);
                    delete(options[key]);
                }
            }
        }
        return this;
    }
    function _super(){
        var caller = arguments.callee.caller;  // 取得当前方法
        var name = caller._name;  // 取得当前方法名
        var superclass = caller._class[S];//取得当前实例的父类
        if(superclass && superclass[P][name] ){
            return superclass[P][name].apply(this, arguments.length ? arguments : caller.arguments);
        }else{
            throw name + " no super method!"
        }
    }
    $["@class"] =  {
        inherit : function(parent,init) {
            var bridge = function() { }
            if(typeof parent == "function"){
                for(var i in parent){//继承类成员
                    this[i] = parent[i]
                }
                bridge[P] = parent[P];
                this[P] = new bridge ;//继承原型成员
                this[S]  = parent;//指定父类
            }
            this[I] = (this[I] || []).concat();
            if(init){
                this[I].push(init);
            }
            this.toString = function(){
                return (init || bridge) + ""
            }
            var KP = this[P];
            KP.setOptions = setOptions;
            KP[S] = _super;//绑定方法链
            return  KP[C] = this;
        },
        implement:function(){
            var target = this[P], reg = exclusive;
            for(var i = 0, module; module = arguments[i++]; ){
                module = typeof module === "function" ? new module :module;
                Object.keys(module).forEach(function(name){
                    if(!reg.test(name)){
                        var prop = target[name] = module[name];
                        if(typeof prop == "function"){
                            prop._name  = name;
                            prop._class = this;
                        }
                    }
                },this);
            }
            return this;
        },
        extend: function(){//扩展类成员
            var bridge = {}
            for(var i = 0, module; module = arguments[i++]; ){
                $.mix(bridge, module);
            }
            for(var key in bridge){
                if(!unextend[key]){
                    this[key] =  bridge[key]
                }
            }
            return this;
        }
    };
    $.factory = function(obj){
        obj = obj || {};
        var parent  = obj.inherit //父类
        var init = obj.init ; //构造器
        delete obj.inherit;
        delete obj.init;
        var klass = function () {
            for(var i = 0 , init ; init =  klass[I][i++];){
                init.apply(this, arguments);
            }
        };
        $.mix(klass,$["@class"]).inherit(parent, init);//添加更多类方法
        return expand(klass,obj).implement(obj);
    }
});

//2011.7.11
//dom["class"]改为dom["@class"]
//2011.7.25
//继承链与方法链被重新实现。
//在方法中调用父类的同名实例方法，由$super改为supermethod，保留父类的原型属性parent改为superclass
//2011.8.6
//在方法中调用父类的同名实例方法，由supermethod改为_super，保留父类的原型属性superclass改为_super
//重新实现方法链
//fix 子类实例不是父类的实例的bug
//2011.8.14 更改隐藏namespace,增强setOptions
//2011.10.7 include更名为implement 修复implement的BUG（能让人重写toString valueOf方法）


//==================================================
// 数据缓存模块
//==================================================
$.define("data", "lang", function(){
    $.log("已加载data模块");
    var remitter = /object|function/
    $.mix($,{
        memcache:{},
        // 读写数据
        data : function( target, name, data, pvt ) {
            if(target && remitter.test(typeof target)){//只处理HTML节点与普通对象
                var id = target.uniqueNumber || (target.uniqueNumber = $.uuid++);
                if(name === "@uuid"){
                    return id;
                }
                var memcache = target.nodeType === 1 ? $.memcache: target;
                var table = memcache[ "@data_"+id ] || (memcache[ "@data_"+id ] = {});
                if ( !pvt ) {
                    table = table.data || (table.data = {});
                }
                var getByName = typeof name === "string";
                if ( name && typeof name == "object" ) {
                    $.mix(table, name);
                }else if(getByName && data !== void 0){
                    table[ name ] = data;
                }
                return getByName ? table[ name ] : table;
            }
        },
        _data:function(target,name,data){
            return $.data(target, name, data, true)
        },
        //移除数据
        removeData : function(target, name, pvt){
            if(target && remitter.test(typeof target)){
                var id = target.uniqueNumber;
                if (  !id ) {
                    return;
                }
                var memcache = target.nodeType === 1  ? $.memcache : target;
                var table = memcache["@data_"+id], clear = 1, ret = typeof name == "string" ;
                if ( table && ret ) {
                    if(!pvt){
                        table = table.data
                    }
                    if(table){
                        ret = table[ name ];
                        delete table[ name ];
                    }
                    var cache = memcache["@data_"+id];
                        loop:
                        for(var key in cache){
                            if(key == "data"){
                                for(var i in cache.data){
                                    clear = 0;
                                    break loop;
                                }
                            }else{
                                clear = 0;
                                break loop;
                            }
                        }
                }
                if(clear){
                    delete memcache["@data_"+id];
                }
                return ret;
            }
        },
        //合并数据
        mergeData:function(neo, src){
            var srcData = $._data(src), neoData = $._data(neo), events = srcData.events;
            if(srcData && neoData){
                $.Object.merge.call(neoData, srcData);
                if(events){
                    delete neoData.handle;
                    neoData.events = {};
                    for ( var type in events ) {
                        for (var i = 0, obj ; obj =  events[ type ][i++]; ) {
                            $.event.bind.call( neo, type + ( obj.namespace ? "." : "" ) + obj.namespace, obj.handler, obj.selector, obj.times );
                        }
                    }
                }
            }
        }
    });
    
});

//2011.9.27 uniqueID改为uniqueNumber 简化data与removeData
//2011.9.28 添加$._data处理内部数据
//2011.10.21 强化mergeData，可以拷贝事件

//$.query v5 开发代号Icarus
$.define("query", function(){
    var global = this, DOC = global.document;
    $.mix($,{
        //http://www.cnblogs.com/rubylouvre/archive/2010/03/14/1685360.
        isXML : function(el){
            var doc = el.ownerDocument || el
            return doc.createElement("p").nodeName !== doc.createElement("P").nodeName;
        },
        // 第一个节点是否包含第二个节点
        contains:function(a, b){
            if(a.compareDocumentPosition){
                return !!(a.compareDocumentPosition(b) & 16);
            }else if(a.contains){
                return a !== b && (a.contains ? a.contains(b) : true);
            }
            while ((b = b.parentNode))
                if (a === b) return true;
            return false;
        },
        //获取某个节点的文本，如果此节点为元素节点，则取其childNodes的所有文本，
        //为了让结果在所有浏览器下一致，忽略所有空白节点，因此它非元素的innerText或textContent
        getText : function() {
            return function getText( nodes ) {
                for ( var i = 0, ret = "",node; node = nodes[i++];  ) {
                    // 对得文本节点与CDATA的内容
                    if ( node.nodeType === 3 || node.nodeType === 4 ) {
                        ret += node.nodeValue;
                    //取得元素节点的内容
                    } else if ( node.nodeType !== 8 ) {
                        ret += getText( node.childNodes );
                    }
                }
                return ret;
            }
        }(),
        unique :function(nodes){
            if(nodes.length < 2){
                return nodes;
            }
            var result = [], array = [], uniqResult = {}, node = nodes[0],index, ri = 0
            //如果支持sourceIndex我们将使用更为高效的节点排序
            //http://www.cnblogs.com/jkisjk/archive/2011/01/28/array_quickly_sortby.html
            if(node.sourceIndex){//IE opera
                for(var i = 0 , n = nodes.length; i< n; i++){
                    node = nodes[i];
                    index = node.sourceIndex+1e8;
                    if(!uniqResult[index]){
                        (array[ri++] = new String(index))._ = node;
                        uniqResult[index] = 1
                    }
                }
                array.sort();
                while( ri )
                    result[--ri] = array[ri]._;
                return result;
            }else {
                var sortOrder = node.compareDocumentPosition ? sortOrder1 : sortOrder2;
                nodes.sort( sortOrder );
                if (sortOrder.hasDuplicate ) {
                    for ( i = 1; i < nodes.length; i++ ) {
                        if ( nodes[i] === nodes[ i - 1 ] ) {
                            nodes.splice( i--, 1 );
                        }
                    }
                }
                sortOrder.hasDuplicate = false;
                return nodes;
            }
        }
    });
    var reg_combinator  = /^\s*([>+~,\s])\s*(\*|(?:[-\w*]|[^\x00-\xa0]|\\.)*)/
    var trimLeft = /^\s+/;
    var trimRight = /\s+$/;
    var reg_quick = /^(^|[#.])((?:[-\w]|[^\x00-\xa0]|\\.)+)$/;
    var reg_comma       = /^\s*,\s*/;
    var reg_sequence = /^([#\.:]|\[\s*)((?:[-\w]|[^\x00-\xa0]|\\.)+)/;
    var reg_pseudo        = /^\(\s*("([^"]*)"|'([^']*)'|[^\(\)]*(\([^\(\)]*\))?)\s*\)/;
    var reg_attrib      = /^\s*(?:(\S?=)\s*(?:(['"])(.*?)\2|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/
    var reg_attrval  = /\\([0-9a-fA-F]{2,2})/g;
    var reg_sensitive       = /^(title|id|name|class|for|href|src)$/
    var reg_backslash = /\\/g;
    var reg_tag  = /^((?:[-\w\*]|[^\x00-\xa0]|\\.)+)/;//能使用getElementsByTagName处理的CSS表达式
    if ( trimLeft.test( "\xA0" ) ) {
        trimLeft = /^[\s\xA0]+/;
        trimRight = /[\s\xA0]+$/;
    }

    var hash_operator   = {
        "=": 1, 
        "!=": 2, 
        "|=": 3,
        "~=": 4, 
        "^=": 5, 
        "$=": 6, 
        "*=": 7
    }

    function sortOrder1( a, b ) {
        if ( a === b ) {
            sortOrder1.hasDuplicate = true;
            return 0;
        }
        if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
            return a.compareDocumentPosition ? -1 : 1;
        }
        return a.compareDocumentPosition(b) & 4 ? -1 : 1;
    };

    function sortOrder2( a, b ) {//处理旧式的标准浏览器与XML
        if ( a === b ) {
            sortOrder2.hasDuplicate = true;
            return 0;
        }
        var al, bl,
        ap = [],
        bp = [],
        aup = a.parentNode,
        bup = b.parentNode,
        cur = aup;
        //如果是属于同一个父节点，那么就比较它们在childNodes中的位置
        if ( aup === bup ) {
            return siblingCheck( a, b );
        // If no parents were found then the nodes are disconnected
        } else if ( !aup ) {
            return -1;

        } else if ( !bup ) {
            return 1;
        }
        // Otherwise they're somewhere else in the tree so we need
        // to build up a full list of the parentNodes for comparison
        while ( cur ) {
            ap.unshift( cur );
            cur = cur.parentNode;
        }

        cur = bup;

        while ( cur ) {
            bp.unshift( cur );
            cur = cur.parentNode;
        }

        al = ap.length;
        bl = bp.length;

        // Start walking down the tree looking for a discrepancy
        for ( var i = 0; i < al && i < bl; i++ ) {
            if ( ap[i] !== bp[i] ) {
                return siblingCheck( ap[i], bp[i] );
            }
        }
        // We ended someplace up the tree so do a sibling check
        return i === al ?
        siblingCheck( a, bp[i], -1 ) :
        siblingCheck( ap[i], b, 1 );
    };
    function siblingCheck( a, b, ret ) {
        if ( a === b ) {
            return ret;
        }
        var cur = a.nextSibling;

        while ( cur ) {
            if ( cur === b ) {
                return -1;
            }
            cur = cur.nextSibling;
        }
        return 1;
    };
    var slice = Array.prototype.slice,
    makeArray = function ( nodes, result, flag_multi ) {  
        nodes = slice.call( nodes, 0 );
        if ( result ) {
            result.push.apply( result, nodes );
        }else{
            result = nodes;
        }
        return  flag_multi ? $.unique(result) : result;
    };
    //IE56789无法使用数组方法转换节点集合
    try {
        slice.call( $.html.childNodes, 0 )[0].nodeType;
    } catch( e ) {
        makeArray = function ( nodes, result ,flag_multi) {
            var ret = result || [], ri = ret.length;
            for(var i = 0,el ; el = nodes[i++];){
                ret[ri++] = el
            }
            return flag_multi ? $.unique(ret) : ret;
        }
    }
    function _toHex(x, y) {
        return String.fromCharCode(parseInt(y, 16));
    }
    function parse_nth(expr) {
        var orig = expr
        expr = expr.replace(/^\+|\s*/g, '');//清除无用的空白
        var match = (expr === "even" && "2n" || expr === "odd" && "2n+1" || !/\D/.test(expr) && "0n+" + expr || expr).match(/(-?)(\d*)n([-+]?\d*)/);
        return parse_nth[ orig ] = {
            a: (match[1] + (match[2] || 1)) - 0, 
            b: match[3] - 0
        };
    }
    function getElementsByTagName(tagName, els, flag_xml) {
        var method = "getElementsByTagName", elems = [], uniqResult = {}, prefix
        if(flag_xml && tagName.indexOf(":") > 0 && els.length && els[0].lookupNamespaceURI){
            var arr = tagName.split(":");
            prefix = arr[0];
            tagName = arr[1];
            method = "getElementsByTagNameNS";
            prefix = els[0].lookupNamespaceURI(prefix);
        }
        switch (els.length) {
            case 0:
                return elems;
            case 1:
                //在IE67下，如果存在一个name为length的input元素，下面的all.length返回此元素，而不是长度值
                var all =  prefix ? els[0][method](prefix,tagName) : els[0][method](tagName);
                for(var i = 0, ri = 0, el; el = all[i++];){
                    if(el.nodeType === 1){//防止混入注释节点
                        elems[ri++] = el
                    }
                }
                return elems;
            default:
                for(i = 0, ri = 0; el = els[i++];){
                    var nodes = prefix ? el[method](prefix,tagName) : el[method](tagName)
                    for (var j = 0, node; node = nodes[j++];) {
                        var uid = $.getUid(node);
                           
                        if (!uniqResult[uid]) {
                            uniqResult[uid] = elems[ri++] = node;
                        }
                    }
                }
                return elems;
        }
    }
    //IE9 以下的XML文档不能直接设置自定义属性
    var attrURL = $.oneObject('action,cite,codebase,data,href,longdesc,lowsrc,src,usemap', 2);
    var bools = $["@bools"] = "autofocus,autoplay,async,checked,controls,declare,disabled,defer,defaultChecked,"+
    "contentEditable,ismap,loop,multiple,noshade,open,noresize,readOnly,selected"
    var boolOne = $.oneObject(bools.toLowerCase() );
        
    //检测各种BUG（fixGetAttribute，fixHasAttribute，fixById，fixByTag）
    var fixGetAttribute,fixHasAttribute,fixById,fixByTag;
    var getHTMLText = new Function("els","return els[0]."+ ($.html.textContent ? "textContent" : "innerText") );

    new function(){
        var select = DOC.createElement("select");
        var option = select.appendChild( DOC.createElement("option") );
        option.setAttribute("selected","selected")
        option.className ="x"
        fixGetAttribute = option.getAttribute("class") != "x";
        select.appendChild( DOC.createComment("") );
        fixByTag = select.getElementsByTagName("*").length == 2
        var all = DOC.getElementsByTagName("*"), node, nodeType, comments = [], i = 0, j = 0;
        while ( (node = all[i++]) ) {  
            nodeType = node.nodeType;
            nodeType === 1 ? $.getUid(node) :
            nodeType === 8 ? comments.push(node) : 0;  
        }
        while ( (node = comments[j++]) ) {   
            node.parentNode.removeChild(node);
        }
        fixHasAttribute = select.hasAttribute ? !option.hasAttribute('selected') :true;
        
        var form = DOC.createElement("div"),
        id = "fixId" + (new Date()).getTime(),
        root = $.html;
        form.innerHTML = "<a name='" + id + "'/>";
        root.insertBefore( form, root.firstChild );
        fixById = !!DOC.getElementById( id ) ;
        root.removeChild(form )
    };

    //http://www.atmarkit.co.jp/fxml/tanpatsu/24bohem/01.html
    //http://msdn.microsoft.com/zh-CN/library/ms256086.aspx
    //https://developer.mozilla.org/cn/DOM/document.evaluate
    //http://d.hatena.ne.jp/javascripter/20080425/1209094795
    function getElementsByXPath(xpath,context,doc) {
        var result = [];
        try{
            if(global.DOMParser){//IE9支持DOMParser，但我们不能使用doc.evaluate!global.DOMParser
                var nodes = doc.evaluate(xpath, context, null, 7, null);
                for (var i = 0, n = nodes.snapshotLength; i < n; i++){
                    result[i] =  nodes.snapshotItem(i)
                } 
            }else{
                nodes = context.selectNodes(xpath);
                for (i = 0, n = nodes.length; i < n; i++){
                    result[i] =  nodes[i]
                } 
            }
        }catch(e){
            return false;
        }
        return result;
    };
    /**
         * 选择器
         * @param {String} expr CSS表达式
         * @param {Node}   context 上下文（可选）
         * @param {Array}  result  结果集(内部使用)
         * @param {Array}  lastResult  上次的结果集(内部使用)
         * @param {Boolean}flag_xml 是否为XML文档(内部使用)
         * @param {Boolean}flag_multi 是否出现并联选择器(内部使用)
         * @param {Boolean}flag_dirty 是否出现通配符选择器(内部使用)
         * @return {Array} result
         */
    //http://webbugtrack.blogspot.com/
    var Icarus = $.query = function(expr, contexts, result, lastResult, flag_xml,flag_multi,flag_dirty){
        result = result || [];
        contexts = contexts || DOC;
        var pushResult = makeArray;
        if(!contexts.nodeType){//实现对多上下文的支持
            contexts = pushResult(contexts);
            if(!contexts.length)
                return result
        }else{
            contexts = [contexts];
        }
        var rrelative = reg_combinator,//保存到本地作用域
        rquick = reg_quick,
        rBackslash = reg_backslash, rcomma = reg_comma,//用于切割并联选择器
        context = contexts[0],
        doc = context.ownerDocument || context,
        rtag = reg_tag,
        flag_all, uniqResult, elems, nodes, tagName, last, ri, uid;
        //将这次得到的结果集放到最终结果集中
        //如果要从多个上下文中过滤孩子
        expr = expr.replace(trimLeft, "").replace(trimRight, "");  
        flag_xml = flag_xml !== void 0 ? flag_xml : $.isXML(doc);
       
        if (!flag_xml && doc.querySelectorAll2) {
            var query = expr;
            if(contexts.length > 2 || doc.documentMode == 8  && context.nodeType == 1  ){
                if(contexts.length > 2 )
                    context = doc;
                query = ".fix_icarus_sqa "+query;//IE8也要使用类名确保查找范围
                for(var i = 0, node; node = contexts[i++];){
                    if(node.nodeType === 1){
                        node.className = "fix_icarus_sqa " + node.className;
                    }
                }
            }
            if(doc.documentMode !== 8  || context.nodeName.toLowerCase() !== "object"){
                try{
                    return pushResult( context.querySelectorAll(query), result, flag_multi);
                }catch(e){
                }finally{
                    if(query.indexOf(".fix_icarus_sqa") === 0 ){//如果为上下文添加了类名，就要去掉类名
                        for(i = 0; node = contexts[i++];){
                            if(node.nodeType === 1){
                                node.className =  node.className.replace("fix_icarus_sqa ","");
                            }
                        }
                    }
                }
            }
        }
        var match = expr.match(rquick);
        if(match ){//对只有单个标签，类名或ID的选择器进行提速
            var value = match[2].replace(rBackslash,""), key = match[1];
            if (  key == "") {//tagName;
                nodes = getElementsByTagName(value,contexts,flag_xml);
            } else if ( key === "." && contexts.length === 1 ) {//className，并且上下文只有1个
                if(flag_xml){//如果XPATH查找失败，就会返回字符，那些我们就使用普通方式去查找
                    nodes = getElementsByXPath("//*[@class='"+value+"']", context, doc);
                }else if(context.getElementsByClassName){
                    nodes = context.getElementsByClassName( value );
                }
            }else if ( key === "#" && contexts.length === 1){//ID，并且上下文只有1个
                if( flag_xml){
                    nodes = getElementsByXPath("//*[@id='"+value+"']", context, doc);
                //基于document的查找是不安全的，因为生成的节点可能还没有加入DOM树，比如$("<div id=\"A'B~C.D[E]\"><p>foo</p></div>").find("p")
                }else if(context.nodeType == 9){
                    node = doc.getElementById(value);
                    //IE67 opera混淆表单元素，object以及链接的ID与NAME
                    //http://webbugtrack.blogspot.com/2007/08/bug-152-getelementbyid-returns.html
                    nodes = !node ? [] : !fixById ? [node] : node.getAttributeNode("id").nodeValue === value ? [node] : false;
                }
            }
            if(nodes ){
                return pushResult( nodes, result, flag_multi );
            }
        }
        //执行效率应该是内大外小更高一写
        lastResult = contexts;
        if(lastResult.length){
            loop:
            while (expr && last !== expr) {
                flag_dirty = false;
                elems = null;
                uniqResult = {};
                //处理夹在中间的关系选择器（取得连接符及其后的标签选择器或通配符选择器）
                if (match = expr.match(rrelative)) {
                    expr = RegExp.rightContext;
                    elems = [];
                    tagName = (flag_xml ? match[2] : match[2].toUpperCase()).replace(rBackslash,"") || "*";
                    i = 0;
                    ri = 0;
                    flag_all = tagName === "*";// 表示无需判定tagName
                    switch (match[1]) {//根据连接符取得种子集的亲戚，组成新的种子集
                        case " "://后代选择器
                            if(expr.length || match[2]){//如果后面还跟着东西或最后的字符是通配符
                                elems = getElementsByTagName(tagName, lastResult, flag_xml);
                            }else{
                                elems = lastResult;
                                break loop
                            }
                            break;
                        case ">"://亲子选择器
                            while((node = lastResult[i++])){
                                for (node = node.firstChild; node; node = node.nextSibling){
                                    if (node.nodeType === 1 && (flag_all || tagName === node.nodeName)){
                                        elems[ri++] = node;
                                    }
                                }
                            }
                            break;
                        case "+"://相邻选择器
                            while((node = lastResult[i++])){
                                while((node = node.nextSibling)){
                                    if (node.nodeType === 1) {
                                        if (flag_all || tagName === node.nodeName)
                                            elems[ri++] = node;
                                        break;
                                    }
                                }
                            }
                            break;
                        case "~"://兄长选择器
                            while((node = lastResult[i++])){
                                while((node = node.nextSibling)){
                                    if (node.nodeType === 1 && (flag_all || tagName === node.nodeName)) {
                                        uid = $.getUid(node);
                                        if (uniqResult[uid]){
                                            break;
                                        }else {
                                            uniqResult[uid] = elems[ri++] = node;
                                        }
                                    }
                                }
                            }
                            elems = $.unique(elems);
                            break;
                    }
                }else if(match = expr.match(rtag)){//处理位于最开始的或并联选择器之后的标签选择器或通配符
                    expr = RegExp.rightContext;
                    elems = getElementsByTagName(match[1].replace(rBackslash,""), lastResult, flag_xml);
                }
                   
                if(expr){
                    var arr = Icarus.filter(expr, elems, lastResult, doc, flag_xml);
                    expr = arr[0];
                    elems = arr[1];
                    if (!elems) {
                        flag_dirty = true;
                        elems = getElementsByTagName("*", lastResult, flag_xml);
                    }
                    if (match = expr.match(rcomma)) {
                        expr = RegExp.rightContext;
                        pushResult(elems, result);
                        return Icarus(expr, contexts, result, [], flag_xml, true, flag_dirty);
                    }else{
                        lastResult = elems;
                    }
                }
                    
            }
        }
        if (flag_multi) {
            if (elems.length){
                return pushResult(elems, result,flag_multi);
            }
        }else if (DOC !== doc || fixByTag && flag_dirty) {
            for (result = [], ri = 0, i = 0; node = elems[i++]; )
                if (node.nodeType === 1)
                    result[ri++] = node;
            return result
        }
        return elems;
    }
    var onePosition = $.oneObject("eq|gt|lt|first|last|even|odd".split("|"));

    $.mix(Icarus, {
        //getAttribute总会返回字符串
        //http://reference.sitepoint.com/javascript/Element/getAttribute
        getAttribute : !fixGetAttribute ?
        function(elem, name) {
            return elem.getAttribute(name) || '';
        } :
        function(elem, name, flag_xml) {
            if(flag_xml)
                return elem.getAttribute(name) || '';
            name = name.toLowerCase();
            //http://jsfox.cn/blog/javascript/get-right-href-attribute.html
            if(attrURL[name]){//得到href属性里原始链接，不自动转绝对地址、汉字和符号都不编码
                return  elem.getAttribute(name, 2) || ''
            }
            if(name === "style"){
                return elem.style.cssText.toLowerCase();
            }
            if(elem.tagName === "INPUT" && name == "type"){
                return elem.getAttribute("type") || elem.type;//IE67无法辩识HTML5添加添加的input类型，如input[type=search]，不能使用el.type与el.getAttributeNode去取。
            }
            //布尔属性，如果为true时则返回其属性名，否则返回空字符串，其他一律使用getAttributeNode
            var attr = boolOne[name] ? (elem.getAttribute(name) ? name : '') :
            (elem = elem.getAttributeNode(name)) && elem.value || '';
            return reg_sensitive.test(name)? attr :attr.toLowerCase();
        },
        hasAttribute : !fixHasAttribute ?
        function(elem, name, flag_xml) {
            return flag_xml ?  !!elem.getAttribute(name) :elem.hasAttribute(name);
        } :
        function(elem, name) {
            //http://help.dottoro.com/ljnqsrfe.php
            name = name.toLowerCase();
            //如果这个显式设置的属性是""，即使是outerHTML也寻不见其踪影
            elem = elem.getAttributeNode(name);
            return !!(elem && (elem.specified || elem.nodeValue));
        },
        filter : function(expr, elems, lastResult, doc, flag_xml, flag_get){
            var rsequence = reg_sequence,
            rattrib = reg_attrib ,
            rpseudo = reg_pseudo,
            rBackslash = reg_backslash,
            rattrval  = reg_attrval,
            pushResult = makeArray,
            toHex = _toHex,
            _hash_op  = hash_operator,
            parseNth = parse_nth,
            match ,key, tmp;
            while ( match = expr.match(rsequence)) {//主循环
                expr = RegExp.rightContext;     
                key = ( match[2]|| "").replace(rBackslash,"");
                if (!elems) {//取得用于过滤的元素
                    if (lastResult.length === 1 && lastResult[0] === doc){
                        switch (match[1]) {
                            case "#":
                                if (!flag_xml) {//FF chrome opera等XML文档中也存在getElementById，但不能用
                                    tmp = doc.getElementById(key);
                                    if (!tmp) {
                                        elems = [];
                                        continue;
                                    }
                                    //处理拥有name值为"id"的控件的form元素
                                    if (fixById ? tmp.id === key : tmp.getAttributeNode("id").nodeValue === key) {
                                        elems = [tmp];
                                        continue;
                                    }
                                }
                                break;
                            case ":":
                                switch (key) {
                                    case "root":
                                        elems = [doc.documentElement];
                                        continue;
                                    case "link":
                                        elems = pushResult(doc.links || []);
                                        continue;
                                }
                                break;
                        }
                    }
                    elems = getElementsByTagName("*", lastResult, flag_xml);//取得过滤元
                }
                //取得用于过滤的函数，函数参数或数组
                var filter = 0, flag_not = false, args; 
                switch (match[1]) {
                    case "#"://ID选择器
                        filter = ["id", "=", key];
                        break;
                    case "."://类选择器
                        filter = ["class", "~=", key];
                        break;
                    case ":"://伪类选择器
                        tmp = Icarus.pseudoAdapter[key];
                        if (match = expr.match(rpseudo)) {
                            expr = RegExp.rightContext;
                            if(!!~key.indexOf("nth")){
                                args = parseNth[match[1]] || parseNth(match[1]);
                            }else{
                                args = match[3] || match[2] || match[1]
                            }
                        }
                        if (tmp){
                            filter = tmp;
                        }else if (key === "not") {
                            flag_not = true;
                            if (args === "*"){//处理反选伪类中的通配符选择器
                                elems = [];
                            }else if(reg_tag.test(args)){//处理反选伪类中的标签选择器
                                tmp = [];
                                match = flag_xml ? args : args.toUpperCase();
                                for (var i = 0, ri = 0, elem; elem = elems[i++];)
                                    if (match !== elem.nodeName)
                                        tmp[ri++] = elem;
                                elems = tmp;
                            }else{
                                var obj =  Icarus.filter(args, elems, lastResult, doc, flag_xml, true) ;
                                filter = obj.filter;
                                args   = obj.args;
                            }
                        }
                        else{
                            throw 'An invalid or illegal string was specified : "'+ key+'"!'
                        }
                        break
                    default:
                        filter = [key.toLowerCase()];  
                        if (match = expr.match(rattrib)) {
                            expr = RegExp.rightContext;
                            if (match[1]) {
                                filter[1] = match[1];//op
                                filter[2] = match[3] || match[4];//对值进行转义
                                filter[2] = filter[2] ? filter[2].replace(rattrval, toHex).replace(rBackslash,"") : "";
                            }
                        }
                        break;
                }
                if(flag_get){
                    return {
                        filter:filter,
                        args:args
                    }
                }
                //如果条件都俱备，就开始进行筛选 
                if (elems.length && filter) {
                    tmp = [];
                    i = 0;
                    ri = 0;
                    if (typeof filter === "function") {//如果是一些简单的伪类
                        if(onePosition[key]){
                            //如果args为void则将集合的最大索引值传进去，否则将exp转换为数字
                            args =  args === void 0 ? elems.length - 1 : ~~args;
                            for (; elem = elems[i];){
                                if(filter(i++, args) ^ flag_not)
                                    tmp[ri++] = elem;
                            }
                        }else{
                            while((elem = elems[i++])){
                                if ((!!filter(elem, args)) ^ flag_not)
                                    tmp[ri++] = elem;
                            }
                        }
                    }else if (typeof filter.exec === "function"){//如果是子元素过滤伪类
                        tmp = filter.exec({
                            not: flag_not, 
                            xml: flag_xml
                        }, elems, args, doc);
                    } else {
                        var name = filter[0], op = _hash_op[filter[1]], val = filter[2]||"", flag, attr;
                        if (!flag_xml && name === "class" && op === 4) {//如果是类名
                            val = " " + val + " ";
                            while((elem = elems[i++])){
                                var className = elem.className;
                                if (!!(className && (" " + className + " ").indexOf(val) > -1) ^ flag_not){
                                    tmp[ri++] = elem;
                                }
                            }
                        } else {
                            if(!flag_xml && op && val && !reg_sensitive.test(name)){
                                val = val.toLowerCase();
                            }
                            if (op === 4){
                                val = " " + val + " ";
                            }
                            while((elem = elems[i++])){
                                if(!op){
                                    flag = Icarus.hasAttribute(elem,name,flag_xml);//[title]
                                }else if(val === "" && op > 3){
                                    flag = false
                                }else{
                                    attr = Icarus.getAttribute(elem,name,flag_xml);
                                    switch (op) {
                                        case 1:// = 属性值全等于给出值
                                            flag = attr === val;
                                            break;
                                        case 2://!= 非标准，属性值不等于给出值
                                            flag = attr !== val;
                                            break;
                                        case 3://|= 属性值以“-”分割成两部分，给出值等于其中一部分，或全等于属性值
                                            flag = attr === val || attr.substr(0, val.length + 1) === val + "-";
                                            break;
                                        case 4://~= 属性值为多个单词，给出值为其中一个。
                                            flag = attr && (" " + attr + " ").indexOf(val) >= 0;
                                            break;
                                        case 5://^= 属性值以给出值开头
                                            flag = attr  && attr.indexOf(val) === 0 ;
                                            break;
                                        case 6://$= 属性值以给出值结尾
                                            flag = attr  && attr.substr(attr.length - val.length) === val;
                                            break;
                                        case 7://*= 属性值包含给出值
                                            flag = attr  && attr.indexOf(val) >= 0;
                                            break;
                                    }
                                }
                                if (flag ^ flag_not)
                                    tmp[ri++] = elem;
                            }
                        }
                    }
                    elems = tmp;
                }
            }
            return [expr, elems];
        }
    });

    //===================构建处理伪类的适配器=====================
    var filterPseudoHasExp = function(strchild,strsibling, type){
        return {
            exec:function(flags,lastResult,args){
                var result = [], flag_not = flags.not,child = strchild, sibling = strsibling,
                ofType = type, cache = {},lock = {},a = args.a, b = args.b, i = 0, ri = 0, el, found ,diff,count;
                if(!ofType && a === 1 && b === 0 ){
                    return flag_not ? [] : lastResult;
                }
                var checkName = ofType ? "nodeName" : "nodeType";
                for (; el = lastResult[i++];) {
                    var parent = el.parentNode;
                    var pid =  $.getUid(parent);
                    if (!lock[pid]){
                        count = lock[pid] = 1;
                        var checkValue = ofType ? el.nodeName : 1;
                        for(var node = parent[child];node;node = node[sibling]){
                            if(node[checkName] === checkValue){
                                pid = $.getUid(node);
                                cache[pid] = count++;
                            }
                        }
                    }
                    diff = cache[$.getUid(el)] - b;
                    found =  a === 0 ? diff === 0 : (diff % a === 0 && diff / a >= 0 );
                    (found ^ flag_not) && (result[ri++] = el);
                }
                return  result;
            }
        };
    };
    function filterPseudoNoExp(name, isLast, isOnly) {
        var A = "var result = [], flag_not = flags.not, node, el, tagName, i = 0, ri = 0, found = 0; for (; node = el = lastResult[i++];found = 0) {"
        var B = "{0} while (!found && (node=node.{1})) { (node.{2} === {3})  && ++found;  }";
        var C = " node = el;while (!found && (node = node.previousSibling)) {  node.{2} === {3} && ++found;  }";
        var D =  "!found ^ flag_not && (result[ri++] = el);  }   return result";

        var start = isLast ? "nextSibling" : "previousSibling";
        var fills = {
            type: [" tagName = el.nodeName;", start, "nodeName", "tagName"],
            child: ["", start, "nodeType", "1"]
        }
        [name];
        var body = A+B+(isOnly ? C: "")+D;
        var fn = new Function("flags","lastResult",body.replace(/{(\d)}/g, function ($, $1) {
            return fills[$1];
        }));
        return {
            exec:fn
        }
    }

    function filterProp(str_prop, flag) {
        return {
            exec: function (flags, elems) {
                var result = [], prop = str_prop, flag_not = flag ? flags.not : !flags.not;
                for (var i = 0,ri = 0, elem; elem = elems[i++];)
                    if ( elem[prop] ^ flag_not)
                        result[ri++] = elem;//&& ( !flag || elem.type !== "hidden" )
                return result;
            }
        };
    };
    Icarus.pseudoAdapter = {
        root: function (el) {//标准
            return el === (el.ownerDocument || el.document).documentElement;
        },
        target: {//标准
            exec: function (flags, elems,_,doc) {
                var result = [], flag_not = flags.not;
                var win = doc.defaultView || doc.parentWindow;
                var hash = win.location.hash.slice(1);       
                for (var i = 0,ri = 0, elem; elem = elems[i++];)
                    if (((elem.id || elem.name) === hash) ^ flag_not)
                        result[ri++] = elem;
                return result;
            }
        },
        "first-child"    : filterPseudoNoExp("child", false, false),
        "last-child"     : filterPseudoNoExp("child", true,  false),
        "only-child"     : filterPseudoNoExp("child", true,  true),
        "first-of-type"  : filterPseudoNoExp("type",  false, false),
        "last-of-type"   : filterPseudoNoExp("type",  true,  false),
        "only-of-type"   : filterPseudoNoExp("type",  true,  true),//name, isLast, isOnly
        "nth-child"       : filterPseudoHasExp("firstChild", "nextSibling",     false),//标准
        "nth-last-child"  : filterPseudoHasExp("lastChild",  "previousSibling", false),//标准
        "nth-of-type"     : filterPseudoHasExp("firstChild", "nextSibling",     true),//标准
        "nth-last-of-type": filterPseudoHasExp("lastChild",  "previousSibling", true),//标准
        empty: {//标准
            exec: function (flags, elems) {   
                var result = [], flag_not = flags.not, check
                for (var i = 0, ri = 0, elem; elem = elems[i++];) {
                    if(elem.nodeType == 1){
                        if (!elem.firstChild ^ flag_not)
                            result[ri++] = elem;
                    }
                }
                return result;
            }
        },
        link: {//标准
            exec: function (flags, elems) {
                var links = (elems[0].ownerDocument || elems[0].document).links;
                if (!links) return [];
                var result = [],
                checked = {},
                flag_not = flags.not;
                for (var i = 0, ri = 0,elem; elem = links[i++];)
                    checked[$.getUid(elem) ] = 1;
                for (i = 0; elem = elems[i++]; )
                    if (checked[$.getUid(elem)] ^ flag_not)
                        result[ri++] = elem;
                return result;
            }
        },
        lang: {//标准 CSS2链接伪类
            exec: function (flags, elems, arg) {
                var result = [], reg = new RegExp("^" + arg, "i"), flag_not = flags.not;
                for (var i = 0, ri = 0, elem; elem = elems[i++]; ){
                    var tmp = elem;
                    while (tmp && !tmp.getAttribute("lang"))
                        tmp = tmp.parentNode;
                    tmp = !!(tmp && reg.test(tmp.getAttribute("lang")));
                    if (tmp ^ flag_not)
                        result[ri++] = elem;
                }
                return result;
            }
        },
        active: function(el){
            return el === el.ownerDocument.activeElement;
        },
        focus:function(el){
            return (el.type|| el.href) && el === el.ownerDocument.activeElement;
        },
        indeterminate : function(node){//标准
            return node.indeterminate === true && node.type === "checkbox"
        },
        //http://www.w3.org/TR/css3-selectors/#UIstates
        enabled:  filterProp("disabled", false),//标准
        disabled: filterProp("disabled", true),//标准
        checked:  filterProp("checked", true),//标准
        contains: {
            exec: function (flags, elems, arg) {
                var res = [], elem = elems[0], fn = flags.xml ? $.getText: getHTMLText,
                flag_not = flags.not;
                for (var i = 0, ri = 0, elem; elem = elems[i++]; ){
                    if ((!!~  fn( [elem] ).indexOf(arg)) ^ flag_not)
                        res[ri++] = elem;
                }
                return res;
            }
        },
        //自定义伪类
        selected : function(el){
            el.parentNode && el.parentNode.selectedIndex;//处理safari的bug
            return el.selected === true;
        },
        header : function(el){
            return /h\d/i.test( el.nodeName );
        },
        button : function(el){
            return "button" === el.type || el.nodeName === "BUTTON";
        },
        input: function(el){
            return /input|select|textarea|button/i.test(el.nodeName);
        },
        parent : function( el ) {
            return !!el.firstChild;
        },
        has : function(el, expr){//孩子中是否拥有匹配expr的节点
            return !!$.query(expr,[el]).length;
        },
        //与位置相关的过滤器
        first: function(index){
            return index === 0;
        },
        last: function(index, num){
            return index === num;
        },
        even: function(index){
            return index % 2 === 0;
        },
        odd: function(index){
            return index % 2 === 1;
        },
        lt: function(index, num){
            return index < num;
        },
        gt: function(index, num){
            return index > num;
        },
        eq: function(index, num){
            return index ===  num;
        },
        hidden : function( el ) {
            return el.type === "hidden" || (!el.offsetWidth && !el.offsetHeight) || (el.currentStyle && el.currentStyle.display === "none") ;
        }
    }
    Icarus.pseudoAdapter.visible = function(el){
        return  !Icarus.pseudoAdapter.hidden(el);
    }

    "text,radio,checkbox,file,password,submit,image,reset".replace($.rword, function(name){
        Icarus.pseudoAdapter[name] = function(el){
            return (el.getAttribute("type") || el.type) === name;//避开HTML5新增类型导致的BUG，不直接使用el.type === name;
        }
    });
       
});

//2011.10.25重构$.unique
//2011.10.26支持对拥有name值为id的控件的表单元素的查找，添加labed语句，让元素不存在时更快跳出主循环
//2011.10.30让属性选择器支持拥有多个中括号与转义符的属性表达式，如‘input[name=brackets\\[5\\]\\[\\]]’
//2011.10.31重构属性选择器处理无操作部分，使用hasAttribute来判定用户是否显示使用此属性，并支持checked, selected, disabled等布尔属性
//2011.10.31重构关系选择器部分，让后代选择器也出现在switch分支中
//2011.11.1 重构子元素过滤伪类的两个生成函数filterPseudoHasExp filterPseudoNoExp
//2011.11.2 FIX处理 -of-type家族的BUG
//2011.11.3 添加getAttribute hasAttribute API
//2011.11.4 属性选择器对给出值或属性值为空字符串时进行快速过滤
//2011.11.5 添加getElementsByXpath 增加对XML的支持
//2011.11.6 重构getElementsByTagName 支持带命名空间的tagName
//2011.11.6 处理IE67与opera9在getElementById中的BUG
//2011.11.7 支持多上下文,对IE678的注释节点进行清除,优化querySelectorAll的使用
//2011.11.8 处理分解nth-child参数的BUG，修正IE67下getAttribute对input[type=search]的支持，重构sortOrder标准浏览器的部分
//调整swich...case中属性选择器的分支，因为reg_sequence允许出现"[  "的情况，因此会匹配不到，需要改为default
//修改属性选择器$=的判定，原先attr.indexOf(val) == attr.length - val.length，会导致"PWD".indexOf("bar]")也有true
//2011.11.9 增加getText 重构 getElementById与过滤ID部分
//2011.11.10 exec一律改为match,对parseNth的结果进行缓存



//=========================================
// 节点操作模块 by 司徒正美
//=========================================
//https://plus.google.com/photos/111819995660768943393/albums/5632848757471385857
  
$.define("node", "lang,support,class,query,data,ready",function(lang,support){
    $.log("已加载node模块");
    var global = this, DOC = global.document, rtag = /^[a-zA-Z]+$/, TAGS = "getElementsByTagName";
    var html5 ="abbr,article,aside,audio,bdi,canvas,data,datalist,details,figcaption,figure,footer," +
    "header,hgroup,mark,meter,nav,output,progress,section,summary,time,video";
    html5.replace($.rword,function(tag){//让IE678支持HTML5的新标签
        DOC.createElement(tag);
    })
    function getDoc(){
        for(var i  = 0 , el; i < arguments.length; i++){
            if(el = arguments[i]){
                if(el.nodeType){
                    return el.nodeType === 9 ? el : el.ownerDocument;
                }else if(el.setTimeout){
                    return el.document;
                }
            }
        }
        return DOC;
    }
    $.mix($,$["@class"]).implement({
        init:function(expr,context){
            // 处理空白字符串,null,undefined参数
            if ( !expr ) {
                return this;
            }
            //让$实例与元素节点一样拥有ownerDocument属性
            var doc, nodes;//用作节点搜索的起点
            if(/Array|NodeList|String/.test($.type(context))|| context && context.version){//typeof context === "string"

                return $(context).find(expr);
            }
            // 处理节点参数
            if ( expr.nodeType ) {
                this.ownerDocument  = expr.nodeType === 9 ? expr : expr.ownerDocument;
                return this.merge([expr]);
            }
            this.selector = expr + "";
            if ( expr === "body" && !context && DOC.body ) {//分支3 body
                this.ownerDocument = DOC;
                this.merge([DOC.body]);
                return this.selector = "body";
            }
            if ( typeof expr === "string" ) {
                doc = this.ownerDocument = !context ? DOC : getDoc(context, context[0]);
                var scope = context || doc;
                if ( expr.charAt(0) === "<" && expr.charAt( expr.length - 1 ) === ">" && expr.length >= 3 ) {
                    nodes = $.parseHTML(expr,doc);//先转化为文档碎片
                    nodes = nodes.childNodes;//再转化为节点数组
                } else if(rtag.test(expr) ){
                    nodes  = scope[TAGS](expr) ;
                } else{//分支7：选择器群组
                    nodes  = $.query(expr, scope);
                }
                return this.merge(nodes)
            }else {//分支7：如果是数组，节点集合或者mass对象或window对象
                this.ownerDocument = getDoc(expr[0]);
                this.merge( $.isArrayLike(expr) ? expr : [expr]);
                delete this.selector;
            }
        },
        version:'1.0',
        length:0,
        valueOf:function(){
            return Array.prototype.slice.call(this);
        },
        toString : function(){
            var i = this.length, ret = [], getType = $.type;
            while(i--){
                ret[i] = getType(this[i]);
            }
            return ret.join(", ");
        },
        labor:function(nodes){
            var neo = new $;
            neo.context = this.context;
            neo.selector = this.selector;
            neo.ownerDocument = this.ownerDocument;
            return neo.merge(nodes||[]);
        },
        slice:function(a,b){
            return this.labor($.slice(this,a,b));
        },
        get: function( num ) {
            return num == null ?
            // Return a 'clean' array
            this.valueOf() :
            // Return just the object
            ( num < 0 ? this[ this.length + num ] : this[ num ] );
        },
        eq: function( i ) {
            return i === -1 ? this.slice( i ) :this.slice( i, +i + 1 );
        },

        gt:function(i){
            return this.slice(i+1,this.length);
        },
        lt:function(i){
            return this.slice(0,i);
        },
        first: function() {
            return this.slice( 0,1 );
        },
        even: function(  ) {
            return this.labor(this.valueOf().filter(function(el,i){
                return i % 2 === 0;
            }));
        },
        odd: function(  ) {
            return this.labor(this.valueOf().filter(function(el,i){
                return i % 2 === 1;
            }));
        },
        last: function() {
            return this.slice( -1 );
        },
        each : function(callback){
            for(var i = 0, n = this.length; i < n; i++){
                callback.call(this[i], this[i], i);
            }
            return this;
        },

        map : function( callback ) {
            return this.labor(this.collect(callback));
        },
            
        collect:function(callback){
            var ret = []
            for(var i = 0, ri = 0, n = this.length; i < n; i++){
                ret[ri++] = callback.call(this[i], this[i], i);
            }
            return ret
        },

        //移除匹配元素
        remove :function(){
            return this.each(function(el){
                lang(el[TAGS]("*")).concatX(el).forEach(cleanNode);
                if ( el.parentNode ) {
                    el.parentNode.removeChild( el );
                }
            });
        },
        //清空匹配元素的内容
        empty:function(){
            return this.each(function(el){
                lang(el[TAGS]("*")).forEach(cleanNode);
                while ( el.firstChild ) {
                    el.removeChild( el.firstChild );
                }
            });
        },

        clone : function( dataAndEvents, deepDataAndEvents ) {
            dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
            deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
            return this.map( function () {
                return cloneNode( this,  dataAndEvents, deepDataAndEvents );
            });
        },

        merge: function (arr){ //把普通对象变成类数组对象，
            var ri = this.length,node;
            for(var i = 0,n = arr.length;node = arr[i],i < n ;i ++){
                if(node && (node.nodeType || node.document)){
                    this[ri++] = node;
                }
            }
            this.length = ri;
            return this;
        },
        //取得或设置节点的innerHTML属性
        html: function(value){
            if(value === void 0){
                var el = this[0]
                if(el && (el.nodeType ===1 || /xml/i.test(el.nodeName))){//处理IE的XML数据岛
                    return "innerHTML" in el ? el.innerHTML : innerHTML(el)
                }
                return null;
            }else {
                value = (value || "")+""
                if(support.innerHTML && (!rcreate.test(value) && !rnest.test(value))){
                    try {
                        for ( var i = 0, node; node = this[i++]; ) {
                            if ( node.nodeType === 1 ) {
                                lang(node[TAGS]("*")).forEach(cleanNode);
                                node.innerHTML = value;
                            }
                        }
                        return this;
                    } catch(e) {}
                }
                return this.empty().append( value );
            }
        },
        // 取得或设置节点的text或innerText或textContent属性
        text:function(value){
            var node = this[0];
            if(value === void 0){
                if(!node){
                    return "";
                }else if(node.tagName == "OPTION" || node.tagName === "SCRIPT"){
                    return node.text;
                }else{
                    return node.textContent || node.innerText ||  $.getText([ node ]);
                }
            }else{
                return this.empty().append( this.ownerDocument.createTextNode( value ));
            }
        },
        // 取得或设置节点的outerHTML
        outerHTML:function(value){
            if(typeof value === "string"){
                return this.empty().replace( value );
            }
            var el = this[0]
            if(el && el.nodeType === 1 ){
                return "outerHTML" in el? el.outerHTML :outerHTML(el)
            }
            return null;
        }
    });
    $.fn = $.prototype;
    $.fn.init.prototype = $.fn;

    //前导 前置 追加 后放 替换
    "append,prepend,before,after,replace".replace($.rword,function(method){
        $.fn[method] = function(insertion){
            return manipulate(this, method, insertion);
        }
        $.fn[method+"To"] = function(insertion){
            $(insertion,this.ownerDocument)[method](this);
            return this;
        }
    });
    var HTML = $.html;
    var matchesAPI = HTML.matchesSelector || HTML.mozMatchesSelector || HTML.webkitMatchesSelector || HTML.msMatchesSelector;
    $.extend({
        match : function(node, expr, i){
            if($.type(expr, "Function")){
                return expr.call(node,node,i);
            }
            try{
                return matchesAPI.call( node, expr );
            } catch(e) {
                var parent = node.parentNode;
                if(parent){
                    var array = $.query(expr,parent);
                    return !!(array.length && array.indexOf(node))
                }
                return false;
            }
        },
        access: function( elems,  key, value, set, get ) {
            var length = elems.length;
            //使用一个纯净的对象一下子设置多个属性
            if ( typeof key === "object" ) {
                for ( var k in key ) {
                    $.access( elems, k, key[k], set, get );
                }
                return elems;
            }
            // 设置一个属性
            if ( value !== void 0 ) {
                for ( var i = 0; i < length; i++ ) {
                    set( elems[i], key, value);
                }
                return elems;
            }
            //获取一个属性
            return length ? get( elems[0], key ) : void 0;
        },

        /**
                 * 将字符串转换为文档碎片，如果没有传入文档碎片，自行创建一个
                 * 有关innerHTML与createElement创建节点的效率可见<a href="http://andrew.hedges.name/experiments/innerhtml/">这里</a><br/>
                 * 注意，它能执行元素的内联事件，如<br/>
                 * <pre><code>$.parseHTML("<img src=1 onerror=alert(22) />")</code></pre>
                 * @param {String} html 要转换为节点的字符串
                 * @param {Document} doc 可选
                 * @return {FragmentDocument}
                 */
        parseHTML:function( html, doc){
            doc = doc || this.nodeType === 9  && this || DOC;
            html = html.replace(rxhtml, "<$1></$2>").trim();
            //尝试使用createContextualFragment获取更高的效率
            //http://www.cnblogs.com/rubylouvre/archive/2011/04/15/2016800.html
            var range = support.fastFragment
            if(range && doc === DOC && DOC.body && !rcreate.test(html) && !rnest.test(html)){
                range.selectNodeContents(DOC.body);//fix opera(9.2~11.51) bug,必须对文档进行选取
                return range.createContextualFragment(html);
            }
            if(!support.createAll){//fix IE
                html = html.replace(rcreate,"<br class='fix_create_all'/>$1");//在link style script等标签之前添加一个补丁
            }
            var tag = (rtagName.exec( html ) || ["", ""])[1].toLowerCase(),//取得其标签名
            wrap = translations[ tag ] || translations._default,
            fragment = doc.createDocumentFragment(),
            wrapper = doc.createElement("div"), firstChild;
            wrapper.innerHTML = wrap[1] + html + wrap[2];
            var scripts = wrapper[TAGS]("script");
            if(scripts.length){//使用innerHTML生成的script节点不会发出请求与执行text属性
                var script2 = doc.createElement("script"), script3;
                for(var i = 0, script; script = scripts[i++];){
                    if(!script.type || types[script.type]){//如果script节点的MIME能让其执行脚本
                        script3 = script2.cloneNode(false);//FF不能省略参数
                        for(var j = 0, attr;attr = script.attributes[j++];){
                            if(attr.specified){//复制其属性
                                script3[attr.name] = [attr.value];
                            }
                        }
                        script3.text = script.text;//必须指定,因为无法在attributes中遍历出来
                        script.parentNode.replaceChild(script3,script);//替换节点
                    }
                }
            }
            //移除我们为了符合套嵌关系而添加的标签
            for (i = wrap[0]; i--;wrapper = wrapper.lastChild){};
            //在IE6中,当我们在处理colgroup, thead, tfoot, table时会发生成一个tbody标签
            if( support.insertTbody ){
                var spear = !rtbody.test(html),//矛:html本身就不存在<tbody字样
                tbodys = wrapper[TAGS]("tbody"),
                shield = tbodys.length > 0;//盾：实际上生成的NodeList中存在tbody节点
                if(spear && shield){
                    for(var t=0, tbody; tbody = tbodys[t++];){
                        if(!tbody.childNodes.length )//如果是自动插入的里面肯定没有内容
                            tbody.parentNode.removeChild(tbody );
                    }
                }
            }
            if(!support.createAll){//移除所有补丁
                var brs =  wrapper[TAGS]("br");
                for(var b=0,br;br = brs[b++];){
                    if(br.className && br.className === "fix_create_all"){
                        br.parentNode.removeChild(br);
                    }
                }
            }
            while((firstChild = wrapper.firstChild)){ // 将wrapper上的节点转移到文档碎片上！
                fragment.appendChild(firstChild);
            }
            return  fragment
        }
    });
    //parseHTML的辅助变量
    var translations  = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        legend: [ 1, "<fieldset>", "</fieldset>" ],
        thead: [ 1, "<table>", "</table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        area: [ 1, "<map>", "</map>" ],
        _default: [ 0, "", "" ]
    };
    translations.optgroup = translations.option;
    translations.tbody = translations.tfoot = translations.colgroup = translations.caption = translations.thead;
    translations.th = translations.td;
    var
    rtbody = /<tbody[^>]*>/i,
    rtagName = /<([\w:]+)/,//取得其tagName
    rxhtml =  /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rcreate = support.createAll ? /<(?:script)/ig : /(<(?:script|link|style))/ig,
    types = $.oneObject("text/javascript","text/ecmascript","application/ecmascript","application/javascript","text/vbscript"),
    //需要处理套嵌关系的标签
    rnest = /<(?:td|th|tf|tr|col|opt|leg|cap|area)/,adjacent = "insertAdjacentHTML",
    insertApapter = {
        prepend : function(el, node){
            el.insertBefore(node,el.firstChild);
        },
        append  : function(el, node){
            el.appendChild(node);
        },
        before  : function(el, node){
            el.parentNode.insertBefore(node,el);
        },
        after   : function(el, node){
            el.parentNode.insertBefore(node,el.nextSibling);
        },
        replace : function(el, node){
            el.parentNode.replaceChild(node,el);
        },
        prepend2: function(el, html){
            el[adjacent]( "afterBegin", html);
        },
        append2 : function(el, html){
            el[adjacent]( "beforeEnd", html);
        },
        before2 : function(el,html){
            el[adjacent]( "beforeBegin",html);
        },
        after2  : function(el, html){
            el[adjacent]( "afterEnd", html);
        }
    };

    var insertAdjacentNode = function(nodes,callback,stuff){
        for(var i = 0, node; node = nodes[i];i++){
            callback(node, !!i ? stuff : cloneNode(stuff,true,true) );
        }
    }
    var insertAdjacentHTML = function(nodes,slowInsert,fragment,fast,fastInsert,html){
        for(var i = 0, node; node = nodes[i++];){
            if(fast && node[adjacent]){//确保是支持insertAdjacentHTML的HTML元素节点
                fastInsert(node,html);
            }else{
                slowInsert(node,fragment.cloneNode(true));
            }
        }
    }
    var insertAdjacentFragment = function(nodes,callback,fakearray){
        var fragment = nodes.ownerDocument.createDocumentFragment();
        for(var i = 0, node; node = nodes[i++];){
            callback(node, makeFragment(fakearray,fragment,i > 1));
        }
    }
    var makeFragment = function(nodes,fragment,bool){
        //只有非NodeList的情况下我们才为i递增;
        var ret = fragment.cloneNode(false), go= !nodes.item
        for(var i = 0,node;node = nodes[i]; go && i++){
            ret.appendChild(bool && cloneNode(node,true,true) || node);
        }
        return ret;
    }
    /**
             * 实现insertAdjacentHTML的增强版
             * @param {mass}  nodes mass实例
             * @param {String} type 方法名
             * @param {Any}  stuff 插入内容或替换内容,可以为HTML字符串片断，元素节点，文本节点，文档碎片或mass对象
             * @return {mass} 还是刚才的mass实例
             */
    function manipulate(nodes, type, stuff){
        if(stuff.nodeType ){
            //如果是传入元素节点或文本节点或文档碎片
            insertAdjacentNode(nodes,insertApapter[type],stuff) ;
        }else if(typeof stuff === "string"){
            //如果传入的是字符串片断
            var fragment = $.parseHTML(stuff, nodes.ownerDocument),
            //如果方法名不是replace并且完美支持insertAdjacentHTML并且不存在套嵌关系的标签
            fast = (type !== "replace") && support[adjacent] &&  !rnest.test(stuff);
            insertAdjacentHTML(nodes,insertApapter[type],fragment, fast, insertApapter[type+"2"],stuff ) ;
        }else if( stuff.length) {
            //如果传入的是HTMLCollection nodeList mass实例，将转换为文档碎片
            insertAdjacentFragment(nodes,insertApapter[type],stuff) ;
        }
        return nodes;
    }
    $.implement({
        data:function(key,value){
            if ( typeof key === "string" ) {
                if(value === void 0){
                    return $.data(this[0], key);
                }else{//读方法，取第一个匹配元素的相关属性
                    return this.each(function(el){
                        $.data(el, key, value);//写方法，为所有匹配元素缓存相关属性
                    });
                }
            } else if ( $.isPlainObject(key) ) {
                return  this.each(function(el){
                    var d = $.data(el);
                    d && $.mix(d, key);//写方法，为所有匹配元素缓存相关属性
                });
            }
            return this;
        },
        removeData: function( key ) {
            return this.each(function() {
                $.removeData( this, key );
            });
        }
    });
    //======================================================================
    //复制与移除节点时的一些辅助函数
    //======================================================================
    function cleanNode(target){
        target.uniqueNumber && $.removeData(target);
        target.clearAttributes && target.clearAttributes();
    }
    function shimCloneNode( outerHTML) {
        var div = DOC.createElement( "div" );
        div.innerHTML = outerHTML;
        return div.firstChild;
    }
    var unknownTag = "<?XML:NAMESPACE"
    function cloneNode( node, dataAndEvents, deepDataAndEvents ) {
        var outerHTML = node.outerHTML;
        var neo = outerHTML && (outerHTML.indexOf(unknownTag) === 0) ?
            shimCloneNode( outerHTML ): node.cloneNode(true), src, neos, i;
        //   处理IE6-8下复制事件时一系列错误
        if(node.nodeType === 1){
            if($.support.cloneAll ){
                fixNode( neo, node );
                src = node[TAGS]("*");
                neos = neo[TAGS]("*");
                for ( i = 0; src[i]; i++ ) {
                    fixNode( neos[i] ,src[i] );
                }
            }
            // 复制自定义属性，事件也被当作一种特殊的能活动的数据
            if ( dataAndEvents ) {
                $.mergeData( neo, node );
                if ( deepDataAndEvents ) {
                    src =  node[TAGS]("*");
                    neos = neo[TAGS]("*");
                    for ( i = 0; src[i]; i++ ) {
                        $.mergeData( neos[i] ,src[i] );
                    }
                }
            }
            src = neos = null;
        }
        return neo;
    }
    //修正IE下对数据克隆时出现的一系列问题
    function fixNode(clone, src) {
        if(src.nodeType == 1){
            // 只处理元素节点
            var nodeName = clone.nodeName.toLowerCase();
            //clearAttributes方法可以清除元素的所有属性值，如style样式，或者class属性，与attachEvent绑定上去的事件
            clone.clearAttributes();
            //复制原对象的属性到克隆体中,但不包含原来的事件
            clone.mergeAttributes(src);
            //IE6-8无法复制其内部的元素
            if ( nodeName === "object" ) {
                clone.outerHTML = src.outerHTML;
            } else if ( nodeName === "input" && (src.type === "checkbox" || src.type == "radio") ) {
                //IE6-8无法复制chechbox的值，在IE6-7中也defaultChecked属性也遗漏了
                if ( src.checked ) {
                    clone.defaultChecked = clone.checked = src.checked;
                }
                // 除Chrome外，所有浏览器都会给没有value的checkbox一个默认的value值”on”。
                if ( clone.value !== src.value ) {
                    clone.value = src.value;
                }
            // IE6-8 无法保持选中状态
            } else if ( nodeName === "option" ) {
                clone.selected = src.defaultSelected;
            // IE6-8 无法保持默认值
            } else if ( nodeName === "input" || nodeName === "textarea" ) {
                clone.defaultValue = src.defaultValue;
            }
        }
    }
    function outerHTML(el){
        switch(el.nodeType+""){
            case "1":
            case "9":
                return "xml" in el ?  el.xml: new XMLSerializer().serializeToString(el);
            case "3":
            case "4":
                return el.nodeValue;
            case "8":
                return "<!--"+el.nodeValue+"-->"
        }
    }
    function innerHTML(el){
        var array = [];
        for(var i=0,c;c=el.childNodes[i++];){
            array.push(outerHTML(c))
        }
        return array.join("");
    }
        
    $.implement({
        //取得当前匹配节点的所有匹配expr的后代，组成新mass实例返回。
        find: function(expr){
            return this.labor($.query(expr,this));
        },
        //取得当前匹配节点的所有匹配expr的节点，组成新mass实例返回。
        filter:function(expr){
            return this.labor(filterhElement(this.valueOf(), expr, this.ownerDocument, false));
        },
        //取得当前匹配节点的所有不匹配expr的节点，组成新mass实例返回。
        not: function(expr){
            return this.labor(filterhElement(this.valueOf(), expr,  this.ownerDocument,   true));
        },
        //判定当前匹配节点是否匹配给定选择器，DOM元素，或者mass对象
        is:function(expr){
            var nodes = $.query(expr,this.ownerDocument), obj = {}, uid
            for(var i =0 , node; node = nodes[i++];){
                uid = $.getUid(node);
                obj[uid] = 1;
            }
            return $.slice(this).some(function(el){
                return  obj[$.getUid(el)];
            });
        },
        //取得匹配节点中那些后代中能匹配给定CSS表达式的节点，组成新mass实例返回。
        has: function( target ) {
            var targets = $( target,this.ownerDocument );
            return this.filter(function() {
                for ( var i = 0, l = targets.length; i < l; i++ ) {
                    if ( $.contains( this, targets[i] ) ) {//a包含b
                        return true;
                    }
                }
            });
        },
        closest: function( expr, context ) {
            var  nodes = $( expr, context || this.ownerDocument ).valueOf();
            //遍历原mass对象的节点
            for (var i = 0, ret = [], cur; cur = this[i++];) {
                while ( cur ) {
                    if ( ~nodes.indexOf(cur)  ) {
                        ret.push( cur );
                        break;
                    } else { // 否则把当前节点变为其父节点
                        cur = cur.parentNode;
                        if ( !cur || !cur.ownerDocument || cur === context || cur.nodeType === 11 ) {
                            break;
                        }
                    }
                }
            }
            //如果大于1,进行唯一化操作
            ret = ret.length > 1 ? $.unique( ret ) : ret;
            //将节点集合重新包装成一个新jQuery对象返回
            return this.labor(ret);
        },
        index:function(el){ 
            var first = this[0]
            if ( !el ) {//如果没有参数，返回第一元素位于其兄弟的位置
                return ( first && first.parentNode ) ? this.prevAll().length : -1;
            }
            // 返回第一个元素在新实例中的位置
            if ( typeof el === "string" ) {
                return $(el).index(first)
            }
            // 返回传入元素（如果是mass实例则取其第一个元素）位于原实例的位置
            return   this.valueOf().indexOf(el.version ? el[0] : el)
        }

    });

    function filterhElement( nodes, expr,doc, not ) {
        var ret = [];
        not = !!not;
        if(typeof expr === "string"){
            var fit = $.query(expr, doc);
            nodes.forEach(function( el ) {
                if(el.nodeType === 1){
                    if((fit.indexOf(el) !== -1) ^ not){
                        ret.push(el)
                    }
                }
            });
        }else if($.type(expr, "Function")){
            return nodes.filter(function(el, i ){
                return !!expr.call( el, el, i ) ^ not;
            });
        }else if(expr.nodeType){
            return nodes.filter(function( el, i ) {
                return (el === expr) ^ not;
            });
        }
        return ret;
    }

    var uniqOne = $.oneObject("children","contents","next","prev");

    function travel( el, prop, expr ) {
        var result = [],ri = 0;
        while((el = el[prop])){
            if( el && el.nodeType === 1){
                result[ri++] = el;
                if(expr === true){
                    break;
                }else if(typeof expr === "string" && $( el ).is( expr )){
                    result.pop();
                    break;
                }
            }
        }
        return result
    };

    lang({
        parent:function(el){
            var parent = el.parentNode;
            return parent && parent.nodeType !== 11 ? parent : [];
        },
        parents:function(el){
            return travel(el, "parentNode").reverse();
        },
        parentsUntil:function(el, expr){
            return travel(el, "parentNode", expr).reverse();
        },
        next :function(el){
            return travel(el, "nextSibling", true)
        },
        nextAll :function(el){
            return travel(el, "nextSibling");
        },
        nextUntil:function(el, expr){
            return travel(el, "nextSibling", expr);
        },
        prev :function(el){
            return travel(el, "previousSibling", true);
        },
        prevAll :function(el){
            return travel(el, "previousSibling" ).reverse();
        },
        prevUntil :function(el, expr){
            return travel(el, "previousSibling", expr).reverse();
        },
        children:function(el){
            return  el.children ? $.slice(el.children) :
            lang(el.childNodes).filter(function(ee){
                return ee.nodeType === 1
            });
        },
        siblings:function(el){
            return travel(el,"previousSibling").reverse().concat(travel(el,"nextSibling"));
        },
        contents:function(el){
            return el.tagName === "IFRAME" ?
            el.contentDocument || el.contentWindow.document :
            $.slice( el.childNodes );
        }
    }).forEach(function(method,name){
        $.fn[name] = function(selector){
            var nodes = [];
            $.slice(this).forEach(function(el){
                nodes = nodes.concat(method(el,selector));
            });
            if(/Until/.test(name)){
                selector = null
            }
            nodes = this.length > 1 && !uniqOne[ name ] ? $.unique( nodes ) : nodes;
            var neo = this.labor(nodes);
            return selector ? neo.filter(selector) :neo;
        };
    });
});

/*
2011.7.11 dom["class"]改为dom["@class"]
2011.7.26 对init与parseHTML进行重构
2011.9.22 去掉isInDomTree 重构cloneNode,manipulate,parseHTML
2011.10.7 移除isFormElement
2011.10.9 将遍历模块合并到节点模块
2011.10.12 重构index closest
2011.10.20 修复rid的BUG
2011.10.21 添加even odd这两个切片方法 重构html方法
2011.10.23 增加rcheckEls成员,它是一个成员
2011.10.27 修正init方法中doc的指向错误  
由 doc = this.ownerDocument = expr.ownerDocument || expr.nodeType == 9 && expr || DOC 改为
doc = this.ownerDocument =  scope.ownerDocument || scope ;
2011.10.29 优化$.parseHTML 在IE6789下去掉所有为修正createAll特性而添加的补丁元素
（原来是添加一个文本节点\u200b，而现在是<br class="fix_create_all"/>）
/http://d.hatena.ne.jp/edvakf/20100205/1265338487
2011.11.5 添加get方法 init的context参数可以是类数组对象
2011.11.6 outerHTML支持对文档对象的处理，html可以取得XML数据岛的innerHTML,修正init中scope与ownerDocument的取得
2011.11.7 重构find， 支持不插入文档的节点集合查找
 *
 */
/*
 * 样式操作模块的补丁模块
 */
$.define("css_fix", function(){
    $.log("已加载css_fix模块");
    if(!$.html.currentStyle)
        return
    var adapter = $.cssAdapter = {};
    //=========================　处理　opacity　=========================
    var  ropacity = /opacity=([^)]*)/i,  ralpha = /alpha\([^)]*\)/i,
    rnumpx = /^-?\d+(?:px)?$/i, rnum = /^-?\d/;
    adapter["opacity:get"] = function(node,op){
        //这是最快的获取IE透明值的方式，不需要动用正则了！
        if(node.filters.alpha){
            op = node.filters.alpha.opacity;
        }else if(node.filters["DXImageTransform.Microsoft.Alpha"]){
            op = node.filters["DXImageTransform.Microsoft.Alpha"].opacity
        }else{
            op = (node.currentStyle.filter ||"opacity=100").match(ropacity)[1];
        }
        return (op  ? op /100 :op)+"";//如果是零就不用除100了
    }
    adapter["opacity:set"] = function(node, name, value){
        var currentStyle = node.currentStyle, style = node.style;
        if(!currentStyle.hasLayout)
            style.zoom = 1;//让元素获得hasLayout
        value = (value > 0.999) ? 1: (value < 0.001) ? 0 : value;
        if(node.filters.alpha){
            //必须已经定义过透明滤镜才能使用以下便捷方式
            node.filters.alpha.opacity = value * 100;
        }else{
            style.filter = "alpha(opacity="+((value * 100) | 0)+")";
        }
        //IE7的透明滤镜当其值为100时会让文本模糊不清
        if(value === 1){
            style.filter = currentStyle.filter.replace(ralpha,'');
        }
    // style.visibility = value ? "visible" : "hidden";
    }
    var ie8 = !!this.XDomainRequest,
    border = {
        thin:   ie8 ? '1px' : '2px',
        medium: ie8 ? '3px' : '4px',
        thick: ie8 ? '5px' : '6px'
    };

    adapter[ "_default:get" ] = function(node, name){
        var ret = node.currentStyle && node.currentStyle[name];
        if ((!rnumpx.test(ret) && rnum.test(ret))) {
            var style = node.style,
            left = style.left,
            rsLeft = node.runtimeStyle && node.runtimeStyle.left ;
            if (rsLeft) {
                node.runtimeStyle.left = node.currentStyle.left;
            }
            style.left = name === 'fontSize' ? '1em' : (ret || 0);
            ret = style.pixelLeft + "px";
            style.left = left;
            if (rsLeft) {
                node.runtimeStyle.left = rsLeft;
            }
        }
        if(ret == "medium"){
            name = name.replace("Width","Style");
            //border width 默认值为medium，即使其为0"
            if(arguments.callee(node,name) == "none"){
                ret = "0px";
            }
        }
        if(/margin|padding|border/.test(name) && ret === "auto"){
            ret = "0px";
        }
        return ret === "" ? "auto" : border[ret] ||  ret;
    }
    $.transform = function(node,  param){
        var meta = $._data(node,"transform"), ident  = "DXImageTransform.Microsoft.Matrix",arr = [1,0,0,1,0,0], m
        if(!meta){
            //http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx
            m = node.filters ? node.filters[ident] : 0;
            arr = m ? [m.M11, m.M12, m.M21, m.M22, m.Dx, m.Dy] : arr;
            meta = $._toMatrixObject(arr);
            meta.rotate = - meta.rotate;
            //保存到缓存系统，省得每次都计算
            $._data(node,"transform",meta);
        }
        if(arguments.length === 1){
            return meta;//getter
        }
        //setter
        meta = $._data(node,"transform",{
            scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
            scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
            rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
            translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
            translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
        });

        //注意：IE滤镜和其他浏览器定义的角度方向相反
        var r = -$.all2rad(meta.rotate),
        cos  = Math.cos(r ), sin = Math.sin(r),
        mtx   = [ 
        cos * meta.scaleX,  sin * meta.scaleX, 0,
        -sin * meta.scaleY, cos * meta.scaleY, 0,
        meta.translateX,    meta.translateY,   1],
        cxcy= $._data(node,"cxcy");
        if (!cxcy) {
            var rect = node.getBoundingClientRect(),
            cx = (rect.right  - rect.left) / 2, // center x
            cy = (rect.bottom - rect.top)  / 2; // center y
            if(node.currentStyle.hasLayout){
                node.style.zoom = 1;
            }
            //IE9下请千万别设置  <meta content="IE=8" http-equiv="X-UA-Compatible"/>
            //http://www.cnblogs.com/Libra/archive/2009/03/24/1420731.html
            node.style.filter += " progid:" + ident + "(sizingMethod='auto expand')";
            cxcy =  $._data(node,"cxcy", {
                cx: cx, 
                cy: cy
            });
        }
        m = node.filters[ident];
        m.M11 = mtx[0];
        m.M12 = mtx[1];
        m.M21 = mtx[3];
        m.M22 = mtx[4];
        m.Dx  = mtx[6];
        m.Dy  = mtx[7];
        // recalc center
        rect = node.getBoundingClientRect();
        cx = (rect.right  - rect.left) / 2;
        cy = (rect.bottom - rect.top)  / 2;
        node.style.marginLeft = cxcy.cx - cx + "px";
        node.style.marginTop  = cxcy.cy - cy + "px";
    }
});
//2011.10.21 去掉opacity:setter 的style.visibility处理
//2011.11.21 将IE的矩阵滤镜的相应代码转移到这里

//=========================================
// 样式操作模块 by 司徒正美
//=========================================
var node$css_fix = this.getComputedStyle ?  "node" : "node,css_fix" ;
$.define("css", node$css_fix, function(){
    var global = this, DOC = global.document,
    cssFloat = $.support.cssFloat ? 'cssFloat': 'styleFloat',
    rmatrix = /\(([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/,
    rad2deg = 180/Math.PI, deg2rad = Math.PI/180,
    prefixes = ['', '-ms-','-moz-', '-webkit-', '-khtml-', '-o-','ms-'],
    adapter = $.cssAdapter = $.cssAdapter || {};
    function cssCache(name){
        return cssCache[name] || (cssCache[name] = name == 'float' ? cssFloat : $.String.camelize.call(name));
    }
    var shortcuts = {
        c:          "color",
        h:          "height",
        o:          "opacity",
        r:          "rotate",
        w:          "width",
        x:          "left",
        y:          "top",
        fs:         "fontSize",
        st:         "scrollTop",
        sl:         "scrollLeft",
        sx:         "scaleX",
        sy:         "scaleY",
        tx:         "translateX",
        ty:         "translateY",
        bgc:        "backgroundColor"
    }
    //http://www.w3.org/TR/2009/WD-css3-2d-transforms-20091201/#introduction
    $.mix($, {
        cssCache:cssCache,
        //http://www.cnblogs.com/rubylouvre/archive/2011/03/28/1998223.html
        cssName : function(name, target, test){
            if(cssCache[name])
                return name;
            target = target || $.html.style;
            for (var i=0, n = prefixes.length; i < n; i++) {
                test = $.String.camelize.call(prefixes[i] + name)
                if(test in target){
                    return (cssCache[name] = test);
                }
            }
            return null;
        },
        scrollbarWidth:function (){
            if($.scrollbarWidth.ret){
                return $.scrollbarWidth.ret
            }
            var test =  $('<div style="width: 100px;height: 100px;overflow: scroll;position: absolute;top: -9999px;"/>').appendTo("body")
            var ret = test[0].offsetWidth - test[0].clientWidth;              
            test.remove();
            return $.scrollbarWidth.ret = ret
        },
        cssNumber : $.oneObject("fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate"),
        css: function(nodes, name, value){
            var props = {} , fn;
            nodes = nodes.nodeType == 1 ? [nodes] : nodes;
            if(name && typeof name === "object"){
                props = name;
            }else if(value === void 0){
                return (adapter[name+":get"] || adapter["_default:get"])( nodes[0], cssCache(name) );
            }else {
                props[name] = value;
            }
            for(name in props){
                value = props[name];
                name = shortcuts[name];
                name = cssCache(name);
                fn = adapter[name+":set"] || adapter["_default:set"];
                if ( isFinite( value ) && !$.cssNumber[ name ] ) {
                    value += "px";
                }
                for(var i = 0, node; node = nodes[i++];){
                    if(node && node.nodeType === 1){
                        fn(node, name, value );
                    }
                }
            }
            return nodes;
        },
        //CSS3新增的三种角度单位分别为deg(角度)， rad(弧度)， grad(梯度或称百分度 )。 
        all2deg : function (value) {
            value += "";
            return ~value.indexOf("deg") ?  parseInt(value,10): 
            ~value.indexOf("grad") ?  parseInt(value,10) * 2/1.8:
            ~value.indexOf("rad") ?   parseInt(value,10) * rad2deg:
            parseFloat(value);
        },
        all2rad :function (value){
            return $.all2deg(value) * deg2rad;
        },
        //将 skewx(10deg) translatex(150px)这样的字符串转换成3*2的距阵
        _toMatrixArray: function(/*String*/ transform ) {
            transform = transform.split(")");
            var
            i = transform.length -1
            , split, prop, val
            , A = 1
            , B = 0
            , C = 0
            , D = 1
            , A_, B_, C_, D_
            , tmp1, tmp2
            , X = 0
            , Y = 0 ;
            while ( i-- ) {
                split = transform[i].split("(");
                prop = split[0].trim();
                val = split[1];
                A_ = B_ = C_ = D_ = 0;
                switch (prop) {
                    case "translateX":
                        X += parseInt(val, 10);
                        continue;

                    case "translateY":
                        Y += parseInt(val, 10);
                        continue;

                    case "translate":
                        val = val.split(",");
                        X += parseInt(val[0], 10);
                        Y += parseInt(val[1] || 0, 10);
                        continue;

                    case "rotate":
                        val = $.all2rad(val) ;
                        A_ = Math.cos(val);
                        B_ = Math.sin(val);
                        C_ = -Math.sin(val);
                        D_ = Math.cos(val);
                        break;

                    case "scaleX":
                        A_ = val;
                        D_ = 1;
                        break;

                    case "scaleY":
                        A_ = 1;
                        D_ = val;
                        break;

                    case "scale":
                        val = val.split(",");
                        A_ = val[0];
                        D_ = val.length>1 ? val[1] : val[0];
                        break;

                    case "skewX":
                        A_ = D_ = 1;
                        C_ = Math.tan( $.all2rad(val));
                        break;

                    case "skewY":
                        A_ = D_ = 1;
                        B_ = Math.tan( $.all2rad(val));
                        break;

                    case "skew":
                        A_ = D_ = 1;
                        val = val.split(",");
                        C_ = Math.tan( $.all2rad(val[0]));
                        B_ = Math.tan( $.all2rad(val[1] || 0));
                        break;

                    case "matrix":
                        val = val.split(",");
                        A_ = +val[0];
                        B_ = +val[1];
                        C_ = +val[2];
                        D_ = +val[3];
                        X += parseInt(val[4], 10);
                        Y += parseInt(val[5], 10);
                }
                // Matrix product
                tmp1 = A * A_ + B * C_;
                B    = A * B_ + B * D_;
                tmp2 = C * A_ + D * C_;
                D    = C * B_ + D * D_;
                A = tmp1;
                C = tmp2;
            }
            return [A,B,C,D,X,Y];
        },
        // 将矩阵转换为一个含有 rotate, scale and skew 属性的对象
        // http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
        _toMatrixObject: function(/*Array*/matrix) {
            var scaleX
            , scaleY
            , XYshear 
            , A = matrix[0]
            , B = matrix[1]
            , C = matrix[2]
            , D = matrix[3] ;
            // matrix is singular and cannot be interpolated
            if ( A * D - B * C ) {
                // step (3)
                scaleX = Math.sqrt( A * A + B * B );
                A /= scaleX;
                B /= scaleX;
                // step (4)
                XYshear  = A * C + B * D;
                C -= A * XYshear ;
                D -= B * XYshear ;
                // step (5)
                scaleY = Math.sqrt( C * C + D * D );
                C /= scaleY;
                D /= scaleY;
                XYshear /= scaleY;
                // step (6)
                // A*D - B*C should now be 1 or -1
                if ( A * D < B * C ) {
                    A = -A;
                    B = -B;
                    C = -C;
                    B = -B;
                    D = -D;
                    XYshear = -XYshear;
                    scaleX = -scaleX;
                }

            } else {
                B = A = scaleX = scaleY = XYshear = 0;
            }
            return {
                translateX: +matrix[4],
                translateY: +matrix[5],
                rotate: Math.atan2(B, A),
                scaleX: scaleX,
                scaleY: scaleY,
                skew: [XYshear, 0]
            }
        }
      
    });
    //支持情况 ff3.5 chrome ie9 pp6 opara10.5 safari3.1
    var cssTransfrom = $.cssName("transform");
    if(cssTransfrom){
        // gerrer(node) 返回一个包含 scaleX,scaleY, rotate, translateX,translateY, translateZ的对象
        // setter(node, { rotate: 30 })返回自身
        $.transform = function(node,  param){
            var meta = $._data(node,"transform"),arr = [1,0,0,1,0,0], m
            if(!meta){
                //将CSS3 transform属性中的数值分解出来
                var style = $.css([node],cssTransfrom);
                if(~style.indexOf("matrix")){
                    m = rmatrix.exec(style);
                    arr = [m[1], m[2], m[3], m[4], m[5], m[6]];
                }else if(style.length > 6){
                    arr = $._toMatrixArray(style)
                }
                meta = $._toMatrixObject(arr);
                //保存到缓存系统，省得每次都计算
                $._data(node,"transform",meta);
            }

            if(arguments.length === 1){
                return meta;//getter
            }
            //setter
            meta = $._data(node,"transform",{
                scaleX:     param.scaleX     === void 0 ? meta.scaleX     : param.scaleX,
                scaleY:     param.scaleY     === void 0 ? meta.scaleY     : param.scaleY,
                rotate:     param.rotate     === void 0 ? meta.rotate     : param.rotate,
                translateX: param.translateX === void 0 ? meta.translateX : parseInt(param.translateX)|0,
                translateY: param.translateY === void 0 ? meta.translateY : parseInt(param.translateY)|0
            });
            node.style[cssTransfrom]  =
            "scale(" + meta.scaleX + "," + meta.scaleY + ") " +
            "rotate(" + $.all2deg(meta.rotate)  + "deg) " +
            "translate(" + meta.translateX  + "px," + meta.translateY + "px)";
        }
    }
    //IE9 FF等支持getComputedStyle
    $.mix(adapter, {
        "_default:get" :function( node, name){
            return node.style[ name ];
        },
        "_default:set" :function( node, name, value){
            node.style[ name ] = value;
        },
        "rotate:get":function( node ){
            return $.all2deg(($.transform(node) || {}).rotate) ;
        },
        "rotate:set":function( node, name, value){
            $.transform(node, {
                rotate:value
            });
        }
    },false);

    if ( DOC.defaultView && DOC.defaultView.getComputedStyle ) {
        adapter[ "_default:get" ] = function( node, name ) {
            var ret, defaultView, computedStyle;
            if ( !(defaultView = node.ownerDocument.defaultView) ) {
                return undefined;
            }
            var underscored = name == "cssFloat" ? "float" :
            name.replace( /([A-Z]|^ms)/g, "-$1" ).toLowerCase(),
            rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,
            rmargin = /^margin/, style = node.style ;

            if ( (computedStyle = defaultView.getComputedStyle( node, null )) ) {
                ret = computedStyle.getPropertyValue( underscored );
                if ( ret === "" && !$.contains( node.ownerDocument, node ) ) {
                    ret = style[name];//如果还没有加入DOM树，则取内联样式
                }
            }
            // A tribute to the "awesome hack by Dean Edwards"
            // WebKit uses "computed value (percentage if specified)" instead of "used value" for margins
            // which is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
            if ( !$.support.pixelMargin && computedStyle && rmargin.test( name ) && rnumnonpx.test( ret ) ) {
                var width = style.width;
                style.width = ret;
                ret = computedStyle.width;
                style.width = width;
            }

            return ret === "" ? "auto" : ret;
        };
    }

    //=========================　处理　width height　=========================
    var getter = $.cssAdapter["_default:get"], RECT = "getBoundingClientRect",
    cssPair = {
        Width:['Left', 'Right'],
        Height:['Top', 'Bottom']
    }
    function getWH( node, name,extra  ) {//注意 name是首字母大写
        var none = 0, getter = $.cssAdapter["_default:get"], which = cssPair[name];
        if(getter(node,"display") === "none" ){
            none ++;
            node.style.display = "block";
        }
        var rect = node[RECT] && node[RECT]() || node.ownerDocument.getBoxObjectFor(node),
        val = node["offset" + name] ||  rect[which[1].toLowerCase()] - rect[which[0].toLowerCase()];
        extra = extra || 0;
        which.forEach(function(direction){
            if(extra < 1)
                val -= parseFloat(getter(node, 'padding' + direction)) || 0;
            if(extra < 2)
                val -= parseFloat(getter(node, 'border' + direction + 'Width')) || 0;
            if(extra === 3){
                val += parseFloat(getter(node, 'margin' + direction )) || 0;
            }
        });
        none && (node.style.display = "none");
        return val;
    }
    "width,height".replace($.rword,function(name){
        $.cssAdapter[ name+":get" ] = function(node, name){
            return getWH(node, name == "width" ? "Width" : "Height") + "px";
        }
    });
    // clientWidth         = node.style.width + padding
    // https://developer.mozilla.org/en/DOM/element.clientWidth
    // offsetWidth           = node.style.width + padding + border
    // https://developer.mozilla.org/en/DOM/element.offsetWidth
    // getBoundingClientRect = node.style.width + padding + border
    // https://developer.mozilla.org/en/DOM/element.getBoundingClientRect
    //   [CSS2.1 盒子模型] http://www.w3.org/TR/CSS2/box.html
    //       B-------border----------+ -> border
    //       |                       |
    //       |  P----padding----+    | -> padding
    //       |  |               |    |
    //       |  |  C-content-+  |    | -> content
    //       |  |  |         |  |    |
    //       |  |  |         |  |    |
    //       |  |  +---------+  |    |
    //       |  |               |    |
    //       |  +---------------+    |
    //       |                       |
    //       +-----------------------+
    //       B = event.offsetX/Y in WebKit
    //           event.layerX/Y  in Gecko
    //       P = event.offsetX/Y in IE6 ~ IE8
    //       C = event.offsetX/Y in Opera
    "Height,Width".replace($.rword, function(  name ) {
        $.fn[ name.toLowerCase() ] = function(size) {
            var target = this[0];
            if ( !target ) {
                return size == null ? null : this;
            }
            if ( $.type(target, "Window")) {//取得浏览器工作区的大小
                var doc = target.document, prop = doc.documentElement[ "client" + name ], body = doc.body;
                return doc.compatMode === "CSS1Compat" && prop || body && body[ "client" + name ] || prop;
            } else if ( target.nodeType === 9 ) {//取得页面的大小（包括不可见部分）
                return Math.max(
                    target.documentElement["client" + name],
                    target.body["scroll" + name], target.documentElement["scroll" + name],
                    target.body["offset" + name], target.documentElement["offset" + name]
                    );
            } else if ( size === void 0 ) {
                return getWH(target,name, 0) 
            } else {
                return $.css(this,name.toLowerCase(),size);
            }
        };
        $.fn[ "inner" + name ] = function() {
            var node = this[0];
            return node && node.style ? getWH(node,name, 1) : null;
        };
        // outerHeight and outerWidth
        $.fn[ "outer" + name ] = function( margin ) {
            var node = this[0], extra = margin === "margin" ? 3 : 2;
            return node && node.style ?  getWH(node,name, extra) : null;
        };
    });
        
    //=========================　处理　left top　=========================
    "Left,Top".replace($.rword, function(name){
        adapter[ name.toLowerCase() +":get"] =  function(node){
            var val = getter(node, name.toLowerCase()), offset;
            // 1. 当没有设置 style.left 时，getComputedStyle 在不同浏览器下，返回值不同
            //    比如：firefox 返回 0, webkit/ie 返回 auto
            // 2. style.left 设置为百分比时，返回值为百分比
            // 对于第一种情况，如果是 relative 元素，值为 0. 如果是 absolute 元素，值为 offsetLeft - marginLeft
            // 对于第二种情况，大部分类库都未做处理，属于“明之而不 fix”的保留 bug
            if(val === "auto"){
                val = 0;
                if(/absolute|fixed/.test(getter(node,"position"))){
                    offset = node["offset"+name ];
                    // old-ie 下，elem.offsetLeft 包含 offsetParent 的 border 宽度，需要减掉
                    if (node.uniqueID && DOC.documentMode < 9 ||global.opera) {
                        // 类似 offset ie 下的边框处理
                        // 如果 offsetParent 为 html ，需要减去默认 2 px == documentElement.clientTop
                        // 否则减去 borderTop 其实也是 clientTop
                        // http://msdn.microsoft.com/en-us/library/aa752288%28v=vs.85%29.aspx
                        // ie<9 注意有时候 elem.offsetParent 为 null ...
                        // 比如 DOM.append(DOM.create("<div class='position:absolute'></div>"),document.body)
                        offset -= node.offsetParent && node.offsetParent['client' + name] || 0;
                        
                    }
                    val = offset - (parseInt(getter(node, 'margin' + name),10) || 0) +"px";
                }
            }
            return val
        };
    });
    
    //=========================　处理　user-select　=========================
    //https://developer.mozilla.org/en/CSS/-moz-user-select
    //http://www.w3.org/TR/2000/WD-css3-userint-20000216#user-select
    //具体支持情况可见下面网址
    //http://help.dottoro.com/lcrlukea.php
    adapter[ "userSelect:set" ] = function( node, name, value ) {
        name = $.cssName(name);
        if(typeof name === "string"){
            return node.style[name] = value
        }
        var allow = /none/.test(value||"all");
        node.unselectable  = allow ? "" : "on";
        node.onselectstart = allow ? "" : function(){
            return false;
        };
    };
      
    //=======================================================
    //获取body的offset
    function getBodyOffsetNoMargin(){
        var el = DOC.body, ret = parseFloat($.css(el,"margin-top"))!== el.offsetTop;
        function getBodyOffsetNoMargin(){
            return ret;//一次之后的执行结果
        }
        return ret;//第一次执行结果
    }
       
    $.fn.offset = function(){//取得第一个元素位于页面的坐标
        var node = this[0], owner = node && node.ownerDocument, pos = {
            left:0,
            top:0
        };
        if ( !node || !owner ) {
            return pos;
        }
        if(node.tagName === "BODY"){
            pos.top = node.offsetTop;
            pos.left = body.offsetLeft;
            //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
            if(getBodyOffsetNoMargin()){
                pos.top  += parseFloat( getter(node, "marginTop") ) || 0;
                pos.left += parseFloat( getter(node, "marginLeft")) || 0;
            }
            return pos;
        }else if ($.html[RECT]) { //如果支持getBoundingClientRect
            //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
            //http://msdn.microsoft.com/en-us/library/ms536433.aspx
            var box = node[RECT](),win = getWindow(owner),
            root = owner.documentElement,body = owner.body,
            clientTop = root.clientTop || body.clientTop || 0,
            clientLeft = root.clientLeft || body.clientLeft || 0,
            scrollTop  = win.pageYOffset || $.support.boxModel && root.scrollTop  || body.scrollTop,
            scrollLeft = win.pageXOffset || $.support.boxModel && root.scrollLeft || body.scrollLeft;
            // 加上document的scroll的部分尺寸到left,top中。
            // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
            // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
            pos.top  = box.top  + scrollTop  - clientTop,
            pos.left = box.left + scrollLeft - clientLeft;
        }
        return pos;
    }

    
    var rroot = /^(?:body|html)$/i;
    $.implement({
        position: function() {
            var ret =  this.offset(), node = this[0];
            if ( node && node.nodeType ===1 ) {
                var offsetParent = this.offsetParent(),
                parentOffset = rroot.test(offsetParent[0].nodeName) ? {
                    top:0,
                    left:0
                } : offsetParent.offset();
                ret.top  -= parseFloat( getter(node, "marginTop") ) || 0;
                ret.left -= parseFloat( getter(node, "marginLeft") ) || 0;
                parentOffset.top  += parseFloat( getter(offsetParent[0], "borderTopWidth") ) || 0;
                parentOffset.left += parseFloat( getter(offsetParent[0], "borderLeftWidth") ) || 0;
                ret.top  -= parentOffset.top;
                ret.left -= parentOffset.left
            }
            return ret;
        },
        offsetParent: function() {
            return this.map(function() {
                var offsetParent = this.offsetParent || DOC.body;
                while ( offsetParent && (!rroot.test(offsetParent.nodeName) && getter(offsetParent, "position") === "static") ) {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent;
            });
        }
    });

    "Left,Top".replace($.rword,function(  name ) {
        var method = "scroll" + name;
        $.fn[ method ] = function( val ) {
            var node, win, i = name == "Top";
            if ( val === void 0 ) {
                node = this[ 0 ];
                if ( !node ) {
                    return null;
                }
                win = getWindow( node );
                // Return the scroll offset
                return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
                $.support.boxModel && win.document.documentElement[ method ] ||
                win.document.body[ method ] :
                node[ method ];
            }
            // Set the scroll offset
            return this.each(function() {
                win = getWindow( this );
                if ( win ) {
                    win.scrollTo(
                        !i ? val : $( win ).scrollLeft(),
                        i ? val : $( win ).scrollTop()
                        );
                } else {
                    this[ method ] = val;
                }
            });
        };
    });
    function getWindow( node ) {
        return $.type(node,"Window") ?   node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    } ;
  

    $.implement({
        css : function(name, value){
            return $.css(this, name, value);
        },
        rotate : function(value){
            return  $.css(this, "rotate", value) ;
        }
    });
    "margin,padding,borderWidth".replace(/([a-z]+)([^,]*)/g,function(s,a,b){
        // console.log([a,b])
        })

});

//2011.9.5
//将cssName改为隋性函数,修正msTransform Bug
//2011.9.19 添加$.fn.offset width height innerWidth innerHeight outerWidth outerHeight scrollTop scrollLeft offset position
//2011.10.10 重构position offset保持这两者行为一致，
//2011.10.14 Fix $.css BUG，如果传入一个对象，它把到getter分支了。
//2011.10.15 Fix $.css BUG  添加transform rotate API
//2011.10.20 getWH不能获取隐藏元素的BUG
//2011.10.21 修正width height的BUG
//2011.11.10 添加top,left到cssAdapter
//2011.11.21 all2deg,all2rad,_toMatrixArray,_toMatrixObject放到命名空间之下，方便调用，简化transform逻辑
﻿
$.define("attr","support,node", function(support){
   // $.log("已加载attr模块")
    var global = this, DOC = global.document, rclass = /(^|\s)(\S+)(?=\s(?:\S+\s)*\2(?:\s|$))/g,rreturn = /\r/g,
    rfocusable = /^(?:button|input|object|select|textarea)$/i,
    rclickable = /^a(?:rea)?$/i,
    rspaces = /\s+/,
    valOne = {
        "SELECT":"select",
        "OPTION":"option",
        "BUTTON":"button"
    },
    getValType = function(node){
        return "form" in node && (valOne[node.tagName] || node.type)
    }
    $.implement({
        /**
             *  为所有匹配的元素节点添加className，添加多个className要用空白隔开
             *  如$("body").addClass("aaa");$("body").addClass("aaa bbb");
             *  <a href="http://www.cnblogs.com/rubylouvre/archive/2011/01/27/1946397.html">相关链接</a>
             */
        addClass:function(value){
            if ( typeof value == "string") {
                for ( var i = 0, el; el = this[i++]; ) {
                    if ( el.nodeType === 1 ) {
                        if ( !el.className ) {
                            el.className = value;
                        } else {
                            el.className = (el.className +" "+value).replace(rclass,"")
                        }
                    }
                }
            }
            return this;
        },
        //如果第二个参数为true，则只判定第一个是否存在此类名，否则对所有元素进行操作；
        hasClass: function( value, every ) {
            var method = every === true ? "every" : "some"
            var rclass = new RegExp('(\\s|^)'+value+'(\\s|$)');//判定多个元素，正则比indexOf快点
            return $.slice(this)[method](function(el){
                return "classList" in el ? el.classList.contains(value):
                (el.className || "").match(rclass);
            });
        },
        //如果不传入类名,则去掉所有类名,允许传入多个类名
        removeClass: function( value ) {
            if ( (value && typeof value === "string") || value === undefined ) {
                var classNames = (value || "").split( rspaces );
                for ( var i = 0, node; node = this[i++]; ) {
                    if ( node.nodeType === 1 && node.className ) {
                        if ( value ) {
                            var className = (" " + node.className + " ").replace(rspaces, " ");
                            for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
                                className = className.replace(" " + classNames[c] + " ", " ");
                            }
                            node.className = className.trim();
                        } else {
                            node.className = "";
                        }
                    }
                }
            }
            return this;
        },
        //如果存在（不存在）就删除（添加）一个类。对所有匹配元素进行操作。
        toggleClass:function(value){
            var classNames = value.split(rspaces ), i, className;
            var type = typeof value
            return this.each(function(el) {
                i = 0;
                if(el.nodeType === 1){
                    var self = $(el);
                    if(type == "string" ){
                        while ( (className = classNames[ i++ ]) ) {
                            self[ self.hasClass( className ) ? "removeClass" : "addClass" ]( className );
                        }
                    } else if ( type === "undefined" || type === "boolean" ) {
                        if ( el.className ) {
                            self._data( "__className__", el.className );
                        }
                        el.className = el.className || value === false ? "" : self.data( "__className__") || "";
                    }
                }
            });
        },
        //如果匹配元素存在old类名则将其改应neo类名
        replaceClass:function(old, neo){
            for ( var i = 0, node; node = this[i++]; ) {
                if ( node.nodeType === 1 && node.className ) {
                    var arr = node.className.split(rspaces), arr2 = [];
                    for (var j = 0; j<arr.length; j++) {
                        arr2.push(arr[j] != old ? arr[j] : neo);
                    }
                    node.className = arr2.join(" ");
                }
            }
            return this;
        },
        val : function( value ) {
            var  node = this[0], adapter = $.valAdapter, fn =  $.valAdapter["option:get"];
            if ( !arguments.length ) {//读操作
                if ( node && node.nodeType == 1 ) {
                    //处理select-multiple, select-one,option,button
                    var ret =  (adapter[ getValType(node)+":get" ] || $.propAdapter[ "@xml:get" ])(node, "value" ,fn);
                    return  typeof ret === "string" ? ret.replace(rreturn, "") : ret == null ? "" : ret;
                }
                return undefined;
            }
            //强制将null/undefined转换为"", number变为字符串
            if(Array.isArray(value)){
                value = value.map(function (value) {
                    return value == null ? "" : value + "";
                });
            }else if(isFinite(value)){
                value += "";
            }else{
                value = value || "";//强制转换为数组
            }
            return this.each(function(node) {//写操作
                if ( node.nodeType == 1 ) {
                    (adapter[ getValType(node)+":set" ] || $.propAdapter[ "@xml:set" ])(node,"value",value , fn);
                }
            });
        },
        removeAttr: function( name ) {
            name = $.attrMap[ name ] || name;
            var isBool = boolOne[name];
            return this.each(function(node) {
                if(node.nodeType === 1){
                    $["@remove_attr"]( node, name, isBool );
                }
            });
        },
        removeProp: function( name ) {
            name = $.propMap[ name ] || name;
            return this.each(function() {
                // try/catch handles cases where IE balks (such as removing a property on window)
                try {
                    this[ name ] = undefined;
                    delete this[ name ];
                } catch( e ) {}
            });
        }
    });
        
    "attr,prop".replace($.rword,function(method){
        $[method] = function( node, name, value ) {
            if(node  && ($["@target"] in node )){
                var isElement = "setAttribute" in node;
          
                if ( !isElement ) {
                    method = "prop"
                }
                var notxml = !isElement || !$.isXML(node);
                //对于HTML元素节点，我们需要对一些属性名进行映射
                var orig = name.toLowerCase()
                name = notxml && $[boolOne[name] ? "propMap" : method+"Map"][ name ] || name;
                  
                var adapter = $[method+"Adapter"];
                if ( value !== void 0 ){
                    if( method === "attr" && value === null){  //为元素节点移除特性
                        return  $["@remove_"+method]( node, name );
                    }else { //设置HTML元素的属性或特性
                        return (notxml && adapter[name+":set"] || adapter["@"+ (notxml ? "html" : "xml")+":set"])( node, name, value, orig );
                    }
                } //获取属性 

                return (adapter[name+":get"] || adapter["@"+ (notxml ? "html" : "xml")+":get"])( node, name, '', orig );
            }
        };
        $.fn[method] = function( name, value ) {     
            return $.access( this, name, value, $[method], $[method]);
        }
    });
        
    $.extend({
        attrMap:{
            tabindex: "tabIndex"
        },

        propMap:{//属性映射
            "accept-charset": "acceptCharset",
            "char": "ch",
            charoff: "chOff",
            "class": "className",
            "for": "htmlFor",
            "http-equiv": "httpEquiv"
        },
        //内部函数，原则上拒绝用户的调用
        "@remove_attr": function( node, name, isBool ) {
            var propName;
            name = $.attrMap[ name ] || name;
            //如果支持removeAttribute，则使用removeAttribute
            $.attr( node, name, "" );
            node.removeAttribute( name );
            // 确保bool属性的值为bool
            if ( isBool && (propName = $.propMap[ name ] || name) in node ) {
                node[ propName ] = false;
            }
        },
        propAdapter:{
            "@xml:get":function(node,name){
                return node[ name ]
            },
            "@xml:set":function(node, name, value){
                node[ name ] = value;
            }
        },
            
        attrAdapter: {
            "@xml:get":function(node,name){
                return  node.getAttribute( name ) || undefined ;
            },
            "@xml:set":function(node, name, value){
                node.setAttribute( name, "" + value )
            },
            "tabIndex:get":function( node ) {
                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                var attributeNode = node.getAttributeNode( "tabIndex" );
                return attributeNode && attributeNode.specified ?
                parseInt( attributeNode.value, 10 )  : 
                rfocusable.test(node.nodeName) || rclickable.test(node.nodeName) && node.href  ? 0 : undefined;
            },
            "value:get": function( node, name,_,orig ) {
                if(node.nodeName ==="BUTTON"){
                    return attrAdapter["@html:get"](node,name);
                }
                return name in node ?  node.value : undefined;
            },
            "value:set": function( node, name, value ) {
                if(node.nodeName ==="BUTTON"){
                    return attrAdapter["@html:set"](node,name, value);
                }
                node.value = value
            }
        },
        valAdapter:  {
            "option:get":  function( node ) {
                var val = node.attributes.value;
                return !val || val.specified ? node.value : node.text;
            },
            "select:get": function( node ,value, valOpt) {
                var i, max, option,  index = node.selectedIndex,values = [], options = node.options,
                one = node.type === "select-one";
                // 如果什么也没选中
                if ( index < 0 ) {
                    return null;
                }
                i = one ? index : 0;
                max = one ? index + 1 : options.length;
                for ( ; i < max; i++ ) {
                    option = options[ i ];
                    //过滤所有disabled的option元素或其父亲是disabled的optgroup元素的孩子
                    if ( option.selected && (support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null) &&
                        (!option.parentNode.disabled || !$.type( option.parentNode, "OPTGROUP" )) ) {
                        value = valOpt( option );
                        if ( one ) {
                            return value;
                        }
                        //收集所有selected值组成数组返回
                        values.push( value );
                    }
                }
                // Fixes Bug #2551 -- select.val() broken in IE after form.reset()
                if ( one && !values.length && options.length ) {
                    return  valOpt(  options[ index ] );
                }
                return values;
            },
            "select:set": function( node, name, values, fn ) {
                $.slice(node.options).forEach(function(el){
                    el.selected = !!~values.indexOf( fn(el) );
                });
                if ( !values.length ) {
                    node.selectedIndex = -1;
                }
            }
        }
    });
    var attrAdapter = $.attrAdapter,propAdapter = $.propAdapter, valAdapter = $.valAdapter;//attr方法只能获得两种值 string undefined
    "get,set".replace($.rword,function(method){
        attrAdapter["@html:"+method] = attrAdapter["@xml:"+method];
        propAdapter["@html:"+method] = propAdapter["@xml:"+method];
        propAdapter["tabIndex:"+method] = attrAdapter["tabIndex:"+method];
    });
               
    //========================propAdapter 的相关修正==========================
    var propMap = $.propMap;
    var prop = "accessKey,allowTransparency,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan,contentEditable,"+
    "dateTime,defaultChecked,defaultSelected,defaultValue,frameBorder,isMap,longDesc,maxLength,marginWidth,marginHeight,"+
    "noHref,noResize,noShade,readOnly,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign";
    prop.replace($.rword, function(name){
        propMap[name.toLowerCase()] = name;
    });

    if(!DOC.createElement("form").enctype){//如果不支持enctype， 我们需要用encoding来映射
        propMap.enctype = "encoding";
    }
    propAdapter["tabIndex:get"] = attrAdapter["tabIndex:get"]
    //safari IE9 IE8 我们必须访问上一级元素时,才能获取这个值
    if ( !support.attrSelected ) {
        $.propAdapter[ "selected:get" ] = function( node ) {
            var parent = node
            for(;!parent.add; parent.selectedIndex, parent = parent.parentNode){};
            return node.selected;
        }
    }    
        
    //========================attrAdapter 的相关修正==========================
    var bools = $["@bools"]
    var boolOne = $.oneObject( support.attrProp ? bools.toLowerCase() : bools );
    bools.replace($.rword,function(method) {
        //bool属性在attr方法中只会返回与属性同名的值或undefined
        attrAdapter[method+":get"] = function(node, name){
            var attrNode, property =  node[ name ];
            return property === true || typeof property !== "boolean" && ( attrNode = node.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
            name.toLowerCase() :
            undefined;
        }
        attrAdapter[method+":set"] = function(node, name, value){
            if ( value === false ) {//value只有等于false才移除此属性，其他一切值都当作赋为true
                $["@remove_attr"]( node, name, true );
            } else {
                if ( name in node ) {
                    node[ name ] = true;
                }
                node.setAttribute( name, name.toLowerCase() );
            }
            return name;
        }
    });
    if ( !support.attrHref ) {
        //IE的getAttribute支持第二个参数，可以为 0,1,2,4
        //0 是默认；1 区分属性的大小写；2取出源代码中的原字符串值(注，IE67对动态创建的节点没效)。
        //IE 在取 href 的时候默认拿出来的是绝对路径，加参数2得到我们所需要的相对路径。
        "href,src,width,height,colSpan,rowSpan".replace($.rword,function(method ) {//
            attrAdapter[ method + ":get" ] =  function( node,name ) {
                var ret = node.getAttribute( name, 2 );
                return ret === null ? undefined : ret;
            }
        });
    }
    if ( !support.attrStyle ) {
        //IE67是没有style特性（特性的值的类型为文本），只有el.style（CSSStyleDeclaration）(bug)
        attrAdapter[ "style:get" ] = function( node ) {
            return node.style.cssText.toLowerCase() || undefined ;
        }
        attrAdapter[ "style:set" ] = function( node, name, value ) {
            return (node.style.cssText = "" + value);
        }
    }
              
    if(!support.attrProp){
        //如果我们不能通过el.getAttribute("class")取得className,必须使用el.getAttribute("className")
        //又如formElement[name] 相等于formElement.elements[name]，会返回其辖下的表单元素， 这时我们就需要用到特性节点了
        $.mix( $.attrMap , $.propMap);//使用更全面的映射包
        var fixSpecified = $.oneObject("name,id")
        valAdapter['button:get'] = attrAdapter["@html:get"] =  function( node, name,_,orig ) {//用于IE6/7
            if(orig in $.propMap){
                return node[name];
            }
            var ret = node.getAttributeNode( name );//id与name的特性节点没有specified描述符，只能通过nodeValue判定
            return ret && (fixSpecified[ name ] ? ret.nodeValue !== "" : ret.specified) ?  ret.nodeValue : undefined;
        }
        valAdapter['button:set'] = attrAdapter["@html:set"] =  function( node, name,value,orig ) {
            if(orig in $.propMap){
                return (node[name] = value);
            }
            var ret = node.getAttributeNode( name );
            if ( !ret ) {
                ret = node.ownerDocument.createAttribute( name );
                node.setAttributeNode( ret );
            }
            ret.nodeValue = value + "";
        }  
        attrAdapter["contentEditable:set"] =  function(node, name, value) {
            if ( value === "" ) {
                value = "false";
            }
            attrAdapter["@html:set"]( node, name, value );
        };
        "width,height".replace($.rword,function(attr){
            attrAdapter[attr+":set"] = function(node, name, value){
                node.setAttribute( attr, value === "" ? "auto" : value+"");
            }
        });
    }
        
    //=========================valAdapter 的相关修正==========================
    //checkbox的value默认为on，唯有Chrome 返回空字符串
    if ( !support.checkOn ) {
        "radio,checkbox".replace($.rword,function(name) {
            $.valAdapter[ name + ":get" ] = function( node ) {
                return node.getAttribute("value") === null ? "on" : node.value;
            }
        });
    }
    //处理单选框，复选框在设值后checked的值
    "radio,checkbox".replace($.rword,function(name) {
        $.valAdapter[ name + ":set" ] = function( node, name, value) {
            if ( Array.isArray( value ) ) {
                return node.checked = !!~value.indexOf(node.value ) ;
            }
        }
    });
        
});

/*
2011.8.2
将prop从attr分离出来
添加replaceClass方法
2011.8.5  重构val方法
2011.8.12 重构replaceClass方法
2011.10.11 重构attr prop方法
2011.10.21 FIX valAdapter["select:set"] BUG
2011.10.22 FIX boolaAdapter.set方法
2011.10.27 对prop attr val大重构
*/

﻿//==================================================
// 事件发送器模块
//==================================================
  
$.define("target","data", function(){
    // $.log("已加载target模块")
    var global = this, DOC = global.document, fireType = "", blank = "", rhoverHack = /(?:^|\s)hover(\.\S+)?\b/,
    rtypenamespace = /^([^\.]*)?(?:\.(.+))?$/, revent = /(^|_|:)([a-z])/g;
    function addHandler(handlers, obj){
        var check = true, fn = obj.handler;
        for(var i = 0, el;el = handlers[i++]; ){
            if(el.handler === fn){
                check = false;
                break;
            }
        }
        if(check){
            handlers.push(obj);
        }
    }
    function quickIs( elem, m ) {
        var attrs = elem.attributes || {};
        return (
            (!m[1] || elem.nodeName.toLowerCase() === m[1]) &&
            (!m[2] || (attrs.id || {}).value === m[2]) &&
            (!m[3] || m[3].test( (attrs[ "class" ] || {}).value ))
            );
    };
    var system = $.event = {
        special:{},//用于处理个别的DOM事件
        bind : function( types, handler, selector, times){
            //它将在原生事件派发器或任何能成为事件派发器的普通JS对象添加一个名叫uniqueNumber的属性,用于关联一个缓存体,
            //把需要的数据储存到里面,而现在我们就把一个叫@events的对象储放都它里面,
            //而这个@event的表将用来放置各种事件类型与对应的回调函数
            var target = this, events = $._data( target) ,emitter =  $["@target"] in target,
            num = times || selector, all, tns ,type, namespace, special, handlerObj, handlers, fn;
            if(target.nodeType === 3 || target.nodeType === 8 || !types ||  !handler  || !events) return ;
            selector = selector && selector.length ? selector : false;
            var uuid =  handler.uuid || (handler.uuid = $.uuid++);
            all = {
                handler:handler,
                uuid: uuid,
                times:num > 0 ? num : Infinity
            } //确保UUID，bag与callback的UUID一致
            all.handler.uuid = all.uuid;
            if(emitter ){ //处理DOM事件
                fn = events.handle ||  (events.handle = function( e ) {
                    return ((e || event).type !== fireType) ? system.handle.apply( fn.target, arguments ) :void 0;
                });
                fn.target = target;
                types = types.replace( rhoverHack, "mouseover$1 mouseout$1" )
            }
            events = events.events || (events.events = {});
            //对多个事件进行绑定
            types.replace($.rword,function(type){
                tns = rtypenamespace.exec( type ) || [];
                type = tns[1];//取得事件类型
                namespace = (tns[2] || blank).split( "." ).sort();//取得命名空间
                //事件冒充只用于原生事件发送器
                special = emitter && system.special[ type ] || {};
                type = (selector? special.delegateType : special.bindType ) || type;
                special = emitter && system.special[ type ] || {};
                handlerObj = $.mix({
                    type: type,
                    origType: tns[1],
                    selector: selector,
                    namespace: namespace.join(".")
                }, all);
                //创建事件队列
                handlers = events[ type ] = events[ type ] ||  [];
                //只有原生事件发送器才能进行DOM level2 多投事件绑定
                if(emitter && !handlers.length  ){
                    if (!special.setup || special.setup( target, selector, fn ) === false ) {
                        // 为此元素这种事件类型绑定一个全局的回调，用户的回调则在此回调中执行
                        $.bind(target,type,fn,!!selector)
                    }
                }
                addHandler(handlers,handlerObj);//同一事件不能绑定重复回调
            });
        },

        unbind: function( types, handler, selector ) {
            var target = this, events = $._data( target,"events");
            if(!events) return;
            var t, tns, type, namespace, origCount,emitter =  $["@target"] in target,
            j, special, handlers, handlerObj;
            types = emitter ? (types || blank).replace( rhoverHack, "mouseover$1 mouseout$1" ) : types;
            types = (types || blank).match($.rword) || [];
            for ( t = 0; t < types.length; t++ ) {
                tns = rtypenamespace.exec( types[t] ) || [];
                type = tns[1];
                namespace = tns[2];
                // 如果types只包含命名空间，则去掉所有拥有此命名空间的事件类型的回调
                if ( !type  ) {
                    namespace = namespace? "." + namespace : "";
                    for ( j in events ) {
                        system.unbind.call( target, j + namespace, handler, selector );
                    }
                    return;
                }
                //如果使用事件冒充则找到其正确事件类型
                special = system.special[ type ] || {};
                type = (selector? special.delegateType : special.bindType ) || type;
                handlers = events[ type ] || [];
                origCount = handlers.length;
                namespace = namespace ? new RegExp("(^|\\.)" + namespace.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                //  namespace =  namespace?  namespace.split( "." ).sort().join(".") : null;
                //只有指定了命名空间，回调或选择器才能进入此分支
                if ( handler || namespace || selector ) {
                    for ( j = 0; j < handlers.length; j++ ) {
                        handlerObj = handlers[ j ];
                        if ( !handler || handler.uuid === handlerObj.uuid ) {
                            // && (!event.namespace || ~obj.namespace.indexOf(event.namespace) ) ) {
                            if ( !namespace ||  namespace.test( handlerObj.namespace )  ) {
                                if ( !selector || selector === handlerObj.selector || selector === "**" && handlerObj.selector ) {
                                    handlers.splice( j--, 1 );
                                }
                            }
                        }
                    }
                } else {
                    //移除此类事件的所有回调
                    handlers.length = 0;
                }
                if (emitter && (handlers.length === 0 && origCount !== handlers.length) ) {
                    if ( !special.teardown || special.teardown( target, selector, handler ) === false ) {
                        $.unbind( target, type, $._data(target,"handle") );
                    }
                    delete events[ type ];
                }
            }
            if($.isEmptyObject(events)){
                var handle = $.removeData( target,"handle") ;
                handle.target = null;
                $.removeData( target,"events") ;
            }
        },

        fire:function(event){
            var target = this, namespace = [], type = event.type || event
            if ( ~type.indexOf( "." ) ) {
                namespace = type.split(".");
                type = namespace.shift();
                namespace.sort();
            }
            event = (typeof event == "object" && "namespace" in event)? type : new jEvent(type);
            event.target = target;
            event.namespace = namespace.join( "." );
            event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespace.join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
            var args = [event].concat($.slice(arguments,1));
            if( $["@target"] in target){
                var cur = target,  ontype = "on" + type;
                do{//模拟事件冒泡与执行内联事件
                    if($._data(cur,"events")||{}
                        [type]){
                        system.handle.apply(cur, args);
                    }
                    if (cur[ ontype ] && cur[ ontype ].call(cur) === false) {
                        event.preventDefault();
                    }
                    cur = cur.parentNode ||
                    cur.ownerDocument ||
                    cur === target.ownerDocument && global;
                } while (cur && !event.isPropagationStopped);
                if (!event.isDefaultPrevented) {//模拟默认行为 click() submit() reset() focus() blur()
                    var old;//在opera 中节点与window都有document属性
                    if (ontype && target[ type ] && ((type !== "focus" && type !== "blur") || target.offsetWidth !== 0) && !target.eval) {
                        old = target[ ontype ];
                        if (old) {   // 不用再触发内联事件
                            target[ ontype ] = null;
                        }
                        fireType = type;
                        target[ type ]();
                    }
                    fireType = blank;
                    if (old) {
                        target[ ontype ] = old;
                    }
                }

            }else{//普通对象的自定义事件
                system.handle.apply(target, args);
            }
        },
        filter:function(cur, parent, expr){
            var matcher = typeof expr === "function"? expr : expr.input ? quickIs : $.match
            for ( ; cur != parent; cur = cur.parentNode || parent ) {
                if(matcher(cur, expr))
                    return true
            }
            return false;
        },
        handle: function( e ) {
            var win = (this.ownerDocument || this.document || this).parentWindow || window,
            event = system.fix( e || win.event ),
            handlers = $._data(this,"events");
            if (  handlers ) {
                handlers = handlers[event.type]||[]
                event.currentTarget = this;
                var src = event.target,args = [event].concat($.slice(arguments,1)), result;
                //复制数组以防影响下一次的操作
                handlers = handlers.concat();
                //开始进行拆包操作
                //  $.log(event.namespace)
                for ( var i = 0, obj; obj = handlers[i++]; ) {
                    //如果是事件代理，确保元素处于enabled状态，并且满足过滤条件
                    if ( !src.disabled && !(event.button && event.type === "click")
                        && (!obj.selector  || system.filter(src, this, obj.selector))
                        && (!event.namespace || event.namespace_re.test( obj.namespace ) ) ) {
                        //取得回调函数
                        event.type = obj.origType;
                        result = obj.handler.apply( obj.selector ? src : this, args );
                        obj.times--;
                        if(obj.times === 0){
                            system.unbind.call(this,event.type,obj.handler,obj.selector);
                        }
                        if ( result !== void 0 ) {
                            event.result = result;
                            if ( result === false ) {
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                        if ( event.isImmediatePropagationStopped ) {
                            break;
                        }
                    }
                }
            }

            return event.result;
        },

        fix :function(event){
            if(!("namespace" in event)){
                var originalEvent = event
                event = new jEvent(originalEvent);
                for(var prop in originalEvent){
                    //去掉所有方法与常量
                    if(typeof originalEvent[prop] !== "function" && prop !== "type"){
                        if(/^[A-Z_]+$/.test(prop))
                            continue
                        event[prop] = originalEvent[prop]
                    }
                }
                //如果不存在target属性，为它添加一个
                if ( !event.target ) {
                    event.target = event.srcElement || DOC;
                }
                //safari的事件源对象可能为文本节点，应代入其父节点
                if ( event.target.nodeType === 3 ) {
                    event.target = event.target.parentNode;
                }
                // 处理鼠标事件
                if(/^(?:mouse|contextmenu)|click/.test(event.type)){
                    //如果不存在pageX/Y则结合clientX/Y做一双出来
                    if ( event.pageX == null && event.clientX != null ) {
                        var doc = event.target.ownerDocument || DOC,
                        html = doc.documentElement, body = doc.body;
                        event.pageX = event.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html && html.clientLeft || body && body.clientLeft || 0);
                        event.pageY = event.clientY + (html && html.scrollTop  || body && body.scrollTop  || 0) - (html && html.clientTop  || body && body.clientTop  || 0);
                    }
                    //如果不存在relatedTarget属性，为它添加一个
                    if ( !event.relatedTarget && event.fromElement ) {
                        event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
                    }
                    //标准浏览判定按下鼠标哪个键，左1中2右3
                    var button = event.button
                    //IE event.button的意义
                    //0：没有键被按下 1：按下左键 2：按下右键 3：左键与右键同时被按下 4：按下中键 5：左键与中键同时被按下 6：中键与右键同时被按下 7：三个键同时被按下
                    if ( !event.which && isFinite(button) ) {
                        event.which  = [0,1,3,0,2,0,0,0][button];//0现在代表没有意义
                    }
                }
                if ( event.which == null ) {//处理键盘事件
                    event.which = event.charCode != null ? event.charCode : event.keyCode;
                }
                //处理滚轮事件
                if ("wheelDelta" in originalEvent){
                    var delta = originalEvent.wheelDelta/120;
                    //opera 9x系列的滚动方向与IE保持一致，10后修正
                    if(global.opera && global.opera.version() < 10)
                        delta = -delta;
                    event.wheelDelta = Math.round(delta); //修正safari的浮点 bug
                }else if("detail" in originalEvent){
                    event.wheelDelta = -event.detail/3;
                }
                // 处理组合键
                if ( event.metaKey === void 0 ) {
                    event.metaKey = event.ctrlKey;
                }
            }
            return event;
        }
    }
    
    var jEvent = $.Event = function ( event ) {
        this.originalEvent = event.substr ? {} : event;
        this.type = event.type || event;
        this.timeStamp  = Date.now();
        this.namespace = "";//用于判定是否为伪事件对象
    };
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jEvent.prototype = {
        constructor:jEvent,
        //http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/events.html#Conformance
        toString:function(){
            return "[object Event]"
        },
        preventDefault: function() {
            this.isDefaultPrevented = true;
            var e = this.originalEvent;
            // 如果存在preventDefault 那么就调用它
            if ( e.preventDefault ) {
                e.preventDefault();
            }
            // 如果存在returnValue 那么就将它设为false
            e.returnValue = false;
            return this;
        },
        stopPropagation: function() {
            this.isPropagationStopped = true;
            var e = this.originalEvent;
            // 如果存在preventDefault 那么就调用它
            if ( e.stopPropagation ) {
                e.stopPropagation();
            }
            // 如果存在returnValue 那么就将它设为true
            e.cancelBubble = true;
            return this;
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = true;
            this.stopPropagation();
            return this;
        }
    };
    //事件派发器的接口
    //实现了这些接口的对象将具有注册事件和广播事件的功能
    $.dispatcher = {};
    "bind,unbind,fire".replace($.rword,function(name){
        $.dispatcher[name] = function(){
            system[name].apply(this, arguments);
            return this;
        }
    });
    $.dispatcher.uniqueNumber = $.uuid++;
    $.dispatcher.defineEvents = function(names){
        var events = [];
        if(typeof names == "string"){
            events = names.match($.rword);
        }else if($.isArray(names)){
            events = names;
        }
        events.forEach(function(name){
            var method = 'on'+name.replace(revent,function($, $1, $2) {
                return $2.toUpperCase();
            });
            if (!(method in this)) {
                this[method] = function() {
                    return this.bind.apply(this, [].concat.apply([name],arguments));
                };
            }
        },this);
    }
    
});

    //2011.8.14 更改隐藏namespace,让自定义对象的回调函数也有事件对象
    //2011.9.17 事件发送器增加一个uniqueID属性
    //2011.9.21 重构bind与unbind方法 支持命名空间与多事件处理
    //2011.9.27 uniqueID改为uniqueNumber 使用$._data存取数据
    //2011.9.29 简化bind与unbind
    //2011.10.13 模块名改为dispatcher
    //2011.10.23 简化system.handle与fire
    //2011.10.26 更改命名空间的检测方法
    //2011.11.23 重构system.fix与quickIs
    //2011.12.20 修正在当前窗口为子窗口元素绑定错误时，在IE678下，事件对象错误的问题
    //2011.12.20 修正rhoverHack正则，现在hover可以作为命名空间了




//http://davidwalsh.name/snackjs
//http://microjs.com/
//http://westcoastlogic.com/lawnchair/
//https://github.com/madrobby/emile
//http://www.bobbyvandersluis.com/articles/clientside_scripting/
//==========================================
//  事件模块（包括伪事件对象，事件绑定与事件代理）
//==========================================
   
$.define("event", "node,target",function(){
    // $.log("加载event模块成功");
    var global = this, DOC = global.document, types = "contextmenu,click,dblclick,mouseout,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,mousewheel," +
    "abort,error,load,unload,resize,scroll,change,input,select,reset,submit,"+"blur,focus,focusin,focusout,"+"keypress,keydown,keyup";
    $.eventSupport = function( eventName,el ) {
        el = el || DOC.createElement("div");
        eventName = "on" + eventName;
        var ret = eventName in el;
        if (el.setAttribute && !ret ) {
            el.setAttribute(eventName, "return;");
            ret = typeof el[eventName] === "function";
        }
        el = null;
        return ret;
    };

    var system = $.event, specials = system.special = {
        focus: {
            delegateType: "focusin"
        },
        blur: {
            delegateType: "focusout"
        },

        beforeunload: {
            setup: function(src, selector, fn ) {
                // We only want to do this special case on windows
                if ( $.type(src, "Window") ) {
                    src.onbeforeunload = fn;
                }
            },
            teardown: function( src, selector,  fn ) {
                if ( src.onbeforeunload === fn ) {
                    src.onbeforeunload = null;
                }
            }
        }
    }, rword = $.rword;
    function fixAndHandle(src, type, e){
        e = system.fix(e);
        e.type = type;
        system.handle.call(src,e);
    }
    //用于在标准浏览器下模拟mouseenter与mouseleave
    //现在除了IE系列支持mouseenter/mouseleave/focusin/focusout外
    //opera11也支持这四个事件,同时它们也成为w3c DOM3 Event的规范
    //详见http://www.filehippo.com/pl/download_opera/changelog/9476/
    //http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
    "mouseenter_mouseover,mouseleave_mouseout".replace(/(\w+)_(\w+)/g,function(_,orig, fix){
        specials[ orig ]  = {
            setup:function(src){//使用事件冒充
                $._data(src, orig+"_handle",$.bind(src, fix, function(event){
                    var parent = event.relatedTarget;
                    try {
                        while ( parent && parent !== src ) {
                            parent = parent.parentNode;
                        }
                        if ( parent !== src ) {
                            fixAndHandle(src, orig, event)
                        }
                    } catch(e) { };
                }));
            },
            teardown :function(){
                $.bind(this, fix, $._data(orig+"_handle")|| $.noop);
            }
        };
    });
    var delegate = function(fn){
        return function(src,selector){
            if(!selector){
                return false;
            }
            fn(src);
        }
    }
    //模拟IE678的reset,submit,change的事件代理
    var submitWhich = $.oneObject("13,108");
    var submitInput = $.oneObject("submit,image");
    var submitType  = $.oneObject("text,password,textarea");
    if(!DOC.dispatchEvent){
        var changeEls = /^(?:textarea|input|select)$/i ,checkEls = /radio|checkbox/;
        var changeType = {
            "select-one":"selectedIndex",
            "select-multiple":"selectedIndex",
            "radio":"checked",
            "checkbox":"checked"
        }
        var changeNotify = function(e){
            if(e.propertyName === (changeType[this.type] || "value")){
                var els = $._data(this,"publisher");
                e = system.fix(e);
                e.type = "change";
                for(var i in els){
                    system.handle.call(els[i], e);
                }
            }
        }

        $.mix(specials,{
            //reset事件的冒泡情况----FF与opera能冒泡到document,其他浏览器只能到form
            reset:{
                setup: delegate(function(src){
                    system.bind.call( src, "click._reset keypress._reset", function( e ) {
                        if(  e.target.form && (e.which === 27  ||  e.target.type == "reset") ){
                            fixAndHandle(src, "reset", e);
                        }
                    });
                }),
                teardown: delegate(function(src){
                    system.unbind.call( src, "._reset" );
                })
            },
            //submit事件的冒泡情况----IE6-9 :form ;FF: document; chrome: window;safari:window;opera:window
            submit : {
                setup: delegate(function(src){
                    system.bind.call( src, "click._submit keypress._submit", function( e ) {
                        var el = e.target, type = el.type;
                        if( el.form &&  ( submitInput[type] || submitWhich[ e.which ] && submitType[type]) ){
                            fixAndHandle(src, "submit", e);
                        }
                    });
                }),
                teardown: delegate(function(src){
                    system.unbind.call( src, "._submit" );
                })
            },
            change : {
                setup: delegate(function(src){
                    var subscriber = $._data(src,"subscriber",{});//用于保存订阅者的UUID
                    $._data(src,"valuechange_setup", $.bind( src, "beforeactivate", function( ) {
                        var target = event.srcElement;
                        //如果发现孩子是表单元素并且没有注册propertychange事件，则为其注册一个，那么它们在变化时就会发过来通知顶层元素
                        if ( changeEls.test(target.nodeName) && !subscriber[target.uniqueNumber] ) {
                            subscriber[target.uniqueNumber] = target;//表明其已注册
                            var publisher = ($._data(target,"publisher") || $._data(target,"publisher",{}));
                            publisher[src.uniqueNumber] = src;//此孩子可能同时要向N个上司报告变化
                            system.bind.call(target,"propertychange._change",changeNotify );
                        }
                    }));
                }),
                teardown:delegate(function(src){
                    $.unbind( src, "beforeactive", $._data(src,"valuechange_setup") || $.noop);
                    var els = $.removeData(src,"subscriber",true) || {};
                    for(var i in els){
                        $.unbind(els[i],"._change");
                        var publisher = $._data(els[i],"publisher");
                        if(publisher){
                            delete publisher[src.uniqueNumber];
                        }
                    }
                })
            }
        })
            
    }
    //我们可以通过change的事件代理来模拟YUI的valuechange事件
    //支持情况 FF2+ chrome 1+ IE9+ safari3+ opera9+11 The built-in Android browser,Dolphin HD browser
    if($.eventSupport("input", DOC.createElement("input"))){
        //http://blog.danielfriesen.name/2010/02/16/html5-browser-maze-oninput-support/
        specials.change = {
            setup : delegate(function(src){
                $._data(src,"valuechange_setup",$.bind( src, "input", function( e){
                    fixAndHandle(src, "change", e);
                },true));
                $._data(src,"selectchange_setup",$.bind( src, "change", function( e){
                    var type = e.target.type;
                    if(type && !submitType[type]){
                        system.handle.call(src, e);
                    }  
                },true))
            }),
            teardown: delegate(function(src){
                $.unbind( src, "input", $._data(src,"valuechange_setup") || $.noop);
                $.unbind( src, "change", $._data(src,"selectchange_setup") || $.noop);
            })
        }
    }
       
    //在标准浏览器里面模拟focusin
    if(!$.eventSupport("focusin")){
        "focusin_focus,focusout_blur".replace(/(\w+)_(\w+)/g,function(_,$1, $2){
            var notice = 0, focusinNotify = function (e) {
                var src = e.target
                do{//模拟冒泡
                    var events = $._data( src,"events");
                    if(events && events[$1]){
                        fixAndHandle(src, $1, e);
                    }
                } while (src = src.parentNode );
            }
            specials[ $1 ] = {
                setup: function( ) {
                    if ( notice++ === 0 ) {
                        DOC.addEventListener( $2, focusinNotify, true );
                    }
                },
                teardown: function() {
                    if ( --notice === 0 ) {
                        DOC.removeEventListener( $2, focusinNotify, true );
                    }
                }
            };
        });
    }
    try{
        //FF3使用DOMMouseScroll代替标准的mousewheel事件
        DOC.createEvent("MouseScrollEvents");
        specials.mousewheel = {
            bindType    : "DOMMouseScroll",
            delegateType: "DOMMouseScroll"
        }
        try{
            //可能末来FF会支持标准的mousewheel事件，则需要删除此分支
            DOC.createEvent("WheelEvent");
            delete specials.mousewheel;
        }catch(e){};
    }catch(e){};
    //当一个元素，或者其内部任何一个元素获得焦点的时候会触发这个事件。
    //这跟focus事件区别在于，他可以在父元素上检测子元素获取焦点的情况。
    var  rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/
    function quickParse( selector ) {
        var quick = rquickIs.exec( selector );
        if ( quick ) {
            //   0  1    2   3
            // [ _, tag, id, class ]
            quick[1] = ( quick[1] || "" ).toLowerCase();
            quick[3] = quick[3] && new RegExp( "(?:^|\\s)" + quick[3] + "(?:\\s|$)" );
        }
        return quick;
    }
    $.implement({
        toggle:function(/*fn1,fn2,fn3*/){
            var fns = [].slice.call(arguments), i = 0;
            return this.click(function(e){
                var fn  = fns[i++] || fns[i = 0, i++];
                fn.call(this,e);
            })
        },
        hover: function( fnIn, fnOut ) {
            return this.mouseenter( fnIn ).mouseleave( fnOut || fnIn );
        },
        on: function( types, fn, selector, times ) {
            if ( typeof types === "object" ) {
                for (var type in types ) {
                    this.on( type,  types[ type ], selector, times );
                }
                return this;
            }
            if(!types || !fn){//必须指定事件类型与回调
                return this;
            }
            return this.each( function() {//转交dispatch模块去处理
                system.bind.call( this, types, fn, selector, times );
            });
        },
        off: function( types, fn ) {
            if ( typeof types === "object" ) {
                for ( var type in types ) {
                    this.off( type,types[ type ], fn  );
                }
                return this;
            }
            var args = arguments
            return this.each(function() {
                system.unbind.apply( this, args );
            });
        },
        one: function( types, fn ) {
            return this.on(  types, fn, null, 1 );
        },
        bind: function( types, fn, times ) {
            return this.on( types, fn, times );
        },
        unbind: function( types, fn ) {
            return this.off( types, fn );
        },

        live: function( types,  fn, times ) {
            $( this.ownerDocument ).on( types, fn, this.selector,times );
            return this;
        },
        die: function( types, fn ) {
            $( this.ownerDocument ).off( types, fn, this.selector || "**" );
            return this;
        },
        undelegate: function( selector, types, fn ) {
            return arguments.length == 1? this.off( selector, "**" ) : this.off( types, fn, selector );
        },

        delegate: function( selector, types, fn, times ) {
            if(typeof selector === "string"){
                selector = quickParse( selector ) || selector;
            }
            return this.on( types, fn, selector, times );
        },
        fire: function(  ) {
            var args = arguments;
            return this.each(function() {
                $.event.fire.apply(this, args );
            });
        }
    })

    types.replace(rword,function(type){
        $.fn[type] = function(callback){
            return callback?  this.bind(type, callback) : this.fire(type);
        }
    });
});
//2011.10.14 强化delegate 让快捷方法等支持fire 修复delegate BUG
//2011.10.21 修复focusin focsuout的事件代理 增加fixAndHandle处理事件冒充
//2011.11.23 简化rquickIs
//1. 各浏览器兼容                  2. this指针指向兼容                  3. event参数传递兼容. 









})(this,this.document);
/**
 2011.7.11
@开头的为私有的系统变量，防止人们直接调用,
dom.check改为dom["@emitter"]
dom.namespace改为dom["mass"]
去掉无用的dom.modules
优化exports方法
2011.8.4
强化dom.log，让IE6也能打印日志
重构fixOperaError与resolveCallbacks
将provide方法合并到require中去
2011.8.7
重构define,require,resolve
添加"@modules"属性到dom命名空间上
增强domReady传参的判定
2011.8.18 应对HTML5 History API带来的“改变URL不刷新页面”技术，让URL改变时让namespace也跟着改变！
2011.8.20 去掉dom.K,添加更简单dom.noop，用一个简单的异步列队重写dom.ready与错误堆栈dom.stack
2011.9.5  强化dom.type
2011.9.19 强化dom.mix
2011.9.24 简化dom.bind 添加dom.unbind
2011.9.28 dom.bind 添加返回值
2011.9.30 更改是否在顶层窗口的判定  global.frameElement == null --> self.eval === top.eval
2011.10.1
更改dom.uuid为dom["@uuid"],dom.basePath为dom["@path"]，以示它们是系统变量
修复dom.require BUG 如果所有依赖模块之前都加载执行过，则直接执行回调函数
移除dom.ready 只提供dom(function(){})这种简捷形式
2011.10.4 强化对IE window的判定, 修复dom.require BUG dn === cn --> dn === cn && !callback._name
2011.10.9
简化fixOperaError中伪dom命名空间对象
优化截取隐藏命名空间的正则， /(\W|(#.+))/g --〉  /(#.+|\\W)/g
2011.10.13 dom["@emitter"] -> dom["@target"]
2011.10.16 移除XMLHttpRequest的判定，回调函数将根据依赖列表生成参数，实现更彻底的模块机制
2011.10.20 添加error方法，重构log方法
2011.11.6  重构uuid的相关设施
2011.11.11 多版本共存
2011.12.19 增加define方法
2011.12.22 加载用iframe内增加$变量,用作过渡.
2012.1.15  更换$为命名空间

不知道什么时候开始，"不要重新发明轮子"这个谚语被传成了"不要重新造轮子"，于是一些人，连造轮子都不肯了。

*/

