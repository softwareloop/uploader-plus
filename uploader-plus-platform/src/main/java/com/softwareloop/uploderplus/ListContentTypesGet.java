package com.softwareloop.uploderplus;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.namespace.QName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;

/**
 * The Class ListContentTypesGet.
 *
 * @author Paolo Predonzani (https://github.com/softwareloop)
 */
public class ListContentTypesGet extends DeclarativeWebScript {
     
    /** The Constant LOGGER. */
	private static final Logger LOGGER = LoggerFactory.getLogger(ListContentTypesGet.class);

    /** The dictionary service. */
    final DictionaryService dictionaryService;

    /**
     * Instantiates a new list content types get.
     *
     * @param dictionaryService the dictionary service
     */
    public ListContentTypesGet(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }
    
    /**
     * Execute impl.
     *
     * @param req the req
     * @param status the status
     * @param cache the cache
     * @return the map
     */
    @Override
	protected Map<String, Object> executeImpl(final WebScriptRequest req, final Status status, final Cache cache) {
        if(LOGGER.isDebugEnabled()) {
        	LOGGER.debug("ListContentTypesGet.execute()");
        }
        final Collection<QName> subtypes =
                dictionaryService.getSubTypes(ContentModel.TYPE_CONTENT, true);
        final List<String> typesCollection = new ArrayList<>();
        for (final QName subtype : subtypes) {
            typesCollection.add(subtype.getPrefixString());
        }
        Collections.sort(typesCollection);
        
        final Map<String, Object> model = new HashMap<>();
        model.put("types", typesCollection.toArray());

        if(LOGGER.isDebugEnabled()) {
        	LOGGER.debug("END ListContentTypesGet.execute()");
        }
        return model;
    }
}
