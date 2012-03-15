(function () {
/**
 * almond 0.0.2 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
/*jslint strict: false, plusplus: false */
/*global setTimeout: false */

var requirejs, require, define;
(function () {

    var defined = {},
        aps = [].slice,
        req;

    if (typeof define === "function") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseName = baseName.split("/");
                baseName = baseName.slice(0, baseName.length - 1);

                name = baseName.concat(name.split("/"));

                //start trimDots
                var i, part;
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }
        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(null, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = defined[prefix];

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    function main(name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, i, ret, map;

        //Use name if no relName
        if (!relName) {
            relName = name;
        }

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            if (deps) {
                for (i = 0; i < deps.length; i++) {
                    map = makeMap(deps[i], relName);
                    depName = map.f;

                    //Fast path CommonJS standard dependencies.
                    if (depName === "require") {
                        args[i] = makeRequire(name);
                    } else if (depName === "exports") {
                        //CommonJS module spec 1.1
                        args[i] = defined[name] = {};
                        usingExports = true;
                    } else if (depName === "module") {
                        //CommonJS module spec 1.1
                        cjsModule = args[i] = {
                            id: name,
                            uri: '',
                            exports: defined[name]
                        };
                    } else if (depName in defined) {
                        args[i] = defined[depName];
                    } else if (map.p) {
                        map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                        args[i] = defined[depName];
                    }
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undefined) {
                    defined[name] = cjsModule.exports;
                } else if (!usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    }

    requirejs = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {

            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return defined[makeMap(deps, callback).f];
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            //Drop the config stuff on the ground.
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = arguments[2];
            } else {
                deps = [];
            }
        }

        //Simulate async callback;
        if (forceSync) {
            main(null, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(null, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function () {
        return req;
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal for the value. Adjust args.
            callback = deps;
            deps = [];
        }

        main(name, deps, callback);
    };

    define.amd = {};
}());

define("../lib/almond.js", function(){});

define('jschannels', {
  //--- local embedded copy of jschannel: http://github.com/mozilla/jschannel
  Channel: (function() {
    // current transaction id, start out at a random *odd* number between 1 and a million
    // There is one current transaction counter id per page, and it's shared between
    // channel instances.  That means of all messages posted from a single javascript
    // evaluation context, we'll never have two with the same id.
    var s_curTranId = Math.floor(Math.random()*1000001);

    // no two bound channels in the same javascript evaluation context may have the same origin & scope.
    // futher if two bound channels have the same scope, they may not have *overlapping* origins
    // (either one or both support '*').  This restriction allows a single onMessage handler to efficiently
    // route messages based on origin and scope.  The s_boundChans maps origins to scopes, to message
    // handlers.  Request and Notification messages are routed using this table.
    // Finally, channels are inserted into this table when built, and removed when destroyed.
    var s_boundChans = { };

    // add a channel to s_boundChans, throwing if a dup exists
    function s_addBoundChan(origin, scope, handler) {
      // does she exist?
      var exists = false;
      if (origin === '*') {
        // we must check all other origins, sadly.
        for (var k in s_boundChans) {
          if (!s_boundChans.hasOwnProperty(k)) continue;
          if (k === '*') continue;
          if (typeof s_boundChans[k][scope] === 'object') {
            exists = true;
          }
        }
      } else {
        // we must check only '*'
        if ((s_boundChans['*'] && s_boundChans['*'][scope]) ||
            (s_boundChans[origin] && s_boundChans[origin][scope]))
        {
          exists = true;
        }
      }
      if (exists) throw "A channel already exists which overlaps with origin '"+ origin +"' and has scope '"+scope+"'";

      if (typeof s_boundChans[origin] != 'object') s_boundChans[origin] = { };
      s_boundChans[origin][scope] = handler;
    }

    function s_removeBoundChan(origin, scope) {
      delete s_boundChans[origin][scope];
      // possibly leave a empty object around.  whatevs.
    }

    function s_isArray(obj) {
      if (Array.isArray) return Array.isArray(obj);
      else {
        return (obj.constructor.toString().indexOf("Array") != -1);
      }
    }

    // No two outstanding outbound messages may have the same id, period.  Given that, a single table
    // mapping "transaction ids" to message handlers, allows efficient routing of Callback, Error, and
    // Response messages.  Entries are added to this table when requests are sent, and removed when
    // responses are received.
    var s_transIds = { };

    // class singleton onMessage handler
    // this function is registered once and all incoming messages route through here.  This
    // arrangement allows certain efficiencies, message data is only parsed once and dispatch
    // is more efficient, especially for large numbers of simultaneous channels.
    var s_onMessage = function(e) {
      var m = JSON.parse(e.data);
      if (typeof m !== 'object') return;

      var o = e.origin;
      var s = null;
      var i = null;
      var meth = null;

      if (typeof m.method === 'string') {
        var ar = m.method.split('::');
        if (ar.length == 2) {
          s = ar[0];
          meth = ar[1];
        } else {
          meth = m.method;
        }
      }

      if (typeof m.id !== 'undefined') i = m.id;

      // o is message origin
      // m is parsed message
      // s is message scope
      // i is message id (or null)
      // meth is unscoped method name
      // ^^ based on these factors we can route the message

      // if it has a method it's either a notification or a request,
      // route using s_boundChans
      if (typeof meth === 'string') {
        if (s_boundChans[o] && s_boundChans[o][s]) {
          s_boundChans[o][s](o, meth, m);
        } else if (s_boundChans['*'] && s_boundChans['*'][s]) {
          s_boundChans['*'][s](o, meth, m);
        }
      }
      // otherwise it must have an id (or be poorly formed
      else if (typeof i != 'undefined') {
        if (s_transIds[i]) s_transIds[i](o, meth, m);
      }
    };

    // Setup postMessage event listeners
    if (window.addEventListener) window.addEventListener('message', s_onMessage, false);
    else if(window.attachEvent) window.attachEvent('onmessage', s_onMessage);

    /* a messaging channel is constructed from a window and an origin.
     * the channel will assert that all messages received over the
     * channel match the origin
     *
     * Arguments to Channel.build(cfg):
     *
     *   cfg.window - the remote window with which we'll communication
     *   cfg.origin - the expected origin of the remote window, may be '*'
     *                which matches any origin
     *   cfg.scope  - the 'scope' of messages.  a scope string that is
     *                prepended to message names.  local and remote endpoints
     *                of a single channel must agree upon scope. Scope may
     *                not contain double colons ('::').
     *   cfg.debugOutput - A boolean value.  If true and window.console.log is
     *                a function, then debug strings will be emitted to that
     *                function.
     *   cfg.debugOutput - A boolean value.  If true and window.console.log is
     *                a function, then debug strings will be emitted to that
     *                function.
     *   cfg.postMessageObserver - A function that will be passed two arguments,
     *                an origin and a message.  It will be passed these immediately
     *                before messages are posted.
     *   cfg.gotMessageObserver - A function that will be passed two arguments,
     *                an origin and a message.  It will be passed these arguments
     *                immediately after they pass scope and origin checks, but before
     *                they are processed.
     *   cfg.onReady - A function that will be invoked when a channel becomes "ready",
     *                this occurs once both sides of the channel have been
     *                instantiated and an application level handshake is exchanged.
     *                the onReady function will be passed a single argument which is
     *                the channel object that was returned from build().
     */
    return {
      build: function(cfg) {
        var debug = function(m) {
          if (cfg.debugOutput && window.console && window.console.log) {
            // try to stringify, if it doesn't work we'll let javascript's built in toString do its magic
            try { if (typeof m !== 'string') m = JSON.stringify(m); } catch(e) { }
            console.log("["+chanId+"] " + m);
          }
        }

        /* browser capabilities check */
        if (!window.postMessage) throw("jschannel cannot run this browser, no postMessage");
        if (!window.JSON || !window.JSON.stringify || ! window.JSON.parse) {
          throw("jschannel cannot run this browser, no JSON parsing/serialization");
        }

        /* basic argument validation */
        if (typeof cfg != 'object') throw("Channel build invoked without a proper object argument");

        if (!cfg.window || !cfg.window.postMessage) throw("Channel.build() called without a valid window argument");

        /* we'd have to do a little more work to be able to run multiple channels that intercommunicate the same
         * window...  Not sure if we care to support that */
        if (window === cfg.window) throw("target window is same as present window -- not allowed");

        // let's require that the client specify an origin.  if we just assume '*' we'll be
        // propagating unsafe practices.  that would be lame.
        var validOrigin = false;
        if (typeof cfg.origin === 'string') {
          var oMatch;
          if (cfg.origin === "*") validOrigin = true;
          // allow valid domains under http and https.  Also, trim paths off otherwise valid origins.
          else if (null !== (oMatch = cfg.origin.match(/^https?:\/\/(?:[-a-zA-Z0-9\.])+(?::\d+)?/))) {
            cfg.origin = oMatch[0];
            validOrigin = true;
          }
        }

        if (!validOrigin) throw ("Channel.build() called with an invalid origin");

        if (typeof cfg.scope !== 'undefined') {
          if (typeof cfg.scope !== 'string') throw 'scope, when specified, must be a string';
          if (cfg.scope.split('::').length > 1) throw "scope may not contain double colons: '::'"
        }

        /* private variables */
        // generate a random and psuedo unique id for this channel
        var chanId = (function () {
          var text = "";
          var alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          for(var i=0; i < 5; i++) text += alpha.charAt(Math.floor(Math.random() * alpha.length));
          return text;
        })();

        // registrations: mapping method names to call objects
        var regTbl = { };
        // current oustanding sent requests
        var outTbl = { };
        // current oustanding received requests
        var inTbl = { };
        // are we ready yet?  when false we will block outbound messages.
        var ready = false;
        var pendingQueue = [ ];

        var createTransaction = function(id,origin,callbacks) {
          var shouldDelayReturn = false;
          var completed = false;

          return {
            origin: origin,
            invoke: function(cbName, v) {
              // verify in table
              if (!inTbl[id]) throw "attempting to invoke a callback of a non-existant transaction: " + id;
              // verify that the callback name is valid
              var valid = false;
              for (var i = 0; i < callbacks.length; i++) if (cbName === callbacks[i]) { valid = true; break; }
              if (!valid) throw "request supports no such callback '" + cbName + "'";

              // send callback invocation
              postMessage({ id: id, callback: cbName, params: v});
            },
            error: function(error, message) {
              completed = true;
              // verify in table
              if (!inTbl[id]) throw "error called for non-existant message: " + id;

              // remove transaction from table
              delete inTbl[id];

              // send error
              postMessage({ id: id, error: error, message: message });
            },
            complete: function(v) {
              completed = true;
              // verify in table
              if (!inTbl[id]) throw "complete called for non-existant message: " + id;
              // remove transaction from table
              delete inTbl[id];
              // send complete
              postMessage({ id: id, result: v });
            },
            delayReturn: function(delay) {
              if (typeof delay === 'boolean') {
                shouldDelayReturn = (delay === true);
              }
              return shouldDelayReturn;
            },
            completed: function() {
              return completed;
            }
          };
        }

        var onMessage = function(origin, method, m) {
          // if an observer was specified at allocation time, invoke it
          if (typeof cfg.gotMessageObserver === 'function') {
            // pass observer a clone of the object so that our
            // manipulations are not visible (i.e. method unscoping).
            // This is not particularly efficient, but then we expect
            // that message observers are primarily for debugging anyway.
            try {
              cfg.gotMessageObserver(origin, m);
            } catch (e) {
              debug("gotMessageObserver() raised an exception: " + e.toString());
            }
          }

          // now, what type of message is this?
          if (m.id && method) {
            // a request!  do we have a registered handler for this request?
            if (regTbl[method]) {
              var trans = createTransaction(m.id, origin, m.callbacks ? m.callbacks : [ ]);
              inTbl[m.id] = { };
              try {
                // callback handling.  we'll magically create functions inside the parameter list for each
                // callback
                if (m.callbacks && s_isArray(m.callbacks) && m.callbacks.length > 0) {
                  for (var i = 0; i < m.callbacks.length; i++) {
                    var path = m.callbacks[i];
                    var obj = m.params;
                    var pathItems = path.split('/');
                    for (var j = 0; j < pathItems.length - 1; j++) {
                      var cp = pathItems[j];
                      if (typeof obj[cp] !== 'object') obj[cp] = { };
                      obj = obj[cp];
                    }
                    obj[pathItems[pathItems.length - 1]] = (function() {
                      var cbName = path;
                      return function(params) {
                        return trans.invoke(cbName, params);
                      }
                    })();
                  }
                }
                var resp = regTbl[method](trans, m.params);
                if (!trans.delayReturn() && !trans.completed()) trans.complete(resp);
              } catch(e) {
                // automagic handling of exceptions:
                var error = "runtime_error";
                var message = null;
                // * if its a string then it gets an error code of 'runtime_error' and string is the message
                if (typeof e === 'string') {
                  message = e;
                } else if (typeof e === 'object') {
                  // either an array or an object
                  // * if its an array of length two, then  array[0] is the code, array[1] is the error message
                  if (e && s_isArray(e) && e.length == 2) {
                    error = e[0];
                    message = e[1];
                  }
                  // * if its an object then we'll look form error and message parameters
                  else if (typeof e.error === 'string') {
                    error = e.error;
                    if (!e.message) message = "";
                    else if (typeof e.message === 'string') message = e.message;
                    else e = e.message; // let the stringify/toString message give us a reasonable verbose error string
                  }
                }

                // message is *still* null, let's try harder
                if (message === null) {
                  try {
                    message = JSON.stringify(e);
                  } catch (e2) {
                    message = e.toString();
                  }
                }

                trans.error(error,message);
              }
            }
          } else if (m.id && m.callback) {
            if (!outTbl[m.id] ||!outTbl[m.id].callbacks || !outTbl[m.id].callbacks[m.callback])
            {
              debug("ignoring invalid callback, id:"+m.id+ " (" + m.callback +")");
            } else {
              // XXX: what if client code raises an exception here?
              outTbl[m.id].callbacks[m.callback](m.params);
            }
          } else if (m.id) {
            if (!outTbl[m.id]) {
              debug("ignoring invalid response: " + m.id);
            } else {
              // XXX: what if client code raises an exception here?
              if (m.error) {
                (1,outTbl[m.id].error)(m.error, m.message);
              } else {
                if (m.result !== undefined) (1,outTbl[m.id].success)(m.result);
                else (1,outTbl[m.id].success)();
              }
              delete outTbl[m.id];
              delete s_transIds[m.id];
            }
          } else if (method) {
            // tis a notification.
            if (regTbl[method]) {
              // yep, there's a handler for that.
              // transaction is null for notifications.
              regTbl[method](null, m.params);
              // if the client throws, we'll just let it bubble out
              // what can we do?  Also, here we'll ignore return values
            }
          }
        };

        // now register our bound channel for msg routing
        s_addBoundChan(cfg.origin, ((typeof cfg.scope === 'string') ? cfg.scope : ''), onMessage);

        // scope method names based on cfg.scope specified when the Channel was instantiated
        var scopeMethod = function(m) {
          if (typeof cfg.scope === 'string' && cfg.scope.length) m = [cfg.scope, m].join("::");
          return m;
        };

        // a small wrapper around postmessage whose primary function is to handle the
        // case that clients start sending messages before the other end is "ready"
        var postMessage = function(msg, force) {
          if (!msg) throw "postMessage called with null message";

          // delay posting if we're not ready yet.
          var verb = (ready ? "post  " : "queue ");
          debug(verb + " message: " + JSON.stringify(msg));
          if (!force && !ready) {
            pendingQueue.push(msg);
          } else {
            if (typeof cfg.postMessageObserver === 'function') {
              try {
                cfg.postMessageObserver(cfg.origin, msg);
              } catch (e) {
                debug("postMessageObserver() raised an exception: " + e.toString());
              }
            }

            cfg.window.postMessage(JSON.stringify(msg), cfg.origin);
          }
        };

        var onReady = function(trans, type) {
          debug('ready msg received');
          if (ready) throw "received ready message while in ready state.  help!";

          if (type === 'ping') {
            chanId += '-R';
          } else {
            chanId += '-L';
          }

          obj.unbind('__ready'); // now this handler isn't needed any more.
          ready = true;
          debug('ready msg accepted.');

          if (type === 'ping') {
            obj.notify({ method: '__ready', params: 'pong' });
          }

          // flush queue
          while (pendingQueue.length) {
            postMessage(pendingQueue.pop());
          }

          // invoke onReady observer if provided
          if (typeof cfg.onReady === 'function') cfg.onReady(obj);
        };

        var obj = {
          // tries to unbind a bound message handler.  returns false if not possible
          unbind: function (method) {
            if (regTbl[method]) {
              if (!(delete regTbl[method])) throw ("can't delete method: " + method);
              return true;
            }
            return false;
          },
          bind: function (method, cb) {
            if (!method || typeof method !== 'string') throw "'method' argument to bind must be string";
            if (!cb || typeof cb !== 'function') throw "callback missing from bind params";

            if (regTbl[method]) throw "method '"+method+"' is already bound!";
            regTbl[method] = cb;
          },
          call: function(m) {
            if (!m) throw 'missing arguments to call function';
            if (!m.method || typeof m.method !== 'string') throw "'method' argument to call must be string";
            if (!m.success || typeof m.success !== 'function') throw "'success' callback missing from call";

            // now it's time to support the 'callback' feature of jschannel.  We'll traverse the argument
            // object and pick out all of the functions that were passed as arguments.
            var callbacks = { };
            var callbackNames = [ ];

            var pruneFunctions = function (path, obj) {
              if (typeof obj === 'object') {
                for (var k in obj) {
                  if (!obj.hasOwnProperty(k)) continue;
                  var np = path + (path.length ? '/' : '') + k;
                  if (typeof obj[k] === 'function') {
                    callbacks[np] = obj[k];
                    callbackNames.push(np);
                    delete obj[k];
                  } else if (typeof obj[k] === 'object') {
                    pruneFunctions(np, obj[k]);
                  }
                }
              }
            };
            pruneFunctions("", m.params);

            // build a 'request' message and send it
            var msg = { id: s_curTranId, method: scopeMethod(m.method), params: m.params };
            if (callbackNames.length) msg.callbacks = callbackNames;

            // insert into the transaction table
            outTbl[s_curTranId] = { callbacks: callbacks, error: m.error, success: m.success };
            s_transIds[s_curTranId] = onMessage;

            // increment current id
            s_curTranId++;

            postMessage(msg);
          },
          notify: function(m) {
            if (!m) throw 'missing arguments to notify function';
            if (!m.method || typeof m.method !== 'string') throw "'method' argument to notify must be string";

            // no need to go into any transaction table
            postMessage({ method: scopeMethod(m.method), params: m.params });
          },
          destroy: function () {
            s_removeBoundChan(cfg.origin, ((typeof cfg.scope === 'string') ? cfg.scope : ''));
            if (window.removeEventListener) window.removeEventListener('message', onMessage, false);
            else if(window.detachEvent) window.detachEvent('onmessage', onMessage);
            ready = false;
            regTbl = { };
            inTbl = { };
            outTbl = { };
            cfg.origin = null;
            pendingQueue = [ ];
            debug("channel destroyed");
            chanId = "";
          }
        };

        obj.bind('__ready', onReady);
        setTimeout(function() {
          postMessage({ method: scopeMethod('__ready'), params: "ping" }, true);
        }, 0);

        return obj;
      }
    };
  })()
  // TODO include browserid/static/resources/jschannels.js
});
define('config', {
  ipServer: 'http://dev.repotheweb.org:8001',
  chan: undefined
});
/* local copy of of OnReady.js, altered slightly to work with Require.js 
   http://tobyho.com/2010/03/21/onready-in-a-smaller-package/ */
define('onready',[], function(){
    var addLoadListener
    var removeLoadListener
    if (window.addEventListener){
        addLoadListener = function(func){
            window.addEventListener('DOMContentLoaded', func, false)
            window.addEventListener('load', func, false)
        }
        removeLoadListener = function(func){
            window.removeEventListener('DOMContentLoaded', func, false)
            window.removeEventListener('load', func, false)
        }
    }else if (document.attachEvent){
        addLoadListener = function(func){
            document.attachEvent('onreadystatechange', func)
            document.attachEvent('load', func)
        }
        removeLoadListener = function(func){
            document.detachEvent('onreadystatechange', func)
            document.detachEvent('load', func)
        }
    }
    
    var callbacks = null
    var done = false
    function __onReady(){
        done = true
        removeLoadListener(__onReady)
        if (!callbacks) return
        for (var i = 0; i < callbacks.length; i++){
            callbacks[i]()
        }
        callbacks = null
    }
    function OnReady(func){
        if (done){
            func()
            return
        }
        if (!callbacks){
            callbacks = []
            addLoadListener(__onReady)
        }
        callbacks.push(func)
    }
    return OnReady
})

;
define('utils', ['onready', 'config'],
       function ($, config) {
           var doc = document,
             iframe = doc.createElement("iframe");
           // iframe.style.display = "none";
           doc.body.appendChild(iframe);
           iframe.src = config.ipServer + "/rph_iframe.html";
           iframe.style.position = 'absolute';
           iframe.style.left = -7000;

           $(function() {document.body.appendChild(iframe);});

           return {
               iframe: iframe,
							 getFavicon : function() {
									// In any URL based element, href is the full path, which is accessed here
									var link = document.querySelector('link[rel~=icon]');
									if (link != undefined) return link.href;
					
									link = document.createElement('a');
									link.href = "/favicon.ico";
									return link.href;
								},
           };
       });



define(
    'simulator',
    ['config', 'jschannels', 'utils'],
    function (config, jschannels, utils) {
        return {
            /* BEGIN registerProtocolHandler simulator
*
* When a user visits a link that isn't a standard
* internet protocol, this code will forward to a
* redirection page:
* http://bewehtoper.org?fallback#fakeURL
* Where the fallback is optional. 
*
* Currently only works on <a> tags.
*/
            simulate_rph: function (url) {
                var scheme = url.split(':')[0],
                    official_schemes = [
                    'http', 'https', 'ftp', 'gopher'
                    ], //gopher, I kid, I kid
                    prtcl_hndlr, fallback;
                if (url.indexOf(official_schemes) == 0) {
                    return url;  // no change
                }
                // ensure handler_list exists
                fallback = document.querySelector('meta[name=fallback-rph][protocol=' + scheme + ']').content;
								fallback = fallback ? '?' + escape(fallback) : ''; // Include the fallback if it exists
                return config.ipServer + fallback + '#' + url;
            }, /* simulate_rph */
        };
    });



/*jslint strict: false, plusplus: false */
/*global require: true, navigator: true, window: true */
require(
    ['jschannels', 'simulator', 'utils', 'config', 'onready'],
    function (jschannels, sim, utils, config, $) {
        if (!navigator.xregisterProtocolHandler || !navigator._registerProtocolHandlerIsShimmed) {
            var simulate_rph;
            navigator.xregisterProtocolHandler = function (scheme, url, title) {
                // Prompt user, if conset, store locally
                var domain_parts, domain,
                doc = window.document,
                iframe = utils.iframe,
                chan = config.chan;

                if (url.indexOf("%s") == -1) {
                    if (window.console) console.error("url missing %s " + url);
                    return;
                }
                domain_parts = url.split('/');
                if (domain_parts.length < 2) {
                    if (window.console) console.error("Improper url " + url);
                    return;
                }
                domain = domain_parts[2];

                $(function() {
                    // clean up a previous channel that never was reaped
                    if (chan) chan.destroy();
                    chan = jschannels.Channel.build({'window': iframe.contentWindow, 'origin': '*', 'scope': "mozid"});

                    function cleanup() {
                        chan.destroy();
                        config.chan = undefined;
                    }

                    chan.call({
                                  method: "registerProtocolHandler",
                                  params: {scheme: scheme, url: url, title:title, icon:utils.getFavicon()},
                                  success: function (rv) {
                                      cleanup();
                                  },
                                  error: function(code, msg) {

                                  }
                              });//chan.call
                });

                navigator._registerProtocolHandlerIsShimmed = true;

            }

            document.onclick = function(e) {
								/* Correct IE, partially in vain */
								var target;
                if (!e) e = window.event;
                if (e.target) target = e.target
								else target = e.srcElement;

                if (target.nodeName.toLowerCase() != "a") return;  // Only activate on <a> tags

								/* Go to the altered URL returned by the simulation */
                open(sim.simulate_rph(target.href), target.target ? target.target : "_self");
								return false;
            }

        } // end if
    }); // end require
;
define("include", function(){});
}());