module.exports = {
  sayHello
};

function sayHello(req, res) {
  res.send({ message: 'Hello World!' });
}
