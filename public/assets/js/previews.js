$('.preview').hover(function() {
    handleHover($(this), 'down');
}, function() {
    handleHover($(this), 'up');
});

function handleHover(el, direction) {
    console.log(el);
    var img = $(el).find('img').first();
    var top = $(img).css('top');
    var preview = $(el).height();
    var scroll = $(img).height() - preview;

    console.log(img);

    console.log('scroll', scroll);

    if (direction === 'down') {
        console.log('down');
        $(img).stop(false, false).animate({
            top: -Math.abs(scroll)
        }, 3500, function() {
            console.log('done');
        });
    }
    if (direction === 'up') {
        console.log('up');
        $(img).stop(false, false).animate({
            top: 0
        }, 1000, function() {
            console.log('done');
        });
    }
}
