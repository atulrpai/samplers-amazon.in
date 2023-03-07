var port = browser.runtime.connect({ name: "samplers@amazon.in" });

port.onMessage.addListener((amazon_sampler_status) => {
	document.getElementById("amazon_sampler_status_toggle").value = amazon_sampler_status.watching ? "Stop" : "Start";
	if(amazon_sampler_status.watching) document.getElementById("amazon_sampler_interval").value = amazon_sampler_status.watchInterval;
});

console.log("Sending Port Message - amazon_sampler_get_status"); 
port.postMessage("amazon_sampler_get_status");

document.addEventListener("click", (e) => {
	if(e.target.id === "amazon_sampler_status_toggle") {
		console.log("Sending Port Message - amazon_sampler_status_toggle");
		port.postMessage({ amazon_sampler_status_toggle : document.getElementById("amazon_sampler_interval").value });
	}
});
