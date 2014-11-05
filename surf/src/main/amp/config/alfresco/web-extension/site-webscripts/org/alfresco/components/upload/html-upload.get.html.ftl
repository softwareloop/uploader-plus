<@markup id="css" >
<#-- CSS Dependencies -->
    <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/upload/html-upload.css" group="upload" />
    <@link href="${url.context}/res/components/uploader-plus/css/uploader-plus.css" group="upload"/>
</@>

<@markup id="js">
<#-- JavaScript Dependencies -->
    <@script type="text/javascript" src="${url.context}/res/components/upload/html-upload.js" group="upload"/>
    <@script type="text/javascript" src="${url.context}/res/components/uploader-plus/js/common.js" group="upload"/>
    <@script type="text/javascript" src="${url.context}/res/components/uploader-plus/js/uploader-plus-mixin.js" group="upload"/>
    <@script type="text/javascript" src="${url.context}/res/components/uploader-plus/js/html-upload-plus.js" group="upload"/>
</@>

<@markup id="widgets">
    <@createWidgets group="upload"/>
    <@inlineScript group="upload">
    htmlUpload.setMaximumFileSizeLimit(${fileUploadSizeLimit});
    </@>
</@>

<@markup id="html">
    <@uniqueIdDiv>
        <#assign el=args.htmlid?html>
    <div id="${el}-dialog" class="html-upload hidden">
        <div class="hd">
            <span id="${el}-title-span"></span>
        </div>
        <div class="bd">
            <p id="${el}-singleUploadTip-span">${msg("label.singleUploadTip")}</p>

            <p id="${el}-singleUpdateTip-span">${msg("label.singleUpdateTip")}</p>
        </div>
        <div class="bd" id="${el}-main-dialog">
            <script type="text/javascript">
                    <#assign callback>onAlfrescoHtmlUploadComponent_${el?replace("-", "__")}</#assign>
                var ${callback}_success = function (response) {
                    var component = Alfresco.util.ComponentManager.get('${el}');
                    component.onUploadSuccess.call(component, response)
                };
                var ${callback}_failure = function (response) {
                    var component = Alfresco.util.ComponentManager.get('${el}');
                    component.onUploadFailure.call(component, response)
                };
            </script>
            <form id="${el}-htmlupload-form"
                  method="post" enctype="multipart/form-data"
                  accept-charset="utf-8"
                  action="${url.context}/proxy/alfresco/api/upload.html">
                <fieldset>
                    <input type="hidden" id="${el}-siteId-hidden" name="siteId"
                           value=""/>
                    <input type="hidden" id="${el}-containerId-hidden"
                           name="containerId" value=""/>
                    <input type="hidden" id="${el}-destination-hidden"
                           name="destination" value=""/>
                    <input type="hidden" id="${el}-username-hidden"
                           name="username" value=""/>
                    <input type="hidden" id="${el}-updateNodeRef-hidden"
                           name="updateNodeRef" value=""/>
                    <input type="hidden" id="${el}-uploadDirectory-hidden"
                           name="uploadDirectory" value=""/>
                    <input type="hidden" id="${el}-overwrite-hidden"
                           name="overwrite" value=""/>
                    <input type="hidden" id="${el}-thumbnails-hidden"
                           name="thumbnails" value=""/>
                    <input type="hidden" name="success"
                           value="window.parent.${callback}_success"/>
                    <input type="hidden" name="failure"
                           value="window.parent.${callback}_failure"/>

                    <div>
                        <div class="yui-g">
                            <h2>${msg("section.file")}</h2>
                        </div>
                        <input id="${el}-contentTypeInput" type="hidden"
                               name="contentType" value="cm:content"/>

                        <div class="yui-gd">
                            <div class="yui-u first">
                                <label for="${el}-filedata-file">${msg("label.file")}</label>
                            </div>
                            <div class="yui-u">
                                <input type="file" id="${el}-filedata-file"
                                       name="filedata" tabindex="0"/>
                            </div>
                        </div>
                    </div>
                    <div id="${el}-versionSection-div">
                        <div class="yui-g">
                            <h2>${msg("section.version")}</h2>
                        </div>
                        <div class="yui-gd">
                            <div class="yui-u first">
                                <span>${msg("label.version")}</span>
                            </div>
                            <div class="yui-u">
                                <input id="${el}-minorVersion-radioButton"
                                       type="radio" name="majorVersion"
                                       checked="checked" value="false"
                                       tabindex="0"/>
                                <label for="${el}-minorVersion-radioButton"
                                       id="${el}-minorVersion">${msg("label.minorVersion")}</label>
                            </div>
                        </div>
                        <div class="yui-gd">
                            <div class="yui-u first">&nbsp;
                            </div>
                            <div class="yui-u">
                                <input id="${el}-majorVersion-radioButton"
                                       type="radio" name="majorVersion"
                                       value="true" tabindex="0"/>
                                <label for="${el}-majorVersion-radioButton"
                                       id="${el}-majorVersion">${msg("label.majorVersion")}</label>
                            </div>
                        </div>
                        <div class="yui-gd">
                            <div class="yui-u first">
                                <label for="${el}-description-textarea">${msg("label.comments")}</label>
                            </div>
                            <div class="yui-u">
                                <textarea id="${el}-description-textarea"
                                          name="description" cols="80" rows="4"
                                          tabindex="0"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="bdft">
                        <input id="${el}-upload-button" type="button"
                               value="${msg("button.upload")}" tabindex="0"/>
                        <input id="${el}-cancel-button" type="button"
                               value="${msg("button.cancel")}" tabindex="0"/>
                    </div>
                </fieldset>
            </form>
        </div>
        <!-- Metadata dialog -->
        <div class="bd hidden" id="${el}-metadata-dialog">
            <div style="padding: 1em; border-bottom: 1px solid #ccc">
                <label>${msg("content.type")}:
                    <select id="${el}-content-type-select"></select>
                </label>
            </div>
            <div id="${el}-metadata-form"></div>
        </div>
    </div>
    </@>
</@>