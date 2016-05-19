(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

jQuery(document).ready(function () {

    getData();
});

var data_uri = "_assets/data/feed.json";
var rel_path = "";
var is_page = false;
var unreadLimit = 3;
var max_notifications = 5;
var max_new_notifications = 5;
var notifications_str = "";
var archived_str = "";
//var count = 0;
var newCount = 0;
var archiveClass = "esri-icon-checkbox-unchecked";
var unarchiveClass = "esri-icon-checkbox-checked";
var archiveTitle = "Dismiss";
var unarchiveTitle = "Reopen";

var currTab = "new";
var headerStrings = {
    "new": "Open Notifications",
    //'viewed'    : 'Read Notifications',
    all: "All Notifications"
};

function getData() {
    is_page = jQuery(".notifications-feed-page").length > 0;

    if (is_page) {
        rel_path = "../";
        max_notifications = 100;
    }

    jQuery.get(rel_path + data_uri, function (data) {
        jQuery(".notifications").empty();

        if (!is_page) populateNotifications(data, ".notifications");else if (is_page) populateNotifcationsPage(data, ".notifications");

        bindTabs();
        jQuery("#notifications-title").html(headerStrings[currTab]);
        jQuery(".search-input").attr("placeholder", "Filter " + headerStrings[currTab]);
        if (is_page) bindArchiving();
    }).fail(function () {
        console.log("error. Trying different URI.");
        if (data_uri.indexOf("../") == -1) {
            rel_path = "../";
            getData();
        }
    });
}

var titleLength = 50;
var notificationActions = {
    "minus-circled": ["View Affected Items"],
    user: ["Accept", "Ignore"],
    group: ["View Account"]
};

function populateNotifications(data, elem) {
    jQuery(elem).css("opacity", 0);

    jQuery(data).each(function (index, date) {
        jQuery(date.events).each(function (i, event) {
            if (event.isNotification && event.archived !== "true") {
                if (newCount < max_notifications) notifications_str += makeEvent(event, index, i);
                newCount++;
                //console.log(newCount);
            }
        });
    });

    jQuery(elem).html(notifications_str);
    jQuery(elem).animate({ opacity: 1 }, 500);
    //console.log('*'+newCount);
    updateBadge();
}

function populateNotifcationsPage(data, elem) {
    jQuery(elem).css("opacity", 0);

    jQuery(data).each(function (index, date) {
        jQuery(date.events).each(function (i, event) {
            if (event.isNotification) {
                notifications_str += makeEvent(event, index, i);
                //count++;
                if (event.archived !== "true") newCount++;
            }
        });
    });
    jQuery(elem).html(notifications_str);
    jQuery(".is-archived").hide();
    jQuery(elem).animate({ opacity: 1 }, 750);
    updateBadge();
}

function makeEvent(event, index, i) {
    var ret_str = "";
    var typeAction;
    var actionsDesc;
    //var oddEven = i % 2 == 0 ? 'even-event' : 'odd-event';
    //var first = i > 0 ? '' : 'first-event';
    var eventID = "event-" + index + "-" + i;
    //var followID = !event.following ? 'none' : event.followID;
    //console.log(date_str);
    var unread = event.unread == "true" ? "unread" : "";
    var archived = event.archived == "true" ? "is-archived" : "is-new";

    var eventTitle = event.item.length <= titleLength ? event.item : event.item.substr(0, event.item.indexOf(" ", titleLength)) + "...";
    eventTitle = event.linkable ? "<a href=\"#\">" + eventTitle + "</a>" : eventTitle;
    //console.log('event.actorImg: '+ event.actorImg)
    var actorAvatar = event.actorImg ? event.actorImg : "http://dummyimage.com/100/595959/ffffff&text=FPO";
    actorAvatar = actorAvatar.indexOf("http") >= 0 ? actorAvatar : rel_path + actorAvatar;

    ret_str += "<article class=\"esri-event " + unread + " " + archived + "\" id=\"" + eventID + "\" >";

    ret_str += "<div class=\"event-meta\">";
    ret_str += "<i class=\"event-bullet-" + event.actionType + " esri-icon-" + event.actionType + " event-bullet\"></i>";
    ret_str += "</div>";
    ret_str += "<div class=\"event-body\">"; // [ body
    ret_str += "<div class=\"event-content\">"; // [ content
    ret_str += "<h4 class=\"event-title event-title-" + event.itemType + "\">" + eventTitle;
    ret_str += " <span class=\"event-item-label\">" + event.itemType + "</span>";
    ret_str += "</h4>";

    ret_str += "<div class=\"event-info\">"; // [ info
    ret_str += "<p class=\"event-message\">" + event.message + "</p>";
    //ret_str += '<div class="event-time" title="'+event.dateStamp+'"><span class="esri-icon esri-icon-time-clock"></span> '+event.actionTime+'</div>';
    ret_str += "</div>"; // info ]
    ret_str += "</div>"; // content ]

    //if(event.actionable) {
    ret_str += "<div class=\"event-actions\">"; //  [actions
    if (event.actionable) {
        var toggleClass = event.actionType !== "user" ? "" : "event-action-toggle";
        jQuery(notificationActions[event.actionType]).each(function (i, obj) {
            ret_str += "<a class=\"btn btn-small btn-clear event-action " + toggleClass + "\" data-id=\"" + eventID + "\" >" + obj + "</a>";
            // ret_str += '<a class="event-action">' + obj + '</a>';
        });
    }
    ret_str += "</div>"; //  actions]

    ret_str += "<div class=\"event-time\" title=\"" + event.dateStamp + "\">";
    ret_str += event.actionTime;
    ret_str += "</div>";

    ret_str += "<div class=\"event-actor\">";
    ret_str += "<img class=\"event-actor-avatar\" src=\"" + actorAvatar + "\" title=\"" + event.actor + "\"/>";
    ret_str += "</div>"; //  actor   ]
    if (is_page) {
        var toggleTitle = getTriggerTitle(event.archived == "true");
        ret_str += "<div class=\"event-archive-toggle\">";
        ret_str += "<a class=\"event-archive-toggle-trigger\" data-id=\"" + eventID + "\" title=\"" + toggleTitle + "\">";
        ret_str += "<span class=\"event-archive\"><span class=\"event-archive-toggle-text\">" + archiveTitle + "</span> <i class=\"event-archive-toggle-icon " + archiveClass + "\" ></i></span>";
        ret_str += "<span class=\"event-unarchive\"><span class=\"event-archive-toggle-text\">" + unarchiveTitle + "</span> <i class=\"event-archive-toggle-icon " + unarchiveClass + "\" ></i></span>";
        ret_str += "</a>";
        ret_str += "</div>";
    }
    ret_str += "</div>"; // body ]
    //ret_str += '<div class="event-footer">'; //  [footer
    // ret_str += '<div class="event-time" title="'+event.dateStamp+'"><!--span class="esri-icon esri-icon-time-clock"></span--> '+event.actionTime+'</div>';
    //ret_str += '</div>';// footer]
    ret_str += "</article>";
    ////////////////////////////////////////////////////////////     EVENT ]

    /*if(count >= max_new_notifications) {
     }*/
    return ret_str;
}

function bindTabs() {
    jQuery(".sub-nav-link").on("click", function (event) {
        event.preventDefault();
        var key = jQuery(this).attr("href");
        currTab = key;

        jQuery(".is-active").removeClass("is-active");
        jQuery(this).addClass("is-active");
        jQuery(".notifications-feed-page").fadeOut(250, function () {
            switch (key) {
                case "new":
                    jQuery(".is-new").show();
                    jQuery(".is-archived").hide();
                    if (newCount > 0) jQuery(".mark-all-as-viewed").css("opacity", 1);else jQuery(".mark-all-as-viewed").css("opacity", 0);
                    break;

                case "viewed":
                    jQuery(".is-new").hide();
                    jQuery(".is-archived").show();
                    jQuery(".mark-all-as-viewed").css("opacity", 0);
                    break;

                case "all":
                    jQuery(".is-new").show();
                    jQuery(".is-archived").show();
                    jQuery(".mark-all-as-viewed").css("opacity", 0);
                    break;
            }

            jQuery("#notifications-title").html(headerStrings[key]);
            jQuery(".search-input").attr("placeholder", "Filter " + headerStrings[key]);

            if (newCount == 0 && currTab == "new") {
                jQuery(".congrats-message").show();
            } else {
                jQuery(".congrats-message").hide();
            }

            jQuery(".notifications-feed-page").fadeIn(250);
        });

        jQuery(".unread").removeClass("unread");
    });
}

function bindArchiving() {
    jQuery(".event-archive-toggle-trigger").on("click", function (event) {
        event.preventDefault();
        handleToggleClick(jQuery(this), true);
    });
    jQuery(".event-action-toggle").on("click", function (event) {
        event.preventDefault();
        handleToggleClick(jQuery(this), false);
    });
    jQuery(".mark-all-as-viewed").on("click", function () {
        if (jQuery(".notifications-all").visible()) {
            doCheckAnimation(jQuery(this), jQuery(".notifications-all"), true);
            // multiple checks
            if (newCount > 1) {
                jQuery(this).animate({ waiter: 1 }, 62, function () {
                    doCheckAnimation(jQuery(this), jQuery(".notifications-all"), true);
                });
            }
        }
        jQuery(this).delay(250).animate({ opacity: 0 }, 250);
        jQuery(".is-new").fadeOut("fast", function () {
            jQuery(this).addClass("is-archived");
            jQuery(this).removeClass("is-new");
        });
        newCount = 0;
        jQuery(".congrats-message").delay(500).fadeIn(250);
        updateBadge();
    });
}

function handleToggleClick(elem, is_check_toggle) {
    var id = jQuery(elem).attr("data-id");
    var doAni = false;
    var startElem;
    var targetElem;
    var isArchiving = jQuery("#" + id).hasClass("is-new");

    //
    if (!isArchiving) {
        updateEvent(id, elem, true);
        targetElem = jQuery(".notifications-new");
        isArchiving = false;
        newCount++;
    } else {
        updateEvent(id, elem, false);
        targetElem = jQuery(".notifications-all");
        isArchiving = true;
        newCount--;
    }

    //console.log('tabVisible: ' + tabVisible);

    jQuery("#" + id).find(".event-archive-toggle-trigger").attr("title", getTriggerTitle(isArchiving));
    startElem = jQuery("#" + id).find(".event-archive-toggle-icon:visible");
    updateBadge();

    /*   if(currTab !== 'all') {
       }*/

    if (currTab == "new") {
        jQuery("#" + id).animate({ height: "0px", "padding-top": "0px", "padding-bottom": "0px" }, 250, function () {
            jQuery("#" + id).css({ height: "auto", "padding-top": "10px", "padding-bottom": "5px" });

            jQuery("#" + id).hide();
            if (newCount == 0 && currTab == "new") jQuery(".congrats-message").delay(250).fadeIn(250);else jQuery(".congrats-message").hide();
        });

        if (newCount == 0) jQuery(".mark-all-as-viewed").css("opacity", 0);else jQuery(".mark-all-as-viewed").css("opacity", 1);

        var tabVisible = jQuery(targetElem).visible(false);
        doCheckAnimation(startElem, targetElem, tabVisible);
    }

    /*  if(currTab == 'new') {
      }
    */
}

function getTriggerTitle(isArchiving) {
    return isArchiving ? unarchiveTitle : archiveTitle;
}

function updateBadge() {
    jQuery("#badge-count").html(newCount.toString());
    if (newCount == 0) jQuery("#badge-count").addClass("no-notifications");else jQuery("#badge-count").removeClass("no-notifications");

    if (newCount > 0) jQuery(".notifications").removeClass("empty-notifications");else jQuery(".notifications").addClass("empty-notifications");
}

function updateEvent(id, elem, is_archived) {
    var newTitle = getTriggerTitle(!is_archived);
    jQuery("#" + id).toggleClass("is-archived");
    jQuery("#" + id).toggleClass("is-new");

    jQuery(elem).attr("title", newTitle);
}

function doCheckAnimation(startElem, targetElem, tabVisible) {
    var pos = jQuery(startElem).offset();
    var top = pos.top - 10;
    var left = pos.left;
    var objString;
    var targetPos = jQuery(targetElem).offset();
    var targetTop = targetPos.top;
    var targetLeft = targetPos.left + jQuery(targetElem).width() / 2;

    //if(tabVisible) {
    //jQuery('.check-ani').remove();
    objString = "<div class=\"check-ani\" style=\"top:" + top + "px;left:" + left + "px;\"><span class=\"esri-icon-check-mark\"></span></div>";
    /*} else {
        jQuery('.archived-tooltip').remove();
        objString = '<div class="archived-tooltip" style="top:'+top+'px;left:'+left+'px;"><i class="esri-icon esri-icon-up-arrow hide"></i> <span>Moved to <strong>All</strong></span></div>';
    }*/

    jQuery(".notifications-feed-page").append(objString);
    //if(tabVisible) {
    jQuery(targetElem).addClass("is-ani-target");
    jQuery(".check-ani").animate({ top: targetTop, left: targetLeft }, 600, "easeInOutCubic", function () {
        jQuery(this).remove();
        jQuery(targetElem).removeClass("is-ani-target");
    });
    /*} else*/
    //if(!tabVisible) {
    var h = jQuery(startElem).parent().height();
    console.log("**: " + h);
    jQuery(".archived-tooltip").remove();
    var tipString = "<div class=\"archived-tooltip\" style=\"top:" + top + "px;left:" + left + "px;\"><i class=\"esri-icon esri-icon-up-arrow hide\"></i> <span>Moved to <strong>All</strong></span></div>";
    jQuery(".notifications-feed-page").append(tipString);
    jQuery(".archived-tooltip").animate({ opacity: 1, left: left + 40, top: top }, 250, function () {
        jQuery(this).delay(1000).animate({ opacity: 0 }, function () {
            jQuery(this).remove();
        });
    });
    //}
}

},{}]},{},[1])
//# sourceMappingURL=notifications.js.map
