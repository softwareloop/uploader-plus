<@markup id="custom-widgets" target="widgets" action="after" scope="global">
    <@inlineScript group="upload">
        Alfresco.getFileUploadInstance().setOptions({
            flashUploader : YAHOO.lang.isObject(SoftwareLoop) && YAHOO.lang.isFunction(SoftwareLoop.FlashUpload) ? "SoftwareLoop.FlashUpload" : "Alfresco.FlashUpload",
            htmlUploader : YAHOO.lang.isObject(SoftwareLoop) && YAHOO.lang.isFunction(SoftwareLoop.HtmlUpload) ? "SoftwareLoop.HtmlUpload" : "Alfresco.HtmlUpload"
        });
        
        Alfresco.getDNDUploadProgressInstance = function()
        {
            var instanceId = "SoftwareLoop.DNDUpload";
            var instance = Alfresco.util.ComponentManager.findFirst(instanceId);
            return instance;
        };
    </@>
</@>