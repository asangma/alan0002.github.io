var curr_data;
jQuery(document).ready(function($) {

    getData();
});

function getData() {
    curr_data = jQuery('#role option:selected').val();
    jQuery.get('data/'+curr_data+'.json',
    function(data) {
        jQuery('#feed').fadeOut(500, function(){
            jQuery('#feed').empty();
            populateFeed(data);
            activateFeedActions();
        });
        
        
        activateControls();
    });
}

function populateFeed(data) {
    var html_str = '';//curr_data;
    jQuery(data).each(function(index, date) {
        var date_str = date.date;
        var dateClass = date_str.toLowerCase() !== 'today' ? '' : 'today';
        ////////////////////////////////////////////////////////////    [ DAY
        html_str += '<div class="feed-day">'; // [ feed day
        html_str += '<h4 class="'+ dateClass +'"><span>' + date_str + '</span></h4>';

        ////////////////////////////////////////////////////////////    [ EVENT
        jQuery(date.events).each(function(i, event) {
            var typeClass;// = 'esri-icon-';
            var typeAction;
            var actionsDesc;
            var oddEven = i % 2 == 0 ? 'even-event' : 'odd-event';
            var first = i > 0 ? '' : 'first-event';
            var eventID = 'event-' + index +'-'+ i;
            //var followID = !event.following ? 'none' : event.followID;

            switch (event.actionType) {
                case 'addition':
                    typeClass = 'add';
                    break;
                case 'notification':
                    typeClass = 'notification';
                    break;
                case 'deprecation':
                    typeClass = 'notification';
                    break;
                case 'edit':
                    typeClass = 'edit';
                    break;
                case 'share':
                    typeClass = 'share';
                    break;
            }
            html_str += '<div class="feed-event '+oddEven+' '+ first +' '+ typeClass+'" id="'+ eventID +'" >'; //  [ feed event

                html_str += '<div class="event-icon-wrap '+ typeClass +'">'; // [  icon
                    //html_str += '<i class="event-bullet-' + typeClass + ' event-bullet"></i>';
                html_str += '</div>';   //  icon  ]
                html_str += '<div class="event-content-wrap">'; //  [ content
                    html_str += '<div class="event-meta clearfix">'; // [ meta
                        html_str += '<div class="item-thumb"><img src="' + event.itemThumb + '"/></div>';

                        html_str += '<div class="item-title">';
                            html_str += '<a class="event-item" hre="#">' + event.item + '</a>';
                        html_str += '</div>';
                            if(event.followID) {
                                var show_str = (event.following) ? 'Following' : 'Don\'t show me this.';
                                var unshow_str = (event.following) ? 'Unfollow' : 'Don\'t show me this.';
                                var show_class = (event.following) ? 'unfollow' : 'dont-show';

                                html_str += '<div class="event-following '+ show_class +'" data-follow-id="'+ event.followID +'">';
                                    html_str += ' <span class="following">'+ show_str +'</span>';
                                    html_str += ' <span class="unfollow">'+ unshow_str +'</span>';
                                    html_str += ' <span class="unfollow-undo">Undo</span>';
                                html_str += '</div>';
                            }
                    html_str += '</div>'; // meta ]
                    html_str += '<div class="event-info">'; //  [ info
                        html_str += '<div class="event-actor">'; //  [ actor
                            html_str += '<img class="event-actor-avatar" src="' + event.actorImg + '"/> <a href="#">' + event.actor + '</a>';
                        html_str += '</div>';   //  actor   ]
                        html_str += '<div class="event-description">'; //   [   desc
                            html_str += '<ul>';
                                var numActions = event.actions.length;
                                var numHiddenActions;
                                var maxShowingActions = 3;
                                jQuery(event.actions).each(function(index, el) {
                                    if(numActions > maxShowingActions && index == maxShowingActions) {
                                        html_str += '<div id="action_'+ i + '" class="hidden-actions">';
                                        numHiddenActions = numActions - index;
                                    }

                                    html_str += '<li>'+ el + '</li>';

                                    if(numActions > maxShowingActions && (index+1) == numActions) {
                                        html_str += '</div>';
                                        html_str += '<li><a href="javascript:;" class="reveal-hidden-actions" data-hidden-actions="action_'+ i +'"><span class="show-actions"><i class="esri-icon-down-arrow"></i> Show '+ numHiddenActions +' more</span><span class="hide-actions"><i class="esri-icon-up-arrow"></i> Hide</span></a></li>';
                                    }
                                });
                            html_str += '</ul>';
                        html_str += '</div>'; //    desc ]
                        if (event.actionType == 'deprecation' || event.actionType == 'notification') {
                            html_str += '<div class="event-expiration">'; //    [ expiration
                                html_str += '<div class="event-expiration-title">' + event.message + '</div>';
                                if(event.actionType == 'deprecation') html_str += '<div class="event-expiration-note"><a href="#">View affected items.</a></div>'
                            html_str += '</div>'; //    expiration ]
                        }
                        html_str += '<div class="event-time"><i class="fa fa-clock-o"></i> ' + event.actionTime + '</div>';    //  [ time ]
                    html_str += '</div>'; //    info ]
                html_str += '</div>'; //    content ]
            html_str += '</div>'; //    feed event ]
            ////////////////////////////////////////////////////////////    EVENT ]
        });
        html_str += '</div>'; // feed day ]
        ////////////////////////////////////////////////////////////    DAY ]
    });
    jQuery('#feed').html(html_str);
    jQuery('#feed').fadeIn(500);
}



function activateFeedActions() {
    jQuery('.reveal-hidden-actions').on('click', function(even){
        var hiddenActions = jQuery('#'+ jQuery(this).attr('data-hidden-actions'));
        hiddenActions.toggleClass('reveal');
        jQuery(this).toggleClass('showing');
    });

    jQuery('.event-following').hover(function() {
        jQuery(this).addClass('hovered');
        // jQuery(this).children('.unfollow').show();
        // jQuery(this).children('.following').hide();
    }, function() {
        jQuery(this).removeClass('hovered');
        // jQuery(this).children('.unfollow').hide();
        // jQuery(this).children('.following').show();
    });

    jQuery('.unfollow').on('click', function(event){
        var _this = jQuery(this);
        jQuery('.event-following').each(function(index, el) {
            if(jQuery(el).attr('data-follow-id') == jQuery(_this).parent().attr('data-follow-id')) {
                jQuery(el).addClass('unfollowed');
            }
        });
    });
    jQuery('.unfollow-undo').on('click', function(event){
        var _this = jQuery(this);
        jQuery('.event-following').each(function(index, el) {
            if(jQuery(el).attr('data-follow-id') == jQuery(_this).parent().attr('data-follow-id')) {
                jQuery(el).removeClass('unfollowed');
            }
        });
    });

    jQuery('.feed-event').hover(function(){
        jQuery(this).addClass('hovered');
    }, function(){
        jQuery(this).removeClass('hovered');
    });
}