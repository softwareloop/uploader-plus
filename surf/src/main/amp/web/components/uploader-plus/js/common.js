var SoftwareLoop = SoftwareLoop || {
    hitch: function (scope, f) {
        return function () {
            f.apply(scope, arguments);
        }
    },

    printStackTrace: function (e) {
        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n');
        console.log(e.message, stack);
    },

    fireEvent: function (node, eventType, canBubble, cancelable) {
        if (typeof(canBubble) === 'undefined') {
            canBubble = true;
        }
        if (typeof(cancelable) === 'undefined') {
            cancelable = true;
        }
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(eventType, canBubble, cancelable);
        node.dispatchEvent(evt);
    }
};
