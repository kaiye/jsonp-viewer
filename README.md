## About
JSONP Viewer is a developer tool to help you analyse a JSON-like data, and also generate and highlight the data tree.

这个工具用来分析JSON/JSONP文档，同时生成相关的文档信息与数据树状结构。

[Install it from Chrome Web Store](https://chrome.google.com/webstore/detail/mijkjfpdiidomhagijpedgaeekkadlgp/details)

## Change Log
### v1.1.6
* 修复值为null时无法处理的BUG
* 修复某些情况下数据格式未报异常的BUG
* 删除json数据中的while死循环以防止程序崩溃
* 优化展示，根节点为数组时字面量为arr，其他情况为obj

### v1.1.5
* 修复对象中数字属性引用方式的title提示，例如 obj.1 修复为 obj["1"]

### v1.1.4
* 修复不支持JSONP格式中命名空间形式的回调，如A.B.C
* 修复大数据分析溢出的问题（由于nodeValue.length上限65536引起的BUG）

### v1.1.2
* Fix HTML encode for string value.

### v1.1.1
* Fix some bugs in tool page.



