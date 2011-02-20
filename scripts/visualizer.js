function chain()
{
    return chain;
}

chain.at = function(x, y)
{
    return chain;
}

chain.size = function(w, h)
{
    return chain;
}

chain.contains = function()
{
    return chain;
}

chain.width = function()
{
    return chain;
}

chain.text = function()
{
    return chain;
}

chain.property = function()
{
    return chain;
}

var anonymous;
var positioned;
var relative = { positioned: '' };

[
    'layer',
    'RenderView',
    'textRun',
    'RenderBlock',
    'RenderBody',
    'RenderText',
    'RenderVideo',
    'RenderFlexibleBox',
    'RenderButton',
    'RenderSlider'
].forEach(function(renderObject) {
    window[renderObject] = chain;
});
