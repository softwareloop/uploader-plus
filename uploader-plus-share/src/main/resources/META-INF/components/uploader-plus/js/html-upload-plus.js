(function () {
    Alfresco.logger.debug("html-upload-plus.js");
    
    SoftwareLoop.HtmlUpload = function (id)
    {
        // use "null" to avoid Alfresco.component.Base + Alfresco.util.ComponentManager to override Alfresco.DNDUpload
        SoftwareLoop.HtmlUpload.superclass.constructor.call(this, "null");
        
        // re-register with correct id and name
        Alfresco.util.ComponentManager.unregister(this);
        this.id = (typeof id == "undefined" || id === null) ? Alfresco.util.generateDomId() : id;
        this.name = "SoftwareLoop.HtmlUpload";
        Alfresco.util.ComponentManager.register(this);
        
        return this;
    };
    
    YAHOO.lang.extend(SoftwareLoop.HtmlUpload, Alfresco.HtmlUpload, YAHOO.lang.merge(SoftwareLoop.UploaderPlusMixin, {
        
            records : null,
            
            currentRecordIndex : -1,
            
            //**************************************************************************
            // Initialisation at show
            //**************************************************************************
            
            show: function (config) {
                Alfresco.logger.debug("show", arguments);
                this.showMainDialog();
                
                SoftwareLoop.HtmlUpload.superclass.show.call(this, config);
                
                if (!this.shouldUseSameMetadataSet) {
                	this.cleanupOldFormForNextUpload();
                }

                this.loadTypes(function () {
                    Alfresco.logger.debug("loadTypes callback");
                    this.populateSelect();
                    if (this.types != null) {
                        Alfresco.logger.debug("this.types is not null");
                        this.fixButtons();
                    }
                }, this);
                Alfresco.logger.debug("END show");
            },
            
            fixButtons: function () {
                Alfresco.logger.debug("fixButtons", arguments);
                this.widgets.uploadButton.set("label", this.msg("uploader.plus.next"));
                this.widgets.uploadButton.removeListener("click");
                this.widgets.uploadButton.on(
                        "click", function (event) {
                            Alfresco.logger.debug("uploadButton callback", event);
                            this.widgets.form._setAllFieldsAsVisited();
                            if (this.widgets.form.validate()) {
                                Alfresco.logger.debug("Form validation passed");
                                this.showMetadataDialog();
                            }
                        }, this, this);
                Alfresco.logger.debug("END fixButtons");
            },
            
            //**************************************************************************
            // Metadata dialog management
            //**************************************************************************
            
            showMetadataDialog: function () {
                Alfresco.logger.debug("showMetadataDialog", arguments);
                YAHOO.util.Dom.addClass(this.id + "-main-dialog", "fake-hidden");
                YAHOO.util.Dom.removeClass(this.id + "-metadata-dialog", "hidden");
                
                var filename;
                if (this.widgets.filedata.files) {
                    Alfresco.logger.debug("Filedata files available");
                    filename = this.widgets.filedata.files[0].name;
                } else {
                    Alfresco.logger.debug("IE-style full path");
                    var path = this.widgets.filedata.value;
                    filename = path.substring(path.lastIndexOf('\\') + 1);
                }
                
                this.currentRecordIndex = 0;
                this.records = [];
                this.records.push({
                    getData: function () {
                        Alfresco.logger.debug("getData callback");
                        return {
                            name: filename
                        }
                    }
                });
                
                SoftwareLoop.fireEvent(this.contentTypeSelectNode, "change");
                Alfresco.logger.debug("END showMetadataDialog");
            },
            
            showMainDialog: function () {
                Alfresco.logger.debug("showMainDialog", arguments);
                this.records = null;
                this.currentRecordIndex = -1;
                
                YAHOO.util.Dom.removeClass(this.id + "-main-dialog", "fake-hidden");
                YAHOO.util.Dom.addClass(this.id + "-metadata-dialog", "hidden");
                this.centerPanel();
                Alfresco.logger.debug("END showMainDialog");
            },
            
            //**************************************************************************
            // Form button handling
            //**************************************************************************
            
            onMetadataSubmit: function (event) {
                Alfresco.logger.debug("onMetadataSubmit", arguments);
                this.formUi.formsRuntime._setAllFieldsAsVisited();
                if (this.formUi.formsRuntime.validate()) {
                    Alfresco.logger.debug("Form validated");
                    this.processMetadata();
                    this.widgets.form._submitInvoked.call(this.widgets.form, event);
                } else {
                    Alfresco.logger.debug("Form with errors");
                    Alfresco.util.PopupManager.displayMessage({
                        text: this.msg("validation.errors.correct.before.proceeding")
                    });
                }
                Alfresco.logger.debug("END onMetadataSubmit");
            },
            
            processMetadata: function () {
                Alfresco.logger.debug("processMetadata", arguments);
                var contentTypeInputNode =
                    YAHOO.util.Dom.get(
                            this.id + "-contentTypeInput");
                if (contentTypeInputNode) {
                    Alfresco.logger.debug("contentTypeInputNode found");
                    contentTypeInputNode.value =
                        this.contentTypeSelectNode.value;
                }
                
                var formRuntime = this.formUi.formsRuntime;
                var form = Dom.get(formRuntime.formId);
                var propertyData = formRuntime._buildAjaxForSubmit(form);

                var submitForm =
                    YAHOO.util.Dom.get(this.widgets.form.formId);
                for (var current in propertyData) {
                    Alfresco.logger.debug("Current:", current);
                    if (propertyData.hasOwnProperty(current) &&
                            (current != "prop_mimetype" ||
                                    (current == "prop_mimetype" && YAHOO.lang.isString(propertyData[current]) && propertyData[current].length > 0)
                            )) {
                        Alfresco.logger.debug("Adding property", current);
                        var input = document.createElement("input");
                        input.setAttribute("type", "hidden");
                        input.setAttribute("name", current);
                        input.setAttribute("value", propertyData[current]);
                        submitForm.appendChild(input);
                    }
                }
                
                Alfresco.logger.debug("END processMetadata", propertyData);
            },
            
            onMetadataCancel: function () {
                Alfresco.logger.debug("onMetadataCancel", arguments);
                this.showMainDialog();
                Alfresco.logger.debug("END onMetadataCancel");
            },
            
            _applyConfig : function (showConfig)
            {
                SoftwareLoop.HtmlUpload.superclass._applyConfig.apply(this, arguments);
                
                // need to adapt the URL (if none was provided)
                var formEl = Dom.get(this.id + "-htmlupload-form");
                if (this.showConfig.uploadURL === null)
                {
                   // The .html suffix is required - it is not possible to do a multipart post using an ajax call.
                   // So it has to be a FORM submit, to make it feel like an ajax call a a hidden iframe is used.
                   // Since the component still needs to be called when the upload is finished, the script returns
                   // an html template with SCRIPT tags inside that which calls the component that triggered it.
                   formEl.action = Alfresco.constants.PROXY_URI + "uploader-plus/upload.html";
                }
            }
    }));
})();