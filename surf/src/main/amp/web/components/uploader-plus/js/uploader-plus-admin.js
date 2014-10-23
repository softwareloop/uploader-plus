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
                "<a data-noderef='" + nodeRef + "' class='edit-upload-folder'>edit</a>" +
                " | <a data-noderef='" + nodeRef + "' class='delete-upload-folder'>delete</a>" +
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

            console.log("dataTable", dataTable);



            // Enables row highlighting
            dataTable.subscribe("rowMouseoverEvent", dataTable.onEventHighlightRow);
            dataTable.subscribe("rowMouseoutEvent", dataTable.onEventUnhighlightRow);

            // Attach event to delete links
            YAHOO.util.Event.delegate(
                this.id,
                "click",
                _hitch(this, this.deleteUploadFolderHandler),
                "a.delete-upload-folder"
            );
        },

        reloadDataTable: function () {
            var dataSource = this.widgets.dataSource;
            var dataTable = this.widgets.dataTable;

            dataTable.deleteRows(0, dataTable.getRecordSet().getLength());

            // update the ui to show that a search is on-going
            dataTable.set("MSG_EMPTY", "");
            dataTable.render();

            dataSource.sendRequest("", {
                success: dataTable.onDataReturnInitializeTable,
                failure: dataTable.onDataReturnInitializeTable,
                scope: dataTable
            });

        },


        deleteUploadFolderSuccess: function (response) {
            var message = response.json.overallSuccess ?
                "operation.completed.successfully" : "operation.failed";
            Alfresco.util.PopupManager.displayMessage({
                text: this.msg(message)
            });
            this.reloadDataTable();
        },

        deleteUploadFolderHandler: function (e, el, container) {
            var parsedNodeRef = Alfresco.util.NodeRef(el.dataset.noderef);

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
                        var tr = el.parentNode.parentNode.parentNode;
                        var dataTable = this.widgets.dataTable;
                        dataTable.deleteRow(tr);
                    },
                    scope: this
                },
                failureMessage: this.msg("operation.failed")
            });
        }
    });
})();