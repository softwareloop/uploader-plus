Alfresco.logger.debug("uploader-plus-admin.js");

SoftwareLoop.UploaderPlusAdmin = function (htmlId) {
    Alfresco.logger.debug("UploaderPlusAdmin constructor");
    SoftwareLoop.UploaderPlusAdmin.superclass.constructor.call(this,
        "SoftwareLoop.UploaderPlusAdmin",
        htmlId,
        ["button", "container", "datasource", "datatable", "paginator", "history", "animation"]
    );

    return this;
};

YAHOO.extend(SoftwareLoop.UploaderPlusAdmin, Alfresco.component.Base, {

    uploadFoldersListUrl: Alfresco.constants.PROXY_URI + "uploader-plus/upload-folders-list",
    listContentTypesUrl: Alfresco.constants.PROXY_URI + "uploader-plus/list-content-types",

    onReady: function () {
        Alfresco.logger.debug("onReady", arguments);
        this.setupDataTable();
        this.setupNewUploadFolderButton();
        Alfresco.logger.debug("END onReady");
    },

    prettyPath: function (path) {
        Alfresco.logger.debug("prettyPath", arguments);
        var result = path.substring(13);
        if ("" === result) {
            Alfresco.logger.debug("Adjusting root path");
            result = "/";
        }
        Alfresco.logger.debug("END prettyPath", result);
        return result;
    },

    pathFormatter: function (elCell, oRecord, oColumn, oData) {
        Alfresco.logger.debug("pathFormatter", arguments);
        var path = this.prettyPath(oData);
        var repoUrl = YAHOO.lang.substitute(
            "{pageContext}repository#filter={path}&page=1",
            {
                pageContext: Alfresco.constants.URL_PAGECONTEXT,
                path: encodeURIComponent("path|" + path + "|")
            }
        );

        elCell.innerHTML = YAHOO.lang.substitute(
            "<a href='{href}' title='{title}'>{text}</a>",
            {
                href: Alfresco.util.encodeHTML(repoUrl),
                title: this.msg("open.in.repository"),
                text: Alfresco.util.encodeHTML(path)
            }
        );
        Alfresco.logger.debug("END pathFormatter");
    },

    allowedTypesFormatter: function (elCell, oRecord, oColumn, oData) {
        Alfresco.logger.debug("allowedTypesFormatter", arguments);
        var text = "";
        for (var i = 0; i < oData.length; i++) {
            Alfresco.logger.debug("Adding allowed type", oData[i]);
            if (i > 0) {
                text += ", ";
            }
            var typeName = this.msg("type." + oData[i].replace(":", "_"));
            if (typeName.lastIndexOf("type.", 0) === 0) {
            	text += Alfresco.util.encodeHTML(oData[i]);
            } else {
            	text += Alfresco.util.encodeHTML(typeName);
            }
        }
        elCell.innerHTML = text;
        Alfresco.logger.debug("END allowedTypesFormatter");
    },

    actionFormatter: function (elCell, oRecord, oColumn, oData) {
        Alfresco.logger.debug("actionFormatter", arguments);
        var nodeRef = oRecord.getData().nodeRef;
        elCell.innerHTML = "<div class='action'>" +
            "<a class='edit-upload-folder'>" + this.msg("button.edit") + "</a>" +
            " | <a class='delete-upload-folder'>" + this.msg("button.delete") + "</a>" +
            "</div>";
        Alfresco.logger.debug("END actionFormatter");
    },

    setupDataTable: function () {
        Alfresco.logger.debug("setupDataTable", arguments);
        var columnDefinitions = [
            {
                key: "path",
                label: this.msg("title.path"),
                sortable: false,
                formatter: SoftwareLoop.hitch(this, this.pathFormatter)
            },
            {
                key: "allowedTypes",
                label: this.msg("title.allowed.types"),
                sortable: false,
                formatter: SoftwareLoop.hitch(this, this.allowedTypesFormatter)
            },
            {
                key: "actions",
                label: this.msg("title.actions"),
                sortable: false,
                formatter: SoftwareLoop.hitch(this, this.actionFormatter)
            }
        ];

        // DataSource definition

        var dataSource = this.widgets.dataSource =
            new YAHOO.util.DataSource(this.uploadFoldersListUrl, {
                responseType: YAHOO.util.DataSource.TYPE_JSON,
                connXhrMode: "queueRequests",
                responseSchema: {
                    resultsList: "results",
                    fields: ["path", "nodeRef", "allowedTypes"]
                }
            });

        // DataTable definition
        var dataTable = this.widgets.dataTable =
            new YAHOO.widget.DataTable(
                    this.id + "-folders",
                columnDefinitions,
                dataSource,
                {
                    initialLoad: {},
                    MSG_LOADING: this.msg("loading.folders"),
                    MSG_EMPTY: this.msg("no.folders.found")
                }
            );

        // Enables row highlighting
        dataTable.subscribe("rowMouseoverEvent", dataTable.onEventHighlightRow);
        dataTable.subscribe("rowMouseoutEvent", dataTable.onEventUnhighlightRow);

        // Attach event to update links
        YAHOO.util.Event.delegate(
            this.id,
            "click",
            SoftwareLoop.hitch(this, this.editUploadFolderHandler),
            "a.edit-upload-folder"
        );

        // Attach event to delete links
        YAHOO.util.Event.delegate(
            this.id,
            "click",
            SoftwareLoop.hitch(this, this.deleteUploadFolderHandler),
            "a.delete-upload-folder"
        );
        Alfresco.logger.debug("END setupDataTable");
    },

    setupNewUploadFolderButton: function () {
        Alfresco.logger.debug("setupNewUploadFolderButton", arguments);
        this.widgets.newUploadFolderButton =
            new YAHOO.widget.Button(this.id + "-new-upload-folder");
        this.widgets.newUploadFolderButton.on(
            "click",
            function () {
                this.promptForFolder();
            },
            null,
            this
        );
        Alfresco.logger.debug("END setupNewUploadFolderButton");
    },

    promptForFolder: function () {
        Alfresco.logger.debug("promptForFolder", arguments);
        var formHtmlId = this.id + "-new-form";
        var newUploadFolder = new Alfresco.module.DoclibGlobalFolder(formHtmlId);

        var DLGF = Alfresco.module.DoclibGlobalFolder;

        var allowedViewModes = [
            DLGF.VIEW_MODE_SITE,
            DLGF.VIEW_MODE_REPOSITORY,
            DLGF.VIEW_MODE_SHARED,
            DLGF.VIEW_MODE_USERHOME
        ];

        newUploadFolder.setOptions({
            viewMode: DLGF.VIEW_MODE_SITE,
            defaultViewMode: DLGF.VIEW_MODE_SITE,
            allowedViewModes: allowedViewModes,
            title: this.msg("select.the.upload.folder")
        });

        var _this = this;
        newUploadFolder.onOK = function () {
            Alfresco.logger.debug("onOK callback");
            Alfresco.module.DoclibGlobalFolder.prototype.onOK.apply(this, arguments);
            if (this.selectedNode) {
                Alfresco.logger.debug("A node was selected", this.selectedNode);
                _this.createUploadFolder(this.selectedNode.data.nodeRef);
            }
        };
        newUploadFolder.showDialog();
        Alfresco.logger.debug("END promptForFolder");
    },

    createUploadFolder: function (nodeRef) {
        Alfresco.logger.debug("createUploadFolder", arguments);
        var parsedNodeRef = Alfresco.util.NodeRef(nodeRef);
        var urlTemplate = Alfresco.constants.PROXY_URI +
            "uploader-plus/upload-folders-new/{storeType}/{storeId}/{id}";
        var url = YAHOO.lang.substitute(urlTemplate, parsedNodeRef);
        Alfresco.util.Ajax.jsonPost({
            url: url,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    Alfresco.logger.debug("successCallback", arguments);
                    var status = response.json.status;
                    var newObj = response.json.node;
                    if (status == 0) {
                        Alfresco.logger.debug("status == 0");
                        var pos = this.findUploadFolderPosition(newObj);
                        this.widgets.dataTable.addRow(newObj, pos);
                        var newRecord = this.widgets.dataTable.getRecord(pos);
                        this.editUploadFolderRecord(newRecord);
                    } else if (status == 1) {
                        Alfresco.logger.debug("status == 1");
                        Alfresco.util.PopupManager.displayMessage({
                            text: YAHOO.lang.substitute(
                                this.msg("_.is.already.an.upload.folder"),
                                newObj
                            )
                        });
                    }
                },
                scope: this
            },
            failureMessage: this.msg("operation.failed")
        });
        Alfresco.logger.debug("END createUploadFolder");
    },

    findUploadFolderPosition: function (newObj) {
        Alfresco.logger.debug("findUploadFolderPosition", arguments);
        var records = this.widgets.dataTable.getRecordSet().getRecords();
        for (var i = 0; i < records.length; i++) {
            Alfresco.logger.debug("Scanning upload folder", i);
            var data = records[i].getData();
            if (data.path > newObj.path) {
                Alfresco.logger.debug("Found position");
                return i;
            }
        }
        Alfresco.logger.debug("END findUploadFolderPosition", i);
        return i;
    },

    editUploadFolderHandler: function (e, el, container) {
        Alfresco.logger.debug("editUploadFolderHandler", arguments);
        var tr = el.parentNode.parentNode.parentNode;
        var record = this.widgets.dataTable.getRecord(tr);
        this.editUploadFolderRecord(record);
        Alfresco.logger.debug("END editUploadFolderHandler");
    },

    editUploadFolderRecord: function (record) {
        Alfresco.logger.debug("editUploadFolderRecord", arguments);
        var data = record.getData();

        var formHtmlId = this.id + "-edit-form";
        var templateUrl = YAHOO.lang.substitute(
            "{serviceContext}components/form?itemKind=node&itemId={itemId}&mode=edit&submitType=json&formId={formId}&showCancelButton=true&htmlid={htmlid}",
            {
                serviceContext: Alfresco.constants.URL_SERVICECONTEXT,
                itemId: data.nodeRef,
                formId: "upload-folder",
                htmlid: formHtmlId
            }
        );
        var parsedNodeRef = Alfresco.util.NodeRef(data.nodeRef);
        var actionUrl = YAHOO.lang.substitute(
                Alfresco.constants.PROXY_URI +
                "api/node/{storeType}/{storeId}/{id}/formprocessor",
            parsedNodeRef
        );

        var editUploadFolder = new Alfresco.module.SimpleDialog(formHtmlId);
        editUploadFolder.setOptions({
            width: "40em",
            templateUrl: templateUrl,
            actionUrl: actionUrl,
            destroyOnHide: true,
            doBeforeDialogShow: {
                fn: function () {
                    Alfresco.logger.debug("doBeforeDialogShow callback", arguments);
                    var titleNode = YAHOO.util.Dom.get(formHtmlId + "-dialogTitle");
                    if (titleNode) {
                        titleNode.innerHTML =
                            Alfresco.util.encodeHTML(this.prettyPath(data.path));
                    }
                    var selectNode = YAHOO.util.Dom.getElementsByClassName(
                        "supported-types-select", "select")[0];

                    this.populateAllowedTypesSelect(selectNode);

                    return true;
                },
                scope: this
            },
            onSuccess: {
                fn: function (response) {
                    Alfresco.logger.debug("onSuccess callback", arguments);
                    var dataObj = response.config.dataObj;
                    data.allowedTypes = dataObj.prop_up_allowedTypes.split(",");
                    this.widgets.dataTable.updateRow(record, data);
                    Alfresco.util.PopupManager.displayMessage({
                        text: this.msg("operation.completed.successfully")
                    });
                },
                scope: this
            },
            onFailure: {
                fn: function (response) {
                    Alfresco.logger.debug("onFailure callback", arguments);
                    Alfresco.util.PopupManager.displayMessage({
                        text: this.msg("operation.failed")
                    });
                },
                scope: this
            }
        }).show();
        Alfresco.logger.debug("END editUploadFolderRecord");
    },

    deleteUploadFolderHandler: function (e, el, container) {
        Alfresco.logger.debug("deleteUploadFolderHandler", arguments);
        var tr = el.parentNode.parentNode.parentNode;
        var record = this.widgets.dataTable.getRecord(tr);
        var data = record.getData();

        var parsedNodeRef = Alfresco.util.NodeRef(data.nodeRef);
        var urlTemplate = Alfresco.constants.PROXY_URI +
            "slingshot/doclib/action/aspects/node/{storeType}/{storeId}/{id}";

        var dataObj = {
            added: [],
            removed: ["up:UploadFolder"]
        };
        Alfresco.util.Ajax.jsonPost({
            url: YAHOO.lang.substitute(urlTemplate, parsedNodeRef),
            dataObj: dataObj,
            requestContentType: Alfresco.util.Ajax.JSON,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    Alfresco.logger.debug("deleteUploadFolderHandler successCallback", arguments);
                    var message = response.json.overallSuccess ?
                        "operation.completed.successfully" : "operation.failed";
                    Alfresco.util.PopupManager.displayMessage({
                        text: this.msg(message)
                    });
                    this.widgets.dataTable.deleteRow(record);
                },
                scope: this
            },
            failureMessage: this.msg("operation.failed")
        });
        Alfresco.logger.debug("END deleteUploadFolderHandler");
    },

    populateAllowedTypesSelect: function (selectNode) {
        Alfresco.logger.debug("populateAllowedTypesSelect", arguments);
        var selectedValues = selectNode.getAttribute("data-selectedValues");
        var selectedValuesArray = [];
        if (selectedValues) {
            selectedValuesArray = selectedValues.split(",");
        }
        Alfresco.util.Ajax.jsonGet({
            url: this.listContentTypesUrl,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    Alfresco.logger.debug("populateAllowedTypesSelect successCallback", arguments);
                    var types = response.json.types;
                    for (var i = 0; i < types.length; i++) {
                        Alfresco.logger.debug("Type index", i);
                        var type = types[i];
                        var selected = selectedValuesArray.indexOf(type) > -1;
                        
                        var typeName = this.msg("type." + type.replace(":", "_"));
            			if (typeName.lastIndexOf("type.", 0) === 0) {
            				typeName = type;
			            }
			            
                        var option = new Option(typeName, type);
                        selectNode.add(option);
                        option.selected = selected;
                    }
                },
                scope: this
            },
            failureCallback: {
                fn: function (response) {
                    Alfresco.logger.debug("populateAllowedTypesSelect failureCallback", arguments);
                },
                scope: this
            }
        });
        Alfresco.logger.debug("END populateAllowedTypesSelect");
    }
});
