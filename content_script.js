//当前cgi的信息
var cgi = {
	"pageData" : "",
	"callbackFunc" : "",
	"callbackData" : "",
	"format" : ""
}
function isArray(o){
	if(Array.isArray){
		return Array.isArray(o);
	} 	
	if(Object.prototype.toString.call(o) === '[object Array]' ){
    	return true;
	}
	return false;
}

function getPageData(){
	var str;
	str = (str = document.getElementsByTagName('pre')[0]) ? str.childNodes[0].nodeValue : document.body.childNodes[0].nodeValue;
	return str;
}

function showTree(){
	checkDataFormat(document.getElementById('code').value,function(error){
		if(error){
			alert('Data Format Error, Please have a check!');
		}else{
			showResult();
		}
	})
}
function checkDataFormat(str,func){
	cgi.pageData = str;
	//json format
	try{
		cgi.callbackData = JSON.parse(str);
		cgi.format = 'JSON';
		func(false);	
	//unstrict json format
	}catch(e){	
		try{
			var callbackFunc = str.match(/[\w\s]+(?=\()/ig)[0].trim();
			if(callbackFunc.length > 0){
				window[callbackFunc] = function(obj){
					cgi.callbackData = obj;
					cgi.callbackFunc = callbackFunc;
					cgi.format = 'JSONP';
					func(false);
				}
				eval(" " + str);
			}
		//jsonp
		}catch(e){
			try{
				cgi.callbackData = eval('(' + str +')');
				cgi.format = 'JSON-unstrict';
				func(false);
			}catch(e){
				func(true);
			}
		}
	}	
}
//获取当前页面数据
(function(){	
	if(window.isToolPage){
		window.onload = bindEvents;
		return;
	}
	//check finished tag
	if(window.jsonpViewer === true) {
		return;
	}else{
		window.jsonpViewer = true;
	}
	//check format
	checkDataFormat(getPageData(),function(error){
		if(error){
			if(window.confirm('JSONP Viewer: This Page isn\'t a JSON file, do you want to open an tool page?')){
				window.open(chrome.extension.getURL('tool.html')); 
			}
		}else{
			loadStatic();
			showResult();
			bindEvents();
		}
	});
})();

function bindEvents(){
	var tree = document.getElementById('tree');
	tree.onclick = function(e){
		var src = e.srcElement;
		if(src.className === 'operator' ){
			if(src.parentNode.className == 'close'){
				src.parentNode.className =  'open';
				src.innerHTML = '-';
			}else{
				src.parentNode.className =  'close';
				src.innerHTML = '+';
			}	
		}
	}
}
//load css
function loadStatic(){
	var link = document.createElement('link');
	link.setAttribute('rel','stylesheet');
	link.setAttribute('href',chrome.extension.getURL('content_style.css'));
	link.setAttribute('id','contentStyle');
	document.getElementsByTagName('head')[0].appendChild(link);
}

//展示最后结果
function showResult(){
	var html = '';
	if(cgi.format !== ''){
		html = 'Format: <strong>' + cgi.format + '</strong>' +(cgi.format == 'JSONP' ? ', callback: <strong>' + cgi.callbackFunc + '</strong>':'') + '.';
		if(window.isToolPage){
			document.getElementById('info').innerHTML = html;
			document.getElementById('tree').innerHTML = buildDom(cgi.callbackData,'obj');
		}else{
			html ='<p class="info">' + html + ' <a target="_blank" href="view-source:'+ window.location.href +'">View source</a></p>';
			document.body.innerHTML = html + '<div id="tree" class="tree">' + buildDom(cgi.callbackData,'obj') + '</div>';
		}	
	}
}
//输出DOM结构
function buildDom(o,literal){
	var type = isArray(o) ? 'array' : typeof o,
		html = '';

	switch(type){
		case 'array' :
			for(var i=0,len = o.length;i<len;i++){
				html += '<li title="'+ literal+ '['+ i +']"><strong>' + i + '</strong>:' + buildDom(o[i],literal + '[' + i + ']') + ',</li>';
			} 
			return '<span class="operator">-</span><div class="group">[<ul class="' + type +'">'+ html.replace(/,<\/li>$/,'<\/li>') + '</ul>]</div><div class="summary">Array['+ len +']</div>';
			break;
		case 'object':
			//sort obj		
			var keys = Object.keys(o);
			keys.sort();
			for(var i = 0, l = keys.length; i < l; i++) {
				html += '<li title="'+ literal +'.'+ keys[i] +'"><strong>' + keys[i] + '</strong>:' + buildDom(o[keys[i]],literal + '.' + keys[i]) +  ',</li>';
			}
			//remove last comma
			return '<span class="operator">-</span><div class="group">{<ul class="' + type +'">'+ html.replace(/,<\/li>$/,'<\/li>') + '</ul>}</div><div class="summary">Object</div>';
			break;
		case 'string':
			return '<span class="value ' + type + '">"' + (/^https?\:(\/\/).*$/i.test(o)? '<a href="' + o +'" target="_blank">' + o + '</a>': o )+ '"</span>';
			break;
		default :
			return '<span class="value ' + type + '">'+ o + '</span>';
	}

}
