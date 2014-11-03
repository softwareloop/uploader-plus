(function () {
    var oldConstructor = Alfresco.DNDUpload;

    Alfresco.DNDUpload = function (htmlId) {
        var that = new oldConstructor(htmlId);
        YAHOO.lang.augmentObject(that, SoftwareLoop.UploaderPlusMixin);
        YAHOO.lang.augmentObject(that, {
            //**************************************************************************
            // Initialisation at show
            //**************************************************************************

            show: function (config) {
                console.debug("show");
                Alfresco.DNDUpload.prototype.show.call(this, config);

                // test if types is undefined
                // types == null means any content can be uploaded without prompting for metadata
                if (typeof(this.types) === "undefined") {
                    this.loadTypes();
                }
            },

            _spawnUploads: function () {
                console.debug("_spawnUploads", this);
                if (this.showConfig.mode === this.MODE_SINGLE_UPDATE || !this.types) {
                    return Alfresco.DNDUpload.prototype._spawnUploads.apply(this);
                }
                this.savedDialogTitle =
                    YAHOO.util.Dom.get(this.id + "-title-span").innerText;
                this.records = this.dataTable.getRecordSet().getRecords();
                console.debug("records", this.records);
                this.currentRecordIndex = 0;
                this.showMetadataDialog();
            },

            //**************************************************************************
            // Metadata dialog management
            //**************************************************************************

            showMetadataDialog: function () {
                console.debug("showMetadataDialog");
                if (this.currentRecordIndex == this.records.length) {
                    this.showMainDialog();
                    return Alfresco.DNDUpload.prototype._spawnUploads.apply(this);
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
                Alfresco.DNDUpload.prototype._resetGUI.apply(this, arguments);
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
                console.debug("processMetadata");
                var contentType = this.contentTypeSelectNode.value;
                var record = this.records[this.currentRecordIndex];
                var data = record.getData();

                var firstTdEl = this.dataTable.getFirstTdEl(record);
                var contentTypeEl = Dom.getElementsByClassName(
                    "fileupload-contentType-input", "input", firstTdEl);
                if (contentTypeEl && contentTypeEl.length === 1) {
                    contentTypeEl[0].value = contentType;
                } else {
                    console.log("contentTypeEl", contentTypeEl);
                }

                var secondTdEl = this.dataTable.getNextTdEl(firstTdEl);
                var progressInfoEl = Dom.getElementsByClassName(
                    "fileupload-progressInfo-span", "span", secondTdEl);
                if (progressInfoEl && progressInfoEl.length === 1) {
                    YAHOO.util.Dom.addClass(progressInfoEl[0], "uploader-plus");
                } else {
                    console.log("progressInfoEl", progressInfoEl);
                }
                var filesizeEl = Dom.getElementsByClassName(
                    "fileupload-filesize-span", "span", secondTdEl);
                if (filesizeEl && filesizeEl.length === 1) {
                    YAHOO.util.Dom.addClass(filesizeEl[0], "uploader-plus");
                } else {
                    console.log("filesizeEl", filesizeEl);
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
                var propertyData = formRuntime._buildAjaxForSubmit(form);
                this.fileStore[data.id].propertyData = propertyData;
                console.log("propertyData", propertyData, this);
            },

            onMetadataCancel: function (event) {
                console.debug("onMetadataCancel");
                this.showMainDialog();
                this.onCancelOkButtonClick(event);
            },

            //**************************************************************************
            // Upload override
            //**************************************************************************

            _startUpload: function (fileInfo) {
                console.debug("_startUpload", fileInfo);
                // Mark file as being uploaded
                fileInfo.state = this.STATE_UPLOADING;

                var url;
                if (this.showConfig.uploadURL === null) {
                    url = Alfresco.constants.PROXY_URI + "api/upload";
                }
                else {
                    url = Alfresco.constants.PROXY_URI + this.showConfig.uploadURL;
                }
                if (Alfresco.util.CSRFPolicy.isFilterEnabled()) {
                    url += "?" + Alfresco.util.CSRFPolicy.getParameter() + "=" + encodeURIComponent(Alfresco.util.CSRFPolicy.getToken());
                }

                if (this.uploadMethod === this.FORMDATA_UPLOAD) {
                    // For Browsers that support it (currently FireFox 4), the FormData object is the best
                    // object to use for file upload as it supports asynchronous multipart upload without
                    // the need to read the entire object into memory.
                    Alfresco.logger.debug("Using FormData for file upload");
                    var formData = new FormData;
                    formData.append("filedata", fileInfo.uploadData.filedata);
                    formData.append("filename", fileInfo.uploadData.filename);
                    formData.append("destination", fileInfo.uploadData.destination);
                    formData.append("siteId", fileInfo.uploadData.siteId);
                    formData.append("containerId", fileInfo.uploadData.containerId);
                    formData.append("uploaddirectory", fileInfo.uploadData.uploaddirectory);
                    formData.append("majorVersion", fileInfo.uploadData.majorVersion ? "true" : "false");
                    formData.append("username", fileInfo.uploadData.username);
                    formData.append("overwrite", fileInfo.uploadData.overwrite);
                    formData.append("thumbnails", fileInfo.uploadData.thumbnails);


                    if (fileInfo.uploadData.updateNodeRef) {
                        formData.append("updateNodeRef", fileInfo.uploadData.updateNodeRef);
                    }
                    if (fileInfo.uploadData.description) {
                        formData.append("description", fileInfo.uploadData.description);
                    }

                    // BEGIN: uploader-plus customisations
                    console.log("fileInfo", fileInfo);
                    if (fileInfo.propertyData) {
                        for (var current in fileInfo.propertyData) {
                            if (fileInfo.propertyData.hasOwnProperty(current) &&
                                current.indexOf("prop_") === 0) {
                                formData.append(current, fileInfo.propertyData[current]);
                            }
                        }
                    }
                    console.log("formData:", formData);
                    // END: uploader-plus customisations

                    fileInfo.request.open("POST", url, true);
                    fileInfo.request.send(formData);
                }
                else if (this.uploadMethod === this.INMEMORY_UPLOAD) {
                    Alfresco.logger.debug("Using custom multipart upload");

                    // PLEASE NOTE: Be *VERY* careful modifying the following code, this carefully constructs a multipart formatted request...
                    var multipartBoundary = "----AlfrescoCustomMultipartBoundary" + (new Date).getTime();
                    var rn = "\r\n";
                    var customFormData = "--" + multipartBoundary;

                    // Add the file parameter...
                    customFormData += rn + "Content-Disposition: form-data; name=\"filedata\"; filename=\"" + unescape(encodeURIComponent(fileInfo.uploadData.filename)) + "\"";
                    customFormData += rn + "Content-Type: image/png";
                    customFormData += rn + rn + fileInfo.uploadData.filedata.getAsBinary() + rn + "--" + multipartBoundary; // Use of getAsBinary should be fine here - in-memory upload is only used pre FF4

                    // Add the String parameters...
                    customFormData += rn + "Content-Disposition: form-data; name=\"filename\"";
                    customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.filename)) + rn + "--" + multipartBoundary;
                    customFormData += rn + "Content-Disposition: form-data; name=\"destination\"";
                    if (fileInfo.uploadData.destination !== null) {
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.destination)) + rn + "--" + multipartBoundary;
                    }
                    else {
                        customFormData += rn + rn + rn + "--" + multipartBoundary;
                    }
                    customFormData += rn + "Content-Disposition: form-data; name=\"siteId\"";
                    customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.siteId)) + rn + "--" + multipartBoundary;
                    customFormData += rn + "Content-Disposition: form-data; name=\"containerId\"";
                    customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.containerId)) + rn + "--" + multipartBoundary;
                    customFormData += rn + "Content-Disposition: form-data; name=\"uploaddirectory\"";
                    customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.uploaddirectory)) + rn + "--" + multipartBoundary + "--";
                    customFormData += rn + "Content-Disposition: form-data; name=\"majorVersion\"";
                    customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.majorVersion)) + rn + "--" + multipartBoundary + "--";
                    if (fileInfo.uploadData.updateNodeRef) {
                        customFormData += rn + "Content-Disposition: form-data; name=\"updateNodeRef\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.updateNodeRef)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.description) {
                        customFormData += rn + "Content-Disposition: form-data; name=\"description\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.description)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.username) {
                        customFormData += rn + "Content-Disposition: form-data; name=\"username\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.username)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.overwrite) {
                        customFormData += rn + "Content-Disposition: form-data; name=\"overwrite\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.overwrite)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.thumbnails) {
                        customFormData += rn + "Content-Disposition: form-data; name=\"thumbnails\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.thumbnails)) + rn + "--" + multipartBoundary + "--";
                    }

                    // BEGIN: uploader-plus customisations
                    if (fileInfo.propertyData) {
                        for (var current in fileInfo.propertyData) {
                            if (fileInfo.propertyData.hasOwnProperty(current) &&
                                current.indexOf("prop_") === 0) {
                                customFormData += rn + "Content-Disposition: form-data; name=\"" + current + "\"";
                                customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.propertyData[current])) + rn + "--" + multipartBoundary + "--";
                            }
                        }
                    }
                    // END: uploader-plus customisations


                    fileInfo.request.open("POST", url, true);
                    fileInfo.request.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + multipartBoundary);
                    fileInfo.request.sendAsBinary(customFormData);
                }
            }

        }, true);
        return that;
    };
    Alfresco.DNDUpload.superclass = oldConstructor.superclass;
    Alfresco.DNDUpload.prototype = oldConstructor.prototype;
})();
