function main() {
    // Widget instantiation metadata...
    var widget = {
        id: "UploaderPlusAdmin",
        name: "Alfresco.UploaderPlusAdmin",
        options: {
            pageSize: parseInt((args.pageSize != null) ? args.pageSize : "15")
        }
    };
    model.widgets = [widget];
}
main();