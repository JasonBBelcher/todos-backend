function errorHandler(err, req, res, next) {
  return res.status(err.status || 500).json({
    err: {
      message: err.message || "Something went wrong."
    }
  });
}

const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const dbUrl = `mongodb://public:no-more-secrets1@ds141248.mlab.com:41248/codesandbox`;
const db = require("monk")(dbUrl);
const todos = db.create("todos");
todos.createIndex({
  text: "text"
});

app.use(morgan("dev"));

app.use(express.json());
app.use(cors());
app.use(errorHandler);

app
  .get("/todos", (req, res, next) => {
    todos
      .find({})
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  })
  .post("/todo", (req, res, next) => {
    const {
      text,
      priority,
      completed,
      uid
    } = req.body;
    if (
      (typeof text === "string" && typeof uid === 'number' &&
        typeof parseInt(priority, 10) === "number" &&
        typeof completed === "boolean") ||
      req.body.length === 4
    ) {
      todos
        .insert({
          uid,
          text,
          priority,
          completed
        })
        .then(doc => {
          return res.json(doc);
        })
        .catch(next);
    } else {
      next({
        status: 400,
        message: "please provide text, priority, and completed properties only."
      });
    }
  });

app.get("/todos/search", (req, res, next) => {
  const {
    text,
    priority,
    completed
  } = req.query;

  if (text && priority && completed) {
    todos
      .find({
        $and: [{
            $text: {
              $search: text
            }
          },
          {
            priority: {
              $eq: parseInt(priority, 10)
            }
          },
          {
            completed: {
              $in: [JSON.parse(completed)]
            }
          }
        ]
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  } else if (completed && priority) {
    todos
      .find({
        $and: [{
            priority: {
              $eq: parseInt(priority, 10)
            }
          },
          {
            completed: {
              $in: [JSON.parse(completed)]
            }
          }
        ]
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  } else if (text && priority) {
    todos
      .find({
        $and: [{
            priority: {
              $eq: parseInt(priority, 10)
            }
          },
          {
            $text: {
              $search: text
            }
          }
        ]
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  } else if (text && completed) {
    todos
      .find({
        $and: [{
            completed: {
              $in: [JSON.parse(completed)]
            }
          },
          {
            $text: {
              $search: text
            }
          }
        ]
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  } else if (priority) {
    todos
      .find({
        priority: {
          $eq: parseInt(priority, 10)
        }
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  } else if (completed) {
    todos
      .find({
        completed: {
          $in: [JSON.parse(completed)]
        }
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  } else {
    todos
      .find({
        $text: {
          $search: text
        }
      })
      .then(docs => {
        return res.json(docs);
      })
      .catch(next);
  }
});

app.put("/todo/:uid", (req, res, next) => {
  const {
    uid
  } = req.params;
  const {
    text,
    completed,
    priority
  } = req.body;
  if (text && typeof completed === "boolean" && priority) {
    todos
      .findOneAndUpdate({
        uid: parseFloat(uid)
      }, {
        $set: {
          text,
          completed,
          priority
        }
      })
      .then(updatedDoc => {
        return res.json(updatedDoc);
      })
      .catch(next);
  } else {
    next({
      status: 400,
      message: "please provide text, priority, and completed properties."
    });
  }
});


app.delete("/todo/:uid", (req, res, next) => {
  const {
    uid
  } = req.params;

  todos
    .findOneAndDelete({
      uid: parseFloat(uid)
    })
    .then(doc => {
      return res.json(doc);
    })
    .catch(next);
});

app.delete("/todos", (req, res, next) => {
  todos.remove({}).then(() => {
    res.json([]);
  });
});

app.use((req, res, next) => {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use(errorHandler);

app.listen(8080);