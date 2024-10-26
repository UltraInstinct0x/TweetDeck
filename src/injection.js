let extId;
let isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
if(!window.chrome) window.chrome = {};
if(!window.chrome.runtime) window.chrome.runtime = {};
window.chrome.runtime.getURL = url => {
    if(!url.startsWith('/')) url = `/${url}`;
    return `${isFirefox ? 'moz-extension://' : 'chrome-extension://'}${extId}${url}`;   
}
window.addEventListener('message', e => {
    if(e.data.extensionId) {
        console.log("got extensionId", e.data.extensionId);
        extId = e.data.extensionId;
        main();
    }
});
window.postMessage('extensionId', '*');

async function main() {
    let html = await fetch(chrome.runtime.getURL('/files/index.html')).then(r => r.text());
    document.documentElement.innerHTML = html;

    let [challenge_js, interception_js, vendor_js, bundle_js, bundle_css, twitter_text] =
        await Promise.allSettled([
            fetch(chrome.runtime.getURL("/src/challenge.js")).then(r => r.text()),
            fetch(chrome.runtime.getURL("/src/interception.js")).then(r => r.text()),
            fetch(chrome.runtime.getURL("/files/vendor.js")).then(r => r.text()),
            fetch(chrome.runtime.getURL("/files/bundle.js")).then(r => r.text()),
            fetch(chrome.runtime.getURL("/files/bundle.css")).then(r => r.text()),
            fetch(chrome.runtime.getURL("/files/twitter-text.js")).then(r => r.text()),
        ]);
    if (!localStorage.getItem("OTDalwaysUseLocalFiles")) {
        const [
            remote_challenge_js_req,
            remote_interception_js_req,
            remote_vendor_js_req,
            remote_bundle_js_req,
            remote_bundle_css_req,
            remote_twitter_text_req,
        ] = await Promise.allSettled([
            fetch("https://raw.githubusercontent.com/UltraInstinct0x/TweetDeck/main/src/challenge.js"),
            fetch("https://raw.githubusercontent.com/UltraInstinct0x/TweetDeck/main/src/interception.js"),
            fetch("https://raw.githubusercontent.com/UltraInstinct0x/TweetDeck/main/files/vendor.js"),
            fetch("https://raw.githubusercontent.com/UltraInstinct0x/TweetDeck/main/files/bundle.js"),
            fetch("https://raw.githubusercontent.com/UltraInstinct0x/TweetDeck/main/files/bundle.css"),
            fetch("https://raw.githubusercontent.com/UltraInstinct0x/TweetDeck/main/files/twitter-text.js"),
        ]);
        
        if(
            (remote_challenge_js_req.value && remote_challenge_js_req.value.ok) ||
            (remote_interception_js_req.value && remote_interception_js_req.value.ok) || 
            (remote_vendor_js_req.value && remote_vendor_js_req.value.ok) ||
            (remote_bundle_js_req.value && remote_bundle_js_req.value.ok) ||
            (remote_bundle_css_req.value && remote_bundle_css_req.value.ok) ||
            (remote_twitter_text_req.value && remote_twitter_text_req.value.ok)
        ) {
            const [
                remote_challenge_js,
                remote_interception_js,
                remote_vendor_js,
                remote_bundle_js,
                remote_bundle_css,
                remote_twitter_text,
            ] = await Promise.allSettled([
                remote_challenge_js_req.value.text(),
                remote_interception_js_req.value.text(),
                remote_vendor_js_req.value.text(),
                remote_bundle_js_req.value.text(),
                remote_bundle_css_req.value.text(),
                remote_twitter_text_req.value.text(),
            ]);

            if (
                remote_challenge_js_req.value &&
                remote_challenge_js_req.value.ok &&
                remote_challenge_js.status === "fulfilled" &&
                remote_challenge_js.value.length > 30
            ) {
                challenge_js = remote_challenge_js;
                console.log("Using remote challenge.js");
            }

            if (
                remote_interception_js_req.value &&
                remote_interception_js_req.value.ok &&
                remote_interception_js.status === "fulfilled" &&
                remote_interception_js.value.length > 30
            ) {
                interception_js = remote_interception_js;
                console.log("Using remote interception.js");
            }
            if (
                remote_vendor_js_req.value &&
                remote_vendor_js_req.value.ok &&
                remote_vendor_js.status === "fulfilled" &&
                remote_vendor_js.value.length > 30
            ) {
                vendor_js = remote_vendor_js;
                console.log("Using remote vendor.js");
            }
            if (
                remote_bundle_js_req.value &&
                remote_bundle_js_req.value.ok &&
                remote_bundle_js.status === "fulfilled" &&
                remote_bundle_js.value.length > 30
            ) {
                bundle_js = remote_bundle_js;
                console.log("Using remote bundle.js");
            }
            if (
                remote_bundle_css_req.value &&
                remote_bundle_css_req.value.ok &&
                remote_bundle_css.status === "fulfilled" &&
                remote_bundle_css.value.length > 30
            ) {
                bundle_css = remote_bundle_css;
                console.log("Using remote bundle.css");
            }
            if (
                remote_twitter_text_req.value &&
                remote_twitter_text_req.value.ok &&
                remote_twitter_text.status === "fulfilled" &&
                remote_twitter_text.value.length > 30
            ) {
                twitter_text = remote_twitter_text;
                console.log("Using remote twitter-text.js");
            }
        }
    }

    let challenge_js_script = document.createElement("script");
    challenge_js_script.innerHTML = challenge_js.value.replaceAll('SOLVER_URL', chrome.runtime.getURL("solver.html"));
    document.head.appendChild(challenge_js_script);

    let interception_js_script = document.createElement("script");
    interception_js_script.innerHTML = interception_js.value;
    document.head.appendChild(interception_js_script);

    let bundle_css_style = document.createElement("style");
    bundle_css_style.innerHTML = bundle_css.value;
    document.head.appendChild(bundle_css_style);

    let vendor_js_script = document.createElement("script");
    vendor_js_script.innerHTML = vendor_js.value;
    document.head.appendChild(vendor_js_script);

    let bundle_js_script = document.createElement("script");
    bundle_js_script.innerHTML = bundle_js.value;
    document.head.appendChild(bundle_js_script);

    let twitter_text_script = document.createElement("script");
    twitter_text_script.innerHTML = twitter_text.value;
    document.head.appendChild(twitter_text_script);

    let paste_handler = document.createElement("script");
    paste_handler.innerHTML = `
        (function() {
            function checkDependencies() {
                if (typeof TD === 'undefined' || typeof TD.controller === 'undefined' || typeof jQuery === 'undefined') {
                    console.log('Waiting for dependencies...');
                    setTimeout(checkDependencies, 100);
                    return;
                }
    
                const $ = jQuery;
                console.log('Dependencies loaded, setting up paste handler');
    
                document.addEventListener('paste', function(e) {
                    if (!e.target.closest('.js-compose-text')) return;
    
                    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                    for (const item of items) {
                        if (item.type.indexOf("image") !== -1) {
                            console.log('Found image in clipboard');
                            e.preventDefault();
                            const file = item.getAsFile();
    
                            // Trigger TD's direct file upload handler
                            $(document).trigger('pasteImage', {
                                target: {
                                    files: [file]
                                }
                            });
                            break;
                        }
                    }
                });
            }
    
            checkDependencies();
        })();
    `;
    
    // Add jQuery first if not present
    if (!document.querySelector('script[src*="jquery"]')) {
        let jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        jqueryScript.onload = function() {
            document.head.appendChild(paste_handler);
        };
        document.head.appendChild(jqueryScript);
    } else {
        document.head.appendChild(paste_handler);
    }

    let int = setTimeout(function() {
        let badBody = document.querySelector('body:not(#injected-body)');
        if (badBody) {
            let badHead = document.querySelector('head:not(#injected-head)');
            clearInterval(int);
            if(badHead) badHead.remove();
            badBody.remove(); 
        }
    }, 200);
    setTimeout(() => clearInterval(int), 10000);

    let injInt;
    function injectAccount() {
        if(!document.querySelector('a[data-title="Accounts"]')) return;
        clearInterval(injInt);

        let accountsBtn = document.querySelector('a[data-title="Accounts"]');
        accountsBtn.addEventListener("click", function() {
            console.log("setting account cookie");
            chrome.runtime.sendMessage({ action: "setcookie" }); 
        });
    }
    setInterval(injectAccount, 1000);
};