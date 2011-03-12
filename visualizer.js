function Chain(renderObject)
{
    this.box_ = surface.appendChild(new (this.boxConstructor)(this.name));
    this.item_ = tree.appendChild(new (this.itemConstructor)(this.name, this.prettyName(renderObject), this.box_));
}

Chain.prototype = {
    name: null,
    prettyName: function(name) {},
    get boxConstructor()
    {
        return Box;
    },
    get itemConstructor()
    {
        return Item;
    },
    setParent: function(parent)
    {
        this.box_.setParent(parent.box_);
        parent.item_.appendChild(this.item_);
    },
    at: function(x, y)
    {
        this.box_.at(x, y);
        this.item_.addInfo('at', 'at ' + x + ', ' + y);
        return this;
    },
    pos: function(positioning)
    {
        this.box_.pos(positioning);
        return this;
    },
    tag: function(tag)
    {
        this.item_.addInfo('tag', tag);
        return this;
    },
    size: function(w, h)
    {
        this.box_.size(w, h);
        this.item_.addInfo('size', w + 'x' + h);
        return this;
    },
    width: function(w)
    {
        this.box_.width(w);
        this.item_.addInfo('size', 'width ' + w);
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
    }
};

function LayerChain()
{
    Chain.call(this);
}

LayerChain.prototype = {
    __proto__: Chain.prototype,
    name: 'layer',
    prettyName: function(name)
    {
        return 'layer';
    },
    get boxConstructor()
    {
        return LayerBox;
    },
    get itemConstructor()
    {
        return LayerItem;
    }
};

function RenderChain(renderObject)
{
    Chain.call(this, renderObject);
}

RenderChain.prototype = {
    __proto__: Chain.prototype,
    name: 'render',
    prettyName: function(name)
    {
        return 'Render' + name;
    }
};

function TextChain()
{
    Chain.call(this);
}

TextChain.prototype = {
    __proto__: Chain.prototype,
    name: 'text',
    prettyName: function(name)
    {
        return 'textRun';
    }
};

var anonymous;
var positioned = 1;
var relative = { positioned: 2 };

var Box = customElement('div', {
    decorate: function(type)
    {
        this.className = type;
        this.id = uniqueId();
        this.depth_ = 1;
    },
    at: function(x, y)
    {
        this.style.left = px(adjust(x, -1));
        this.style.top = px(adjust(y, -1));
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
        this.style.width = px(width);
        this.style.height = px(height);
    },
    width: function(w)
    {
        this.style.width = px(w);
    },
    setParent: function(parent)
    {
        parent.depth_ = this.depth_ + 1;
        parent.addChild(this);
    },
    addChild: function(child)
    {
        this.appendChild(child);
    }
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

var Item = customElement('div', {
    decorate: function(type, prettyName, box)
    {
        this.className = type;

        var anchor = document.createElement('a');
        anchor.textContent = prettyName;
        anchor.href = '#' + box.id;
        this.appendChild(anchor);
    },
    addInfo: function(type, text)
    {
        this.firstChild.appendChild(new Info(type, text));
    }
});

var LayerItem = customElement(Item, {
    decorate: function()
    {
        Item.prototype.decorate.apply(this, arguments);
        this.setAttribute('tabindex', currentTabIndex++);
    }
});

var Info = customElement('i', {
    decorate: function(className, text)
    {
        if (className)
            this.className = className;
        this.textContent = text;
    }
});

[ LayerChain, RenderChain, TextChain ].forEach(function(root) {
    window[root.prototype.name] = function(renderObject) {
        return new (root)(renderObject);
    }
});

function ConstrainedValue(initialValue, constraints)
{
    this.value_ = initialValue;
    this.min_ = constraints[0];
    this.max_ = constraints[1];
    this.coefficient_ = constraints[2];
}

ConstrainedValue.prototype = {
    inc: function(delta)
    {
        var value = this.value_ + delta * this.coefficient_;
        if (value < this.min_)
            this.value_ = this.min_;
        else if (value > this.max_)
            this.value_ = this.max_;
        else
            this.value_ = value;
    },
    toString: function()
    {
        return String(this.value_);
    }
};

var INITIAL_TABINDEX = 1;

var CONSTRAINTS = {
    rotation: [ -89.8, 89.8, 0.12 ],
    zoom: [ 0.5, 10, 0.005 ],
    pos: [ -400, 400, 1 ]
}

var currentTabIndex = INITIAL_TABINDEX;

var Surface = customElement('div', {
    lastX: 0,
    lastY: 0,
    degX: new ConstrainedValue(0, CONSTRAINTS.rotation),
    degY: new ConstrainedValue(0, CONSTRAINTS.rotation),
    posX: new ConstrainedValue(0, CONSTRAINTS.pos),
    posY: new ConstrainedValue(0, CONSTRAINTS.pos),
    zoom: new ConstrainedValue(1, CONSTRAINTS.zoom),
    transform_: [],
    keyMap_: {},
    mouseDown_: false,
    decorate: function()
    {
        this.id = 'surface';
        this.transform_ = [
            'rotateX(', this.degX, 'deg) ' +
            'rotateY(', this.degY, 'deg) ' +
            'scale3d(', this.zoom, ',', this.zoom, ',', this.zoom, ') ' +
            'translate3d(', this.posX, 'px,', this.posY, 'px,0)'
        ];
        this.keyMap_ = {
            '37b': (function() { this.degY.inc(-10) }).bind(this),
            '38b': (function() { this.degX.inc(10) }).bind(this),
            '39b': (function() { this.degY.inc(10) }).bind(this),
            '40b': (function() { this.degX.inc(-10) }).bind(this),
            '37s': (function() { this.posX.inc(-10) }).bind(this),
            '38s': (function() { this.posY.inc(-10) }).bind(this),
            '39s': (function() { this.posX.inc(10) }).bind(this),
            '40s': (function() { this.posY.inc(10) }).bind(this),
        }
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
    updatePosition: function()
    {
        this.style.webkitTransform = this.transform_.join('');
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
    decorate: function()
    {
        this.id = 'tree';
    }
});


// FIXME: This is needed for Chain. Eliminate eventually.
var surface = new Surface();
var tree = new Tree();

var Stage = customElement('div', {
    decorate: function()
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

var currentUniqueId = 0;

function adjust(n, delta)
{
    return parseInt(n, 10) + delta;
}

// arv r0x0r 4eva.
function customElement(base, prototype)
{
    function f() {
        var el = typeof base == 'string' ? document.createElement(base) : base.apply(this, arguments);
        f.prototype.__proto__ = el.__proto__;
        el.__proto__ = f.prototype;
        this.decorate && this.decorate.apply(el, arguments);
        return el;
    }

    f.prototype = prototype;
    return f;
}

function px(n)
{
    return n + 'px';
}

function uniqueId()
{
    return 'b' + currentUniqueId++;
}
