SoftwareLoop.FlashUploadPlus = function (htmlId) {
    SoftwareLoop.FlashUploadPlus.superclass.constructor.call(this, htmlId);
    return this;
};

YAHOO.extend(SoftwareLoop.FlashUploadPlus, Alfresco.FlashUpload, {

    //**************************************************************************
    // Initialisation at show
    //**************************************************************************

    show: function (config) {
        console.debug("show");
        Alfresco.FlashUpload.prototype.show.call(this, config);

        // test if types is undefined
        // types == null means any content can be uploaded without prompting for metadata
        if (typeof(this.types) === "undefined") {
            this.loadTypes();
        }
    },

    //**************************************************************************
    // onRowsAddEvent listener setup
    //**************************************************************************

    _createEmptyDataTable: function () {
        Alfresco.FlashUpload.prototype._createEmptyDataTable.apply(
            this, arguments
        );
        this.widgets.dataTable.subscribe(
            "rowsAddEvent", this.onRowsAddEvent, this, true
        );
    },

    //**************************************************************************
    // onRowsAddEvent management
    //**************************************************************************

    onRowsAddEvent: function (arg) {
        console.debug("onRowsAddEvent", arg);
        if (this.showConfig.mode === this.MODE_SINGLE_UPDATE || !this.types) {
            return;
        }
        this.savedDialogTitle =
            YAHOO.util.Dom.get(this.id + "-title-span").innerText;
        this.records = arg.records;
        this.currentRecordIndex = 0;
        this.showMetadataDialog();
    },

    _resetGUI: function () {
        this.showMainDialog();
        Alfresco.FlashUpload.prototype._resetGUI.apply(this, arguments);
    },

    //**************************************************************************
    // Upload override
    //**************************************************************************

    _uploadFromQueue: function (noOfUploadsToStart) {
        // generate upload POST url
        var url;
        if (this.showConfig.uploadURL === null) {
            url = Alfresco.constants.PROXY_URI + "api/upload";
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
                    console.log("fileInfo", fileInfo);
                    if (fileInfo.formData) {
                        for (var current in fileInfo.formData) {
                            if (fileInfo.formData.hasOwnProperty(current) &&
                                current.indexOf("prop_") === 0) {
                                attributes[current] = fileInfo.formData[current];
                            }
                        }
                    }
                    console.log("Attributes:", attributes);
                    // END: uploader-plus customisations

                }

                this.uploader.upload(flashId, url, "POST", attributes, "filedata");
                startedUploads++;
            }
        }
    }

});

YAHOO.lang.augmentObject(SoftwareLoop.FlashUploadPlus.prototype, SoftwareLoop.UploaderPlusMixin);