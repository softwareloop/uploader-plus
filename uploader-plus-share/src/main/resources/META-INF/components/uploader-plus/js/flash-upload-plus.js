(function () {
    Alfresco.logger.debug("flash-upload-plus.js");
    
    SoftwareLoop.FlashUpload = function (id)
    {
        // use "null" to avoid Alfresco.component.Base + Alfresco.util.ComponentManager to override Alfresco.DNDUpload
        SoftwareLoop.FlashUpload.superclass.constructor.call(this, "null");
        
        // re-register with correct id and name
        Alfresco.util.ComponentManager.unregister(this);
        this.id = (typeof id == "undefined" || id === null) ? Alfresco.util.generateDomId() : id;
        this.name = "SoftwareLoop.FlashUpload";
        Alfresco.util.ComponentManager.register(this);
        
        return this;
    };
    
    YAHOO.lang.extend(SoftwareLoop.FlashUpload, Alfresco.FlashUpload, YAHOO.lang.merge(SoftwareLoop.UploaderPlusMixin, {
        
        savedDialogTitle : null,
        
        records : null,
        
        currentRecordIndex : -1,
        
        //**************************************************************************
        // Initialisation at show
        //**************************************************************************
        show: function (config) {
            Alfresco.logger.debug("show", arguments);
            
            SoftwareLoop.FlashUpload.superclass.show.call(this, config);

            if (!this.shouldUseSameMetadataSet) {
            	this.cleanupOldFormForNextUpload();
            }

            this.loadTypes(this.populateSelect, this);
            Alfresco.logger.debug("END show");
        },
        
        //**************************************************************************
        // onRowsAddEvent listener setup
        //**************************************************************************

        _createEmptyDataTable: function () {
            Alfresco.logger.debug("_createEmptyDataTable", arguments);
            SoftwareLoop.FlashUpload.superclass._createEmptyDataTable.apply(
                this, arguments
            );
            this.widgets.dataTable.subscribe(
                "rowsAddEvent", this.onRowsAddEvent, this, true
            );
            Alfresco.logger.debug("END _createEmptyDataTable");
        },
        
        //**************************************************************************
        // onRowsAddEvent listener setup
        //**************************************************************************

        _createEmptyDataTable: function () {
            Alfresco.logger.debug("_createEmptyDataTable", arguments);
            SoftwareLoop.FlashUpload.superclass._createEmptyDataTable.apply(
                this, arguments
            );
            this.widgets.dataTable.subscribe(
                "rowsAddEvent", this.onRowsAddEvent, this, true
            );
            Alfresco.logger.debug("END _createEmptyDataTable");
        },
        
        //**************************************************************************
        // onRowsAddEvent listener setup
        //**************************************************************************

        _createEmptyDataTable: function () {
            Alfresco.logger.debug("_createEmptyDataTable", arguments);
            SoftwareLoop.FlashUpload.superclass._createEmptyDataTable.apply(
                this, arguments
            );
            this.widgets.dataTable.subscribe(
                "rowsAddEvent", this.onRowsAddEvent, this, true
            );
            Alfresco.logger.debug("END _createEmptyDataTable");
        },

        //**************************************************************************
        // onRowsAddEvent management
        //**************************************************************************

        onRowsAddEvent: function (arg) {
            Alfresco.logger.debug("onRowsAddEvent", arguments);
            if (this.showConfig.mode === this.MODE_SINGLE_UPDATE) {
                Alfresco.logger.debug("Single update");
                return;
            }
            if (this.types == null) {
                Alfresco.logger.debug("Types is null");
                return;
            }
            this.savedDialogTitle =
                YAHOO.util.Dom.get(this.id + "-title-span").innerText;
            this.records = arg.records;
            this.currentRecordIndex = 0;
            this.showMetadataDialog();
            Alfresco.logger.debug("END onRowsAddEvent");
        },
        
        //**************************************************************************
        // Metadata dialog management
        //**************************************************************************

        showMetadataDialog: function () {
            Alfresco.logger.debug("showMetadataDialog", arguments);
            if (this.currentRecordIndex == this.records.length) {
                Alfresco.logger.debug("At the end of the records array");
                return this.showMainDialog();
            }
            var currentRecord = this.records[this.currentRecordIndex];
            var data = currentRecord.getData();
            YAHOO.util.Dom.get(this.id + "-title-span").innerText =
                Alfresco.util.encodeHTML(data.name);

            YAHOO.util.Dom.addClass(this.id + "-main-dialog", "fake-hidden");
            YAHOO.util.Dom.removeClass(this.id + "-metadata-dialog", "hidden");

            this.contentTypeSelectNode.selectedIndex = 0;
            SoftwareLoop.fireEvent(this.contentTypeSelectNode, "change");
            Alfresco.logger.debug("END showMetadataDialog");
        },
        
        showMainDialog: function () {
            Alfresco.logger.debug("showMainDialog", arguments);
            if (this.savedDialogTitle != null) {
                Alfresco.logger.debug("Restore saved dialog title");
                YAHOO.util.Dom.get(this.id + "-title-span").innerText =
                    this.savedDialogTitle;
                this.savedDialogTitle = null;
            }

            this.records = null;
            this.currentRecordIndex = -1;

            YAHOO.util.Dom.removeClass(this.id + "-main-dialog", "fake-hidden");
            YAHOO.util.Dom.addClass(this.id + "-metadata-dialog", "hidden");
            this.centerPanel();
            Alfresco.logger.debug("END showMainDialog");
        },
        
        _resetGUI: function () {
            Alfresco.logger.debug("_resetGUI", arguments);
            this.showMainDialog();
            SoftwareLoop.FlashUpload.superclass._resetGUI.apply(this, arguments);
            Alfresco.logger.debug("END _resetGUI");
        },
        
        //**************************************************************************
        // Form button handling
        //**************************************************************************

        onMetadataCancel: function () {
            Alfresco.logger.debug("onMetadataCancel", arguments);
            this.records.reverse();
            for (var i = 0; i < this.records.length; i++) {
                var record = this.records[i];
                Alfresco.logger.debug("Canceling record:", record);
                var flashId = record.getData().id;
                var recordId = record.getId();
                this._onFileButtonClickHandler(flashId, recordId);
            }
            this.showMainDialog();
            Alfresco.logger.debug("END onMetadataCancel");
        },
        
        //**************************************************************************
        // Upload override
        //**************************************************************************

        _uploadFromQueue: function (noOfUploadsToStart) {
            Alfresco.logger.debug("_uploadFromQueue", arguments);
            // generate upload POST url
            var url;
            if (this.showConfig.uploadURL === null) {
                url = Alfresco.constants.PROXY_URI + "uploader-plus/upload";
            }
            else {
                url = Alfresco.constants.PROXY_URI + this.showConfig.uploadURL;
            }

            // Flash does not correctly bind to the session cookies during POST
            // so we manually patch the jsessionid directly onto the URL instead
            // also include the CSRF token to pass the CSRF token filter
            url += ";jsessionid=" + YAHOO.util.Cookie.get("JSESSIONID") + "?lang=" + Alfresco.constants.JS_LOCALE;

            // Pass the CSRF token if the CSRF token filter is enabled
            if (Alfresco.util.CSRFPolicy.isFilterEnabled()) {
                url += "&" + Alfresco.util.CSRFPolicy.getParameter() + "=" + encodeURIComponent(Alfresco.util.CSRFPolicy.getToken());
            }

            // Find files to upload
            var startedUploads = 0,
                length = this.widgets.dataTable.getRecordSet().getLength(),
                record, flashId, fileInfo, attributes;

            for (var i = 0; i < length && startedUploads < noOfUploadsToStart; i++) {
                record = this.widgets.dataTable.getRecordSet().getRecord(i);
                flashId = record.getData("id");
                fileInfo = this.fileStore[flashId];
                if (fileInfo.state === this.STATE_BROWSING) {
                    // Upload has NOT been started for this file, start it now
                    fileInfo.state = this.STATE_UPLOADING;

                    attributes =
                    {
                        username: this.showConfig.username
                    };

                    // Site or Non-site (Repository) mode
                    if (this.showConfig.siteId !== null) {
                        attributes.siteId = this.showConfig.siteId;
                        attributes.containerId = this.showConfig.containerId;
                    }
                    else if (this.showConfig.destination !== null) {
                        attributes.destination = this.showConfig.destination
                    }

                    if (this.showConfig.mode === this.MODE_SINGLE_UPDATE) {
                        attributes.updateNodeRef = this.showConfig.updateNodeRef;
                        attributes.majorVersion = !this.minorVersion.checked;
                        attributes.description = this.description.value;
                    }
                    else {
                        if (this.showConfig.uploadDirectory !== null) {
                            attributes.uploadDirectory = this.showConfig.uploadDirectory;
                        }
                        if (fileInfo.contentType) {
                            if (fileInfo.contentType.tagName.toLowerCase() == "select") {
                                attributes.contentType = fileInfo.contentType.options[fileInfo.contentType.selectedIndex].value;
                            }
                            else {
                                attributes.contentType = fileInfo.contentType.value;
                            }
                        }
                        attributes.overwrite = this.showConfig.overwrite;
                        if (this.showConfig.thumbnails) {
                            attributes.thumbnails = this.showConfig.thumbnails;
                        }
                        // BEGIN: uploader-plus customisations
                        Alfresco.logger.debug("fileInfo", fileInfo);
                        if (fileInfo.propertyData) {
                            Alfresco.logger.debug("Processing propertyData");
                            for (var current in fileInfo.propertyData) {
                                Alfresco.logger.debug("Current:", current);
                                if (fileInfo.propertyData.hasOwnProperty(current) &&
                                        (current != "prop_mimetype" ||
                                                (current == "prop_mimetype" && YAHOO.lang.isString(fileInfo.propertyData[current]) && fileInfo.propertyData[current].length > 0)
                                        )) {
                                    Alfresco.logger.debug("Adding attribute", current);
                                    attributes[current] = fileInfo.propertyData[current];
                                }
                            }
                        }
                        Alfresco.logger.debug("Attributes:", attributes);
                        // END: uploader-plus customisations

                    }

                    this.uploader.upload(flashId, url, "POST", attributes, "filedata");
                    startedUploads++;
                }
            }
        }
    }));
    
})();
