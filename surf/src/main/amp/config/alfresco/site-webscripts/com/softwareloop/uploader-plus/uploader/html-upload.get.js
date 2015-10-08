<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/upload/html-upload.get.js">
// The above import allows us to reuse Alfresco original html-upload component web script.
// When end user overrides via web-extension directory, this won't pick up the override.
// This is a drawback of Alfresco JS importing.

model.widgets[0].name = "SoftwareLoop.HtmlUpload";