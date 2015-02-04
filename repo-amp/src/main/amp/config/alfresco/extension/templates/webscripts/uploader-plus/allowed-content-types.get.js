function cleanUpPath(path) {
    if (path == null || path.length == 0) {
        path = "/";
    }
    if (path.charAt(path.length - 1) != "/") {
        path = path + "/";
    }
    if (path.charAt(0) == "/" && path.length > 1) {
        path = path.substr(1);
    }
    return path;
}

var destination = args.destination;
var siteId = args.siteid;
var containerId = args.containerid;
var path = cleanUpPath(args.path);
if (logger.isLoggingEnabled()) {
	logger.log("destination: " + destination);
	logger.log("siteId: " + siteId);
	logger.log("containerId: " + containerId);
	logger.log("args.path: " + args.path);
	logger.log("path: " + path);
}

var destNode = null;

if (destination !== null) {
    destNode = search.findNode(destination);
} else if (siteId !== null) {
    var site = siteService.getSite(siteId);
    destNode = site.getContainer(containerId);

    destNode = destNode.childByNamePath(path);
}


while (destNode !== null && !destNode.hasAspect("up:UploadFolder")) {
    destNode = destNode.parent;
}

if (destNode === null) {
    model.types = null;
} else {
    model.types = destNode.properties["up:allowedTypes"];
}
