//gobal data
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
function htmlEncode(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function getPageData(){
	var str;
	str = (str = document.getElementsByTagName('pre')[0]) ? str.textContent : document.body.textContent;

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

	//remove specific string to avoid crash
	str = str.replace(/while[\s\(]+(1|true)[\s\)]+;/ig,'');

	//json format
	try{
		cgi.callbackData = JSON.parse(str);
		cgi.format = 'JSON';
		func(false);
	}catch(e){	
		//unstrict json format
		try{
			cgi.callbackData = eval('(' + str +')');
			cgi.format = 'JSON-unstrict';
			func(false);
		//jsonp
		}catch(e){
			try{
				var callbackFunc = str.match(/[\.\w\s]+(?=\()/ig)[0].trim();
				if(callbackFunc.length > 0){
					var callback = function(obj){
						cgi.callbackData = obj;
						cgi.callbackFunc = callbackFunc;
						cgi.format = 'JSONP';
						func(false);				
					}
					//if function with namespace 
					if(callbackFunc.indexOf('.')>-1){
						var arr = callbackFunc.split('.'),
							parent = window;
						for(var i=0, len= arr.length;i<len;i++){
							if(i === len - 1){
								parent[arr[i]] = callback;

							}else{
								parent = parent[arr[i]] = {};
							}
						}
					}else{
						
						window[callbackFunc] = callback;
					}
					eval(" " + str);
				}else{
					func(true);
				}
			//unknown type
			}catch(e){
				func(true);	
			}
			
		}

	}	
}
//get current page data
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

//show data tree
function showResult(){
	var html = '';
	if(cgi.format !== ''){
		var dataType = isArray(cgi.callbackData) ? 'arr' : 'obj';
		html = 'Format: <strong>' + cgi.format + '</strong>' +(cgi.format == 'JSONP' ? ', callback: <strong class="em">' + cgi.callbackFunc + '</strong>':'') + '.';
		if(window.isToolPage){
			document.getElementById('info').innerHTML = html;
			document.getElementById('tree').innerHTML = buildDom(cgi.callbackData, dataType);
		}else{
			html ='<p class="info">' + html + ' <a target="_blank" href="view-source:'+ window.location.href +'">View source</a></p>';
			document.body.innerHTML = html + '<div id="tree" class="tree">' + buildDom(cgi.callbackData, dataType) + '</div>';
		}	
	}
}
//build dom html
function buildDom(o,literal){
	// null object
	var type = o === null ? 'null' : isArray(o) ? 'array' : typeof o,
		html = '';

	switch(type){
		case 'array' :
			for(var i=0,len = o.length;i<len;i++){
				html += '<li title=\''+ literal+ '['+ i +']\'><strong>' + i + '</strong>:' + buildDom(o[i],literal + '[' + i + ']') + ',</li>';
			} 
			return '<span class="operator">-</span><div class="group">[<ul class="' + type +'">'+ html.replace(/,<\/li>$/,'<\/li>') + '</ul>]</div><div class="summary">Array['+ len +']</div>';
			break;
		case 'object':
			//sort obj		
			var keys = Object.keys(o);
			keys.sort();
			for(var i = 0, l = keys.length; i < l; i++) {
				//quote numeric property
				if(/^\d+$/.test(keys[i])){
					html += '<li title=\''+ literal +'["'+ keys[i] +'"]\'><strong>"' + keys[i] + '"</strong>:' + buildDom(o[keys[i]],literal + '["' + keys[i] + '"]') +  ',</li>';
				}else{
					html += '<li title=\''+ literal +'.'+ keys[i] +'\'><strong>' + keys[i] + '</strong>:' + buildDom(o[keys[i]],literal + '.' + keys[i]) +  ',</li>';	
				}
			}
			//remove last comma
			return '<span class="operator">-</span><div class="group">{<ul class="' + type +'">'+ html.replace(/,<\/li>$/,'<\/li>') + '</ul>}</div><div class="summary">Object</div>';
			break;
		case 'string':
			return '<span class="value ' + type + '">"' + (/^https?\:(\/\/).*$/i.test(o)? '<a href="' + o +'" target="_blank">' + o + '</a>': htmlEncode(o) )+ '"</span>';
			break;
		default :
			return '<span class="value ' + type + '">'+ o + '</span>';
	}

}
