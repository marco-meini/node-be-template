import { App } from "./app.mjs";

const app = new App();
let port = app.env.config.port || 8051;

(async () => {
  try {
    await app.start();
    app.express.listen(port, () => {
      app.env.logger.info("### Server started on port", port.toString(), " ###");
    });
  } catch (e) {
    app.env.logger.error(e);
  }
})();

process.on("beforeExit", () => {
  app.end();
});
