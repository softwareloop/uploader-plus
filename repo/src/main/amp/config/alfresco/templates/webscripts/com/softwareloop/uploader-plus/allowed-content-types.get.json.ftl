<#escape x as jsonUtils.encodeJSONString(x)>
{
"types" :
    <#if types??>
    [
        <#list types as type>
        "${type}"<#if type_has_next>,</#if>
        </#list>
    ]
    <#else>
    null
    </#if>
,
"proxyTypes" :
    <#if proxyTypes??>
    [
        <#list proxyTypes as proxyType>
        "${proxyType}"<#if proxyType_has_next>,</#if>
        </#list>
    ]
    <#else>
    null
    </#if>
}
</#escape>