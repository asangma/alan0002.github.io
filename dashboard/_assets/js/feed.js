(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) {
          return a(o, !0);
        }if (i) {
          return i(o, !0);
        }var f = new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND", f);
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
    "use strict";

    jQuery(document).ready(function () {

      //getData();
      getFeedData();
    });

    function getFeedData() {
      //curr_data = jQuery('#role option:selected').val();
      jQuery.get("_assets/data/feed.json", function (data) {
        jQuery(".feed").animate({ opacity: 1 }, 500, function () {
          jQuery(".feed").empty();
          //populateNotifications(data, '.notifications');
          populateFeed(data, ".feed");
          initActions();
          //activateFeedActions();
        });
      });
    }

    var titleLength = 60;

    function populateFeed(data, elem) {

      jQuery(elem).css("opacity", 0);
      var count = 0;
      var html_str = "";
      jQuery(data).each(function (index, date) {
        var date_str = date.date;
        ////////////////////////////////////////////////////////////    [ DAY
        html_str += "<div class=\"feed-day\">"; // [ feed day
        html_str += "<h6 class=\"feed-day-title\"><span>" + date_str + "</span></h6>";

        ////////////////////////////////////////////////////////////    [ EVENT
        jQuery(date.events).each(function (i, event) {
          if (!event.isNotification) {

            //var oddEven = i % 2 == 0 ? 'even-event' : 'odd-event';
            //var first = i > 0 ? '' : 'first-event';
            var eventID = "feedevent-" + index + "-" + i;
            //var followID = !event.following ? 'none' : event.followID;
            //console.log(date_str);
            var unread = i < 6 && date_str == "Today" ? "unread" : "";

            var eventTitle = event.item.length <= titleLength ? event.item : event.item.substr(0, event.item.indexOf(" ", titleLength)) + "...";
            eventTitle = event.actionType !== "delete" ? "<a href=\"#\">" + eventTitle + "</a>" : eventTitle;

            //var actorAvatar = event.actorImg ? "<img class=\"event-actor-avatar\" src=\"" + event.actorImg + "\"/>" : "<span class=\"event-actor-avatar esri-icon-user\"></span>";
            var actorAvatar = event.actorImg ? event.actorImg : "http://placehold.it/200/595959/ffffff?text=FPO";
            html_str += "<article class=\"esri-event " + unread + "\" id=\"" + eventID + "\" data-ani-count=\"" + count + "\" >";
            html_str += "<div class=\"event-dot\"></div>";

            html_str += "<div class=\"event-meta\">";
            html_str += "<i class=\"event-bullet-" + event.actionType + " esri-icon-" + event.actionType + " event-bullet\"></i>";
            html_str += "</div>";
            html_str += "<div class=\"event-content\">"; // [ content
            html_str += "<h4 class=\"event-title\">" + eventTitle;
            html_str += " <span class=\"event-item-label\">" + event.itemType + "</span>";
            html_str += "</h4>";

            html_str += "<div class=\"event-info\">"; // [ info
            html_str += "<ul class=\"event-list\">"; //   [   actions
            var numActions = event.actions.length;
            var numHiddenActions;
            var maxShowingActions = 2;
            var hiddenClass = "";
            var hiddenTrigger = "";
            if (numActions > maxShowingActions) numHiddenActions = numActions - maxShowingActions;
            jQuery(event.actions).each(function (index, el) {

              if (numActions > maxShowingActions && index >= maxShowingActions) {
                //html_str += '<div id="action_'+ i + '" class="hidden-actions">';
                //numHiddenActions = numActions - index;
                hiddenClass = "hidden-actions action_" + i;
              }

              html_str += "<li class=\"" + hiddenClass + "\">" + el + "</li>";

              if (numActions > maxShowingActions && index + 1 == numActions) {
                hiddenTrigger = "<div class=\"reveal-hidden-actions\"><a href=\"#" + eventID + "\" ><span class=\"show-actions\"><i class=\"esri-icon-down-arrow\"></i> Show " + numHiddenActions + " more</span><span class=\"hide-actions\"><i class=\"esri-icon-up-arrow\"></i> Hide</span></a></div>";
              }
            });
            html_str += "</ul>";
            html_str += hiddenTrigger; //    actions ]
            html_str += "</div>"; // info ]
            html_str += "</div>"; // content ]
            if (event.following) {
              html_str += "<a class=\"event-follow-toggle\" data-following-id=\"" + event.followID + "\"><span class=\"event-following-label\">following</span><span class=\"event-unfollow-label\">unfollow</span></a>";
            }
            //  [time]
            html_str += "<div class=\"event-time\" title=\"" + event.dateStamp + "\">" + event.actionTime + "</div>";
            //if(event.actionType !== 'org') { //  [ actor
            html_str += "<div class=\"event-actor\">";
            html_str += "<img class=\"event-actor-avatar\" src=\"" + actorAvatar + "\"  title=\"" + event.actor + "\"/>";
            html_str += "</div>";
            //} //  actor   ]
            html_str += "<div class=\"event-footer\">"; //  [footer
            //  [time]
            // html_str += "<div class=\"event-time\" title=\"" + event.dateStamp + "\"><!--span class=\"esri-icon esri-icon-time-clock\"></span--> " + event.actionTime + "</div>";

            html_str += "</div>"; // footer]
            html_str += "</article>";
            ////////////////////////////////////////////////////////////     EVENT ]
            count++;
          }
        });
        html_str += "</div>";
      });

      jQuery(elem).html(html_str);

      jQuery(elem).animate({ opacity: 1 }, 500);
    }

    function initActions() {
      jQuery(".show-actions").on("click", function (event) {
        event.preventDefault();
        var parentID = jQuery(this).parent().attr("href");
        console.log(parentID);
        jQuery(parentID).addClass("more-actions-showing");
      });
      jQuery(".hide-actions").on("click", function (event) {
        event.preventDefault();
        var parentID = jQuery(this).parent().attr("href");
        console.log(parentID);
        jQuery(parentID).removeClass("more-actions-showing");
      });

      jQuery(".event-follow-toggle").hover(function (event) {
        jQuery(this).addClass("hovered");
      }, function (event) {
        jQuery(this).removeClass("hovered");
      });
    }
  }, {}] }, {}, [1]);


},{}]},{},[1])
//# sourceMappingURL=feed.js.map
