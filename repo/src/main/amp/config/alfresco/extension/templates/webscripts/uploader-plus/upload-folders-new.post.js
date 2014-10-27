<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/documentlibrary/parse-args.lib.js">


var storeType = url.templateArgs.store_type;
var storeId = url.templateArgs.store_id;
var id = url.templateArgs.id;

var nodeRef = storeType + "://" + storeId + (id == null ? "" : ("/" + id));
var node = ParseArgs.resolveNode(nodeRef);

var props = new Array(2);
props["up:allowedTypes"] = null;
props["up:recursive"] = false;
node.addAspect("up:UploadFolder", props);
node.save();

model.node = node;