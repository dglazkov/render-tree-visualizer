function Chain(type, renderObject)
{
    this.type_ = type;
    this.renderObject_ = renderObject;

    this.box_ = surface.appendChild(div());
    this.box_.className = this.type_.name;
    this.box_.id = uniqueId();

    this.item_ = tree.appendChild(div());
    this.item_.className = this.box_.className;
    this.callIfExists_(this.type_.adjustItem);
    this.anchor_ = document.createElement('a');
    this.anchor_.textContent = this.type_.prettyName(this.renderObject_);
    this.anchor_.href = '#' + this.box_.id;
    this.item_.appendChild(this.anchor_);

    this.depth_ = 1;
}

Chain.create = function(type) {
    return function(renderObject) {
        return new Chain(type, renderObject);
    }
}

Chain.prototype = {
    callIfExists_: function(fn)
    {
        fn && fn.call(this);
    },
    info_: function(className, text)
    {
        var result = document.createElement('i');
        if (className)
            result.className = className;
        result.textContent = text;
        this.anchor_.appendChild(result);
    },
    updateTreeDepth_: function(depth)
    {
        if (!this.parent_) {
            this.box_.style.webkitTransform = 'translateZ(' + (depth * 20) + 'px)';
            return;
        }
        this.parent_.updateTreeDepth_(depth + 1);
    },
    setParent: function(parent)
    {
        parent.depth_ = this.depth_ + 1;
        parent.callIfExists_(parent.type_.adjustBoxStyle);
        parent.box_.appendChild(this.box_);
        parent.item_.appendChild(this.item_);
    },
    at: function(x, y)
    {
        this.box_.style.left = px(adjust(x, -1));
        this.box_.style.top = px(adjust(y, -1));
        this.info_('at', 'at ' + x + ', ' + y);
        return this;
    },
    pos: function(positioning)
    {
        if (positioning == positioned)
            this.box_.style.position = 'static';
        else if (positioning == relative.positioned)
            this.box_.style.position = 'relative';
        return this;
    },
    tag: function(tag)
    {
        this.info_('tag', tag);
        return this;
    },
    size: function(w, h)
    {
        this.box_.style.width = px(w);
        this.box_.style.height = px(h);
        this.info_('size', w + 'x' + h);
        return this;
    },
    width: function(w)
    {
        this.box_.style.width = px(w);
        this.info_('size', 'width ' + w);
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
        Array.prototype.slice.call(arguments, 0).forEach(function(child)
        {
            child.setParent(this);
        }, this);
        return this;
    }
};

var anonymous;
var positioned = 1;
var relative = { positioned: 2 };

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

var layerZOffset = 0;

[
    {
        name: 'layer',
        prettyName: function(name)
        {
            return 'layer';
        },
        adjustBoxStyle: function()
        {
            this.box_.style.webkitTransform = 'translateZ(' + (layerZOffset * 20) + 'px)';
            layerZOffset += this.depth_;
        },
        adjustItem: function()
        {
            this.item_.setAttribute('tabindex', currentTabIndex++);
        }
    },
    {
        name: 'render',
        prettyName: function(name)
        {
            return 'Render' + name;
        }
    },
    {
        name: 'text',
        prettyName: function(name)
        {
            return 'textRun';
        }
    }
].forEach(function(root) {
    window[root.name] = Chain.create(root);
});

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
        this.updatePosition();
    },
    registerEvents: function(stage)
    {
        stage.addEventListener('mousedown', this.onMouseDown_.bind(this), false);
        stage.addEventListener('mousewheel', this.onMouseWheel_.bind(this), false);
        // Listen everywhere, because mouse might be let go anywhere on page.
        window.addEventListener('mouseup', this.onMouseUp_.bind(this), false);
        // Similarly, moving a mouse out of stage should not stop rotation.
        window.addEventListener('mousemove', this.onMouseMove_.bind(this), false);
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
    }
});

// FIXME: This is needed for Chain. Eliminate eventually.
var surface = new Surface();

var Stage = customElement('div', {
    decorate: function()
    {
        this.id = 'stage';
        this.appendChild(surface).registerEvents(this);
    }
});

window.addEventListener('DOMContentLoaded', function()
{
    document.body.appendChild(tree);
    document.body.appendChild(new Stage());
}, false);

var tree = div('tree');
var currentUniqueId = 0;

function adjust(n, delta)
{
    return parseInt(n, 10) + delta;
}

// arv r0x0r 4eva.
function customElement(tag, prototype) {
    function f() {
          var el = document.createElement(tag);
          f.prototype.__proto__ = el.__proto__;
          el.__proto__ = f.prototype;
          el.decorate && el.decorate();
          return el;
    }

    f.prototype = prototype;
    return f;
}

function div(id)
{
    var result = document.createElement('div');
    if (id)
        result.id = id;
    return result;
}

function px(n)
{
    return n + 'px';
}

function uniqueId()
{
    return 'b' + currentUniqueId++;
}
