import Activity from "../models/Activity";
import { io } from "../server";

export const emitActivity =
  async (payload: any) => {

    const activity =
      await Activity.create(payload);

    const populated =
      await Activity.findById(
        activity._id
      ).populate(
        "userId",
        "name email avatar"
      );

    io.to(
      "admin-dashboard"
    ).emit(
      "activity:new",
      populated
    );

    io.to(
      "admin-feed"
    ).emit(
      "feed:update",
      populated
    );

    io.to(
      "admin-security"
    ).emit(
      "security:stream",
      populated
    );

    return populated;
  };