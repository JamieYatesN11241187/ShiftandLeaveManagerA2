// utils/commands.js
import axiosInstance from "../axiosConfig";

export class Command {
  async execute() {
    throw new Error("Execute method must be implemented");
  }
}

//  Pickup Shift 
export class PickupShiftCommand extends Command {
  constructor(shiftId, user) {
    super();
    this.shiftId = shiftId;
    this.user = user;
  }
  async execute() {
    return axiosInstance.put(
      `/api/shifts/${this.shiftId}/pickup`,
      {},
      { headers: { Authorization: `Bearer ${this.user.token}` } }
    );
  }
}

//  Drop Shift 
export class DropShiftCommand extends Command {
  constructor(shiftId, user) {
    super();
    this.shiftId = shiftId;
    this.user = user;
  }
  async execute() {
    return axiosInstance.put(
      `/api/shifts/${this.shiftId}/drop`,
      {},
      { headers: { Authorization: `Bearer ${this.user.token}` } }
    );
  }
}

//  Request Swap 
export class RequestSwapCommand extends Command {
  constructor(shiftId, user) {
    super();
    this.shiftId = shiftId;
    this.user = user;
  }
  async execute() {
    return axiosInstance.post(
      `/api/swaps/${this.shiftId}`,
      {},
      { headers: { Authorization: `Bearer ${this.user.token}` } }
    );
  }
}

// Approve Swap
export class ApproveSwapCommand extends Command {
  constructor(shiftId, swapId, action, user) {
    super();
    this.shiftId = shiftId;
    this.swapId = swapId;
    this.action = action;
    this.user = user;
  }
  async execute() {
    return axiosInstance.put(
      `/api/swaps/${this.shiftId}/approval`,
      { swapId: this.swapId, action: this.action },
      { headers: { Authorization: `Bearer ${this.user.token}` } }
    );
  }
}
