var SoftwareLoop = SoftwareLoop || {
    hitch: function (scope, f) {
        return function () {
            f.apply(scope, arguments);
        }
    },

    printStackTrace: function (e) {
        Alfresco.logger.debug("printStackTrace", arguments);
        var stack;
        if (e.stack) {
            stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                .split('\n');
        }
        console.log(e.message, stack);
    },

    fireEvent: function (node, eventType, canBubble, cancelable) {
        Alfresco.logger.debug("fireEvent", arguments);
        if (typeof(canBubble) === 'undefined') {
            Alfresco.logger.debug("Setting canBubble to default");
            canBubble = true;
        }
        if (typeof(cancelable) === 'undefined') {
            Alfresco.logger.debug("Setting cancelable to default");
            cancelable = true;
        }
        var evt;
        if (document.createEvent) {
            Alfresco.logger.debug("document.createEvent available");
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(eventType, canBubble, cancelable);
            return node.dispatchEvent(evt);
        } else {
            Alfresco.logger.debug("document.createEvent not available");
            evt = document.createEventObject();
            return node.fireEvent('on' + eventType, evt);
        }
    }
};

// Old IE compatibility
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    }
}