var
currFilter,
filterHtml,
templateHtml,
templates_obj,
template_count,
timer,
numTemplates,
maxTemplates,
currTemplate;

jQuery(document).ready(function() {

    maxTemplates = 6;
    jQuery('#templates').css('opacity', '0');
    getData();

});

function getData() {
    jQuery.get('data/templates-02.json', function(data, status, xhr) {
        templates_obj = data;
        templateHtml = '';


        popuplateFilters();
        numTemplates = 0;
        template_count = 0;

        filterTemplates('all');
        setControls();
    }).fail(function(error){
    });
}

function popuplateFilters() {
    filterHtml = '';
    jQuery(templates_obj).each(function(i, category){
        var active = (i > 0) ? '' : 'active';
        var allID = (i > 0) ? '' : 'all-filter';
        var href = (i > 0) ? category.id : 'all';
        var title = (i > 0) ? category.title : 'All';
        filterHtml += '<li class="'+ active +'" id="'+allID+'"><a class="filter" href="'+ href +'">'+ title +'</a></li>';
    });
    jQuery('#filters').html(filterHtml);
}


function filterTemplates(filter, is_all) {
    if(filter !== 'all') {
        jQuery(templates_obj).each(function(index, category){
            if(category.id == filter) {
                if(!is_all) {
                    //templateHtml += '<h3>'+ category.title +'</h3>';
                    // jQuery('#category-title').html(category.title);
                    templateHtml += '<p>'+ category.desc +'</p>';
                }
            if(numTemplates >= maxTemplates) return false;
                addTemplates(category);
            }
        });

    } else {
        templateHtml = '<p></p>';
        jQuery(templates_obj).each(function(index, category){
            if(category.id !== 'all') filterTemplates(category.id, true);
        });
    }

    jQuery('#templates').html(templateHtml);

    addTemplateListener();
    //  TODO
    // add loader
    clearTimeout(timer);
    if(!jQuery('#loader-wrap').length) jQuery('.template-holder').append('<div id="loader-wrap"><img src="images/LoadingIndicator_blue.gif"></div>');
    timer = setTimeout(function(){
        jQuery('#loader-wrap').remove();
        jQuery('.tab-content').scrollTop(0);
        jQuery('#templates').animate({opacity:1},'fast');
    }, 1500);
}

function addTemplates(category) {

    jQuery(category.templates).each(function(i, template){
        if(template_count == 0) templateHtml += '<div class="row">';
        templateHtml += '<div class="col-xs-4 template">';
            templateHtml += '<div class="thumbnail"><img src="'+ template.thumb +'" /></div>';
            templateHtml += '<h4>'+ template.title +'</h4>';
            templateHtml += '<div class="template-info">';
                templateHtml += '<p>'+ template.desc +'</p>';
            templateHtml += '</div>';
        templateHtml += '</div>';

        template_count++;
        if(template_count == 3) {
            templateHtml += '</div>';
            template_count = 0;
        }

        numTemplates++;
        //console.log(numTemplates +' : '+ maxTemplates);
        //console.log('numTemplates >= maxTemplates: ' + (numTemplates >= maxTemplates))
        if(numTemplates >= maxTemplates) return false;
    });
}



function setControls() {
    jQuery('.filter').on('click', function(event) {
        event.preventDefault();
        jQuery('.tabs-left .active').removeClass('active');
        jQuery(this).parent().addClass('active');
        jQuery('.modal-wrapper').removeClass('showing');

        templateHtml = '';
        template_count = 0;
        numTemplates = 0;
        var filter = jQuery(this).attr('href');
        jQuery('#templates').animate({opacity:0},'fast', function(){
            filterTemplates(filter);
        });
    });
    addTemplateListener();
    addOptionsListeners();
}

function addTemplateListener() {
    ////////////////////
    //  HOVER
    jQuery('.template').hover(function() {
        // OVER
        if(jQuery('#template-overlay').length) jQuery('#template-overlay').remove();
        if(!jQuery(this).hasClass('selected')) {
            var width = jQuery(this).children('.thumbnail').width()+2;
            var height = jQuery(this).children('.thumbnail').height()+2;
            jQuery(this).children('.thumbnail').append('<div id="template-overlay" style="width:'+width+'px; height:'+height+'px; line-height:'+height+'px"><span style="line-height:'+height+'px;">Select to see details.</span></div>');
        }

    }, function() {
        //  OUT
        jQuery('#template-overlay').remove();
    });

    ////////////////////
    //  CLICK
    jQuery('.template').on('click', function(event) {
        jQuery('#template-overlay').remove();
        currTemplate = jQuery(this);
        jQuery(this).addClass('selected');

        //var infoHtml = '<h3></h3>'

        //jQuery('.tab-content').css('overflow-y', 'hidden');
        jQuery('.template-info-showing').html(jQuery(this).html());
        jQuery('.modal-wrapper').addClass('showing');

        jQuery('#close-panel').on('click', function(event){
            jQuery('#close-panel').off('click');
            currTemplate.removeClass('selected');
            jQuery('.modal-wrapper').removeClass('showing');
        });
    });
    jQuery('#template-info-bg').on('click',function(event){
            currTemplate.removeClass('selected');
            jQuery('.modal-wrapper').removeClass('showing');
    });

}

function addOptionsListeners() {
    jQuery('.options-trigger').on('click', function(event){
        jQuery('.options-wrap').addClass('open');
    });

    jQuery('.options-wrap').hover(function(){},function(){
        jQuery('.options-wrap').removeClass('open');
    });

    jQuery('.toggle-pagination').on('click', function(event){
        event.preventDefault();
        jQuery('#templates').css('opacity', '0');
        jQuery('.modal-wrapper').toggleClass('no-scroll');
        jQuery('.modal-wrapper').removeClass('showing');

        if(jQuery('.template-holder').hasClass('no-scroll')) {
            maxTemplates = 6;
        } else {
            maxTemplates = 1000;

        }


        templateHtml = '';
        template_count = 0;
        numTemplates = 0;
        jQuery('.tabs-left .active').removeClass('active');
        jQuery('#all-filter').addClass('active');
        //jQ()

        filterTemplates('all');
    });
}