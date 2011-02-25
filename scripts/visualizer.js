function Chain(type)
{
    this.type_ = type;
    this.createObject_();
}

var arena = document.createElement('div');

Chain.prototype.createObject_ = function()
{
    this.div_ = arena.appendChild(document.createElement('div'));
    this.div_.className = 'object';
    this.div_.textContent = this.type_.name;
}

Chain.prototype.setParent = function(parent)
{
    parent.div_.appendChild(this.div_);
}

Chain.prototype.at = function(x, y)
{
    return this;
}

Chain.prototype.pos = function(positioning)
{
    return this;
}

Chain.prototype.tag = function(tag)
{
    return this;
}

Chain.prototype.size = function(w, h)
{
    return this;
}

Chain.prototype.width = function(w)
{
    return this;
}

Chain.prototype.property = function(name, value)
{
    return this;
}

Chain.prototype.text = function(t)
{
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
var positioned;
var relative = { positioned: '' };

function createChainBuidler(type) {
    return function(renderObject) {
        return new Chain(type);
    }
}

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
    window[root.name] = createChainBuidler(root);
});

window.addEventListener('DOMContentLoaded', function()
{
    document.body.appendChild(arena);
}, false);
