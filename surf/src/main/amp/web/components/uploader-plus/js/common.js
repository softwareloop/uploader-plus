var SoftwareLoop = SoftwareLoop || {
    hitch: function (scope, f) {
        return function () {
            f.apply(scope, arguments);
        }
    },

    printStackTrace: function (e) {
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
        if (typeof(canBubble) === 'undefined') {
            canBubble = true;
        }
        if (typeof(cancelable) === 'undefined') {
            cancelable = true;
        }
        var evt;
        if (document.createEvent) {
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(eventType, canBubble, cancelable);
            return node.dispatchEvent(evt);
        } else {
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