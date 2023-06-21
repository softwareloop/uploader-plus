(function () {
    Alfresco.logger.debug("dnd-upload-plus.js");

    SoftwareLoop.DNDUpload = function (id)
    {
        // use "null" to avoid Alfresco.component.Base + Alfresco.util.ComponentManager to override Alfresco.DNDUpload
        SoftwareLoop.DNDUpload.superclass.constructor.call(this, "null");
        
        // re-register with correct id and name
        Alfresco.util.ComponentManager.unregister(this);
        this.id = (typeof id == "undefined" || id === null) ? Alfresco.util.generateDomId() : id;
        this.name = "SoftwareLoop.DNDUpload";
        Alfresco.util.ComponentManager.register(this);
        
        return this;
    };
    
    YAHOO.lang.extend(SoftwareLoop.DNDUpload, Alfresco.DNDUpload, YAHOO.lang.merge(SoftwareLoop.UploaderPlusMixin, {
            
            spawnUploadsBooked : false,
            
            savedDialogTitle : null,
            
            records : null,
            
            currentRecordIndex : -1,
            
            show : function(config)
            {
                Alfresco.logger.debug("show", arguments);
                
                SoftwareLoop.DNDUpload.superclass.show.call(this, config);

                this.loadTypes(function () {
                    Alfresco.logger.debug("loadTypes callback");
                    this.populateSelect();
                    if (this.spawnUploadsBooked) {
                        Alfresco.logger.debug("this.spawnUploadsBooked is true");
                        this.spawnUploadsBooked = false;
                        this._spawnUploads();
                    }
                }, this);
                Alfresco.logger.debug("END show");
            },
            
            _spawnUploads: function () {
                Alfresco.logger.debug("_spawnUploads", arguments);
                
                if (!this.typesLoaded) {
                    Alfresco.logger.debug("Types not loaded yet. Postponing");
                    this.spawnUploadsBooked = true;
                    return;
                }
                
                if (!this.shouldUseSameMetadataSet) {
                	this.cleanupOldFormForNextUpload();
                }
                
                if (this.showConfig.mode === this.MODE_SINGLE_UPDATE) {
                    Alfresco.logger.debug("Single update");
                    return SoftwareLoop.DNDUpload.superclass._spawnUploads.call(this);
                }
                
                if (this.types == null) {
                    Alfresco.logger.debug("Types is null");
                    return SoftwareLoop.DNDUpload.superclass._spawnUploads.call(this);
                }
                
                this.savedDialogTitle =
                    YAHOO.util.Dom.get(this.id + "-title-span").innerText;
                this.records = this.dataTable.getRecordSet().getRecords();
                Alfresco.logger.debug("records", this.records);
                this.currentRecordIndex = 0;
                this.showMetadataDialog();
                Alfresco.logger.debug("END _spawnUploads");
            },
            
            showMetadataDialog: function () {
                Alfresco.logger.debug("showMetadataDialog", arguments);
                if (this.currentRecordIndex == this.records.length) {
                    Alfresco.logger.debug("At the end of the records array");
                    this.showMainDialog();
                    return SoftwareLoop.DNDUpload.superclass._spawnUploads.apply(this);
                }
                var currentRecord = this.records[this.currentRecordIndex];
                var data = currentRecord.getData();
                var fileId = data.id;
                var fileInfo = this.fileStore[fileId];
                if (fileInfo.state !== this.STATE_ADDED) {
                    Alfresco.logger.debug("State != STATE_ADDED");
                    return SoftwareLoop.DNDUpload.superclass._spawnUploads.apply(this);
                }

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
                SoftwareLoop.DNDUpload.superclass._resetGUI.apply(this, arguments);
                Alfresco.logger.debug("END _resetGUI");
            },

            //**************************************************************************
            // Form button handling
            //**************************************************************************


            onMetadataCancel: function (event) {
                Alfresco.logger.debug("onMetadataCancel", arguments);
                this.showMainDialog();
                this.onCancelOkButtonClick(event);
                Alfresco.logger.debug("END onMetadataCancel");
            },
            
          //**************************************************************************
            // Upload override
            //**************************************************************************

            _startUpload: function (fileInfo) {
                Alfresco.logger.debug("_startUpload", arguments);
                // Mark file as being uploaded
                fileInfo.state = this.STATE_UPLOADING;

                var url;
                if (this.showConfig.uploadURL === null)
                {
                    url = Alfresco.constants.PROXY_URI + "uploader-plus/upload";
                }
                else
                {
                    url = Alfresco.constants.PROXY_URI + this.showConfig.uploadURL;
                }
                if (Alfresco.util.CSRFPolicy.isFilterEnabled())
                {
                    url += "?" + Alfresco.util.CSRFPolicy.getParameter() + "=" + encodeURIComponent(Alfresco.util.CSRFPolicy.getToken());
                }

                if (this.uploadMethod === this.FORMDATA_UPLOAD)
                {
                    // For Browsers that support it (currently FireFox 4), the FormData object is the best
                    // object to use for file upload as it supports asynchronous multipart upload without
                    // the need to read the entire object into memory.
                    Alfresco.logger.debug("Using FormData for file upload");
                    var formData = new FormData;
                    formData.append("filedata", fileInfo.uploadData.filedata);
                    formData.append("filename", fileInfo.uploadData.filename);
                    formData.append("destination", fileInfo.uploadData.destination);
                    formData.append("uploaddirectory", fileInfo.uploadData.uploaddirectory);
                    formData.append("createdirectory", fileInfo.uploadData.createdirectory ? "true" : "false");
                    formData.append("majorVersion", fileInfo.uploadData.majorVersion ? "true" : "false");
                    formData.append("username", fileInfo.uploadData.username);
                    formData.append("overwrite", fileInfo.uploadData.overwrite);
                    formData.append("thumbnails", fileInfo.uploadData.thumbnails);
                    formData.append("updatenameandmimetype", fileInfo.uploadData.updateNameAndMimetype)

                    if (fileInfo.uploadData.updateNodeRef)
                    {
                        formData.append("updateNodeRef", fileInfo.uploadData.updateNodeRef);
                    }
                    else
                    {
                        formData.append("siteId", fileInfo.uploadData.siteId);
                        formData.append("containerId", fileInfo.uploadData.containerId);
                    }

                    if (fileInfo.uploadData.description)
                    {
                        formData.append("description", fileInfo.uploadData.description);
                    }

                    // BEGIN: uploader-plus customisations
                    Alfresco.logger.debug("fileInfo", fileInfo);

                    if (!fileInfo.propertyData) {

                        if (this.contentTypeSelectNode && this.contentTypeSelectNode.value) {
                            Alfresco.logger.debug("Appending content type", this.contentTypeSelectNode.value);
                            formData.append("contentType", this.contentTypeSelectNode.value);
                        }

                    } else {

                        if (fileInfo.propertyData.contentType) {
                            Alfresco.logger.debug("Appending content type", fileInfo.propertyData.contentType);
                            formData.append("contentType", fileInfo.propertyData.contentType);
                        }

                        Alfresco.logger.debug("Processing propertyData");
                        for (var current in fileInfo.propertyData) {
                            Alfresco.logger.debug("Current:", current);
                            if (fileInfo.propertyData.hasOwnProperty(current) &&
                                (current != "prop_mimetype" ||
                                    (current == "prop_mimetype" && YAHOO.lang.isString(fileInfo.propertyData[current]) && fileInfo.propertyData[current].length > 0)
                                )) {

                                Alfresco.logger.debug("Appending", current);
                                formData.append(current, fileInfo.propertyData[current]);
                            }
                        }
                    }
                    Alfresco.logger.debug("formData:", formData);
                    // END: uploader-plus customisations

                    fileInfo.request.open("POST",  url, true);
                    fileInfo.request.send(formData);
                    fileInfo.request.onreadystatechange = function() {
                        if (this.status === 401)
                        {
                            var redirect = this.getResponseHeader["Location"];
                            if (redirect)
                            {
                                window.location.href = window.location.protocol + "//" + window.location.host + redirect;
                                return;
                            }
                            else
                            {
                                window.location.reload(true);
                                return;
                            }
                        }
                    };
                }
                else if (this.uploadMethod === this.INMEMORY_UPLOAD)
                {
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
                    if (fileInfo.uploadData.destination !== null)
                    {
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.destination)) + rn + "--" + multipartBoundary;
                    }
                    else
                    {
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
                    if (fileInfo.uploadData.updateNodeRef)
                    {
                        customFormData += rn + "Content-Disposition: form-data; name=\"updateNodeRef\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.updateNodeRef)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.description)
                    {
                        customFormData += rn + "Content-Disposition: form-data; name=\"description\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.description)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.username)
                    {
                        customFormData += rn + "Content-Disposition: form-data; name=\"username\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.username)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.overwrite)
                    {
                        customFormData += rn + "Content-Disposition: form-data; name=\"overwrite\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.overwrite)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.uploadData.thumbnails)
                    {
                        customFormData += rn + "Content-Disposition: form-data; name=\"thumbnails\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.uploadData.thumbnails)) + rn + "--" + multipartBoundary + "--";
                    }

                    // BEGIN: uploader-plus customisations
                    if (this.contentTypeSelectNode && this.contentTypeSelectNode.value) {
                        customFormData += rn + "Content-Disposition: form-data; name=\"contentType\"";
                        customFormData += rn + rn + unescape(encodeURIComponent(this.contentTypeSelectNode.value)) + rn + "--" + multipartBoundary + "--";
                    }
                    if (fileInfo.propertyData) {
                        for (var current in fileInfo.propertyData) {
                            if (fileInfo.propertyData.hasOwnProperty(current) &&
                                (current != "prop_mimetype" ||
                                    (current == "prop_mimetype" && YAHOO.lang.isString(fileInfo.propertyData[current]) && fileInfo.propertyData[current].length > 0)
                                )) {

                                customFormData += rn + "Content-Disposition: form-data; name=\"" + current + "\"";
                                customFormData += rn + rn + unescape(encodeURIComponent(fileInfo.propertyData[current])) + rn + "--" + multipartBoundary + "--";
                            }
                        }
                    }
                    // END: uploader-plus customisations


                    fileInfo.request.open("POST",  url, true);
                    fileInfo.request.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + multipartBoundary);
                    fileInfo.request.sendAsBinary(customFormData);
                }
            }

    }));
})();
