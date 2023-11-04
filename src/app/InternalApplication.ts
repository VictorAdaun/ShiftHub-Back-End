import { RoutingControllersOptions } from "routing-controllers";

import { BaseApplication } from "./BaseApplication";
import { HealthCheckController } from "./controllers/HealthCheckController";

export class InternalApplication extends BaseApplication {
  getControllerOptions(): RoutingControllersOptions {
    return {
      controllers: [HealthCheckController],
      routePrefix: "/internal",
    };
  }
}
