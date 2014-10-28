if (typeof SoftwareLoop == "undefined" || !SoftwareLoop) {
    var SoftwareLoop = {};
}

SoftwareLoop.FlashUploadPlus = function (htmlId) {
    SoftwareLoop.FlashUploadPlus.superclass.constructor.call(this, htmlId);
    return this;
};

YAHOO.extend(SoftwareLoop.FlashUploadPlus, Alfresco.FlashUpload, {
});

