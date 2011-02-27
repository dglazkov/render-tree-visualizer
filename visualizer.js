function Chain(type, renderObject)
{
    this.type_ = type;
    this.renderObject_ = renderObject;

    this.box_ = surface.appendChild(div());
    this.box_.className = this.type_.name;
    this.box_.id = uniqueId();
    this.type_.adjustBoxStyle(this.box_);

    this.item_ = tree.appendChild(div());
    this.item_.className = this.box_.className;
    this.anchor_ = document.createElement('a');
    this.anchor_.textContent = this.type_.prettyName(this.renderObject_);
    this.anchor_.href = '#' + this.box_.id;
    this.item_.appendChild(this.anchor_);
}

Chain.create = function(type) {
    return function(renderObject) {
        return new Chain(type, renderObject);
    }
}

Chain.prototype.info_ = function(className, text)
{
    var result = document.createElement('i');
    if (className)
        result.className = className;
    result.textContent = text;
    this.anchor_.appendChild(result);
}

Chain.prototype.setParent = function(parent)
{
    parent.box_.appendChild(this.box_);
    parent.item_.appendChild(this.item_);
}

Chain.prototype.at = function(x, y)
{
    this.box_.style.left = px(adjust(x, -1));
    this.box_.style.top = px(adjust(y, -1));
    this.info_('at', 'at ' + x + ', ' + y);
    return this;
}

Chain.prototype.pos = function(positioning)
{
    if (positioning == positioned)
        this.box_.style.position = 'static';
    else if (positioning == relative.positioned)
        this.box_.style.position = 'relative';
    return this;
}

Chain.prototype.tag = function(tag)
{
    this.info_('tag', tag);
    return this;
}

Chain.prototype.size = function(w, h)
{
    this.box_.style.width = px(w);
    this.box_.style.height = px(h);
    this.info_('size', w + 'x' + h);
    return this;
}

Chain.prototype.width = function(w)
{
    this.box_.style.width = px(w);
    this.info_('size', 'width ' + w);
    return this;
}

Chain.prototype.property = function(name, value)
{
    // FIXME: Add handling of properties
    return this;
}

Chain.prototype.text = function(t)
{
    this.box_.textContent = t;
    return this;
}

Chain.prototype.contains = function()
{
    Array.prototype.slice.call(arguments, 0).forEach(function(child)
    {
        child.setParent(this);
    }, this);
    return this;
}

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
        adjustBoxStyle: function(box)
        {
            box.style.webkitTransform = 'translateZ(' + (layerZOffset++ * 20) + 'px)';
        }
    },
    {
        name: 'render',
        prettyName: function(name)
        {
            return 'Render' + name;
        },
        adjustBoxStyle: function(box) { }
    },
    {
        name: 'text',
        prettyName: function(name)
        {
            return 'textRun';
        },
        adjustBoxStyle: function(box) { }
    }
].forEach(function(root) {
    window[root.name] = Chain.create(root);
});

window.addEventListener('DOMContentLoaded', function()
{
    var stage = div('stage');
    stage.appendChild(surface);
    document.body.appendChild(tree);
    document.body.appendChild(stage);

}, false);

var mouseDown = false;

window.addEventListener('mousedown', function()
{
    mouseDown = true;
}, false);

window.addEventListener('mouseup', function()
{
    mouseDown = false;
}, false);

window.addEventListener('mousemove', function(evt)
{
    if (!mouseDown)
        return;

    var degX = (evt.pageX * 180 / document.documentElement.clientWidth) - 90;
    var degY = 90 - (evt.pageY * 180 / document.documentElement.clientHeight);
    surface.style.webkitTransform = 'rotateX(' + degY + 'deg) rotateY(' + degX + 'deg)';
}, false);

var tree = div('tree');
var surface = div('surface');
var currentUniqueId = 0;

function adjust(n, delta)
{
    return parseInt(n, 10) + delta;
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
