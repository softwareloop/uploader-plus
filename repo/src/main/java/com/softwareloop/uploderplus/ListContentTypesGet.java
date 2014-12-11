package com.softwareloop.uploderplus;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.namespace.QName;
import org.apache.log4j.Logger;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;

import java.util.*;

/**
 * @author Paolo Predonzani (http://softwareloop.com/)
 */
public class ListContentTypesGet extends DeclarativeWebScript {
    //--------------------------------------------------------------------------
    // Logging
    //--------------------------------------------------------------------------

    static Logger logger = Logger.getLogger(ListContentTypesGet.class);

    //--------------------------------------------------------------------------
    // Constants
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Fields
    //--------------------------------------------------------------------------

    final DictionaryService dictionaryService;

    //--------------------------------------------------------------------------
    // Constructors
    //--------------------------------------------------------------------------

    public ListContentTypesGet(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }


    //--------------------------------------------------------------------------
    // AbstractWebScript implementations
    //--------------------------------------------------------------------------

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

    //--------------------------------------------------------------------------
    // Methods
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Abstract methods
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Getters/setters
    //--------------------------------------------------------------------------

}
