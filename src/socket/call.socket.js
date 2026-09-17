import jwt from "jsonwebtoken";

const onlineUsers = new Map();

export const registerCallSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (!decoded.userId) {
        return next(
          new Error("Invalid authentication token")
        );
      }

      socket.userId = decoded.userId.toString();

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(
        new Error("Invalid authentication token")
      );
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.id} | User: ${socket.userId}`
    );

    onlineUsers.set(
      socket.userId,
      socket.id
    );

    socket.on("disconnect", () => {
      const currentSocketId =
        onlineUsers.get(socket.userId);

      if (currentSocketId === socket.id) {
        onlineUsers.delete(socket.userId);
      }

      console.log(
        `Socket disconnected: ${socket.id}`
      );
    });
  });
};

export const getUserSocketId = (userId) => {
  return onlineUsers.get(
    userId.toString()
  );
};