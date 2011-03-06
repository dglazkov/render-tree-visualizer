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
    get value()
    {
        return this.value_;
    }
};


var anonymous;
var positioned = 1;
var relative = { positioned: 2 };

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

var TRANSFORM_TEMPLATE = [
    'rotateX(', 1, 'deg) ' +
    'rotateY(', 3, 'deg) ' +
    'scale3d(', 5, ',', 7, ',', 9, ') ' +
    'translate3d(', 11, 'px,', 13, 'px,0)'
];

var mouseDown = false;
var degX = new ConstrainedValue(0, CONSTRAINTS.rotation);
var degY = new ConstrainedValue(0, CONSTRAINTS.rotation);
var posX = new ConstrainedValue(0, CONSTRAINTS.pos);
var posY = new ConstrainedValue(0, CONSTRAINTS.pos);
var lastX = 0;
var lastY = 0;
var zoomFactor = new ConstrainedValue(1, CONSTRAINTS.zoom);
var currentTabIndex = INITIAL_TABINDEX;

window.addEventListener('DOMContentLoaded', function()
{
    updateSurfaceTransform();

    var stage = div('stage');
    stage.appendChild(surface);
    document.body.appendChild(tree);
    document.body.appendChild(stage);

    stage.addEventListener('mousedown', function()
    {
        mouseDown = true;
    }, false);

    stage.addEventListener('mousewheel', function(evt)
    {
        zoomFactor.inc(evt.wheelDeltaY);
        updateSurfaceTransform();
    }, false);


}, false);

window.addEventListener('mousemove', function(evt)
{
    if (!mouseDown)
        return;

    var deltaX = lastX ? (evt.pageX - lastX) : 0; 
    var deltaY = lastY ? (lastY - evt.pageY) : 0;
    lastX = evt.pageX;
    lastY = evt.pageY;

    if (evt.shiftKey) {
        posX.inc(deltaX);
        posY.inc(-deltaY);
    } else {
        degX.inc(deltaX);
        degY.inc(deltaY);
    }
    updateSurfaceTransform();
}, false);

var tree = div('tree');
var surface = div('surface');
var currentUniqueId = 0;

window.addEventListener('mouseup', function()
{
    mouseDown = false;
    lastX = 0;
    lastY = 0;
}, false);

function updateSurfaceTransform()
{
    TRANSFORM_TEMPLATE[1] = degY.value;
    TRANSFORM_TEMPLATE[3] = degX.value;
    TRANSFORM_TEMPLATE[5] = zoomFactor.value;
    TRANSFORM_TEMPLATE[7] = zoomFactor.value;
    TRANSFORM_TEMPLATE[9] = zoomFactor.value;
    TRANSFORM_TEMPLATE[11] = posX.value;
    TRANSFORM_TEMPLATE[13] = posY.value;
    surface.style.webkitTransform = TRANSFORM_TEMPLATE.join('');
}

function adjust(n, delta)
{
    return parseInt(n, 10) + delta;
}

function define() {

  function f() {
    var el = document.createElement('div');
    el.__proto__ = f.prototype;
    el.decorate && el.decorate();
    return el;
  }

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
