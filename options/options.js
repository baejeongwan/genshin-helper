init()

function init() {
    loadLocale()
    loadSettings()
}

function loadLocale() {
    $("html").attr("lang", chrome.i18n.getUILanguage())
    //$("#saved-account").text(chrome.i18n.getMessage(""))
}

function loadSettings() {
    chrome.storage.local.get("autoCheckIn", (data) => {
        if (data.autoCheckIn) {
            $("#auto-checkin-switch").prop("checked", true)
        } else {
            $("#auto-checkin-switch").prop("checked", false)
        }
    })
}

$("#auto-checkin-switch").on("change", function () {
    chrome.storage.local.set({autoCheckIn: $("#auto-checkin-switch").is(':checked')})
})