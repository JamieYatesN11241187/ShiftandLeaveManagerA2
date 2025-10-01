//utils/SwapIterator.js
export default class SwapIterator {
  constructor(swapRequests) {
    this.swapRequests = swapRequests;
    this.index = 0;
  }

  hasNext() {
    return this.index < this.swapRequests.length;
  }

  next() {
    if (this.hasNext()) {
      return this.swapRequests[this.index++];
    }
    return null;
  }

  reset() {
    this.index = 0;
  }
}

