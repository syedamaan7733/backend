const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const connectDB = (url) => {
  return mongoose.connect(url, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    maxPoolSize: 10, // Limit number of connections in the pool
  });
};

// Close connections on process termination
process.on("SIGINT", async () => {
  console.log("Closing database connection...");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;
