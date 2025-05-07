init();

function init() {
    loadLocale()
    showResin()
    getCheckInStatusAndDisplay()
}

function loadLocale() {
    $("html").attr("lang", chrome.i18n.getUILanguage())
    $("#title").text(chrome.i18n.getMessage("extName"))
    $("#resin-state").text(chrome.i18n.getMessage("popupResinState"))
    $("#redeem-code").text(chrome.i18n.getMessage("popupRedeemCode"))
    $("#redeem-code-input-title").text(chrome.i18n.getMessage("popupRedeemCodeInputBoxTitle"))
    $("#redeem-code-input").attr("placeholder", chrome.i18n.getMessage("popupRedeemCodeInputBoxPlaceholder"))
    $("#redeem-btn").text(chrome.i18n.getMessage("popupRedeemCodeRedeemButton"))
    $("#copy-account-btn").text(chrome.i18n.getMessage("popupFetchAccountFromHoyolabBtn"))
    $("#auto-checkin").text(chrome.i18n.getMessage("popupCheckIn"))
    $("#dev-sign-blockquote").html(`${chrome.i18n.getMessage("popupDevSignature")} / <a href="${chrome.i18n.getMessage("projectUrl")}" target="_blank">${chrome.i18n.getMessage("popupProjectLink")}</a>`)
}

$("#redeem-btn").on("click", function() {
    let code = $("#redeem-code-input").val();
    chrome.tabs.create({
        url: chrome.i18n.getMessage("redeemUrl") + encodeURIComponent(code)
    });
})

$("#copy-account-btn").on("click", function() {
    chrome.cookies.getAll({domain: "hoyolab.com"}, function(cookies) {
        console.log("Captures cookies:", cookies);
        if (cookies.length == 0) {
            console.warn("No cookie data - Not logged in?")
            $("#account-copy-alert").css({"display": ""})
            $("#account-copy-alert").text(chrome.i18n.getMessage("popupHoyoNoLogin"))
        } else {
            $("#account-copy-alert").css({"display": ""})
            $("#account-copy-alert").text(chrome.i18n.getMessage("popupCopySuccessAlert"))
            chrome.storage.local.set({ hoyolabCookies: cookies }, function() {
                console.log("Cookies saved to local storage.");
            })
        }
    })
})

function getCheckInStatusAndDisplay() {
    $("#auto-checkin-status").text("")
    // Get auto check in status
    chrome.storage.local.get("autoCheckIn", (data) => {
        if (data.autoCheckIn) {
            // On
            $("#auto-checkin-status").append(chrome.i18n.getMessage("popupAutoCheckInOn"))
        } else {
            // Off
            $("#auto-checkin-status").append(chrome.i18n.getMessage("popupAutoCheckInOff"))
        }
        $("#auto-checkin-status").append(" ")
    })

    // Get check in status
    getCheckInStatus().then((result) => {
        if (result.checkInData.retcode == 0) {
            if (result.checkInData.data.is_sign) {
                $("#auto-checkin-status").append(chrome.i18n.getMessage("popupCheckInDone"))
            } else {
                $("#auto-checkin-status").append(chrome.i18n.getMessage("popupCheckInNotDone"))
            }
        } else {
            $("#auto-checkin-status").append(chrome.i18n.getMessage("popupCheckInLoadFail") + result.checkInData.message)
        }
    }).catch((e) => {
        $("#auto-checkin-status").append(chrome.i18n.getMessage("popupCheckInLoadFail") + e.message)
    })
}

function showResin() {
    getAccounts().then((data) => {
        if (data.retcode == 0) {
            getResinsAndDisplay(data).then(() => {
                console.log("Displayed resin.")
            }).catch((e) => {
                console.error("Error while displaying resin: ", e)
                $("#resin-display-box").html(`<p>${chrome.i18n.getMessage("popupResinLoadError")} ${e}</p>`)
            })
        } else if (data.retcode == -100) {
            $("#resin-display-box").html(`<p>${chrome.i18n.getMessage("popupResinNotLoggedIn")}</p>`)
        } else {
            $("#resin-display-box").html(`<p>${chrome.i18n.getMessage("popupResinLoadError")} ${data.message}</p>`)
        }
    }).catch((e) => {
        $("#resin-display-box").html(`<p>${chrome.i18n.getMessage("popupResinLoadError")} ${e.message}</p>`)
        console.error("Error while displaying resin: ", e)
    })
}


async function getResinsAndDisplay(accounts) {
    const accountData = accounts.data.list
    if (Array.isArray(accountData)) {
        $("#resin-display-box").html("")
        accountData.forEach((account) => {
            getResinData(account.game_uid, account.region).then((data) => {
                console.log("Resin is: ", data, " for account ", account)
                $("#resin-display-box").append(`
                    <blockquote>Server: ${account.region_name} / UID: ${account.game_uid} / ID: ${account.nickname}</blockquote>
                    <div style="display: flex; align-items: center;">
                        <div class="progress" style="margin: 0;">
                            <div class="determinate" style="width: ${Math.round(data.data.current_resin / data.data.max_resin * 100)}%;"></div>
                        </div>
                        <p style="margin: 0 5px;" class="flow-text">${data.data.current_resin}/${data.data.max_resin}</p>
                    </div>`)
            }).catch((e) => {
                console.error("Error fetching resin data: ", e)
            })
        })
    }
}

/**
 * Get account from hoyolab.
 */
async function getAccounts() {
    const response = await fetch("https://api-account-os.hoyolab.com/binding/api/getUserGameRolesByLtoken?game_biz=hk4e_global")
    const data = response.json()
    return data
}

/**
 * Get resin data from hoyolab.
 */
async function getResinData(uid, server) {
    const response = await fetch(`https://bbs-api-os.hoyolab.com/game_record/genshin/api/dailyNote?role_id=${uid}&server=${server}`)
    const data  = response.json()
    return data
}


/**
 * Query check in status from hoyoverse.
 */
async function getCheckInStatus() {
    const checkInResponse = await fetch("https://sg-hk4e-api.hoyolab.com/event/sol/info?act_id=e202102251931481", { method: "GET" });
    const checkInData = await checkInResponse.json();
    const reCheckInResponse = await fetch("https://sg-hk4e-api.hoyolab.com/event/sol/resign_info?act_id=e202102251931481", { method: "GET" });
    const reCheckInData = await reCheckInResponse.json();
    return {checkInData, reCheckInData}
}  