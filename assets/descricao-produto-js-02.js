(function () {\n var components = document.querySelectorAll('[data-ci-component]');
 if (!components.length) return;
 for (var i = 0; i < components.length; i++) {\n (function (component) {\n var tabs = component.querySelectorAll('[data-ci-tab]');
 var panes = component.querySelectorAll('[data-ci-pane]');
 if (tabs.length && panes.length) {\n var showPane = function (id) {\n for (var t = 0; t < tabs.length; t++) {\n var tab = tabs[t];
 tab.classList.toggle('ci-idface__tab--active', tab.getAttribute('data-ci-tab') === id);
 }
 for (var p = 0; p < panes.length; p++) {\n var pane = panes[p];
 pane.classList.toggle('ci-idface__pane--active', pane.getAttribute('data-ci-pane') === id);
 }
 };
 for (var x = 0; x < tabs.length; x++) {\n tabs[x].addEventListener('click', function (evt) {\n evt.preventDefault();
 showPane(this.getAttribute('data-ci-tab'));
 });
 }\n showPane(tabs[0].getAttribute('data-ci-tab'));
 }\n var faqItems = component.querySelectorAll('[data-ci-faq]');
 if (faqItems.length) {\n var updateHeights = function () {\n for (var j = 0; j < faqItems.length; j++) {\n var opened = faqItems[j];
 if (opened.classList.contains('ci-idface__faq-item--open')) {\n var ans = opened.querySelector('[data-ci-faq-answer]');
 if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
 }
 }
 };
 var ensureVisible = function (answer) {\n var rect = answer.getBoundingClientRect();
 var limit = window.innerHeight - 24;
 if (rect.bottom > limit) {\n window.scrollBy( {\n top: rect.bottom - limit, behavior: 'smooth' });
 }
 };
 for (var y = 0; y < faqItems.length; y++) {\n (function (item) {\n var toggle = item.querySelector('[data-ci-faq-toggle]');
 var answer = item.querySelector('[data-ci-faq-answer]');
 var icon = item.querySelector('[data-ci-faq-icon]');
 if (!toggle || !answer) return;
 var setState = function (state, scroll) {\n item.classList.toggle('ci-idface__faq-item--open', state);
 answer.style.maxHeight = state ? answer.scrollHeight + 'px' : '0px';
 answer.setAttribute('aria-hidden', (!state).toString());
 toggle.setAttribute('aria-expanded', state.toString());
 if (icon) icon.textContent = state ? '-' : '+';
 if (state && scroll) {\n requestAnimationFrame(function () {\n ensureVisible(answer);
 });
 }
 };
 toggle.addEventListener('click', function (evt) {\n evt.preventDefault();
 var opening = !item.classList.contains('ci-idface__faq-item--open');
 setState(opening, opening);
 });
 setState(false, false);
 })(faqItems[y]);
 }\n window.addEventListener('resize', updateHeights);
 }
 })(components[i]);
 }
})();