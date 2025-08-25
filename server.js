require('dotenv').config()
const express=require('express')
const http=require('http')
const {Server}=require('socket.io')
const mongoose=require('mongoose')
const cors=require('cors')
const multer=require('multer')
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary=require('cloudinary').v2

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static("public"));



mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log('db atlas is connected'))
.catch(err=>console.log(err))



cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat-images",
    allowed_formats: ["jpg", "png", "jpeg", "gif"]
  }
});
const upload = multer({ storage });


const messageSchema = new mongoose.Schema({
  room: String,
  user: String,
  text: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);
app.post("/upload", upload.single("image"), (req, res) => {
  res.json({ url: req.file.path }); 
});


io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", async ({ room, user }) => {
    socket.join(room);
    socket.emit("message", { user: "System", text: `You joined ${room}` });
    socket.to(room).emit("message", { user: "System", text: `${user} joined` });

    const messages = await Message.find({ room }).sort({ timestamp: 1 });
    messages.forEach(msg => {
      socket.emit("message", msg);
    });
  });

  socket.on("chatMessage", async ({ room, user, msg, imageUrl }) => {
    const message = new Message({ room, user, text: msg, imageUrl });
    await message.save();
    io.to(room).emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(` Server running on port http://localhost:${PORT}`));
