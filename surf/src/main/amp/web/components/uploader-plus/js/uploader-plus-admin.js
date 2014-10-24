(function () {

    function _hitch(scope, f) {
        return function () {
            f.apply(scope, arguments);
        }
    }

    Alfresco.UploaderPlusAdmin = function (htmlId) {
        Alfresco.UploaderPlusAdmin.superclass.constructor.call(this,
            "Alfresco.UploaderPlusAdmin",
            htmlId,
            ["button", "container", "datasource", "datatable", "paginator", "history", "animation"]
        );

        return this;
    };

    YAHOO.extend(Alfresco.UploaderPlusAdmin, Alfresco.component.Base, {

        options: {
            pageSize: 15
        },

        uploadFoldersListUrl: Alfresco.constants.PROXY_URI + "uploader-plus/upload-folders-list",

        onReady: function () {
            this.setupDataTable();
        },

        pathFormatter: function (elCell, oRecord, oColumn, oData) {
            var path = oData.substring(13);
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
        },

        allowedTypesFormatter: function (elCell, oRecord, oColumn, oData) {
            var text = "";
            for (var i = 0; i < oData.length; i++) {
                if (i > 0) {
                    text += ", ";
                }
                text += Alfresco.util.encodeHTML(oData[i]);
            }
            elCell.innerHTML = text;
        },

        actionFormatter: function (elCell, oRecord, oColumn, oData) {
            var nodeRef = oRecord.getData().nodeRef;
            elCell.innerHTML = "<div class='action'>" +
                "<a class='edit-upload-folder'>edit</a>" +
                " | <a class='delete-upload-folder'>delete</a>" +
                "</div>";
        },

        setupDataTable: function () {
            var columnDefinitions = [
                {
                    key: "path",
                    label: this.msg("title.path"),
                    sortable: false,
                    formatter: _hitch(this, this.pathFormatter)
                },
                {
                    key: "allowedTypes",
                    label: this.msg("title.allowed.types"),
                    sortable: false,
                    formatter: _hitch(this, this.allowedTypesFormatter)
                },
                {
                    key: "recursive",
                    label: this.msg("title.recursive"),
                    sortable: false
                },
                {
                    key: "actions",
                    label: this.msg("title.actions"),
                    sortable: false,
                    formatter: _hitch(this, this.actionFormatter)
                }
            ];

            // DataSource definition

            var dataSource = this.widgets.dataSource =
                new YAHOO.util.DataSource(this.uploadFoldersListUrl, {
                    responseType: YAHOO.util.DataSource.TYPE_JSON,
                    connXhrMode: "queueRequests",
                    responseSchema: {
                        resultsList: "results",
                        fields: ["path", "nodeRef", "allowedTypes", "recursive"]
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
                _hitch(this, this.editUploadFolderHandler),
                "a.edit-upload-folder"
            );

            // Attach event to delete links
            YAHOO.util.Event.delegate(
                this.id,
                "click",
                _hitch(this, this.deleteUploadFolderHandler),
                "a.delete-upload-folder"
            );

            // New Upload folder button
            this.widgets.newUploadFolderButton =
                new YAHOO.widget.Button(this.id + "-new-upload-folder");
        },

        editUploadFolderHandler: function (e, el, container) {
            var tr = el.parentNode.parentNode.parentNode;
            var record = this.widgets.dataTable.getRecord(tr);
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
                        var titleNode = YAHOO.util.Dom.get(formHtmlId + "-dialogTitle");
                        titleNode.innerHTML =
                            Alfresco.util.encodeHTML(data.path.substring(13));
                        var formNode = YAHOO.util.Dom.get(formHtmlId + "-form");
                        YAHOO.util.Dom.addClass(formNode, "edit-upload-folder-dialog");
                    },
                    scope: this
                },
                onSuccess: {
                    fn: function (response) {
                        var dataObj = response.config.dataObj;
                        data.recursive = ("true" === dataObj.prop_up_recursive);
                        data.allowedTypes = dataObj.prop_up_allowedTypes.split(",");
                        this.widgets.dataTable.updateRow(record, data);
                        editUploadFolder.destroy();
                    },
                    scope: this
                },
                doBeforeAjaxRequest: {
                    fn: function (config) {
                        dataObj = config.dataObj;
                        return true;
                    },
                    scope: this
                },
                onFailure: {
                    fn: function (response) {
                        editUploadFolder.destroy();
                    },
                    scope: this
                }
            }).show();
        },

        deleteUploadFolderHandler: function (e, el, container) {
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
        }
    });
})();