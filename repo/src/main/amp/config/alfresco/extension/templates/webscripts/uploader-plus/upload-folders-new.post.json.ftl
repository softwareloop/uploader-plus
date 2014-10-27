<#escape x as jsonUtils.encodeJSONString(x)>
{
"nodeRef": "${node.nodeRef}",
"path": "${node.displayPath}\/${node.properties.name}",
"allowedTypes": [],
"recursive": false
}
</#escape>