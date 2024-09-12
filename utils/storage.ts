import fastifyMulter from "fastify-multer";

const storage = fastifyMulter.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    let extension = file.mimetype?.split("/")[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + uniqueSuffix + "." + extension);
  },
});
export const upload = fastifyMulter({ storage });
