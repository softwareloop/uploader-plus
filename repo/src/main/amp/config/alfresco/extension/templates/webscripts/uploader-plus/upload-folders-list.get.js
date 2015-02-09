model.nodes = search.luceneSearch("TYPE:\"cm:folder\" AND ASPECT:\"up:UploadFolder\"");

function compare(a, b) {
    if (a.displayPath < b.displayPath)
        return -1;
    if (a.displayPath > b.displayPath)
        return 1;
    return 0;
}

model.nodes.sort(compare);