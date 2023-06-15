function schedule(task, interval) {
    const now = new Date();
    const delay = interval - now % interval;
    setTimeout(function () {
        task();
        setInterval(task, interval);
    }, delay);
}

module.exports = schedule