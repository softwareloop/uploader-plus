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
}
</#escape>