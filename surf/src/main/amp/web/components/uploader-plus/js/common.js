var SoftwareLoop = {
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
        console.log(stack);
    }
};
