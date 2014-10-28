/**
 * Custom content types
 */
function getContentTypes() {
    var contentTypes = [
        {
            id: "cm:content",
            value: "cm_content"
        }
    ];

    return contentTypes;
}

model.contentTypes = getContentTypes();

function main() {
    // Widget instantiation metadata...
    var flashUpload = {
        id: "FlashUpload",
        name: "SoftwareLoop.FlashUploadPlus"
    };
    model.widgets = [flashUpload];
}

main();

