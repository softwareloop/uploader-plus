<#escape x as jsonUtils.encodeJSONString(x)>
{
"types" : [
    <#list types as type>
    "${type}"<#if type_has_next>,</#if>
    </#list>
]
}
</#escape>