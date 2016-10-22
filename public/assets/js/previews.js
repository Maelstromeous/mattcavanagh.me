$('.preview').hover(function() {
    handleHover($(this).find('.card-image'), 'down');
}, function() {
    handleHover($(this).find('.card-image'), 'up');
});

function handleHover(el, direction) {
    var img = $(el).find('img').first();
    var top = $(img).css('top');
    var scroll = $(img).height() - $(el).height();
    var progress = $(img).css('top');

    if (direction === 'up') {
        scroll = 0;
    }

    var remaining = scroll + parseInt(progress);

    var pixelsPerSec = 100;
    var time = Math.abs(remaining / 100 * 500);
    var ease = '';

    if (direction === 'up') {
        time = time / 2;
    }

    /*console.log('scroll', scroll);
    console.log('progress', progress);
    console.log('remaining', remaining);*/
    console.log('time', time);

    if (direction === 'down') {
        $(img).stop(false, false).animate({
            top: -Math.abs(scroll)
        }, time, 'easeInOutSine', function() {
        });
    }
    if (direction === 'up') {
        $(img).stop(false, false).animate({
            top: 0
        }, time / 2, 'easeOutSine', function() {
        });
    }
}
