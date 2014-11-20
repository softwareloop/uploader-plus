(function () {
    var oldConstructor = Alfresco.HtmlUpload;

    Alfresco.HtmlUpload = function (htmlId) {
        var that = new oldConstructor(htmlId);
        YAHOO.lang.augmentObject(that, SoftwareLoop.UploaderPlusMixin);
        YAHOO.lang.augmentObject(that, {
            //**************************************************************************
            // Initialisation at show
            //**************************************************************************

            show: function (config) {
                console.debug("show", this);
                this.showMainDialog();
                delete this.types;
                Alfresco.HtmlUpload.prototype.show.call(this, config);

                this.loadTypes(SoftwareLoop.hitch(this, function () {
                    this.populateSelect();
                    if (this.types) {
                        this.fixButtons();
                    }
                }));
            },

            fixButtons: function () {
                console.debug("fixButtons", this.widgets.form);
                this.widgets.uploadButton.set("label", this.msg("uploader.plus.next"));
                this.widgets.uploadButton.removeListener("click");
                this.widgets.uploadButton.on(
                    "click", function (event) {
                        console.debug(event);
                        this.widgets.form._setAllFieldsAsVisited();
                        if (this.widgets.form.validate()) {
                            this.showMetadataDialog();
                        }
                    }, this, this);
            },


            //**************************************************************************
            // Metadata dialog management
            //**************************************************************************

            showMetadataDialog: function () {
                YAHOO.util.Dom.addClass(this.id + "-main-dialog", "fake-hidden");
                YAHOO.util.Dom.removeClass(this.id + "-metadata-dialog", "hidden");

                var filename;
                if (this.widgets.filedata.files) {
                    filename = this.widgets.filedata.files[0].name;
                } else {
                    var path = this.widgets.filedata.value;
                    filename = path.substring(path.lastIndexOf('\\') + 1);
                }

                this.currentRecordIndex = 0;
                this.records = [];
                this.records.push({
                    getData: function () {
                        return {
                            name: filename
                        }
                    }
                });

                SoftwareLoop.fireEvent(this.contentTypeSelectNode, "change");
            },

            showMainDialog: function () {
                console.debug("showMainDialog");
                delete this.records;
                delete this.currentRecordIndex;

                YAHOO.util.Dom.removeClass(this.id + "-main-dialog", "fake-hidden");
                YAHOO.util.Dom.addClass(this.id + "-metadata-dialog", "hidden");
            },

            //**************************************************************************
            // Form button handling
            //**************************************************************************

            onMetadataSubmit: function (event) {
                console.debug("onMetadataSubmit", this.formUi);
                this.formUi.formsRuntime._setAllFieldsAsVisited();
                if (this.formUi.formsRuntime.validate()) {
                    this.processMetadata();
                    this.widgets.form._submitInvoked.call(this.widgets.form, event);
                } else {
                    Alfresco.util.PopupManager.displayMessage({
                        text: this.msg("validation.errors.correct.before.proceeding")
                    });
                }
            },

            processMetadata: function () {
                var contentTypeInputNode =
                    YAHOO.util.Dom.get(
                            this.id + "-contentTypeInput");
                if (contentTypeInputNode) {
                    contentTypeInputNode.value =
                        this.contentTypeSelectNode.value;
                }

                var formRuntime = this.formUi.formsRuntime;
                var form = Dom.get(formRuntime.formId);
                var propertyData = formRuntime._buildAjaxForSubmit(form);

                var submitForm =
                    YAHOO.util.Dom.get(this.widgets.form.formId);
                for (var current in propertyData) {
                    if (propertyData.hasOwnProperty(current) &&
                        (current.indexOf("prop_") === 0 || current.indexOf("assoc_") === 0)) {
                        var input = document.createElement("input");
                        input.setAttribute("type", "hidden");
                        input.setAttribute("name", current);
                        input.setAttribute("value", propertyData[current]);
                        submitForm.appendChild(input);
                    }
                }

                console.log("propertyData", propertyData, submitForm);
            },

            onMetadataCancel: function () {
                console.debug("onMetadataCancel");
                this.showMainDialog();
            }

            //**************************************************************************
            // Upload override
            //**************************************************************************

        }, true);
        return that;
    };
    Alfresco.HtmlUpload.superclass = oldConstructor.superclass;
    Alfresco.HtmlUpload.prototype = oldConstructor.prototype;
})();
