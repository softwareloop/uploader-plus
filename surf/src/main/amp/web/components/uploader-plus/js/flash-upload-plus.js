SoftwareLoop.FlashUploadPlus = function (htmlId) {
    SoftwareLoop.FlashUploadPlus.superclass.constructor.call(this, htmlId);
    return this;
};

YAHOO.extend(SoftwareLoop.FlashUploadPlus, Alfresco.FlashUpload, {

    allowedContentTypesDestinationTemplate: Alfresco.constants.PROXY_URI +
        "uploader-plus/allowed-content-types?destination={destination}",

    allowedContentTypesSiteTemplate: Alfresco.constants.PROXY_URI +
        "/uploader-plus/allowed-content-types?siteid={siteId}&containerid={containerId}&path={uploadDirectory}",

    allowedContentTypesBlankUrl: Alfresco.constants.PROXY_URI +
        "/uploader-plus/allowed-content-types",

    show: function (config) {
        SoftwareLoop.FlashUploadPlus.superclass.show.call(this, config);

        var url;
        if (this.showConfig.destination) {
            url = YAHOO.lang.substitute(
                this.allowedContentTypesDestinationTemplate,
                {
                    destination: encodeURIComponent(this.showConfig.destination)
                }
            );
        } else if (this.showConfig.siteId) {
            url = YAHOO.lang.substitute(
                this.allowedContentTypesSiteTemplate,
                {
                    siteId: encodeURIComponent(this.showConfig.siteId),
                    containerId: encodeURIComponent(this.showConfig.containerId),
                    uploadDirectory: encodeURIComponent(this.showConfig.uploadDirectory)
                }
            );
        } else {
            url = this.allowedContentTypesBlankUrl;
        }

        console.log(url);

        Alfresco.util.Ajax.jsonGet({
            url: url,
            responseContentType: Alfresco.util.Ajax.JSON,
            successCallback: {
                fn: function (response) {
                    var types = response.json.types;
                    var contentTypeNode = YAHOO.util.Dom.get(this.id + "-content-type");
                    var contentTypeSelectId = this.id + "-content-type-select";
                    contentTypeNode.innerHTML = "<select id='" + contentTypeSelectId + "'></select>";
                    var contentTypeSelectNode = YAHOO.util.Dom.get(contentTypeSelectId);
                    for (var i = 0; i < types.length; i++) {
                        var current = types[i];
                        var option = new Option(current, current, i === 0);
                        contentTypeSelectNode.add(option);
                    }
                },
                scope: this
            },
            failureCallback: {
                fn: function (response) {
                    console.log("fail");
                },
                scope: this
            }
        });

    }
});

