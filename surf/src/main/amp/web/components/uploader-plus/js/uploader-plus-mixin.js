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

    loadTypes: function () {
        console.debug("loadTypes");
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
                    this.types = response.json.types;
                    this.populateSelect();
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
        console.debug("populateSelect");
        if (!this.types) {
            return;
        }
        var contentTypeSelectId = this.id + "-content-type-select";
        this.contentTypeSelectNode = YAHOO.util.Dom.get(contentTypeSelectId);
        this.contentTypeSelectNode.innerHTML = "";
        for (var i = 0; i < this.types.length; i++) {
            var current = this.types[i];
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

    //**************************************************************************
    // onContentTypeChange handling
    //**************************************************************************

    onContentTypeChange: function () {
        console.debug("onContentTypeChange");
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
                    console.log(response);
                },
                scope: this
            }
        });
    },

    onMetadataFormReceived: function (response) {
        console.debug("onMetadataFormReceived");
        var formHtmlId = this.id + "-metadata-form";
        var formNode = YAHOO.util.Dom.get(formHtmlId);
        formNode.innerHTML =
            response.serverResponse.responseText;
        var currentRecord = this.records[this.currentRecordIndex];
        var data = currentRecord.getData();
        var cmNameId = this.id + "-metadata-form_prop_cm_name";
        var cmNameNode = YAHOO.util.Dom.get(cmNameId);
        if (cmNameNode) {
            cmNameNode.value = data.name;
            cmNameNode.readOnly = true;
        }

        this.formUi = Alfresco.util.ComponentManager.find({
            id: this.id + "-metadata-form-form",
            name: "Alfresco.FormUI"
        })[0];
        var oldOnReady = this.formUi.onReady;
        this.formUi.onReady = SoftwareLoop.hitch(this, function () {
            oldOnReady.apply(this.formUi, arguments);
            this.formUiFixButtons();
        });
    },

    formUiFixButtons: function () {
        console.debug("formUiFixButtons");
        var submitButton = this.formUi.buttons.submit;
        submitButton.removeListener("click");
        submitButton.addListener(
            "click",
            this.onMetadataSubmit,
            this,
            this
        );
        if (this.currentRecordIndex === this.records.length - 1) {
            submitButton.set("label", "Ok")
        } else {
            submitButton.set("label", "Next")
        }
        var cancelButton = this.formUi.buttons.cancel;
        cancelButton.removeListener("click");
        cancelButton.addListener(
            "click",
            this.onMetadataCancel,
            this,
            this
        );
    }


};
