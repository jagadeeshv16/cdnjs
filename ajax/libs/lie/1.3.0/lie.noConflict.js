;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("calvinmetcalf-setImmediate/lib/index.js", function(exports, require, module){
"use strict";
var types = [
    require("./realSetImmediate"),
    require("./nextTick"),
    require("./postMessage"),
    require("./messageChannel"),
    require("./stateChange"),
    require("./timeout")
];
var handlerQueue = [];

function drainQueue() {
    var i = 0,
        task;
    /*jslint boss: true */
    while (task = handlerQueue[i++]) {
        task();
    }

    handlerQueue = [];
}
var nextTick;
types.some(function (obj) {
    var t = obj.test();
    if (t) {
        nextTick = obj.install(drainQueue);
    }
    return t;
});
var retFunc = function (task) {
    var len, args;
    if (arguments.length > 1 && typeof task === "function") {
        args = Array.prototype.slice.call(arguments, 1);
        args.unshift(undefined);
        task = task.bind.apply(task, args);
    }
    if ((len = handlerQueue.push(task)) === 1) {
        nextTick(drainQueue);
    }
    return len;
};
retFunc.clear = function (n) {
    if (n <= handlerQueue.length) {
        handlerQueue[n - 1] = function () {};
    }
    return this;
};
module.exports = retFunc;
});
require.register("calvinmetcalf-setImmediate/lib/realSetImmediate.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    return globe.setImmediate;
};

exports.install = function () {
    return globe.setImmediate.bind(globe);
};
});
require.register("calvinmetcalf-setImmediate/lib/nextTick.js", function(exports, require, module){
"use strict";
exports.test = function () {
    // Don't get fooled by e.g. browserify environments.
    return typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";
};

exports.install = function () {
    return process.nextTick;
};
});
require.register("calvinmetcalf-setImmediate/lib/postMessage.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    // The test against `importScripts` prevents this implementation from being installed inside a web worker,
    // where `global.postMessage` means something completely different and can"t be used for this purpose.

    if (!globe.postMessage || globe.importScripts) {
        return false;
    }

    var postMessageIsAsynchronous = true;
    var oldOnMessage = globe.onmessage;
    globe.onmessage = function () {
        postMessageIsAsynchronous = false;
    };
    globe.postMessage("", "*");
    globe.onmessage = oldOnMessage;

    return postMessageIsAsynchronous;
};

