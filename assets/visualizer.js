var Item = customElement('div', {
    name: null,
    ctor: function(type)
    {
        this.className = this.name;

        var anchor = document.createElement('span');
        anchor.textContent = this.prettyName(type);
        this.box_ = this.createBox_();
        this.appendChild(anchor);
        this.addEventListener('focus', this.onFocus_);
        this.addEventListener('blur', this.onBlur_);

        // FIXME: Somehow eliminate using "tree" directly here.
        tree.appendChild(this);
    },
    onFocus_: function(evt)
    {
        if (Item.lastFocused) {
            Item.lastFocused.blur();
            Item.lastFocused = null;
        }
        this.classList.add('focused');
        this.box_.classList.add('focused');
    },
    onBlur_: function(evt)
    {
        Item.lastFocused = new BlurAction(this);
    },
    prettyName: function(name) {},
    setParent: function(parent)
    {
        this.box_.setParent(parent.box_);
        parent.appendChild(this);
    },
    at: function(x, y)
    {
        this.box_.at(x, y);
        this.addInfo_('at', x + ',' + y);
        return this;
    },
    pos: function(positioning)
    {
        this.box_.pos(positioning);
        return this;
    },
    tag: function(tag)
    {
        this.addInfo_('tag', tag);
        return this;
    },
    size: function(w, h)
    {
        this.box_.size(w, h);
        this.addInfo_('size', w + 'x' + h);
        return this;
    },
    width: function(w)
    {
        this.box_.width(w);
        this.addInfo_('size', 'width ' + w);
        return this;
    },
    property: function(name, value)
    {
        // FIXME: Add handling of properties
        return this;
    },
    text: function(t)
    {
        this.box_.textContent = t;
        return this;
    },
    contains: function()
    {
        Array.prototype.forEach.call(arguments, function(child)
        {
            child.setParent(this);
        }, this);
        return this;
    },
    addInfo_: function(type, text)
    {
        this.firstChild.appendChild(new Info(type, text));
    },
    createBox_: function()
    {
        return new Box(this.name);
    }
});
Item.lastFocused = null;

function BlurAction(item)
{
    this.item_ = item;
}
BlurAction.prototype = {
    blur: function()
    {
        this.item_.classList.remove('focused');
        this.item_.box_.classList.remove('focused');
    }
}


var LayerItem = customElement(Item, {
    name: 'layer',
    ctor: function()
    {
        Item.prototype.ctor.call(this);
        this.setAttribute('tabindex', LayerItem.currentTabIndex++);
    },
    prettyName: function(name)
    {
        return 'layer';
    },
    createBox_: function()
    {
        return new LayerBox(this.name);
    }
});
LayerItem.currentTabIndex = 1;

var RenderItem = customElement(Item, {
    name: 'render',
    prettyName: function(name)
    {
        return 'Render' + name;
    }
});

var TextItem = customElement(Item, {
    name: 'text',
    prettyName: function(name)
    {
        return 'textRun';
    }
});

var Info = customElement('span', {
    ctor: function(className, text)
    {
        this.className = className;
        this.textContent = text;
    }
});

var anonymous;
var positioned = 1;
var relative = { positioned: 2 };

var Box = customElement('div', {
    ctor: function(type)
    {
        this.className = type;
        this.depth_ = 1;

        // FIXME: Eliminate using "surface" directly.
        surface.add(this);
    },
    at: function(x, y)
    {
        this.style.left = this.px_(this.adjust_(x, -1));
        this.style.top = this.px_(this.adjust_(y, -1));
    },
    pos: function(positioning)
    {
        if (positioning == positioned)
            this.style.position = 'static';
        else if (positioning == relative.positioned)
            this.style.position = 'relative';
    },
    size: function(width, height)
    {
        this.style.width = this.px_(width);
        this.style.height = this.px_(height);
    },
    width: function(w)
    {
        this.style.width = this.px_(w);
    },
    setParent: function(parent)
    {
        parent.depth_ = this.depth_ + 1;
        parent.addChild(this);
    },
    addChild: function(child)
    {
        this.appendChild(child);
    },
    adjust_: function(n, delta)
    {
        return parseInt(n, 10) + delta;
    },
    px_: function(n)
    {
        return n + 'px';
    },
});

var LayerBox = customElement(Box, {
    addChild: function(child)
    {
        this.style.webkitTransform = 'translateZ(' + (LayerBox.zOffset * 20) + 'px)';
        LayerBox.zOffset += this.depth_;
        Box.prototype.addChild.call(this, child);
    }
});
LayerBox.zOffset = 0;

[ LayerItem, RenderItem, TextItem ].forEach(function(root) {
    window[root.prototype.name] = function(type) {
        return new (root)(type);
    }
});

function ConstrainedValue(initialValue, constraints)
{
    this.initialValue_ = initialValue;
    this.value_ = initialValue;
    this.constraints_ = constraints;
}

ConstrainedValue.prototype = {
    reset: function()
    {
        this.value_ = this.initialValue_;
    },
    inc: function(delta)
    {
        var value = this.value_ + delta * this.constraints_.multiplier;
        if (value < this.constraints_.min)
            this.value_ = this.constraints_.min;
        else if (value > this.constraints_.max)
            this.value_ = this.constraints_.max;
        else
            this.value_ = value;
    },
    toString: function()
    {
        return String(this.value_);
    }
};

