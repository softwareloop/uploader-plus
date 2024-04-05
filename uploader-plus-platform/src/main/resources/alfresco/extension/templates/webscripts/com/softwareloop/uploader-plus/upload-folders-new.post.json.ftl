<#escape x as jsonUtils.encodeJSONString(x)>
{
"status": ${status},
"node": {
"nodeRef": "${node.nodeRef}",
"path": "${node.displayPath}\/${node.properties.name}",
"allowedTypes": []
}
}
</#escape>