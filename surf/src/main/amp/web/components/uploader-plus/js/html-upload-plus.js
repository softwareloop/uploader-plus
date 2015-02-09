(function () {
    Alfresco.logger.debug("html-upload-plus.js");
    var oldConstructor = Alfresco.HtmlUpload;

    Alfresco.HtmlUpload = function (htmlId) {
        var that = new oldConstructor(htmlId);
        YAHOO.lang.augmentObject(that, SoftwareLoop.UploaderPlusMixin);
        YAHOO.lang.augmentObject(that, {
            //**************************************************************************
            // Initialisation at show
            //**************************************************************************

            show: function (config) {
                Alfresco.logger.debug("show", arguments);
                this.showMainDialog();
                delete this.types;
                Alfresco.HtmlUpload.prototype.show.call(this, config);

                this.loadTypes(SoftwareLoop.hitch(this, function () {
                    Alfresco.logger.debug("loadTypes callback");
                    this.populateSelect();
                    if (this.types) {
                        Alfresco.logger.debug("this.types is not null");
                        this.fixButtons();
                    }
                }));
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
                delete this.records;
                delete this.currentRecordIndex;

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
                        (current.indexOf("prop_") === 0 || current.indexOf("assoc_") === 0)) {
                        if (current != "prop_mimetype" || (current == "prop_mimetype" && propertyData[current] && propertyData[current].length > 0)) {
                            Alfresco.logger.debug("Adding property", current);
                            var input = document.createElement("input");
                            input.setAttribute("type", "hidden");
                            input.setAttribute("name", current);
                            input.setAttribute("value", propertyData[current]);
                            submitForm.appendChild(input);
                        }
                    }
                }

                Alfresco.logger.debug("END processMetadata", propertyData);
            },

            onMetadataCancel: function () {
                Alfresco.logger.debug("onMetadataCancel", arguments);
                this.showMainDialog();
                Alfresco.logger.debug("END onMetadataCancel");
            }

        }, true);
        return that;
    };
    Alfresco.HtmlUpload.superclass = oldConstructor.superclass;
    Alfresco.HtmlUpload.prototype = oldConstructor.prototype;
})();
