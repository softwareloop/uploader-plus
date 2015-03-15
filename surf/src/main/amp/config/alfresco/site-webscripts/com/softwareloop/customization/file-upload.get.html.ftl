<@markup id="custom-widgets" target="widgets" action="after">
    <@inlineScript group="upload">
        Alfresco.getFileUploadInstance().setOptions({
            flashUploader : "SoftwareLoop.FlashUpload",
            htmlUploader : "SoftwareLoop.HtmlUpload",
            dndUploader : "SoftwareLoop.DNDUpload"
        });
        
        Alfresco.getDNDUploadProgressInstance = function()
        {
            var instanceId = "SoftwareLoop.DNDUpload";
            var instance = Alfresco.util.ComponentManager.findFirst(instanceId);
            return instance;
        };
    </@>
</@>