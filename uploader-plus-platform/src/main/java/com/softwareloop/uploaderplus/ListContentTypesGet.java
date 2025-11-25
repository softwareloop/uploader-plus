package com.softwareloop.uploaderplus;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.namespace.QName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;

import java.util.*;

public class ListContentTypesGet extends DeclarativeWebScript {
    private static final Logger logger = LoggerFactory.getLogger(ListContentTypesGet.class);

    private DictionaryService dictionaryService;

    public void setDictionaryService(DictionaryService dictionaryService) { this.dictionaryService = dictionaryService;}

    @Override
    protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache) {
        logger.debug("ListContentTypesGet.execute()");

        Map<String, Object> model = new HashMap<>();

        Collection<QName> subtypes =
                dictionaryService.getSubTypes(ContentModel.TYPE_CONTENT, true);

        List<String> typesCollection = new ArrayList<>();
        for (QName subtype : subtypes) {
            typesCollection.add(subtype.getPrefixString());
        }
        Collections.sort(typesCollection);

        model.put("types", typesCollection.toArray());

        logger.debug("END ListContentTypesGet.execute()");
        return model;
    }
}
