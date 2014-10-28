<@markup id="css" >
<#-- No CSS Dependencies -->
</@>

<@markup id="js">
<#-- JavaScript Dependencies-->
    <@script src="${url.context}/res/components/upload/file-upload.js" group="upload"/>
</@>

<@markup id="widgets">
    <@createWidgets group="upload"/>
    <@inlineScript group="upload">
        <#assign fileUploadConfig = config.scoped["DocumentLibrary"]["file-upload"]!>
        <#if fileUploadConfig.getChildValue??>
            <#assign adobeFlashEnabled = fileUploadConfig.getChildValue("adobe-flash-enabled")!"true">
        </#if>
    new Alfresco.getFileUploadInstance().setOptions(
    {
    adobeFlashEnabled: ${((adobeFlashEnabled!"true") == "true")?string},
    //    flashUploader: "SoftwareLoop.FlashUploadPlus"
    });
    </@>
</@>

<@markup id="html">
    <@uniqueIdDiv>
    <#-- No HTML fragment-->
    </@>
</@>