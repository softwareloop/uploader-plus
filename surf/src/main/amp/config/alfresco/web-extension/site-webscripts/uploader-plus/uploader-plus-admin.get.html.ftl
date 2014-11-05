<@markup id="css" >
<#-- CSS Dependencies -->
    <#include "/org/alfresco/components/form/form.css.ftl"/>
    <@link href="${url.context}/res/modules/documentlibrary/global-folder.css" group="console"/>
    <@link href="${url.context}/res/components/uploader-plus/css/uploader-plus-admin.css" group="console"/>
</@>

<@markup id="js">
<#-- JavaScript Dependencies -->
    <#include "/org/alfresco/components/form/form.js.ftl"/>
    <@script src="${url.context}/res/components/console/consoletool.js" group="console"/>
    <@script src="${url.context}/res/modules/simple-dialog.js" group="console"/>
    <@script src="${url.context}/res/modules/documentlibrary/global-folder.js" group="console"/>
    <@script src="${url.context}/res/modules/documentlibrary/doclib-actions.js" group="console"/>
    <@script src="${url.context}/res/components/uploader-plus/js/common.js" group="console"/>
    <@script src="${url.context}/res/components/uploader-plus/js/uploader-plus-admin.js" group="console"/>
</@>

<@markup id="widgets">
    <@createWidgets group="console"/>
</@>

<@markup id="html">
    <@uniqueIdDiv>
        <#assign el=args.htmlid?html>
    <div class="title">Uploader Plus</div>

    <div class="dashlet folders-list">
        <div class="title">${msg("upload.folders")}</div>
        <div id="${el}-folders-list-info" class="tags-list-info"></div>
        <div id="${el}-folders-list-bar-bottom" class="toolbar theme-bg-color-3 hidden">
            <div id="${el}-paginator" class="paginator hidden">&nbsp;</div>
        </div>
        <div id="${el}-folders" class="body scrollableList" style="height: 100%; overflow: hidden"></div>
    </div>
    <input type="button" id="${el}-new-upload-folder" name="new-upload-folder"
           value="${msg('new.upload.folder')}">
    </@>
</@>
