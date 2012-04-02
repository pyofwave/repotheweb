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

						/* <a>, <area>, etc. All added elements, before or after page load. */

						utils.on(document, 'click', function(e) {
								/* Correct IE, partially in vain */
								var target;
                if (e.target) target = e.target
								else target = e.srcElement;

								if (!target.hasAttribute('href')) return; // Only activate if the tag is a link, HTML5 style

								/* Go to the altered URL returned by the simulation */
                open(sim.simulate_rph(target.href), target.target ? target.target : "_self");
								e.preventDefault();
								return false;
            });

						/* Custom API that can be used to ensure the browser APIs work. */
						location.url = sim.simulate_rph;

						/* <form> Applies onready */
						function submit(e) {
							el = this;
							if (e.srcElement) el = e.srcElement;

							if (el.method == "GET") { // only supports GET, POST doesn't have APIs to my knowledge
								location.replace(sim.simulate_rph(el.action + '?' + utils.serialize(el)));
								e.preventDefault();
								return false;
							}
						}

						$(function() {
						var forms = document.querySelectorAll('form');
						for (var i; i < forms.length; i++) {
							utils.on(forms[i], 'submit', submit);
						}
						});

        } // end if
				else location.url = function(url) {return url;} // Keep custom API support.
    }); // end require
