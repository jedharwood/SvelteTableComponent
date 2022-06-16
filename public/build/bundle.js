
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', `display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ` +
            `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = `data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>`;
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Badge.svelte generated by Svelte v3.24.1 */

    const file = "src/components/Badge.svelte";

    function create_fragment(ctx) {
    	let button;
    	let t0;
    	let t1;
    	let button_class_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("+");
    			t1 = text(/*hiddenBreeds*/ ctx[0]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*badgeStyle*/ ctx[1]) + " svelte-1mnxpim"));
    			add_location(button, file, 28, 0, 502);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hiddenBreeds*/ 1) set_data_dev(t1, /*hiddenBreeds*/ ctx[0]);

    			if (dirty & /*badgeStyle*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*badgeStyle*/ ctx[1]) + " svelte-1mnxpim"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { hiddenBreeds } = $$props;
    	const writable_props = ["hiddenBreeds"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Badge> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Badge", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("hiddenBreeds" in $$props) $$invalidate(0, hiddenBreeds = $$props.hiddenBreeds);
    	};

    	$$self.$capture_state = () => ({ hiddenBreeds, badgeStyle });

    	$$self.$inject_state = $$props => {
    		if ("hiddenBreeds" in $$props) $$invalidate(0, hiddenBreeds = $$props.hiddenBreeds);
    		if ("badgeStyle" in $$props) $$invalidate(1, badgeStyle = $$props.badgeStyle);
    	};

    	let badgeStyle;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*hiddenBreeds*/ 1) {
    			 $$invalidate(1, badgeStyle = hiddenBreeds > 0 ? "badge" : "hidden");
    		}
    	};

    	return [hiddenBreeds, badgeStyle];
    }

    class Badge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { hiddenBreeds: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Badge",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hiddenBreeds*/ ctx[0] === undefined && !("hiddenBreeds" in props)) {
    			console.warn("<Badge> was created without expected prop 'hiddenBreeds'");
    		}
    	}

    	get hiddenBreeds() {
    		throw new Error("<Badge>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hiddenBreeds(value) {
    		throw new Error("<Badge>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ./src/components/BreedNamesDisplay.svelte generated by Svelte v3.24.1 */
    const file$1 = "./src/components/BreedNamesDisplay.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (65:2) {#each breedsToShow as r}
    function create_each_block(ctx) {
    	let span;
    	let t_value = /*r*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "breed svelte-1rng1r");
    			add_location(span, file$1, 65, 4, 1909);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*breedsToShow*/ 4 && t_value !== (t_value = /*r*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(65:2) {#each breedsToShow as r}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t;
    	let badge;
    	let div_resize_listener;
    	let current;
    	let each_value = /*breedsToShow*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	badge = new Badge({
    			props: { hiddenBreeds: /*hiddenBreeds*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			create_component(badge.$$.fragment);
    			attr_dev(div, "class", "client svelte-1rng1r");
    			add_render_callback(() => /*div_elementresize_handler*/ ctx[4].call(div));
    			add_location(div, file$1, 63, 0, 1824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			mount_component(badge, div, null);
    			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[4].bind(div));
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*breedsToShow*/ 4) {
    				each_value = /*breedsToShow*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const badge_changes = {};
    			if (dirty & /*hiddenBreeds*/ 2) badge_changes.hiddenBreeds = /*hiddenBreeds*/ ctx[1];
    			badge.$set(badge_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(badge.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(badge.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			destroy_component(badge);
    			div_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const NON_BREAKING_SPACE = " ";
    const BADGE_PLUS_ELLIPSIS = 47;

    function instance$1($$self, $$props, $$invalidate) {
    	let { breedNames } = $$props;
    	let currentWidth = 0, hiddenBreeds = 0;

    	const appendComma = (array, i) => {
    		return array.length < 2 || i === array.length - 1
    		? array[i]
    		: `${array[i]},${NON_BREAKING_SPACE}`;
    	};

    	const setHiddenBreeds = filteredBreeds => {
    		return $$invalidate(1, hiddenBreeds = filteredBreeds[filteredBreeds.length - 1] === "..."
    		? breedNames.length - (filteredBreeds.length - 1)
    		: 0);
    	};

    	const renderBreedNames = currentWidth => {
    		let filteredBreeds = [], i = 0, sumWidth = 0;

    		while (i < breedNames.length && sumWidth < currentWidth) {
    			let span = document.createElement("span");
    			span.classList.add("breed");
    			span.textContent = appendComma(breedNames, i);
    			document.body.appendChild(span);
    			sumWidth += span.getBoundingClientRect().width;
    			document.body.removeChild(span);

    			if (sumWidth < currentWidth - BADGE_PLUS_ELLIPSIS) {
    				filteredBreeds.push(breedNames[i]);
    				i++;
    			}

    			if (sumWidth > currentWidth) {
    				filteredBreeds.push("...");
    				i++;
    			}
    		}

    		for (let i = 0; i < filteredBreeds.length; i++) {
    			filteredBreeds[i] = appendComma(filteredBreeds, i);
    		}

    		setHiddenBreeds(filteredBreeds);
    		return filteredBreeds;
    	};

    	const writable_props = ["breedNames"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BreedNamesDisplay> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("BreedNamesDisplay", $$slots, []);

    	function div_elementresize_handler() {
    		currentWidth = this.clientWidth;
    		$$invalidate(0, currentWidth);
    	}

    	$$self.$$set = $$props => {
    		if ("breedNames" in $$props) $$invalidate(3, breedNames = $$props.breedNames);
    	};

    	$$self.$capture_state = () => ({
    		Badge,
    		breedNames,
    		NON_BREAKING_SPACE,
    		BADGE_PLUS_ELLIPSIS,
    		currentWidth,
    		hiddenBreeds,
    		appendComma,
    		setHiddenBreeds,
    		renderBreedNames,
    		breedsToShow
    	});

    	$$self.$inject_state = $$props => {
    		if ("breedNames" in $$props) $$invalidate(3, breedNames = $$props.breedNames);
    		if ("currentWidth" in $$props) $$invalidate(0, currentWidth = $$props.currentWidth);
    		if ("hiddenBreeds" in $$props) $$invalidate(1, hiddenBreeds = $$props.hiddenBreeds);
    		if ("breedsToShow" in $$props) $$invalidate(2, breedsToShow = $$props.breedsToShow);
    	};

    	let breedsToShow;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentWidth*/ 1) {
    			 $$invalidate(2, breedsToShow = renderBreedNames(currentWidth));
    		}
    	};

    	return [
    		currentWidth,
    		hiddenBreeds,
    		breedsToShow,
    		breedNames,
    		div_elementresize_handler
    	];
    }

    class BreedNamesDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { breedNames: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BreedNamesDisplay",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*breedNames*/ ctx[3] === undefined && !("breedNames" in props)) {
    			console.warn("<BreedNamesDisplay> was created without expected prop 'breedNames'");
    		}
    	}

    	get breedNames() {
    		throw new Error("<BreedNamesDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set breedNames(value) {
    		throw new Error("<BreedNamesDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ./src/components/AnimalTable.svelte generated by Svelte v3.24.1 */
    const file$2 = "./src/components/AnimalTable.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i].species;
    	child_ctx[3] = list[i].breedNames;
    	return child_ctx;
    }

    // (71:4) {#each animals as { species, breedNames }}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*species*/ ctx[2] + "";
    	let t0;
    	let t1;
    	let td1;
    	let breednamesdisplay;
    	let t2;
    	let td2;
    	let t3_value = /*breedNames*/ ctx[3].length + "";
    	let t3;
    	let t4;
    	let current;

    	breednamesdisplay = new BreedNamesDisplay({
    			props: { breedNames: /*breedNames*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			create_component(breednamesdisplay.$$.fragment);
    			t2 = space();
    			td2 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(td0, "class", "svelte-wfb8a5");
    			add_location(td0, file$2, 72, 8, 1212);
    			attr_dev(td1, "class", "svelte-wfb8a5");
    			add_location(td1, file$2, 73, 8, 1239);
    			attr_dev(td2, "class", "align-right svelte-wfb8a5");
    			add_location(td2, file$2, 76, 8, 1311);
    			add_location(tr, file$2, 71, 6, 1199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			mount_component(breednamesdisplay, td1, null);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, t3);
    			append_dev(tr, t4);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*animals*/ 1) && t0_value !== (t0_value = /*species*/ ctx[2] + "")) set_data_dev(t0, t0_value);
    			const breednamesdisplay_changes = {};
    			if (dirty & /*animals*/ 1) breednamesdisplay_changes.breedNames = /*breedNames*/ ctx[3];
    			breednamesdisplay.$set(breednamesdisplay_changes);
    			if ((!current || dirty & /*animals*/ 1) && t3_value !== (t3_value = /*breedNames*/ ctx[3].length + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(breednamesdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(breednamesdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(breednamesdisplay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(71:4) {#each animals as { species, breedNames }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tbody;
    	let current;
    	let each_value = /*animals*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Species";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Breeds";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "# of breeds";
    			t5 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "svelte-wfb8a5");
    			add_location(th0, file$2, 64, 6, 1029);
    			attr_dev(th1, "class", "svelte-wfb8a5");
    			add_location(th1, file$2, 65, 6, 1052);
    			attr_dev(th2, "class", "align-right svelte-wfb8a5");
    			add_location(th2, file$2, 66, 6, 1074);
    			add_location(tr, file$2, 63, 4, 1018);
    			add_location(thead, file$2, 62, 2, 1006);
    			attr_dev(tbody, "class", "svelte-wfb8a5");
    			add_location(tbody, file$2, 69, 2, 1138);
    			attr_dev(table, "cellspacing", "0");
    			attr_dev(table, "class", "svelte-wfb8a5");
    			add_location(table, file$2, 61, 0, 980);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(table, t5);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*animals*/ 1) {
    				each_value = /*animals*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	
    	let { animals } = $$props;

    	const alphabetize = (a, b) => {
    		if (a.species < b.species) {
    			return -1;
    		}

    		if (a.species > b.species) {
    			return 1;
    		}

    		return 0;
    	};

    	animals.sort(alphabetize);
    	const writable_props = ["animals"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AnimalTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AnimalTable", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("animals" in $$props) $$invalidate(0, animals = $$props.animals);
    	};

    	$$self.$capture_state = () => ({ BreedNamesDisplay, animals, alphabetize });

    	$$self.$inject_state = $$props => {
    		if ("animals" in $$props) $$invalidate(0, animals = $$props.animals);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [animals];
    }

    class AnimalTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { animals: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnimalTable",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*animals*/ ctx[0] === undefined && !("animals" in props)) {
    			console.warn("<AnimalTable> was created without expected prop 'animals'");
    		}
    	}

    	get animals() {
    		throw new Error("<AnimalTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animals(value) {
    		throw new Error("<AnimalTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const mockData = [
        {
            species: 'Dog',
            breedNames: [
                'Alsatian',
                'Great Dane',
                'Jack Russel',
                'Doberman',
                'Whipet',
                'Spaniel',
                'Red Setter',
            ],
        },
        {
            species: 'Cat',
            breedNames: [
                'Emotionally distant cat',
                'Aloof cat',
                'Unavailable cat',
                'Disinterested cat',
                'Judgemental cat',
                'Dog7',
            ],
        },
        {
            species: 'Bird',
            breedNames: [
                'Minah bird',
                'Sparrow',
                'Kingfisher',
                'Pelican',
                'Heron',
                'Parrot',
            ],
        },
        {
            species: 'Elephant',
            breedNames: ['African', 'Indian'],
        },
        {
            species: 'Slug',
            breedNames: ['Just a slug'],
        },
    ];
    const appData = {
        appName: 'Animals table',
        subTitle: 'An exercise in creating a dynamically resizable table in Svelte.js. The Breed names column will render a string array of names. As the width of the table decreases the bred names will be hidden and replaced by a badge which will show the number of names that are not displayed.',
    };

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h3;
    	let t3;
    	let animaltable;
    	let current;

    	animaltable = new AnimalTable({
    			props: { animals: /*animals*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = `${appData.appName}`;
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = `${appData.subTitle}`;
    			t3 = space();
    			create_component(animaltable.$$.fragment);
    			attr_dev(h1, "class", "svelte-du2sr7");
    			add_location(h1, file$3, 24, 2, 410);
    			attr_dev(h3, "class", "svelte-du2sr7");
    			add_location(h3, file$3, 25, 2, 439);
    			attr_dev(main, "class", "svelte-du2sr7");
    			add_location(main, file$3, 23, 0, 401);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h3);
    			append_dev(main, t3);
    			mount_component(animaltable, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(animaltable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(animaltable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(animaltable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const animals = mockData;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ AnimalTable, mockData, appData, animals });
    	return [animals];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
