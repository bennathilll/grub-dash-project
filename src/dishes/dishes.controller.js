const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// GET
function list(req, res) {
  res.json({ data: dishes });
}

// Middleware functions
function bodyHasData(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function priceIsValid(req, res, next) {
  const { price } = req.body.data;
  if (!price) {
    next({
      status: 400,
      message: "Must include a price",
    });
  } else if (Number.isInteger(price) && price > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "The price must be greater than 0",
    });
  }
}

function idIsValid(req, res, next) {
  const { id } = req.body.data;
  const dishId = req.params.dishId;
  if (!id) {
    next();
  } else if (req.body.data.id !== dishId) {
    next({
      status: 400,
      message: `Dish id: ${id} does not match in route`,
    });
  } else {
    next();
  }
}

// POST
function create(req, res) {
  const newDish = { ...req.body.data, id: nextId() };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

// GET by id
function read(req, res, next) {
  const foundDish = res.locals.dish;
  if (foundDish) {
    res.json({ data: foundDish });
  } else {
    res.status(404).json({ error: "Dish not found" });
  }
}

// PUT
function update(req, res, next) {
  const { dishId } = req.params; 
  const dish = res.locals.dish;
  const { id, name, description, price, image_url } = req.body.data;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    });
  }

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  return res.json({ data: dish });
}

// DELETE
function destroy(req, res) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === Number(dishId));
  dishes.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("image_url"),
    priceIsValid,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("image_url"),
    priceIsValid,
    idIsValid,
    update,
  ],
  delete: [dishExists, destroy],
};
