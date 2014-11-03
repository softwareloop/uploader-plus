(function () {
    var oldConstructor = Alfresco.FlashUpload;

    Alfresco.FlashUpload = function (htmlId) {
        var that = new oldConstructor(htmlId);
        YAHOO.lang.augmentObject(that, SoftwareLoop.UploaderPlusMixin);
        YAHOO.lang.augmentObject(that, {
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

            //**************************************************************************
            // Metadata dialog management
            //**************************************************************************

            showMetadataDialog: function () {
                console.debug("showMetadataDialog");
                if (this.currentRecordIndex == this.records.length) {
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
            },

            showMainDialog: function () {
                console.debug("showMainDialog");
                if (this.savedDialogTitle) {
                    YAHOO.util.Dom.get(this.id + "-title-span").innerText =
                        this.savedDialogTitle;
                    delete this.savedDialogTitle;
                }

                delete this.records;
                delete this.currentRecordIndex;

                YAHOO.util.Dom.removeClass(this.id + "-main-dialog", "fake-hidden");
                YAHOO.util.Dom.addClass(this.id + "-metadata-dialog", "hidden");
            },

            _resetGUI: function () {
                console.debug("_resetGUI");
                this.showMainDialog();
                Alfresco.FlashUpload.prototype._resetGUI.apply(this, arguments);
            },

            //**************************************************************************
            // Form button handling
            //**************************************************************************

            onMetadataSubmit: function () {
                console.debug("onMetadataSubmit", this.formUi);
                this.formUi.formsRuntime._setAllFieldsAsVisited();
                if (this.formUi.formsRuntime.validate()) {
                    this.processMetadata();
                    this.currentRecordIndex++;
                    this.showMetadataDialog();
                } else {
                    Alfresco.util.PopupManager.displayMessage({
                        text: this.msg("validation.errors.correct.before.proceeding")
                    });
                }
            },

            processMetadata: function () {
                var contentType = this.contentTypeSelectNode.value;
                var record = this.records[this.currentRecordIndex];
                var data = record.getData();

                var firstTdEl = this.widgets.dataTable.getFirstTdEl(record);
                var contentTypeEl = Dom.getElementsByClassName(
                    "fileupload-contentType-input", "input", firstTdEl);
                if (contentTypeEl && contentTypeEl.length === 1) {
                    contentTypeEl[0].value = contentType;
                } else {
                    console.log("contentTypeEl", contentTypeEl);
                }

                var secondTdEl = this.widgets.dataTable.getNextTdEl(firstTdEl);
                var progressInfoEl = Dom.getElementsByClassName(
                    "fileupload-progressInfo-span", "span", secondTdEl);
                if (progressInfoEl && progressInfoEl.length === 1) {
                    YAHOO.util.Dom.addClass(progressInfoEl[0], "uploader-plus");
                } else {
                    console.log("progressInfoEl", progressInfoEl);
                }
                var typeInfoEl = Dom.getElementsByClassName(
                    "fileupload-typeInfo-span", "span", secondTdEl);
                if (typeInfoEl && typeInfoEl.length === 1) {
                    YAHOO.util.Dom.removeClass(typeInfoEl[0], "hidden");
                    typeInfoEl[0].innerHTML =
                        Alfresco.util.encodeHTML("Content type: " + contentType);
                } else {
                    console.log("typeInfoEl", typeInfoEl);
                }

                var formRuntime = this.formUi.formsRuntime;
                var form = Dom.get(formRuntime.formId);
                var formData = formRuntime._buildAjaxForSubmit(form);
                this.fileStore[data.id].formData = formData;
                console.log("formData", formData, this);
            },

            onMetadataCancel: function () {
                console.debug("onMetadataCancel");
                this.records.reverse();
                for (var i = 0; i < this.records.length; i++) {
                    var record = this.records[i];
                    var flashId = record.getData().id;
                    var recordId = record.getId();
                    this._onFileButtonClickHandler(flashId, recordId);
                }
                this.showMainDialog();
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
        }, true);
        return that;
    };
    Alfresco.FlashUpload.superclass = oldConstructor.superclass;
    Alfresco.FlashUpload.prototype = oldConstructor.prototype;
})();
