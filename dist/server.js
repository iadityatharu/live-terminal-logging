"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const _1 = __importDefault(require("."));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(
  (0, _1.default)({
    filterStatusAbove: 100,
    maskFields: ["password"],
    disabledInProd: false,
  })
);
app.get("/", (_req, res) => {
  res.status(200).send("Hello, World!");
});
app.post("/error", (_req, res) => {
  res.status(500).json({ error: "Oops! Something went wrong." });
});
app.patch("/patch", (_req, res) => {
  setTimeout(() => {
    res.status(200).json({ message: "Patch request successful." });
  }, 1000);
});
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
