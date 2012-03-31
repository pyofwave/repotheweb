define('utils', ['onready', 'config'],
       function ($, config) {
           var doc = document,
             iframe = doc.createElement("iframe");
           // iframe.style.display = "none";
           // doc.body.appendChild(iframe);
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
								/* On is used to ensure handlers aren't unintionally overwritten */
								on : function(el, event, handler) {
									if (el.addEventListener)
										el.addEventListener(event, handler);
									else
										el.attachEvent('on'+event, function() {handler(event);});
								},
								/* Artificially submit forms */
								serialize: function(form) {
									if (!form || !form.elements) return;

									var serial = [], i, j, first;
									var add = function (name, value) {
										serial.push(encodeURIComponent(name) + (value.length ? '=' + encodeURIComponent(value) : ''));
									}

									var elems = form.elements;
									for (i = 0; i < elems.length; i += 1, first = false) {
										if (elems[i].name.length) { /* don't include unnamed elements */
											switch (elems[i].type) {
												case 'select-one': first = true;
												case 'select-multiple':
													for (j = 0; j < elems[i].options.length; j += 1)
														if (elems[i].options[j].selected) {
															add(elems[i].name, elems[i].options[j].value);
															if (first) break; /* stop searching for select-one */
														}
													break;
												case 'checkbox':
												case 'radio': if (!elems[i].checked) break; /* else continue */
												default: add(elems[i].name, elems[i].value); break;
											}
										}
									}

									return serial.join('&');
								}
           };
       });


