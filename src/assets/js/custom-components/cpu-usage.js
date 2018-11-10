module.exports = function() {
  setInterval(() => this.value = process.getCPUUsage().percentCPUUsage.toString().slice(0, 5), 800);
}
