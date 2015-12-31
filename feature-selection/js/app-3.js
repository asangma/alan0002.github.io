function init() {
  var html;
  var i = 0;
  var topLimit = 400;
  var bottomLimit = topLimit * 2;
  var leftLimit = 500;
  var rightLimit = leftLimit * 2;
  var bgWidth = 1900;
  var bgHeight = 1200;
  while(i < 500) {
    if(i >= 497) {
      topLimit = bgHeight - 100;
      bottomLimit = bgHeight - 50;
      leftLimit = bgWidth - 100;
      rightLimit = bgWidth - 50;
    }
    var left = leftLimit + (bgWidth-rightLimit) * Math.random();
    var top = topLimit + (bgHeight-bottomLimit) *  Math.random();
    var selected = i % 3 == 0 ? 'selected' : ''
    html = '';
    html += '<div class="selection '+selected+'" style="left:'+left+'px;top:'+top+'px;">';
    html += '<div class="dot"></div>';
    html += '<div class="ants ants-h ants-top"></div>';
    html += '<div class="ants ants-h ants-bottom"></div>';
    html += '<div class="ants ants-v ants-left"></div>';
    html += '<div class="ants ants-v ants-right"></div>';
    html += '</div>';
    jQuery('.container').append(html);
    i++;
  }
}