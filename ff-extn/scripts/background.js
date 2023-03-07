const WATCH_URL = "https://www.amazon.in/b?node=28202809031";

const MSG_IGNORING = "IGNORING samplers@amazon.in";
const MSG_WATCHING = "WATCHING samplers@amazon.in";

const ICON_IGNORING = "icons/play.svg"
const ICON_WATCHING = "icons/stop.svg"

var watching = false;
var watchInterval = 60000;
var watcherId = undefined;
var COUPONS = new Set();

function setPageActionIcon(tabId, changeInfo = undefined) {
/*
	Based on whether watching or ignoring, 
	set appropriate page action icon.
*/
	if( changeInfo !== undefined && changeInfo.status !== "complete") return;

	let msg;
	let path;

	if(watching) {
		msg = MSG_WATCHING;
		path = ICON_WATCHING;
	}
	else {
		msg = MSG_IGNORING;
		path = ICON_IGNORING;
	}

	browser.pageAction.setIcon({ tabId: tabId, path: path });
	browser.pageAction.setTitle({ tabId: tabId, title: msg });
	console.log(msg + ` on tab ${tabId} ...`);
}

function setPageActionIcons(tabs) {
	for(let tab of tabs) setPageActionIcon(tab.id);
}

function setWatching(isWatching) {
/*
	Set whether watching or ignoring.
*/
	watching = isWatching;
	browser.tabs.query({ url: WATCH_URL }).then(setPageActionIcons); 
}

function refreshWatchedTab(tabs) {
	if( tabs.length != 0 ) browser.tabs.reload(tabs[0].id);
	else browser.tabs.create({ url: WATCH_URL });
}

function fetchAndRefreshWatchedTab() {
	browser.tabs.query({ url: WATCH_URL }).then(refreshWatchedTab); 
}

function startWatching() {
/* 
	Refresh tab with WATCH_URL every watchInterval milliseconds.
*/
	setWatching(true);
	fetchAndRefreshWatchedTab();
	watcherId = setInterval(fetchAndRefreshWatchedTab, watchInterval);
}

function toggleWatch() {
/*
	Based on whether watching or ignoring, 
	start ignoring or watching respectively.
*/
	if(watching) {			/* Ignoring */
		clearInterval(watcherId);
		setWatching(false);
		watcherId = undefined;
		COUPONS = new Set();
	}
	else startWatching();	/* Watching */
}

console.log("LOADING samplers@amazon.in ...");

/* browser.pageAction.onClicked.addListener(toggleWatch); */

browser.tabs.onUpdated.addListener(setPageActionIcon, { urls: [WATCH_URL] });

function notifyNewCoupons(newCoupons) {
/* 
	Notify upon discovery of new COUPON/s.
*/
	newCoupons.forEach( coupon => browser.notifications.create(undefined, { type: "basic", message: coupon, title: "New Coupon!" }) );
}

function checkNewCoupons(coupons) {
/* 
	Check new COUPONS in WATCH_URL tab.
*/
	console.log("Received Coupons: " + Array.from(coupons).join(' '));

	let newCoupons = new Set([...coupons].filter(coupon => !COUPONS.has(coupon)));
	if(newCoupons.size > 0) {
		notifyNewCoupons(Array.from(newCoupons));
		console.log("New Coupons: " + Array.from(coupons).join(' '));
	}

	COUPONS = coupons;
}

browser.runtime.onMessage.addListener((msg, sender) => { if(watching && 'coupons' in msg) checkNewCoupons(msg.coupons); });

function amazon_sampler_status() {
	return { watching : watching, watchInterval : watchInterval / 1000 };
}

browser.runtime.onConnect.addListener((port) => {
	port.onMessage.addListener((msg) => {
		switch(true) {
			case "amazon_sampler_get_status" === msg :
			break;
			case "amazon_sampler_status_toggle" in msg :
				if(!watching) watchInterval = msg.amazon_sampler_status_toggle * 1000;
				toggleWatch();
			break;
		}
		console.log("Sending Port Message - amazon_sampler_status");
		port.postMessage(amazon_sampler_status());
	});
});