exports.install = function (func) {
    var codeWord = "com.calvinmetcalf.setImmediate" + Math.random();
    function globalMessage(event) {
        if (event.source === globe && event.data === codeWord) {
            func();
        }
    }
    if (globe.addEventListener) {
        globe.addEventListener("message", globalMessage, false);
    } else {
        globe.attachEvent("onmessage", globalMessage);
    }
    return function () {
        globe.postMessage(codeWord, "*");
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/messageChannel.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    return !!globe.MessageChannel;
};

exports.install = function (func) {
    var channel = new globe.MessageChannel();
    channel.port1.onmessage = func;
    return function () {
        channel.port2.postMessage(0);
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/stateChange.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    return "document" in globe && "onreadystatechange" in globe.document.createElement("script");
};

exports.install = function (handle) {
    return function () {

        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        var scriptEl = globe.document.createElement("script");
        scriptEl.onreadystatechange = function () {
            handle();

            scriptEl.onreadystatechange = null;
            scriptEl.parentNode.removeChild(scriptEl);
            scriptEl = null;
        };
        globe.document.documentElement.appendChild(scriptEl);

        return handle;
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/timeout.js", function(exports, require, module){
"use strict";
exports.test = function () {
    return true;
};

exports.install = function (t) {
    return function () {
        setTimeout(t, 0);
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/global.js", function(exports, require, module){
module.exports = typeof global === "object" && global ? global : this;
});
require.register("lie/lie.js", function(exports, require, module){
var immediate = require('immediate');
var func = 'function';
// Creates a deferred: an object with a promise and corresponding resolve/reject methods
function Deferred() {
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
    var handler = function(onFulfilled, onRejected, value) {
        // Case 1) handle a .then(onFulfilled, onRejected) call
        var createdDeffered;
        if (onFulfilled !== handler) {
            createdDeffered = createDeferred();
            handler.queue.push({
                deferred: createdDeffered,
                resolve: onFulfilled,
                reject: onRejected
            });
            return createdDeffered.promise;
        }

        // Case 2) handle a .resolve or .reject call
        // (`onFulfilled` acts as a sentinel)
        // The actual function signature is
        // .re[ject|solve](sentinel, success, value)
        var action = onRejected ? 'resolve' : 'reject',
            queue, deferred, callback;
        for (var i = 0, l = handler.queue.length; i < l; i++) {
            queue = handler.queue[i];
            deferred = queue.deferred;
            callback = queue[action];
            if (typeof callback !== func) {
                deferred[action](value);
            }
            else {
                execute(callback, value, deferred);
            }
        }
        // Replace this handler with a simple resolved or rejected handler
        handler = createHandler(promise, value, onRejected);
    };

    function Promise() {
        this.then = function(onFulfilled, onRejected) {
            return handler(onFulfilled, onRejected);
        };
    }
    var promise = new Promise();
    this.promise = promise;
    // The queue of deferreds
    handler.queue = [];

    this.resolve = function(value) {
        if (handler.queue) {
            handler(handler, true, value);
        }
    };

    this.fulfill = this.resolve;

    this.reject = function(reason) {
        if (handler.queue) {
            handler(handler, false, reason);
        }
    };
}

function createDeferred() {
    return new Deferred();
}

// Creates a fulfilled or rejected .then function
function createHandler(promise, value, success) {
    return function(onFulfilled, onRejected) {
        var callback = success ? onFulfilled : onRejected,
            result;
        if (typeof callback !== func) {
            return promise;
        }
        execute(callback, value, result = createDeferred());
        return result.promise;
    };
}

// Executes the callback with the specified value,
// resolving or rejecting the deferred
function execute(callback, value, deferred) {
    immediate(function() {
        var result;
        try {
            result = callback(value);
            if (result && typeof result.then === func) {
                result.then(deferred.resolve, deferred.reject);
            }
            else {
                deferred.resolve(result);
            }
        }
        catch (error) {
            deferred.reject(error);
        }
    });
}
// Returns a resolved promise
createDeferred.resolve = function(value) {
    var promise = {};
    promise.then = createHandler(promise, value, true);
    return promise;
};
// Returns a rejected promise
createDeferred.reject = function(reason) {
    var promise = {};
    promise.then = createHandler(promise, reason, false);
    return promise;
};
createDeferred.all = function(array) {
    var promise = createDeferred();
    var len = array.length;
    var resolved = 0;
    var out = [];
    var onSuccess = function(n) {
        return function(v) {
            out[n] = v;
            resolved++;
            if (resolved === len) {
                promise.resolve(out);
            }
        };
    };
    array.forEach(function(v, i) {
        v.then(onSuccess(i), function(a) {
            promise.reject(a);
        });
    });
    return promise.promise;
};
// Returns a deferred
createDeferred.immediate = immediate;
module.exports = createDeferred;
});
require.alias("calvinmetcalf-setImmediate/lib/index.js", "lie/deps/immediate/lib/index.js");
require.alias("calvinmetcalf-setImmediate/lib/realSetImmediate.js", "lie/deps/immediate/lib/realSetImmediate.js");
require.alias("calvinmetcalf-setImmediate/lib/nextTick.js", "lie/deps/immediate/lib/nextTick.js");
require.alias("calvinmetcalf-setImmediate/lib/postMessage.js", "lie/deps/immediate/lib/postMessage.js");
require.alias("calvinmetcalf-setImmediate/lib/messageChannel.js", "lie/deps/immediate/lib/messageChannel.js");
require.alias("calvinmetcalf-setImmediate/lib/stateChange.js", "lie/deps/immediate/lib/stateChange.js");
require.alias("calvinmetcalf-setImmediate/lib/timeout.js", "lie/deps/immediate/lib/timeout.js");
require.alias("calvinmetcalf-setImmediate/lib/global.js", "lie/deps/immediate/lib/global.js");
require.alias("calvinmetcalf-setImmediate/lib/index.js", "lie/deps/immediate/index.js");
require.alias("calvinmetcalf-setImmediate/lib/index.js", "immediate/index.js");
require.alias("calvinmetcalf-setImmediate/lib/index.js", "calvinmetcalf-setImmediate/index.js");

require.alias("lie/lie.js", "lie/index.js");

if (typeof exports == "object") {
  module.exports = require("lie");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("lie"); });
} else {
  this["lie"] = require("lie");
}})();