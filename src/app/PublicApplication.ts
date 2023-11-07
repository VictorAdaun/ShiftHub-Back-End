import express from "express";

import { RoutingControllersOptions } from "routing-controllers";

import { BaseApplication } from "./BaseApplication";
import { HealthCheckController } from "./controllers/HealthCheckController";
import { AuthController } from "../modules/user/controller/AuthController";
import { TaskController } from "../modules/task/controller/TaskController";
import { TeamController } from "../modules/team/controller/TeamController";
import { EmployeeController } from "../modules/employee/controller/EmployeeController";
import { AdminController } from "../modules/admin/controller/AdminController";
export class PublicApplication extends BaseApplication {
  getControllerOptions(): RoutingControllersOptions {
    const used = process.memoryUsage();

    console.log("Memory Usage:");
    console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`);
    console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
    console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`);
    return {
      controllers: [
        HealthCheckController,
        AuthController,
        TaskController,
        TeamController,
        EmployeeController,
        AdminController,
      ],
      routePrefix: "/api",
    };
  }

  protected setupExpressApp(app: express.Express): void {
    app.set("trust proxy", "uniquelocal");
  }
}
