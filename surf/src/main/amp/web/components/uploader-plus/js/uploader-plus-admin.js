(function () {
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

        onReady: function () {
            this.setupDataTable();
        },

        setupDataTable: function () {
            var _this = this;

            var pathFormatter = function (elCell, oRecord, oColumn, oData) {
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
                        title: _this.msg("open.in.repository"),
                        text: Alfresco.util.encodeHTML(path)
                    }
                );
            };

            var allowedTypesFormatter = function (elCell, oRecord, oColumn, oData) {
                var text = "";
                for (var i = 0; i < oData.length; i++) {
                    if (i > 0) {
                        text += ", ";
                    }
                    text += Alfresco.util.encodeHTML(oData[i]);
                }
                elCell.innerHTML = text;
            };

            var actionFormatter = function (elCell, oRecord, oColumn, oData) {
                elCell.innerHTML = "<div class='action'><a>edit</a> | <a>delete</a></div>";
            };

            var columnDefinitions = [
                {
                    key: "path",
                    label: this.msg("title.path"),
                    sortable: false,
                    formatter: pathFormatter
                },
                {
                    key: "allowedTypes",
                    label: this.msg("title.allowed.types"),
                    sortable: false,
                    formatter: allowedTypesFormatter
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
                    formatter: actionFormatter
                }
            ];

            // DataSource definition
            var tagSearchResultsURI =
                Alfresco.constants.PROXY_URI + "uploader-plus/upload-folders-list";
            console.log(tagSearchResultsURI);

            var dataSource = this.widgets.dataSource =
                new YAHOO.util.DataSource(tagSearchResultsURI);
            dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
            dataSource.connXhrMode = "queueRequests";
            dataSource.responseSchema = {
                resultsList: "results",
                fields: ["path", "nodeRef", "allowedTypes", "recursive"]
            };

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

        }
    });
})();