var CONSTRAINTS = {
    rotation: { min: -89.8, max: 89.8, multiplier: 0.12 },
    zoom: { min: 0.5, max: 10, multiplier: 0.005 },
    pos: { min: -400, max: 400, multiplier: 1 }
}

var Plane = customElement('div', {
    ctor: function(transform)
    {
        this.className = 'plane';
        this.transform_ = transform;
    },
    updatePosition: function()
    {
        this.style.webkitTransform = this.transform_.join('');
    }
});

var Surface = customElement('div', {
    lastX: 0,
    lastY: 0,
    degX: new ConstrainedValue(0, CONSTRAINTS.rotation),
    degY: new ConstrainedValue(0, CONSTRAINTS.rotation),
    posX: new ConstrainedValue(30, CONSTRAINTS.pos),
    posY: new ConstrainedValue(30, CONSTRAINTS.pos),
    zoom: new ConstrainedValue(1, CONSTRAINTS.zoom),
    transform_: [],
    keyMap_: {},
    mouseDown_: false,
    ctor: function()
    {
        this.id = 'surface';
        this.transform_ = [
            'scale3d(', this.zoom, ',', this.zoom, ',0) ' +
            'translate3d(', this.posX, 'px,', this.posY, 'px,0)'
        ];
        this.keyMap_ = {
            '48b': this.reset_.bind(this),
            '37b': (function() { this.degY.inc(-10) }).bind(this),
            '38b': (function() { this.degX.inc(10) }).bind(this),
            '39b': (function() { this.degY.inc(10) }).bind(this),
            '40b': (function() { this.degX.inc(-10) }).bind(this),
            '37s': (function() { this.posX.inc(-10) }).bind(this),
            '38s': (function() { this.posY.inc(-10) }).bind(this),
            '39s': (function() { this.posX.inc(10) }).bind(this),
            '40s': (function() { this.posY.inc(10) }).bind(this),
        }
        this.planeX_ = new Plane([ 'rotateX(', this.degX, 'deg)' ]);
        this.planeY_ = new Plane([ 'rotateY(', this.degY, 'deg)' ]);
        this.planeY_.appendChild(this.planeX_);
        this.appendChild(this.planeY_);

        this.updatePosition();
    },
    connect: function(stage)
    {
        stage.addEventListener('mousedown', this.onMouseDown_.bind(this), false);
        stage.addEventListener('mousewheel', this.onMouseWheel_.bind(this), false);
        // Listen everywhere, because mouse might be let go anywhere on page.
        window.addEventListener('mouseup', this.onMouseUp_.bind(this), false);
        // Similarly, moving a mouse out of stage should not stop rotation.
        window.addEventListener('mousemove', this.onMouseMove_.bind(this), false);
        window.addEventListener('keydown', this.onKeyDown_.bind(this), false);
    },
    add: function(o)
    {
        this.planeX_.appendChild(o);
    },
    updatePosition: function()
    {
        this.style.webkitTransform = this.transform_.join('');
        this.planeY_.updatePosition();
        this.planeX_.updatePosition();
    },
    reset_: function()
    {
        this.degX.reset();
        this.degY.reset();
        this.posX.reset();
        this.posY.reset();
        this.zoom.reset();
        this.updatePosition();
    },
    onMouseDown_: function()
    {
        this.mouseDown_ = true;
    },
    onMouseUp_: function()
    {
        this.mouseDown_ = false;
        this.lastX = 0;
        this.lastY = 0;
    },
    onMouseWheel_: function(evt)
    {
        this.zoom.inc(evt.wheelDeltaY);
        this.updatePosition();
    },
    onMouseMove_: function(evt)
    {
        if (!this.mouseDown_)
            return;

        var deltaX = this.lastX ? (evt.pageX - this.lastX) : 0;
        var deltaY = this.lastY ? (this.lastY - evt.pageY) : 0;
        this.lastX = evt.pageX;
        this.lastY = evt.pageY;

        if (evt.shiftKey) {
            this.posX.inc(deltaX);
            this.posY.inc(-deltaY);
        } else {
            this.degX.inc(deltaY);
            this.degY.inc(deltaX);
        }
        this.updatePosition();
    },
    onKeyDown_: function(evt)
    {
        if (!(this.keyMap_[evt.keyCode + (evt.shiftKey ? 's' : 'b')] || miss)())
            this.updatePosition();

        function miss() { return true; }
    },
});

var Tree = customElement('div', {
    ctor: function()
    {
        this.id = 'tree';
    }
});

var surface = new Surface();
var tree = new Tree();

var Stage = customElement('div', {
    ctor: function()
    {
        this.id = 'stage';
        this.appendChild(surface).connect(this);
    }
});

window.addEventListener('DOMContentLoaded', function()
{
    document.body.appendChild(tree);
    document.body.appendChild(new Stage());
}, false);

// arv r0x0r 4eva.
function customElement(base, prototype)
{
    function f() {
        var el;
        if (typeof base == 'string') {
            el = document.createElement(base);
        } else {
            el = base.call(this, customElement);
        }
        f.prototype.__proto__ = el.__proto__;
        el.__proto__ = f.prototype;
        var args;
        if (arguments[0] !== customElement)
            el.ctor && el.ctor.apply(el, arguments);
        return el;
    }

    f.prototype = prototype;
    return f;
}
