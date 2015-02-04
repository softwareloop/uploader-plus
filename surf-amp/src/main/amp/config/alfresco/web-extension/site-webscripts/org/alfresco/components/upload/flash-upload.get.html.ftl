<@markup id="css" >
<#-- CSS Dependencies -->
    <@link href="${url.context}/res/components/upload/flash-upload.css" group="upload"/>
    <@link href="${url.context}/res/components/uploader-plus/css/uploader-plus.css" group="upload"/>
</@>

<@markup id="js">
<#-- JavaScript Dependencies -->
    <@script type="text/javascript" src="${url.context}/res/components/upload/flash-upload.js" group="upload"/>
    <@script type="text/javascript" src="${url.context}/res/components/uploader-plus/js/common.js" group="upload"/>
    <@script type="text/javascript" src="${url.context}/res/components/uploader-plus/js/uploader-plus-mixin.js" group="upload"/>
    <@script type="text/javascript" src="${url.context}/res/components/uploader-plus/js/flash-upload-plus.js" group="upload"/>
</@>

<@markup id="widgets">
    <@createWidgets group="upload"/>
</@>

<@markup id="html">
    <@uniqueIdDiv>
        <#assign el=args.htmlid?html>
    <div id="${el}-dialog" class="flash-upload hidden">
        <div class="hd">
            <span id="${el}-title-span"></span>
        </div>
        <div class="bd" id="${el}-main-dialog">
            <div class="browse-wrapper">
                <div class="center">
                    <div class="hidden browse"
                         id="${el}-flashuploader-div"></div>
                    <div class="label">${msg("label.browse")}</div>
                </div>
            </div>
            <div class="tip-wrapper">
                <span id="${el}-multiUploadTip-span">${msg("label.multiUploadTip")}</span>
                <span id="${el}-singleUpdateTip-span">${msg("label.singleUpdateTip")}</span>
            </div>
            <div id="${el}-filelist-table"
                 class="fileUpload-filelist-table"></div>
            <div class="status-wrapper">
                <span id="${el}-status-span" class="status"></span>
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
                        <input id="${el}-minorVersion-radioButton" type="radio"
                               name="majorVersion" checked="checked"
                               tabindex="0"/>
                        <label for="${el}-minorVersion-radioButton"
                               id="${el}-minorVersion">${msg("label.minorVersion")}</label>
                    </div>
                </div>
                <div class="yui-gd">
                    <div class="yui-u first">&nbsp;
                    </div>
                    <div class="yui-u">
                        <input id="${el}-majorVersion-radioButton" type="radio"
                               name="majorVersion" tabindex="0"/>
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
            <!-- Templates for a file row -->
            <div style="display:none">
                <div id="${el}-left-div" class="fileupload-left-div">
                    <span class="fileupload-percentage-span hidden">&nbsp;</span>
                    <input class="fileupload-contentType-input" type="hidden"
                           value="cm:content"/>
                </div>
                <div id="${el}-center-div" class="fileupload-center-div">
                    <span class="fileupload-progressSuccess-span">&nbsp;</span>
                    <img src="${url.context}/res/components/images/generic-file-32.png"
                         class="fileupload-docImage-img"
                         alt="file"/>
                    <span class="fileupload-progressInfo-span"></span>
                    <span class="fileupload-filesize-span"></span>
                    <span class="fileupload-typeInfo-span uploader-plus hidden"></span>
                </div>
                <div id="${el}-right-div" class="fileupload-right-div">
                  <span class="fileupload-fileButton-span">
                     <button class="fileupload-file-button" value="Remove"
                             disabled="true"
                             tabindex="0">${msg("button.remove")}</button>
                  </span>
                </div>
            </div>
            <div class="bdft">
                <input id="${el}-upload-button" type="button"
                       value="${msg("button.upload")}" tabindex="0"/>
                <input id="${el}-cancelOk-button" type="button"
                       value="${msg("button.cancel")}" tabindex="0"/>
            </div>
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
