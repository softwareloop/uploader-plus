<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/documentlibrary/parse-args.lib.js">

var storeType = url.templateArgs.store_type;
var storeId = url.templateArgs.store_id;
var id = url.templateArgs.id;

var nodeRef = storeType + "://" + storeId + (id == null ? "" : ("/" + id));
var node = ParseArgs.resolveNode(nodeRef);
model.node = node;

if (node.hasAspect("up:UploadFolder")) {
    model.status = 1;
    } else {
    var props = new Array(2);
    props["up:allowedTypes"] = null;
    node.addAspect("up:UploadFolder", props);
    node.save();

    model.status = 0;
    }
