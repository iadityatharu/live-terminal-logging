import express from "express";
import liveLogger from ".";

const app = express();
app.use(express.json());
app.use(
  liveLogger({
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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
