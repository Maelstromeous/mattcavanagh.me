$(document).ready(function() {
    // Init the grids
    $('.card-grid').masonry({
        columnWidth: '.col-sm-6',
        itemSelector: '.col-sm-6',
    });

    doGrid('#all');

    $('.nav li a').on('shown.bs.tab', function() {
        var grid = $(this).attr('href');
        doGrid(grid);
    });

    $('.card.preview').on('click', function() {
        var link = $(this).data('href');
        window.location.replace(link);
    });
});

// Prompts the grids to do a layout just in case anything messed up
function doGrid(selector) {
    $(selector + ' .card-grid').imagesLoaded().done(function() {
        console.log(selector + 'grid');
        $(selector + ' .card-grid').masonry('layout');

        // Hack to do the layout twice, because masonry for some
        // odd reason doesn't do a proper job??
        setTimeout(function() {
            $(selector + ' .card-grid').masonry('layout');
        }, 50);
    });
}
