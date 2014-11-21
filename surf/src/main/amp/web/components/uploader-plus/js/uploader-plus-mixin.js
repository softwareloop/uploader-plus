Alfresco.logger.debug("uploader-plus-mixin.js");

SoftwareLoop.UploaderPlusMixin = {

    allowedContentTypesDestinationTemplate: Alfresco.constants.PROXY_URI +
        "uploader-plus/allowed-content-types?destination={destination}",

    allowedContentTypesSiteTemplate: Alfresco.constants.PROXY_URI +
        "/uploader-plus/allowed-content-types?siteid={siteId}&containerid={containerId}&path={uploadDirectory}",

    allowedContentTypesBlankUrl: Alfresco.constants.PROXY_URI +
        "/uploader-plus/allowed-content-types",

    //**************************************************************************
    // Types list management
    //**************************************************************************

    loadTypes: function (callback) {
        Alfresco.logger.debug("loadTypes", arguments);
        var url;
        if (this.showConfig.destination) {
            Alfresco.logger.debug("Repository folder", this.showConfig.destination);
            url = YAHOO.lang.substitute(
                this.allowedContentTypesDestinationTemplate,
                {
                    destination: encodeURIComponent(this.showConfig.destination)
                }
            );
        } else if (this.showConfig.siteId) {
            Alfresco.logger.debug("Site", this.showConfig.siteId);
            url = YAHOO.lang.substitute(
                this.allowedContentTypesSiteTemplate,
                {
                    siteId: encodeURIComponent(this.showConfig.siteId),
                    containerId: encodeURIComponent(this.showConfig.containerId),
                    uploadDirectory: encodeURIComponent(this.showConfig.uploadDirectory)
                }
            );
        } else {
            Alfresco.logger.debug("Outside repository or site");
            url = this.allowedContentTypesBlankUrl;
        }

        Alfresco.util.Ajax.jsonGet({
            url: url,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    Alfresco.logger.debug("loadTypes successCallback", arguments);
                    this.types = response.json.types;
                    if (callback) {
                        callback();
                    }
                },
                scope: this
            },
            failureCallback: {
                fn: function (response) {
                    Alfresco.logger.debug("loadTypes failureCallback", arguments);
                },
                scope: this
            }
        });
        Alfresco.logger.debug("END loadTypes");
    },

    populateSelect: function () {
        Alfresco.logger.debug("populateSelect", arguments);
        if (!this.types) {
            Alfresco.logger.debug("Types == null");
            return;
        }
        var contentTypeSelectId = this.id + "-content-type-select";
        this.contentTypeSelectNode = YAHOO.util.Dom.get(contentTypeSelectId);
        this.contentTypeSelectNode.innerHTML = "";
        for (var i = 0; i < this.types.length; i++) {
            Alfresco.logger.debug("Type index", i);
            var current = this.types[i];
            var option = new Option(current, current, i === 0);
            this.contentTypeSelectNode.add(option);
        }
        YAHOO.util.Event.removeListener(this.contentTypeSelectNode, "change");
        YAHOO.util.Event.addListener(
            this.contentTypeSelectNode,
            "change",
            this.onContentTypeChange,
            this,
            true
        );
        Alfresco.logger.debug("END populateSelect");
    },

    //**************************************************************************
    // onContentTypeChange handling
    //**************************************************************************

    onContentTypeChange: function () {
        Alfresco.logger.debug("onContentTypeChange", arguments);
        var contentType = this.contentTypeSelectNode.value;
        var formHtmlId = this.id + "-metadata-form";
        var url = YAHOO.lang.substitute(
                "{serviceContext}components/form" +
                "?itemKind=type&itemId={itemId}&mode=create&submitType=json" +
                "&formId={formId}&showCancelButton=true&htmlid={htmlid}",
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
                    Alfresco.logger.debug("onContentTypeChange failureCallback", arguments);
                },
                scope: this
            }
        });
        Alfresco.logger.debug("END onContentTypeChange");
    },

    onMetadataFormReceived: function (response) {
        Alfresco.logger.debug("onMetadataFormReceived", arguments);
        var formHtmlId = this.id + "-metadata-form";
        var formNode = YAHOO.util.Dom.get(formHtmlId);
        formNode.innerHTML =
            response.serverResponse.responseText;
        var currentRecord = this.records[this.currentRecordIndex];
        var data = currentRecord.getData();
        var cmNameId = this.id + "-metadata-form_prop_cm_name";
        var cmNameNode = YAHOO.util.Dom.get(cmNameId);
        if (cmNameNode) {
            Alfresco.logger.debug("metadata-form_prop_cm_name found");
            cmNameNode.value = data.name;
            cmNameNode.readOnly = true;
        }

        this.formUi = Alfresco.util.ComponentManager.find({
            id: this.id + "-metadata-form-form",
            name: "Alfresco.FormUI"
        })[0];
        var oldOnReady = this.formUi.onReady;
        this.formUi.onReady = SoftwareLoop.hitch(this, function () {
            Alfresco.logger.debug("onReady", arguments);
            oldOnReady.apply(this.formUi, arguments);
            this.formUiFixButtons();
        });

        this.widgets.panel.center();

        Alfresco.logger.debug("END onMetadataFormReceived");
    },

    formUiFixButtons: function () {
        Alfresco.logger.debug("formUiFixButtons", arguments);
        var submitButton = this.formUi.buttons.submit;
        submitButton.removeListener("click");
        submitButton.addListener(
            "click",
            this.onMetadataSubmit,
            this,
            this
        );
        if (this.currentRecordIndex === this.records.length - 1) {
            Alfresco.logger.debug("Last document");
            submitButton.set("label", this.msg("label.ok"))
        } else {
            Alfresco.logger.debug("More documents");
            submitButton.set("label", this.msg("uploader.plus.next"))
        }
        var cancelButton = this.formUi.buttons.cancel;
        cancelButton.removeListener("click");
        cancelButton.addListener(
            "click",
            this.onMetadataCancel,
            this,
            this
        );
        Alfresco.logger.debug("END formUiFixButtons");
    }


};
