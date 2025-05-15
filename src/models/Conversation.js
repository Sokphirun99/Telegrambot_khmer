/**
 * User Conversation Model
 */

class Conversation {
    constructor(userId) {
        this.userId = userId;
        this.state = 'idle';
        this.data = {};
        this.lastUpdated = new Date();
        this.lastActivityTime = new Date(); // Added for persistence compatibility
    }

setState(newState) {
    this.state = newState;
    this.lastUpdated = new Date();
    this.lastActivityTime = new Date(); // Update both timestamps
    return this;
}

setData(key, value) {
    this.data[key] = value;
    this.lastUpdated = new Date();
    this.lastActivityTime = new Date(); // Update both timestamps
    return this;
}

getData(key) {
    return this.data[key];
}

reset() {
    this.state = 'idle';
    this.data = {};
    this.lastUpdated = new Date();
    this.lastActivityTime = new Date(); // Update both timestamps
    return this;
}


isExpired() {
    const timeoutMinutes = 30; // Set your timeout duration here
    const now = new Date();
    const diffMs = now - (this.lastUpdated || this.lastActivityTime); // Use either timestamp
    return diffMs > timeoutMinutes * 60 * 1000;
}
}

module.exports = Conversation;
