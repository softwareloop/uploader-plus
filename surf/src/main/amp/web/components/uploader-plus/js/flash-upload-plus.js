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

        console.log(url);

        Alfresco.util.Ajax.jsonGet({
            url: url,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    this.types = response.json.types;
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

    populateSelect: function () {
        var contentTypeNode = YAHOO.util.Dom.get(this.id + "-content-type");
        var contentTypeSelectId = this.id + "-content-type-select";
        contentTypeNode.innerHTML = "<select id='" + contentTypeSelectId + "'></select>";
        var contentTypeSelectNode = YAHOO.util.Dom.get(contentTypeSelectId);
        for (var i = 0; i < this.types.length; i++) {
            var current = this.types[i];
            var option = new Option(current, current, i === 0);
            contentTypeSelectNode.add(option);
        }
    },

    onRowsAddEvent: function (arg) {
        var records = arg.records;
        console.log(records);
        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            var data = record.getData();
            console.log(data);
        }
        YAHOO.util.Dom.addClass(this.id + "-main-dialog", "hidden");
        YAHOO.util.Dom.removeClass(this.id + "-metadata-dialog", "hidden");

        console.log("#1");
        var formHtmlId = this.id + "-metadata-form";
        var formNode = YAHOO.util.Dom.get(formHtmlId);
        var url = YAHOO.lang.substitute(
            "{serviceContext}components/form?itemKind=type&itemId={itemId}&mode=create&submitType=json&formId={formId}&showCancelButton=true&htmlid={htmlid}",
            {
                serviceContext: Alfresco.constants.URL_SERVICECONTEXT,
                itemId: "cm:content",
                formId: "upload-folder",
                htmlid: formHtmlId
            }
        );

        console.log("#2");
        Alfresco.util.Ajax.request({
            url: url,
            responseContentType: "html",
            execScripts: true,
            successCallback: {
                fn: function (response) {
                    console.log(response);
                    var text = response.serverResponse.responseText;
                    formNode.innerHTML = text;
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

        console.log("#3");
    },

    _createEmptyDataTable: function () {
        SoftwareLoop.FlashUploadPlus.superclass._createEmptyDataTable.apply(this, arguments);
        this.widgets.dataTable.subscribe("rowsAddEvent", this.onRowsAddEvent, this, true);
    }
});

