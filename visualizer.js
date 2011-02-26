function Chain(type, renderObject)
{
    this.type_ = type;
    this.renderObject_ = renderObject;
    this.div_ = surface.appendChild(document.createElement('div'));
    this.div_.className = 'object';
//    this.div_.appendChild(document.createElement('b')).textContent = this.renderObject_ || this.type_.name;
}

Chain.create = function(type) {
    return function(renderObject) {
        return new Chain(type, renderObject);
    }
}

Chain.prototype.setParent = function(parent)
{
    parent.div_.appendChild(this.div_);
}

Chain.prototype.at = function(x, y)
{
    this.div_.style.left = px(x);
    this.div_.style.top = px(y);
    return this;
}

Chain.prototype.pos = function(positioning)
{
    if (positioning == positioned)
        this.div_.style.position = 'static';
    else if (positioning == relative.positioned)
        this.div_.style.position = 'relative';
    return this;
}

Chain.prototype.tag = function(tag)
{
//    this.div_.appendChild(document.createElement('i')).textContent = tag;
    return this;
}

Chain.prototype.size = function(w, h)
{
    this.div_.style.width = px(w);
    this.div_.style.height = px(h)
    return this;
}

Chain.prototype.width = function(w)
{
    this.div_.style.width = px(w);
    return this;
}

Chain.prototype.property = function(name, value)
{
    return this;
}

Chain.prototype.text = function(t)
{
    this.div_.textContent = t;
    return this;
}

Chain.prototype.contains = function()
{
    Array.prototype.slice.call(arguments, 0).forEach(function(child)
    {
        child.setParent(this)
    }, this);
    return this;
}

var anonymous;
var positioned = 1;
var relative = { positioned: 2 };

[
    {
        name: 'layer',
    },
    {
        name: 'render'
    },
    {
        name: 'text'
    }
].forEach(function(root) {
    window[root.name] = Chain.create(root);
});

window.addEventListener('DOMContentLoaded', function()
{
    var arena = document.createElement('div');
    arena.appendChild(surface);
    document.body.appendChild(arena);
}, false);

var surface = document.createElement('div');
surface.id = 'surface';

function px(n)
{
    return n + 'px';
}