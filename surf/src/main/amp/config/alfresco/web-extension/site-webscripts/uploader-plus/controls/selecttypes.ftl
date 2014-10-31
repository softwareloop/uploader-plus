<#include "/org/alfresco/components/form/controls/common/utils.inc.ftl" />
<#if field.control.params.size??><#assign size=field.control.params.size><#else><#assign size=5></#if>

<#assign fieldValue=field.value>

<#if fieldValue?string == "" && field.control.params.defaultValueContextProperty??>
    <#if context.properties[field.control.params.defaultValueContextProperty]??>
        <#assign fieldValue = context.properties[field.control.params.defaultValueContextProperty]>
    <#elseif args[field.control.params.defaultValueContextProperty]??>
        <#assign fieldValue = args[field.control.params.defaultValueContextProperty]>
    </#if>
</#if>

<div class="form-field">
<#if form.mode == "view">
    <div class="viewmode-field">
        <#if field.mandatory && !(fieldValue?is_number) && fieldValue?string == "">
        <span class="incomplete-warning"><img src="${url.context}/res/components/form/images/warning-16.png"
                                              title="${msg("form.field.incomplete")}"/><span>
        </#if>
        <span class="viewmode-label">${field.label?html}:</span>
        <#if fieldValue?string == "">
            <#assign valueToShow=msg("form.control.novalue")>
        <#else>
            <#assign valueToShow=fieldValue>
        </#if>
        <span class="viewmode-value">${valueToShow?html}</span>
    </div>
<#else>
    <label for="${fieldHtmlId}-entry">${field.label?html}:<#if field.mandatory><span
            class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if></label>
    <input id="${fieldHtmlId}" type="hidden" name="${field.name}" value="${fieldValue?string}"/>
    <select id="${fieldHtmlId}-entry" name="-" multiple="multiple" size="${size}" tabindex="0"
            data-selectedValues="${fieldValue?string}"
            onchange="javascript:Alfresco.util.updateMultiSelectListValue('${fieldHtmlId}-entry', '${fieldHtmlId}', <#if field.mandatory>true<#else>false</#if>);"
            <#if field.description??>title="${field.description}"</#if>
            <#if field.control.params.styleClass??>class="${field.control.params.styleClass}"</#if>
            <#if field.control.params.style??>style="${field.control.params.style}"</#if>
            <#if field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true")>disabled="true"</#if>>
    </select>
    <@formLib.renderFieldHelp field=field />
    <#if field.control.params.mode?? && isValidMode(field.control.params.mode?upper_case)>
        <input id="${fieldHtmlId}-mode" type="hidden" name="${field.name}-mode"
               value="${field.control.params.mode?upper_case}"/>
    </#if>
</#if>
</div>

<#function isValidMode modeValue>
    <#return modeValue == "OR" || modeValue == "AND">
</#function>