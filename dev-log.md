# Timer Auto-Resume Issue Retrospective

- Issue: After reload, the timer state was restored, but countdown did not resume automatically.
- Root Cause: The timer's interval was only started if running was false, so restoring a running state did not restart the interval.
- Resolution: Refactored start() to always start the interval if the timer should be running and no interval is active, ensuring ticking resumes after reload.
- Difficulties: The main challenge was subtle timing and state logic—restoring state and starting intervals must be coordinated to avoid duplicate intervals or missed ticks. Debugging required adding console logs and careful review of lifecycle and state transitions.
