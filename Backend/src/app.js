const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", routes);

app.use(errorMiddleware);

module.exports = app;
