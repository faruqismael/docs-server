const config = require("config");

const clientPORT = config.get("CLIENT_PORT");

const io = require("socket.io")(config.get("SOCKET_PORT"), {
  cors: {
    methods: ["GET", "POST"],
  },
});

const mongoose = require("mongoose");
var ObjectId = require("mongodb").ObjectID;
const Document = require("./Documents");

mongoose.connect(
  "mongodb://localhost:27017/google-docs-clone",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => {
    console.log("db connected ...");
  }
);

const emptyData = "";

async function findOrCreateDocument(id) {
  if (id == null) {
    return;
  }
  let document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: emptyData });
}
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);

    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("recieve-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});
