(function () {
    Alfresco.logger.debug("uploader-plus-mixin.js");

    SoftwareLoop.UploaderPlusMixin = {
    
        allowedContentTypesDestinationTemplate: Alfresco.constants.PROXY_URI +
            "uploader-plus/allowed-content-types?destination={destination}",
    
        allowedContentTypesSiteTemplate: Alfresco.constants.PROXY_URI +
            "uploader-plus/allowed-content-types?siteid={siteId}&containerid={containerId}&path={uploadDirectory}",
    
        allowedContentTypesBlankUrl: Alfresco.constants.PROXY_URI +
            "uploader-plus/allowed-content-types",
            
        types : null,
        
        typesLoaded : false,

        /**
         *  Indicates wether we will or not use the first metadata form for the whole batch of documents
         *
         *  @property shouldUseSameMetadataSet
         *  @type boolean
         *  @default false
         *  */
        shouldUseSameMetadataSet : false,
    
        //**************************************************************************
        // Types list management
        //**************************************************************************
    
        loadTypes: function (callback, scope) {
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
                        this.typesLoaded = true;
                        
                        if (callback) {
                            if (scope !== undefined)
                            {
                                callback.call(scope);
                            }
                            else
                            {
                                callback.call(this);
                            }
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
            if (this.types == null) {
                Alfresco.logger.debug("Types == null");
                return;
            }
            var contentTypeSelectId = this.id + "-content-type-select";
            this.contentTypeSelectNode = YAHOO.util.Dom.get(contentTypeSelectId);
            this.contentTypeSelectNode.innerHTML = "";
            for (var i = 0; i < this.types.length; i++) {
                Alfresco.logger.debug("Type index", i);
                var current = this.types[i];
                var option = new Option(this.msg("type." + current.replace(":", "_")), current, i === 0);
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
                cmNameNode.readOnly = false;
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

            var useSameMetadataSetCBId = this.id + "-same-metadata-set-cb";
            this.useSameMetadataSetCBNode = YAHOO.util.Dom.get(useSameMetadataSetCBId);
            YAHOO.util.Event.removeListener(this.useSameMetadataSetCBNode, "change");
            this.hideUseSameMetadataSet();
            // Only show the useSameMatadataSet option if we are on the first record, on we have more than one record
            if (this.currentRecordIndex === 0 && this.records.length > 1) {
                this.showUseSameMetadataSet();
            }

            var formFieldsId = this.id + "-metadata-form-form-fields";
            YAHOO.util.Dom.setStyle(formFieldsId, 'max-height', '2000px');
            YAHOO.util.Dom.setStyle(formFieldsId, 'overflow-x', 'auto');

    
            this.centerPanel();
    
            Alfresco.logger.debug("END onMetadataFormReceived");
        },

        /**
         * Hides the checkbox for using the same metadata form for the whole batch
         */
        hideUseSameMetadataSet: function(){
            this.useSameMetadataSetCBNode.checked = false;
            this.shouldUseSameMetadataSet = this.useSameMetadataSetCBNode.checked;
            var useSameMetadataSetId = this.id + "-same-metadata-set";
            YAHOO.util.Dom.setStyle(useSameMetadataSetId, 'display', 'none');
            YAHOO.util.Event.removeListener(this.useSameMetadataSetCBNode, "change");
        },

        /**
         * Shows the checkbox for using the same metadata form for the whole batch
         */
        showUseSameMetadataSet: function(){
            this.useSameMetadataSetCBNode.checked = false;
            this.shouldUseSameMetadataSet = this.useSameMetadataSetCBNode.checked;
            SoftwareLoop.fireEvent(this.useSameMetadataSetCBNode, "change");
            var useSameMetadataSetId = this.id + "-same-metadata-set";
            YAHOO.util.Dom.setStyle(useSameMetadataSetId, 'display', 'inline');
            YAHOO.util.Event.addListener(
                this.useSameMetadataSetCBNode,
                "change",
                this.onUseSameMetadataSetCBChange,
                this,
                true
            );
        },

        /**
         * Handles the changes on the checkBox for enabling/disabling the use of the first metadata form for the whole
         * batch
         */
        onUseSameMetadataSetCBChange: function(){
            this.shouldUseSameMetadataSet = this.useSameMetadataSetCBNode.checked;
            var submitButton = this.formUi.buttons.submit;
            var cmNameId = this.id + "-metadata-form_prop_cm_name";
            var cmNameNode = YAHOO.util.Dom.get(cmNameId);
            if (this.shouldUseSameMetadataSet){
                submitButton.set("label", this.msg("label.ok"));
                // If we are setting the same metadata set to all documents, we really should not display a cm:name
                // property field
                if (cmNameNode) {
                    YAHOO.util.Dom.setStyle(cmNameNode.parentNode, 'display', 'none');
                }
            }else if (this.currentRecordIndex !== this.records.length - 1) {
                submitButton.set("label", this.msg("uploader.plus.next"))
                if (cmNameNode) {
                    YAHOO.util.Dom.setStyle(cmNameNode.parentNode, 'display', 'inline-block');
                }
            }
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
        },
    
        //**************************************************************************
        // Form button handling
        //**************************************************************************
    
        onMetadataSubmit: function () {
            Alfresco.logger.debug("onMetadataSubmit", arguments);
            this.formUi.formsRuntime._setAllFieldsAsVisited();
            if (this.formUi.formsRuntime._runValidations(null, null, Alfresco.forms.Form.NOTIFICATION_LEVEL_CONTAINER)) {
                Alfresco.logger.debug("Form validated");
                do {
                    this.processMetadata();
                    var currentRecord = this.records[this.currentRecordIndex];
                    var data = currentRecord.getData();
                    var fileId = data.id;
                    var fileInfo = this.fileStore[fileId];
                    // If we are setting the same metadata set to all documents, and we have a cm:name property field
                    // we really should update it
                    if (this.shouldUseSameMetadataSet && fileInfo.propertyData.prop_cm_name){
                        // Override prop_cm_name in case we are using the same metadata set for multiple documents
                        // This property is already set to readonly in @onMetadataFormReceived
                        fileInfo.propertyData.prop_cm_name = this.fileStore[fileId].fileName;
                    }
                }while((++this.currentRecordIndex<this.records.length) && this.shouldUseSameMetadataSet);
                this.showMetadataDialog();
            } else {
                Alfresco.logger.debug("Form with errors");
            }
            Alfresco.logger.debug("END onMetadataSubmit");
        },
    
        processMetadata: function () {
            Alfresco.logger.debug("processMetadata", arguments);
            var contentType = this.contentTypeSelectNode.value;
            var record = this.records[this.currentRecordIndex];
            var data = record.getData();
    
            var cmNameId = this.id + "-metadata-form_prop_cm_name", cmNameNode = YAHOO.util.Dom.get(cmNameId);
            if (cmNameNode) {
               var fileInfo = this.fileStore[data.id];
               data.name = cmNameNode.value;
               fileInfo.uploadData.filename = cmNameNode.value;
            }
            
            var dataTable = this.getDataTable();
            var firstTdEl = dataTable.getFirstTdEl(record);
            var contentTypeEl = Dom.getElementsByClassName(
                "fileupload-contentType-input", "input", firstTdEl);
            if (contentTypeEl && contentTypeEl.length === 1) {
                Alfresco.logger.debug("fileupload-contentType-input found");
                contentTypeEl[0].value = contentType;
            } else {
                Alfresco.logger.debug("fileupload-contentType-input not found");
            }
    
            var secondTdEl = dataTable.getNextTdEl(firstTdEl);
            var progressInfoEl = Dom.getElementsByClassName(
                "fileupload-progressInfo-span", "span", secondTdEl);
            if (progressInfoEl && progressInfoEl.length === 1) {
                Alfresco.logger.debug("fileupload-progressInfo-span found");
                YAHOO.util.Dom.addClass(progressInfoEl[0], "uploader-plus");
                $(progressInfoEl[0]).html(data.name);
                $(progressInfoEl[0]).parent().prop('title', data.name);
            } else {
                Alfresco.logger.debug("fileupload-progressInfo-span not found");
            }
            var filesizeEl = Dom.getElementsByClassName(
                "fileupload-filesize-span", "span", secondTdEl);
            if (filesizeEl && filesizeEl.length === 1) {
                Alfresco.logger.debug("fileupload-filesize-span found");
                YAHOO.util.Dom.addClass(filesizeEl[0], "uploader-plus");
            } else {
                Alfresco.logger.debug("fileupload-filesize-span not found");
            }
            var typeInfoEl = Dom.getElementsByClassName(
                "fileupload-typeInfo-span", "span", secondTdEl);
            if (typeInfoEl && typeInfoEl.length === 1) {
                Alfresco.logger.debug("fileupload-typeInfo-span found");
                YAHOO.util.Dom.removeClass(typeInfoEl[0], "hidden");
                typeInfoEl[0].innerHTML =
                    Alfresco.util.encodeHTML(this.msg("content.type") + ": " + contentType);
            } else {
                Alfresco.logger.debug("fileupload-typeInfo-span not found");
            }
    
            var formRuntime = this.formUi.formsRuntime;
            var form = Dom.get(formRuntime.formId);
            var propertyData = formRuntime._buildAjaxForSubmit(form);
            propertyData.contentType = contentType;
            this.fileStore[data.id].propertyData = propertyData;
            Alfresco.logger.debug("END processMetadata", propertyData);
        },
    
        //**************************************************************************
        // Compatibility abstractions
        //**************************************************************************
    
        getDataTable: function () {
            Alfresco.logger.debug("getDataTable", arguments);
            if (this.dataTable) {
                Alfresco.logger.debug("this.dataTable");
                return this.dataTable;
            } else {
                Alfresco.logger.debug("this.widgets.dataTable");
                return this.widgets.dataTable;
            }
        },
    
        getPanel: function () {
            Alfresco.logger.debug("getPanel", arguments);
            if (this.widgets.panel) {
                Alfresco.logger.debug("4.2.x-style panel");
                return this.widgets.panel;
            } else {
                Alfresco.logger.debug("5.0.x-style panel");
                return this.panel;
            }
        },
    
        centerPanel: function () {
            Alfresco.logger.debug("centerPanel", arguments);
            this.getPanel().center();
            Alfresco.logger.debug("END centerPanel");
        }
    
    };
})();
