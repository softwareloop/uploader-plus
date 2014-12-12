// This js webscripts controller assumes that the types variable was
// populated by the Java controller (see ListContentTypesGet.java)

// Load all exclude types and type patterns
var webscriptConfig = new XML(config.script);
var excludes = webscriptConfig["exclude-cmcontent-subtypes"]["exclude-cmcontent-subtype"];

// A function to evaluate if a certain type is excluded
function isExcluded(type) {
    for (var index in excludes) {
        var exclude = String(excludes[index]);
        if (exclude.lastIndexOf("*") === exclude.length - 1) {
            var prefix = exclude.slice(0, exclude.length - 1);
            if (type.indexOf(prefix) == 0) {
                return true;
            }
        } else if (type == exclude) {
            return true;
        }
    }
    return false;
}

//
var filteredTypes = [];
for (var i = 0; i < types.length; i++) {
    var type = types[i];
    if (!isExcluded(type)) {
        filteredTypes.push(type);
    }
}


model.types = filteredTypes;
