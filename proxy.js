function proxy(func, context) {
  return function() { func.apply(context, arguments); }
}

module.exports = proxy;
