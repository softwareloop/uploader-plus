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
            var columnDefinitions = [
                {
                    key: "path",
                    label: this.msg("title.path"),
                    sortable: false,
                    formatter: null,
                    width: 120
                },
                {
                    key: "allowedTypes",
                    label: this.msg("title.allowed.types"),
                    sortable: false,
                    formatter: null,
                    width: 150
                },
                {
                    key: "recursive",
                    label: this.msg("title.recursive"),
                    sortable: false,
                    formatter: null,
                    width: 150
                },
                {
                    key: "actions",
                    label: this.msg("title.actions"),
                    sortable: false,
                    formatter: null,
                    width: 45
                }
            ];

            // DataSource definition
            var tagSearchResultsURI = YAHOO.lang.substitute(
                    Alfresco.constants.PROXY_URI + "api/tags/{store_type}/{store_id}?details=true",
                {
                    store_type: "workspace",
                    store_id: "SpacesStore"
                }
            );

            this.widgets.dataSource = new YAHOO.util.DataSource(tagSearchResultsURI);
            this.widgets.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
            this.widgets.dataSource.connXhrMode = "queueRequests";
            this.widgets.dataSource.responseSchema = {
                resultsList: "data.items",
                fields: ["name", "modifier", "modified"]
            };

            // DataTable definition
            this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-folders", columnDefinitions, this.widgets.dataSource, {
                renderLoopSize: Alfresco.util.RENDERLOOPSIZE,
                initialLoad: false,
//                paginator: this.widgets.paginator,
                MSG_LOADING: this.msg("loading.folders"),
                MSG_EMPTY: this.msg("no.folders.found")
            });

        }
    });
})();