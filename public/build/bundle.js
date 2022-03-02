
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    function hasContext(key) {
        return get_current_component().$$.context.has(key);
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
            set_current_component(null);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function p(e,a=!1){return e=e.slice(e.startsWith("/#")?2:0,e.endsWith("/*")?-2:void 0),e.startsWith("/")||(e="/"+e),e==="/"&&(e=""),a&&!e.endsWith("/")&&(e+="/"),e}function d(e,a){e=p(e,!0),a=p(a,!0);let r=[],n={},t=!0,s=e.split("/").map(c=>c.startsWith(":")?(r.push(c.slice(1)),"([^\\/]+)"):c).join("\\/"),o=a.match(new RegExp(`^${s}$`));return o||(t=!1,o=a.match(new RegExp(`^${s}`))),o?(r.forEach((c,h)=>n[c]=o[h+1]),{exact:t,params:n,part:o[0].slice(0,-1)}):null}function x(e,a,r){if(r==="")return e;if(r[0]==="/")return r;let n=o=>o.split("/").filter(c=>c!==""),t=n(e),s=a?n(a):[];return "/"+s.map((o,c)=>t[c]).join("/")+"/"+r}function m(e,a,r,n){let t=[a,"data-"+a].reduce((s,o)=>{let c=e.getAttribute(o);return r&&e.removeAttribute(o),c===null?s:c},!1);return !n&&t===""?!0:t||n||!1}function S(e){let a=e.split("&").map(r=>r.split("=")).reduce((r,n)=>{let t=n[0];if(!t)return r;let s=n.length>1?n[n.length-1]:!0;return typeof s=="string"&&s.includes(",")&&(s=s.split(",")),r[t]===void 0?r[t]=[s]:r[t].push(s),r},{});return Object.entries(a).reduce((r,n)=>(r[n[0]]=n[1].length>1?n[1]:n[1][0],r),{})}function v(e){return Object.entries(e).map(([a,r])=>r?r===!0?a:`${a}=${Array.isArray(r)?r.join(","):r}`:null).filter(a=>a).join("&")}function w(e,a){return e?a+e:""}function k(e){throw new Error("[Tinro] "+e)}var i={HISTORY:1,HASH:2,MEMORY:3,OFF:4,run(e,a,r,n){return e===this.HISTORY?a&&a():e===this.HASH?r&&r():n&&n()},getDefault(){return !window||window.location.pathname==="srcdoc"?this.MEMORY:this.HISTORY}};var R,M,$,b="",l=L();function L(){let e=i.getDefault(),a,r=o=>window.onhashchange=window.onpopstate=R=null,n=o=>a&&a(y(e)),t=o=>{o&&(e=o),r(),e!==i.OFF&&i.run(e,c=>window.onpopstate=n,c=>window.onhashchange=n)&&n();},s=o=>{let c=Object.assign(y(e),o);return c.path+w(v(c.query),"?")+w(c.hash,"#")};return {mode:t,get:o=>y(e),go(o,c){_(e,o,c),n();},start(o){a=o,t();},stop(){a=null,t(i.OFF);},set(o){this.go(s(o),!o.path);},methods(){return A(this)},base:o=>b=o}}function _(e,a,r){!r&&(M=$);let n=t=>history[`${r?"replace":"push"}State`]({},"",t);i.run(e,t=>n(b+a),t=>n(`#${a}`),t=>R=a);}function y(e){let a=window.location,r=i.run(e,t=>(b?a.pathname.replace(b,""):a.pathname)+a.search+a.hash,t=>String(a.hash.slice(1)||"/"),t=>R||"/"),n=r.match(/^([^?#]+)(?:\?([^#]+))?(?:\#(.+))?$/);return $=r,{url:r,from:M,path:n[1]||"",query:S(n[2]||""),hash:n[3]||""}}function A(e){let a=()=>e.get().query,r=o=>e.set({query:o}),n=o=>r(o(a())),t=()=>e.get().hash,s=o=>e.set({hash:o});return {hash:{get:t,set:s,clear:()=>s("")},query:{replace:r,clear:()=>r(""),get(o){return o?a()[o]:a()},set(o,c){n(h=>(h[o]=c,h));},delete(o){n(c=>(c[o]&&delete c[o],c));}}}}var f=T();function T(){let{subscribe:e}=writable(l.get(),a=>{l.start(a);let r=P(l.go);return ()=>{l.stop(),r();}});return {subscribe:e,goto:l.go,params:Q,meta:O,useHashNavigation:a=>l.mode(a?i.HASH:i.HISTORY),mode:{hash:()=>l.mode(i.HASH),history:()=>l.mode(i.HISTORY),memory:()=>l.mode(i.MEMORY)},base:l.base,location:l.methods()}}function P(e){let a=r=>{let n=r.target.closest("a[href]"),t=n&&m(n,"target",!1,"_self"),s=n&&m(n,"tinro-ignore"),o=r.ctrlKey||r.metaKey||r.altKey||r.shiftKey;if(t=="_self"&&!s&&!o&&n){let c=n.getAttribute("href").replace(/^\/#/,"");/^\/\/|^[a-zA-Z]+:/.test(c)||(r.preventDefault(),e(c.startsWith("/")?c:n.href.replace(window.location.origin,"")));}};return addEventListener("click",a),()=>removeEventListener("click",a)}function Q(){return getContext("tinro").meta.params}var g="tinro",K=j({pattern:"",matched:!0});function q(e){let a=getContext(g)||K;(a.exact||a.fallback)&&k(`${e.fallback?"<Route fallback>":`<Route path="${e.path}">`}  can't be inside ${a.fallback?"<Route fallback>":`<Route path="${a.path||"/"}"> with exact path`}`);let r=e.fallback?"fallbacks":"childs",n=writable({}),t=j({fallback:e.fallback,parent:a,update(s){t.exact=!s.path.endsWith("/*"),t.pattern=p(`${t.parent.pattern||""}${s.path}`),t.redirect=s.redirect,t.firstmatch=s.firstmatch,t.breadcrumb=s.breadcrumb,t.match();},register:()=>(t.parent[r].add(t),async()=>{t.parent[r].delete(t),t.parent.activeChilds.delete(t),t.router.un&&t.router.un(),t.parent.match();}),show:()=>{e.onShow(),!t.fallback&&t.parent.activeChilds.add(t);},hide:()=>{e.onHide(),t.parent.activeChilds.delete(t);},match:async()=>{t.matched=!1;let{path:s,url:o,from:c,query:h}=t.router.location,u=d(t.pattern,s);if(!t.fallback&&u&&t.redirect&&(!t.exact||t.exact&&u.exact)){let E=x(s,t.parent.pattern,t.redirect);return f.goto(E,!0)}t.meta=u&&{from:c,url:o,query:h,match:u.part,pattern:t.pattern,breadcrumbs:t.parent.meta&&t.parent.meta.breadcrumbs.slice()||[],params:u.params,subscribe:n.subscribe},t.breadcrumb&&t.meta&&t.meta.breadcrumbs.push({name:t.breadcrumb,path:u.part}),n.set(t.meta),u&&!t.fallback&&(!t.exact||t.exact&&u.exact)&&(!t.parent.firstmatch||!t.parent.matched)?(e.onMeta(t.meta),t.parent.matched=!0,t.show()):t.hide(),u&&t.showFallbacks();}});return setContext(g,t),onMount(()=>t.register()),t}function O(){return hasContext(g)?getContext(g).meta:k("meta() function must be run inside any `<Route>` child component only")}function j(e){let a={router:{},exact:!1,pattern:null,meta:null,parent:null,fallback:!1,redirect:!1,firstmatch:!1,breadcrumb:null,matched:!1,childs:new Set,activeChilds:new Set,fallbacks:new Set,async showFallbacks(){if(!this.fallback&&(await tick(),this.childs.size>0&&this.activeChilds.size==0||this.childs.size==0&&this.fallbacks.size>0)){let r=this;for(;r.fallbacks.size==0;)if(r=r.parent,!r)return;r&&r.fallbacks.forEach(n=>{if(n.redirect){let t=x("/",n.parent.pattern,n.redirect);f.goto(t,!0);}else n.show();});}},start(){this.router.un||(this.router.un=f.subscribe(r=>{this.router.location=r,this.pattern!==null&&this.match();}));},match(){this.showFallbacks();}};return Object.assign(a,e),a.start(),a}

    /* node_modules/tinro/cmp/Route.svelte generated by Svelte v3.44.0 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*params*/ 2,
    	meta: dirty & /*meta*/ 4
    });

    const get_default_slot_context = ctx => ({
    	params: /*params*/ ctx[1],
    	meta: /*meta*/ ctx[2]
    });

    // (33:0) {#if showContent}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, params, meta*/ 262)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:0) {#if showContent}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showContent*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showContent*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showContent*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Route', slots, ['default']);
    	let { path = '/*' } = $$props;
    	let { fallback = false } = $$props;
    	let { redirect = false } = $$props;
    	let { firstmatch = false } = $$props;
    	let { breadcrumb = null } = $$props;
    	let showContent = false;
    	let params = {}; /* DEPRECATED */
    	let meta = {};

    	const route = q({
    		fallback,
    		onShow() {
    			$$invalidate(0, showContent = true);
    		},
    		onHide() {
    			$$invalidate(0, showContent = false);
    		},
    		onMeta(newmeta) {
    			$$invalidate(2, meta = newmeta);
    			$$invalidate(1, params = meta.params); /* DEPRECATED */
    		}
    	});

    	const writable_props = ['path', 'fallback', 'redirect', 'firstmatch', 'breadcrumb'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('path' in $$props) $$invalidate(3, path = $$props.path);
    		if ('fallback' in $$props) $$invalidate(4, fallback = $$props.fallback);
    		if ('redirect' in $$props) $$invalidate(5, redirect = $$props.redirect);
    		if ('firstmatch' in $$props) $$invalidate(6, firstmatch = $$props.firstmatch);
    		if ('breadcrumb' in $$props) $$invalidate(7, breadcrumb = $$props.breadcrumb);
    		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createRouteObject: q,
    		path,
    		fallback,
    		redirect,
    		firstmatch,
    		breadcrumb,
    		showContent,
    		params,
    		meta,
    		route
    	});

    	$$self.$inject_state = $$props => {
    		if ('path' in $$props) $$invalidate(3, path = $$props.path);
    		if ('fallback' in $$props) $$invalidate(4, fallback = $$props.fallback);
    		if ('redirect' in $$props) $$invalidate(5, redirect = $$props.redirect);
    		if ('firstmatch' in $$props) $$invalidate(6, firstmatch = $$props.firstmatch);
    		if ('breadcrumb' in $$props) $$invalidate(7, breadcrumb = $$props.breadcrumb);
    		if ('showContent' in $$props) $$invalidate(0, showContent = $$props.showContent);
    		if ('params' in $$props) $$invalidate(1, params = $$props.params);
    		if ('meta' in $$props) $$invalidate(2, meta = $$props.meta);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*path, redirect, firstmatch, breadcrumb*/ 232) {
    			route.update({ path, redirect, firstmatch, breadcrumb });
    		}
    	};

    	return [
    		showContent,
    		params,
    		meta,
    		path,
    		fallback,
    		redirect,
    		firstmatch,
    		breadcrumb,
    		$$scope,
    		slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			path: 3,
    			fallback: 4,
    			redirect: 5,
    			firstmatch: 6,
    			breadcrumb: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fallback() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fallback(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get redirect() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set redirect(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get firstmatch() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set firstmatch(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get breadcrumb() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set breadcrumb(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/create.svelte generated by Svelte v3.44.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/create.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			button0 = element("button");
    			button0.textContent = "Create-Txn";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Sign-Txn";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Submit-Txn";
    			add_location(button0, file$1, 45, 4, 1335);
    			add_location(button1, file$1, 46, 4, 1396);
    			add_location(button2, file$1, 47, 4, 1445);
    			set_style(main, "text-align", "center");
    			add_location(main, file$1, 44, 2, 1296);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button0);
    			append_dev(main, t1);
    			append_dev(main, button1);
    			append_dev(main, t3);
    			append_dev(main, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*createTransaction*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*signTxn*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", /*submitTxn*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Create', slots, []);
    	const arweave = Arweave.init({});
    	console.log("---------Network Information--------");
    	arweave.network.getInfo().then(console.log);
    	let transaction;

    	async function createTransaction() {
    		transaction = await arweave.createTransaction({
    			data: '<html><head><meta charset="UTF-8"><title>Hello worldd!</title></head><body></body></html>'
    		});

    		transaction.addTag('key4', 'value4'); //changes dynamically..
    		console.log('---------Transaction Created----------');
    		console.log(transaction);
    	}

    	async function signTxn() {
    		if (!transaction) {
    			alert('Create txn');
    			return;
    		}

    		console.log('Signing txn....');
    		await arweave.transactions.sign(transaction);
    		console.log(transaction);
    		console.log('---------Transaction Signed----------');
    	}

    	async function submitTxn() {
    		if (!transaction.signature) {
    			alert('Create and sign txn');
    			return;
    		}

    		console.log('Submitting txn....');

    		// use post() for smaller data or for transfers
    		try {
    			await arweave.transactions.post(transaction);
    			console.log('---------Transaction Submitted----------');
    		} catch(error) {
    			console.error(error);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Create> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		arweave,
    		transaction,
    		createTransaction,
    		signTxn,
    		submitTxn
    	});

    	$$self.$inject_state = $$props => {
    		if ('transaction' in $$props) transaction = $$props.transaction;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [createTransaction, signTxn, submitTxn];
    }

    class Create extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Create",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/app.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file = "src/app.svelte";

    // (29:0) <Route path="/create">
    function create_default_slot(ctx) {
    	let create;
    	let current;
    	create = new Create({ $$inline: true });

    	const block = {
    		c: function create$1() {
    			create_component(create.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(create, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(create.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(create.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(create, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(29:0) <Route path=\\\"/create\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let nav;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let h1;
    	let t9;
    	let p;
    	let t11;
    	let small;
    	let t13;
    	let route;
    	let current;
    	let mounted;
    	let dispose;

    	route = new Route({
    			props: {
    				path: "/create",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Demo";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Connect-Wallet";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "DisConnect";
    			t7 = space();
    			h1 = element("h1");
    			h1.textContent = "WAGMeet";
    			t9 = space();
    			p = element("p");
    			p.textContent = "Simple Arweave demo to create, sign and submit transaction.";
    			t11 = space();
    			small = element("small");
    			small.textContent = "(open console to see results)";
    			t13 = space();
    			create_component(route.$$.fragment);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file, 18, 4, 361);
    			attr_dev(a1, "href", "/create");
    			add_location(a1, file, 19, 4, 386);
    			add_location(button0, file, 20, 4, 417);
    			add_location(button1, file, 21, 4, 472);
    			add_location(nav, file, 17, 2, 351);
    			add_location(h1, file, 23, 2, 533);
    			add_location(p, file, 24, 2, 552);
    			add_location(small, file, 25, 2, 621);
    			add_location(header, file, 16, 0, 340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t1);
    			append_dev(nav, a1);
    			append_dev(nav, t3);
    			append_dev(nav, button0);
    			append_dev(nav, t5);
    			append_dev(nav, button1);
    			append_dev(header, t7);
    			append_dev(header, h1);
    			append_dev(header, t9);
    			append_dev(header, p);
    			append_dev(header, t11);
    			append_dev(header, small);
    			insert_dev(target, t13, anchor);
    			mount_component(route, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", connect, false, false, false),
    					listen_dev(button1, "click", disconnect, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const route_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				route_changes.$$scope = { dirty, ctx };
    			}

    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t13);
    			destroy_component(route, detaching);
    			mounted = false;
    			run_all(dispose);
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

    async function connect() {
    	window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION'], { name: 'WAGMeeT' });
    }

    async function disconnect() {
    	window.arweaveWallet.disconnect();
    	console.log("Disconnected...");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Route, Create, connect, disconnect });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /*
    window.arweave = Arweave.init({
    	host: 'ARWEAVE_HOST',
    	port: 443,
    	protocol: 'https'
    })
    */

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
