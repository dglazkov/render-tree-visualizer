function chain()
{
    return chain;
}

var anonymous;
var positioned;
var relative = { positioned: '' };

[
    'at',
    'pos',
    'tag',
    'size',
    'contains',
    'width',
    'property',
    'text'
].forEach(function(method) {
    chain[method] = chain;
});

[
    'layer',
    'render',
    'text',
].forEach(function(root) {
    window[root] = chain;
});
