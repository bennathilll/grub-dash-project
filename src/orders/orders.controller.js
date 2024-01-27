const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
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

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function dishArrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: `Order must include a dish`,
    });
  } else {
    dishes.forEach((dish, index) => {
      if (
        !dish.quantity ||
        dish.quantity <= 0 ||
        !Number.isInteger(dish.quantity)
      ) {
        next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        });
      }
    });
  }
  next();
}

function idIsValid(req, res, next) {
  const { id } = req.body.data;
  const orderId = req.params.orderId;
  if (!id) {
    next();
  } else if (req.body.data.id !== orderId) {
    next({
      status: 400,
      message: `Order id: ${id} does not match in route`,
    });
  } else {
    next();
  }
}

function statusIsValid(req, res, next) {
  const { status } = req.body.data;

  if (
    status == "pending" ||
    status == "preparing" ||
    status == "out-for-delivery" ||
    status == "delivered"
  ) {
    if (status === "delivered") {
      next({
        status: 400,
        message: "Order has already been delivered",
      });
    } else {
      next();
    }
  } else {
    next({
      status: 400,
      message: "Incorrect status for order",
    });
  }
}

function deleteIsValid(req, res, next) {
  const currentOrder = res.locals.order;
  if (currentOrder.status !== "pending") {
    next({
      status: 400,
      message: "Order must be in pending status to delete",
    });
  }
  return next();
}

// POST
function create(req, res) {
  const newOrder = { ...req.body.data, id: nextId() };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const foundOrder = res.locals.order;
  if (foundOrder) {
    res.json({ data: foundOrder });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
}

// PUT
function update(req, res) {
  const orderId = req.params.orderId;
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  const updatedOrder = {
    id: orderId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  return res.json({ data: updatedOrder });
}

// DELETE
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    dishArrayIsValid,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    dishArrayIsValid,
    idIsValid,
    statusIsValid,
    update,
  ],
  destroy: [orderExists, deleteIsValid, destroy],
};
