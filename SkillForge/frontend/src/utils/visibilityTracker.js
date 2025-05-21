// src/utils/visibilityTracker.js
/**
 * Utility for tracking page visibility and user focus
 */
class VisibilityTracker {
  constructor() {
    this.visibilityStart = Date.now();
    this.isVisible = !document.hidden;
    this.totalHiddenTime = 0;
    this.lastHiddenStart = null;
    this.visibilityEvents = [];

    // Bind event handler
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    // Add event listener
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  handleVisibilityChange() {
    const now = Date.now();

    if (document.hidden) {
      // Page is now hidden
      this.isVisible = false;
      this.lastHiddenStart = now;
      this.visibilityEvents.push({
        type: "hidden",
        timestamp: now,
      });
    } else {
      // Page is now visible
      this.isVisible = true;

      if (this.lastHiddenStart) {
        const hiddenDuration = (now - this.lastHiddenStart) / 1000; // in seconds
        this.totalHiddenTime += hiddenDuration;

        this.visibilityEvents.push({
          type: "visible",
          timestamp: now,
          hiddenDuration,
        });

        this.lastHiddenStart = null;
      }
    }
  }

  getVisibilityStats() {
    const now = Date.now();
    const sessionDuration = (now - this.visibilityStart) / 1000; // in seconds

    // If currently hidden, add current hidden time
    let totalHiddenTime = this.totalHiddenTime;
    if (!this.isVisible && this.lastHiddenStart) {
      totalHiddenTime += (now - this.lastHiddenStart) / 1000;
    }

    return {
      sessionDuration,
      totalHiddenTime,
      visibilityRatio: Math.max(0, 1 - totalHiddenTime / sessionDuration),
      tabSwitchCount: this.visibilityEvents.filter((e) => e.type === "hidden")
        .length,
      events: this.visibilityEvents,
    };
  }

  cleanup() {
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );
  }
}

export default VisibilityTracker;
