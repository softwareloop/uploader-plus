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
                fn: this.onMetadataFormReceived,
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

    onMetadataFormReceived: function (response) {
        var formHtmlId = this.id + "-metadata-form";
        var formNode = YAHOO.util.Dom.get(formHtmlId);
        formNode.innerHTML =
            response.serverResponse.responseText;
        var data = this.currentRecord.getData();
        var cmNameId = this.id + "-metadata-form_prop_cm_name";
        var cmNameNode = YAHOO.util.Dom.get(cmNameId);
        if (cmNameNode) {
            cmNameNode.value = data.name;
            cmNameNode.readOnly = true;
        }

        var formUi = Alfresco.util.ComponentManager.find({
            id: this.id + "-metadata-form-form",
            name: "Alfresco.FormUI"
        })[0];
        var oldOnReady = formUi.onReady;
        var _this = this;
        formUi.onReady = function () {
            oldOnReady.apply(formUi, arguments);
            console.log(formUi.buttons);
            var cancelButton = formUi.buttons.cancel;
            cancelButton.removeListener("click");
            cancelButton.addListener(
                "click",
                function () {
                    this.showMainDialog();
                    try {
                        this._onFileButtonClickHandler(this.currentRecord.getData().id, this.currentRecord.getId());
                        for (var i = 0; i < this.records; i++) {
                            var record = this.records[i];
                            var flashId = record.getData().id;
                            var recordId = record.getId();
                            console.log(flashId, recordId);
                            this._onFileButtonClickHandler(flashId, recordId);
                        }
                    } catch (e) {
                        SoftwareLoop.printStackTrace(e);
                    }
                },
                _this,
                _this
            );
        };

        // adjust Cancel button event handling
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
        this.currentRecord = this.records[0];
        this.records = this.records.slice(1, this.records.length);

        var data = this.currentRecord.getData();
        console.log(data);
        YAHOO.util.Dom.get(this.id + "-title-span").innerText =
            Alfresco.util.encodeHTML(data.name);

        YAHOO.util.Dom.addClass(this.id + "-main-dialog", "fake-hidden");
        YAHOO.util.Dom.removeClass(this.id + "-metadata-dialog", "hidden");

        this.contentTypeSelectNode.selectedIndex = 0;
        SoftwareLoop.fireEvent(this.contentTypeSelectNode, "change");
    },

    showMainDialog: function () {
        if (this.savedDialogTitle) {
            YAHOO.util.Dom.get(this.id + "-title-span").innerText = this.savedDialogTitle;
            delete this.savedDialogTitle;
        }

        YAHOO.util.Dom.removeClass(this.id + "-main-dialog", "fake-hidden");
        YAHOO.util.Dom.addClass(this.id + "-metadata-dialog", "hidden");
    },

    _createEmptyDataTable: function () {
        SoftwareLoop.FlashUploadPlus.superclass._createEmptyDataTable.apply(this, arguments);
        this.widgets.dataTable.subscribe("rowsAddEvent", this.onRowsAddEvent, this, true);
    },

    _resetGUI: function () {
        this.showMainDialog();
        SoftwareLoop.FlashUploadPlus.superclass._resetGUI.apply(this, arguments);
    }
});

