// cron/softwareExpiryCron.js

import cron from "node-cron";
import Software from "../models/softwareSchema.js";

cron.schedule("0 9 * * *", async () => {
  try {
    const today = new Date();

    const softwares =
      await Software.find();

    for (const s of softwares) {
      const expiry = new Date(
        s.expiryDate
      );

      if (expiry < today) {
        s.status = "Expired";

        await s.save();

        console.log(
          `${s.serviceName} expired`
        );
      }
    }
  } catch (err) {
    console.log(err);
  }
});