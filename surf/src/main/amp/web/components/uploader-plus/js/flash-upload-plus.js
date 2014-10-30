SoftwareLoop.FlashUploadPlus = function (htmlId) {
    SoftwareLoop.FlashUploadPlus.superclass.constructor.call(this, htmlId);
    return this;
};

YAHOO.extend(SoftwareLoop.FlashUploadPlus, Alfresco.FlashUpload, {

    allowedContentTypesDestinationTemplate: Alfresco.constants.PROXY_URI +
        "uploader-plus/allowed-content-types?destination={destination}",

    allowedContentTypesSiteTemplate: Alfresco.constants.PROXY_URI +
        "/uploader-plus/allowed-content-types?siteid={siteId}&containerid={containerId}&path={uploadDirectory}",

    allowedContentTypesBlankUrl: Alfresco.constants.PROXY_URI +
        "/uploader-plus/allowed-content-types",

    types: [],

    show: function (config) {
        SoftwareLoop.FlashUploadPlus.superclass.show.call(this, config);

        var url;
        if (this.showConfig.destination) {
            url = YAHOO.lang.substitute(
                this.allowedContentTypesDestinationTemplate,
                {
                    destination: encodeURIComponent(this.showConfig.destination)
                }
            );
        } else if (this.showConfig.siteId) {
            url = YAHOO.lang.substitute(
                this.allowedContentTypesSiteTemplate,
                {
                    siteId: encodeURIComponent(this.showConfig.siteId),
                    containerId: encodeURIComponent(this.showConfig.containerId),
                    uploadDirectory: encodeURIComponent(this.showConfig.uploadDirectory)
                }
            );
        } else {
            url = this.allowedContentTypesBlankUrl;
        }

        Alfresco.util.Ajax.jsonGet({
            url: url,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    this.populateSelect(response.json.types);
                },
                scope: this
            },
            failureCallback: {
                fn: function (response) {
                    console.log(response);
                },
                scope: this
            }
        });

    },

    populateSelect: function (types) {
        var contentTypeSelectId = this.id + "-content-type-select";
        this.contentTypeSelectNode = YAHOO.util.Dom.get(contentTypeSelectId);
        this.contentTypeSelectNode.innerHTML = "";
        for (var i = 0; i < types.length; i++) {
            var current = types[i];
            var option = new Option(current, current, i === 0);
            this.contentTypeSelectNode.add(option);
        }
        YAHOO.util.Event.addListener(
            this.contentTypeSelectNode,
            "change",
            this.onContentTypeChange,
            this,
            true
        );
    },

    onContentTypeChange: function () {
        var contentType = this.contentTypeSelectNode.value;
        var formHtmlId = this.id + "-metadata-form";
        var formNode = YAHOO.util.Dom.get(formHtmlId);
        var url = YAHOO.lang.substitute(
            "{serviceContext}components/form?itemKind=type&itemId={itemId}&mode=create&submitType=json&formId={formId}&showCancelButton=true&htmlid={htmlid}",
            {
                serviceContext: Alfresco.constants.URL_SERVICECONTEXT,
                itemId: contentType,
                formId: "upload-folder",
                htmlid: formHtmlId
            }
        );

        Alfresco.util.Ajax.request({
            url: url,
            responseContentType: "html",
            execScripts: true,
            successCallback: {
                fn: function (response) {
                    formNode.innerHTML =
                        response.serverResponse.responseText;
                    var data = this.currentRecord.getData();
                    var cmNameId = this.id + "-metadata-form_prop_cm_name";
                    var cmNameNode = YAHOO.util.Dom.get(cmNameId);
                    if (cmNameNode) {
                        cmNameNode.value = data.name;
                        cmNameNode.readOnly = true;
                    }
                },
                scope: this
            },
            failureCallback: {
                fn: function (response) {
                    console.log(response);
                },
                scope: this
            }
        });
    },

    onRowsAddEvent: function (arg) {
        this.savedDialogTitle = YAHOO.util.Dom.get(this.id + "-title-span").innerText;
        this.records = arg.records;
        this.showMetadataDialog();
    },

    showMetadataDialog: function () {
        console.log("showMetadataDialog", this.records);
        if (!this.records || this.records.length == 0) {
            console.log("done");
            return this.showMainDialog();
        }
        console.log("#1");
        this.currentRecord = this.records[0];
        this.records = this.records.slice(1, this.records.length);

        var data = this.currentRecord.getData();
        console.log(data);
        YAHOO.util.Dom.get(this.id + "-title-span").innerText =
            Alfresco.util.encodeHTML(data.name);

        YAHOO.util.Dom.addClass(this.id + "-main-dialog", "hidden");
        YAHOO.util.Dom.removeClass(this.id + "-metadata-dialog", "hidden");

        this.contentTypeSelectNode.selectedIndex = 0;
        SoftwareLoop.fireEvent(this.contentTypeSelectNode, "change");
        console.log("#10");
    },

    showMainDialog: function () {
        YAHOO.util.Dom.get(this.id + "-title-span").innerText = this.savedDialogTitle;

        YAHOO.util.Dom.removeClass(this.id + "-main-dialog", "hidden");
        YAHOO.util.Dom.addClass(this.id + "-metadata-dialog", "hidden");
    },

    _createEmptyDataTable: function () {
        SoftwareLoop.FlashUploadPlus.superclass._createEmptyDataTable.apply(this, arguments);
        this.widgets.dataTable.subscribe("rowsAddEvent", this.onRowsAddEvent, this, true);
    }
});

