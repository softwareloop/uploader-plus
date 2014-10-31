// A big 'thank you' to Jan Pfitzner for his post http://blog.alfrescian.com/?p=202

var ctx = Packages.org.springframework.web.context.ContextLoader.getCurrentWebApplicationContext();
var dictionaryService = ctx.getBean("DictionaryService");
var subtypes = dictionaryService.getSubTypes(Packages.org.alfresco.model.ContentModel.TYPE_CONTENT, true).toArray();

model.types = [];

for (var i = 0; i < subtypes.length; i++) {
    var type = subtypes[i];
    model.types.push(type.getPrefixString());
}

model.types.sort();
