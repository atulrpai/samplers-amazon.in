let xpath="//*[contains(text(),'Copy the coupon code:')]";

let query = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

let coupons = new Set();

for(let i = 0, length = query.snapshotLength; i < length; ++i) coupons.add( query.snapshotItem(i).textContent.split(':')[1].trim() );

// console.log("Sent Coupons: " + Array.from(coupons).join(' '));

browser.runtime.sendMessage({ coupons: coupons });
